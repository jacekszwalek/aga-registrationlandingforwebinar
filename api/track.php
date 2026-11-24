<?php
/**
 * Licznik etapów bez cookies: przyjmuje zdarzenia ze strony (navigator.sendBeacon, src/scripts/funnel.ts)
 * i dopisuje je do ~/webinar-stats/events.jsonl. Bez IP, e-maili i imion. Panel: licznik/.
 */
declare(strict_types=1);
require __DIR__ . '/_stats.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

const EVENTS = [
    'page_view', 'page_preload', 'engaged', 'stay_3s', 'stay_10s', 'stay_30s', 'scroll_50', 'scroll_90', 'sticky_cta_click', 'form_open', 'form_start',
    'form_submit_attempt', 'form_error', 'signup', 'generate_lead', 'newsletter_signup',
    'add_to_calendar', 'consultation_click', 'logo_click', 'share_click',
];

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit;
}

// Tylko z naszej strony: Origin (albo Referer, gdy przeglądarka nie wysłała Origin).
$config = json_decode((string) @file_get_contents(__DIR__ . '/event.json'), true);
$allowed = is_array($config['allowedOrigins'] ?? null) ? $config['allowedOrigins'] : [];
if (getenv('PZZ_TEST_ORIGIN')) $allowed[] = getenv('PZZ_TEST_ORIGIN');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === '' && !empty($_SERVER['HTTP_REFERER'])) {
    $u = parse_url($_SERVER['HTTP_REFERER']);
    $origin = isset($u['scheme'], $u['host']) ? $u['scheme'] . '://' . $u['host'] . (isset($u['port']) ? ':' . $u['port'] : '') : '';
}
if (!in_array($origin, $allowed, true)) {
    http_response_code(403);
    exit;
}

// Boty z JavaScriptem (podglądy linków, crawlery) nie są ludźmi.
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if ($ua === '' || preg_match('/bot|crawl|spider|facebookexternalhit|headless|lighthouse|preview/i', $ua)) {
    http_response_code(204);
    exit;
}

if (pzz_rate_limited('track', 300, 600)) {
    http_response_code(429);
    exit;
}

$raw = (string) file_get_contents('php://input', false, null, 0, 2048);
$in = json_decode($raw, true);
if (!is_array($in) || !in_array($in['e'] ?? '', EVENTS, true)) {
    http_response_code(422);
    exit;
}

$clean = static function ($v, int $max = 60): ?string {
    $s = substr(preg_replace('/[^a-z0-9_.-]/', '', strtolower((string) $v)), 0, $max);
    return $s === '' ? null : $s;
};
$pick = static fn ($v, array $ok, string $def) => in_array($v, $ok, true) ? $v : $def;

$row = array_filter([
    't' => time(),
    'e' => $in['e'],
    'v' => $clean($in['v'] ?? '', 16),
    'p' => $pick($in['p'] ?? '', ['landing', 'dziekuje', 'archiwum', 'inna'], 'inna'),
    'st' => $clean($in['st'] ?? '', 10),
    's' => $clean($in['s'] ?? ''),
    'm' => $clean($in['m'] ?? ''),
    'c' => $clean($in['c'] ?? ''),
    'ct' => $clean($in['ct'] ?? ''),
    'd' => $pick($in['d'] ?? '', ['mobile', 'desktop'], 'desktop'),
    'a' => $pick($in['a'] ?? '', ['facebook', 'instagram', 'inna'], 'inna'),
    'f' => $clean($in['f'] ?? '', 20),
    'r' => $clean($in['r'] ?? '', 30),
    'bt' => $clean($in['bt'] ?? '', 30),
], static fn ($v) => $v !== null);

pzz_stats_append($row);
http_response_code(204);
