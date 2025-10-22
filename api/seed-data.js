const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edumanage'
};

async function seedDatabase() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected successfully\n');

    // Check if data already exists
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      console.log('⚠️  Database already has data. Clearing existing data...');
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query('TRUNCATE TABLE feed_reads');
      await connection.query('TRUNCATE TABLE notifications');
      await connection.query('TRUNCATE TABLE payment_items');
      await connection.query('TRUNCATE TABLE payments');
      await connection.query('TRUNCATE TABLE results');
      await connection.query('TRUNCATE TABLE attendance');
      await connection.query('TRUNCATE TABLE feeds');
      await connection.query('TRUNCATE TABLE students');
      await connection.query('TRUNCATE TABLE teachers');
      await connection.query('TRUNCATE TABLE subjects');
      await connection.query('TRUNCATE TABLE users');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ Existing data cleared\n');
    }

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Insert Users
    console.log('1. Inserting users...');
    const userInserts = [
      // Admin
      ['admin', 'admin@edumanage.com', 'Admin User', 'admin', hashedPassword, 'active'],
      // Teachers
      ['john.doe', 'john.doe@edumanage.com', 'John Doe', 'teacher', hashedPassword, 'active'],
      ['jane.smith', 'jane.smith@edumanage.com', 'Jane Smith', 'teacher', hashedPassword, 'active'],
      ['mike.wilson', 'mike.wilson@edumanage.com', 'Mike Wilson', 'teacher', hashedPassword, 'active'],
      // Students
      ['alice.j', 'alice.johnson@student.edu', 'Alice Johnson', 'student', hashedPassword, 'active'],
      ['bob.b', 'bob.brown@student.edu', 'Bob Brown', 'student', hashedPassword, 'active'],
      ['charlie.d', 'charlie.davis@student.edu', 'Charlie Davis', 'student', hashedPassword, 'active'],
      ['diana.e', 'diana.evans@student.edu', 'Diana Evans', 'student', hashedPassword, 'active'],
      ['eve.f', 'eve.foster@student.edu', 'Eve Foster', 'student', hashedPassword, 'active']
    ];

    for (const user of userInserts) {
      await connection.query(
        'INSERT INTO users (username, email, full_name, role, password, status) VALUES (?, ?, ?, ?, ?, ?)',
        user
      );
    }
    console.log(`✅ Inserted ${userInserts.length} users\n`);

    // 2. Insert Subjects
    console.log('2. Inserting subjects...');
    const subjectInserts = [
      ['SUBJ001', 'MATH101', 'Mathematics 101', 'Introduction to Algebra and Calculus', 'Mathematics', 'Beginner', 3, '[]', null, 1, 'active'],
      ['SUBJ002', 'ENG101', 'English Literature', 'Classic and Modern Literature', 'English', 'Beginner', 3, '[]', null, 2, 'active'],
      ['SUBJ003', 'SCI101', 'General Science', 'Physics, Chemistry, and Biology Basics', 'Science', 'Beginner', 4, '[]', null, 3, 'active'],
      ['SUBJ004', 'HIST101', 'World History', 'Ancient to Modern History', 'History', 'Beginner', 2, '[]', null, 4, 'active'],
      ['SUBJ005', 'CS101', 'Computer Science', 'Introduction to Programming', 'Computer Science', 'Beginner', 4, '[]', null, 5, 'active']
    ];

    for (const subject of subjectInserts) {
      await connection.query(
        'INSERT INTO subjects (id, code, title, description, department, level, credits, teacher_ids, schedule_json, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        subject
      );
    }
    console.log(`✅ Inserted ${subjectInserts.length} subjects\n`);

    // 3. Insert Teachers
    console.log('3. Inserting teachers...');
    const teacherInserts = [
      ['TCH001', 'John Doe', 'john.doe@edumanage.com', '["MATH101", "CS101"]', '["Grade 10", "Grade 11"]', '+1234567890', 'MSc Mathematics', '5 years', '2020-01-15', 'active'],
      ['TCH002', 'Jane Smith', 'jane.smith@edumanage.com', '["ENG101", "HIST101"]', '["Grade 9", "Grade 10"]', '+1234567891', 'MA English Literature', '8 years', '2017-08-20', 'active'],
      ['TCH003', 'Mike Wilson', 'mike.wilson@edumanage.com', '["SCI101"]', '["Grade 9", "Grade 10", "Grade 11"]', '+1234567892', 'PhD Physics', '12 years', '2013-09-01', 'active']
    ];

    for (const teacher of teacherInserts) {
      await connection.query(
        'INSERT INTO teachers (id, name, email, subjects, classes, phone, qualification, experience, join_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        teacher
      );
    }
    console.log(`✅ Inserted ${teacherInserts.length} teachers\n`);

    // Update subjects with teacher_ids
    await connection.query('UPDATE subjects SET teacher_ids = \'["TCH001"]\' WHERE id IN ("SUBJ001", "SUBJ005")');
    await connection.query('UPDATE subjects SET teacher_ids = \'["TCH002"]\' WHERE id IN ("SUBJ002", "SUBJ004")');
    await connection.query('UPDATE subjects SET teacher_ids = \'["TCH003"]\' WHERE id = "SUBJ003"');

    // 4. Insert Students
    console.log('4. Inserting students...');
    const studentInserts = [
      ['STU001', 'Alice Johnson', 'alice.johnson@student.edu', 'Grade 10', '["SUBJ001", "SUBJ002", "SUBJ003"]', 'Robert Johnson', '+1234560001', '123 Oak St', null, '2022-09-01', 'active'],
      ['STU002', 'Bob Brown', 'bob.brown@student.edu', 'Grade 10', '["SUBJ001", "SUBJ005", "SUBJ003"]', 'Sarah Brown', '+1234560002', '456 Pine St', null, '2022-09-01', 'active'],
      ['STU003', 'Charlie Davis', 'charlie.davis@student.edu', 'Grade 9', '["SUBJ002", "SUBJ004", "SUBJ003"]', 'Michael Davis', '+1234560003', '789 Elm St', null, '2023-09-01', 'active'],
      ['STU004', 'Diana Evans', 'diana.evans@student.edu', 'Grade 11', '["SUBJ001", "SUBJ002", "SUBJ005"]', 'Laura Evans', '+1234560004', '321 Maple Ave', null, '2021-09-01', 'active'],
      ['STU005', 'Eve Foster', 'eve.foster@student.edu', 'Grade 10', '["SUBJ001", "SUBJ004", "SUBJ003"]', 'James Foster', '+1234560005', '654 Birch Rd', null, '2022-09-01', 'active']
    ];

    for (const student of studentInserts) {
      await connection.query(
        'INSERT INTO students (id, name, email, class, subjects, guardian, phone, address, date_of_birth, enrollment_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        student
      );
    }
    console.log(`✅ Inserted ${studentInserts.length} students\n`);

    // 5. Insert Results
    console.log('5. Inserting results...');
    const resultInserts = [
      ['RES001', 'STU001', 'SUBJ001', 'Grade 10', '2023-2024', 'Term 1', 85, 'A', 'Excellent work', '2024-03-15', '2024-03-01', null],
      ['RES002', 'STU001', 'SUBJ002', 'Grade 10', '2023-2024', 'Term 1', 78, 'B', 'Good effort', '2024-03-15', '2024-03-01', null],
      ['RES003', 'STU001', 'SUBJ003', 'Grade 10', '2023-2024', 'Term 1', 92, 'A+', 'Outstanding', '2024-03-15', '2024-03-01', null],
      ['RES004', 'STU002', 'SUBJ001', 'Grade 10', '2023-2024', 'Term 1', 88, 'A', 'Very good', '2024-03-15', '2024-03-01', null],
      ['RES005', 'STU002', 'SUBJ005', 'Grade 10', '2023-2024', 'Term 1', 95, 'A+', 'Exceptional', '2024-03-15', '2024-03-01', null],
      ['RES006', 'STU003', 'SUBJ002', 'Grade 9', '2023-2024', 'Term 1', 72, 'B-', 'Needs improvement', '2024-03-15', '2024-03-01', null],
      ['RES007', 'STU003', 'SUBJ004', 'Grade 9', '2023-2024', 'Term 1', 80, 'A-', 'Good progress', '2024-03-15', '2024-03-01', null],
      ['RES008', 'STU004', 'SUBJ001', 'Grade 11', '2023-2024', 'Term 1', 90, 'A', 'Excellent', '2024-03-15', '2024-03-01', null],
      ['RES009', 'STU004', 'SUBJ002', 'Grade 11', '2023-2024', 'Term 1', 85, 'A', 'Very good', '2024-03-15', '2024-03-01', null],
      ['RES010', 'STU005', 'SUBJ001', 'Grade 10', '2023-2024', 'Term 1', 75, 'B', 'Good', '2024-03-15', '2024-03-01', null]
    ];

    for (const result of resultInserts) {
      await connection.query(
        'INSERT INTO results (id, student_id, subject_id, class, session, term, score, grade, remarks, published_at, recorded_at, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        result
      );
    }
    console.log(`✅ Inserted ${resultInserts.length} results\n`);

    // 6. Insert Payments
    console.log('6. Inserting payments...');
    const paymentInserts = [
      ['PAY001', 'STU001', 'INV2023-001', 'Tuition Fee', 'USD', 5000.00, 0.00, 'Tuition Fee - Term 1', '2023-09-15', 'completed', '{"term": "Term 1", "year": "2023-2024", "method": "card"}'],
      ['PAY002', 'STU002', 'INV2023-002', 'Tuition Fee', 'USD', 5000.00, 0.00, 'Tuition Fee - Term 1', '2023-09-20', 'completed', '{"term": "Term 1", "year": "2023-2024", "method": "bank_transfer"}'],
      ['PAY003', 'STU003', 'INV2023-003', 'Tuition Fee', 'USD', 5000.00, 2000.00, 'Tuition Fee - Term 1', '2023-09-25', 'partial', '{"term": "Term 1", "year": "2023-2024", "method": "cash"}'],
      ['PAY004', 'STU004', 'INV2023-004', 'Tuition Fee', 'USD', 5000.00, 0.00, 'Tuition Fee - Term 1', '2023-09-10', 'completed', '{"term": "Term 1", "year": "2023-2024", "method": "card"}'],
      ['PAY005', 'STU005', 'INV2023-005', 'Tuition Fee', 'USD', 5000.00, 2500.00, 'Tuition Fee - Term 1', '2023-09-30', 'partial', '{"term": "Term 1", "year": "2023-2024", "method": "bank_transfer"}']
    ];

    for (const payment of paymentInserts) {
      await connection.query(
        'INSERT INTO payments (id, student_id, invoice_no, payment_type, currency, amount, balance, description, payment_date, status, meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        payment
      );
    }
    console.log(`✅ Inserted ${paymentInserts.length} payments\n`);

    // 7. Insert Feeds
    console.log('7. Inserting feeds...');
    const feedInserts = [
      ['FEED001', 'Welcome to EduManage', 'Welcome to the new school year! We are excited to have you here.', 'ADM001', 'announcement', 'high', 'all', null, '2023-09-01', null, 1, '{}'],
      ['FEED002', 'Math Assignment Due', 'Don\'t forget to submit your Math assignment by Friday.', 'TCH001', 'assignment', 'medium', 'class', '["Grade 10A"]', '2023-09-10', '2023-09-15', 0, '{"subject": "MATH101"}'],
      ['FEED003', 'Sports Day Event', 'Join us for Sports Day on October 15th!', 'ADM001', 'event', 'medium', 'all', null, '2023-10-01', '2023-10-15', 1, '{"location": "Main Field"}']
    ];

    for (const feed of feedInserts) {
      await connection.query(
        'INSERT INTO feeds (id, title, content, author_id, category, priority, target_type, target_ids, publish_date, expiry_date, is_pinned, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        feed
      );
    }
    console.log(`✅ Inserted ${feedInserts.length} feeds\n`);

    // 8. Insert Notifications
    console.log('8. Inserting notifications...');
    const notificationInserts = [
      ['NOTIF001', 'STU001', 'Grade Published', 'Your Math grade has been published.', 'grade', 'result', 'RES001', 0, null],
      ['NOTIF002', 'STU002', 'Payment Reminder', 'Your tuition payment is due soon.', 'payment', 'payment', 'PAY002', 0, null],
      ['NOTIF003', 'STU003', 'New Assignment', 'A new assignment has been posted in Science.', 'assignment', 'subject', 'SCI101', 0, null]
    ];

    for (const notification of notificationInserts) {
      await connection.query(
        'INSERT INTO notifications (id, user_id, title, content, type, related_entity_type, related_entity_id, is_read, read_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        notification
      );
    }
    console.log(`✅ Inserted ${notificationInserts.length} notifications\n`);

    console.log('=================================');
    console.log('✅ Database seeded successfully!');
    console.log('=================================\n');
    console.log('Test Credentials:');
    console.log('  Admin:   admin@edumanage.com / password123');
    console.log('  Teacher: john.doe@edumanage.com / password123');
    console.log('  Student: alice.johnson@student.edu / password123');
    console.log('\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the seeding
seedDatabase().catch(console.error);
