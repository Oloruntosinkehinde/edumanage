const BaseModel = require('./BaseModel');

class Result extends BaseModel {
    constructor() {
        super('results', 'id');
    }

    /**
     * Find result by ID
     */
    async findById(id) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
            const [rows] = await this.db.query(query, [id]);
            
            if (rows.length === 0) return null;
            
            // Parse JSON fields
            const result = rows[0];
            if (result.metadata) result.metadata = JSON.parse(result.metadata);
            
            return result;
        } catch (error) {
            console.error('Error finding result:', error);
            throw error;
        }
    }

    /**
     * Get all results with optional filters
     */
    async findAll(filters = {}) {
        try {
            let query = `SELECT * FROM ${this.tableName}`;
            const conditions = [];
            const values = [];

            if (filters.student_id) {
                conditions.push('student_id = ?');
                values.push(filters.student_id);
            }

            if (filters.subject_id) {
                conditions.push('subject_id = ?');
                values.push(filters.subject_id);
            }

            if (filters.class) {
                conditions.push('class = ?');
                values.push(filters.class);
            }

            if (filters.session) {
                conditions.push('session = ?');
                values.push(filters.session);
            }

            if (filters.term) {
                conditions.push('term = ?');
                values.push(filters.term);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY recorded_at DESC';

            const [rows] = await this.db.query(query, values);
            
            // Parse JSON fields for all results
            return rows.map(result => {
                if (result.metadata) result.metadata = JSON.parse(result.metadata);
                return result;
            });
        } catch (error) {
            console.error('Error getting results:', error);
            throw error;
        }
    }

    /**
     * Create a new result
     */
    async create(resultData) {
        try {
            // Convert objects to JSON strings
            if (typeof resultData.metadata === 'object') {
                resultData.metadata = JSON.stringify(resultData.metadata);
            }

            const query = `
                INSERT INTO ${this.tableName}
                (id, student_id, subject_id, class, session, term, score, grade, remarks, published_at, recorded_at, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await this.db.query(query, [
                resultData.id,
                resultData.student_id,
                resultData.subject_id,
                resultData.class || null,
                resultData.session || null,
                resultData.term || null,
                resultData.score || 0,
                resultData.grade || null,
                resultData.remarks || null,
                resultData.published_at || null,
                resultData.recorded_at || new Date(),
                resultData.metadata || null
            ]);

            return await this.findById(resultData.id);
        } catch (error) {
            console.error('Error creating result:', error);
            throw error;
        }
    }

    /**
     * Update a result
     */
    async update(id, resultData) {
        try {
            // Convert objects to JSON strings
            if (typeof resultData.metadata === 'object') {
                resultData.metadata = JSON.stringify(resultData.metadata);
            }

            const fields = [];
            const values = [];

            Object.keys(resultData).forEach(key => {
                if (resultData[key] !== undefined && key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(resultData[key]);
                }
            });

            fields.push('updated_at = NOW()');
            values.push(id);

            const query = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
            await this.db.query(query, values);

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating result:', error);
            throw error;
        }
    }

    /**
     * Delete a result
     */
    async delete(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            await this.db.query(query, [id]);
            return true;
        } catch (error) {
            console.error('Error deleting result:', error);
            throw error;
        }
    }
}

module.exports = new Result();