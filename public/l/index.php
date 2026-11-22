<?php
/**
 * Przekierowanie krótkich linków: …/l/kod → pełny adres z UTM-ami (302).
 * Reguły: deploy/htaccess-root (strony pod /webinar/) i public_html/.htaccess (reszta domeny, docs/skracacz.md).
 * Nieznany kod (albo ścieżka, która nie pasuje do linku) → strona nadrzędna, czyli adres przed „/l/”.
 * Kliknięcia liczone bez cookies i bez IP; boty i podglądy linków się nie liczą.
 */
declare(strict_types=1);
require __DIR__ . '/../api/_links.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
header('Referrer-Policy: no-referrer-when-downgrade');

$code = strtolower(preg_replace('/[^A-Za-z0-9-]/', '', (string) ($_GET['c'] ?? '')));
// Bez „p” (np. wejście wprost na …/l/) – strona, pod którą leży skracacz (/webinar/).
$prefix = pzz_clean_prefix((string) ($_GET['p'] ?? dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/l/index.php'))));
$target = $code !== '' ? pzz_link_resolve(pzz_links_load(), $code, $prefix) : null;

if ($target === null) {
    header('Location: ' . PZZ_SITE . $prefix, true, 302);
    exit;
}

$counts = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' && !pzz_is_bot_ua((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
if ($counts) {
    try {
        pzz_links_update(static function (array &$links) use ($code) {
            $links[$code]['clicks'] = (int) ($links[$code]['clicks'] ?? 0) + 1;
            $links[$code]['last'] = time();
        });
    } catch (Throwable $e) {
        error_log('pzz l: ' . $e->getMessage());
    }
}
header('Location: ' . $target, true, 302);
