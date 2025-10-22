const BaseModel = require('./BaseModel');

class Subject extends BaseModel {
    constructor() {
        super('subjects', 'id');
    }

    /**
     * Find subject by ID
     */
    async findById(id) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
            const [rows] = await this.db.query(query, [id]);
            
            if (rows.length === 0) return null;
            
            // Parse JSON fields
            const subject = rows[0];
            if (subject.teacher_ids) subject.teacher_ids = JSON.parse(subject.teacher_ids);
            if (subject.schedule_json) subject.schedule_json = JSON.parse(subject.schedule_json);
            
            return subject;
        } catch (error) {
            console.error('Error finding subject:', error);
            throw error;
        }
    }

    /**
     * Get all subjects
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

            if (filters.department) {
                conditions.push('department = ?');
                values.push(filters.department);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY sort_order ASC, title ASC';

            const [rows] = await this.db.query(query, values);
            
            // Parse JSON fields for all subjects
            return rows.map(subject => {
                if (subject.teacher_ids) subject.teacher_ids = JSON.parse(subject.teacher_ids);
                if (subject.schedule_json) subject.schedule_json = JSON.parse(subject.schedule_json);
                return subject;
            });
        } catch (error) {
            console.error('Error getting subjects:', error);
            throw error;
        }
    }

    /**
     * Create a new subject
     */
    async create(subjectData) {
        try {
            // Convert arrays/objects to JSON strings
            if (Array.isArray(subjectData.teacher_ids)) {
                subjectData.teacher_ids = JSON.stringify(subjectData.teacher_ids);
            }
            if (typeof subjectData.schedule_json === 'object') {
                subjectData.schedule_json = JSON.stringify(subjectData.schedule_json);
            }

            const query = `
                INSERT INTO ${this.tableName}
                (id, code, title, description, department, level, credits, teacher_ids, schedule_json, sort_order, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await this.db.query(query, [
                subjectData.id,
                subjectData.code,
                subjectData.title,
                subjectData.description || null,
                subjectData.department || null,
                subjectData.level || null,
                subjectData.credits || 0,
                subjectData.teacher_ids || null,
                subjectData.schedule_json || null,
                subjectData.sort_order || 0,
                subjectData.status || 'active'
            ]);

            return await this.findById(subjectData.id);
        } catch (error) {
            console.error('Error creating subject:', error);
            throw error;
        }
    }

    /**
     * Update a subject
     */
    async update(id, subjectData) {
        try {
            // Convert arrays/objects to JSON strings
            if (Array.isArray(subjectData.teacher_ids)) {
                subjectData.teacher_ids = JSON.stringify(subjectData.teacher_ids);
            }
            if (typeof subjectData.schedule_json === 'object') {
                subjectData.schedule_json = JSON.stringify(subjectData.schedule_json);
            }

            const fields = [];
            const values = [];

            Object.keys(subjectData).forEach(key => {
                if (subjectData[key] !== undefined && key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(subjectData[key]);
                }
            });

            fields.push('updated_at = NOW()');
            values.push(id);

            const query = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
            await this.db.query(query, values);

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating subject:', error);
            throw error;
        }
    }

    /**
     * Delete a subject
     */
    async delete(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            await this.db.query(query, [id]);
            return true;
        } catch (error) {
            console.error('Error deleting subject:', error);
            throw error;
        }
    }
}

module.exports = new Subject();