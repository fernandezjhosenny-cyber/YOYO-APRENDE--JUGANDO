# PayPal Premium Setup

## Estado actual
- El frontend ya carga tu boton real de PayPal con `hostedButtonId`.
- La app tambien acepta un retorno por URL con `?premium_teacher=<ID>&premium_status=activated`.
- Se incluye una base de backend PHP para webhook real:
  - `paypal-webhook.php`
  - `premium-status.php`

## Variables necesarias en el servidor
- `PAYPAL_CLIENT_ID`
- `PAYPAL_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_BASE_URL`
  Usa `https://api-m.sandbox.paypal.com` en Sandbox o `https://api-m.paypal.com` en Live.

## Webhook en PayPal
En tu app REST de PayPal Business crea un webhook hacia:

`https://TU-DOMINIO/paypal-webhook.php`

Suscribe al menos estos eventos:
- `BILLING.SUBSCRIPTION.ACTIVATED`
- `PAYMENT.SALE.COMPLETED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`

## Como se marca premium
- El webhook verifica la firma con PayPal.
- Si el evento indica una suscripcion activa o un pago completado, guarda el estado en `paypal-subscriptions.json`.
- `premium-status.php?teacherId=...` expone ese estado para que el frontend lo consulte.

## Importante
- Para vinculacion automatica exacta entre pago y docente, tu boton o flujo de checkout debe enviar un identificador propio del docente como `custom_id` o un dato equivalente que reaparezca en el webhook.
- Hosted Buttons no siempre exponen ese dato con la flexibilidad de una integracion completa de Subscriptions API. Si quieres una vinculacion fuerte por docente, la migracion ideal es a `client-id + plan_id + backend propio`.
