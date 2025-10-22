/**
 * Authentication and User Management System
 */

class AuthManager {
    constructor(app) {
        this.app = app;
        this.currentUser = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.sessionTimer = null;
        this.roles = {
            admin: {
                permissions: ['all'],
                pages: ['dashboard', 'students', 'teachers', 'subjects', 'results', 'user-management', 'settings'],
                redirectUrl: 'admin/admin-dashboard.html',
                canManage: ['students', 'teachers', 'subjects', 'results', 'users', 'system'],
                accessLevel: 'full'
            },
            admin2: {
                permissions: ['students', 'teachers', 'subjects', 'results', 'settings'],
                pages: ['dashboard', 'students', 'teachers', 'subjects', 'results', 'settings'],
                redirectUrl: 'admin/admin-dashboard.html',
                canManage: ['students', 'teachers', 'subjects', 'results'],
                accessLevel: 'enhanced'
            },
            teacher: {
                permissions: ['view_students', 'view_subjects', 'manage_results', 'view_fees'],
                pages: ['dashboard', 'my-students', 'my-subjects', 'results', 'class-management'],
                redirectUrl: 'teacher-dashboard.html',
                canManage: ['own_classes', 'student_grades', 'attendance'],
                accessLevel: 'teacher',
                restrictions: {
                    students: 'own_classes_only',
                    subjects: 'assigned_only',
                    results: 'own_students_only'
                }
            },
            student: {
                permissions: ['view_profile', 'view_results', 'view_schedule', 'view_assignments'],
                pages: ['dashboard', 'results', 'profile', 'schedule', 'assignments'],
                redirectUrl: 'student-portal.html',
                canManage: ['own_profile'],
                accessLevel: 'student',
                restrictions: {
                    data_scope: 'own_only'
                }
            }
        };
        
        this.init();
    }

    init() {
        this.loadSession();
        this.setupSessionManagement();
        
        // Force reset users for debugging - remove this in production
        // Uncomment the next line to reset user database
        // this.resetUsers();
        
        this.createDefaultUsers();
    }

    /**
     * Reset user database (for debugging)
     */
    resetUsers() {
        console.log('Resetting user database...');
        this.app.data.users = [];
        localStorage.removeItem('Tophill Portal_data');
    }

    /**
     * Create default users if none exist
     */
    createDefaultUsers() {
        console.log('Checking if default users need to be created...');
        console.log('Current users count:', this.app.data.users.length);
        
        if (this.app.data.users.length === 0) {
            console.log('Creating default users...');
            this.app.data.users = [
                {
                    id: 'U001',
                    username: 'admin',
                    password: 'password123',
                    email: 'admin@school.com',
                    role: 'admin',
                    name: 'System Administrator',
                    status: 'active',
                    lastLogin: null,
                    createdAt: new Date().toISOString(),
                    accessLevel: 'full'
                },
                {
                    id: 'U002',
                    username: 'teacher1',
                    password: 'password123',
                    email: 'johnson@school.com',
                    role: 'teacher',
                    name: 'Mr. Johnson',
                    teacherId: 'T001',
                    status: 'active',
                    lastLogin: null,
                    createdAt: new Date().toISOString(),
                    accessLevel: 'teacher'
                },
                {
                    id: 'U003',
                    username: 'admin2user',
                    password: 'password123',
                    email: 'admin2@school.com',
                    role: 'admin2',
                    name: 'Senior Teacher Admin',
                    teacherId: 'T003',
                    status: 'active',
                    lastLogin: null,
                    createdAt: new Date().toISOString(),
                    accessLevel: 'enhanced'
                },
                {
                    id: 'U004',
                    username: 'student1',
                    password: 'password123',
                    email: 'john.smith@student.school.com',
                    role: 'student',
                    name: 'John Smith',
                    studentId: 'S001',
                    status: 'active',
                    lastLogin: null,
                    createdAt: new Date().toISOString(),
                    accessLevel: 'student'
                }
            ];
            this.app.saveData();
            console.log('Default users created:', this.app.data.users.length);
        } else {
            console.log('Users already exist:', this.app.data.users.map(u => u.username));
        }
    }



    /**
     * Simple login without password (for development/testing)
     */
    async simpleLogin(username, expectedRole = null) {
        try {
            console.log('Simple login attempt for username:', username, 'Role:', expectedRole);
            console.log('Available users:', this.app.data.users.map(u => ({ username: u.username, role: u.role, status: u.status })));
            
            const user = this.app.data.users.find(u => 
                (u.username === username || u.email === username || u.studentId === username || u.teacherId === username) 
                && u.status === 'active'
            );

            if (!user) {
                console.log('User not found or inactive for username:', username);
                throw new Error('User not found or inactive');
            }

            // Check if role matches expected role (if provided)
            if (expectedRole && user.role !== expectedRole) {
                console.log('Role mismatch. Expected:', expectedRole, 'Found:', user.role);
                throw new Error(`Invalid user type. Please use the correct login page.`);
            }

            console.log('Found user:', { username: user.username, role: user.role });

            // Update last login
            user.lastLogin = new Date().toISOString();
            this.app.saveData();

            // Set current user
            this.currentUser = { ...user };
            // No password field to clean up since we removed passwords

            // Save session
            this.saveSession();
            this.startSessionTimer();

            console.log('Simple login successful for user:', user.username, 'Role:', user.role);
            this.app.showNotification(`Welcome back, ${user.name}!`, 'success');
            
            // Redirect based on role
            this.redirectAfterLogin();

            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Simple login error:', error);
            this.app.showNotification(`Login failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Authenticate user with ID and password
     */
    async authenticateUser(username, password, expectedRole = null) {
        try {
            console.log('Authentication attempt for username:', username, 'Role:', expectedRole);
            console.log('Available users:', this.app.data.users.map(u => ({ username: u.username, role: u.role, status: u.status })));
            
            // Ensure users exist
            if (!this.app.data.users || this.app.data.users.length === 0) {
                console.log('No users found in database, creating default users...');
                this.createDefaultUsers();
            }
            
            const user = this.app.data.users.find(u => 
                (u.username === username || u.email === username || u.studentId === username || u.teacherId === username) 
                && u.status === 'active'
            );

            if (!user) {
                console.log('User not found or inactive for username:', username);
                console.log('Searched in users:', this.app.data.users.map(u => ({ username: u.username, email: u.email, status: u.status })));
                throw new Error('Invalid credentials. Please check your ID and password.');
            }

            // Check if role matches expected role (if provided)
            if (expectedRole && user.role !== expectedRole) {
                console.log('Role mismatch. Expected:', expectedRole, 'Found:', user.role);
                throw new Error(`Invalid user type. Please use the correct login page.`);
            }

            // For now, we'll use a simple password check. In production, use proper hashing
            const defaultPassword = 'password123'; // Default password for all users
            if (password !== defaultPassword && password !== (user.password || defaultPassword)) {
                console.log('Password mismatch for user:', username);
                throw new Error('Invalid credentials. Please check your ID and password.');
            }

            console.log('Found user:', { username: user.username, role: user.role });

            // Update last login
            user.lastLogin = new Date().toISOString();
            this.app.saveData();

            // Set current user
            this.currentUser = { ...user };
            // Remove password from current user object for security
            delete this.currentUser.password;

            // Save session
            this.saveSession();
            this.startSessionTimer();

            console.log('Authentication successful for user:', user.username, 'Role:', user.role);
            console.log('Session saved. Login page should handle redirect.');
            
            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Login user (original method with password - kept for backward compatibility)
     */
    async login(username, password) {
        // Legacy method - use simpleLogin instead
        console.warn('login() method is deprecated. Use simpleLogin() instead.');
        return this.simpleLogin(username);
    }

    /**
     * Logout user
     */
    logout() {
        this.currentUser = null;
        this.clearSession();
        this.stopSessionTimer();
        
        this.app.showNotification('You have been logged out', 'info');
        this.redirectToLogin();
    }

    /**
     * Check if user has permission
     */
    hasPermission(resource) {
        if (!this.currentUser) return false;
        
        const userRole = this.currentUser.role;
        const roleConfig = this.roles[userRole];
        
        if (!roleConfig) return false;
        
        // Check if user has 'all' permissions (admin)
        if (roleConfig.permissions.includes('all')) return true;
        
        // Check specific permission
        return roleConfig.permissions.includes(resource);
    }

    /**
     * Check access level for specific actions
     */
    hasAccessLevel(level) {
        if (!this.currentUser) return false;
        
        const userRole = this.currentUser.role;
        
        switch (level) {
            case 'admin':
                return userRole === 'admin';
            case 'admin2':
                return userRole === 'admin' || userRole === 'admin2';
            case 'teacher':
                return userRole === 'admin' || userRole === 'admin2' || userRole === 'teacher';
            case 'student':
                return true; // All authenticated users can access student level
            default:
                return false;
        }
    }

    /**
     * Check if user can manage specific resource
     */
    canManage(resource) {
        if (!this.currentUser) return false;
        
        const roleConfig = this.roles[this.currentUser.role];
        if (!roleConfig) return false;
        
        return roleConfig.canManage.includes(resource) || roleConfig.canManage.includes('all');
    }

    /**
     * Check if user can access student data
     */
    canAccessStudentData(studentId = null) {
        if (!this.currentUser) return false;
        
        const roleConfig = this.roles[this.currentUser.role];
        
        switch (this.currentUser.role) {
            case 'admin':
            case 'admin2':
                return true; // Full access
            case 'teacher':
                // Teachers can only access students in their classes
                if (studentId) {
                    return this.isStudentInTeacherClasses(studentId);
                }
                return true; // General permission, specific checks done elsewhere
            case 'student':
                // Students can only access their own data
                return studentId === this.currentUser.id || studentId === this.currentUser.studentId;
            default:
                return false;
        }
    }

    /**
     * Check if student is in teacher's classes
     */
    isStudentInTeacherClasses(studentId) {
        if (!this.currentUser || this.currentUser.role !== 'teacher') return false;
        
        const teacherId = this.currentUser.teacherId || this.currentUser.id;
        const teacher = this.app.getTeacherById(teacherId);
        if (!teacher) return false;

        const student = this.app.data.students.find(s => s.id === studentId);
        if (!student) return false;

        const teacherClasses = this.app.getTeacherClasses(teacherId);
        if (teacherClasses.length && teacherClasses.includes(student.class)) {
            return true;
        }

        const teacherSubjects = new Set(
            this.app.getSubjectsByTeacher(teacherId).map(subject => subject.code || subject.id)
        );
        const studentSubjects = Array.isArray(student.subjects) ? student.subjects : [];

        if (teacherSubjects.size && studentSubjects.some(subject => teacherSubjects.has(subject))) {
            return true;
        }

        return false;
    }

    /**
     * Get user's navigation permissions
     */
    getNavigationPermissions() {
        if (!this.currentUser) return [];
        
        const roleConfig = this.roles[this.currentUser.role];
        return roleConfig ? roleConfig.pages : [];
    }

    /**
     * Check if user can access a specific page
     */
    canAccessPage(page) {
        const allowedPages = this.getNavigationPermissions();
        return allowedPages.includes(page);
    }

    /**
     * Get appropriate redirect URL based on user role
     */
    getRedirectUrl() {
        if (!this.currentUser) return 'student-login.html';
        
        const roleConfig = this.roles[this.currentUser.role];
        return roleConfig ? roleConfig.redirectUrl : 'student-login.html';
    }

    /**
     * Redirect user after login based on their role
     */
    redirectAfterLogin() {
        if (!this.currentUser) {
            this.redirectToLogin();
            return;
        }
        
        console.log('Redirecting after login for role:', this.currentUser.role);
        const role = this.currentUser.role;
        
        switch (role) {
            case 'admin':
            case 'admin2':
                // For admin login, redirect to the dedicated dashboard
                window.location.href = 'admin/admin-dashboard.html';
                break;
            case 'teacher':
                window.location.href = 'teacher/teacher-dashboard.html';
                break;
            case 'student':
                window.location.href = 'student/student-portal.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    }

    /**
     * Get filtered data based on user permissions
     */
    getFilteredData(dataType, data) {
        if (!this.currentUser || !data) return [];
        
        const roleConfig = this.roles[this.currentUser.role];
        
        switch (dataType) {
            case 'students':
                return this.filterStudentData(data);
            case 'teachers':
                return this.filterTeacherData(data);
            case 'subjects':
                return this.filterSubjectData(data);
            case 'results':
                return this.filterResultData(data);
            default:
                return data;
        }
    }

    /**
     * Filter student data based on user role
     */
    filterStudentData(students) {
        switch (this.currentUser.role) {
            case 'admin':
            case 'admin2':
                return students; // Full access
            case 'teacher':
                // Return only students in teacher's classes
                return students.filter(student => this.canAccessStudentData(student.id));
            case 'student':
                // Return only own data
                return students.filter(student => student.id === this.currentUser.studentId);
            default:
                return [];
        }
    }

    /**
     * Filter result data based on user role
     */
    filterResultData(results) {
        switch (this.currentUser.role) {
            case 'admin':
            case 'admin2':
                return results; // Full access
            case 'teacher':
                // Return only results for students in teacher's classes
                return results.filter(result => this.canAccessStudentData(result.studentId));
            case 'student':
                // Return only own results
                return results.filter(result => result.studentId === this.currentUser.studentId);
            default:
                return [];
        }
    }

    /**
     * Filter teacher data (students shouldn't see teacher details)
     */
    filterTeacherData(teachers) {
        switch (this.currentUser.role) {
            case 'admin':
            case 'admin2':
                return teachers; // Full access
            case 'teacher':
                // Teachers can see basic info of other teachers
                return teachers.map(teacher => ({
                    id: teacher.id,
                    name: teacher.name,
                    subject: teacher.subject,
                    email: teacher.email
                }));
            case 'student':
                // Students can see basic teacher info for their subjects only
                const student = this.app.data.students.find(s => s.id === this.currentUser.studentId);
                if (!student) return [];
                
                return teachers.filter(teacher => {
                    const teacherSubjects = Array.isArray(teacher.subjects) ? teacher.subjects : [teacher.subject];
                    return teacherSubjects.some(subject => student.subjects?.includes(subject));
                }).map(teacher => ({
                    id: teacher.id,
                    name: teacher.name,
                    subject: teacher.subject
                }));
            default:
                return [];
        }
    }

    /**
     * Filter subject data
     */
    filterSubjectData(subjects) {
        switch (this.currentUser.role) {
            case 'admin':
            case 'admin2':
                return subjects; // Full access
            case 'teacher':
                // Return only subjects assigned to teacher
                const teacherId = this.currentUser.teacherId || this.currentUser.id;
                const allowedSubjects = new Set(
                    this.app.getSubjectsByTeacher(teacherId).map(subject => subject.code || subject.id)
                );

                if (allowedSubjects.size === 0) {
                    return [];
                }

                return subjects.filter(subject => allowedSubjects.has(subject.code || subject.id || subject.subjectCode));
            case 'student':
                // Return only subjects student is enrolled in
                const student = this.app.data.students.find(s => s.id === this.currentUser.studentId);
                if (!student) return [];
                
                return subjects.filter(subject => student.subjects?.includes(subject.id));
            default:
                return [];
        }
    }

    /**
     * Require authentication
     */
    requireAuth() {
        if (!this.currentUser) {
            this.redirectToLogin();
            return false;
        }
        
        return true;
    }

    /**
     * Require specific permission
     */
    requirePermission(resource) {
        if (!this.requireAuth()) return false;
        
        if (!this.hasPermission(resource)) {
            this.app.showNotification('You do not have permission to access this resource', 'error');
            return false;
        }
        
        return true;
    }

    /**
     * Session management
     */
    saveSession() {
        const session = {
            user: this.currentUser,
            timestamp: Date.now()
        };
        localStorage.setItem('Tophill Portal_session', JSON.stringify(session));
    }

    loadSession() {
        try {
            const sessionData = localStorage.getItem('Tophill Portal_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                const now = Date.now();
                
                if (now - session.timestamp < this.sessionTimeout) {
                    this.currentUser = session.user;
                    this.startSessionTimer();
                    return true;
                } else {
                    this.clearSession();
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
            this.clearSession();
        }
        return false;
    }

    clearSession() {
        localStorage.removeItem('Tophill Portal_session');
    }

    startSessionTimer() {
        this.stopSessionTimer();
        this.sessionTimer = setTimeout(() => {
            this.app.showNotification('Session expired. Please login again.', 'warning');
            this.logout();
        }, this.sessionTimeout);
    }

    stopSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    setupSessionManagement() {
        // Extend session on user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        let lastActivity = Date.now();

        events.forEach(event => {
            document.addEventListener(event, () => {
                const now = Date.now();
                if (now - lastActivity > 60000) { // Only update every minute
                    lastActivity = now;
                    if (this.currentUser) {
                        this.saveSession();
                        this.startSessionTimer();
                    }
                }
            });
        });
    }

    redirectToLogin() {
        // Redirect to appropriate login page based on current location
        const path = window.location.pathname.toLowerCase();
        
        if (path.includes('/admin/')) {
            window.location.href = 'admin/admin-login.html';
        } else if (path.includes('/teacher/')) {
            window.location.href = 'teacher/teacher-login.html';
        } else if (path.includes('/student/')) {
            window.location.href = 'student/student-login.html';
        } else {
            // Default to main index (root landing page)
            window.location.href = 'index.html';
        }
    }

    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.currentUser) {
                throw new Error('Not authenticated');
            }

            const user = this.app.data.users.find(u => u.id === this.currentUser.id);
            if (!user) {
                throw new Error('User not found');
            }

            if (user.password !== this.hashPassword(currentPassword)) {
                throw new Error('Current password is incorrect');
            }

            if (newPassword.length < 6) {
                throw new Error('New password must be at least 6 characters long');
            }

            user.password = this.hashPassword(newPassword);
            user.updatedAt = new Date().toISOString();
            this.app.saveData();

            this.app.showNotification('Password changed successfully', 'success');
            return { success: true };
        } catch (error) {
            console.error('Password change error:', error);
            this.app.showNotification(`Password change failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Register new user (admin only)
     */
    async registerUser(userData) {
        try {
            if (!this.hasPermission('all')) {
                throw new Error('Permission denied');
            }

            // Validate required fields
            if (!userData.username || !userData.email || !userData.role) {
                throw new Error('Missing required fields');
            }

            // Check for existing user
            const existingUser = this.app.data.users.find(u => 
                u.username === userData.username || u.email === userData.email
            );

            if (existingUser) {
                throw new Error('Username or email already exists');
            }

            // Create new user
            const newUser = {
                id: this.app.generateId('users'),
                username: userData.username,
                email: userData.email,
                role: userData.role,
                name: userData.name,
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLogin: null
            };

            // Add role-specific fields
            if (userData.role === 'teacher' && userData.teacherId) {
                newUser.teacherId = userData.teacherId;
            } else if (userData.role === 'student' && userData.studentId) {
                newUser.studentId = userData.studentId;
            }

            this.app.data.users.push(newUser);
            this.app.saveData();

            this.app.showNotification('User registered successfully', 'success');
            return { success: true, user: newUser };
        } catch (error) {
            console.error('Registration error:', error);
            this.app.showNotification(`Registration failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return !!this.currentUser;
    }

    /**
     * Get user role
     */
    getUserRole() {
        return this.currentUser ? this.currentUser.role : null;
    }
}

// Notification System
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        
        this.createContainer();
    }

    createContainer() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    show(message, type = 'info', duration = this.defaultDuration) {
        const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const notification = {
            id,
            message,
            type,
            timestamp: new Date()
        };

        this.notifications.unshift(notification);
        
        // Limit number of notifications
        if (this.notifications.length > this.maxNotifications) {
            const removed = this.notifications.splice(this.maxNotifications);
            removed.forEach(notif => this.removeElement(notif.id));
        }

        this.renderNotification(notification);
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }

        return id;
    }

    hide(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.removeElement(id);
    }

    hideAll() {
        this.notifications.forEach(notif => this.removeElement(notif.id));
        this.notifications = [];
    }

    renderNotification(notification) {
        const container = document.getElementById('notification-container');
        
        const element = document.createElement('div');
        element.id = notification.id;
        element.className = `notification notification-${notification.type}`;
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas ${this.getIcon(notification.type)}"></i>
                </div>
                <div class="notification-body">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                </div>
                <button class="notification-close" onclick="window.notificationManager.hide('${notification.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add animation
        element.style.transform = 'translateX(100%)';
        element.style.opacity = '0';
        
        container.appendChild(element);
        
        // Trigger animation
        requestAnimationFrame(() => {
            element.style.transform = 'translateX(0)';
            element.style.opacity = '1';
        });
    }

    removeElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.transform = 'translateX(100%)';
            element.style.opacity = '0';
            
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }
    }

    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        
        if (diff < 60000) {
            return 'Just now';
        } else if (diff < 3600000) {
            return Math.floor(diff / 60000) + 'm ago';
        } else {
            return timestamp.toLocaleTimeString();
        }
    }
}

// Export classes
window.AuthManager = AuthManager;
window.NotificationManager = NotificationManager;