<#
.SYNOPSIS
自动循环git push，失败10秒重试，直到推送成功
#>
while ($true) {
    Write-Host "`n=================== 开始执行 git push ===================" -ForegroundColor Cyan
    git push
    # $LASTEXITCODE 捕获git命令返回码，0=成功，非0=失败
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ git push 推送成功！脚本退出" -ForegroundColor Green
        break
    }
    Write-Host "❌ git push 失败，10秒后重试..." -ForegroundColor Red
    Start-Sleep -Seconds 10
}