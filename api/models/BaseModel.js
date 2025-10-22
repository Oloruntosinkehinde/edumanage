const db = require('../config/database');
const logger = require('../utils/logger');
const { createError } = require('../utils/errors');

// Base model class that provides common CRUD operations
class BaseModel {
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  // Find all records with pagination, sorting and filtering
  async findAll({ page = 1, limit = 10, sortBy = this.primaryKey, order = 'asc', filters = {} } = {}) {
    try {
      // Start building query
      let query = `SELECT * FROM ${this.tableName}`;
      const params = [];
      
      // Add WHERE clauses for filters
      if (Object.keys(filters).length > 0) {
        const filterClauses = [];
        
        // Process each filter
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Handle special filters like startDate, endDate
            if (key === 'startDate' && this.hasColumn('createdAt')) {
              filterClauses.push('createdAt >= ?');
              params.push(value);
            } else if (key === 'endDate' && this.hasColumn('createdAt')) {
              filterClauses.push('createdAt <= ?');
              params.push(value);
            } else if (this.hasColumn(key)) {
              // Default equality filter
              filterClauses.push(`${key} = ?`);
              params.push(value);
            }
          }
        });
        
        // Add WHERE clause if we have filters
        if (filterClauses.length > 0) {
          query += ' WHERE ' + filterClauses.join(' AND ');
        }
      }
      
      // Add ORDER BY clause
      if (this.hasColumn(sortBy)) {
        query += ` ORDER BY ${sortBy} ${order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
      }
      
      // Add LIMIT and OFFSET for pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
      
      // Execute query
      const results = await db.query(query, params);
      return results;
    } catch (error) {
      logger.error(`Error in findAll for ${this.tableName}:`, error);
      throw createError('DATABASE_ERROR', `Failed to fetch ${this.tableName}`);
    }
  }

  // Find record by ID
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ? LIMIT 1`;
      const results = await db.query(query, [id]);
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error(`Error in findById for ${this.tableName}:`, error);
      throw createError('DATABASE_ERROR', `Failed to fetch ${this.tableName} by ID`);
    }
  }

  // Create new record
  async create(data) {
    try {
      // Filter out non-existing columns
      const filteredData = this.filterValidColumns(data);
      
      // Build query
      const columns = Object.keys(filteredData).join(', ');
      const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
      const values = Object.values(filteredData);
      
      const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
      
      // Execute query
      const result = await db.query(query, values);
      
      // Get the inserted record
      if (result.insertId) {
        return this.findById(result.insertId);
      }
      
      return null;
    } catch (error) {
      logger.error(`Error in create for ${this.tableName}:`, error);
      throw createError('DATABASE_ERROR', `Failed to create ${this.tableName}`);
    }
  }

  // Update record
  async update(id, data) {
    try {
      // Filter out non-existing columns
      const filteredData = this.filterValidColumns(data);
      
      // Check if we have data to update
      if (Object.keys(filteredData).length === 0) {
        return this.findById(id);
      }
      
      // Build query
      const setClauses = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(filteredData), id];
      
      const query = `UPDATE ${this.tableName} SET ${setClauses} WHERE ${this.primaryKey} = ?`;
      
      // Execute query
      await db.query(query, values);
      
      // Get the updated record
      return this.findById(id);
    } catch (error) {
      logger.error(`Error in update for ${this.tableName}:`, error);
      throw createError('DATABASE_ERROR', `Failed to update ${this.tableName}`);
    }
  }

  // Delete record
  async delete(id) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
      
      // Execute query
      const result = await db.query(query, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Error in delete for ${this.tableName}:`, error);
      throw createError('DATABASE_ERROR', `Failed to delete ${this.tableName}`);
    }
  }

  // Count records
  async count(whereClause = '', params = []) {
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }
      
      const result = await db.query(query, params);
      return result[0].count;
    } catch (error) {
      logger.error(`Error in count for ${this.tableName}:`, error);
      throw createError('DATABASE_ERROR', `Failed to count ${this.tableName}`);
    }
  }

  // Sum a column
  async sum(column, whereClause = '', params = []) {
    try {
      if (!this.hasColumn(column)) {
        throw new Error(`Column ${column} does not exist in table ${this.tableName}`);
      }
      
      let query = `SELECT SUM(${column}) as total FROM ${this.tableName}`;
      
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }
      
      const result = await db.query(query, params);
      return result[0].total || 0;
    } catch (error) {
      logger.error(`Error in sum for ${this.tableName}:`, error);
      throw createError('DATABASE_ERROR', `Failed to sum ${column} in ${this.tableName}`);
    }
  }

  // Check if a column exists in the table
  hasColumn(column) {
    // This is a placeholder - in a real application, you would query the database schema
    // For now, assume all passed columns are valid
    return true;
  }

  // Filter out columns that don't exist in the table
  filterValidColumns(data) {
    const filteredData = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (this.hasColumn(key)) {
        filteredData[key] = value;
      }
    });
    
    return filteredData;
  }
}

module.exports = BaseModel;