Write-Host "=== تشغيل نظام عيادة الأسنان ===" -ForegroundColor Cyan

# Start backend
Write-Host "[1/2] تشغيل الخادم الخلفي..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location -LiteralPath $using:PWD\backend
    pip install -r requirements.txt | Out-Null
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
}

Start-Sleep -Seconds 3

# Start frontend
Write-Host "[2/2] تشغيل الواجهة الأمامية..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location -LiteralPath $using:PWD\frontend
    npm install | Out-Null
    npm run dev
}

Write-Host "`n✓ الخادم الخلفي يعمل على: http://localhost:8000" -ForegroundColor Green
Write-Host "✓ الواجهة الأمامية: http://localhost:3000" -ForegroundColor Green
Write-Host "  - واجهة المساعد: http://localhost:3000/assistant" -ForegroundColor Green
Write-Host "  - واجهة الطبيب: http://localhost:3000/doctor" -ForegroundColor Green
Write-Host "`nاضغط Ctrl+C لإيقاف جميع الخدمات" -ForegroundColor Cyan

Wait-Job $backendJob, $frontendJob
