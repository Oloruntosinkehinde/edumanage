// Enhanced School Management System
// Integration with new backend components

// Global instances
let app, authManager, csvManager, notificationManager;

function populateGlobalClassSelects() {
    if (!app || typeof app.getClassList !== 'function') return;

    const classes = app.getClassList();

    document.querySelectorAll('select[data-class-select]').forEach(select => {
        const previousSelection = Array.from(select.selectedOptions).map(option => option.value);
        const placeholderText = select.dataset.placeholder || (select.multiple ? 'Select Classes' : 'Select Class');

        select.innerHTML = '';

        if (!select.multiple || select.dataset.includePlaceholder === 'true') {
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = placeholderText;
            if (!select.multiple) {
                placeholderOption.selected = !previousSelection.length;
            } else {
                placeholderOption.disabled = true;
            }
            select.appendChild(placeholderOption);
        }

        classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            if (previousSelection.includes(className)) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        if (!select.multiple && previousSelection.length && !classes.includes(previousSelection[0])) {
            select.value = previousSelection[0];
        }
    });
}

// Initialize the enhanced application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize core components
    app = window.Tophill PortalApp;
    notificationManager = new NotificationManager();
    authManager = new AuthManager(app);
    csvManager = new CSVManager(app);

    window.app = app;
    window.notificationManager = notificationManager;
    window.csvManager = csvManager;
    window.authManager = authManager;
    
    // Override app notification method to use new notification manager
    app.showNotification = (message, type) => {
        notificationManager.show(message, type);
    };
    
    // Initialize UI components
    initializeApplication();
});

function initializeApplication() {
    // Check authentication for protected pages
    const protectedPages = ['index.html', 'students.html', 'teachers.html', 'subjects.html', 'results.html', 'settings.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !authManager.isLoggedIn()) {
        authManager.redirectToLogin();
        return;
    }
    
    // Initialize UI based on page type
    const pageContents = document.querySelectorAll('.page-content');
    
    if (pageContents.length > 1) {
        // Single-page mode
        initializeMenuNavigation();
    } else {
        // Multi-page mode
        initializePageNavigation();
        setActiveMenuItem();
    }
    
    // Initialize other components
    initializeTabs();
    initializeEnhancedCSV();
    initializeDataTables();
    initializeSearch();
    setupResponsiveBehavior();
    
    // Update UI with current data
    app.updateDashboardStats();
    populateGlobalClassSelects();
}

// Enhanced CSV Integration
function initializeEnhancedCSV() {
    // Replace old CSV upload with enhanced version
    const csvButtons = document.querySelectorAll('[onclick*="uploadCSV"]');
    csvButtons.forEach(button => {
        button.onclick = () => showCSVImportDialog();
    });
    
    // Add CSV export buttons
    addCSVExportButtons();
}

function showCSVImportDialog() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>Import Data</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Select Data Type:</label>
                    <select id="importDataType" class="form-control">
                        <option value="students">Students</option>
                        <option value="teachers">Teachers</option>
                        <option value="subjects">Subjects</option>
                        <option value="results">Results</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">CSV File:</label>
                    <input type="file" id="importFile" class="form-control" accept=".csv" required>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="skipDuplicates" checked>
                        Skip duplicate records
                    </label>
                </div>
                <div class="alert alert-info">
                    <strong>Need a template?</strong> 
                    <button class="btn btn-sm btn-primary" onclick="downloadTemplate()">Download Template</button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="processImport()">Import</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-overlay')) {
            modal.remove();
        }
    });
}

function downloadTemplate() {
    const dataType = document.getElementById('importDataType').value;
    csvManager.downloadTemplate(dataType);
}

async function processImport() {
    const dataType = document.getElementById('importDataType').value;
    const fileInput = document.getElementById('importFile');
    const skipDuplicates = document.getElementById('skipDuplicates').checked;
    
    if (!fileInput.files[0]) {
        notificationManager.show('Please select a file', 'error');
        return;
    }
    
    const result = await csvManager.importData(fileInput.files[0], dataType, { skipDuplicates });
    
    if (result.success) {
        document.querySelector('.modal').remove();
        app.updateUI(dataType);
    }
}

function addCSVExportButtons() {
    const headers = document.querySelectorAll('.section-header, .table-header');
    headers.forEach(header => {
        if (!header.querySelector('.export-btn')) {
            const exportBtn = document.createElement('button');
            exportBtn.className = 'btn btn-secondary btn-sm export-btn';
            exportBtn.innerHTML = '<i class="fas fa-download"></i> Export CSV';
            exportBtn.onclick = () => {
                const section = header.closest('.content-section');
                const dataType = section.id || getCurrentDataType();
                csvManager.exportData(dataType);
            };
            
            const actions = header.querySelector('.section-actions') || header;
            actions.appendChild(exportBtn);
        }
    });
}

function getCurrentDataType() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '');
    return page === 'index' ? 'dashboard' : page;
}

// Enhanced Data Tables
function initializeDataTables() {
    const tables = document.querySelectorAll('.data-table');
    tables.forEach(table => {
        enhanceTable(table);
    });
}

function enhanceTable(table) {
    const container = table.closest('.table-container');
    if (!container) return;
    
    // Add search functionality
    addTableSearch(container, table);
    
    // Add pagination
    addTablePagination(container, table);
    
    // Add sorting
    addTableSorting(table);
}

function addTableSearch(container, table) {
    const header = container.querySelector('.table-header');
    if (!header || header.querySelector('.search-input')) return;
    
    const searchGroup = document.createElement('div');
    searchGroup.className = 'input-group';
    searchGroup.innerHTML = `
        <span class="input-group-addon">
            <i class="fas fa-search"></i>
        </span>
        <input type="text" class="form-control search-input" placeholder="Search...">
    `;
    
    header.appendChild(searchGroup);
    
    const searchInput = searchGroup.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
        filterTable(table, e.target.value);
    });
}

function filterTable(table, searchTerm) {
    const rows = table.querySelectorAll('tbody tr');
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

// Enhanced Search System
function initializeSearch() {

    window.populateGlobalClassSelects = populateGlobalClassSelects;
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce((e) => {
            const searchTerm = e.target.value;
            const tableType = e.target.dataset.table || getCurrentDataType();
            performSearch(tableType, searchTerm);
        }, 300));
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function performSearch(type, searchTerm) {
    if (searchTerm.length < 2 && searchTerm.length > 0) return;
    
    const filters = searchTerm ? { searchTerm } : {};
    const results = app.read(type, filters);
    
    updateDataDisplay(type, results);
}

function updateDataDisplay(type, data) {
    const table = document.querySelector(`[data-type="${type}"] .data-table tbody`);
    if (!table) return;
    
    table.innerHTML = '';
    
    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="100%" class="text-center" style="padding: 40px;">
                    <i class="fas fa-search" style="font-size: 2rem; color: #ccc; margin-bottom: 10px;"></i>
                    <p>No results found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    data.forEach(item => {
        const row = createTableRow(type, item);
        table.appendChild(row);
    });
}

function createTableRow(type, item) {
    const row = document.createElement('tr');
    
    switch (type) {
        case 'students':
            row.innerHTML = `
                <td data-label="ID">${item.id}</td>
                <td data-label="Name">${item.name}</td>
                <td data-label="Email">${item.email}</td>
                <td data-label="Class">${item.class}</td>
                <td data-label="Status">
                    <span class="badge badge-${item.status === 'active' ? 'success' : 'secondary'}">
                        ${item.status}
                    </span>
                </td>
                <td data-label="Actions" class="actions">
                    <button class="btn btn-sm btn-primary" onclick="editStudent('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            break;
        // Add cases for other types...
    }
    
    return row;
}

// Enhanced Mobile Menu
function setupResponsiveBehavior() {
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                !sidebar.contains(e.target) && 
                !mobileMenuToggle.contains(e.target) &&
                sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && sidebar) {
            sidebar.classList.remove('active');
        }
    });
}

// Legacy function compatibility
function uploadCSV() {
    showCSVImportDialog();
}

function downloadPDF(pageType) {
    // Enhanced PDF generation with current data
    const data = app.read(pageType) || [];
    generateEnhancedPDF(pageType, data);
}

function generateEnhancedPDF(pageType, data) {
    // Create enhanced PDF with real data
    const printWindow = window.open('', '_blank');
    
    let content = '';
    let title = '';
    
    switch(pageType) {
        case 'dashboard':
            title = 'Dashboard Report';
            content = generateDashboardPDF();
            break;
        case 'students':
            title = 'Student List Report';
            content = generateStudentsReportPDF(data);
            break;
        case 'teachers':
            title = 'Teacher List Report';
            content = generateTeachersReportPDF(data);
            break;
        default:
            title = 'School Management Report';
            content = generateGenericPDF();
    }
    
    const pdfHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: 'Inter', Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6366f1; padding-bottom: 15px; }
                .header h1 { color: #6366f1; margin-bottom: 5px; }
                .school-info { margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
                th { background-color: #f1f5f9; font-weight: 600; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
                .stat-box { border: 1px solid #e2e8f0; padding: 20px; text-align: center; border-radius: 8px; }
                .stat-value { font-size: 28px; font-weight: 700; color: #6366f1; margin-bottom: 5px; }
                .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
                .badge-success { background: #dcfce7; color: #166534; }
                .badge-secondary { background: #f1f5f9; color: #475569; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Tophill Portal School System</h1>
                <h2>${title}</h2>
                <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            <div class="school-info">
                <strong>School:</strong> Excel Academy<br>
                <strong>Academic Year:</strong> 2024-2025<br>
                <strong>Total Records:</strong> ${data.length || 'N/A'}<br>
                <strong>Report Generated By:</strong> ${authManager.getCurrentUser()?.name || 'System'}
            </div>
            ${content}
        </body>
        </html>
    `;
    
    printWindow.document.write(pdfHTML);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

function generateStudentsReportPDF(students) {
    if (!students || students.length === 0) {
        return '<p>No student data available.</p>';
    }
    
    return `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Class</th>
                    <th>Guardian</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(student => `
                    <tr>
                        <td>${student.id}</td>
                        <td>${student.name}</td>
                        <td>${student.email}</td>
                        <td>${student.class}</td>
                        <td>${student.guardian || 'N/A'}</td>
                        <td>
                            <span class="badge badge-${student.status === 'active' ? 'success' : 'secondary'}">
                                ${student.status}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function generateTeachersReportPDF(teachers) {
    if (!teachers || teachers.length === 0) {
        return '<p>No teacher data available.</p>';
    }
    
    return `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Qualification</th>
                    <th>Experience</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${teachers.map(teacher => `
                    <tr>
                        <td>${teacher.id}</td>
                        <td>${teacher.name}</td>
                        <td>${teacher.email}</td>
                        <td>${teacher.qualification || 'N/A'}</td>
                        <td>${teacher.experience || 'N/A'}</td>
                        <td>
                            <span class="badge badge-${teacher.status === 'active' ? 'success' : 'secondary'}">
                                ${teacher.status}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Menu item functionality for multi-page navigation
function initializePageNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page');
            
            // Navigate to the appropriate page
            if (pageId === 'dashboard') {
                window.location.href = 'index.html';
            } else {
                window.location.href = `${pageId}.html`;
            }
        });
    });
}

// Tab functionality
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabId = tab.getAttribute('data-tab');
            const tabElement = document.getElementById(tabId);
            if (tabElement) {
                tabElement.classList.add('active');
            }
        });
    });
}

// Set active menu item based on current page
function setActiveMenuItem() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.classList.remove('active');
        const pageId = item.getAttribute('data-page');
        if (pageId === currentPage || (currentPage === 'index' && pageId === 'dashboard')) {
            item.classList.add('active');
        }
    });
}

// Demo data for the dashboard (could be replaced with actual data from backend)
const demoData = {
    students: 1254,
    teachers: 48,
    subjects: 32,
    results: 4832
};

// Responsive behavior
function handleResize() {
    if (window.innerWidth <= 768) {
        if (sidebar) {
            sidebar.style.width = '0';
        }
        if (mobileMenuToggle) {
            mobileMenuToggle.style.display = 'block';
        }
    } else {
        if (sidebar) {
            sidebar.style.width = '';
        }
        if (mobileMenuToggle) {
            mobileMenuToggle.style.display = 'none';
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're in single-page mode or multi-page mode
    const pageContents = document.querySelectorAll('.page-content');
    
    if (pageContents.length > 1) {
        // Single-page mode (all content in one file)
        initializeMenuNavigation();
    } else {
        // Multi-page mode (separate files)
        initializePageNavigation();
        setActiveMenuItem();
    }
    
    // Initialize tabs if they exist
    initializeTabs();
    
    // Set up responsive behavior
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    
    // Initialize CSV file input handler
    initializeCSVHandler();
});

// PDF Download Functions
function downloadPDF(pageType) {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    
    // Get current page content
    let content = '';
    let title = '';
    
    switch(pageType) {
        case 'dashboard':
            title = 'Dashboard Report';
            content = generateDashboardPDF();
            break;
        case 'students':
            title = 'Student List Report';
            content = generateStudentsPDF();
            break;
        case 'teachers':
            title = 'Teacher List Report';
            content = generateTeachersPDF();
            break;
        case 'subjects':
            title = 'Subject Management Report';
            content = generateSubjectsPDF();
            break;
        case 'results':
            title = 'Results Report';
            content = generateResultsPDF();
            break;
        case 'settings':
            title = 'System Settings Report';
            content = generateSettingsPDF();
            break;
        default:
            title = 'School Management Report';
            content = generateGenericPDF();
    }
    
    // Write PDF-ready HTML to new window
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4361ee; padding-bottom: 10px; }
                .school-info { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
                .stat-box { border: 1px solid #ddd; padding: 15px; text-align: center; }
                .stat-value { font-size: 24px; font-weight: bold; color: #4361ee; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Tophill Portal School System</h1>
                <h2>${title}</h2>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="school-info">
                <strong>School:</strong> Excel Academy<br>
                <strong>Academic Year:</strong> 2023-2024<br>
                <strong>Report Date:</strong> ${new Date().toLocaleDateString()}
            </div>
            ${content}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

function generateDashboardPDF() {
    return `
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-value">1,254</div>
                <div>Total Students</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">48</div>
                <div>Teachers</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">32</div>
                <div>Subjects</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">4,832</div>
                <div>Results Processed</div>
            </div>
        </div>
        <table>
            <thead>
                <tr><th>Date</th><th>Activity</th><th>User</th><th>Status</th></tr>
            </thead>
            <tbody>
                <tr><td>12 Oct 2023</td><td>Added new student records</td><td>Admin User</td><td>Completed</td></tr>
                <tr><td>11 Oct 2023</td><td>Updated Physics results</td><td>Dr. Smith</td><td>Completed</td></tr>
                <tr><td>10 Oct 2023</td><td>Added new subject: Computer Science</td><td>Admin User</td><td>Completed</td></tr>
                <tr><td>09 Oct 2023</td><td>Finalized term results</td><td>Ms. Davis</td><td>Completed</td></tr>
            </tbody>
        </table>
    `;
}

function generateStudentsPDF() {
    return `
        <table>
            <thead>
                <tr><th>ID</th><th>Name</th><th>Class</th><th>Subjects</th></tr>
            </thead>
            <tbody>
                <tr><td>S001</td><td>John Smith</td><td>10-A</td><td>Math, Physics, Chemistry</td></tr>
                <tr><td>S002</td><td>Emma Johnson</td><td>9-B</td><td>Biology, English, History</td></tr>
                <tr><td>S003</td><td>Michael Brown</td><td>11-C</td><td>Math, Computer Science, Physics</td></tr>
                <tr><td>S004</td><td>Sarah Williams</td><td>10-A</td><td>Chemistry, Biology, English</td></tr>
            </tbody>
        </table>
    `;
}

function generateTeachersPDF() {
    return `
        <table>
            <thead>
                <tr><th>ID</th><th>Name</th><th>Subjects</th><th>Classes</th><th>Status</th></tr>
            </thead>
            <tbody>
                <tr><td>T001</td><td>Mr. Johnson</td><td>Mathematics</td><td>10-A, 10-B, 11-A</td><td>Active</td></tr>
                <tr><td>T002</td><td>Dr. Smith</td><td>Physics</td><td>10-A, 11-A, 11-B</td><td>Active</td></tr>
                <tr><td>T003</td><td>Ms. Davis</td><td>Chemistry</td><td>10-B, 11-A, 12-A</td><td>Active</td></tr>
            </tbody>
        </table>
    `;
}

function generateSubjectsPDF() {
    return `
        <table>
            <thead>
                <tr><th>Code</th><th>Subject Name</th><th>Assigned Classes</th><th>Teacher</th></tr>
            </thead>
            <tbody>
                <tr><td>MATH101</td><td>Mathematics</td><td>10-A, 10-B, 11-A</td><td>Mr. Johnson</td></tr>
                <tr><td>PHY102</td><td>Physics</td><td>10-A, 11-A, 11-B</td><td>Dr. Smith</td></tr>
                <tr><td>CHEM103</td><td>Chemistry</td><td>10-B, 11-A, 12-A</td><td>Ms. Davis</td></tr>
            </tbody>
        </table>
    `;
}

function generateResultsPDF() {
    return `
        <table>
            <thead>
                <tr><th>Exam</th><th>Class</th><th>Subject</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
                <tr><td>Term 1 Exam</td><td>10-A</td><td>Mathematics</td><td>15 Sep 2023</td><td>Published</td></tr>
                <tr><td>Term 1 Exam</td><td>10-A</td><td>Physics</td><td>17 Sep 2023</td><td>Published</td></tr>
                <tr><td>Term 1 Exam</td><td>10-B</td><td>Chemistry</td><td>18 Sep 2023</td><td>Draft</td></tr>
            </tbody>
        </table>
    `;
}

function generateSettingsPDF() {
    return `
        <table>
            <thead>
                <tr><th>Setting</th><th>Value</th></tr>
            </thead>
            <tbody>
                <tr><td>School Name</td><td>Excel Academy</td></tr>
                <tr><td>Academic Year</td><td>2023-2024</td></tr>
                <tr><td>Grading System</td><td>Percentage</td></tr>
                <tr><td>Result Publication</td><td>Immediate</td></tr>
            </tbody>
        </table>
    `;
}

function generateGenericPDF() {
    return '<p>This is a generic report from the School Management System.</p>';
}

// CSV Upload Functions
function uploadCSV() {
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) {
        fileInput.click();
    }
}

function initializeCSVHandler() {
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleCSVUpload);
    }
}

function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        parseCSV(csv);
    };
    reader.readAsText(file);
}

function parseCSV(csv) {
    try {
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }
        
        showCSVPreview(headers, data);
    } catch (error) {
        alert('Error parsing CSV file. Please check the format and try again.');
    }
}

function showCSVPreview(headers, data) {
    const previewHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 80%; max-height: 80%; overflow: auto;">
                <h3>CSV Upload Preview</h3>
                <p>Found ${data.length} records with ${headers.length} columns:</p>
                <div style="margin: 15px 0;">
                    <strong>Columns:</strong> ${headers.join(', ')}
                </div>
                <div style="max-height: 300px; overflow: auto; margin: 15px 0;">
                    <table style="border-collapse: collapse; width: 100%;">
                        <thead>
                            <tr>${headers.map(h => `<th style="border: 1px solid #ddd; padding: 8px; background: #f8f9fa;">${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${data.slice(0, 5).map(row => 
                                `<tr>${headers.map(h => `<td style="border: 1px solid #ddd; padding: 8px;">${row[h] || ''}</td>`).join('')}</tr>`
                            ).join('')}
                            ${data.length > 5 ? `<tr><td colspan="${headers.length}" style="text-align: center; padding: 8px; font-style: italic;">... and ${data.length - 5} more rows</td></tr>` : ''}
                        </tbody>
                    </table>
                </div>
                <div style="text-align: right;">
                    <button onclick="this.closest('div').parentElement.remove()" style="margin-right: 10px; padding: 8px 16px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 4px; cursor: pointer;">Cancel</button>
                    <button onclick="processCSVImport(${JSON.stringify(data).replace(/"/g, '&quot;')}); this.closest('div').parentElement.remove();" style="padding: 8px 16px; background: #4361ee; color: white; border: none; border-radius: 4px; cursor: pointer;">Import Data</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', previewHTML);
}

function processCSVImport(data) {
    // In a real application, this would send data to the server
    alert(`Successfully imported ${data.length} records! 
    
Note: In a production environment, this data would be processed and saved to the database.
    
Preview of imported data:
${data.slice(0, 3).map((row, i) => `Record ${i+1}: ${JSON.stringify(row)}`).join('\n')}
${data.length > 3 ? `... and ${data.length - 3} more records` : ''}`);
    
    // Reset file input
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
}