<?php
/**
 * Panel licznika etapów (https://przystanzmianyzawodowej.pl/webinar/licznik/) – chroniony hasłem.
 * Dane: ~/webinar-stats/events.jsonl (api/track.php). Opis: docs/licznik.md.
 * Logowanie: api/_auth.php (wspólne z panelem linków i skracaczem).
 */
declare(strict_types=1);
require __DIR__ . '/../api/_auth.php';

date_default_timezone_set('Europe/Warsaw');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');

function h(mixed $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

$self = strtok($_SERVER['REQUEST_URI'] ?? '', '?') ?: './';
$error = '';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (isset($_POST['logout'])) {
        pzz_logout();
        header('Location: ' . $self, true, 303);
        exit;
    }
    $res = pzz_login((string) ($_POST['password'] ?? ''));
    if ($res === true) {
        header('Location: ' . $self, true, 303);
        exit;
    }
    $error = $res === 'limit' ? 'Za dużo prób. Spróbuj ponownie za 15 minut.' : 'Nieprawidłowe hasło.';
}

$authed = pzz_logged_in();
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
.step{display:grid;grid-template-columns:minmax(150px,240px) 1fr 110px 90px;gap:10px;align-items:center}
.qname{font-size:16px;font-weight:600}
.funnel .prev{font-size:13px;color:var(--muted);text-align:right}
.step-base .bar span{background:#c98aa6}
.funnel-head{display:flex;flex-wrap:wrap;gap:10px 20px;justify-content:space-between;align-items:center;margin-bottom:8px}
.kpis{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:15px}
.seg-links{display:flex;gap:8px;align-items:center;font-size:14px}
.seg-links a{color:var(--pink);padding:6px 10px;border:1px solid var(--pink);border-radius:4px;text-decoration:none;min-height:36px;display:inline-flex;align-items:center}
.seg-links a[aria-current]{background:var(--pink);color:#fff}
.bar{height:22px;background:var(--pink-soft);border-radius:3px;overflow:hidden}
.bar span{display:block;height:100%;background:var(--pink)}
.num{text-align:right;font-variant-numeric:tabular-nums}
.scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:14px;background:#fff}
th,td{border-bottom:1px solid var(--line);padding:7px 8px;text-align:left;white-space:nowrap}
th{background:#f4eef1;font-weight:600}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.filterbar{position:sticky;top:0;z-index:10;margin-top:14px;box-shadow:0 6px 14px -10px rgba(31,26,28,.35)}
.filterbar .quick{margin-top:8px}
@media (max-width:600px){.filterbar{padding:8px 10px}form.filters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 8px;align-items:end}form.filters label{margin-bottom:2px;font-size:12px}form.filters input[type=date],form.filters select{width:100%;min-width:0}form.filters button{width:100%;justify-content:center}.filterbar .quick{margin-top:6px}}
.logbar{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:0 0 10px}
.logbar label{font-size:13px;margin-bottom:4px}
.pager{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:10px 0}
#zdarzenia{scroll-margin-top:150px}
.note{background:var(--pink-soft);border-radius:6px;padding:10px 12px;font-size:14px}
@media (max-width:600px){.step{grid-template-columns:1fr auto auto}.step .bar{grid-column:1/-1;order:3}}
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
    // Dziennik zdarzeń: typ, liczba wpisów na stronę i numer strony.
    $fType = preg_replace('/[^a-z0-9_]/', '', (string) ($_GET['typ'] ?? ''));
    $perPage = in_array((int) ($_GET['ile'] ?? 50), [50, 100, 500], true) ? (int) ($_GET['ile'] ?? 50) : 50;
    $page = max(1, (int) ($_GET['str'] ?? 1));
    // Podstawa lejka: ludzie (domyślnie) albo wszystkie wejścia.
    $fBase = ($_GET['baza'] ?? '') === 'wejscia' ? 'wejscia' : 'ludzie';
    $tFrom = strtotime($from . ' 00:00:00');
    $tTo = strtotime($to . ' 23:59:59');

    // ---------- agregacja ----------
    $STEPS = [
        'page_view' => 'Weszły na stronę',
        'engaged' => 'Dotknęły lub przewinęły stronę',
        'scroll_50' => 'Przewinęły do połowy',
        'scroll_90' => 'Przewinęły prawie do końca',
        'form_open' => 'Otworzyły formularz',
        'form_start' => 'Kliknęły w pole formularza',
        'form_submit_attempt' => 'Kliknęły „Zapisz”',
        'form_error' => 'Zobaczyły błąd',
        'signup' => 'Zapisały się',
    ];
    $COLS = ['page_view' => 'Wejścia', 'engaged' => 'Interakcja', 'scroll_50' => '50%', 'form_open' => 'Formularz', 'form_submit_attempt' => 'Próby', 'form_error' => 'Błędy', 'signup' => 'Zapisy'];

    $funnel = array_fill_keys(array_keys($STEPS), []);
    $groups = ['source' => [], 'content' => [], 'device' => [], 'day' => []];
    $errors = [];
    $other = [];
    $log = [];
    $types = [];
    $visits = [];
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
        // Dziennik: wszystkie zdarzenia (filtr typu niżej).
        $types[$e] = ($types[$e] ?? 0) + 1;
        if ($fType === '' || $fType === $e) $log[] = $r;
        // Ocena wejścia (człowiek czy bot) – dla wczytań landingu.
        if (($r['p'] ?? '') === 'landing') {
            $vv = &$visits[$v];
            $vv ??= ['seg' => ($s ?: '(brak UTM)') . ' / ' . ($r['m'] ?? '–') . ' · ' . ($r['a'] ?? 'inna'), 'bt' => '', 'ev' => []];
            $vv['ev'][$e] = true;
            if (!empty($r['bt'])) $vv['bt'] = $r['bt'];
            unset($vv);
        }
        // Wejście liczymy tylko na landingu (wejście na /dziekuje/ widać w dzienniku zdarzeń).
        if ($e === 'page_view' && ($r['p'] ?? '') !== 'landing') continue;
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

    // ---------- człowiek czy bot ----------
    $CLASSES = [
        'human' => ['dotyk, klik lub przewinięcie', 'pewny człowiek'],
        'reader' => ['strona widoczna ≥ 10 s, bez dotyku', 'raczej człowiek'],
        'bounce' => ['strona widoczna 3–10 s, bez dotyku', 'szybkie wyjście albo bot'],
        'instant' => ['strona widoczna < 3 s, bez dotyku, i wyjście', 'natychmiastowe wyjście'],
        'preload' => ['wczytanie w tle przez aplikację, nikt nie zobaczył', 'nie człowiek'],
        'bot' => ['sygnały automatu (webdriver, brak języków, zerowy ekran)', 'bot'],
    ];
    $classify = static function (array $vv): string {
        $ev = $vv['ev'];
        if ($vv['bt'] !== '') return 'bot';
        if (isset($ev['page_preload']) && !isset($ev['page_view'])) return 'preload';
        if (isset($ev['engaged']) || isset($ev['scroll_50']) || isset($ev['form_open']) || isset($ev['form_start']) || isset($ev['sticky_cta_click'])) return 'human';
        if (isset($ev['stay_10s'])) return 'reader';
        if (isset($ev['stay_3s'])) return 'bounce';
        return 'instant';
    };
    $quality = array_fill_keys(array_keys($CLASSES), 0);
    $qualitySeg = [];
    $visitClass = [];
    foreach ($visits as $vid => $vv) {
        if (!isset($vv['ev']['page_view']) && !isset($vv['ev']['page_preload'])) continue;
        $k = $classify($vv);
        $visitClass[$vid] = $k;
        $quality[$k]++;
        $qualitySeg[$vv['seg']][$k] = ($qualitySeg[$vv['seg']][$k] ?? 0) + 1;
    }
    $qTotal = array_sum($quality);

    // ---------- dziennik: stronicowanie ----------
    $log = array_reverse($log);
    $logCount = count($log);
    $pages = max(1, (int) ceil($logCount / $perPage));
    $page = min($page, $pages);
    $logPage = array_slice($log, ($page - 1) * $perPage, $perPage);
    $pct = static fn (int $n, int $of) => $of > 0 ? round(100 * $n / $of) . '%' : '–';
    $qs = static fn (array $over) => '?' . http_build_query(array_filter(array_merge(['od' => $from, 'do' => $to, 'kampania' => $fCampaign, 'zrodlo' => $fSource, 'archiwum' => $withArchive ? '1' : '', 'typ' => $fType, 'ile' => $perPage === 50 ? '' : (string) $perPage, 'baza' => $fBase === 'ludzie' ? '' : $fBase], $over)));
    ksort($campaigns);
    ksort($sources);
    $EVENT_PL = $STEPS + ['page_preload' => 'wczytanie w tle (bez pokazania)', 'stay_3s' => 'strona widoczna 3 s', 'stay_10s' => 'strona widoczna 10 s', 'stay_30s' => 'strona widoczna 30 s', 'generate_lead' => 'konwersja (po zgodzie na cookies)', 'sticky_cta_click' => 'przycisk przyklejony', 'newsletter_signup' => 'newsletter na /dziekuje/', 'add_to_calendar' => 'dodanie do kalendarza', 'consultation_click' => 'konsultacja', 'logo_click' => 'logo', 'share_click' => 'udostępnienie'];

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
    <div style="display:flex;gap:10px;align-items:center"><a class="btn ghost" href="linki/">Krótkie linki</a><form method="post"><button class="ghost" name="logout" value="1">Wyloguj</button></form></div>
  </div>

  <div class="card filterbar">
    <form class="filters" method="get">
      <div><label for="od">Od</label><input id="od" type="date" name="od" value="<?= h($from) ?>"></div>
      <div><label for="do">Do</label><input id="do" type="date" name="do" value="<?= h($to) ?>"></div>
      <div><label for="kampania">Kampania</label><select id="kampania" name="kampania"><option value="">wszystkie</option><option value="(brak)"<?= $fCampaign === '(brak)' ? ' selected' : '' ?>>(bez UTM)</option><?php foreach (array_map("strval", array_keys($campaigns)) as $c): ?><option<?= $c === $fCampaign ? ' selected' : '' ?>><?= h($c) ?></option><?php endforeach; ?></select></div>
      <div><label for="zrodlo">Źródło</label><select id="zrodlo" name="zrodlo"><option value="">wszystkie</option><option value="(brak)"<?= $fSource === '(brak)' ? ' selected' : '' ?>>(bez UTM)</option><?php foreach (array_map("strval", array_keys($sources)) as $s): ?><option<?= $s === $fSource ? ' selected' : '' ?>><?= h($s) ?></option><?php endforeach; ?></select></div>
      <div><label><input type="checkbox" name="archiwum" value="1"<?= $withArchive ? ' checked' : '' ?> style="min-height:auto"> z archiwum wersji</label></div>
      <input type="hidden" name="typ" value="<?= h($fType) ?>"><input type="hidden" name="baza" value="<?= h($fBase === 'ludzie' ? '' : $fBase) ?>"><input type="hidden" name="ile" value="<?= $perPage ?>">
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
  <?php
    // Lejek liczony od ludzi (pewny + raczej człowiek), żeby wczytania w tle i natychmiastowe wyjścia nie spłaszczały wykresu.
    $people = $quality['human'] + $quality['reader'];
    $fBaseN = $fBase === 'ludzie' ? $people : $base;
    $FSTEPS = array_diff_key($STEPS, ['page_view' => 1, 'engaged' => 1]);
    // „% z poprzedniego kroku” tylko tam, gdzie kroki idą po kolei (formularz).
    $CHAIN = ['form_start' => 'form_open', 'form_submit_attempt' => 'form_start', 'signup' => 'form_submit_attempt'];
  ?>
  <h2>Lejek: na którym etapie ludzie odpadają</h2>
  <div class="card funnel">
    <div class="funnel-head">
      <div class="kpis">
        <span><b><?= $base ?></b> wejść</span>
        <span>→ <b><?= $people ?></b> ludzi <span class="muted">(<?= $pct($people, $base) ?> wejść)</span></span>
        <span>→ <b><?= count($funnel['signup']) ?></b> zapisów <span class="muted">(<?= $pct(count($funnel['signup']), $people) ?> ludzi)</span></span>
      </div>
      <div class="seg-links" role="group" aria-label="Licz procenty od">
        <span class="muted">Licz od:</span>
        <a href="<?= h($qs(['baza' => ''])) ?>"<?= $fBase === 'ludzie' ? ' aria-current="true"' : '' ?>>ludzi</a>
        <a href="<?= h($qs(['baza' => 'wejscia'])) ?>"<?= $fBase === 'wejscia' ? ' aria-current="true"' : '' ?>>wszystkich wejść</a>
      </div>
    </div>
    <div class="step step-base"><span><?= $fBase === 'ludzie' ? 'Ludzie (dotyk, przewinięcie lub ≥ 10 s)' : 'Weszły na stronę' ?></span><span class="bar"><span style="width:100%"></span></span><span class="num"><b><?= $fBaseN ?></b> · 100%</span><span class="prev"></span></div>
    <?php foreach ($FSTEPS as $e => $label): $n = count($funnel[$e]); $w = $fBaseN ? min(100, round(100 * $n / $fBaseN)) : 0; $prev = $CHAIN[$e] ?? null; ?>
      <div class="step"><span><?= h($label) ?></span><span class="bar"><span style="width:<?= $w ?>%"></span></span><span class="num"><b><?= $n ?></b> · <?= $pct($n, $fBaseN) ?></span><span class="prev"><?= $prev ? h($pct($n, count($funnel[$prev])) . ' z poprz.') : '' ?></span></div>
    <?php endforeach; ?>
    <p class="muted" style="margin:6px 0 0"><?= $fBase === 'ludzie'
      ? 'Procent liczony od ludzi – wejść z dotykiem, przewinięciem albo stroną widoczną co najmniej 10 s (patrz „Człowiek czy bot?”). Wczytania w tle i natychmiastowe wyjścia nie zaniżają wykresu.'
      : 'Procent liczony od wszystkich wejść na stronę, łącznie z natychmiastowymi wyjściami.' ?> „z poprz.” – jaka część osób z poprzedniego kroku formularza przeszła dalej. „Zapisały się” = serwer przyjął zapis; pełną listę osób ma MailerLite.</p>
  </div>

  <h2>Człowiek czy bot? Ocena wejść</h2>
  <div class="card funnel">
    <?php foreach ($CLASSES as $k => [$label, $hint]): $n = $quality[$k]; $w = $qTotal ? round(100 * $n / $qTotal) : 0; ?>
      <div class="step"><span><span class="qname"><?= h(ucfirst($hint)) ?></span> <span class="muted">· <?= h($label) ?></span></span><span class="bar"><span style="width:<?= $w ?>%"></span></span><span class="num"><b><?= $n ?></b> · <?= $pct($n, $qTotal) ?></span></div>
    <?php endforeach; ?>
    <p class="muted" style="margin:6px 0 0">Każde wczytanie landingu dostaje jedną ocenę: liczy się najmocniejszy sygnał. Ludzie to zwykle dwa pierwsze wiersze.</p>
  </div>
  <?php if ($qualitySeg):
    uksort($qualitySeg, static fn ($a, $b) => array_sum($qualitySeg[$b]) <=> array_sum($qualitySeg[$a]));
  ?>
  <div class="scroll" style="margin-top:10px"><table><thead><tr><th>Źródło / medium · otwarte w</th><th class="n">Wczytania</th>
    <?php foreach ($CLASSES as [$label, $hint]): ?><th class="n"><?= h(ucfirst($hint)) ?></th><?php endforeach; ?><th class="n">Ludzie</th></tr></thead><tbody>
    <?php foreach ($qualitySeg as $seg => $row): $sum = array_sum($row); ?>
      <tr><td><?= h($seg) ?></td><td class="n"><?= $sum ?></td>
      <?php foreach (array_keys($CLASSES) as $k): ?><td class="n"><?= $row[$k] ?? 0 ?></td><?php endforeach; ?>
      <td class="n"><?= $pct(($row['human'] ?? 0) + ($row['reader'] ?? 0), $sum) ?></td></tr>
    <?php endforeach; ?>
  </tbody></table></div>
  <p class="muted">„Ludzie” = pewny człowiek + raczej człowiek.</p>
  <?php endif; ?>

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
  <h2>Inne zdarzenia</h2>
  <div class="scroll"><table><thead><tr><th>Zdarzenie</th><th class="n">Ile razy</th></tr></thead><tbody>
    <?php foreach ($other as $k => $n): ?><tr><td><?= h($EVENT_PL[$k] ?? $k) ?></td><td class="n"><?= $n ?></td></tr><?php endforeach; ?>
  </tbody></table></div>
  <?php endif; ?>

  <h2 id="zdarzenia">Dziennik zdarzeń</h2>
  <form class="logbar" method="get" action="#zdarzenia">
    <?php foreach (['od' => $from, 'do' => $to, 'kampania' => $fCampaign, 'zrodlo' => $fSource, 'archiwum' => $withArchive ? '1' : ''] as $k => $val): if ($val === '') continue; ?><input type="hidden" name="<?= h($k) ?>" value="<?= h($val) ?>"><?php endforeach; ?>
    <div><label for="typ">Typ zdarzenia</label><select id="typ" name="typ" onchange="this.form.submit()"><option value="">wszystkie (<?= $total ?>)</option>
      <?php ksort($types); foreach ($types as $k => $n): $k = (string) $k; ?><option value="<?= h($k) ?>"<?= $k === $fType ? ' selected' : '' ?>><?= h(($EVENT_PL[$k] ?? $k) . ' (' . $n . ')') ?></option><?php endforeach; ?>
    </select></div>
    <div><label for="ile">Na stronie</label><select id="ile" name="ile" onchange="this.form.submit()"><?php foreach ([50, 100, 500] as $n): ?><option<?= $n === $perPage ? ' selected' : '' ?>><?= $n ?></option><?php endforeach; ?></select></div>
    <noscript><div><button type="submit">Pokaż</button></div></noscript>
  </form>
  <div class="scroll"><table><thead><tr><th>Czas</th><th>Zdarzenie</th><th>Ocena wejścia</th><th>Strona</th><th>Kampania</th><th>Źródło / medium</th><th>Materiał</th><th>Urządzenie</th><th>Szczegóły</th></tr></thead><tbody>
    <?php foreach ($logPage as $r): $vc = $visitClass[$r['v'] ?? ''] ?? null; ?>
      <tr><td><?= h(date('d.m H:i:s', (int) $r['t'])) ?></td><td><?= h($EVENT_PL[$r['e']] ?? $r['e']) ?></td><td><?= h($vc ? $CLASSES[$vc][1] : '–') ?></td><td><?= h($r['p'] ?? '') ?></td><td><?= h($r['c'] ?? '–') ?></td><td><?= h(($r['s'] ?? '–') . ' / ' . ($r['m'] ?? '–')) ?></td><td><?= h($r['ct'] ?? '') ?></td><td><?= h(($r['d'] ?? '') . ' · ' . ($r['a'] ?? '')) ?></td><td><?= h(trim(($r['f'] ?? '') . ' ' . ($r['r'] ?? '') . (!empty($r['bt']) ? ' bot:' . $r['bt'] : ''))) ?></td></tr>
    <?php endforeach; ?>
    <?php if (!$logPage): ?><tr><td colspan="9">Brak zdarzeń tego typu.</td></tr><?php endif; ?>
  </tbody></table></div>
  <nav class="pager" aria-label="Strony dziennika">
    <?php if ($page > 1): ?><a class="btn ghost" href="<?= h($qs(['str' => (string) ($page - 1)])) ?>#zdarzenia">← Nowsze</a><?php endif; ?>
    <span>Strona <?= $page ?> z <?= $pages ?> · wpisy <?= $logCount ? (($page - 1) * $perPage + 1) : 0 ?>–<?= min($logCount, $page * $perPage) ?> z <?= $logCount ?></span>
    <?php if ($page < $pages): ?><a class="btn ghost" href="<?= h($qs(['str' => (string) ($page + 1)])) ?>#zdarzenia">Starsze →</a><?php endif; ?>
  </nav>
  <p class="muted">Zdarzeń w okresie: <?= $total ?> · ostatnie: <?= h($last ? date('d.m.Y H:i', $last) : '–') ?></p>
<?php endif; ?>
<?php endif; ?>
</main>
</body>
</html>
