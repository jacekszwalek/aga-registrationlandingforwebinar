<?php
/**
 * API skracacza dla generatora UTM (/utmgen/): status, logowanie, skracanie, lista i usuwanie krótkich linków.
 * To samo hasło i ciasteczko co panel licznika (api/_auth.php). Tylko z naszej domeny (Origin).
 */
declare(strict_types=1);
require __DIR__ . '/../api/_auth.php';
require __DIR__ . '/../api/_links.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function out(int $code, array $body): void
{
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    out(200, ['ok' => true, 'loggedIn' => pzz_logged_in()]);
}
if ($method !== 'POST') out(405, ['ok' => false, 'error' => 'Metoda niedozwolona.']);

$allowed = array_map(static fn ($h) => 'https://' . $h, PZZ_SITE_HOSTS);
if (getenv('PZZ_TEST_ORIGIN')) $allowed[] = getenv('PZZ_TEST_ORIGIN');
if (!in_array($_SERVER['HTTP_ORIGIN'] ?? '', $allowed, true)) out(403, ['ok' => false, 'error' => 'Niedozwolone źródło żądania.']);

$in = json_decode((string) file_get_contents('php://input', false, null, 0, 8192), true);
if (!is_array($in)) out(400, ['ok' => false, 'error' => 'Niepoprawne dane.']);

switch ($in['action'] ?? '') {
    case 'login':
        $res = pzz_login((string) ($in['password'] ?? ''));
        if ($res === true) out(200, ['ok' => true, 'loggedIn' => true]);
        out($res === 'limit' ? 429 : 401, ['ok' => false, 'error' => $res === 'limit' ? 'Za dużo prób. Spróbuj za 15 minut.' : 'Nieprawidłowe hasło.']);
    case 'shorten':
        if (!pzz_logged_in()) out(401, ['ok' => false, 'error' => 'Zaloguj się.', 'login' => true]);
        try {
            out(200, ['ok' => true] + pzz_link_create((string) ($in['url'] ?? ''), (string) ($in['code'] ?? '')));
        } catch (InvalidArgumentException $e) {
            out(422, ['ok' => false, 'error' => $e->getMessage()]);
        } catch (Throwable $e) {
            error_log('pzz shorten: ' . $e->getMessage());
            out(500, ['ok' => false, 'error' => 'Nie udało się zapisać linku. Spróbuj ponownie.']);
        }
    case 'list':
        if (!pzz_logged_in()) out(401, ['ok' => false, 'error' => 'Zaloguj się.', 'login' => true]);
        $now = time();
        $list = [];
        foreach (pzz_links_load() as $code => $l) {
            $code = (string) $code;
            $list[] = [
                'code' => $code,
                'short' => pzz_short_url($code, $l['prefix']),
                'url' => $l['url'],
                'utm' => pzz_link_utm($l['url']),
                'created' => (int) $l['created'],
                'clicks' => (int) ($l['clicks'] ?? 0),
                'last' => $l['last'] ? (int) $l['last'] : null,
                'idle' => pzz_link_idle_days($l, $now),
                'state' => pzz_link_state($l, $now),
                'needsRootRule' => !str_starts_with($l['prefix'], '/webinar/'),
            ];
        }
        // Najdłużej nieklikane na górze.
        usort($list, static fn ($a, $b) => $b['idle'] <=> $a['idle'] ?: $b['created'] <=> $a['created']);
        out(200, ['ok' => true, 'links' => $list, 'sleepDays' => PZZ_SLEEP_DAYS, 'archiveDays' => PZZ_ARCHIVE_DAYS]);
    case 'delete':
        if (!pzz_logged_in()) out(401, ['ok' => false, 'error' => 'Zaloguj się.', 'login' => true]);
        $del = strtolower(preg_replace('/[^A-Za-z0-9-]/', '', (string) ($in['code'] ?? '')));
        $ok = pzz_links_update(static function (array &$links) use ($del) {
            if (!isset($links[$del]) || (int) ($links[$del]['clicks'] ?? 0) > 0) return false;
            unset($links[$del]);
            return true;
        });
        if ($ok) out(200, ['ok' => true]);
        out(409, ['ok' => false, 'error' => 'Nie usunięto: link ma już kliknięcia albo nie istnieje.']);
    default:
        out(400, ['ok' => false, 'error' => 'Nieznana akcja.']);
}
