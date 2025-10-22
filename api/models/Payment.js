const BaseModel = require('./BaseModel');
const db = require('../config/database');
const logger = require('../utils/logger');
const { createError } = require('../utils/errors');

class Payment extends BaseModel {
  constructor() {
    super('payments');
  }

  // Find payments by student ID
  async findByStudentId(studentId) {
    try {
      const query = `
        SELECT p.*, s.firstName, s.lastName, s.email 
        FROM ${this.tableName} p
        JOIN students s ON p.studentId = s.id
        WHERE p.studentId = ?
        ORDER BY p.dueDate DESC
      `;
      
      const results = await db.query(query, [studentId]);
      return results;
    } catch (error) {
      logger.error('Error in findByStudentId:', error);
      throw createError('DATABASE_ERROR', 'Failed to fetch payments by student ID');
    }
  }

  // Find payments by status
  async findByStatus(status) {
    try {
      const query = `
        SELECT p.*, s.firstName, s.lastName, s.email 
        FROM ${this.tableName} p
        JOIN students s ON p.studentId = s.id
        WHERE p.status = ?
        ORDER BY p.dueDate ASC
      `;
      
      const results = await db.query(query, [status]);
      return results;
    } catch (error) {
      logger.error('Error in findByStatus:', error);
      throw createError('DATABASE_ERROR', 'Failed to fetch payments by status');
    }
  }

  // Count payments by status
  async countByStatus() {
    try {
      const query = `
        SELECT status, COUNT(*) as count, SUM(amount) as total
        FROM ${this.tableName}
        GROUP BY status
      `;
      
      const results = await db.query(query);
      
      // Convert to object format for easier access
      const statusCounts = {};
      results.forEach(row => {
        statusCounts[row.status] = {
          count: row.count,
          total: row.total
        };
      });
      
      return statusCounts;
    } catch (error) {
      logger.error('Error in countByStatus:', error);
      throw createError('DATABASE_ERROR', 'Failed to count payments by status');
    }
  }

  // Get monthly payment totals for the last 12 months
  async getMonthlyTotals() {
    try {
      const query = `
        SELECT 
          DATE_FORMAT(paymentDate, '%Y-%m') as month,
          COUNT(*) as count,
          SUM(amount) as total
        FROM ${this.tableName}
        WHERE paymentDate >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(paymentDate, '%Y-%m')
        ORDER BY month ASC
      `;
      
      const results = await db.query(query);
      return results;
    } catch (error) {
      logger.error('Error in getMonthlyTotals:', error);
      throw createError('DATABASE_ERROR', 'Failed to get monthly payment totals');
    }
  }

  // Get pending payments
  async getPendingPayments() {
    try {
      const query = `
        SELECT p.*, s.firstName, s.lastName, s.email 
        FROM ${this.tableName} p
        JOIN students s ON p.studentId = s.id
        WHERE p.status = 'pending' AND p.dueDate <= DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
        ORDER BY p.dueDate ASC
      `;
      
      const results = await db.query(query);
      return results;
    } catch (error) {
      logger.error('Error in getPendingPayments:', error);
      throw createError('DATABASE_ERROR', 'Failed to fetch pending payments');
    }
  }

  // Get overdue payments
  async getOverduePayments() {
    try {
      const query = `
        SELECT p.*, s.firstName, s.lastName, s.email 
        FROM ${this.tableName} p
        JOIN students s ON p.studentId = s.id
        WHERE p.status IN ('pending', 'overdue') AND p.dueDate < CURRENT_DATE()
        ORDER BY p.dueDate ASC
      `;
      
      const results = await db.query(query);
      return results;
    } catch (error) {
      logger.error('Error in getOverduePayments:', error);
      throw createError('DATABASE_ERROR', 'Failed to fetch overdue payments');
    }
  }

  // Get recent payments
  async getRecentPayments(limit = 10) {
    try {
      const query = `
        SELECT p.*, s.firstName, s.lastName, s.email 
        FROM ${this.tableName} p
        JOIN students s ON p.studentId = s.id
        WHERE p.status = 'paid'
        ORDER BY p.paymentDate DESC
        LIMIT ?
      `;
      
      const results = await db.query(query, [limit]);
      return results;
    } catch (error) {
      logger.error('Error in getRecentPayments:', error);
      throw createError('DATABASE_ERROR', 'Failed to fetch recent payments');
    }
  }

  // Get payment statistics by period (day, week, month, year)
  async getStatisticsByPeriod(period = 'month') {
    try {
      let groupFormat;
      let dateFilter;
      
      // Set appropriate date format and filter based on period
      switch (period) {
        case 'day':
          groupFormat = '%Y-%m-%d';
          dateFilter = 'INTERVAL 30 DAY';
          break;
        case 'week':
          groupFormat = '%Y-%u';
          dateFilter = 'INTERVAL 12 WEEK';
          break;
        case 'month':
          groupFormat = '%Y-%m';
          dateFilter = 'INTERVAL 12 MONTH';
          break;
        case 'year':
          groupFormat = '%Y';
          dateFilter = 'INTERVAL 5 YEAR';
          break;
        default:
          groupFormat = '%Y-%m';
          dateFilter = 'INTERVAL 12 MONTH';
      }
      
      const query = `
        SELECT 
          DATE_FORMAT(paymentDate, ?) as period,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as overdue,
          SUM(amount) as total
        FROM ${this.tableName}
        WHERE paymentDate >= DATE_SUB(CURRENT_DATE(), ${dateFilter})
        GROUP BY DATE_FORMAT(paymentDate, ?)
        ORDER BY period ASC
      `;
      
      const results = await db.query(query, [groupFormat, groupFormat]);
      return results;
    } catch (error) {
      logger.error('Error in getStatisticsByPeriod:', error);
      throw createError('DATABASE_ERROR', 'Failed to get payment statistics by period');
    }
  }
}

module.exports = new Payment();