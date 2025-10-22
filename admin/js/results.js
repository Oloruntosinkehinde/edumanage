/**
 * Results Management Page
 * Handles the functionality of the results management interface
 */

// Initialize the result manager when page loads
let resultManager;

document.addEventListener('DOMContentLoaded', function() {
    // Create result manager instance
    resultManager = new ResultManager();
    
    // Initialize the page
    initPage();
    
    // Set current session and term based on the current date
    setCurrentSessionAndTerm();
    
    // Load class tabs
    loadClassTabs();
});

/**
 * Initialize page elements and event listeners
 */
function initPage() {
    // Initialize scoring config inputs
    document.getElementById('ca-score').addEventListener('input', updateTotalScore);
    document.getElementById('test-score').addEventListener('input', updateTotalScore);
    document.getElementById('exam-score').addEventListener('input', updateTotalScore);
    
    // Initialize grading scale inputs
    document.getElementById('grade-a-plus').addEventListener('input', updateGradingScale);
    document.getElementById('grade-a').addEventListener('input', updateGradingScale);
    document.getElementById('grade-b-plus').addEventListener('input', updateGradingScale);
    document.getElementById('grade-b').addEventListener('input', updateGradingScale);
    document.getElementById('grade-c-plus').addEventListener('input', updateGradingScale);
    document.getElementById('grade-c').addEventListener('input', updateGradingScale);
    document.getElementById('grade-d').addEventListener('input', updateGradingScale);
    
    // Initialize CSV file input
    document.getElementById('csvFileInput').addEventListener('change', handleCSVUpload);
}

/**
 * Set the current session and term based on the date
 */
function setCurrentSessionAndTerm() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = now.getFullYear();
    
    // Set current session
    let sessionStart = currentYear;
    if (currentMonth > 8) { // If after August, new academic year has started
        sessionStart = currentYear;
    } else {
        sessionStart = currentYear - 1;
    }
    
    const currentSession = `${sessionStart}/${sessionStart + 1}`;
    document.getElementById('current-session').value = currentSession;
    
    // Set current term
    let currentTerm;
    if (currentMonth >= 9 && currentMonth <= 12) {
        currentTerm = '1st Term'; // September to December
    } else if (currentMonth >= 1 && currentMonth <= 4) {
        currentTerm = '2nd Term'; // January to April
    } else {
        currentTerm = '3rd Term'; // May to August
    }
    
    document.getElementById('current-term').value = currentTerm;
}

/**
 * Load class tabs based on available classes
 */
function loadClassTabs() {
    const classTabsContainer = document.getElementById('classTabsContainer');
    const classes = resultManager.getAllClasses();
    
    let tabsHTML = '';
    classes.forEach((className, index) => {
        tabsHTML += `
            <button class="class-tab ${index === 0 ? 'active' : ''}" 
                    onclick="selectClassTab('${className}', this)">
                ${className}
            </button>
        `;
    });
    
    // Add empty state if no classes
    if (classes.length === 0) {
        tabsHTML = '<p class="empty-tab-message">No classes configured. Please add classes in the Settings.</p>';
    }
    
    classTabsContainer.innerHTML = tabsHTML;
    
    // Load the first class results if available
    if (classes.length > 0) {
        loadClassResults(classes[0]);
    }
}

/**
 * Select a class tab and load its results
 * @param {string} className - The name of the class
 * @param {Element} tabElement - The tab button element
 */
function selectClassTab(className, tabElement) {
    // Update active tab
    document.querySelectorAll('.class-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    tabElement.classList.add('active');
    
    // Load class results
    loadClassResults(className);
}

/**
 * Load results for a specific class
 * @param {string} className - The name of the class (optional, uses active tab if not provided)
 */
function loadClassResults(className) {
    // If className is not provided, get it from the active tab
    if (!className) {
        const activeTab = document.querySelector('.class-tab.active');
        if (activeTab) {
            className = activeTab.textContent.trim();
        } else {
            // No active tab, show empty state
            showEmptyResultsState();
            return;
        }
    }
    
    // Get current session and term
    const currentSession = document.getElementById('current-session').value;
    const currentTerm = document.getElementById('current-term').value;
    
    // Get results for this class, session, and term
    const classResults = resultManager.getClassResults(className, currentSession, currentTerm);
    
    // Display results
    displayClassResults(className, classResults);
}

/**
 * Display results for a class
 * @param {string} className - The name of the class
 * @param {Array} results - The results data
 */
function displayClassResults(className, results) {
    const container = document.getElementById('resultsDisplayContainer');
    
    // If no results, show empty state
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="results-header">
                <h3>${className}</h3>
                <button class="btn btn-primary" onclick="openAddResultModal('${className}')">
                    <i class="fas fa-plus"></i> Add Results
                </button>
            </div>
            <div class="empty-state">
                <i class="fas fa-clipboard fa-3x"></i>
                <h3>No Results Available</h3>
                <p>No results have been entered for this class yet.</p>
            </div>
        `;
        return;
    }
    
    // Display results in a table
    let tableHTML = `
        <div class="results-header">
            <h3>${className}</h3>
            <button class="btn btn-primary" onclick="openAddResultModal('${className}')">
                <i class="fas fa-plus"></i> Add Results
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Subject</th>
                        <th>CA (${resultManager.scoringConfig.ca})</th>
                        <th>Test (${resultManager.scoringConfig.test})</th>
                        <th>Exam (${resultManager.scoringConfig.exam})</th>
                        <th>Total (${resultManager.scoringConfig.total})</th>
                        <th>Grade</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    results.forEach(result => {
        tableHTML += `
            <tr data-result-id="${result.id}">
                <td>${result.studentName}</td>
                <td>${result.subject}</td>
                <td>${result.ca}</td>
                <td>${result.test}</td>
                <td>${result.exam}</td>
                <td>${result.totalScore}</td>
                <td>
                    <span class="grade ${result.grade === 'F' ? 'grade-f' : ''}">${result.grade}</span>
                </td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editResult('${result.id}')" title="Edit Result">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteResult('${result.id}')" title="Delete Result">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHTML;
}

/**
 * Show empty state when no class is selected
 */
function showEmptyResultsState() {
    const container = document.getElementById('resultsDisplayContainer');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-clipboard-list fa-3x"></i>
            <h3>Select a Class</h3>
            <p>Choose a class from the tabs above to view and manage results</p>
        </div>
    `;
}

/**
 * Open modal for adding a new result
 * @param {string} className - The name of the class
 */
function openAddResultModal(className) {
    // Implementation will be added
    console.log(`Opening add result modal for class: ${className}`);
}

/**
 * Edit an existing result
 * @param {string} resultId - The ID of the result to edit
 */
function editResult(resultId) {
    // Implementation will be added
    console.log(`Editing result with ID: ${resultId}`);
}

/**
 * Delete a result
 * @param {string} resultId - The ID of the result to delete
 */
function deleteResult(resultId) {
    if (confirm('Are you sure you want to delete this result?')) {
        // Implementation will be added
        console.log(`Deleting result with ID: ${resultId}`);
    }
}

/**
 * Update the total score display in the scoring config
 */
function updateTotalScore() {
    const ca = parseInt(document.getElementById('ca-score').value) || 0;
    const test = parseInt(document.getElementById('test-score').value) || 0;
    const exam = parseInt(document.getElementById('exam-score').value) || 0;
    
    const total = ca + test + exam;
    document.getElementById('total-score').textContent = total;
}

/**
 * Update the grading scale display
 */
function updateGradingScale() {
    // Update the F maximum value
    const dGrade = parseInt(document.getElementById('grade-d').value) || 35;
    document.getElementById('grade-f-max').textContent = dGrade - 1;
    
    // Update other grade ranges
    const grades = ['a-plus', 'a', 'b-plus', 'b', 'c-plus', 'c', 'd'];
    for (let i = 0; i < grades.length - 1; i++) {
        const currentGrade = document.getElementById(`grade-${grades[i]}`).value;
        const nextGrade = document.getElementById(`grade-${grades[i+1]}`).value;
        // Additional logic for updating grade ranges can be added here
    }
}

/**
 * Open the scoring configuration modal
 */
function openScoringConfigModal() {
    document.getElementById('scoringConfigModal').style.display = 'block';
}

/**
 * Open the subject configuration modal
 */
function openSubjectConfigModal() {
    document.getElementById('subjectConfigModal').style.display = 'block';
}

/**
 * Open modal for bulk result entry
 */
function openBulkResultModal() {
    // Implementation will be added
    console.log('Opening bulk result entry modal');
}

/**
 * Save the scoring configuration
 */
function saveScoringConfig() {
    // Get values from inputs
    const ca = parseInt(document.getElementById('ca-score').value) || 10;
    const test = parseInt(document.getElementById('test-score').value) || 20;
    const exam = parseInt(document.getElementById('exam-score').value) || 70;
    
    // Update scoring config in result manager
    resultManager.updateScoringConfig({
        ca, test, exam, total: ca + test + exam
    });
    
    // Get grading scale values
    const aPlus = parseInt(document.getElementById('grade-a-plus').value) || 90;
    const a = parseInt(document.getElementById('grade-a').value) || 80;
    const bPlus = parseInt(document.getElementById('grade-b-plus').value) || 70;
    const b = parseInt(document.getElementById('grade-b').value) || 60;
    const cPlus = parseInt(document.getElementById('grade-c-plus').value) || 50;
    const c = parseInt(document.getElementById('grade-c').value) || 40;
    const d = parseInt(document.getElementById('grade-d').value) || 35;
    
    // Update grading scale in result manager
    resultManager.updateGradingScale({
        'A+': aPlus, 'A': a, 'B+': bPlus, 'B': b,
        'C+': cPlus, 'C': c, 'D': d, 'F': 0
    });
    
    // Close modal
    closeModal('scoringConfigModal');
    
    // Reload class results to reflect new configuration
    loadClassResults();
}

/**
 * Switch between configuration tabs
 * @param {string} tabName - The name of the tab to switch to
 */
function switchConfigTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content and activate button
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`.tab-btn[onclick="switchConfigTab('${tabName}')"]`).classList.add('active');
}

/**
 * Close a modal
 * @param {string} modalId - The ID of the modal to close
 */
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

/**
 * Generate report cards for the current class, term, and session
 */
function generateReportCards() {
    // Get current class, session, and term
    const activeTab = document.querySelector('.class-tab.active');
    if (!activeTab) {
        alert('Please select a class first');
        return;
    }
    
    const className = activeTab.textContent.trim();
    const currentSession = document.getElementById('current-session').value;
    const currentTerm = document.getElementById('current-term').value;
    
    // Generate report cards
    resultManager.generateReportCards(className, currentSession, currentTerm);
    
    // Show success message
    alert(`Report cards generated for ${className} - ${currentSession} ${currentTerm}`);
}

/**
 * Trigger CSV file upload
 */
function uploadCSV() {
    document.getElementById('csvFileInput').click();
}

/**
 * Handle CSV file upload
 * @param {Event} event - The change event
 */
function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvData = e.target.result;
        // Process CSV data
        resultManager.importResultsFromCSV(csvData);
        
        // Reload class results
        loadClassResults();
        
        // Reset file input
        event.target.value = '';
    };
    reader.readAsText(file);
}

/**
 * Download results as PDF
 * @param {string} section - The section to download
 */
function downloadPDF(section) {
    // Implementation will be added
    console.log(`Downloading ${section} as PDF`);
}