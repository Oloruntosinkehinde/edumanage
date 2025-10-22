-- Feeds and Notifications Schema
-- Add this to your existing schema

CREATE TABLE IF NOT EXISTS feeds (
    id VARCHAR(40) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    content TEXT,
    author_id VARCHAR(40),
    category ENUM('announcement', 'news', 'event', 'assignment', 'result', 'general') DEFAULT 'general',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    target_type VARCHAR(20) DEFAULT 'all',
    target_ids JSON NULL,
    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME NULL,
    is_pinned TINYINT(1) DEFAULT 0,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_feeds_category (category),
    INDEX idx_feeds_publish_date (publish_date),
    INDEX idx_feeds_target_type (target_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feed_reads (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    feed_id VARCHAR(40) NOT NULL,
    user_id VARCHAR(40) NOT NULL,
    is_read TINYINT(1) DEFAULT 1,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_feed_user (feed_id, user_id),
    CONSTRAINT fk_feed_reads_feed FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE,
    INDEX idx_feed_reads_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(40) PRIMARY KEY,
    user_id VARCHAR(40) NOT NULL,
    title VARCHAR(150) NOT NULL,
    content TEXT,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    related_entity_type VARCHAR(30) NULL,
    related_entity_id VARCHAR(40) NULL,
    is_read TINYINT(1) DEFAULT 0,
    read_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;