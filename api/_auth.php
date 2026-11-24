<?php
/**
 * Wspólne logowanie panelu licznika (licznik/), panelu linków (licznik/linki/) i API skracacza (licznik/api.php).
 * Jedno hasło: w repo tylko skrót bcrypt; podmiana plikiem ~/integrations-keys/.licznik-webinar-hash.
 * Ciasteczko (tylko dla panelu): ważność + podpis HMAC, kluczem jest skrót hasła z serwera.
 */
declare(strict_types=1);

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/_stats.php';

const PZZ_DEFAULT_HASH = '$2y$12$uIfnZraUp9WwuokXQ5t/RusLhEkR6a4QPutNpeZCQbtyykpXqIoH6';
const PZZ_AUTH_COOKIE = 'pzz_licznik';
const PZZ_AUTH_DAYS = 30;

function pzz_pass_hash(): string
{
    $file = dirname(__DIR__, 3) . '/integrations-keys/.licznik-webinar-hash';
    $h = is_readable($file) ? trim((string) file_get_contents($file)) : '';
    return str_starts_with($h, '$2') ? $h : PZZ_DEFAULT_HASH;
}

function pzz_auth_token(int $exp): string
{
    return $exp . '.' . hash_hmac('sha256', 'licznik|' . $exp, pzz_pass_hash());
}

function pzz_logged_in(): bool
{
    $c = (string) ($_COOKIE[PZZ_AUTH_COOKIE] ?? '');
    [$exp] = explode('.', $c, 2) + [''];
    return ctype_digit($exp) && (int) $exp > time() && hash_equals(pzz_auth_token((int) $exp), $c);
}

/** Ścieżka ciasteczka: katalog licznik/ (obejmuje licznik/, licznik/linki/ i licznik/api.php). */
function pzz_auth_path(): string
{
    $script = $_SERVER['SCRIPT_NAME'] ?? '/';
    $pos = strpos($script, '/licznik/');
    return $pos === false ? '/' : substr($script, 0, $pos) . '/licznik/';
}

function pzz_auth_set_cookie(string $value, int $exp): void
{
    setcookie(PZZ_AUTH_COOKIE, $value, [
        'expires' => $exp,
        'path' => pzz_auth_path(),
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https',
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

/** Logowanie: true = zalogowano; 'limit' = za dużo prób; false = złe hasło. */
function pzz_login(string $password): bool|string
{
    if (pzz_rate_limited('licznik-login', 10, 900)) return 'limit';
    if (!password_verify($password, pzz_pass_hash())) return false;
    $exp = time() + PZZ_AUTH_DAYS * 86400;
    pzz_auth_set_cookie(pzz_auth_token($exp), $exp);
    return true;
}

function pzz_logout(): void
{
    pzz_auth_set_cookie('', time() - 3600);
}
