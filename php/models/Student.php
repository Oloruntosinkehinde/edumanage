<?php
/**
 * Student Model - Tophill Portal PHP Backend
 */

class Student
{
    private PDO $conn;

    public function __construct(PDO $db)
    {
        $this->conn = $db;
    }

    public function getAll(array $filters = []): array
    {
        $sql = "SELECT * FROM students WHERE 1 = 1";
        $params = [];

        if (!empty($filters['class'])) {
            $sql .= " AND class = ?";
            $params[] = $filters['class'];
        }

        if (!empty($filters['status'])) {
            $sql .= " AND status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (name LIKE ? OR email LIKE ? OR id LIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(fn($row) => $this->transformRow($row), $rows);
    }

    public function getById(string $id): ?array
    {
        $stmt = $this->conn->prepare("SELECT * FROM students WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->transformRow($row) : null;
    }

    public function getByEmail(string $email): ?array
    {
        $stmt = $this->conn->prepare("SELECT * FROM students WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->transformRow($row) : null;
    }

    public function create(array $data): array
    {
        $id = $data['id'] ?? $this->generateId();

        $sql = "INSERT INTO students (
                    id, name, email, class, subjects, guardian, phone, address,
                    date_of_birth, enrollment_date, status
                ) VALUES (
                    :id, :name, :email, :class, :subjects, :guardian, :phone, :address,
                    :date_of_birth, :enrollment_date, :status
                )";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':name' => $data['name'] ?? 'Unnamed Student',
            ':email' => $data['email'] ?? null,
            ':class' => $data['class'] ?? null,
            ':subjects' => $this->encodeJson($data['subjects'] ?? []),
            ':guardian' => $data['guardian'] ?? null,
            ':phone' => $data['phone'] ?? null,
            ':address' => $data['address'] ?? null,
            ':date_of_birth' => $data['date_of_birth'] ?? null,
            ':enrollment_date' => $data['enrollment_date'] ?? date('Y-m-d'),
            ':status' => $data['status'] ?? 'active'
        ]);

        return $this->getById($id);
    }

    public function update(string $id, array $data): ?array
    {
        $existing = $this->getById($id);
        if (!$existing) {
            return null;
        }

        $sql = "UPDATE students SET
                    name = :name,
                    email = :email,
                    class = :class,
                    subjects = :subjects,
                    guardian = :guardian,
                    phone = :phone,
                    address = :address,
                    date_of_birth = :date_of_birth,
                    enrollment_date = :enrollment_date,
                    status = :status,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':name' => $data['name'] ?? $existing['name'],
            ':email' => $data['email'] ?? $existing['email'],
            ':class' => $data['class'] ?? $existing['class'],
            ':subjects' => $this->encodeJson($data['subjects'] ?? $existing['subjects']),
            ':guardian' => $data['guardian'] ?? $existing['guardian'],
            ':phone' => $data['phone'] ?? $existing['phone'],
            ':address' => $data['address'] ?? $existing['address'],
            ':date_of_birth' => $data['date_of_birth'] ?? $existing['date_of_birth'],
            ':enrollment_date' => $data['enrollment_date'] ?? $existing['enrollment_date'],
            ':status' => $data['status'] ?? $existing['status'],
            ':id' => $id
        ]);

        return $this->getById($id);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->conn->prepare("DELETE FROM students WHERE id = ?");
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
        $row['subjects'] = $row['subjects'] ? json_decode($row['subjects'], true) ?? [] : [];
        return $row;
    }

    private function generateId(): string
    {
        return 'S' . strtoupper(bin2hex(random_bytes(3)));
    }
}
?>
