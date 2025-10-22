(function(window) {
    'use strict';

    class TeacherDashboardController {
        constructor({ app, authManager }) {
            this.app = app;
            this.authManager = authManager;
            this.currentTeacherUser = null;
            this.teacherProfile = null;
            this.teacherId = null;
            this.teacherClasses = [];
            this.teacherSubjects = [];
            this.teacherStudents = [];
            this.teacherResults = [];
            this.teacherSnapshot = null;
            this.communicationInterval = null;
            this.cachedAttendance = {
                date: null,
                className: null,
                records: []
            };
        }

        init() {
            if (!this.ensureAccess()) return;
            this.loadTeacherContext();
            this.renderDashboard();
            this.setupEventListeners();
            this.initializeCommunication();
        }

        ensureAccess() {
            if (!this.authManager?.requireAuth()) return false;

            if (!this.authManager.hasAccessLevel('teacher') || this.authManager.currentUser.role === 'student') {
                this.app.showNotification('Access denied. Teachers only.', 'error');
                this.authManager.redirectToLogin();
                return false;
            }

            this.currentTeacherUser = this.authManager.currentUser;
            this.teacherId = this.currentTeacherUser.teacherId || this.currentTeacherUser.id;
            this.teacherProfile = this.app.getTeacherById(this.teacherId) || {
                id: this.teacherId,
                name: this.currentTeacherUser.name || 'Teacher',
                classes: [],
                subjects: []
            };

            const teacherNameEl = document.getElementById('teacher-name');
            if (teacherNameEl) {
                teacherNameEl.textContent = this.teacherProfile.name || 'Teacher';
            }

            return true;
        }

        loadTeacherContext() {
            this.teacherSnapshot = this.app.getTeacherDashboardSnapshot(this.teacherId);

            this.teacherClasses = Array.isArray(this.teacherSnapshot?.classes)
                ? [...this.teacherSnapshot.classes]
                : Array.isArray(this.teacherProfile.classes)
                    ? [...this.teacherProfile.classes]
                    : [];

            this.teacherSubjects = Array.isArray(this.teacherSnapshot?.subjectsList)
                ? [...this.teacherSnapshot.subjectsList]
                : this.app.getSubjectsByTeacher(this.teacherId);

            this.teacherStudents = Array.isArray(this.teacherSnapshot?.studentsList)
                ? [...this.teacherSnapshot.studentsList]
                : this.app.getStudentsForTeacher(this.teacherId);

            this.teacherResults = Array.isArray(this.teacherSnapshot?.resultsList)
                ? [...this.teacherSnapshot.resultsList]
                : this.app.getResultsForTeacher(this.teacherId);
        }

        renderDashboard() {
            this.populateStudentsTable();
            this.populateSubjectsTable();
            this.populateResultsTable();
            this.populateFeesTable();
            this.populateActivities();
            this.updateTeacherStats();
            this.setupAttendanceControls();
            this.updateAttendanceOverview();
        }

        setupEventListeners() {
            document.querySelectorAll('.menu-item[data-page]').forEach(item => {
                item.addEventListener('click', (e) => {
                    const page = e.currentTarget.dataset.page;
                    this.showPage(page);
                });
            });

            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const targetTab = e.currentTarget.dataset.tab;
                    this.showTab(targetTab);
                });
            });
        }

        initializeCommunication() {
            if (typeof CommunicationManager === 'undefined') {
                return;
            }

            if (!(window.communicationManager instanceof CommunicationManager)) {
                window.communicationManager = new CommunicationManager({
                    userRole: 'teacher',
                    containerId: 'communication',
                    enableNotifications: true,
                    enableRealTime: true,
                    apiEndpoint: '../php'
                });
                window.communicationManager.initializeDashboardWidgets();
            }

            if (this.communicationInterval) {
                clearInterval(this.communicationInterval);
            }

            this.communicationInterval = setInterval(() => {
                if (window.communicationManager) {
                    window.communicationManager.refreshAll();
                }
            }, 30000);
        }

        populateStudentsTable() {
            const tbody = document.querySelector('#teacher-students-table tbody');
            if (!tbody) return;

            if (!this.teacherStudents.length) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted">No students assigned to your classes yet.</td>
                    </tr>
                `;
                return;
            }

            const rows = this.teacherStudents.map(student => {
                const subjects = Array.isArray(student.subjects) ? student.subjects.join(', ') : (student.subjects || 'N/A');
                return `
                    <tr>
                        <td>${student.id}</td>
                        <td>${student.name}</td>
                        <td>${student.class}</td>
                        <td>${subjects}</td>
                        <td>${student.phone || 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="viewStudentDetails('${student.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.innerHTML = rows;
        }

        populateSubjectsTable() {
            const tbody = document.querySelector('#teacher-subjects-table tbody');
            if (!tbody) return;

            if (!this.teacherSubjects.length) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted">No subjects assigned yet.</td>
                    </tr>
                `;
                return;
            }

            const rows = this.teacherSubjects.map(subject => {
                const subjectCode = subject.code || subject.id;
                const classes = Array.isArray(subject.classes) && subject.classes.length
                    ? subject.classes.join(', ')
                    : (subject.class || 'Multiple');

                const enrolledCount = this.teacherStudents.filter(student =>
                    Array.isArray(student.subjects) && student.subjects.includes(subjectCode)
                ).length;

                return `
                    <tr>
                        <td>${subjectCode}</td>
                        <td>${subject.name}</td>
                        <td>${classes}</td>
                        <td>${enrolledCount}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="manageSubject('${subjectCode}')">
                                <i class="fas fa-cog"></i> Manage
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.innerHTML = rows;
        }

        populateResultsTable() {
            const tbody = document.querySelector('#teacher-results-table tbody');
            if (!tbody) return;

            if (!this.teacherResults.length) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted">No results recorded for your students yet.</td>
                    </tr>
                `;
                return;
            }

            const studentMap = new Map(this.teacherStudents.map(student => [student.id, student]));
            const subjectMap = new Map(this.teacherSubjects.map(subject => [subject.code || subject.id, subject]));

            const rows = this.teacherResults.map(result => {
                const student = studentMap.get(result.studentId);
                const subjectCode = result.subjectCode || result.subjectId || result.subject;
                const subject = subjectMap.get(subjectCode) || this.app.getSubjectByCode(subjectCode);

                return `
                    <tr>
                        <td>${student ? student.name : 'Unknown'}</td>
                        <td>${subject ? subject.name : (result.subject || subjectCode || 'N/A')}</td>
                        <td>${result.assessmentType || 'Exam'}</td>
                        <td>${result.score ?? 'N/A'}</td>
                        <td>${result.grade ?? 'N/A'}</td>
                        <td>${result.date ? new Date(result.date).toLocaleDateString() : 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="editResult('${result.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.innerHTML = rows;
        }

        populateFeesTable() {
            const tbody = document.querySelector('#teacher-fees-table tbody');
            if (!tbody) return;

            if (!this.teacherStudents.length) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted">No students assigned to show payment information.</td>
                    </tr>
                `;
                return;
            }

            const rows = this.teacherStudents.map(student => {
                const paymentSummary = typeof this.app.getStudentPaymentSummary === 'function'
                    ? this.app.getStudentPaymentSummary(student.id)
                    : null;

                if (!paymentSummary) {
                    return `
                        <tr>
                            <td>
                                <div class="student-info">
                                    <strong>${student.name}</strong>
                                    <small class="text-muted d-block">${student.id}</small>
                                </div>
                            </td>
                            <td><span class="badge badge-primary">${student.class}</span></td>
                            <td class="text-right">₦0.00</td>
                            <td class="text-right">₦0.00</td>
                            <td class="text-right">₦0.00</td>
                            <td><span class="badge badge-secondary">Not Set</span></td>
                            <td class="text-center">No data</td>
                        </tr>
                    `;
                }

                const statusClass = {
                    paid: 'success',
                    partial: 'warning',
                    unpaid: 'danger',
                    not_configured: 'secondary'
                }[paymentSummary.status] || 'secondary';

                const statusText = {
                    paid: 'Paid',
                    partial: 'Partial',
                    unpaid: 'Unpaid',
                    not_configured: 'Not Set'
                }[paymentSummary.status] || 'Unknown';

                const lastPaymentDate = paymentSummary.latestPaymentDate
                    ? new Date(paymentSummary.latestPaymentDate).toLocaleDateString()
                    : 'No payments';

                return `
                    <tr>
                        <td>
                            <div class="student-info">
                                <strong>${student.name}</strong>
                                <small class="text-muted d-block">${student.id}</small>
                            </div>
                        </td>
                        <td><span class="badge badge-primary">${student.class}</span></td>
                        <td class="text-right">₦${paymentSummary.totalExpected.toLocaleString()}</td>
                        <td class="text-right">₦${paymentSummary.totalPaid.toLocaleString()}</td>
                        <td class="text-right">₦${paymentSummary.balance.toLocaleString()}</td>
                        <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                        <td class="text-center">${lastPaymentDate}</td>
                    </tr>
                `;
            }).join('');

            tbody.innerHTML = rows;
        }

        populateActivities() {
            const container = document.getElementById('teacher-activities');
            if (!container) return;

            const activities = [];

            const recentResults = this.teacherResults
                .slice(-5)
                .reverse()
                .map(result => ({
                    type: 'Result',
                    description: `Updated ${result.subject || result.subjectCode || 'Subject'} score for ${result.studentName || result.studentId}`,
                    timestamp: result.date ? new Date(result.date) : new Date()
                }));

            const assignments = this.app.getAssignmentsForUser
                ? this.app.getAssignmentsForUser('teacher', this.teacherId)
                : [];

            const recentAssignments = (assignments || [])
                .slice(-3)
                .reverse()
                .map(assignment => ({
                    type: 'Assignment',
                    description: `Assignment "${assignment.title}" for ${assignment.class || assignment.classes?.join(', ') || 'your classes'}`,
                    timestamp: assignment.dueDate ? new Date(assignment.dueDate) : new Date(assignment.createdAt || Date.now())
                }));

            activities.push(...recentResults, ...recentAssignments);

            if (!activities.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>No recent activities</h3>
                        <p>Your latest teaching activities will appear here.</p>
                    </div>
                `;
                return;
            }

            activities.sort((a, b) => b.timestamp - a.timestamp);

            container.innerHTML = activities.slice(0, 8).map(activity => {
                const icon = activity.type === 'Assignment' ? 'fa-tasks' : 'fa-clipboard-check';
                return `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="activity-content">
                            <h4>${activity.type}</h4>
                            <p>${activity.description}</p>
                            <span class="activity-time">${activity.timestamp.toLocaleString()}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        updateTeacherStats() {
            if (!this.teacherSnapshot) return;

            const { students, subjects, pendingGrades, classesToday } = this.teacherSnapshot;

            const studentCountEl = document.getElementById('teacher-student-count');
            const subjectCountEl = document.getElementById('teacher-subject-count');
            const pendingGradesEl = document.getElementById('teacher-pending-grades');
            const classesTodayEl = document.getElementById('teacher-classes-today');

            if (studentCountEl) studentCountEl.textContent = students ?? this.teacherStudents.length;
            if (subjectCountEl) subjectCountEl.textContent = subjects ?? this.teacherSubjects.length;
            if (pendingGradesEl) pendingGradesEl.textContent = pendingGrades ?? 0;
            if (classesTodayEl) classesTodayEl.textContent = classesToday ?? Math.min(this.teacherSubjects.length, 3);
        }

        setupAttendanceControls() {
            const globalClasses = typeof this.app.getClassList === 'function'
                ? this.app.getClassList()
                : [];

            const classes = this.teacherClasses && this.teacherClasses.length
                ? globalClasses.filter(className => this.teacherClasses.includes(className))
                : globalClasses;
            const selects = ['attendance-class', 'report-class', 'stats-class'];

            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (!select) return;
                select.innerHTML = '<option value="">Select Class</option>';
                classes.forEach(className => {
                    const option = document.createElement('option');
                    option.value = className;
                    option.textContent = className;
                    select.appendChild(option);
                });
            });

            const today = new Date().toISOString().split('T')[0];
            const attendanceDateInput = document.getElementById('attendance-date');
            if (attendanceDateInput && !attendanceDateInput.value) {
                attendanceDateInput.value = today;
            }

            const reportStartDate = document.getElementById('report-start-date');
            const reportEndDate = document.getElementById('report-end-date');
            if (reportStartDate && reportEndDate && !reportStartDate.value && !reportEndDate.value) {
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                reportStartDate.value = firstDayOfMonth.toISOString().split('T')[0];
                reportEndDate.value = today;
            }
        }

        loadDailyAttendance() {
            const selectedClass = document.getElementById('attendance-class')?.value;
            const selectedDate = document.getElementById('attendance-date')?.value;

            if (!selectedClass || !selectedDate) {
                this.app.showNotification('Please select both class and date', 'error');
                return;
            }

            if (!this.teacherClasses.includes(selectedClass)) {
                this.app.showNotification('You are not assigned to this class.', 'error');
                return;
            }

            const classStudents = this.teacherStudents.filter(s => s.class === selectedClass);
            const existingAttendance = this.app.getAttendance(selectedDate, selectedClass);

            this.cachedAttendance = {
                date: selectedDate,
                className: selectedClass,
                records: existingAttendance?.records || []
            };

            this.renderAttendanceList(classStudents, existingAttendance);
            this.updateAttendanceOverview();
        }

        renderAttendanceList(students, existingAttendance = null) {
            const attendanceList = document.getElementById('attendance-list');
            if (!attendanceList) return;

            if (!students.length) {
                attendanceList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users-slash"></i>
                        <h3>No students found</h3>
                        <p>No students in the selected class</p>
                    </div>
                `;
                return;
            }

            attendanceList.innerHTML = students.map(student => {
                let currentStatus = 'present';
                if (existingAttendance) {
                    const record = existingAttendance.records.find(r => r.studentId === student.id);
                    if (record) {
                        currentStatus = record.status;
                    }
                }

                const initials = student.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                return `
                    <div class="attendance-student" data-student-id="${student.id}" data-status="${currentStatus}">
                        <div class="student-info">
                            <div class="student-avatar">${initials}</div>
                            <div class="student-details">
                                <h4>${student.name}</h4>
                                <p>ID: ${student.id} | Roll: ${student.rollNumber || 'N/A'}</p>
                            </div>
                        </div>
                        <div class="attendance-controls-student">
                            ${this.renderAttendanceButtons(student.id, currentStatus)}
                        </div>
                    </div>
                `;
            }).join('');
        }

        renderAttendanceButtons(studentId, currentStatus) {
            const statuses = [
                { key: 'present', icon: 'check', label: 'Present' },
                { key: 'absent', icon: 'times', label: 'Absent' },
                { key: 'late', icon: 'clock', label: 'Late' },
                { key: 'excused', icon: 'user-check', label: 'Excused' },
                { key: 'sick', icon: 'user-injured', label: 'Sick' }
            ];

            return statuses.map(status => `
                <button class="attendance-status ${status.key} ${currentStatus === status.key ? 'active' : ''}" 
                        onclick="setAttendanceStatus('${studentId}', '${status.key}', this)">
                    <i class="fas fa-${status.icon}"></i> ${status.label}
                </button>
            `).join('');
        }

        setAttendanceStatus(studentId, status, button) {
            const studentRow = button.closest('.attendance-student');
            if (!studentRow) return;

            studentRow.dataset.status = status;

            const allButtons = studentRow.querySelectorAll('.attendance-status');
            allButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            this.updateAttendanceOverview();
        }

        updateAttendanceOverview() {
            const attendanceList = document.getElementById('attendance-list');
            if (!attendanceList) return;

            const students = attendanceList.querySelectorAll('.attendance-student');

            let presentCount = 0;
            let absentCount = 0;
            let lateCount = 0;
            const totalStudents = students.length;

            students.forEach(student => {
                const status = student.dataset.status || 'present';
                switch (status) {
                    case 'present':
                        presentCount++;
                        break;
                    case 'absent':
                        absentCount++;
                        break;
                    case 'late':
                        lateCount++;
                        break;
                    default:
                        break;
                }
            });

            const presentCountEl = document.getElementById('present-count');
            const absentCountEl = document.getElementById('absent-count');
            const lateCountEl = document.getElementById('late-count');
            const totalStudentsEl = document.getElementById('total-students');

            if (presentCountEl) presentCountEl.textContent = presentCount;
            if (absentCountEl) absentCountEl.textContent = absentCount;
            if (lateCountEl) lateCountEl.textContent = lateCount;
            if (totalStudentsEl) totalStudentsEl.textContent = totalStudents;
        }

        markAllPresent() {
            this.updateAllAttendanceRows('present');
        }

        markAllAbsent() {
            this.updateAllAttendanceRows('absent');
        }

        updateAllAttendanceRows(status) {
            const students = document.querySelectorAll('.attendance-student');
            students.forEach(student => {
                const targetButton = student.querySelector(`.attendance-status.${status}`);
                if (targetButton) {
                    this.setAttendanceStatus(student.dataset.studentId, status, targetButton);
                }
            });
        }

        saveAttendance() {
            const selectedClass = document.getElementById('attendance-class')?.value;
            const selectedDate = document.getElementById('attendance-date')?.value;

            if (!selectedClass || !selectedDate) {
                this.app.showNotification('Please select both class and date', 'error');
                return;
            }

            if (!this.teacherClasses.includes(selectedClass)) {
                this.app.showNotification('You are not assigned to this class.', 'error');
                return;
            }

            const students = document.querySelectorAll('.attendance-student');
            if (!students.length) {
                this.app.showNotification('No students to save attendance for.', 'warning');
                return;
            }

            const records = Array.from(students).map(student => ({
                studentId: student.dataset.studentId,
                status: student.dataset.status || 'present',
                markedAt: new Date().toISOString()
            }));

            const attendanceData = {
                date: selectedDate,
                class: selectedClass,
                records
            };

            const result = this.app.markAttendance(attendanceData);
            if (result) {
                this.app.showNotification('Attendance saved successfully', 'success');
            }
        }

        generateAttendanceReport() {
            const selectedClass = document.getElementById('report-class')?.value;
            const startDate = document.getElementById('report-start-date')?.value;
            const endDate = document.getElementById('report-end-date')?.value;

            if (!selectedClass || !startDate || !endDate) {
                this.app.showNotification('Please fill in all report parameters', 'error');
                return;
            }

            if (!this.teacherClasses.includes(selectedClass)) {
                this.app.showNotification('You are not assigned to this class.', 'error');
                return;
            }

            const classAttendance = this.app.getClassAttendanceSummary(selectedClass, startDate, endDate);
            this.renderAttendanceReport(classAttendance);
        }

        renderAttendanceReport(classAttendance) {
            const reportSummary = document.getElementById('report-summary');
            const studentReports = document.getElementById('student-reports');

            if (!reportSummary || !studentReports) return;

            if (!classAttendance || !classAttendance.students) {
                reportSummary.innerHTML = '<p>No data available for the selected period.</p>';
                studentReports.innerHTML = '';
                return;
            }

            reportSummary.innerHTML = `
                <div class="content-section">
                    <div class="section-header">
                        <div class="section-title">Class Summary - ${classAttendance.className}</div>
                    </div>
                    <div class="dashboard-cards">
                        <div class="card">
                            <div class="card-icon" style="background-color: rgba(31, 51, 90, 0.1); color: var(--primary);">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="card-title">Total Students</div>
                            <div class="card-value">${classAttendance.stats.totalStudents}</div>
                        </div>
                        <div class="card">
                            <div class="card-icon" style="background-color: rgba(16, 185, 129, 0.1); color: #10b981;">
                                <i class="fas fa-percentage"></i>
                            </div>
                            <div class="card-title">Average Attendance</div>
                            <div class="card-value">${classAttendance.stats.averageAttendance.toFixed(1)}%</div>
                        </div>
                        <div class="card">
                            <div class="card-icon" style="background-color: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                                <i class="fas fa-calendar-day"></i>
                            </div>
                            <div class="card-title">Working Days</div>
                            <div class="card-value">${classAttendance.stats.totalWorkingDays}</div>
                        </div>
                    </div>
                </div>
            `;

            studentReports.innerHTML = classAttendance.students.map(student => {
                const percentageClass = student.attendancePercentage >= 90
                    ? 'percentage-excellent'
                    : student.attendancePercentage >= 75
                        ? 'percentage-good'
                        : 'percentage-poor';

                return `
                    <div class="student-report-card">
                        <div class="report-student-header">
                            <div class="report-student-name">${student.studentName}</div>
                            <div class="attendance-percentage ${percentageClass}">
                                ${student.attendancePercentage}% Attendance
                            </div>
                        </div>
                        <div class="report-stats">
                            <div class="report-stat">
                                <div class="report-stat-number">${student.presentDays}</div>
                                <div class="report-stat-label">Present</div>
                            </div>
                            <div class="report-stat">
                                <div class="report-stat-number">${student.absentDays}</div>
                                <div class="report-stat-label">Absent</div>
                            </div>
                            <div class="report-stat">
                                <div class="report-stat-number">${student.lateDays}</div>
                                <div class="report-stat-label">Late</div>
                            </div>
                            <div class="report-stat">
                                <div class="report-stat-number">${student.excusedDays}</div>
                                <div class="report-stat-label">Excused</div>
                            </div>
                            <div class="report-stat">
                                <div class="report-stat-number">${student.sickDays}</div>
                                <div class="report-stat-label">Sick</div>
                            </div>
                            <div class="report-stat">
                                <div class="report-stat-number">${student.workingDays}</div>
                                <div class="report-stat-label">Total Days</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        exportAttendanceReport() {
            this.app.showNotification('Attendance report export coming soon.', 'info');
        }

        loadAttendanceStats() {
            this.app.showNotification('Attendance statistics are being prepared.', 'info');
        }

        showMarkHolidayModal() {
            this.app.showNotification('Holiday management is coming soon.', 'info');
        }

        loadAttendance() {
            this.loadDailyAttendance();
        }

        createAssignment() {
            window.location.href = 'assignments.html';
        }

        createAnnouncement() {
            if (window.communicationManager) {
                window.communicationManager.createAnnouncement();
            } else {
                this.app.showNotification('Communication module not ready yet.', 'warning');
            }
        }

        viewStudentDetails(studentId) {
            if (!this.authManager.canAccessStudentData(studentId)) {
                this.app.showNotification('Access denied for this student', 'error');
                return;
            }
            this.app.showNotification(`Opening profile for student ${studentId}`, 'info');
        }

        manageSubject(subjectCode) {
            this.app.showNotification(`Managing subject ${subjectCode}`, 'info');
        }

        editResult(resultId) {
            this.app.showNotification(`Editing result ${resultId}`, 'info');
        }

        showAddResultForm() {
            this.showPage('results');
            this.app.showNotification('Ready to add a new result', 'info');
        }

        showQuickGradeEntry() {
            this.showPage('results');
        }

        viewMySchedule() {
            this.app.showNotification('Schedule view coming soon.', 'info');
        }

        showPage(pageId) {
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });

            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
            }

            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            const activeMenuItem = document.querySelector(`.menu-item[data-page="${pageId}"]`);
            if (activeMenuItem) {
                activeMenuItem.classList.add('active');
            }
        }

        showTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
            }

            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });

            const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
            if (activeTab) {
                activeTab.classList.add('active');
            }
        }
    }

    function exposeControllerMethods(controller) {
        if (!controller) return;

        const methodMap = {
            loadDailyAttendance: 'loadDailyAttendance',
            saveAttendance: 'saveAttendance',
            markAllPresent: 'markAllPresent',
            markAllAbsent: 'markAllAbsent',
            generateAttendanceReport: 'generateAttendanceReport',
            exportAttendanceReport: 'exportAttendanceReport',
            loadAttendanceStats: 'loadAttendanceStats',
            showMarkHolidayModal: 'showMarkHolidayModal',
            loadAttendance: 'loadAttendance',
            createAssignment: 'createAssignment',
            createAnnouncement: 'createAnnouncement',
            viewStudentDetails: 'viewStudentDetails',
            manageSubject: 'manageSubject',
            editResult: 'editResult',
            showAddResultForm: 'showAddResultForm',
            showQuickGradeEntry: 'showQuickGradeEntry',
            viewMySchedule: 'viewMySchedule'
        };

        Object.entries(methodMap).forEach(([globalName, methodName]) => {
            window[globalName] = (...args) => {
                if (typeof controller[methodName] === 'function') {
                    return controller[methodName](...args);
                }
                console.warn(`TeacherDashboardController.${methodName} is not available.`);
                return undefined;
            };
        });

        window.setAttendanceStatus = (studentId, status, button) => {
            if (typeof controller.setAttendanceStatus === 'function') {
                controller.setAttendanceStatus(studentId, status, button);
            }
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.app && window.authManager) {
                const controller = new TeacherDashboardController({ app: window.app, authManager: window.authManager });
                window.teacherDashboardController = controller;
                controller.init();
                exposeControllerMethods(controller);
            }
        }, 100);
    });

    window.TeacherDashboardController = TeacherDashboardController;
})(window);
