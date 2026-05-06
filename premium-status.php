<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$teacherId = $_GET['teacherId'] ?? '';
$storePath = __DIR__ . DIRECTORY_SEPARATOR . 'paypal-subscriptions.json';

if (!is_string($teacherId) || $teacherId === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Missing teacherId']);
    exit;
}

if (!file_exists($storePath)) {
    echo json_encode(['ok' => true, 'premiumActive' => false]);
    exit;
}

$subscriptions = json_decode((string) file_get_contents($storePath), true);
if (!is_array($subscriptions)) {
    echo json_encode(['ok' => true, 'premiumActive' => false]);
    exit;
}

$record = $subscriptions[$teacherId] ?? null;
if (!is_array($record)) {
    echo json_encode(['ok' => true, 'premiumActive' => false]);
    exit;
}

echo json_encode([
    'ok' => true,
    'premiumActive' => (bool) ($record['premiumActive'] ?? false),
    'subscriptionId' => $record['subscriptionId'] ?? '',
    'eventType' => $record['eventType'] ?? '',
    'updatedAt' => $record['updatedAt'] ?? '',
]);
