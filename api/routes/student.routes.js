const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { validateStudent } = require('../middleware/validators/student.validator');
const { isAuthenticated, hasRole } = require('../middleware/sessionAuth');

// Student routes
router.get('/', isAuthenticated, studentController.getAllStudents);
router.get('/:id', isAuthenticated, studentController.getStudentById);
router.post('/', hasRole('admin'), validateStudent, studentController.createStudent);
router.put('/:id', hasRole('admin'), validateStudent, studentController.updateStudent);
router.delete('/:id', hasRole('admin'), studentController.deleteStudent);

// Additional student routes
router.get('/:id/results', isAuthenticated, studentController.getStudentResults);
router.get('/:id/payments', hasRole('admin'), studentController.getStudentPayments);
router.get('/:id/subjects', isAuthenticated, studentController.getStudentSubjects);

module.exports = router;