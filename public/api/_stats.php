<?php
/**
 * Wspólne funkcje licznika etapów (api/track.php i licznik-webinar/index.php).
 * Plik danych leży POZA public_html: ~/webinar-stats/events.jsonl (albo katalog z PZZ_STATS_DIR).
 * Bez adresów IP, e-maili i imion – tylko nazwa zdarzenia, UTM-y, typ urządzenia i aplikacji.
 */
declare(strict_types=1);

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

const PZZ_STATS_MAX_BYTES = 30 * 1024 * 1024;

function pzz_stats_dir(): string
{
    $env = getenv('PZZ_STATS_DIR');
    if ($env) return rtrim($env, '/');
    // public_html/webinar/api → katalog domowy konta (jak klucz MailerLite w ~/integrations-keys).
    return dirname(__DIR__, 3) . '/webinar-stats';
}

function pzz_stats_file(): string
{
    return pzz_stats_dir() . '/events.jsonl';
}

/** Dopisuje jedno zdarzenie (z blokadą pliku). Zwraca false, gdy zapis się nie udał. */
function pzz_stats_append(array $row): bool
{
    $dir = pzz_stats_dir();
    if (!is_dir($dir) && !@mkdir($dir, 0700, true)) {
        error_log('pzz track: nie mogę utworzyć ' . $dir);
        return false;
    }
    $file = pzz_stats_file();
    if (is_file($file) && filesize($file) > PZZ_STATS_MAX_BYTES) return false;
    $line = json_encode($row, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
    return @file_put_contents($file, $line, FILE_APPEND | LOCK_EX) !== false;
}

/** Wszystkie zdarzenia (generator – plik może być duży). */
function pzz_stats_read(): iterable
{
    $file = pzz_stats_file();
    if (!is_file($file)) return;
    $h = @fopen($file, 'rb');
    if (!$h) return;
    flock($h, LOCK_SH);
    while (($line = fgets($h)) !== false) {
        $row = json_decode($line, true);
        if (is_array($row)) yield $row;
    }
    flock($h, LOCK_UN);
    fclose($h);
}

/** Prosty limit zdarzeń na adres w oknie czasowym (plik tymczasowy z hashem IP, kasowany przez system). */
function pzz_rate_limited(string $bucket, int $max, int $windowSec): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $file = sys_get_temp_dir() . '/pzz-' . $bucket . '-' . sha1($ip . '|pzz-' . $bucket);
    $now = time();
    $hits = array_filter(explode(',', (string) @file_get_contents($file)), fn ($t) => $t !== '' && (int) $t > $now - $windowSec);
    if (count($hits) >= $max) return true;
    $hits[] = (string) $now;
    @file_put_contents($file, implode(',', $hits), LOCK_EX);
    return false;
}
