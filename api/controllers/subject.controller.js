const BaseController = require('./base.controller');

class SubjectController extends BaseController {
    async getAllSubjects(req, res) {
        try {
            return this.success(res, [], 'Subject endpoints not yet implemented');
        } catch (error) {
            return this.error(res, error);
        }
    }

    async getSubjectById(req, res) {
        try {
            const { id } = req.params;
            return this.success(res, null, 'Subject endpoints not yet implemented');
        } catch (error) {
            return this.error(res, error);
        }
    }

    async createSubject(req, res) {
        try {
            return this.created(res, null, 'Subject endpoints not yet implemented');
        } catch (error) {
            return this.error(res, error);
        }
    }

    async updateSubject(req, res) {
        try {
            const { id } = req.params;
            return this.success(res, null, 'Subject endpoints not yet implemented');
        } catch (error) {
            return this.error(res, error);
        }
    }

    async deleteSubject(req, res) {
        try {
            const { id } = req.params;
            return this.success(res, { message: 'Subject endpoints not yet implemented' });
        } catch (error) {
            return this.error(res, error);
        }
    }

    async getSubjectStudents(req, res) {
        try {
            const { id } = req.params;
            return this.success(res, [], 'Subject students endpoint not yet implemented');
        } catch (error) {
            return this.error(res, error);
        }
    }

    async getSubjectTeachers(req, res) {
        try {
            const { id } = req.params;
            return this.success(res, [], 'Subject teachers endpoint not yet implemented');
        } catch (error) {
            return this.error(res, error);
        }
    }
}

module.exports = new SubjectController();
