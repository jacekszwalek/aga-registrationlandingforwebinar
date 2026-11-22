<?php
/**
 * Skracacz linków: zapis w ~/utm-links/links.json (poza public_html; katalog z PZZ_LINKS_DIR w testach).
 * Krótki link = ścieżka strony docelowej + l/kod, np. https://przystanzmianyzawodowej.pl/webinar/l/k3x9.
 * Linki do innych domen: https://przystanzmianyzawodowej.pl/l/kod. Opis: docs/skracacz.md.
 */
declare(strict_types=1);

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

const PZZ_SITE = 'https://przystanzmianyzawodowej.pl';
const PZZ_SITE_HOSTS = ['przystanzmianyzawodowej.pl', 'www.przystanzmianyzawodowej.pl'];
/** Bez znaków, które łatwo pomylić (0/o, 1/l/i). */
const PZZ_CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const PZZ_SLEEP_DAYS = 30;
const PZZ_ARCHIVE_DAYS = 180;
const PZZ_RESERVED_CODES = ['api', 'index', 'admin', 'licznik', 'linki', 'webinar', 'utmgen'];

function pzz_links_dir(): string
{
    $env = getenv('PZZ_LINKS_DIR');
    return $env ? rtrim($env, '/') : dirname(__DIR__, 3) . '/utm-links';
}

function pzz_links_load(): array
{
    $file = pzz_links_dir() . '/links.json';
    if (!is_file($file)) return [];
    $h = @fopen($file, 'rb');
    if (!$h) return [];
    flock($h, LOCK_SH);
    $data = json_decode((string) stream_get_contents($h), true);
    flock($h, LOCK_UN);
    fclose($h);
    return is_array($data) ? $data : [];
}

/** Zmiana zbioru linków pod wyłączną blokadą; zapis atomowy (plik tymczasowy + rename). */
function pzz_links_update(callable $fn): mixed
{
    $dir = pzz_links_dir();
    if (!is_dir($dir) && !@mkdir($dir, 0700, true)) throw new RuntimeException('Brak katalogu na linki');
    $lock = fopen($dir . '/.lock', 'c');
    flock($lock, LOCK_EX);
    try {
        $links = pzz_links_load();
        $result = $fn($links);
        $tmp = $dir . '/links.json.' . bin2hex(random_bytes(4));
        file_put_contents($tmp, json_encode($links, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        rename($tmp, $dir . '/links.json');
        return $result;
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

/** Ścieżka przed „l/”: katalog ścieżki strony docelowej na naszej domenie, inaczej „/”. */
function pzz_link_prefix(string $url): string
{
    $u = parse_url($url);
    if (!in_array(strtolower($u['host'] ?? ''), PZZ_SITE_HOSTS, true)) return '/';
    $path = $u['path'] ?? '/';
    $dir = str_ends_with($path, '/') ? $path : (dirname($path) === '/' ? '/' : dirname($path) . '/');
    return pzz_clean_prefix($dir);
}

/** Bezpieczna ścieżka: tylko [A-Za-z0-9/_.-], bez „..”, bez podwójnych „/”, z „/” na początku i końcu. */
function pzz_clean_prefix(string $p): string
{
    $p = preg_replace('#[^A-Za-z0-9/_.-]#', '', $p);
    $parts = array_filter(explode('/', $p), static fn ($x) => $x !== '' && $x !== '.' && $x !== '..');
    return '/' . ($parts ? implode('/', $parts) . '/' : '');
}

function pzz_short_url(string $code, string $prefix): string
{
    return PZZ_SITE . $prefix . 'l/' . $code;
}

function pzz_valid_code(string $c): bool
{
    return (bool) preg_match('/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/', $c) && strlen($c) >= 3 && !in_array($c, PZZ_RESERVED_CODES, true);
}

function pzz_random_code(array $links): string
{
    for ($len = 4; ; $len++) {
        for ($i = 0; $i < 40; $i++) {
            $c = '';
            for ($j = 0; $j < $len; $j++) $c .= PZZ_CODE_ALPHABET[random_int(0, strlen(PZZ_CODE_ALPHABET) - 1)];
            if (!isset($links[$c]) && pzz_valid_code($c)) return $c;
        }
    }
}

/** active – kliknięty (lub utworzony) w ostatnich 30 dniach; sleeping – 30–180 dni; archived – 180+ dni bez kliknięcia. */
function pzz_link_state(array $l, int $now): string
{
    $days = pzz_link_idle_days($l, $now);
    return $days >= PZZ_ARCHIVE_DAYS ? 'archived' : ($days >= PZZ_SLEEP_DAYS ? 'sleeping' : 'active');
}

function pzz_link_idle_days(array $l, int $now): int
{
    $last = max((int) ($l['created'] ?? 0), (int) ($l['last'] ?? 0));
    return intdiv(max(0, $now - $last), 86400);
}

/** UTM-y z adresu (do opisu w panelu). */
function pzz_link_utm(string $url): array
{
    parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
    $out = [];
    foreach (['source', 'medium', 'campaign', 'content', 'term'] as $k) {
        if (isset($q['utm_' . $k]) && is_string($q['utm_' . $k])) $out[$k] = $q['utm_' . $k];
    }
    return $out;
}

function pzz_is_bot_ua(string $ua): bool
{
    return $ua === '' || (bool) preg_match('/bot|crawl|spider|facebookexternalhit|facebot|linkedin|whatsapp|telegram|slack|discord|preview|skype|headless|curl|wget|python/i', $ua);
}

/**
 * Tworzy (albo zwraca istniejący) krótki link. Wyjątek InvalidArgumentException z komunikatem dla użytkownika.
 * @return array{code:string, short:string, existing:bool, needsRootRule:bool}
 */
function pzz_link_create(string $url, string $code = ''): array
{
    $url = trim($url);
    $u = parse_url($url);
    if (!$u || !in_array(strtolower($u['scheme'] ?? ''), ['http', 'https'], true) || empty($u['host']) || strlen($url) > 2000) {
        throw new InvalidArgumentException('To nie jest poprawny adres strony.');
    }
    $code = strtolower(trim($code));
    if ($code !== '' && !pzz_valid_code($code)) {
        throw new InvalidArgumentException('Kod: 3–40 znaków, małe litery, cyfry i „-” (nie na początku ani końcu).');
    }
    $prefix = pzz_link_prefix($url);
    return pzz_links_update(static function (array &$links) use ($url, $code, $prefix) {
        // Ten sam adres = ten sam krótki link (chyba że prosisz o konkretny nowy kod).
        foreach ($links as $c => $l) {
            if (($l['url'] ?? '') === $url && ($code === '' || $code === (string) $c)) {
                return ['code' => (string) $c, 'short' => pzz_short_url((string) $c, $l['prefix']), 'existing' => true, 'needsRootRule' => !str_starts_with($l['prefix'], '/webinar/')];
            }
        }
        if ($code !== '' && isset($links[$code])) throw new InvalidArgumentException('Ten kod jest już zajęty – wybierz inny.');
        $code = $code !== '' ? $code : pzz_random_code($links);
        $links[$code] = ['url' => $url, 'prefix' => $prefix, 'created' => time(), 'clicks' => 0, 'last' => null];
        return ['code' => $code, 'short' => pzz_short_url($code, $prefix), 'existing' => false, 'needsRootRule' => !str_starts_with($prefix, '/webinar/')];
    });
}

/** Rozwiązanie krótkiego linku: adres docelowy albo null (nieznany kod lub ścieżka nie pasuje). */
function pzz_link_resolve(array $links, string $code, string $prefix): ?string
{
    $l = $links[strtolower($code)] ?? null;
    return $l && ($l['prefix'] ?? '') === pzz_clean_prefix($prefix) ? (string) $l['url'] : null;
}
