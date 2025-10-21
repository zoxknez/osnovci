# Pokreni dev server u pozadini kao PowerShell Job#!/usr/bin/env pwsh

# Script za pokretanje dev servera u pozadini

$logFile = "dev-server.log"

$pidFile = "dev-server.pid"$logFile = "dev-server.log"

$pidFile = "dev-server.pid"

Write-Host "Pokrecem dev server u pozadini..." -ForegroundColor Green

Write-Host "🚀 Pokrećem dev server u pozadini..." -ForegroundColor Green

# Ubij postojeće Node procese

Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force# Ubij postojeće Node procese

Write-Host "Stari Node procesi uklonjeni" -ForegroundColor YellowGet-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "✅ Stari Node procesi uklonjeni" -ForegroundColor Yellow

# Pokreni server kao Job

$job = Start-Job -ScriptBlock {# Pokreni server kao Job

    Set-Location $using:PWD$job = Start-Job -ScriptBlock {

    npm run dev 2>&1 | Tee-Object -FilePath "dev-server.log"    Set-Location $using:PWD

}    npm run dev 2>&1 | Tee-Object -FilePath "dev-server.log"

}

# Sačuvaj Job ID

$job.Id | Out-File -FilePath $pidFile -NoNewline# Sačuvaj Job ID

$job.Id | Out-File -FilePath $pidFile -NoNewline

Write-Host "Server pokrenut! Job ID: $($job.Id)" -ForegroundColor Green

Write-Host "Logovi: $logFile" -ForegroundColor CyanWrite-Host "✅ Server pokrenut! Job ID: $($job.Id)" -ForegroundColor Green

Write-Host "Proveri status: powershell -File check-server.ps1"Write-Host "📝 Logovi: $logFile" -ForegroundColor Cyan

Write-Host "" 
Write-Host "Komande:" -ForegroundColor Yellow
Write-Host "  - Proveri status: .\check-server.ps1" -ForegroundColor White  
Write-Host "  - Vidi logove: Get-Content dev-server.log -Tail 20 -Wait" -ForegroundColor White  
Write-Host "  - Zaustavi server: .\stop-server.ps1" -ForegroundColor White  
