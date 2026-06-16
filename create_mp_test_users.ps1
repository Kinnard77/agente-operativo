# =====================================================
# Crea usuarios de prueba de MercadoPago via API
# NO requiere email real, teléfono, ni verificación de identidad.
# =====================================================

# Pega aquí tu Access Token de producción de MP (el de 75 chars)
$MP_TOKEN = "APP_USR-6641248465707582-020501-55f13ed3654f888875b1f62a26e71fbe-3182506063"

$headers = @{
    "Authorization"     = "Bearer $MP_TOKEN"
    "Content-Type"      = "application/json"
    "X-Idempotency-Key" = [System.Guid]::NewGuid().ToString()
}

$body = '{ "site_id": "MLM" }'   # MLM = México

Write-Host "`n🔨 Creando usuario VENDEDOR de prueba..." -ForegroundColor Cyan
$seller = Invoke-RestMethod -Method POST -Uri "https://api.mercadopago.com/users/test" -Headers $headers -Body $body
Write-Host "✅ VENDEDOR  email: $($seller.email)  pass: $($seller.password)" -ForegroundColor Green

# Nueva idempotency key para el segundo usuario
$headers["X-Idempotency-Key"] = [System.Guid]::NewGuid().ToString()

Write-Host "`n🔨 Creando usuario COMPRADOR de prueba..." -ForegroundColor Cyan
$buyer = Invoke-RestMethod -Method POST -Uri "https://api.mercadopago.com/users/test" -Headers $headers -Body $body
Write-Host "✅ COMPRADOR email: $($buyer.email)  pass: $($buyer.password)" -ForegroundColor Green

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "PASO SIGUIENTE:" -ForegroundColor Yellow
Write-Host "1. Abre ventana de incógnito → inicia sesión como VENDEDOR en mercadopago.com.mx"
Write-Host "2. En otra ventana incógnito → abre tu web de reservas como COMPRADOR"
Write-Host "3. Usa esta tarjeta de prueba:"
Write-Host "   Número:     4009 1753 3280 6176"
Write-Host "   CVV:        123"
Write-Host "   Vencimiento: 11/25"
Write-Host "   Nombre:     APRO   (aprueba el pago)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"
