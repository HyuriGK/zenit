@echo off
echo Parando processos Node.js...
taskkill /F /IM node.exe >nul 2>&1

echo Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo Regenerando Prisma Client...
npx prisma generate

echo.
echo Prisma Client regenerado com sucesso!
echo Agora voce pode iniciar o servidor novamente com: npm run dev
pause
