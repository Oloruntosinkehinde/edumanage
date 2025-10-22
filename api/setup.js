const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcrypt');

// Database connection config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'Tophill Portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Sample data
const sampleData = {
  users: [
    {
      email: 'admin@Tophill Portal.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: 1
    },
    {
      email: 'teacher@Tophill Portal.com',
      password: 'teacher123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'teacher',
      isActive: 1
    },
    {
      email: 'student@Tophill Portal.com',
      password: 'student123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'student',
      isActive: 1
    }
  ],
  teachers: [
    {
      userId: 2,
      qualification: 'PhD in Computer Science',
      specialization: 'Software Engineering',
      joinDate: '2022-01-15',
      phone: '123-456-7890',
      address: '123 Main St, City, Country'
    }
  ],
  students: [
    {
      userId: 3,
      enrollmentDate: '2022-02-01',
      grade: '10',
      parentName: 'Robert Smith',
      parentEmail: 'robert.smith@example.com',
      parentPhone: '123-456-7891',
      address: '456 Oak St, City, Country'
    }
  ],
  subjects: [
    {
      name: 'Mathematics',
      code: 'MATH101',
      description: 'Basic mathematics including algebra and trigonometry',
      credits: 4
    },
    {
      name: 'Physics',
      code: 'PHYS101',
      description: 'Introduction to physics',
      credits: 4
    },
    {
      name: 'Computer Science',
      code: 'CS101',
      description: 'Introduction to programming and algorithms',
      credits: 3
    }
  ],
  payments: [
    {
      studentId: 1,
      amount: 500.00,
      description: 'Tuition fee',
      paymentDate: '2023-01-15',
      dueDate: '2023-01-10',
      status: 'paid',
      paymentMethod: 'credit_card'
    },
    {
      studentId: 1,
      amount: 150.00,
      description: 'Laboratory fee',
      dueDate: '2023-02-20',
      status: 'pending',
      paymentMethod: null
    },
    {
      studentId: 1,
      amount: 75.00,
      description: 'Library fee',
      dueDate: '2022-12-15',
      status: 'overdue',
      paymentMethod: null
    }
  ],
  results: [
    {
      studentId: 1,
      subjectId: 1,
      score: 85,
      grade: 'A',
      examDate: '2023-01-20',
      comments: 'Excellent work'
    },
    {
      studentId: 1,
      subjectId: 2,
      score: 78,
      grade: 'B+',
      examDate: '2023-01-22',
      comments: 'Good understanding of concepts'
    }
  ]
};

// Setup database
async function setupDatabase() {
  console.log('Starting database setup...');
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    // Check if database exists, create if not
    console.log(`Checking if database ${dbConfig.database} exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`Using database ${dbConfig.database}`);
    await connection.query(`USE ${dbConfig.database}`);

    // Create tables
    console.log('Creating tables...');
    
    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        role ENUM('admin', 'teacher', 'student') NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        resetToken VARCHAR(255) NULL,
        resetTokenExpiry DATETIME NULL,
        lastLogin DATETIME NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Teachers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        qualification VARCHAR(255) NULL,
        specialization VARCHAR(255) NULL,
        joinDate DATE NULL,
        phone VARCHAR(20) NULL,
        address TEXT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Students table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        enrollmentDate DATE NULL,
        grade VARCHAR(10) NULL,
        parentName VARCHAR(200) NULL,
        parentEmail VARCHAR(255) NULL,
        parentPhone VARCHAR(20) NULL,
        address TEXT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Subjects table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        description TEXT NULL,
        credits INT DEFAULT 3,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Teacher-Subject relationship table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teacher_subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacherId INT NOT NULL,
        subjectId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY (teacherId, subjectId),
        FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE CASCADE,
        FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);
    
    // Student-Subject relationship table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        studentId INT NOT NULL,
        subjectId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY (studentId, subjectId),
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);
    
    // Results table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        studentId INT NOT NULL,
        subjectId INT NOT NULL,
        score FLOAT NULL,
        grade VARCHAR(5) NULL,
        examDate DATE NULL,
        comments TEXT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);
    
    // Payments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        studentId INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT NOT NULL,
        paymentDate DATE NULL,
        dueDate DATE NOT NULL,
        status ENUM('pending', 'paid', 'overdue', 'canceled', 'refunded') NOT NULL DEFAULT 'pending',
        paymentMethod ENUM('cash', 'credit_card', 'bank_transfer', 'check', 'online', 'other') NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    console.log('All tables created successfully');

    // Insert sample data
    console.log('Inserting sample data...');

    // Insert users
    for (const user of sampleData.users) {
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Check if user already exists
      const [existingUsers] = await connection.query('SELECT * FROM users WHERE email = ?', [user.email]);
      
      if (existingUsers.length === 0) {
        // Insert user
        const [result] = await connection.query(
          'INSERT INTO users (email, password, firstName, lastName, role, isActive) VALUES (?, ?, ?, ?, ?, ?)',
          [user.email, hashedPassword, user.firstName, user.lastName, user.role, user.isActive]
        );
        console.log(`Created user: ${user.email} with ID ${result.insertId}`);
      } else {
        console.log(`User ${user.email} already exists, skipping`);
      }
    }

    // Get user IDs for relationships
    const [users] = await connection.query('SELECT id, email, role FROM users');
    const userMap = users.reduce((map, user) => {
      map[user.email] = user.id;
      return map;
    }, {});

    // Insert teachers
    for (const teacher of sampleData.teachers) {
      // Find teacher user ID
      const teacherUserId = userMap['teacher@Tophill Portal.com'];
      
      if (teacherUserId) {
        // Check if teacher already exists
        const [existingTeachers] = await connection.query('SELECT * FROM teachers WHERE userId = ?', [teacherUserId]);
        
        if (existingTeachers.length === 0) {
          // Insert teacher
          const [result] = await connection.query(
            'INSERT INTO teachers (userId, qualification, specialization, joinDate, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
            [teacherUserId, teacher.qualification, teacher.specialization, teacher.joinDate, teacher.phone, teacher.address]
          );
          console.log(`Created teacher with ID ${result.insertId}`);
        } else {
          console.log(`Teacher for user ID ${teacherUserId} already exists, skipping`);
        }
      }
    }

    // Insert students
    for (const student of sampleData.students) {
      // Find student user ID
      const studentUserId = userMap['student@Tophill Portal.com'];
      
      if (studentUserId) {
        // Check if student already exists
        const [existingStudents] = await connection.query('SELECT * FROM students WHERE userId = ?', [studentUserId]);
        
        if (existingStudents.length === 0) {
          // Insert student
          const [result] = await connection.query(
            'INSERT INTO students (userId, enrollmentDate, grade, parentName, parentEmail, parentPhone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [studentUserId, student.enrollmentDate, student.grade, student.parentName, student.parentEmail, student.parentPhone, student.address]
          );
          console.log(`Created student with ID ${result.insertId}`);
        } else {
          console.log(`Student for user ID ${studentUserId} already exists, skipping`);
        }
      }
    }

    // Insert subjects
    for (const subject of sampleData.subjects) {
      // Check if subject already exists
      const [existingSubjects] = await connection.query('SELECT * FROM subjects WHERE code = ?', [subject.code]);
      
      if (existingSubjects.length === 0) {
        // Insert subject
        const [result] = await connection.query(
          'INSERT INTO subjects (name, code, description, credits) VALUES (?, ?, ?, ?)',
          [subject.name, subject.code, subject.description, subject.credits]
        );
        console.log(`Created subject: ${subject.name} with ID ${result.insertId}`);
      } else {
        console.log(`Subject ${subject.code} already exists, skipping`);
      }
    }

    // Get subject IDs
    const [subjects] = await connection.query('SELECT id, code FROM subjects');
    const subjectMap = subjects.reduce((map, subject) => {
      map[subject.code] = subject.id;
      return map;
    }, {});

    // Get student ID
    const [students] = await connection.query('SELECT id, userId FROM students');
    const studentId = students[0]?.id;

    // Get teacher ID
    const [teachers] = await connection.query('SELECT id, userId FROM teachers');
    const teacherId = teachers[0]?.id;

    // Assign subjects to teacher
    if (teacherId) {
      for (const subject of subjects) {
        // Check if assignment already exists
        const [existingAssignments] = await connection.query(
          'SELECT * FROM teacher_subjects WHERE teacherId = ? AND subjectId = ?',
          [teacherId, subject.id]
        );
        
        if (existingAssignments.length === 0) {
          await connection.query(
            'INSERT INTO teacher_subjects (teacherId, subjectId) VALUES (?, ?)',
            [teacherId, subject.id]
          );
          console.log(`Assigned subject ${subject.code} to teacher`);
        } else {
          console.log(`Subject ${subject.code} already assigned to teacher, skipping`);
        }
      }
    }

    // Enroll student in subjects
    if (studentId) {
      for (const subject of subjects) {
        // Check if enrollment already exists
        const [existingEnrollments] = await connection.query(
          'SELECT * FROM student_subjects WHERE studentId = ? AND subjectId = ?',
          [studentId, subject.id]
        );
        
        if (existingEnrollments.length === 0) {
          await connection.query(
            'INSERT INTO student_subjects (studentId, subjectId) VALUES (?, ?)',
            [studentId, subject.id]
          );
          console.log(`Enrolled student in subject ${subject.code}`);
        } else {
          console.log(`Student already enrolled in subject ${subject.code}, skipping`);
        }
      }
    }

    // Insert results
    if (studentId) {
      for (const result of sampleData.results) {
        const subjectId = subjectMap[result.subjectId === 1 ? 'MATH101' : 'PHYS101'];
        
        if (subjectId) {
          // Check if result already exists
          const [existingResults] = await connection.query(
            'SELECT * FROM results WHERE studentId = ? AND subjectId = ?',
            [studentId, subjectId]
          );
          
          if (existingResults.length === 0) {
            await connection.query(
              'INSERT INTO results (studentId, subjectId, score, grade, examDate, comments) VALUES (?, ?, ?, ?, ?, ?)',
              [studentId, subjectId, result.score, result.grade, result.examDate, result.comments]
            );
            console.log(`Added result for student in subject ID ${subjectId}`);
          } else {
            console.log(`Result for student in subject ID ${subjectId} already exists, skipping`);
          }
        }
      }
    }

    // Insert payments
    if (studentId) {
      for (const payment of sampleData.payments) {
        // Check if payment already exists
        const [existingPayments] = await connection.query(
          'SELECT * FROM payments WHERE studentId = ? AND description = ?',
          [studentId, payment.description]
        );
        
        if (existingPayments.length === 0) {
          await connection.query(
            'INSERT INTO payments (studentId, amount, description, paymentDate, dueDate, status, paymentMethod) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              studentId,
              payment.amount,
              payment.description,
              payment.paymentDate,
              payment.dueDate,
              payment.status,
              payment.paymentMethod
            ]
          );
          console.log(`Added payment for student: ${payment.description}`);
        } else {
          console.log(`Payment for student: ${payment.description} already exists, skipping`);
        }
      }
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the setup
setupDatabase();