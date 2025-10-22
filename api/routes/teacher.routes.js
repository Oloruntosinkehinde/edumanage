const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const { validateTeacher } = require('../middleware/validators/teacher.validator');
const { isAuthenticated, hasRole } = require('../middleware/sessionAuth');

// Teacher routes
router.get('/', isAuthenticated, teacherController.getAllTeachers);
router.get('/:id', isAuthenticated, teacherController.getTeacherById);
router.post('/', hasRole('admin'), validateTeacher, teacherController.createTeacher);
router.put('/:id', hasRole('admin'), validateTeacher, teacherController.updateTeacher);
router.delete('/:id', hasRole('admin'), teacherController.deleteTeacher);

// Additional teacher routes
router.get('/:id/subjects', isAuthenticated, teacherController.getTeacherSubjects);
router.post('/:id/subjects', hasRole('admin'), teacherController.assignSubjectToTeacher);
router.delete('/:id/subjects/:subjectId', hasRole('admin'), teacherController.removeSubjectFromTeacher);

module.exports = router;