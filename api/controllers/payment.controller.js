const BaseController = require('./base.controller');
const PaymentModel = require('../models/Payment');
const StudentModel = require('../models/Student');
const { createError } = require('../utils/errors');
const logger = require('../utils/logger');

class PaymentController extends BaseController {
  constructor() {
    super(PaymentModel, 'Payment');
  }

  // Override methods from base controller
  getAllPayments = this.getAllEntities;
  getPaymentById = this.getEntityById;
  createPayment = this.createEntity;
  updatePayment = this.updateEntity;
  deletePayment = this.deleteEntity;

  // Additional payment-specific methods

  // Get payments by student ID
  getPaymentsByStudent = async (req, res, next) => {
    try {
      const { studentId } = req.params;
      
      // Verify student exists
      const student = await StudentModel.findById(studentId);
      
      if (!student) {
        return next(createError('NOT_FOUND', 'Student not found'));
      }
      
      // Get payments
      const payments = await PaymentModel.findByStudentId(studentId);
      
      res.status(200).json({
        success: true,
        count: payments.length,
        data: payments
      });
    } catch (error) {
      logger.error('Error in getPaymentsByStudent:', error);
      next(error);
    }
  };

  // Get payments by status
  getPaymentsByStatus = async (req, res, next) => {
    try {
      const { status } = req.params;
      
      // Validate status
      const validStatuses = ['pending', 'paid', 'overdue', 'canceled', 'refunded'];
      
      if (!validStatuses.includes(status)) {
        return next(createError('VALIDATION_ERROR', 'Invalid payment status'));
      }
      
      // Get payments
      const payments = await PaymentModel.findByStatus(status);
      
      res.status(200).json({
        success: true,
        count: payments.length,
        data: payments
      });
    } catch (error) {
      logger.error('Error in getPaymentsByStatus:', error);
      next(error);
    }
  };

  // Import payments from CSV/JSON
  importPayments = async (req, res, next) => {
    try {
      // In a real application, handle file upload and parsing
      const { payments } = req.body;
      
      if (!Array.isArray(payments) || payments.length === 0) {
        return next(createError('VALIDATION_ERROR', 'Valid payments array is required'));
      }
      
      // Process each payment
      const results = await Promise.all(
        payments.map(async (payment) => {
          try {
            // Validate student exists
            const student = await StudentModel.findById(payment.studentId);
            
            if (!student) {
              return {
                success: false,
                message: `Student ID ${payment.studentId} not found`,
                data: payment
              };
            }
            
            // Create payment
            const newPayment = await PaymentModel.create(payment);
            
            return {
              success: true,
              message: 'Payment created successfully',
              data: newPayment
            };
          } catch (error) {
            return {
              success: false,
              message: error.message,
              data: payment
            };
          }
        })
      );
      
      // Count successful imports
      const successCount = results.filter(result => result.success).length;
      
      res.status(200).json({
        success: true,
        message: `Successfully imported ${successCount} of ${payments.length} payments`,
        data: results
      });
    } catch (error) {
      logger.error('Error in importPayments:', error);
      next(error);
    }
  };

  // Export payments
  exportPayments = async (req, res, next) => {
    try {
      const { format = 'json', status, startDate, endDate } = req.query;
      
      // Get payments with filters
      const payments = await PaymentModel.findAll({
        filters: { status, startDate, endDate }
      });
      
      // Format output based on request
      if (format.toLowerCase() === 'csv') {
        // Convert to CSV format
        const csvHeader = 'id,studentId,amount,description,paymentDate,dueDate,status,createdAt,updatedAt\n';
        const csvRows = payments.map(payment => {
          return [
            payment.id,
            payment.studentId,
            payment.amount,
            payment.description,
            payment.paymentDate,
            payment.dueDate,
            payment.status,
            payment.createdAt,
            payment.updatedAt
          ].join(',');
        }).join('\n');
        
        const csvContent = csvHeader + csvRows;
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
        
        return res.send(csvContent);
      }
      
      // Default to JSON format
      res.status(200).json({
        success: true,
        count: payments.length,
        data: payments
      });
    } catch (error) {
      logger.error('Error in exportPayments:', error);
      next(error);
    }
  };

  // Get payment statistics
  getPaymentStatistics = async (req, res, next) => {
    try {
      // Get overall statistics
      const totalPayments = await PaymentModel.count();
      const totalAmount = await PaymentModel.sum('amount');
      
      // Get payments by status
      const statusCounts = await PaymentModel.countByStatus();
      
      // Get monthly payment totals for the last 12 months
      const monthlyTotals = await PaymentModel.getMonthlyTotals();
      
      res.status(200).json({
        success: true,
        data: {
          totalPayments,
          totalAmount,
          statusCounts,
          monthlyTotals
        }
      });
    } catch (error) {
      logger.error('Error in getPaymentStatistics:', error);
      next(error);
    }
  };
}

module.exports = new PaymentController();