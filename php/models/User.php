<?php
/**
 * User Model - Tophill Portal PHP Backend
 */

class User {
    private $conn;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function create($data) {
        $sql = "INSERT INTO users (username, password, email, role, full_name, status) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($sql);
        
        $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
        
        return $stmt->execute([
            $data['username'],
            $password_hash,
            $data['email'] ?? null,
            $data['role'] ?? 'student',
            $data['full_name'] ?? null,
            $data['status'] ?? 'active'
        ]);
    }
    
    public function authenticate($username, $password) {
        $sql = "SELECT * FROM users WHERE username = ? AND status = 'active'";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$username]);
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            // Remove password from returned data
            unset($user['password']);
            return $user;
        }
        
        return false;
    }
    
    public function findById($id) {
        $sql = "SELECT * FROM users WHERE id = ? AND status = 'active'";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$id]);
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            unset($user['password']);
        }
        
        return $user;
    }
    
    public function findByUsername($username) {
        $sql = "SELECT * FROM users WHERE username = ? AND status = 'active'";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$username]);
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            unset($user['password']);
        }
        
        return $user;
    }
    
    public function updateLastLogin($user_id) {
        $sql = "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([$user_id]);
    }
    
    public function getAll($filters = []) {
        $sql = "SELECT id, username, email, role, full_name, status, created_at FROM users WHERE 1=1";
        $params = [];
        
        if (!empty($filters['role'])) {
            $sql .= " AND role = ?";
            $params[] = $filters['role'];
        }
        
        if (!empty($filters['status'])) {
            $sql .= " AND status = ?";
            $params[] = $filters['status'];
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>