const BaseModel = require('./BaseModel');
const bcrypt = require('bcrypt');
const db = require('../config/database');

class User extends BaseModel {
    constructor() {
        super('users');
    }

    /**
     * Find user by email
     */
    async findByEmail(email) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE email = ? LIMIT 1`;
            console.log('Executing query:', query);
            console.log('With email:', email);
            const [rows] = await db.query(query, [email]);
            console.log('Query result rows:', rows.length, 'rows');
            if (rows[0]) {
                console.log('Found user:', { id: rows[0].id, email: rows[0].email, status: rows[0].status });
            }
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    /**
     * Find user by ID
     */
    async findById(id) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
            const [rows] = await db.query(query, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }

    /**
     * Validate password
     */
    async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Hash password
     */
    async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * Create a new user with hashed password
     */
    async create(userData) {
        try {
            if (userData.password) {
                userData.password = await this.hashPassword(userData.password);
            }

            const query = `
                INSERT INTO ${this.tableName} 
                (name, email, password, role, status, linkedId, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;
            
            const [result] = await db.query(query, [
                userData.name,
                userData.email,
                userData.password,
                userData.role || 'student',
                userData.status || 'active',
                userData.linkedId || null
            ]);

            return await this.findById(result.insertId);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Update user
     */
    async update(id, userData) {
        try {
            if (userData.password) {
                userData.password = await this.hashPassword(userData.password);
            }

            const fields = [];
            const values = [];

            Object.keys(userData).forEach(key => {
                if (userData[key] !== undefined && key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(userData[key]);
                }
            });

            fields.push('updatedAt = NOW()');
            values.push(id);

            const query = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
            await db.query(query, values);

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Get all users
     */
    async getAll(filters = {}) {
        try {
            let query = `SELECT id, name, email, role, status, linkedId, createdAt, updatedAt FROM ${this.tableName}`;
            const conditions = [];
            const values = [];

            if (filters.role) {
                conditions.push('role = ?');
                values.push(filters.role);
            }

            if (filters.status) {
                conditions.push('status = ?');
                values.push(filters.status);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY createdAt DESC';

            const [rows] = await db.query(query, values);
            return rows;
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }
}

module.exports = new User();
