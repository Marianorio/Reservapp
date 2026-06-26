# Reservapp - Script de configuración de PostgreSQL
# Ejecutar como ADMINISTRADOR (clic derecho -> "Ejecutar como administrador")

$pgVersion = "18"
$pgDataDir = "C:\Program Files\PostgreSQL\$pgVersion\data"
$pgBinDir = "C:\Program Files\PostgreSQL\$pgVersion\bin"
$pgHba = "$pgDataDir\pg_hba.conf"
$backupHba = "$pgDataDir\pg_hba.conf.reservapp.bak"
$newPassword = "Kriptonita"

Write-Host "=== Configuración de PostgreSQL para Reservapp ===" -ForegroundColor Cyan

# 1. Backup pg_hba.conf
Write-Host "[1/5] Respaldando pg_hba.conf..." -ForegroundColor Yellow
Copy-Item -Path $pgHba -Destination $backupHba -Force

# 2. Cambiar auth a 'trust' temporalmente
Write-Host "[2/5] Configurando autenticación temporal (trust)..." -ForegroundColor Yellow
$content = Get-Content $pgHba
$content = $content -replace 'scram-sha-256', 'trust'
Set-Content -Path $pgHba -Value $content

# 3. Reiniciar PostgreSQL
Write-Host "[3/5] Reiniciando servicio PostgreSQL..." -ForegroundColor Yellow
Restart-Service -Name "postgresql-$pgVersion" -Force

# 4. Crear base de datos y tabla
Write-Host "[4/5] Creando base de datos y tabla 'reservations'..." -ForegroundColor Yellow
& "$pgBinDir\psql.exe" -U postgres -c "CREATE DATABASE reservapp;" 2>$null
& "$pgBinDir\psql.exe" -U postgres -d reservapp -f "$PSScriptRoot\schema.sql"

# 5. Establecer nueva contraseña
Write-Host "[5/5] Estableciendo contraseña para postgres..." -ForegroundColor Yellow
& "$pgBinDir\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD '$newPassword';"

# 6. Restaurar pg_hba.conf original
Write-Host "[6/6] Restaurando configuración de seguridad original..." -ForegroundColor Yellow
Copy-Item -Path $backupHba -Destination $pgHba -Force
Remove-Item -Path $backupHba -Force
Restart-Service -Name "postgresql-$pgVersion" -Force

Write-Host "`n=== Configuración completada ===" -ForegroundColor Green
Write-Host "Usuario: postgres" -ForegroundColor Green
Write-Host "Contraseña: $newPassword" -ForegroundColor Green
Write-Host "Base de datos: reservapp" -ForegroundColor Green
Write-Host "`nAhora puedes iniciar el servidor con: node backend\server.js" -ForegroundColor Cyan
