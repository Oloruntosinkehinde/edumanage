const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { validateSubject } = require('../middleware/validators/subject.validator');
const { isAuthenticated, hasRole } = require('../middleware/sessionAuth');

// Subject routes
router.get('/', isAuthenticated, subjectController.getAllSubjects);
router.get('/:id', isAuthenticated, subjectController.getSubjectById);
router.post('/', hasRole('admin'), validateSubject, subjectController.createSubject);
router.put('/:id', hasRole('admin'), validateSubject, subjectController.updateSubject);
router.delete('/:id', hasRole('admin'), subjectController.deleteSubject);

// Additional subject routes
router.get('/:id/students', hasRole('teacher', 'admin'), subjectController.getSubjectStudents);
router.get('/:id/teachers', isAuthenticated, subjectController.getSubjectTeachers);

module.exports = router;