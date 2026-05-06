<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$rawBody = file_get_contents('php://input');
$event = json_decode($rawBody, true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

if (!is_array($event)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Invalid JSON payload']);
    exit;
}

$paypalClientId = getenv('PAYPAL_CLIENT_ID') ?: '';
$paypalSecret = getenv('PAYPAL_SECRET') ?: '';
$paypalWebhookId = getenv('PAYPAL_WEBHOOK_ID') ?: '';
$paypalBaseUrl = getenv('PAYPAL_BASE_URL') ?: 'https://api-m.paypal.com';

if ($paypalClientId === '' || $paypalSecret === '' || $paypalWebhookId === '') {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Missing PayPal environment variables']);
    exit;
}

$accessToken = getPayPalAccessToken($paypalBaseUrl, $paypalClientId, $paypalSecret);
if ($accessToken === null) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'message' => 'Unable to obtain PayPal access token']);
    exit;
}

$verificationPayload = [
    'auth_algo' => $_SERVER['HTTP_PAYPAL_AUTH_ALGO'] ?? '',
    'cert_url' => $_SERVER['HTTP_PAYPAL_CERT_URL'] ?? '',
    'transmission_id' => $_SERVER['HTTP_PAYPAL_TRANSMISSION_ID'] ?? '',
    'transmission_sig' => $_SERVER['HTTP_PAYPAL_TRANSMISSION_SIG'] ?? '',
    'transmission_time' => $_SERVER['HTTP_PAYPAL_TRANSMISSION_TIME'] ?? '',
    'webhook_id' => $paypalWebhookId,
    'webhook_event' => $event,
];

$verification = postJson(
    $paypalBaseUrl . '/v1/notifications/verify-webhook-signature',
    $verificationPayload,
    $accessToken
);

if (!is_array($verification) || ($verification['verification_status'] ?? '') !== 'SUCCESS') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Webhook signature verification failed']);
    exit;
}

$storePath = __DIR__ . DIRECTORY_SEPARATOR . 'paypal-subscriptions.json';
$subscriptions = file_exists($storePath)
    ? json_decode((string) file_get_contents($storePath), true)
    : [];

if (!is_array($subscriptions)) {
    $subscriptions = [];
}

$eventType = (string) ($event['event_type'] ?? '');
$resource = $event['resource'] ?? [];
$customId = extractCustomId($resource);
$subscriptionId = (string) ($resource['id'] ?? '');

if ($customId !== '') {
    $subscriptions[$customId] = [
        'teacherId' => $customId,
        'subscriptionId' => $subscriptionId,
        'eventType' => $eventType,
        'premiumActive' => isPremiumEvent($eventType),
        'updatedAt' => gmdate('c'),
    ];

    file_put_contents($storePath, json_encode($subscriptions, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

echo json_encode([
    'ok' => true,
    'eventType' => $eventType,
    'teacherId' => $customId,
    'premiumActive' => isPremiumEvent($eventType),
]);

function getPayPalAccessToken(string $baseUrl, string $clientId, string $secret): ?string
{
    $ch = curl_init($baseUrl . '/v1/oauth2/token');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
        CURLOPT_USERPWD => $clientId . ':' . $secret,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Accept-Language: en_US',
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode < 200 || $httpCode >= 300) {
        return null;
    }

    $decoded = json_decode($response, true);
    return is_array($decoded) ? ($decoded['access_token'] ?? null) : null;
}

function postJson(string $url, array $payload, string $accessToken): ?array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken,
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode < 200 || $httpCode >= 300) {
        return null;
    }

    $decoded = json_decode($response, true);
    return is_array($decoded) ? $decoded : null;
}

function extractCustomId(array $resource): string
{
    if (isset($resource['custom_id']) && is_string($resource['custom_id'])) {
        return $resource['custom_id'];
    }

    if (isset($resource['plan_overridden']) && is_array($resource['plan_overridden'])) {
        $customId = $resource['plan_overridden']['custom_id'] ?? '';
        if (is_string($customId)) {
            return $customId;
        }
    }

    return '';
}

function isPremiumEvent(string $eventType): bool
{
    return in_array($eventType, [
        'BILLING.SUBSCRIPTION.ACTIVATED',
        'PAYMENT.SALE.COMPLETED',
    ], true);
}
