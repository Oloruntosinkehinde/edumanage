-- Tophill Portal MySQL Schema (XAMPP Ready)
-- ------------------------------------
-- This script bootstraps the core tables required by the PHP backend.
-- Usage (from MySQL shell / phpMyAdmin):
--   SOURCE path/to/mysql-schema.sql;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    role ENUM('admin', 'teacher', 'student', 'parent', 'staff') DEFAULT 'student',
    full_name VARCHAR(150),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    class VARCHAR(40),
    subjects JSON NULL,
    guardian VARCHAR(150),
    phone VARCHAR(40),
    address TEXT,
    date_of_birth DATE,
    enrollment_date DATE,
    status ENUM('active', 'inactive', 'graduated', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_students_class (class),
    INDEX idx_students_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teachers (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    subjects JSON NULL,
    classes JSON NULL,
    phone VARCHAR(40),
    qualification VARCHAR(255),
    experience VARCHAR(100),
    join_date DATE,
    status ENUM('active', 'inactive', 'retired', 'sabbatical') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(20) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    level VARCHAR(50),
    credits TINYINT UNSIGNED DEFAULT 0,
    teacher_ids JSON NULL,
    schedule_json JSON NULL,
    sort_order SMALLINT DEFAULT 0,
    status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS results (
    id VARCHAR(40) PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    subject_id VARCHAR(20) NOT NULL,
    class VARCHAR(40),
    session VARCHAR(20),
    term VARCHAR(50),
    score DECIMAL(5,2) DEFAULT 0,
    grade VARCHAR(5),
    remarks TEXT,
    published_at DATETIME NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_results_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_results_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    INDEX idx_results_student (student_id),
    INDEX idx_results_term (term),
    INDEX idx_results_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(40) PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    invoice_no VARCHAR(30) NOT NULL UNIQUE,
    payment_type VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'USD',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    payment_date DATE,
    status ENUM('pending', 'paid', 'partial', 'failed', 'refunded') DEFAULT 'pending',
    meta JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    INDEX idx_payments_student (student_id),
    INDEX idx_payments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_items (
    id VARCHAR(40) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    mandatory TINYINT(1) DEFAULT 0,
    term VARCHAR(50),
    session VARCHAR(20),
    classes JSON NULL,
    status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance_student_date (student_id, attendance_date),
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSON NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

-- Seed baseline settings if the table is empty
INSERT INTO settings (setting_key, setting_value)
SELECT 'school_profile', JSON_OBJECT(
           'name', 'Tophill Portal School',
           'address', '123 Education Avenue, Learning City',
           'contact_email', 'admin@Tophill Portal.test',
           'contact_phone', '+1 (555) 010-2025'
       )
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE setting_key = 'school_profile');

INSERT INTO settings (setting_key, setting_value)
SELECT 'academic_calendar', JSON_OBJECT(
           'current_session', '2025-2026',
           'current_term', 'First Term',
           'terms', JSON_ARRAY('First Term', 'Second Term', 'Third Term'),
           'sessions', JSON_ARRAY('2024-2025', '2025-2026', '2026-2027')
       )
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE setting_key = 'academic_calendar');
