<?php
/**
 * Teacher Model - EduManage PHP Backend
 */

class Teacher
{
    private PDO $conn;

    public function __construct(PDO $db)
    {
        $this->conn = $db;
    }

    public function getAll(array $filters = []): array
    {
        $sql = "SELECT * FROM teachers WHERE 1 = 1";
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= " AND status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['class'])) {
            $sql .= " AND classes LIKE ?";
            $params[] = '%' . $filters['class'] . '%';
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (name LIKE ? OR email LIKE ? OR id LIKE ?)";
            $term = '%' . $filters['search'] . '%';
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(fn($row) => $this->transformRow($row), $rows);
    }

    public function getById(string $id): ?array
    {
        $stmt = $this->conn->prepare("SELECT * FROM teachers WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->transformRow($row) : null;
    }

    public function getByEmail(string $email): ?array
    {
        $stmt = $this->conn->prepare("SELECT * FROM teachers WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->transformRow($row) : null;
    }

    public function create(array $data): array
    {
        $id = $data['id'] ?? $this->generateId();

        $sql = "INSERT INTO teachers (
                    id, name, email, subjects, classes, phone, qualification,
                    experience, join_date, status
                ) VALUES (
                    :id, :name, :email, :subjects, :classes, :phone, :qualification,
                    :experience, :join_date, :status
                )";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':name' => $data['name'] ?? 'Unnamed Teacher',
            ':email' => $data['email'] ?? null,
            ':subjects' => $this->encodeJson($data['subjects'] ?? []),
            ':classes' => $this->encodeJson($data['classes'] ?? []),
            ':phone' => $data['phone'] ?? null,
            ':qualification' => $data['qualification'] ?? null,
            ':experience' => $data['experience'] ?? null,
            ':join_date' => $data['join_date'] ?? null,
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

        $sql = "UPDATE teachers SET
                    name = :name,
                    email = :email,
                    subjects = :subjects,
                    classes = :classes,
                    phone = :phone,
                    qualification = :qualification,
                    experience = :experience,
                    join_date = :join_date,
                    status = :status,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':name' => $data['name'] ?? $existing['name'],
            ':email' => $data['email'] ?? $existing['email'],
            ':subjects' => $this->encodeJson($data['subjects'] ?? $existing['subjects']),
            ':classes' => $this->encodeJson($data['classes'] ?? $existing['classes']),
            ':phone' => $data['phone'] ?? $existing['phone'],
            ':qualification' => $data['qualification'] ?? $existing['qualification'],
            ':experience' => $data['experience'] ?? $existing['experience'],
            ':join_date' => $data['join_date'] ?? $existing['join_date'],
            ':status' => $data['status'] ?? $existing['status'],
            ':id' => $id
        ]);

        return $this->getById($id);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->conn->prepare("DELETE FROM teachers WHERE id = ?");
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
        $row['classes'] = $row['classes'] ? json_decode($row['classes'], true) ?? [] : [];
        return $row;
    }

    private function generateId(): string
    {
        return 'T' . strtoupper(bin2hex(random_bytes(3)));
    }
}
?>
