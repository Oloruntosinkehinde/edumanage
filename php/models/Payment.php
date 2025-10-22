<?php
/**
 * Payment Model - Tophill Portal PHP Backend
 */

class Payment
{
    private PDO $conn;

    public function __construct(PDO $db)
    {
        $this->conn = $db;
    }

    public function getAll(array $filters = []): array
    {
        $sql = "SELECT * FROM payments WHERE 1 = 1";
        $params = [];

        if (!empty($filters['student_id'])) {
            $sql .= " AND student_id = ?";
            $params[] = $filters['student_id'];
        }

        if (!empty($filters['status'])) {
            $sql .= " AND status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['type'])) {
            $sql .= " AND payment_type = ?";
            $params[] = $filters['type'];
        }

        if (!empty($filters['from_date'])) {
            $sql .= " AND payment_date >= ?";
            $params[] = $filters['from_date'];
        }

        if (!empty($filters['to_date'])) {
            $sql .= " AND payment_date <= ?";
            $params[] = $filters['to_date'];
        }

        $sql .= " ORDER BY payment_date DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(fn($row) => $this->transformRow($row), $rows);
    }

    public function getById(string $id): ?array
    {
        $stmt = $this->conn->prepare("SELECT * FROM payments WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->transformRow($row) : null;
    }

    public function create(array $data): array
    {
        $id = $data['id'] ?? $this->generateId();

        $sql = "INSERT INTO payments (
                    id, student_id, invoice_no, payment_type, currency,
                    amount, balance, description, payment_date, status,
                    meta
                ) VALUES (
                    :id, :student_id, :invoice_no, :payment_type, :currency,
                    :amount, :balance, :description, :payment_date, :status,
                    :meta
                )";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':student_id' => $data['student_id'],
            ':invoice_no' => $data['invoice_no'] ?? $this->generateInvoiceNumber(),
            ':payment_type' => $data['payment_type'] ?? 'tuition',
            ':currency' => $data['currency'] ?? 'USD',
            ':amount' => $data['amount'] ?? 0,
            ':balance' => $data['balance'] ?? 0,
            ':description' => $data['description'] ?? null,
            ':payment_date' => $data['payment_date'] ?? date('Y-m-d'),
            ':status' => $data['status'] ?? 'pending',
            ':meta' => $this->encodeJson($data['meta'] ?? [])
        ]);

        return $this->getById($id);
    }

    public function update(string $id, array $data): ?array
    {
        $existing = $this->getById($id);
        if (!$existing) {
            return null;
        }

        $sql = "UPDATE payments SET
                    student_id = :student_id,
                    invoice_no = :invoice_no,
                    payment_type = :payment_type,
                    currency = :currency,
                    amount = :amount,
                    balance = :balance,
                    description = :description,
                    payment_date = :payment_date,
                    status = :status,
                    meta = :meta,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':student_id' => $data['student_id'] ?? $existing['student_id'],
            ':invoice_no' => $data['invoice_no'] ?? $existing['invoice_no'],
            ':payment_type' => $data['payment_type'] ?? $existing['payment_type'],
            ':currency' => $data['currency'] ?? $existing['currency'],
            ':amount' => $data['amount'] ?? $existing['amount'],
            ':balance' => $data['balance'] ?? $existing['balance'],
            ':description' => $data['description'] ?? $existing['description'],
            ':payment_date' => $data['payment_date'] ?? $existing['payment_date'],
            ':status' => $data['status'] ?? $existing['status'],
            ':meta' => $this->encodeJson($data['meta'] ?? $existing['meta']),
            ':id' => $id
        ]);

        return $this->getById($id);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->conn->prepare("DELETE FROM payments WHERE id = ?");
        return $stmt->execute([$id]);
    }

    private function encodeJson($value): string
    {
        if (is_string($value)) {
            return $value;
        }

        return json_encode($value ?? [], JSON_UNESCAPED_UNICODE);
    }

    private function transformRow(array $row): array
    {
        $row['meta'] = $row['meta'] ? json_decode($row['meta'], true) ?? [] : [];
        return $row;
    }

    private function generateId(): string
    {
        return 'PAY' . strtoupper(bin2hex(random_bytes(3)));
    }

    private function generateInvoiceNumber(): string
    {
        return 'INV-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
    }
}
?>
