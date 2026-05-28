# Quick check: can this PC (and your phone) reach the Symfony API?
param(
    [string]$ApiHost = "192.168.5.200",
    [int]$Port = 8000
)

$urls = @(
    "http://127.0.0.1:$Port",
    "http://${ApiHost}:$Port"
)

foreach ($url in $urls) {
    Write-Host "Testing $url ..." -NoNewline
    try {
        $r = Invoke-WebRequest -Uri $url -TimeoutSec 4 -UseBasicParsing
        Write-Host " OK ($($r.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "Physical phone: set DEV_API_HOST in src/config/env.ts to your Wi-Fi IPv4 (ipconfig)."
Write-Host "If 127.0.0.1 works but LAN IP fails, start Symfony on all interfaces:"
Write-Host "  php -S 0.0.0.0:8000 -t public"
Write-Host "  symfony server:start --port=8000 --no-tls --allow-all-ip"
