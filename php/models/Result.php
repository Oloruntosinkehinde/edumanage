<?php
/**
 * Result Model - EduManage PHP Backend
 */

class Result
{
    private PDO $conn;

    public function __construct(PDO $db)
    {
        $this->conn = $db;
    }

    public function getAll(array $filters = []): array
    {
        $sql = "SELECT * FROM results WHERE 1 = 1";
        $params = [];

        if (!empty($filters['student_id'])) {
            $sql .= " AND student_id = ?";
            $params[] = $filters['student_id'];
        }

        if (!empty($filters['class'])) {
            $sql .= " AND class = ?";
            $params[] = $filters['class'];
        }

        if (!empty($filters['term'])) {
            $sql .= " AND term = ?";
            $params[] = $filters['term'];
        }

        if (!empty($filters['session'])) {
            $sql .= " AND session = ?";
            $params[] = $filters['session'];
        }

        if (!empty($filters['published'])) {
            $sql .= " AND published_at IS NOT NULL";
        }

        $sql .= " ORDER BY recorded_at DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(fn($row) => $this->transformRow($row), $rows);
    }

    public function getById(string $id): ?array
    {
        $stmt = $this->conn->prepare("SELECT * FROM results WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->transformRow($row) : null;
    }

    public function findByStudentSubject(string $studentId, string $subjectId, ?string $term = null, ?string $session = null): ?array
    {
        $sql = "SELECT * FROM results WHERE student_id = ? AND subject_id = ?";
        $params = [$studentId, $subjectId];

        if ($term !== null && $term !== '') {
            $sql .= " AND term = ?";
            $params[] = $term;
        }

        if ($session !== null && $session !== '') {
            $sql .= " AND session = ?";
            $params[] = $session;
        }

        $sql .= " ORDER BY recorded_at DESC LIMIT 1";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->transformRow($row) : null;
    }

    public function create(array $data): array
    {
        $id = $data['id'] ?? $this->generateId();

        $sql = "INSERT INTO results (
                    id, student_id, subject_id, class, session, term,
                    score, grade, remarks, published_at, recorded_at, metadata
                ) VALUES (
                    :id, :student_id, :subject_id, :class, :session, :term,
                    :score, :grade, :remarks, :published_at, :recorded_at, :metadata
                )";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':student_id' => $data['student_id'],
            ':subject_id' => $data['subject_id'],
            ':class' => $data['class'] ?? null,
            ':session' => $data['session'] ?? null,
            ':term' => $data['term'] ?? null,
            ':score' => $data['score'] ?? null,
            ':grade' => $data['grade'] ?? null,
            ':remarks' => $data['remarks'] ?? null,
            ':published_at' => $data['published_at'] ?? null,
            ':recorded_at' => $data['recorded_at'] ?? date('Y-m-d H:i:s'),
            ':metadata' => $this->encodeJson($data['metadata'] ?? [])
        ]);

        return $this->getById($id);
    }

    public function update(string $id, array $data): ?array
    {
        $existing = $this->getById($id);
        if (!$existing) {
            return null;
        }

        $sql = "UPDATE results SET
                    student_id = :student_id,
                    subject_id = :subject_id,
                    class = :class,
                    session = :session,
                    term = :term,
                    score = :score,
                    grade = :grade,
                    remarks = :remarks,
                    published_at = :published_at,
                    metadata = :metadata,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':student_id' => $data['student_id'] ?? $existing['student_id'],
            ':subject_id' => $data['subject_id'] ?? $existing['subject_id'],
            ':class' => $data['class'] ?? $existing['class'],
            ':session' => $data['session'] ?? $existing['session'],
            ':term' => $data['term'] ?? $existing['term'],
            ':score' => $data['score'] ?? $existing['score'],
            ':grade' => $data['grade'] ?? $existing['grade'],
            ':remarks' => $data['remarks'] ?? $existing['remarks'],
            ':published_at' => $data['published_at'] ?? $existing['published_at'],
            ':metadata' => $this->encodeJson($data['metadata'] ?? $existing['metadata']),
            ':id' => $id
        ]);

        return $this->getById($id);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->conn->prepare("DELETE FROM results WHERE id = ?");
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
        $row['metadata'] = $row['metadata'] ? json_decode($row['metadata'], true) ?? [] : [];
        return $row;
    }

    private function generateId(): string
    {
        return 'R' . strtoupper(bin2hex(random_bytes(4)));
    }
}
?>
