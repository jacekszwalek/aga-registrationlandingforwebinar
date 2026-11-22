<?php
/**
 * Panel krótkich linków (https://przystanzmianyzawodowej.pl/webinar/licznik/linki/) – to samo logowanie co licznik.
 * Pokazuje kliknięcia i to, jak dawno nikt nie kliknął: aktywne (< 30 dni), uśpione (30–180), zarchiwizowane (180+).
 * Zarchiwizowane linki nadal działają – archiwum tylko porządkuje listę. Usunąć można tylko link bez kliknięć.
 */
declare(strict_types=1);
require __DIR__ . '/../../api/_auth.php';
require __DIR__ . '/../../api/_links.php';

date_default_timezone_set('Europe/Warsaw');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');

function h(mixed $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

if (!pzz_logged_in()) {
    header('Location: ../', true, 303);
    exit;
}

$self = strtok($_SERVER['REQUEST_URI'] ?? '', '?') ?: './';
$msg = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['delete'])) {
    $del = strtolower(preg_replace('/[^A-Za-z0-9-]/', '', (string) $_POST['delete']));
    $ok = pzz_links_update(static function (array &$links) use ($del) {
        if (!isset($links[$del]) || (int) ($links[$del]['clicks'] ?? 0) > 0) return false;
        unset($links[$del]);
        return true;
    });
    header('Location: ' . $self . '?' . http_build_query(['msg' => $ok ? 'deleted' : 'nodelete', 'f' => $_GET['f'] ?? '']), true, 303);
    exit;
}
$msg = ['deleted' => 'Link usunięty. Jego adres prowadzi teraz na stronę nadrzędną.', 'nodelete' => 'Nie usunięto: link ma już kliknięcia albo nie istnieje.'][$_GET['msg'] ?? ''] ?? '';

$now = time();
$STATES = ['active' => ['Aktywne', 'kliknięte lub utworzone w ostatnich 30 dniach'], 'sleeping' => ['Uśpione', '30–180 dni bez kliknięcia'], 'archived' => ['Zarchiwizowane', '180+ dni bez kliknięcia – nadal działają']];
// Domyślnie lista bieżąca (bez zarchiwizowanych); „all” – wszystkie.
$filter = array_key_exists($_GET['f'] ?? '', $STATES) || ($_GET['f'] ?? '') === 'all' ? $_GET['f'] : '';
$q = strtolower(trim((string) ($_GET['q'] ?? '')));

$rows = [];
$counts = array_fill_keys(array_keys($STATES), 0);
foreach (pzz_links_load() as $code => $l) {
    $code = (string) $code;
    $state = pzz_link_state($l, $now);
    $counts[$state]++;
    if ($filter === '' && $state === 'archived') continue;
    if ($filter !== '' && $filter !== 'all' && $state !== $filter) continue;
    $short = pzz_short_url($code, $l['prefix']);
    if ($q !== '' && !str_contains(strtolower($short . ' ' . $l['url']), $q)) continue;
    $rows[] = ['code' => $code, 'short' => $short, 'state' => $state, 'idle' => pzz_link_idle_days($l, $now), 'utm' => pzz_link_utm($l['url'])] + $l;
}
// Najdłużej bez kliknięcia na górze – od razu widać, co leży odłogiem.
usort($rows, static fn ($a, $b) => $b['idle'] <=> $a['idle'] ?: ($b['created'] <=> $a['created']));
$total = array_sum($counts);
$qs = static fn (array $o) => '?' . http_build_query(array_filter(array_merge(['f' => $filter, 'q' => $q], $o)));
$date = static fn ($t) => $t ? date('d.m.Y', (int) $t) : '–';
?>
<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Krótkie linki</title>
<style>
:root{--ink:#1f1a1c;--muted:#5f5559;--line:#e6dde1;--bg:#fbf8f9;--pink:#a3245a;--pink-soft:#f7e6ee;--ok:#2f6f4f;--warn:#8a5a00}
*{box-sizing:border-box}
body{margin:0;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--bg)}
main{max-width:1200px;margin:0 auto;padding:20px 16px 48px}
h1{font-size:22px;margin:0}
.top{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.muted{color:var(--muted);font-size:13px}
a{color:var(--pink)}
.card{background:#fff;border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin-top:14px}
.tabs{display:flex;flex-wrap:wrap;gap:8px}
.tabs a{padding:8px 12px;border:1px solid var(--pink);border-radius:4px;text-decoration:none;min-height:40px;display:inline-flex;align-items:center;gap:6px}
.tabs a[aria-current]{background:var(--pink);color:#fff}
form.search{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
input[type=search]{font:inherit;font-size:16px;padding:8px 10px;border:1px solid #bfb2b8;border-radius:4px;min-height:44px;flex:1 1 240px}
button{font:inherit;font-weight:600;min-height:40px;padding:8px 14px;border:0;border-radius:4px;background:var(--pink);color:#fff;cursor:pointer}
button.ghost{background:transparent;color:var(--pink);border:1px solid var(--pink)}
.scroll{overflow-x:auto;margin-top:14px}
table{border-collapse:collapse;width:100%;font-size:14px;background:#fff}
th,td{border-bottom:1px solid var(--line);padding:8px;text-align:left;vertical-align:top}
th{background:#f4eef1;white-space:nowrap}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.short{font-weight:600;word-break:break-all}
.target{color:var(--muted);font-size:12px;word-break:break-all;max-width:420px}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.b-active{background:#e3f1e9;color:var(--ok)}
.b-sleeping{background:#fdf0d5;color:var(--warn)}
.b-archived{background:#ece7ea;color:var(--muted)}
.note{background:var(--pink-soft);border-radius:6px;padding:10px 12px;font-size:14px;margin-top:14px}
.cp{min-height:32px;padding:4px 10px;font-size:13px}
</style>
</head>
<body>
<main>
  <div class="top">
    <div><h1>Krótkie linki</h1><p class="muted">Kliknięcia liczone bez cookies, bez botów i podglądów linków · czas polski</p></div>
    <a href="../">← Licznik webinaru</a>
  </div>
  <?php if ($msg): ?><p class="note" role="status"><?= h($msg) ?></p><?php endif; ?>

  <div class="card">
    <nav class="tabs" aria-label="Stan linków">
      <a href="<?= h($qs(['f' => ''])) ?>"<?= $filter === '' ? ' aria-current="true"' : '' ?>>Bieżące <b><?= $counts['active'] + $counts['sleeping'] ?></b></a>
      <?php foreach ($STATES as $k => [$label, $hint]): ?>
        <a href="<?= h($qs(['f' => $k])) ?>" title="<?= h($hint) ?>"<?= $filter === $k ? ' aria-current="true"' : '' ?>><?= h($label) ?> <b><?= $counts[$k] ?></b></a>
      <?php endforeach; ?>
      <a href="<?= h($qs(['f' => 'all'])) ?>"<?= $filter === 'all' ? ' aria-current="true"' : '' ?>>Wszystkie <b><?= $total ?></b></a>
    </nav>
    <form class="search" method="get">
      <?php if ($filter): ?><input type="hidden" name="f" value="<?= h($filter) ?>"><?php endif; ?>
      <input type="search" name="q" value="<?= h($q) ?>" placeholder="Szukaj: kod, kampania, źródło, adres…" aria-label="Szukaj linku">
      <button type="submit">Szukaj</button>
    </form>
    <p class="muted" style="margin:8px 0 0">Aktywne – kliknięte lub utworzone w ostatnich 30 dniach · Uśpione – 30–180 dni bez kliknięcia · Zarchiwizowane – 180+ dni bez kliknięcia: znikają z bieżącej listy, ale nadal działają. Usunąć można tylko link bez kliknięć – jego adres prowadzi potem na stronę nadrzędną.</p>
  </div>

  <?php if (!$rows): ?>
    <p class="note"><?= $total ? 'Brak linków dla tego filtra.' : 'Nie ma jeszcze krótkich linków – utwórz je w generatorze UTM przyciskiem „Skróć”.' ?></p>
  <?php else: ?>
  <div class="scroll"><table>
    <thead><tr><th>Krótki link · adres docelowy</th><th>Kampania</th><th>Źródło / medium</th><th>Materiał</th><th class="n">Kliknięcia</th><th class="n">Ostatnie kliknięcie</th><th class="n">Bez kliknięć</th><th>Stan</th><th class="n">Utworzony</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($rows as $r): $u = $r['utm']; ?>
      <tr>
        <td><div class="short"><?= h($r['short']) ?></div><div class="target"><?= h($r['url']) ?></div></td>
        <td><?= h($u['campaign'] ?? '–') ?></td>
        <td><?= h(($u['source'] ?? '–') . ' / ' . ($u['medium'] ?? '–')) ?></td>
        <td><?= h($u['content'] ?? '') ?></td>
        <td class="n"><b><?= (int) $r['clicks'] ?></b></td>
        <td class="n"><?= h($date($r['last'])) ?></td>
        <td class="n"><?= $r['last'] ? $r['idle'] . ' dni' : 'nigdy' ?></td>
        <td><span class="badge b-<?= h($r['state']) ?>"><?= h($STATES[$r['state']][0]) ?></span></td>
        <td class="n"><?= h($date($r['created'])) ?></td>
        <td class="n">
          <button type="button" class="ghost cp" data-copy="<?= h($r['short']) ?>">Kopiuj</button>
          <?php if ((int) $r['clicks'] === 0): ?>
            <form method="post" style="display:inline" onsubmit="return confirm('Usunąć link <?= h($r['code']) ?>? Jego adres będzie prowadził na stronę nadrzędną.')"><button class="ghost cp" name="delete" value="<?= h($r['code']) ?>">Usuń</button></form>
          <?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table></div>
  <?php endif; ?>
</main>
<script>
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  navigator.clipboard?.writeText(b.dataset.copy).then(() => { const t = b.textContent; b.textContent = 'Skopiowano'; setTimeout(() => (b.textContent = t), 1500); });
});
</script>
</body>
</html>
