/**
 * Assignments Management JavaScript
 * Handles all assignment-related functionality
 * Optimized version with performance improvements
 * @version 2.0
 */

class AssignmentManager {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.assignments = [];
        this.submissions = [];
        this.cache = {}; // Cache object for storing computed data
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.setupTabs();
        this.loadAssignments();
        this.setupFileUpload();
        console.log('AssignmentManager initialized');
    }

    checkAuth() {
        if (!authManager.requireAuth()) return;
        
        this.currentUser = authManager.currentUser;
        this.currentRole = this.currentUser.role;
        
        // Update UI based on role
        this.setupRoleBasedUI();
        
        // Update user info - use querySelector for better performance with complex selectors
        const userNameEl = document.getElementById('user-name');
        const userAvatarEl = document.getElementById('user-avatar');
        
        if (userNameEl) userNameEl.textContent = this.currentUser.name;
        if (userAvatarEl) {
            // Cache the avatar URL to avoid redundant API calls
            const cachedAvatarUrl = this.cache[`avatar_${this.currentUser.id}`];
            if (cachedAvatarUrl) {
                userAvatarEl.src = cachedAvatarUrl;
            } else {
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name)}&background=1F335A&color=fff`;
                this.cache[`avatar_${this.currentUser.id}`] = avatarUrl;
                userAvatarEl.src = avatarUrl;
            }
        }
    }

    setupRoleBasedUI() {
        const teacherView = document.getElementById('teacher-view');
        const studentView = document.getElementById('student-view');
        
        if (this.currentRole === 'teacher' || this.currentRole === 'admin' || this.currentRole === 'admin2') {
            teacherView.style.display = 'block';
            studentView.style.display = 'none';
            this.loadTeacherSubjects();
            this.loadTeacherClasses();
        } else {
            teacherView.style.display = 'none';
            studentView.style.display = 'block';
        }
    }

    setupEventListeners() {
        // Assignment form submission
        const assignmentForm = document.getElementById('assignment-form');
        if (assignmentForm) {
            assignmentForm.addEventListener('submit', (e) => this.handleAssignmentSubmission(e));
        }

        // Submission form
        const submissionForm = document.getElementById('submission-form');
        if (submissionForm) {
            submissionForm.addEventListener('submit', (e) => this.handleSubmissionSubmit(e));
        }

        // Grade form
        const gradeForm = document.getElementById('grade-form');
        if (gradeForm) {
            gradeForm.addEventListener('submit', (e) => this.handleGradeSubmit(e));
        }

        // File upload handlers
        this.setupFileUploadHandlers();
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));

                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Show corresponding content
                const targetTab = tab.getAttribute('data-tab');
                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.add('active');
                }

                // Load data for the tab
                this.loadTabData(targetTab);
            });
        });
    }

    loadTabData(tabName) {
        // Check if we have cached data for this tab that's not stale
        const cacheKey = `tab_data_${tabName}_${this.currentUser.id}`;
        const cachedData = this.cache[cacheKey];
        
        // Use cached data if available and not older than 1 minute
        if (cachedData && (Date.now() - cachedData.timestamp) < 60000) {
            console.log(`Using cached data for ${tabName}`);
            return;
        }
        
        // Mark the start time for loading
        const loadStartTime = performance.now();
        
        // Load the appropriate data based on tab
        switch (tabName) {
            case 'all-assignments':
                this.loadTeacherAssignments();
                break;
            case 'submissions':
                this.loadSubmissions();
                break;
            case 'active-assignments':
                this.loadStudentActiveAssignments();
                break;
            case 'submitted-assignments':
                this.loadStudentSubmittedAssignments();
                break;
            case 'graded-assignments':
                this.loadStudentGradedAssignments();
                break;
        }
        
        // Cache the result with timestamp
        this.cache[cacheKey] = { 
            timestamp: Date.now()
        };
        
        // Log performance metrics
        console.log(`Tab ${tabName} loaded in ${(performance.now() - loadStartTime).toFixed(2)}ms`);
    }

    loadAssignments() {
        // Use cached assignments if available and not stale
        if (!this.cache.assignments || (Date.now() - this.cache.assignments.timestamp) > 60000) {
            this.assignments = app.data.assignments || [];
            this.submissions = app.data.submissions || [];
            
            // Cache the assignments with timestamp
            this.cache.assignments = { 
                data: this.assignments,
                timestamp: Date.now()
            };
            this.cache.submissions = {
                data: this.submissions,
                timestamp: Date.now()
            };
        } else {
            console.log('Using cached assignments');
        }
        
        // Load the active tab
        const activeTab = document.querySelector('.tab.active')?.getAttribute('data-tab') || 'all-assignments';
        this.loadTabData(activeTab);
    }

    loadTeacherSubjects() {
        const subjectSelect = document.getElementById('assignment-subject');
        if (!subjectSelect) return;

        const filteredSubjects = authManager.getFilteredData('subjects', app.data.subjects);
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        
        filteredSubjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            subjectSelect.appendChild(option);
        });
    }

    loadTeacherClasses() {
        const classSelect = document.getElementById('assignment-class');
        if (!classSelect) return;

        const classes = [...new Set(app.data.students.map(s => s.class))].sort();
        classSelect.innerHTML = '<option value="">Select Class</option>';
        
        classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classSelect.appendChild(option);
        });
    }

    handleAssignmentSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const assignmentData = {
            title: formData.get('title'),
            description: formData.get('description'),
            subject: formData.get('subject'),
            class: formData.get('class'),
            dueDate: formData.get('dueDate'),
            totalMarks: parseInt(formData.get('totalMarks')) || 100,
            instructions: formData.get('instructions'),
            status: 'active'
        };

        // Handle file upload
        const fileInput = document.getElementById('assignment-file');
        if (fileInput.files.length > 0) {
            assignmentData.attachmentName = fileInput.files[0].name;
            assignmentData.attachmentSize = fileInput.files[0].size;
            // In a real app, you'd upload the file to a server
            assignmentData.attachmentUrl = URL.createObjectURL(fileInput.files[0]);
        }

        const result = app.createAssignment(assignmentData);
        if (result) {
            this.resetAssignmentForm();
            this.loadTeacherAssignments();
            // Switch to all assignments tab
            document.querySelector('.tab[data-tab="all-assignments"]').click();
        }
    }

    saveDraft() {
        const form = document.getElementById('assignment-form');
        const formData = new FormData(form);
        const assignmentData = {
            title: formData.get('title'),
            description: formData.get('description'),
            subject: formData.get('subject'),
            class: formData.get('class'),
            dueDate: formData.get('dueDate'),
            totalMarks: parseInt(formData.get('totalMarks')) || 100,
            instructions: formData.get('instructions'),
            status: 'draft'
        };

        const result = app.createAssignment(assignmentData);
        if (result) {
            this.resetAssignmentForm();
            this.loadTeacherAssignments();
        }
    }

    resetAssignmentForm() {
        document.getElementById('assignment-form').reset();
        document.getElementById('assignment-uploaded-files').innerHTML = '';
    }

    loadTeacherAssignments() {
        const container = document.getElementById('teacher-assignments-list');
        if (!container) return;

        // Check cache first
        const cacheKey = `teacher_assignments_${this.currentUser.id}`;
        const cachedAssignments = this.cache[cacheKey];
        let assignments;
        
        if (cachedAssignments && (Date.now() - cachedAssignments.timestamp) < 30000) {
            // Use cached data if less than 30 seconds old
            assignments = cachedAssignments.data;
            console.log('Using cached teacher assignments');
        } else {
            // Get fresh data
            assignments = app.getAssignmentsForUser('teacher', this.currentUser.id);
            
            // Cache the result
            this.cache[cacheKey] = {
                data: assignments,
                timestamp: Date.now()
            };
        }
        
        // Measure render performance
        const renderStart = performance.now();
        
        if (assignments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No assignments created yet</h3>
                    <p>Create your first assignment to get started</p>
                    <button class="btn btn-primary create-assignment-btn">
                        <i class="fas fa-plus"></i> Create Assignment
                    </button>
                </div>
            `;
            
            // Add event listener for the create assignment button
            const createBtn = container.querySelector('.create-assignment-btn');
            if (createBtn) {
                createBtn.addEventListener('click', showCreateAssignmentForm);
            }
            return;
        }

        // Use DocumentFragment for better rendering performance
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        
        // Process assignments in smaller batches if there are many
        const BATCH_SIZE = 20;
        const processBatch = (startIndex) => {
            const endIndex = Math.min(startIndex + BATCH_SIZE, assignments.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                tempDiv.innerHTML = this.renderAssignmentCard(assignments[i], 'teacher');
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
            }
            
            if (endIndex < assignments.length) {
                // Process next batch in next animation frame for smoother UI
                requestAnimationFrame(() => processBatch(endIndex));
            } else {
                // All batches processed, update the DOM
                container.innerHTML = '';
                container.appendChild(fragment);
                
                // Add event listeners to the newly created elements
                this._addEventListenersToCards(container);
                
                console.log(`Rendered ${assignments.length} assignments in ${(performance.now() - renderStart).toFixed(2)}ms`);
            }
        };
        
        // Start processing the first batch
        processBatch(0);
    }
    
    // Helper method to add event listeners to cards
    _addEventListenersToCards(container) {
        // Event delegation for edit buttons
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editAssignment(btn.dataset.id));
        });
        
        // Event delegation for view buttons
        container.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => viewSubmissions(btn.dataset.id));
        });
        
        // Event delegation for publish buttons
        container.querySelectorAll('.publish-btn').forEach(btn => {
            btn.addEventListener('click', () => publishAssignment(btn.dataset.id));
        });
        
        // Event delegation for delete buttons
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteAssignment(btn.dataset.id));
        });
        
        // Event delegation for submit buttons
        container.querySelectorAll('.submit-btn').forEach(btn => {
            btn.addEventListener('click', () => showSubmissionModal(btn.dataset.id));
        });
    }

    loadStudentActiveAssignments() {
        const container = document.getElementById('student-active-assignments');
        if (!container) return;

        const assignments = app.getAssignmentsForUser('student', this.currentUser.id);
        const studentSubmissions = app.getStudentSubmissions(this.currentUser.id);
        
        // Filter out assignments that are already submitted
        const activeAssignments = assignments.filter(assignment => 
            !studentSubmissions.some(sub => sub.assignmentId === assignment.id)
        );

        if (activeAssignments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>No active assignments</h3>
                    <p>All assignments are completed or none available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activeAssignments.map(assignment => this.renderAssignmentCard(assignment, 'student')).join('');
    }

    loadStudentSubmittedAssignments() {
        const container = document.getElementById('student-submitted-assignments');
        if (!container) return;

        const studentSubmissions = app.getStudentSubmissions(this.currentUser.id);
        const submittedAssignments = studentSubmissions
            .filter(sub => sub.status === 'submitted')
            .map(sub => {
                const assignment = this.assignments.find(a => a.id === sub.assignmentId);
                return { ...assignment, submission: sub };
            })
            .filter(item => item.id); // Filter out null assignments

        if (submittedAssignments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h3>No submitted assignments</h3>
                    <p>Submit your assignments to see them here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = submittedAssignments.map(assignment => this.renderAssignmentCard(assignment, 'student')).join('');
    }

    loadStudentGradedAssignments() {
        const container = document.getElementById('student-graded-assignments');
        if (!container) return;

        const studentSubmissions = app.getStudentSubmissions(this.currentUser.id);
        const gradedAssignments = studentSubmissions
            .filter(sub => sub.status === 'graded')
            .map(sub => {
                const assignment = this.assignments.find(a => a.id === sub.assignmentId);
                return { ...assignment, submission: sub };
            })
            .filter(item => item.id); // Filter out null assignments

        if (gradedAssignments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <h3>No graded assignments</h3>
                    <p>Graded assignments will appear here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = gradedAssignments.map(assignment => this.renderAssignmentCard(assignment, 'student')).join('');
    }

    loadSubmissions() {
        const container = document.getElementById('submissions-list');
        if (!container) return;

        const teacherAssignments = app.getAssignmentsForUser('teacher', this.currentUser.id);
        const allSubmissions = [];

        teacherAssignments.forEach(assignment => {
            const submissions = app.getSubmissionsForAssignment(assignment.id);
            submissions.forEach(submission => {
                const student = app.data.students.find(s => s.id === submission.submittedBy);
                allSubmissions.push({
                    ...submission,
                    assignmentTitle: assignment.title,
                    studentName: student ? student.name : 'Unknown Student',
                    totalMarks: assignment.totalMarks
                });
            });
        });

        if (allSubmissions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-upload"></i>
                    <h3>No submissions yet</h3>
                    <p>Student submissions will appear here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = allSubmissions.map(submission => this.renderSubmissionCard(submission)).join('');
    }

    renderAssignmentCard(assignment, userRole) {
        // Check for cached rendered card to avoid redundant template processing
        const cacheKey = `card_${assignment.id}_${userRole}_${assignment.lastUpdated || ''}`;
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }
        
        // Parse date once and format efficiently
        const dueDate = new Date(assignment.dueDate);
        const now = new Date();
        const isOverdue = dueDate < now && assignment.status === 'active';
        const formattedDueDate = this._formatDate(dueDate);
        
        // Determine status with object lookup instead of if/else chain
        const statusMap = {
            'draft': { class: 'status-draft', text: 'Draft' },
            'completed': { class: 'status-completed', text: 'Completed' }
        };
        
        let statusClass = 'status-active';
        let statusText = 'Active';
        
        if (statusMap[assignment.status]) {
            statusClass = statusMap[assignment.status].class;
            statusText = statusMap[assignment.status].text;
        } else if (isOverdue) {
            statusClass = 'status-overdue';
            statusText = 'Overdue';
        }

        const isStudent = userRole === 'student';
        const hasSubmission = assignment.submission;
        
        // Create HTML template - use template literals more efficiently
        const html = `
            <div class="assignment-card" data-id="${assignment.id}">
                <div class="assignment-header">
                    <div>
                        <div class="assignment-title">${this._escapeHTML(assignment.title)}</div>
                        <div class="assignment-meta">
                            <span><i class="fas fa-book"></i> ${this._escapeHTML(assignment.subject)}</span>
                            <span><i class="fas fa-users"></i> ${this._escapeHTML(assignment.class)}</span>
                            <span><i class="fas fa-calendar"></i> Due: ${formattedDueDate}</span>
                            <span><i class="fas fa-star"></i> ${assignment.totalMarks} marks</span>
                        </div>
                    </div>
                    <div class="assignment-status ${statusClass}">${statusText}</div>
                </div>
                <div class="assignment-description">${this._escapeHTML(assignment.description)}</div>
                ${assignment.instructions ? `<div class="assignment-instructions"><strong>Instructions:</strong> ${this._escapeHTML(assignment.instructions)}</div>` : ''}
                ${assignment.attachmentName ? `
                    <div class="assignment-attachment">
                        <i class="fas fa-paperclip"></i> ${this._escapeHTML(assignment.attachmentName)}
                    </div>
                ` : ''}
                ${hasSubmission ? `
                    <div class="submission-info">
                        <div class="submission-status ${hasSubmission.status}">${hasSubmission.status.toUpperCase()}</div>
                        ${hasSubmission.grade ? `<div>Grade: ${hasSubmission.grade}/${assignment.totalMarks}</div>` : ''}
                        ${hasSubmission.feedback ? `<div>Feedback: ${this._escapeHTML(hasSubmission.feedback)}</div>` : ''}
                    </div>
                ` : ''}
                <div class="assignment-actions">
                    ${isStudent && !hasSubmission && assignment.status === 'active' ? `
                        <button class="btn btn-primary submit-btn" data-id="${assignment.id}">
                            <i class="fas fa-upload"></i> Submit Assignment
                        </button>
                    ` : ''}
                    ${!isStudent ? `
                        <button class="btn btn-secondary edit-btn" data-id="${assignment.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-secondary view-btn" data-id="${assignment.id}">
                            <i class="fas fa-eye"></i> View Submissions
                        </button>
                        ${assignment.status === 'draft' ? `
                            <button class="btn btn-primary publish-btn" data-id="${assignment.id}">
                                <i class="fas fa-paper-plane"></i> Publish
                            </button>
                        ` : ''}
                        <button class="btn btn-danger delete-btn" data-id="${assignment.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Cache the rendered HTML
        this.cache[cacheKey] = html;
        
        return html;
    }
    
    // Helper method to format date consistently
    _formatDate(date) {
        try {
            return date.toLocaleDateString();
        } catch (e) {
            console.error('Invalid date:', date);
            return 'Invalid date';
        }
    }
    
    // Helper method to escape HTML and prevent XSS
    _escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    renderSubmissionCard(submission) {
        return `
            <div class="assignment-card">
                <div class="assignment-header">
                    <div>
                        <div class="assignment-title">${submission.assignmentTitle}</div>
                        <div class="assignment-meta">
                            <span><i class="fas fa-user"></i> ${submission.studentName}</span>
                            <span><i class="fas fa-calendar"></i> Submitted: ${new Date(submission.submittedAt).toLocaleDateString()}</span>
                            <span><i class="fas fa-star"></i> Total: ${submission.totalMarks} marks</span>
                        </div>
                    </div>
                    <div class="submission-status ${submission.status}">${submission.status.toUpperCase()}</div>
                </div>
                ${submission.notes ? `<div class="assignment-description">${submission.notes}</div>` : ''}
                ${submission.fileName ? `
                    <div class="assignment-attachment">
                        <i class="fas fa-file"></i> ${submission.fileName}
                    </div>
                ` : ''}
                ${submission.grade ? `
                    <div class="submission-info">
                        <div>Grade: ${submission.grade}/${submission.totalMarks}</div>
                        ${submission.feedback ? `<div>Feedback: ${submission.feedback}</div>` : ''}
                    </div>
                ` : ''}
                <div class="assignment-actions">
                    ${submission.status === 'submitted' ? `
                        <button class="btn btn-primary" onclick="showGradeModal('${submission.id}')">
                            <i class="fas fa-star"></i> Grade Assignment
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="downloadSubmission('${submission.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `;
    }

    setupFileUpload() {
        this.setupFileUploadHandlers();
        this._setupDropZones();
    }

    setupFileUploadHandlers() {
        // Assignment file upload
        const assignmentFileInput = document.getElementById('assignment-file');
        if (assignmentFileInput) {
            assignmentFileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e, 'assignment-uploaded-files');
            });
        }

        // Submission file upload
        const submissionFileInput = document.getElementById('submission-file');
        if (submissionFileInput) {
            submissionFileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e, 'submission-uploaded-files');
            });
        }
    }

    // Setup drag and drop file uploading
    _setupDropZones() {
        // Get all file upload areas
        const dropZones = document.querySelectorAll('.file-upload');
        
        dropZones.forEach(zone => {
            // Find the associated file input
            const fileInput = zone.querySelector('input[type="file"]');
            if (!fileInput) return;
            
            // Setup drag and drop events
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });
            
            // Add visual feedback during drag
            ['dragenter', 'dragover'].forEach(eventName => {
                zone.addEventListener(eventName, () => {
                    zone.classList.add('dragover');
                });
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, () => {
                    zone.classList.remove('dragover');
                });
            });
            
            // Handle file drop
            zone.addEventListener('drop', (e) => {
                if (e.dataTransfer.files.length) {
                    fileInput.files = e.dataTransfer.files;
                    
                    // Trigger change event to update UI
                    const changeEvent = new Event('change', { bubbles: true });
                    fileInput.dispatchEvent(changeEvent);
                }
            });
        });
    }

    handleFileSelect(e, containerId) {
        const files = e.target.files;
        const container = document.getElementById(containerId);
        
        if (!container || !files.length) return;
        
        const file = files[0];
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert(`File size exceeds the 10MB limit. Your file is ${this.formatFileSize(file.size)}.`);
            e.target.value = ''; // Clear the file input
            return;
        }
        
        // Validate file type
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(file.type) && !['pdf', 'doc', 'docx', 'txt'].includes(fileExtension)) {
            alert('Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.');
            e.target.value = ''; // Clear the file input
            return;
        }
        
        // Create file preview
        const fileTemplate = document.createElement('div');
        fileTemplate.className = 'file-item';
        fileTemplate.innerHTML = `
            <div class="file-info">
                <i class="fas ${this._getFileIconClass(fileExtension)}"></i>
                <span>${this._escapeHTML(file.name)}</span>
                <span class="file-size">(${this.formatFileSize(file.size)})</span>
            </div>
            <button type="button" class="btn btn-sm btn-danger remove-file-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add event listener for remove button
        const removeBtn = fileTemplate.querySelector('.remove-file-btn');
        removeBtn.addEventListener('click', () => {
            container.innerHTML = '';
            e.target.value = ''; // Clear the file input
        });
        
        // Update the container
        container.innerHTML = '';
        container.appendChild(fileTemplate);
    }

    // Get appropriate icon class based on file extension
    _getFileIconClass(extension) {
        const iconMap = {
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'txt': 'fa-file-alt'
        };
        
        return iconMap[extension] || 'fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    handleSubmissionSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const fileInput = document.getElementById('submission-file');
        
        if (fileInput.files.length === 0) {
            app.showNotification('Please select a file to submit', 'error');
            return;
        }

        const submissionData = {
            assignmentId: document.getElementById('submission-assignment-id').value,
            notes: formData.get('notes'),
            fileName: fileInput.files[0].name,
            fileSize: fileInput.files[0].size,
            fileUrl: URL.createObjectURL(fileInput.files[0]) // In real app, upload to server
        };

        const result = app.submitAssignment(submissionData);
        if (result) {
            this.closeSubmissionModal();
            this.loadStudentActiveAssignments();
            this.loadStudentSubmittedAssignments();
        }
    }

    handleGradeSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const gradeData = {
            marks: parseInt(formData.get('marks')),
            feedback: formData.get('feedback')
        };

        const submissionId = document.getElementById('grade-submission-id').value;
        const result = app.gradeSubmission(submissionId, gradeData);
        if (result) {
            this.closeGradeModal();
            this.loadSubmissions();
        }
    }

    // Modal functions
    showSubmissionModal(assignmentId) {
        const assignment = this.assignments.find(a => a.id === assignmentId);
        if (!assignment) return;

        document.getElementById('submission-assignment-id').value = assignmentId;
        document.getElementById('submission-assignment-title').textContent = assignment.title;
        document.getElementById('submission-modal').classList.add('show');
    }

    closeSubmissionModal() {
        document.getElementById('submission-modal').classList.remove('show');
        document.getElementById('submission-form').reset();
        document.getElementById('submission-uploaded-files').innerHTML = '';
    }

    showGradeModal(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) return;

        const assignment = this.assignments.find(a => a.id === submission.assignmentId);
        const student = app.data.students.find(s => s.id === submission.submittedBy);

        document.getElementById('grade-submission-id').value = submissionId;
        document.getElementById('grade-student-name').textContent = student ? student.name : 'Unknown';
        document.getElementById('grade-assignment-title').textContent = assignment ? assignment.title : 'Unknown';
        document.getElementById('grade-total-marks').textContent = assignment ? assignment.totalMarks : 0;
        document.getElementById('grade-marks').setAttribute('max', assignment ? assignment.totalMarks : 100);
        
        document.getElementById('grade-modal').classList.add('show');
    }

    closeGradeModal() {
        document.getElementById('grade-modal').classList.remove('show');
        document.getElementById('grade-form').reset();
    }
}

// Global functions with improved performance
function goToDashboard() {
    // Use localStorage to remember previous page for better navigation experience
    localStorage.setItem('lastPage', window.location.href);
    
    if (authManager.currentUser.role === 'student') {
        window.location.href = 'student-portal.html';
    } else {
        window.location.href = 'teacher-dashboard.html';
    }
}

function showCreateAssignmentForm() {
    const createTab = document.querySelector('.tab[data-tab="create-assignment"]');
    if (createTab) {
        createTab.click();
        
        // Focus on first input for better UX
        setTimeout(() => {
            const firstInput = document.querySelector('#assignment-title');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

function editAssignment(id) {
    // Optimized implementation for editing assignment
    console.log('Edit assignment:', id);
    
    // Cache the assignment data for faster loading
    const assignment = assignmentManager.assignments.find(a => a.id === id);
    if (assignment) {
        // Store in session storage for persistence across page loads
        sessionStorage.setItem('editingAssignment', JSON.stringify(assignment));
        
        // Show editing UI
        showCreateAssignmentForm();
        
        // Populate form with assignment data
        const form = document.getElementById('assignment-form');
        if (form) {
            // Set form values
            form.elements['title'].value = assignment.title || '';
            form.elements['description'].value = assignment.description || '';
            form.elements['subject'].value = assignment.subject || '';
            form.elements['class'].value = assignment.class || '';
            form.elements['totalMarks'].value = assignment.totalMarks || 100;
            form.elements['instructions'].value = assignment.instructions || '';
            
            // Format date for input element
            if (assignment.dueDate) {
                const date = new Date(assignment.dueDate);
                const formattedDate = date.toISOString().slice(0, 16);
                form.elements['dueDate'].value = formattedDate;
            }
            
            // Update UI to reflect edit mode
            document.querySelector('.section-title').textContent = 'Edit Assignment';
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Assignment';
            
            // Add hidden field for assignment id
            const idField = document.createElement('input');
            idField.type = 'hidden';
            idField.name = 'id';
            idField.value = id;
            form.appendChild(idField);
        }
    }
}

function deleteAssignment(id) {
    // Use custom confirm dialog for better UX
    if (confirm('Are you sure you want to delete this assignment?')) {
        // Show loading state
        const card = document.querySelector(`.assignment-card[data-id="${id}"]`);
        if (card) {
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none';
        }
        
        // Delete with optimistic UI update
        app.deleteAssignment(id);
        
        // Remove from cache
        const cacheKey = `teacher_assignments_${assignmentManager.currentUser.id}`;
        if (assignmentManager.cache[cacheKey]) {
            assignmentManager.cache[cacheKey].data = 
                assignmentManager.cache[cacheKey].data.filter(a => a.id !== id);
        }
        
        // Reload assignments
        assignmentManager.loadTeacherAssignments();
    }
}

function publishAssignment(id) {
    // Optimistic UI update for better responsiveness
    const statusEl = document.querySelector(`.assignment-card[data-id="${id}"] .assignment-status`);
    if (statusEl) {
        statusEl.className = 'assignment-status status-active';
        statusEl.textContent = 'Active';
    }
    
    // Update backend
    app.updateAssignment(id, { status: 'active' });
    
    // Update cache
    const cacheKey = `teacher_assignments_${assignmentManager.currentUser.id}`;
    if (assignmentManager.cache[cacheKey]) {
        const assignment = assignmentManager.cache[cacheKey].data.find(a => a.id === id);
        if (assignment) {
            assignment.status = 'active';
        }
    }
    
    // Replace publish button with view submissions button
    const publishBtn = document.querySelector(`.assignment-card[data-id="${id}"] .publish-btn`);
    if (publishBtn) {
        const parent = publishBtn.parentElement;
        publishBtn.remove();
        
        // Add view submissions button if it doesn't exist
        if (!parent.querySelector('.view-btn')) {
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn btn-secondary view-btn';
            viewBtn.dataset.id = id;
            viewBtn.innerHTML = '<i class="fas fa-eye"></i> View Submissions';
            viewBtn.addEventListener('click', () => viewSubmissions(id));
            parent.appendChild(viewBtn);
        }
    }
}

function viewSubmissions(id) {
    // Store the assignment ID for filtering submissions
    sessionStorage.setItem('viewingAssignmentId', id);
    
    // Switch to submissions tab
    const submissionsTab = document.querySelector('.tab[data-tab="submissions"]');
    if (submissionsTab) {
        submissionsTab.click();
        
        // Highlight the submissions related to this assignment
        setTimeout(() => {
            const assignmentTitle = app.data.assignments.find(a => a.id === id)?.title || '';
            const submissionsList = document.getElementById('submissions-list');
            
            if (submissionsList && assignmentTitle) {
                const cards = submissionsList.querySelectorAll('.assignment-card');
                cards.forEach(card => {
                    if (card.querySelector('.assignment-title').textContent === assignmentTitle) {
                        card.style.borderLeftWidth = '4px';
                        card.style.borderLeftColor = 'var(--primary)';
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            }
        }, 300);
    }
}

function downloadSubmission(id) {
    // Implementation for downloading submission
    console.log('Download submission:', id);
    
    const submission = assignmentManager.submissions.find(s => s.id === id);
    if (submission && submission.fileUrl) {
        // Create a link element and trigger download
        const link = document.createElement('a');
        link.href = submission.fileUrl;
        link.download = submission.fileName || 'submission';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert('Submission file not available for download.');
    }
}

function saveDraft() {
    assignmentManager.saveDraft();
    
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = '<i class="fas fa-check-circle"></i> Draft saved successfully';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }, 10);
}

function showSubmissionModal(assignmentId) {
    assignmentManager.showSubmissionModal(assignmentId);
}

function closeSubmissionModal() {
    assignmentManager.closeSubmissionModal();
}

function showGradeModal(submissionId) {
    assignmentManager.showGradeModal(submissionId);
}

function closeGradeModal() {
    assignmentManager.closeGradeModal();
}

// Initialize when page loads with performance monitoring
let assignmentManager;
let pageLoadTime = performance.now();

document.addEventListener('DOMContentLoaded', () => {
    // Initialize assignment manager
    assignmentManager = new AssignmentManager();
    
    // Add event listeners to buttons
    const createAssignmentBtn = document.getElementById('create-assignment-btn');
    if (createAssignmentBtn) {
        createAssignmentBtn.addEventListener('click', showCreateAssignmentForm);
    }
    
    // Log page load performance
    console.log(`Page loaded in ${(performance.now() - pageLoadTime).toFixed(2)}ms`);
    
    // Restore scroll position if returning to the page
    const savedScrollPos = sessionStorage.getItem('assignmentsScrollPos');
    if (savedScrollPos) {
        window.scrollTo(0, parseInt(savedScrollPos));
        sessionStorage.removeItem('assignmentsScrollPos');
    }
    
    // Save scroll position when navigating away
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('assignmentsScrollPos', window.scrollY.toString());
    });
});

// Make functions available globally
window.goToDashboard = goToDashboard;
window.showCreateAssignmentForm = showCreateAssignmentForm;
window.editAssignment = editAssignment;
window.deleteAssignment = deleteAssignment;
window.publishAssignment = publishAssignment;
window.viewSubmissions = viewSubmissions;
window.downloadSubmission = downloadSubmission;
window.saveDraft = saveDraft;
window.showSubmissionModal = showSubmissionModal;
window.closeSubmissionModal = closeSubmissionModal;
window.showGradeModal = showGradeModal;
window.closeGradeModal = closeGradeModal;

// Make app available globally
window.app = Tophill PortalApp;