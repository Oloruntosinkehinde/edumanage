const authValidator = require('./auth.validator');
const paymentValidator = require('./payment.validator');
const resultValidator = require('./result.validator');
const studentValidator = require('./student.validator');
const teacherValidator = require('./teacher.validator');
const subjectValidator = require('./subject.validator');
const feedValidator = require('./feed.validator');
const notificationValidator = require('./notification.validator');

module.exports = {
    authValidator,
    paymentValidator,
    resultValidator,
    studentValidator,
    teacherValidator,
    subjectValidator,
    feedValidator,
    notificationValidator
};