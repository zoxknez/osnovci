$job = Start-Job { Set-Location "D:\ProjektiApp\osnovci"; npm run dev }
$job.Id | Out-File dev-server.pid
Write-Host "Server started! Job ID: $($job.Id)"
Write-Host "Check status: Get-Job $($job.Id)"
Write-Host "Stop server: Stop-Job $($job.Id); Remove-Job $($job.Id)"
