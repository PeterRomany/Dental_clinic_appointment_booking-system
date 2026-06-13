#!/usr/bin/env bash
set -e

echo "=== تشغيل نظام عيادة الأسنان ==="

# Backend
echo "[1/2] تشغيل الخادم الخلفي..."
cd backend
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

sleep 3

# Frontend
echo "[2/2] تشغيل الواجهة الأمامية..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ الخادم الخلفي يعمل على: http://localhost:8000"
echo "✓ الواجهة الأمامية: http://localhost:3000"
echo "  - واجهة المساعد: http://localhost:3000/assistant"
echo "  - واجهة الطبيب: http://localhost:3000/doctor"
echo ""
echo "اضغط Ctrl+C لإيقاف جميع الخدمات"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
