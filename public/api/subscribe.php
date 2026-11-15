<?php
/**
 * Zapis na webinar przez API MailerLite (tryb form.mode = 'api').
 *
 * Każdy zapis trafia do grup: wydarzenia (rejestracja albo – po webinarze – nagranie),
 * „Uczestnicy wydarzeń”, „Interakcja RRRR” (szukana/tworzona automatycznie), rodzaju wydarzenia („Webinar”);
 * „Zgoda marketingowa” – wyłącznie po zaznaczeniu checkboxa.
 * Pole „Pierwsze wydarzenie” ustawiane tylko kontaktom nowym w bazie (u istniejących nie jest nadpisywane).
 * Bez maila potwierdzającego (double opt-in wyłączony – decyzja 15.11.2026); zapisujemy datę i IP zapisu.
 *
 * Klucz API: zmienna MAILERLITE_API_KEY albo plik ~/integrations-keys/.mailerlite-api-key (katalog domowy, poza public_html).
 * Nigdy w repozytorium. Konfiguracja grup: api/event.json (generowany z src/config/event.config.ts).
 */
declare(strict_types=1);

const ML_API = 'https://connect.mailerlite.com/api';
const RATE_LIMIT = 6;          // zapisów…
const RATE_WINDOW = 600;       // …na 10 minut z jednego IP
// Wypisany/niepotwierdzony kontakt, który sam ponownie zapisuje się na wydarzenie, wraca jako aktywny
// (inaczej nie dostałby linku). Marketing i tak wyłącznie do grupy „Zgoda marketingowa”.
const RESUBSCRIBE_ON_SIGNUP = true;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function respond(int $code, array $body): void
{
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function api_key(): string
{
    $key = trim((string) getenv('MAILERLITE_API_KEY'));
    if ($key !== '') {
        return $key;
    }
    // Katalog domowy konta = 3 poziomy nad public_html/webinar/api (poza public_html – niedostępny z WWW).
    $home = dirname(__DIR__, 3);
    $candidates = array_filter([
        getenv('MAILERLITE_API_KEY_FILE') ?: null,
        $home . '/integrations-keys/.mailerlite-api-key', // ustawione 15.11.2026 (cPanel: /integrations-keys/)
        $home . '/.mailerlite-api-key',
    ]);
    foreach ($candidates as $file) {
        if (is_readable($file)) {
            return trim((string) file_get_contents($file));
        }
    }
    return '';
}

/** Wywołanie API MailerLite. Zwraca [kod HTTP, odpowiedź jako tablica]. */
function ml(string $method, string $path, ?array $body = null): array
{
    $ch = curl_init(ML_API . $path);
    $headers = ['Accept: application/json', 'Authorization: Bearer ' . api_key()];
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE));
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
    ]);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = is_string($raw) ? json_decode($raw, true) : null;
    return [$code, is_array($data) ? $data : []];
}

function client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '');
}

/** Prosty limit zapisów z jednego IP (plik w katalogu tymczasowym, bez danych osobowych – tylko skrót IP). */
function rate_limited(): bool
{
    $file = sys_get_temp_dir() . '/pzz-rl-' . sha1(client_ip() . '|pzz');
    $now = time();
    $hits = [];
    if (is_readable($file)) {
        $hits = array_filter(array_map('intval', explode(',', (string) file_get_contents($file))), fn ($t) => $t > $now - RATE_WINDOW);
    }
    if (count($hits) >= RATE_LIMIT) {
        return true;
    }
    $hits[] = $now;
    @file_put_contents($file, implode(',', $hits), LOCK_EX);
    return false;
}

/** ID grupy o dokładnie tej nazwie; jeśli nie ma – tworzy ją. Wynik trzymany w cache (plik tymczasowy). */
function group_id_by_name(string $name): ?string
{
    $cache = sys_get_temp_dir() . '/pzz-ml-group-' . sha1($name);
    if (is_readable($cache)) {
        $id = trim((string) file_get_contents($cache));
        if ($id !== '') {
            return $id;
        }
    }
    [$code, $data] = ml('GET', '/groups?limit=100&filter%5Bname%5D=' . rawurlencode($name));
    $id = null;
    if ($code === 200) {
        foreach ($data['data'] ?? [] as $g) {
            if (($g['name'] ?? '') === $name) {
                $id = (string) $g['id'];
                break;
            }
        }
    }
    if ($id === null) {
        [$code, $data] = ml('POST', '/groups', ['name' => $name]);
        $id = isset($data['data']['id']) ? (string) $data['data']['id'] : null;
    }
    if ($id !== null) {
        @file_put_contents($cache, $id, LOCK_EX);
    }
    return $id;
}

// ---------- Żądanie ----------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'method']);
}

$config = json_decode((string) @file_get_contents(__DIR__ . '/event.json'), true);
if (!is_array($config) || empty($config['groups'])) {
    error_log('pzz subscribe: brak api/event.json');
    respond(500, ['ok' => false, 'error' => 'config']);
}

// Tylko z naszej strony (przeglądarka zawsze wysyła Origin przy fetch POST).
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$allowed = $config['allowedOrigins'];
if (getenv('PZZ_TEST_ORIGIN')) {
    $allowed[] = (string) getenv('PZZ_TEST_ORIGIN'); // tylko testy lokalne (zmienna środowiskowa, nie parametr żądania)
}
if ($origin === '' || !in_array($origin, $allowed, true)) {
    respond(403, ['ok' => false, 'error' => 'origin']);
}

if (api_key() === '') {
    error_log('pzz subscribe: brak klucza MailerLite (MAILERLITE_API_KEY lub ~/integrations-keys/.mailerlite-api-key)');
    respond(503, ['ok' => false, 'error' => 'not_configured']);
}

$raw = (string) file_get_contents('php://input', false, null, 0, 10000);
$in = json_decode($raw, true);
if (!is_array($in)) {
    respond(400, ['ok' => false, 'error' => 'json']);
}

// Honeypot: bot wypełnił ukryte pole – udajemy sukces, nic nie zapisujemy.
if (trim((string) ($in['website'] ?? '')) !== '') {
    respond(200, ['ok' => true]);
}

$email = strtolower(trim((string) ($in['email'] ?? '')));
$name = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string) ($in['name'] ?? '')) ?? '');
$newsletter = ($in['newsletter'] ?? false) === true;
$source = substr(trim(preg_replace('/[\x00-\x1F\x7F]+/u', '', (string) ($in['webinar_source'] ?? '')) ?? ''), 0, 255);

if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'email']);
}
if ($name === '' || mb_strlen($name) > 100) {
    respond(422, ['ok' => false, 'error' => 'name']);
}
if (rate_limited()) {
    respond(429, ['ok' => false, 'error' => 'rate']);
}

// Stan liczony na serwerze: po końcu ostatniej sesji zapis dotyczy nagrania.
$nowMs = getenv('PZZ_TEST_NOW_MS') ? (int) getenv('PZZ_TEST_NOW_MS') : (int) round(microtime(true) * 1000); // nadpisanie czasu: tylko testy lokalne
$lastEnd = max(array_map(fn ($s) => (int) $s['end'], $config['sessions']));
$after = $nowMs >= $lastEnd;

$g = $config['groups'];
$year = (new DateTimeImmutable('now', new DateTimeZone('Europe/Warsaw')))->format('Y');
$groups = [$after ? $g['recording'] : $g['registration'], $g['participants'], $g['eventType']];
$interaction = group_id_by_name($config['interactionGroupPrefix'] . $year);
if ($interaction !== null) {
    $groups[] = $interaction;
}
if ($newsletter) {
    $groups[] = $g['consent'];
}

// Czy kontakt już jest w bazie? (404 = nowy)
[$code, $existing] = ml('GET', '/subscribers/' . rawurlencode($email));
if ($code !== 200 && $code !== 404) {
    error_log("pzz subscribe: MailerLite GET {$code}");
    respond(502, ['ok' => false, 'error' => 'upstream']);
}
$isNew = $code === 404;

$fields = ['name' => $name];
if ($source !== '') {
    $fields['webinar_source'] = $source;
}
if ($isNew) {
    $fields[$config['firstEventField']] = $config['eventName'];
}

$nowUtc = gmdate('Y-m-d H:i:s');
$body = [
    'email' => $email,
    'fields' => $fields,
    'groups' => array_values(array_unique($groups)),
    'opted_in_at' => $nowUtc,
    'optin_ip' => client_ip(),
];
if ($isNew) {
    $body['status'] = 'active';
    $body['subscribed_at'] = $nowUtc;
    $body['ip_address'] = client_ip();
} else {
    $status = (string) ($existing['data']['status'] ?? '');
    // Ponowny, świadomy zapis na wydarzenie: niepotwierdzony lub wypisany kontakt wraca jako aktywny,
    // żeby dostał maile o tym wydarzeniu. Marketing nadal tylko z grupą „Zgoda marketingowa”.
    if (RESUBSCRIBE_ON_SIGNUP && ($status === 'unconfirmed' || $status === 'unsubscribed')) {
        $body['status'] = 'active';
        $body['resubscribe'] = true;
    }
}

[$code, $res] = ml('POST', '/subscribers', $body);
if ($code !== 200 && $code !== 201) {
    error_log("pzz subscribe: MailerLite POST {$code} " . json_encode($res['errors'] ?? $res['message'] ?? ''));
    respond(502, ['ok' => false, 'error' => 'upstream']);
}

respond(200, ['ok' => true]);
