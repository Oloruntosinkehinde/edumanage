<?php
/**
 * Subject Model - EduManage PHP Backend
 */

class Subject
{
    private PDO $conn;

    public function __construct(PDO $db)
    {
        $this->conn = $db;
    }

    public function getAll(array $filters = []): array
    {
        $sql = "SELECT * FROM subjects WHERE 1 = 1";
        $params = [];

        if (!empty($filters['department'])) {
            $sql .= " AND department = ?";
            $params[] = $filters['department'];
        }

        if (!empty($filters['level'])) {
            $sql .= " AND level = ?";
            $params[] = $filters['level'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (code LIKE ? OR title LIKE ?)";
            $term = '%' . $filters['search'] . '%';
            $params[] = $term;
            $params[] = $term;
        }

        $sql .= " ORDER BY sort_order ASC, title ASC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(fn($row) => $this->transformRow($row), $rows);
    }

    public function getById(string $id): ?array
    {
        $stmt = $this->conn->prepare("SELECT * FROM subjects WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->transformRow($row) : null;
    }

    public function getByCode(string $code): ?array
    {
        $stmt = $this->conn->prepare("SELECT * FROM subjects WHERE code = ? LIMIT 1");
        $stmt->execute([$code]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->transformRow($row) : null;
    }

    public function create(array $data): array
    {
        $id = $data['id'] ?? $this->generateId();

        $sql = "INSERT INTO subjects (
                    id, code, title, description, department, level,
                    credits, teacher_ids, schedule_json, sort_order, status
                ) VALUES (
                    :id, :code, :title, :description, :department, :level,
                    :credits, :teacher_ids, :schedule_json, :sort_order, :status
                )";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':code' => $data['code'] ?? null,
            ':title' => $data['title'] ?? 'Untitled Subject',
            ':description' => $data['description'] ?? null,
            ':department' => $data['department'] ?? null,
            ':level' => $data['level'] ?? null,
            ':credits' => $data['credits'] ?? 0,
            ':teacher_ids' => $this->encodeJson($data['teacher_ids'] ?? []),
            ':schedule_json' => $this->encodeJson($data['schedule'] ?? []),
            ':sort_order' => $data['sort_order'] ?? 0,
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

        $sql = "UPDATE subjects SET
                    code = :code,
                    title = :title,
                    description = :description,
                    department = :department,
                    level = :level,
                    credits = :credits,
                    teacher_ids = :teacher_ids,
                    schedule_json = :schedule_json,
                    sort_order = :sort_order,
                    status = :status,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':code' => $data['code'] ?? $existing['code'],
            ':title' => $data['title'] ?? $existing['title'],
            ':description' => $data['description'] ?? $existing['description'],
            ':department' => $data['department'] ?? $existing['department'],
            ':level' => $data['level'] ?? $existing['level'],
            ':credits' => $data['credits'] ?? $existing['credits'],
            ':teacher_ids' => $this->encodeJson($data['teacher_ids'] ?? $existing['teacher_ids']),
            ':schedule_json' => $this->encodeJson($data['schedule'] ?? $existing['schedule']),
            ':sort_order' => $data['sort_order'] ?? $existing['sort_order'],
            ':status' => $data['status'] ?? $existing['status'],
            ':id' => $id
        ]);

        return $this->getById($id);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->conn->prepare("DELETE FROM subjects WHERE id = ?");
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
        $row['teacher_ids'] = $row['teacher_ids'] ? json_decode($row['teacher_ids'], true) ?? [] : [];
        $row['schedule'] = $row['schedule_json'] ? json_decode($row['schedule_json'], true) ?? [] : [];
        unset($row['schedule_json']);
        return $row;
    }

    private function generateId(): string
    {
    return 'SUB' . strtoupper(bin2hex(random_bytes(3)));
    }
}
?>
