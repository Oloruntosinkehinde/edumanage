const BaseModel = require('./BaseModel');

class Teacher extends BaseModel {
    constructor() {
        super('teachers', 'id');
    }

    /**
     * Find teacher by ID
     */
    async findById(id) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
            const [rows] = await this.db.query(query, [id]);
            
            if (rows.length === 0) return null;
            
            // Parse JSON fields
            const teacher = rows[0];
            if (teacher.subjects) teacher.subjects = JSON.parse(teacher.subjects);
            if (teacher.classes) teacher.classes = JSON.parse(teacher.classes);
            
            return teacher;
        } catch (error) {
            console.error('Error finding teacher:', error);
            throw error;
        }
    }

    /**
     * Get all teachers
     */
    async findAll(filters = {}) {
        try {
            let query = `SELECT * FROM ${this.tableName}`;
            const conditions = [];
            const values = [];

            if (filters.status) {
                conditions.push('status = ?');
                values.push(filters.status);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY name ASC';

            const [rows] = await this.db.query(query, values);
            
            // Parse JSON fields for all teachers
            return rows.map(teacher => {
                if (teacher.subjects) teacher.subjects = JSON.parse(teacher.subjects);
                if (teacher.classes) teacher.classes = JSON.parse(teacher.classes);
                return teacher;
            });
        } catch (error) {
            console.error('Error getting teachers:', error);
            throw error;
        }
    }

    /**
     * Create a new teacher
     */
    async create(teacherData) {
        try {
            // Convert arrays to JSON strings
            if (Array.isArray(teacherData.subjects)) {
                teacherData.subjects = JSON.stringify(teacherData.subjects);
            }
            if (Array.isArray(teacherData.classes)) {
                teacherData.classes = JSON.stringify(teacherData.classes);
            }

            const query = `
                INSERT INTO ${this.tableName}
                (id, name, email, subjects, classes, phone, qualification, experience, join_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await this.db.query(query, [
                teacherData.id,
                teacherData.name,
                teacherData.email || null,
                teacherData.subjects || null,
                teacherData.classes || null,
                teacherData.phone || null,
                teacherData.qualification || null,
                teacherData.experience || null,
                teacherData.join_date || null,
                teacherData.status || 'active'
            ]);

            return await this.findById(teacherData.id);
        } catch (error) {
            console.error('Error creating teacher:', error);
            throw error;
        }
    }

    /**
     * Update a teacher
     */
    async update(id, teacherData) {
        try {
            // Convert arrays to JSON strings
            if (Array.isArray(teacherData.subjects)) {
                teacherData.subjects = JSON.stringify(teacherData.subjects);
            }
            if (Array.isArray(teacherData.classes)) {
                teacherData.classes = JSON.stringify(teacherData.classes);
            }

            const fields = [];
            const values = [];

            Object.keys(teacherData).forEach(key => {
                if (teacherData[key] !== undefined && key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(teacherData[key]);
                }
            });

            fields.push('updated_at = NOW()');
            values.push(id);

            const query = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
            await this.db.query(query, values);

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating teacher:', error);
            throw error;
        }
    }

    /**
     * Delete a teacher
     */
    async delete(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            await this.db.query(query, [id]);
            return true;
        } catch (error) {
            console.error('Error deleting teacher:', error);
            throw error;
        }
    }
}

module.exports = new Teacher();