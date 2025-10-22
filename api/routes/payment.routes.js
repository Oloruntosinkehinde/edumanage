const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { validatePayment } = require('../middleware/validators/payment.validator');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

// Payment routes
router.get('/', authenticateJWT, isAdmin, paymentController.getAllPayments);
router.get('/:id', authenticateJWT, isAdmin, paymentController.getPaymentById);
router.post('/', authenticateJWT, isAdmin, validatePayment, paymentController.createPayment);
router.put('/:id', authenticateJWT, isAdmin, validatePayment, paymentController.updatePayment);
router.delete('/:id', authenticateJWT, isAdmin, paymentController.deletePayment);

// Additional payment routes
router.get('/student/:studentId', authenticateJWT, paymentController.getPaymentsByStudent);
router.get('/status/:status', authenticateJWT, isAdmin, paymentController.getPaymentsByStatus);
router.post('/import', authenticateJWT, isAdmin, paymentController.importPayments);
router.get('/export', authenticateJWT, isAdmin, paymentController.exportPayments);
router.get('/statistics', authenticateJWT, isAdmin, paymentController.getPaymentStatistics);

module.exports = router;