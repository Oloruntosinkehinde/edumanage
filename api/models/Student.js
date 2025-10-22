const BaseModel = require('./BaseModel');

class Student extends BaseModel {
    constructor() {
        super('students', 'id');
    }

    /**
     * Find student by ID
     */
    async findById(id) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
            const [rows] = await this.db.query(query, [id]);
            
            if (rows.length === 0) return null;
            
            // Parse JSON fields
            const student = rows[0];
            if (student.subjects) student.subjects = JSON.parse(student.subjects);
            
            return student;
        } catch (error) {
            console.error('Error finding student:', error);
            throw error;
        }
    }

    /**
     * Get all students with optional filters
     */
    async findAll(filters = {}) {
        try {
            let query = `SELECT * FROM ${this.tableName}`;
            const conditions = [];
            const values = [];

            if (filters.class) {
                conditions.push('class = ?');
                values.push(filters.class);
            }

            if (filters.status) {
                conditions.push('status = ?');
                values.push(filters.status);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY name ASC';

            const [rows] = await this.db.query(query, values);
            
            // Parse JSON fields for all students
            return rows.map(student => {
                if (student.subjects) student.subjects = JSON.parse(student.subjects);
                return student;
            });
        } catch (error) {
            console.error('Error getting students:', error);
            throw error;
        }
    }

    /**
     * Create a new student
     */
    async create(studentData) {
        try {
            // Convert arrays to JSON strings
            if (Array.isArray(studentData.subjects)) {
                studentData.subjects = JSON.stringify(studentData.subjects);
            }

            const query = `
                INSERT INTO ${this.tableName}
                (id, name, email, class, subjects, guardian, phone, address, date_of_birth, enrollment_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await this.db.query(query, [
                studentData.id,
                studentData.name,
                studentData.email || null,
                studentData.class || null,
                studentData.subjects || null,
                studentData.guardian || null,
                studentData.phone || null,
                studentData.address || null,
                studentData.date_of_birth || null,
                studentData.enrollment_date || null,
                studentData.status || 'active'
            ]);

            return await this.findById(studentData.id);
        } catch (error) {
            console.error('Error creating student:', error);
            throw error;
        }
    }

    /**
     * Update a student
     */
    async update(id, studentData) {
        try {
            // Convert arrays to JSON strings
            if (Array.isArray(studentData.subjects)) {
                studentData.subjects = JSON.stringify(studentData.subjects);
            }

            const fields = [];
            const values = [];

            Object.keys(studentData).forEach(key => {
                if (studentData[key] !== undefined && key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(studentData[key]);
                }
            });

            fields.push('updated_at = NOW()');
            values.push(id);

            const query = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
            await this.db.query(query, values);

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    }

    /**
     * Delete a student
     */
    async delete(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            await this.db.query(query, [id]);
            return true;
        } catch (error) {
            console.error('Error deleting student:', error);
            throw error;
        }
    }
}

module.exports = new Student();