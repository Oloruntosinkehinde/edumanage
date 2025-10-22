const express = require('express');
const router = express.Router();
const resultController = require('../controllers/result.controller');
const { validateResult } = require('../middleware/validators/result.validator');
const { authenticateJWT, isAdmin, isTeacher } = require('../middleware/auth');

// Result routes
router.get('/', authenticateJWT, resultController.getAllResults);
router.get('/:id', authenticateJWT, resultController.getResultById);
router.post('/', authenticateJWT, isTeacher, validateResult, resultController.createResult);
router.put('/:id', authenticateJWT, isTeacher, validateResult, resultController.updateResult);
router.delete('/:id', authenticateJWT, isAdmin, resultController.deleteResult);

// Additional result routes
router.get('/subject/:subjectId', authenticateJWT, resultController.getResultsBySubject);
router.get('/student/:studentId', authenticateJWT, resultController.getResultsByStudent);
router.post('/bulk', authenticateJWT, isTeacher, resultController.bulkCreateResults);
router.post('/import', authenticateJWT, isAdmin, resultController.importResults);
router.get('/export', authenticateJWT, isAdmin, resultController.exportResults);

module.exports = router;