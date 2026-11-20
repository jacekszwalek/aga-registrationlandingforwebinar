<?php
/**
 * Panel licznika etapów (https://przystanzmianyzawodowej.pl/webinar/licznik/) – chroniony hasłem.
 * Dane: ~/webinar-stats/events.jsonl (api/track.php). Opis: docs/licznik.md.
 * Hasło: w repozytorium jest tylko jego skrót bcrypt; można go podmienić plikiem
 * ~/integrations-keys/.licznik-webinar-hash (jedna linia ze skrótem z password_hash()).
 */
declare(strict_types=1);
require __DIR__ . '/../api/_stats.php';

date_default_timezone_set('Europe/Warsaw');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');

const DEFAULT_HASH = '$2y$12$uIfnZraUp9WwuokXQ5t/RusLhEkR6a4QPutNpeZCQbtyykpXqIoH6';
const COOKIE = 'pzz_licznik';
const SESSION_DAYS = 30;

function pass_hash(): string
{
    $file = dirname(__DIR__, 3) . '/integrations-keys/.licznik-webinar-hash';
    $h = is_readable($file) ? trim((string) file_get_contents($file)) : '';
    return str_starts_with($h, '$2') ? $h : DEFAULT_HASH;
}

/** Ciasteczko logowania (tylko dla panelu): ważność + podpis HMAC; kluczem jest skrót hasła z serwera. */
function token(int $exp): string
{
    return $exp . '.' . hash_hmac('sha256', 'licznik|' . $exp, pass_hash());
}

function logged_in(): bool
{
    $c = (string) ($_COOKIE[COOKIE] ?? '');
    [$exp] = explode('.', $c, 2) + [''];
    return ctype_digit($exp) && (int) $exp > time() && hash_equals(token((int) $exp), $c);
}

function set_cookie(string $value, int $exp): void
{
    setcookie(COOKIE, $value, [
        'expires' => $exp,
        'path' => rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/'), '/') . '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https',
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function h(mixed $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

$self = strtok($_SERVER['REQUEST_URI'] ?? '', '?') ?: './';
$error = '';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (isset($_POST['logout'])) {
        set_cookie('', time() - 3600);
        header('Location: ' . $self, true, 303);
        exit;
    }
    if (pzz_rate_limited('licznik-login', 10, 900)) {
        $error = 'Za dużo prób. Spróbuj ponownie za 15 minut.';
    } elseif (password_verify((string) ($_POST['password'] ?? ''), pass_hash())) {
        $exp = time() + SESSION_DAYS * 86400;
        set_cookie(token($exp), $exp);
        header('Location: ' . $self, true, 303);
        exit;
    } else {
        $error = 'Nieprawidłowe hasło.';
    }
}

$authed = logged_in();
?>
<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Licznik webinaru</title>
<style>
:root{--ink:#1f1a1c;--muted:#5f5559;--line:#e6dde1;--bg:#fbf8f9;--card:#fff;--pink:#a3245a;--pink-soft:#f7e6ee;--ok:#2f6f4f}
*{box-sizing:border-box}
body{margin:0;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--bg)}
main{max-width:1100px;margin:0 auto;padding:20px 16px 48px}
h1{font-size:22px;margin:0}
h2{font-size:17px;margin:28px 0 10px}
.top{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.muted{color:var(--muted);font-size:13px}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px 16px}
.login{max-width:360px;margin:12vh auto}
label{display:block;font-weight:600;margin-bottom:6px}
input,select{font:inherit;font-size:16px;padding:9px 10px;border:1px solid #bfb2b8;border-radius:4px;min-height:44px;background:#fff;color:var(--ink)}
input[type=password]{width:100%}
button,.btn{font:inherit;font-weight:600;min-height:44px;padding:9px 16px;border:0;border-radius:4px;background:var(--pink);color:#fff;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
.ghost{background:transparent;color:var(--pink);border:1px solid var(--pink)}
.err{color:#9b1c1c;margin:8px 0 0}
form.filters{display:flex;flex-wrap:wrap;gap:10px;align-items:end}
form.filters label{font-size:13px;margin-bottom:4px}
.quick{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.quick a{font-size:14px;color:var(--pink)}
.funnel{display:grid;gap:6px}
.step{display:grid;grid-template-columns:minmax(150px,240px) 1fr 110px;gap:10px;align-items:center}
.bar{height:22px;background:var(--pink-soft);border-radius:3px;overflow:hidden}
.bar span{display:block;height:100%;background:var(--pink)}
.num{text-align:right;font-variant-numeric:tabular-nums}
.scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:14px;background:#fff}
th,td{border-bottom:1px solid var(--line);padding:7px 8px;text-align:left;white-space:nowrap}
th{background:#f4eef1;font-weight:600}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.note{background:var(--pink-soft);border-radius:6px;padding:10px 12px;font-size:14px}
@media (max-width:600px){.step{grid-template-columns:1fr 90px}.step .bar{grid-column:1/-1;order:3}}
</style>
</head>
<body>
<main>
<?php if (!$authed): ?>
  <form class="card login" method="post">
    <h1>Licznik webinaru</h1>
    <p class="muted">Panel wewnętrzny Przystani Zmiany Zawodowej.</p>
    <label for="password">Hasło</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
    <?php if ($error): ?><p class="err" role="alert"><?= h($error) ?></p><?php endif; ?>
    <p><button type="submit">Zaloguj</button></p>
  </form>
<?php else:
    // ---------- filtry ----------
    $today = date('Y-m-d');
    $valid = static fn ($d) => is_string($d) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) ? $d : null;
    $from = $valid($_GET['od'] ?? null) ?? date('Y-m-d', strtotime('-6 days'));
    $to = $valid($_GET['do'] ?? null) ?? $today;
    $fCampaign = (string) ($_GET['kampania'] ?? '');
    $fSource = (string) ($_GET['zrodlo'] ?? '');
    $withArchive = !empty($_GET['archiwum']);
    $tFrom = strtotime($from . ' 00:00:00');
    $tTo = strtotime($to . ' 23:59:59');

    // ---------- agregacja ----------
    $STEPS = [
        'page_view' => 'Weszły na stronę',
        'scroll_50' => 'Przewinęły do połowy',
        'scroll_90' => 'Przewinęły prawie do końca',
        'form_open' => 'Otworzyły formularz',
        'form_start' => 'Kliknęły w pole formularza',
        'form_submit_attempt' => 'Kliknęły „Zapisz”',
        'form_error' => 'Zobaczyły błąd',
        'signup' => 'Zapisały się',
    ];
    $COLS = ['page_view' => 'Wejścia', 'scroll_50' => '50%', 'form_open' => 'Formularz', 'form_submit_attempt' => 'Próby', 'form_error' => 'Błędy', 'signup' => 'Zapisy'];

    $funnel = array_fill_keys(array_keys($STEPS), []);
    $groups = ['source' => [], 'content' => [], 'device' => [], 'day' => []];
    $errors = [];
    $other = [];
    $recent = [];
    $campaigns = [];
    $sources = [];
    $total = 0;
    $last = null;

    foreach (pzz_stats_read() as $r) {
        $t = (int) ($r['t'] ?? 0);
        $c = $r['c'] ?? '';
        $s = $r['s'] ?? '';
        if ($c !== '') $campaigns[$c] = true;
        if ($s !== '') $sources[$s] = true;
        if ($t < $tFrom || $t > $tTo) continue;
        if (!$withArchive && !in_array($r['p'] ?? '', ['landing', 'dziekuje'], true)) continue;
        if ($fCampaign !== '' && $c !== ($fCampaign === '(brak)' ? '' : $fCampaign)) continue;
        if ($fSource !== '' && $s !== ($fSource === '(brak)' ? '' : $fSource)) continue;
        $total++;
        $last = $t;
        $e = $r['e'] ?? '';
        $v = $r['v'] ?? ('x' . $total);
        // Wejście liczymy tylko na landingu (wejście na /dziekuje/ widać w „Ostatnich zdarzeniach”).
        if ($e === 'page_view' && ($r['p'] ?? '') !== 'landing') continue;
        $recent[] = $r;
        if (count($recent) > 60) array_shift($recent);
        if (isset($funnel[$e])) $funnel[$e][$v] = true;
        else $other[$e] = ($other[$e] ?? 0) + 1;
        if ($e === 'form_error') {
            $k = ($r['f'] ?? '?') . ' · ' . ($r['r'] ?? '?');
            $errors[$k] = ($errors[$k] ?? 0) + 1;
        }
        if (!isset($COLS[$e])) continue;
        $keys = [
            'source' => ($s ?: '(brak UTM)') . ' / ' . ($r['m'] ?? '–'),
            'content' => ($r['ct'] ?? '') ?: '(brak)',
            'device' => ($r['d'] ?? '?') . ' · ' . ['facebook' => 'aplikacja Facebook', 'instagram' => 'aplikacja Instagram', 'inna' => 'przeglądarka'][$r['a'] ?? 'inna'],
            'day' => date('Y-m-d', $t),
        ];
        foreach ($keys as $g => $k) $groups[$g][$k][$e][$v] = true;
    }
    $base = count($funnel['page_view']);
    $pct = static fn (int $n, int $of) => $of > 0 ? round(100 * $n / $of) . '%' : '–';
    $qs = static fn (array $over) => '?' . http_build_query(array_filter(array_merge(['od' => $from, 'do' => $to, 'kampania' => $fCampaign, 'zrodlo' => $fSource, 'archiwum' => $withArchive ? '1' : ''], $over)));
    ksort($campaigns);
    ksort($sources);
    $EVENT_PL = $STEPS + ['generate_lead' => 'konwersja (po zgodzie na cookies)', 'sticky_cta_click' => 'przycisk przyklejony', 'newsletter_signup' => 'newsletter na /dziekuje/', 'add_to_calendar' => 'dodanie do kalendarza', 'consultation_click' => 'konsultacja', 'logo_click' => 'logo', 'share_click' => 'udostępnienie'];

    $table = static function (string $title, array $rows, string $first) use ($COLS, $pct): void {
        if (!$rows) return;
        uksort($rows, static fn ($a, $b) => count($rows[$b]['page_view'] ?? []) <=> count($rows[$a]['page_view'] ?? []) ?: strcmp((string) $a, (string) $b));
        echo '<h2>' . h($title) . '</h2><div class="scroll"><table><thead><tr><th>' . h($first) . '</th>';
        foreach ($COLS as $label) echo '<th class="n">' . h($label) . '</th>';
        echo '<th class="n">Zapisy / wejścia</th></tr></thead><tbody>';
        foreach ($rows as $k => $ev) {
            echo '<tr><td>' . h((string) $k) . '</td>';
            foreach (array_keys($COLS) as $e) echo '<td class="n">' . count($ev[$e] ?? []) . '</td>';
            echo '<td class="n">' . $pct(count($ev['signup'] ?? []), count($ev['page_view'] ?? [])) . '</td></tr>';
        }
        echo '</tbody></table></div>';
    };
?>
  <div class="top">
    <div>
      <h1>Licznik webinaru</h1>
      <p class="muted">Bez cookies i bez danych osobowych · liczy każde wczytanie strony osobno · czas polski</p>
    </div>
    <form method="post"><button class="ghost" name="logout" value="1">Wyloguj</button></form>
  </div>

  <div class="card" style="margin-top:14px">
    <form class="filters" method="get">
      <div><label for="od">Od</label><input id="od" type="date" name="od" value="<?= h($from) ?>"></div>
      <div><label for="do">Do</label><input id="do" type="date" name="do" value="<?= h($to) ?>"></div>
      <div><label for="kampania">Kampania</label><select id="kampania" name="kampania"><option value="">wszystkie</option><option value="(brak)"<?= $fCampaign === '(brak)' ? ' selected' : '' ?>>(bez UTM)</option><?php foreach (array_map("strval", array_keys($campaigns)) as $c): ?><option<?= $c === $fCampaign ? ' selected' : '' ?>><?= h($c) ?></option><?php endforeach; ?></select></div>
      <div><label for="zrodlo">Źródło</label><select id="zrodlo" name="zrodlo"><option value="">wszystkie</option><option value="(brak)"<?= $fSource === '(brak)' ? ' selected' : '' ?>>(bez UTM)</option><?php foreach (array_map("strval", array_keys($sources)) as $s): ?><option<?= $s === $fSource ? ' selected' : '' ?>><?= h($s) ?></option><?php endforeach; ?></select></div>
      <div><label><input type="checkbox" name="archiwum" value="1"<?= $withArchive ? ' checked' : '' ?> style="min-height:auto"> z archiwum wersji</label></div>
      <div><button type="submit">Pokaż</button></div>
    </form>
    <div class="quick">
      <a href="<?= h($qs(['od' => $today, 'do' => $today])) ?>">Dziś</a>
      <a href="<?= h($qs(['od' => date('Y-m-d', strtotime('-1 day')), 'do' => date('Y-m-d', strtotime('-1 day'))])) ?>">Wczoraj</a>
      <a href="<?= h($qs(['od' => date('Y-m-d', strtotime('-6 days')), 'do' => $today])) ?>">7 dni</a>
      <a href="<?= h($qs(['od' => '2026-01-01', 'do' => $today])) ?>">Wszystko</a>
    </div>
  </div>

<?php if ($total === 0): ?>
  <p class="note" style="margin-top:16px">Brak zdarzeń w wybranym okresie. Licznik zbiera dane od chwili wdrożenia.</p>
<?php else: ?>
  <h2>Lejek: na którym etapie ludzie odpadają</h2>
  <div class="card funnel">
    <?php foreach ($STEPS as $e => $label): $n = count($funnel[$e]); $w = $base ? min(100, round(100 * $n / $base)) : 0; ?>
      <div class="step"><span><?= h($label) ?></span><span class="bar"><span style="width:<?= $w ?>%"></span></span><span class="num"><b><?= $n ?></b> · <?= $pct($n, $base) ?></span></div>
    <?php endforeach; ?>
    <p class="muted" style="margin:6px 0 0">Procent liczony od wejść na stronę. „Zapisały się” = serwer przyjął zapis i strona przeszła na podziękowanie. Pełną listę osób ma MailerLite.</p>
  </div>

  <?php
    $table('Według źródła (utm_source / utm_medium)', $groups['source'], 'Źródło / medium');
    $table('Według materiału (utm_content)', $groups['content'], 'utm_content');
    $table('Według urządzenia i aplikacji', $groups['device'], 'Urządzenie · otwarte w');
    $table('Dzień po dniu', $groups['day'], 'Dzień');
  ?>

  <?php if ($errors): arsort($errors); ?>
  <h2>Błędy formularza</h2>
  <div class="scroll"><table><thead><tr><th>Pole · powód</th><th class="n">Ile razy</th></tr></thead><tbody>
    <?php foreach ($errors as $k => $n): ?><tr><td><?= h($k) ?></td><td class="n"><?= $n ?></td></tr><?php endforeach; ?>
  </tbody></table></div>
  <p class="muted">email/name · required lub invalid = błąd w polu (np. brak imienia); network · network = brak połączenia; network · http-… = odpowiedź serwera z błędem.</p>
  <?php endif; ?>

  <?php if ($other): arsort($other); ?>
  <h2>Inne kliknięcia</h2>
  <div class="scroll"><table><thead><tr><th>Zdarzenie</th><th class="n">Ile razy</th></tr></thead><tbody>
    <?php foreach ($other as $k => $n): ?><tr><td><?= h($EVENT_PL[$k] ?? $k) ?></td><td class="n"><?= $n ?></td></tr><?php endforeach; ?>
  </tbody></table></div>
  <?php endif; ?>

  <h2>Ostatnie zdarzenia</h2>
  <div class="scroll"><table><thead><tr><th>Czas</th><th>Zdarzenie</th><th>Strona</th><th>Źródło / medium</th><th>Materiał</th><th>Urządzenie</th><th>Szczegóły</th></tr></thead><tbody>
    <?php foreach (array_reverse($recent) as $r): ?>
      <tr><td><?= h(date('d.m H:i:s', (int) $r['t'])) ?></td><td><?= h($EVENT_PL[$r['e']] ?? $r['e']) ?></td><td><?= h($r['p'] ?? '') ?></td><td><?= h(($r['s'] ?? '–') . ' / ' . ($r['m'] ?? '–')) ?></td><td><?= h($r['ct'] ?? '') ?></td><td><?= h(($r['d'] ?? '') . ' · ' . ($r['a'] ?? '')) ?></td><td><?= h(trim(($r['f'] ?? '') . ' ' . ($r['r'] ?? ''))) ?></td></tr>
    <?php endforeach; ?>
  </tbody></table></div>
  <p class="muted">Zdarzeń w okresie: <?= $total ?> · ostatnie: <?= h($last ? date('d.m.Y H:i', $last) : '–') ?></p>
<?php endif; ?>
<?php endif; ?>
</main>
</body>
</html>
