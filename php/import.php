<?php
/**
 * CSV Import Endpoint for EduManage
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/Student.php';
require_once __DIR__ . '/models/Teacher.php';
require_once __DIR__ . '/models/Subject.php';
require_once __DIR__ . '/models/Result.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

$database = new Database();
$db = $database->getConnection();

$payload = json_decode(file_get_contents('php://input'), true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON payload'
    ]);
    exit();
}

$type = $payload['type'] ?? null;
$records = $payload['records'] ?? null;
$options = $payload['options'] ?? [];

if (!$type || !is_array($records)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Payload must include "type" and "records"'
    ]);
    exit();
}

$type = strtolower(trim($type));

$auth = AuthMiddleware::checkAuth(['admin', 'admin2']);
if (!$auth['success']) {
    $statusCode = str_contains(strtolower($auth['message']), 'permission') ? 403 : 401;
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'message' => $auth['message']
    ]);
    exit();
}

$relatedSummaries = [];
if (!empty($payload['references']) && is_array($payload['references'])) {
    $relatedSummaries = processReferenceImports($db, $payload['references'], $options);
}

try {
    switch ($type) {
        case 'students':
            $result = importStudents($db, $records, $options);
            break;
        case 'teachers':
            $result = importTeachers($db, $records, $options);
            break;
        case 'subjects':
            $result = importSubjects($db, $records, $options);
            break;
        case 'results':
            $session = $payload['session'] ?? null;
            $term = $payload['term'] ?? null;
            $result = importResults($db, $records, $session, $term, $options);
            break;
        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Unsupported import type: ' . $type
            ]);
            exit();
    }

    if (!empty($relatedSummaries)) {
        $result['relatedImports'] = $relatedSummaries;
    }

    $result['importedBy'] = [
        'user_id' => $auth['user']['user_id'] ?? null,
        'username' => $auth['user']['username'] ?? null,
        'role' => $auth['user']['role'] ?? null
    ];

    echo json_encode($result, JSON_PRETTY_PRINT);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Import failed: ' . $error->getMessage(),
        'errors' => [$error->getMessage()]
    ], JSON_PRETTY_PRINT);
}

function importStudents(PDO $db, array $records, array $options = []): array
{
    $model = new Student($db);
    $subjectModel = new Subject($db);
    $summary = initialiseSummary();
    $skipDuplicates = !empty($options['skipDuplicates']);
    $subjectCache = [];

    foreach ($records as $index => $raw) {
        try {
            $data = mapStudentRow($raw);

            if (!$data['name']) {
                throw new RuntimeException('Missing student name');
            }

            if (!empty($data['subjects'])) {
                [$validSubjects, $missingSubjects] = filterExistingSubjects($subjectModel, $data['subjects'], $subjectCache);
                if ($missingSubjects) {
                    $summary['warnings'][] = formatRowWarning($index, 'Unknown subject codes removed: ' . implode(', ', $missingSubjects));
                }
                $data['subjects'] = $validSubjects;
            }

            $existing = null;
            if (!empty($data['id'])) {
                $existing = $model->getById($data['id']);
            }
            if (!$existing && !empty($data['email'])) {
                $existing = $model->getByEmail($data['email']);
            }

            if ($existing) {
                if ($skipDuplicates) {
                    $summary['skipped']++;
                    continue;
                }
                $model->update($existing['id'], $data);
                $summary['updated']++;
            } else {
                $created = $model->create($data);
                $data['id'] = $created['id'];
                $summary['imported']++;
            }
        } catch (Throwable $e) {
            $summary['errors'][] = formatRowError($index, $e->getMessage());
            $summary['skipped']++;
        }
    }

    $summary['data'] = $model->getAll();
    $summary['success'] = ($summary['imported'] + $summary['updated']) > 0;
    $summary['message'] = sprintf('Students import completed. Imported: %d, Updated: %d, Skipped: %d', $summary['imported'], $summary['updated'], $summary['skipped']);

    return $summary;
}

function importTeachers(PDO $db, array $records, array $options = []): array
{
    $model = new Teacher($db);
    $subjectModel = new Subject($db);
    $summary = initialiseSummary();
    $skipDuplicates = !empty($options['skipDuplicates']);
    $subjectCache = [];

    foreach ($records as $index => $raw) {
        try {
            $data = mapTeacherRow($raw);

            if (!$data['name']) {
                throw new RuntimeException('Missing teacher name');
            }

            if (!empty($data['subjects'])) {
                [$validSubjects, $missingSubjects] = filterExistingSubjects($subjectModel, $data['subjects'], $subjectCache);
                if ($missingSubjects) {
                    $summary['warnings'][] = formatRowWarning($index, 'Unknown subject codes ignored: ' . implode(', ', $missingSubjects));
                }
                $data['subjects'] = $validSubjects;
            }

            $existing = null;
            if (!empty($data['id'])) {
                $existing = $model->getById($data['id']);
            }
            if (!$existing && !empty($data['email'])) {
                $existing = $model->getByEmail($data['email']);
            }

            if ($existing) {
                if ($skipDuplicates) {
                    $summary['skipped']++;
                    continue;
                }
                $model->update($existing['id'], $data);
                $summary['updated']++;
            } else {
                $created = $model->create($data);
                $data['id'] = $created['id'];
                $summary['imported']++;
            }
        } catch (Throwable $e) {
            $summary['errors'][] = formatRowError($index, $e->getMessage());
            $summary['skipped']++;
        }
    }

    $summary['data'] = $model->getAll();
    $summary['success'] = ($summary['imported'] + $summary['updated']) > 0;
    $summary['message'] = sprintf('Teachers import completed. Imported: %d, Updated: %d, Skipped: %d', $summary['imported'], $summary['updated'], $summary['skipped']);

    return $summary;
}

function importSubjects(PDO $db, array $records, array $options = []): array
{
    $model = new Subject($db);
    $teacherModel = new Teacher($db);
    $summary = initialiseSummary();
    $skipDuplicates = !empty($options['skipDuplicates']);
    $teacherCache = [];

    foreach ($records as $index => $raw) {
        try {
            $data = mapSubjectRow($raw);

            if (!$data['code']) {
                throw new RuntimeException('Missing subject code');
            }

            if (!empty($data['teacher_ids'])) {
                [$validTeacherIds, $missingTeacherIds] = filterExistingTeachers($teacherModel, $data['teacher_ids'], $teacherCache);
                if ($missingTeacherIds) {
                    $summary['warnings'][] = formatRowWarning($index, 'Unknown teacher IDs ignored: ' . implode(', ', $missingTeacherIds));
                }
                $data['teacher_ids'] = $validTeacherIds;
            }

            $existing = null;
            if (!empty($data['id'])) {
                $existing = $model->getById($data['id']);
            }
            if (!$existing) {
                $existing = $model->getByCode($data['code']);
            }

            if ($existing) {
                if ($skipDuplicates) {
                    $summary['skipped']++;
                    continue;
                }
                $model->update($existing['id'], $data);
                $summary['updated']++;
            } else {
                $model->create($data);
                $summary['imported']++;
            }
        } catch (Throwable $e) {
            $summary['errors'][] = formatRowError($index, $e->getMessage());
            $summary['skipped']++;
        }
    }

    $summary['data'] = $model->getAll();
    $summary['success'] = ($summary['imported'] + $summary['updated']) > 0;
    $summary['message'] = sprintf('Subjects import completed. Imported: %d, Updated: %d, Skipped: %d', $summary['imported'], $summary['updated'], $summary['skipped']);

    return $summary;
}

function importResults(PDO $db, array $records, ?string $session = null, ?string $term = null, array $options = []): array
{
    $resultModel = new Result($db);
    $studentModel = new Student($db);
    $subjectModel = new Subject($db);
    $summary = initialiseSummary();
    $skipDuplicates = !empty($options['skipDuplicates']);

    foreach ($records as $index => $raw) {
        try {
            $data = mapResultRow($raw, $session, $term);

            if (!$data['student_id']) {
                throw new RuntimeException('Missing student ID');
            }
            if (!$data['subject_code']) {
                throw new RuntimeException('Missing subject code');
            }

            $student = $studentModel->getById($data['student_id']);
            if (!$student) {
                throw new RuntimeException('Student not found: ' . $data['student_id']);
            }

            $subject = $subjectModel->getByCode($data['subject_code']);
            if (!$subject) {
                throw new RuntimeException('Subject not found for code: ' . $data['subject_code']);
            }

            $payload = [
                'id' => $data['id'] ?? null,
                'student_id' => $data['student_id'],
                'subject_id' => $subject['id'],
                'class' => $data['class'] ?? null,
                'session' => $data['session'] ?? null,
                'term' => $data['term'] ?? null,
                'score' => $data['score'],
                'grade' => $data['grade'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'published_at' => $data['published_at'] ?? null,
                'recorded_at' => $data['recorded_at'] ?? date('Y-m-d H:i:s'),
                'metadata' => $data['metadata'] ?? []
            ];

            $existing = null;
            if (!empty($payload['id'])) {
                $existing = $resultModel->getById($payload['id']);
            }
            if (!$existing) {
                $existing = $resultModel->findByStudentSubject(
                    $payload['student_id'],
                    $payload['subject_id'],
                    $payload['term'],
                    $payload['session']
                );
            }

            if ($existing) {
                if ($skipDuplicates) {
                    $summary['skipped']++;
                    continue;
                }
                $resultModel->update($existing['id'], $payload);
                $summary['updated']++;
            } else {
                $resultModel->create($payload);
                $summary['imported']++;
            }
        } catch (Throwable $e) {
            $summary['errors'][] = formatRowError($index, $e->getMessage());
            $summary['skipped']++;
        }
    }

    $summary['data'] = $resultModel->getAll();
    $summary['success'] = ($summary['imported'] + $summary['updated']) > 0;
    $summary['message'] = sprintf('Results import completed. Imported: %d, Updated: %d, Skipped: %d', $summary['imported'], $summary['updated'], $summary['skipped']);

    return $summary;
}

function initialiseSummary(): array
{
    return [
        'success' => false,
        'message' => '',
        'imported' => 0,
        'updated' => 0,
        'skipped' => 0,
        'errors' => [],
        'warnings' => [],
        'data' => []
    ];
}

function formatRowError(int $index, string $message): string
{
    return sprintf('Row %d: %s', $index + 2, $message); // +2 accounts for header and zero index
}

function formatRowWarning(int $index, string $message): string
{
    return sprintf('Row %d: %s', $index + 2, $message);
}

function mapStudentRow(array $row): array
{
    $subjects = $row['subjects'] ?? null;
    if (is_string($subjects)) {
        $subjects = explodeDelimited($subjects);
    }
    if (is_array($subjects)) {
        $subjects = normaliseSubjectCodes($subjects);
    }

    return [
        'id' => trim($row['id'] ?? '') ?: null,
        'name' => trim($row['name'] ?? ''),
        'email' => strtolower(trim($row['email'] ?? '')) ?: null,
        'class' => trim($row['class'] ?? '') ?: null,
        'guardian' => trim($row['guardian'] ?? '') ?: null,
        'phone' => trim($row['phone'] ?? '') ?: null,
        'address' => trim($row['address'] ?? '') ?: null,
        'date_of_birth' => normaliseDate($row['dateOfBirth'] ?? $row['date_of_birth'] ?? null),
        'enrollment_date' => normaliseDate($row['enrollmentDate'] ?? $row['enrollment_date'] ?? null),
        'status' => normaliseStatus($row['status'] ?? 'active'),
        'subjects' => $subjects ?? []
    ];
}

function mapTeacherRow(array $row): array
{
    $subjects = explodeDelimited($row['subjects'] ?? '');
    $subjects = normaliseSubjectCodes($subjects);

    return [
        'id' => trim($row['id'] ?? '') ?: null,
        'name' => trim($row['name'] ?? ''),
        'email' => strtolower(trim($row['email'] ?? '')) ?: null,
        'subjects' => $subjects,
        'classes' => explodeDelimited($row['classes'] ?? ''),
        'phone' => trim($row['phone'] ?? '') ?: null,
        'qualification' => trim($row['qualification'] ?? '') ?: null,
        'experience' => trim($row['experience'] ?? '') ?: null,
        'join_date' => normaliseDate($row['joinDate'] ?? $row['join_date'] ?? null),
        'status' => normaliseStatus($row['status'] ?? 'active')
    ];
}

function mapSubjectRow(array $row): array
{
    $teacherIds = explodeDelimited($row['teacherId'] ?? $row['teacher_ids'] ?? '');
    $teacherIds = normaliseTeacherIds($teacherIds);

    return [
        'id' => trim($row['id'] ?? '') ?: null,
        'code' => strtoupper(trim($row['code'] ?? '')),
        'title' => trim($row['name'] ?? $row['title'] ?? ''),
        'description' => trim($row['description'] ?? '') ?: null,
        'credits' => isset($row['credits']) ? (int)$row['credits'] : 0,
        'status' => normaliseStatus($row['status'] ?? 'active'),
        'teacher_ids' => $teacherIds,
        'schedule' => []
    ];
}

function mapResultRow(array $row, ?string $session, ?string $term): array
{
    $status = strtolower(trim($row['status'] ?? ''));

    return [
        'id' => trim($row['id'] ?? '') ?: null,
        'student_id' => trim($row['studentId'] ?? $row['student_id'] ?? ''),
        'subject_code' => strtoupper(trim($row['subjectCode'] ?? $row['subject_code'] ?? '')),
        'class' => trim($row['class'] ?? $row['className'] ?? ''),
        'session' => $row['session'] ?? $session,
        'term' => $row['term'] ?? $term,
        'score' => isset($row['marks']) ? (float)$row['marks'] : (isset($row['score']) ? (float)$row['score'] : null),
        'grade' => trim($row['grade'] ?? ''),
        'remarks' => trim($row['remark'] ?? $row['remarks'] ?? ''),
        'published_at' => $status === 'published' ? (normaliseDateTime($row['examDate'] ?? null) ?? date('Y-m-d H:i:s')) : null,
        'recorded_at' => normaliseDateTime($row['recordedAt'] ?? null),
        'metadata' => [
            'exam_type' => $row['examType'] ?? null,
            'max_score' => isset($row['maxMarks']) ? (float)$row['maxMarks'] : null,
            'status' => $status ?: null,
            'source' => 'csv-import',
            'raw' => $row
        ]
    ];
}

function explodeDelimited($value): array
{
    if (is_array($value)) {
        return array_values(array_filter(array_map('trim', $value), static fn($item) => $item !== ''));
    }

    $value = trim((string)$value);
    if ($value === '') {
        return [];
    }

    $parts = preg_split('/[;,]/', $value) ?: [];
    return array_values(array_filter(array_map('trim', $parts), static fn($item) => $item !== ''));
}

function normaliseDate(?string $date): ?string
{
    if (!$date) {
        return null;
    }

    $date = trim($date);
    if ($date === '') {
        return null;
    }

    $timestamp = strtotime($date);
    if ($timestamp === false) {
        return null;
    }

    return date('Y-m-d', $timestamp);
}

function normaliseDateTime(?string $dateTime): ?string
{
    if (!$dateTime) {
        return null;
    }

    $timestamp = strtotime($dateTime);
    if ($timestamp === false) {
        return null;
    }

    return date('Y-m-d H:i:s', $timestamp);
}

function normaliseStatus(?string $status): string
{
    $status = strtolower(trim($status ?? 'active'));
    $allowed = ['active', 'inactive', 'suspended', 'graduated', 'draft', 'published'];
    return in_array($status, $allowed, true) ? $status : 'active';
}

function normaliseSubjectCodes(array $codes): array
{
    $normalised = [];

    foreach ($codes as $code) {
        $value = strtoupper(trim((string)$code));
        if ($value === '') {
            continue;
        }
        $normalised[$value] = $value;
    }

    return array_values($normalised);
}

function normaliseTeacherIds(array $references): array
{
    $normalised = [];

    foreach ($references as $reference) {
        $value = trim((string)$reference);
        if ($value === '') {
            continue;
        }

        if (str_contains($value, '@')) {
            $key = strtolower($value);
            $normalised[$key] = strtolower($value);
        } else {
            $key = strtoupper($value);
            $normalised[$key] = strtoupper($value);
        }
    }

    return array_values($normalised);
}

function filterExistingSubjects(Subject $subjectModel, array $codes, array &$cache): array
{
    $valid = [];
    $missing = [];

    foreach ($codes as $code) {
        $cacheKey = strtoupper($code);

        if (array_key_exists($cacheKey, $cache)) {
            if ($cache[$cacheKey]) {
                $valid[] = $cache[$cacheKey]['code'];
            } else {
                $missing[] = $code;
            }
            continue;
        }

        $subject = $subjectModel->getByCode($code) ?? $subjectModel->getById($code);

        if ($subject) {
            $cache[$cacheKey] = $subject;
            $valid[] = $subject['code'];
        } else {
            $cache[$cacheKey] = false;
            $missing[] = $code;
        }
    }

    return [array_values(array_unique($valid)), $missing];
}

function filterExistingTeachers(Teacher $teacherModel, array $references, array &$cache): array
{
    $valid = [];
    $missing = [];

    foreach ($references as $reference) {
        $isEmail = str_contains($reference, '@');
        $cacheKey = $isEmail ? strtolower($reference) : strtoupper($reference);

        if (array_key_exists($cacheKey, $cache)) {
            if ($cache[$cacheKey]) {
                $valid[] = $cache[$cacheKey];
            } else {
                $missing[] = $reference;
            }
            continue;
        }

        $teacher = $isEmail
            ? $teacherModel->getByEmail(strtolower($reference))
            : $teacherModel->getById($reference);

        if (!$teacher && !$isEmail) {
            $teacher = $teacherModel->getByEmail(strtolower($reference));
        }

        if ($teacher) {
            $cache[$cacheKey] = $teacher['id'];
            $valid[] = $teacher['id'];
        } else {
            $cache[$cacheKey] = false;
            $missing[] = $reference;
        }
    }

    return [array_values(array_unique($valid)), $missing];
}

function processReferenceImports(PDO $db, array $references, array $parentOptions = []): array
{
    $summaries = [];

    foreach ($references as $index => $reference) {
        if (!is_array($reference) || empty($reference['type']) || !is_array($reference['records'])) {
            $summaries[] = [
                'success' => false,
                'message' => sprintf('Invalid reference payload at index %d', $index),
                'type' => $reference['type'] ?? 'unknown',
                'imported' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => ['Reference entry must include "type" and "records"'],
                'warnings' => [],
                'data' => []
            ];
            continue;
        }

        $nestedSummaries = [];
        if (!empty($reference['references']) && is_array($reference['references'])) {
            $nestedSummaries = processReferenceImports($db, $reference['references'], $parentOptions);
        }

        $summary = executeImportByType($db, $reference, $parentOptions);

        if (!empty($nestedSummaries)) {
            $summaries = array_merge($summaries, $nestedSummaries);
        }

        if ($summary !== null) {
            $summaries[] = $summary;
        }
    }

    return $summaries;
}

function executeImportByType(PDO $db, array $payload, array $parentOptions = []): ?array
{
    $type = strtolower(trim($payload['type'] ?? ''));
    $records = $payload['records'] ?? null;

    if (!$type || !is_array($records)) {
        return [
            'success' => false,
            'message' => 'Invalid reference entry: type or records missing',
            'type' => $type ?: 'unknown',
            'imported' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => ['Reference entry must include "type" and "records"'],
            'warnings' => [],
            'data' => []
        ];
    }

    $options = array_merge($parentOptions, $payload['options'] ?? []);

    switch ($type) {
        case 'students':
            $summary = importStudents($db, $records, $options);
            break;
        case 'teachers':
            $summary = importTeachers($db, $records, $options);
            break;
        case 'subjects':
            $summary = importSubjects($db, $records, $options);
            break;
        case 'results':
            $session = $payload['session'] ?? null;
            $term = $payload['term'] ?? null;
            $summary = importResults($db, $records, $session, $term, $options);
            break;
        default:
            return [
                'success' => false,
                'message' => 'Unsupported reference import type: ' . $type,
                'type' => $type,
                'imported' => 0,
                'updated' => 0,
                'skipped' => count($records),
                'errors' => ['Unsupported import type'],
                'warnings' => [],
                'data' => []
            ];
    }

    $summary['type'] = $type;

    if (!empty($payload['references']) && is_array($payload['references'])) {
        $summary['relatedImports'] = processReferenceImports($db, $payload['references'], $options);
    }

    return $summary;
}
