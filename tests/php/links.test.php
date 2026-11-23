<?php
// Testy skracacza (CLI): php tests/php/links.test.php
declare(strict_types=1);
putenv('PZZ_LINKS_DIR=' . sys_get_temp_dir() . '/pzz-links-test-' . getmypid());
require __DIR__ . '/../../public/api/_links.php';

$fail = 0;
function eq($got, $want, string $msg): void
{
    global $fail;
    if ($got !== $want) {
        $fail++;
        echo "FAIL: $msg\n  got:  " . var_export($got, true) . "\n  want: " . var_export($want, true) . "\n";
    }
}

eq(pzz_link_prefix('https://przystanzmianyzawodowej.pl/webinar/?utm_source=x'), '/webinar/', 'prefix katalogu webinaru');
eq(pzz_link_prefix('https://przystanzmianyzawodowej.pl/webinar/dziekuje/'), '/webinar/dziekuje/', 'prefix podstrony');
eq(pzz_link_prefix('https://www.przystanzmianyzawodowej.pl/bezplatne-szkolenie'), '/', 'ścieżka bez „/” – katalog nadrzędny');
eq(pzz_link_prefix('https://przystanzmianyzawodowej.pl/a/b.html'), '/a/', 'plik – jego katalog');
eq(pzz_link_prefix('https://calendly.com/x/rozmowa'), '/', 'obca domena → /');
eq(pzz_clean_prefix('//evil.com/../x'), '/evil.com/x/', 'bez podwójnych / i ..');
eq(pzz_short_url('k3x9', '/webinar/'), 'https://przystanzmianyzawodowej.pl/webinar/l/k3x9', 'krótki link');
eq(pzz_valid_code('fb-261203'), true, 'kod własny');
eq(pzz_valid_code('-zly'), false, 'kod z „-” na początku');
eq(pzz_valid_code('ab'), false, 'kod za krótki');
eq(pzz_valid_code('api'), false, 'kod zarezerwowany');
eq(strlen(pzz_random_code([])), 4, 'kod losowy ma 4 znaki');

$now = 1_800_000_000;
eq(pzz_link_state(['created' => $now - 10 * 86400, 'last' => null], $now), 'active', 'nowy – aktywny');
eq(pzz_link_state(['created' => $now - 90 * 86400, 'last' => $now - 31 * 86400], $now), 'sleeping', '31 dni bez kliknięcia – uśpiony');
eq(pzz_link_state(['created' => $now - 400 * 86400, 'last' => $now - 180 * 86400], $now), 'archived', '180 dni – zarchiwizowany');

$a = pzz_link_create('https://przystanzmianyzawodowej.pl/webinar/?utm_source=linkedin&utm_campaign=261203', 'linkedin-261203');
eq($a['short'], 'https://przystanzmianyzawodowej.pl/webinar/l/linkedin-261203', 'utworzenie z kodem');
eq($a['needsRootRule'], false, 'webinar nie wymaga reguły w public_html');
$b = pzz_link_create('https://przystanzmianyzawodowej.pl/webinar/?utm_source=linkedin&utm_campaign=261203');
eq([$b['code'], $b['existing']], ['linkedin-261203', true], 'ten sam adres – ten sam link (bez duplikatów)');
try {
    pzz_link_create('https://przystanzmianyzawodowej.pl/webinar/?utm_source=fb', 'linkedin-261203');
    eq(true, false, 'zajęty kod powinien zgłosić błąd');
} catch (InvalidArgumentException) {
}
$links = pzz_links_load();
eq(pzz_link_resolve($links, 'LINKEDIN-261203', '/webinar/'), 'https://przystanzmianyzawodowej.pl/webinar/?utm_source=linkedin&utm_campaign=261203', 'rozwiązanie (wielkość liter bez znaczenia)');
eq(pzz_link_resolve($links, 'linkedin-261203', '/inna/'), null, 'zła ścieżka przed /l/ – brak');
eq(pzz_link_resolve($links, 'nieznany', '/webinar/'), null, 'nieznany kod – brak');
eq(pzz_is_bot_ua('facebookexternalhit/1.1'), true, 'podgląd Facebooka to bot');
eq(pzz_is_bot_ua('Mozilla/5.0 (iPhone) Instagram 350'), false, 'Instagram to człowiek');

eq(pzz_normalize_url('https://przystanzmianyzawodowej.pl/webinar?utm_source=x'), 'https://przystanzmianyzawodowej.pl/webinar/?utm_source=x', 'normalizacja: /webinar → /webinar/');
eq(pzz_normalize_url('https://przystanzmianyzawodowej.pl/webinar/?a=1'), 'https://przystanzmianyzawodowej.pl/webinar/?a=1', 'normalizacja: bez zmian z „/”');
eq(pzz_normalize_url('https://przystanzmianyzawodowej.pl/plik.pdf'), 'https://przystanzmianyzawodowej.pl/plik.pdf', 'normalizacja: plik bez zmian');
eq(pzz_normalize_url('https://przystanzmianyzawodowej.pl?x=1'), 'https://przystanzmianyzawodowej.pl/?x=1', 'normalizacja: sama domena');
eq(pzz_normalize_url('https://calendly.com/x/rozmowa'), 'https://calendly.com/x/rozmowa', 'normalizacja: obca domena bez zmian');
$c = pzz_link_create('https://przystanzmianyzawodowej.pl/webinar?utm_source=fb');
eq(str_contains($c['short'], '/webinar/l/'), true, 'link do …/webinar bez „/” – krótki pod /webinar/l/');
// Link sprzed normalizacji (prefiks „/”): działa pod starym i nowym adresem, prowadzi na …/webinar/?…
$legacy = ['qshq' => ['url' => 'https://przystanzmianyzawodowej.pl/webinar?utm_source=facebook', 'prefix' => '/', 'created' => 1, 'clicks' => 0, 'last' => null]];
eq(pzz_link_resolve($legacy, 'qshq', '/'), 'https://przystanzmianyzawodowej.pl/webinar/?utm_source=facebook', 'stary link pod /l/');
eq(pzz_link_resolve($legacy, 'qshq', '/webinar/'), 'https://przystanzmianyzawodowej.pl/webinar/?utm_source=facebook', 'stary link pod /webinar/l/');

array_map('unlink', array_filter(glob(pzz_links_dir() . '/{,.}*', GLOB_BRACE) ?: [], 'is_file'));
@rmdir(pzz_links_dir());
echo $fail ? "$fail błędów\n" : "OK – skracacz\n";
exit($fail ? 1 : 0);
