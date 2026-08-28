<#
.SYNOPSIS
自动循环git push，失败10秒重试，直到推送成功
#>
while ($true) {
    Write-Host "`n=================== Start git push ===================" -ForegroundColor Cyan
    git push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "git push succeeded! Script exit" -ForegroundColor Green
        break
    }
    Write-Host "git push failed, retry after 10 seconds..." -ForegroundColor Red
    Start-Sleep -Seconds 10
}