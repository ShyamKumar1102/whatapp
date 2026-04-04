@echo off
echo.
echo ========================================
echo   CRM Deploy to EC2 - 51.20.126.140
echo ========================================
echo.

set PEM=C:\Users\shyam11\Downloads\Mee.pem
set EC2=ec2-user@51.20.126.140

echo [1/4] Pushing latest code to GitHub...
git add .
git commit -m "deploy: update %date% %time%"
git push origin main
echo Done.
echo.

echo [2/4] Pulling latest code on EC2...
ssh -i "%PEM%" -o StrictHostKeyChecking=no %EC2% "cd /home/ec2-user/crm && git pull origin main"
echo Done.
echo.

echo [3/4] Building frontend and installing dependencies on EC2...
ssh -i "%PEM%" -o StrictHostKeyChecking=no %EC2% "cd /home/ec2-user/crm && npm install && npm run build && cd backend && npm install"
echo Done.
echo.

echo [4/4] Restarting backend...
ssh -i "%PEM%" -o StrictHostKeyChecking=no %EC2% "pm2 restart crm-backend && pm2 save"
echo Done.
echo.

echo ========================================
echo   Deploy Complete!
echo   Visit: http://51.20.126.140
echo ========================================
echo.
pause
