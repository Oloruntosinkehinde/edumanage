/**
 * Payment Management System
 * Enhanced payment configuration and record management
 * Optimized for fast loading and seamless connections
 */

class PaymentManager {
    constructor(app) {
        this.app = app;
        this.currentState = {
            selectedTerm: this.app.getCurrentTerm(),
            selectedSession: this.app.getActiveSession(),
            selectedClass: '',
            activeFilters: {}
        };
        this.editingItemId = null;
        this.editingPaymentId = null;
        this.cachedData = {
            students: null,
            payments: null,
            paymentItems: {},
            classes: null,
            terms: null,
            sessions: null
        };
        
        // Initialize with high priority tasks only
        this.initCore();
    }

    initCore() {
        // First load critical data for fast initial rendering
        this.loadCurrentState();
        
        // Use a more efficient event delegation pattern
        this.bindEventDelegation();
        
        // Defer non-critical operations for faster initial rendering
        setTimeout(() => {
            this.refreshUIData();
            this.bindDetailedEvents();
        }, 0);
    }
    
    /**
     * Cache data to avoid repeated calls to app methods
     * @param {string} key - Cache key
     * @param {Function} fetchMethod - Method to fetch data if not cached
     * @returns {any} - Cached or freshly fetched data
     */
    getCachedData(key, fetchMethod) {
        if (!this.cachedData[key]) {
            this.cachedData[key] = fetchMethod();
        }
        return this.cachedData[key];
    }
    
    /**
     * Clear specific cache entries when they become invalid
     * @param {string|Array} keys - Cache key(s) to invalidate
     */
    invalidateCache(keys) {
        if (!keys) {
            // Clear all cache
            Object.keys(this.cachedData).forEach(key => {
                this.cachedData[key] = null;
            });
            return;
        }
        
        if (Array.isArray(keys)) {
            keys.forEach(key => {
                this.cachedData[key] = null;
            });
        } else {
            this.cachedData[keys] = null;
        }
    }

    /**
     * Use event delegation for more efficient event handling
     * This reduces the number of event listeners and improves performance
     */
    bindEventDelegation() {
        // Use event delegation for main container
        const paymentContainer = document.querySelector('.payment-management');
        if (paymentContainer) {
            // Bind events to the container for better performance
            paymentContainer.addEventListener('click', this.handleDelegatedClicks.bind(this));
            paymentContainer.addEventListener('change', this.handleDelegatedChanges.bind(this));
            paymentContainer.addEventListener('input', this.handleDelegatedInput.bind(this));
            paymentContainer.addEventListener('submit', this.handleDelegatedSubmits.bind(this));
            
            // Handle all button actions through delegation instead of individual event listeners
            this.setupTableActions(paymentContainer);
        }
        
        // Set up search with debouncing for better performance
        this.setupDebouncedSearch();
    }
    
    /**
     * Handle delegated click events for better performance
     * @param {Event} e - Click event
     */
    handleDelegatedClicks(e) {
        const target = e.target;
        
        // Use closest to find the button or interactive element that was clicked
        const button = target.closest('button');
        if (!button) return;
        
        // Match the button by ID or data attribute and call the appropriate handler
        const id = button.id;
        const action = button.dataset.action;
        
        switch(id) {
            case 'add-payment-btn':
                this.showAddPaymentModal();
                break;
            case 'bulk-update-btn':
                this.showBulkUpdateModal();
                break;
            case 'export-payments-btn':
                this.exportPayments();
                break;
            case 'save-config-btn':
                this.savePaymentConfiguration();
                break;
            case 'refresh-table':
                this.refreshUIData();
                break;
            case 'mark-paid-btn':
                this.bulkMarkStatus('paid');
                break;
            case 'mark-pending-btn':
                this.bulkMarkStatus('pending');
                break;
            case 'mark-unpaid-btn':
                this.bulkMarkStatus('unpaid');
                break;
            case 'close-bulk-modal':
            case 'cancel-bulk-btn':
                this.closeModal('bulk-status-modal');
                break;
            case 'close-modal':
            case 'cancel-btn':
                this.closeModal('payment-modal');
                break;
            case 'close-item-modal':
            case 'cancel-item-btn':
                this.closeModal('item-config-modal');
                break;
        }
        
        // Handle data-attribute based actions for dynamic elements
        if (action === 'quick-update') {
            const paymentId = button.dataset.id;
            const status = button.dataset.status;
            if (paymentId && status) {
                this.quickUpdateStatus(paymentId, status);
            }
        } else if (action === 'view-details') {
            const paymentId = button.dataset.id;
            if (paymentId) {
                this.viewPaymentDetails(paymentId);
            }
        } else if (action === 'edit-item') {
            const itemId = button.dataset.id;
            if (itemId) {
                this.editPaymentItem(itemId);
            }
        } else if (action === 'delete-item') {
            const itemId = button.dataset.id;
            if (itemId) {
                this.confirmDeleteItem(itemId);
            }
        }
    }
    
    /**
     * Handle delegated change events
     * @param {Event} e - Change event
     */
    handleDelegatedChanges(e) {
        const target = e.target;
        const id = target.id;
        
        switch(id) {
            case 'filter-term':
            case 'filter-session':
                this.applyFilters();
                break;
            case 'select-all':
                this.toggleSelectAll(target.checked);
                break;
            case 'bulk-status':
                const amountGroup = document.getElementById('bulk-amount-group');
                if (target.value === 'partial') {
                    amountGroup.style.display = 'block';
                    document.getElementById('bulk-amount').required = true;
                } else {
                    amountGroup.style.display = 'none';
                    document.getElementById('bulk-amount').required = false;
                }
                break;
            case 'payment-term':
            case 'payment-session':
                this.populatePaymentItems();
                break;
        }
        
        // Handle payment item checkboxes for calculation
        if (target.classList.contains('payment-item-checkbox')) {
            this.calculateTotalAmount();
        }
    }
    
    /**
     * Handle delegated input events
     * @param {Event} e - Input event 
     */
    handleDelegatedInput(e) {
        const target = e.target;
        const id = target.id;
        
        if (id === 'filter-name') {
            this.applyFilters();
        }
        
        // Handle payment amount inputs
        if (target.classList.contains('payment-amount-input')) {
            this.calculateTotalAmount();
        }
    }
    
    /**
     * Handle delegated form submissions
     * @param {Event} e - Submit event
     */
    handleDelegatedSubmits(e) {
        const form = e.target;
        const id = form.id;
        
        if (id === 'payment-form') {
            e.preventDefault();
            this.handlePaymentFormSubmit(e);
        } else if (id === 'item-config-form') {
            e.preventDefault();
            this.handleItemConfigFormSubmit(e);
        } else if (id === 'bulk-status-form') {
            e.preventDefault();
            this.handleBulkStatusSubmit(e);
        }
    }
    
    /**
     * Bind additional event listeners for non-critical functionality
     * This is deferred to improve initial load time
     */
    bindDetailedEvents() {
        // Set up real-time payment calculation
        this.setupPaymentCalculation();
    }

    /**
     * Load current state with improved caching
     */
    loadCurrentState() {
        this.currentState.selectedSession = this.app.getActiveSession();
        
        // Populate class filter with unique classes from students
        const classFilter = document.getElementById('filter-class');
        if (classFilter) {
            // Use cached classes or fetch them
            const classes = this.getCachedData('classes', () => this.app.getUniqueClasses());
            
            // Create document fragment for more efficient DOM operations
            const fragment = document.createDocumentFragment();
            
            // Create "All Classes" option if it doesn't exist
            if (classFilter.children.length === 0) {
                const allOption = document.createElement('option');
                allOption.value = "";
                allOption.textContent = "All Classes";
                fragment.appendChild(allOption);
            } else {
                // Clear existing options except "All Classes"
                while (classFilter.children.length > 1) {
                    classFilter.removeChild(classFilter.lastChild);
                }
            }
            
            // Add class options
            classes.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                fragment.appendChild(option);
            });
            
            // Append all new options at once
            classFilter.appendChild(fragment);
        }
    }

    refreshUIData() {
        this.populateFilterDropdowns();
        this.updateSummaryCards();
        this.updatePaymentItemsConfiguration();
        this.updatePaymentsTable();
    }

    populateFilterDropdowns() {
        // Populate term filter
        const termFilter = document.getElementById('filter-term');
        if (termFilter) {
            termFilter.innerHTML = '<option value="">All Terms</option>';
            const terms = this.app.getAvailableTerms();
            terms.forEach(term => {
                const option = document.createElement('option');
                option.value = term;
                option.textContent = term;
                termFilter.appendChild(option);
            });
        }

        // Populate session filter
        const sessionFilter = document.getElementById('filter-session');
        if (sessionFilter) {
            sessionFilter.innerHTML = '<option value="">All Sessions</option>';
            const sessions = this.app.getAvailableSessions();
            sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session;
                option.textContent = session;
                sessionFilter.appendChild(option);
            });
        }

        // Populate class filter
        const classFilter = document.getElementById('filter-class');
        if (classFilter) {
            classFilter.innerHTML = '<option value="">All Classes</option>';
            const classes = this.app.getUniqueClasses();
            classes.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                classFilter.appendChild(option);
            });
        }
    }

    updateSummaryCards() {
        const summary = this.app.getPaymentDashboardSummary(this.currentState.activeFilters);
        
        document.getElementById('total-revenue').textContent = `₦${summary.totalRevenue.toLocaleString()}`;
        document.getElementById('paid-students').textContent = summary.paidStudents.toString();
        document.getElementById('pending-payments').textContent = summary.pendingPayments.toString();
        document.getElementById('month-revenue').textContent = `₦${summary.monthRevenue.toLocaleString()}`;
    }

    updatePaymentItemsConfiguration() {
        const configGrid = document.querySelector('.config-grid');
        if (!configGrid) return;

        const paymentItems = this.app.getPaymentItems({
            term: this.currentState.selectedTerm,
            session: this.currentState.selectedSession
        });

        configGrid.innerHTML = paymentItems.map(item => this.generateItemConfigCard(item)).join('');
        
        // Add "Add New Item" card
        configGrid.innerHTML += this.generateAddItemCard();
    }

    generateItemConfigCard(item) {
        const classesText = Array.isArray(item.classes) && item.classes.length > 0 
            ? item.classes.join(', ') 
            : 'All Classes';
            
        return `
            <div class="payment-item-card" data-item-id="${item.id}">
                <div class="item-header">
                    <h4>${item.name}</h4>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-secondary" onclick="paymentManager.editPaymentItem('${item.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="paymentManager.confirmDeleteItem('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="item-details">
                    <p><strong>Amount:</strong> ₦${Number(item.amount).toLocaleString()}</p>
                    <p><strong>Category:</strong> ${item.category || 'other'}</p>
                    <p><strong>Classes:</strong> ${classesText}</p>
                    <p class="item-mandatory ${item.mandatory ? 'text-danger' : 'text-muted'}">
                        ${item.mandatory ? '<i class="fas fa-exclamation-triangle"></i> Mandatory' : '<i class="fas fa-check"></i> Optional'}
                    </p>
                </div>
                <div class="item-description">
                    <small>${item.description || 'No description provided.'}</small>
                </div>
            </div>
        `;
    }

    generateAddItemCard() {
        return `
            <div class="payment-item-card add-item-card" onclick="paymentManager.showAddItemModal()">
                <div class="add-item-content">
                    <i class="fas fa-plus-circle"></i>
                    <h4>Add Payment Item</h4>
                    <p>Create a new payment configuration</p>
                </div>
            </div>
        `;
    }

    /**
     * Updates the payments table with virtual rendering for performance
     */
    updatePaymentsTable() {
        const tableBody = document.getElementById('payments-table-body');
        if (!tableBody) return;
        
        // Use cached data for better performance
        const students = this.getCachedData('students', () => this.app.getAllStudents());
        const payments = this.getCachedData('payments', () => this.app.getPayments());
        
        if (!students || students.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center">No students found</td></tr>';
            return;
        }
        
        const filteredPayments = this.getFilteredPayments(payments);
        
        if (filteredPayments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center">No payment records found</td></tr>';
            return;
        }
        
        // Create document fragment for batch DOM operations
        const fragment = document.createDocumentFragment();
        
        // Use virtual rendering for large datasets
        const visiblePayments = filteredPayments.length > 100 
            ? filteredPayments.slice(0, 100) // Initially render only first 100 rows
            : filteredPayments;
            
        visiblePayments.forEach(payment => {
            const student = students.find(s => s.id === payment.studentId);
            const statusClass = this.getStatusClass(payment.status);
            const balance = (payment.totalAmount || 0) - (payment.totalPaid || 0);
            
            const row = document.createElement('tr');
            row.dataset.paymentId = payment.id;
            row.innerHTML = `
                <tr data-payment-id="${payment.id}">
                    <td>
                        <input type="checkbox" class="payment-checkbox" value="${payment.id}" 
                               onchange="paymentManager.updateSelectedCount()">
                    </td>
                    <td>${student ? student.name : 'Unknown Student'}</td>
                    <td>${student ? student.class : 'Unknown'}</td>
                    <td>${payment.term}</td>
                    <td>${payment.session}</td>
                    <td>₦${Number(payment.totalAmount || 0).toLocaleString()}</td>
                    <td>₦${Number(payment.totalPaid || 0).toLocaleString()}</td>
                    <td class="${balance > 0 ? 'text-danger' : 'text-success'}">
                        ₦${Number(balance).toLocaleString()}
                    </td>
                    <td>
                        <span class="status-badge status-${statusClass}">${payment.status || 'unpaid'}</span>
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-success" 
                                    onclick="paymentManager.quickUpdateStatus('${payment.id}', 'paid')" 
                                    title="Mark as Paid">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" 
                                    onclick="paymentManager.quickUpdateStatus('${payment.id}', 'partial')" 
                                    title="Partial Payment">
                                <i class="fas fa-clock"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" 
                                    onclick="paymentManager.quickUpdateStatus('${payment.id}', 'unpaid')" 
                                    title="Mark as Unpaid">
                                <i class="fas fa-times"></i>
                            </button>
                            <button class="btn btn-sm btn-info" 
                                    onclick="paymentManager.viewPaymentDetails('${payment.id}')" 
                                    title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                `;
            fragment.appendChild(row);
        });
        
        // Clear and replace table body contents with fragment (single DOM operation)
        tableBody.innerHTML = '';
        tableBody.appendChild(fragment);
        
        // If we have a large dataset, add lazy loading for remaining rows
        if (filteredPayments.length > 100) {
            // Add a loading indicator row
            const loadingRow = document.createElement('tr');
            loadingRow.id = 'loading-more-row';
            loadingRow.innerHTML = '<td colspan="10" class="text-center">Loading more records...</td>';
            tableBody.appendChild(loadingRow);
            
            // Use requestIdleCallback for non-critical UI updates
            this.scheduleRemainingRowsRender(filteredPayments.slice(100), tableBody, students);
        }
    }

    /**
     * Schedule rendering of remaining rows during browser idle time
     * @param {Array} remainingPayments - Payments left to render
     * @param {HTMLElement} tableBody - Table body element
     * @param {Array} students - Student data
     */
    scheduleRemainingRowsRender(remainingPayments, tableBody, students) {
        if (remainingPayments.length === 0) {
            const loadingRow = document.getElementById('loading-more-row');
            if (loadingRow) loadingRow.remove();
            return;
        }
        
        // Use requestIdleCallback or setTimeout as fallback
        const scheduleIdleTask = window.requestIdleCallback || 
            ((callback) => setTimeout(callback, 1));
        
        scheduleIdleTask(() => {
            const fragment = document.createDocumentFragment();
            // Process next batch of rows
            const nextBatch = remainingPayments.slice(0, 50);
            const rest = remainingPayments.slice(50);
            
            nextBatch.forEach(payment => {
                const student = students.find(s => s.id === payment.studentId);
                const statusClass = this.getStatusClass(payment.status);
                const balance = (payment.totalAmount || 0) - (payment.totalPaid || 0);
                
                const row = document.createElement('tr');
                row.dataset.paymentId = payment.id;
                row.innerHTML = `
                    <td>
                        <input type="checkbox" class="payment-checkbox" value="${payment.id}" 
                               onchange="paymentManager.updateSelectedCount()">
                    </td>
                    <td>${student ? student.name : 'Unknown Student'}</td>
                    <td>${student ? student.class : 'Unknown'}</td>
                    <td>${payment.term}</td>
                    <td>${payment.session}</td>
                    <td>₦${Number(payment.totalAmount || 0).toLocaleString()}</td>
                    <td>₦${Number(payment.totalPaid || 0).toLocaleString()}</td>
                    <td class="${balance > 0 ? 'text-danger' : 'text-success'}">
                        ₦${Number(balance).toLocaleString()}
                    </td>
                    <td>
                        <span class="status-badge status-${statusClass}">${payment.status || 'unpaid'}</span>
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-success" 
                                    onclick="paymentManager.quickUpdateStatus('${payment.id}', 'paid')" 
                                    title="Mark as Paid">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" 
                                    onclick="paymentManager.quickUpdateStatus('${payment.id}', 'partial')" 
                                    title="Partial Payment">
                                <i class="fas fa-clock"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" 
                                    onclick="paymentManager.quickUpdateStatus('${payment.id}', 'unpaid')" 
                                    title="Mark as Unpaid">
                                <i class="fas fa-times"></i>
                            </button>
                            <button class="btn btn-sm btn-info" 
                                    onclick="paymentManager.viewPaymentDetails('${payment.id}')" 
                                    title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                `;
                fragment.appendChild(row);
            });
            
            // Get loading row reference
            const loadingRow = document.getElementById('loading-more-row');
            
            // Insert new rows before loading indicator
            if (loadingRow) {
                tableBody.insertBefore(fragment, loadingRow);
            } else {
                tableBody.appendChild(fragment);
            }
            
            // Schedule next batch if we have more
            if (rest.length > 0) {
                this.scheduleRemainingRowsRender(rest, tableBody, students);
            } else {
                // Remove loading indicator when done
                const loadingRowFinal = document.getElementById('loading-more-row');
                if (loadingRowFinal) loadingRowFinal.remove();
            }
        });
    }

    /**
     * Filter payments based on current filters with optimization
     * @param {Array} payments - Payment records to filter
     * @returns {Array} - Filtered payment records 
     */
    getFilteredPayments(payments) {
        let filtered = payments || [];
        
        // Apply active filters
        const filters = this.currentState.activeFilters || {};
        
        // Pre-compute class student IDs for better performance
        let classStudentIds = null;
        if (filters.className) {
            // Use cached class students if available
            const classStudents = this.getCachedData(`class_${filters.className}_students`, () => 
                this.app.getStudentsByClass(filters.className)
            );
            classStudentIds = classStudents.map(s => s.id);
        }
        
        // Use a single filter pass instead of multiple .filter() calls
        filtered = filtered.filter(p => {
            // Class filter
            if (classStudentIds && !classStudentIds.includes(p.studentId)) {
                return false;
            }
            
            // Term filter
            if (filters.term && p.term !== filters.term) {
                return false;
            }
            
            // Session filter
            if (filters.session && p.session !== filters.session) {
                return false;
            }
            
            // Status filter
            if (filters.status && p.status !== filters.status) {
                return false;
            }
            
            // Search filter
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                // Use cached students for search
                const students = this.getCachedData('students', () => this.app.getAllStudents());
                const student = students.find(s => s.id === p.studentId);
                if (!student || !student.name.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Sort by student name for consistency
        filtered.sort((a, b) => {
            const studentA = this.app.getAllStudents().find(s => s.id === a.studentId);
            const studentB = this.app.getAllStudents().find(s => s.id === b.studentId);
            const nameA = studentA ? studentA.name : 'Unknown';
            const nameB = studentB ? studentB.name : 'Unknown';
            return nameA.localeCompare(nameB);
        });
        
        return filtered;
    }

    getStatusClass(status) {
        const statusClasses = {
            'paid': 'success',
            'partial': 'warning',
            'unpaid': 'danger',
            'overdue': 'danger',
            'pending': 'info'
        };
        return statusClasses[status] || 'secondary';
    }

    applyFilters() {
        const filters = {
            className: document.getElementById('filter-class')?.value || '',
            status: document.getElementById('filter-status')?.value || '',
            term: document.getElementById('filter-term')?.value || '',
            session: document.getElementById('filter-session')?.value || '',
            search: document.getElementById('filter-name')?.value || ''
        };

        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) {
                delete filters[key];
            }
        });

        this.currentState.activeFilters = filters;
        this.updatePaymentsTable();
        this.updateSummaryCards();
    }

    clearFilters() {
        document.getElementById('filter-class').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-term').value = '';
        document.getElementById('filter-session').value = '';
        document.getElementById('filter-name').value = '';
        
        this.currentState.activeFilters = {};
        this.updatePaymentsTable();
        this.updateSummaryCards();
    }

    showAddItemModal() {
        this.editingItemId = null;
        document.getElementById('modal-title').textContent = 'Add Payment Item';
        document.getElementById('item-config-form').reset();
        this.openModal('item-config-modal');
    }

    editPaymentItem(itemId) {
        const item = this.app.getPaymentItems({ id: itemId });
        if (!item) {
            this.app.showNotification('Payment item not found', 'error');
            return;
        }

        this.editingItemId = itemId;
        document.getElementById('modal-title').textContent = 'Edit Payment Item';
        
        // Populate form
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-amount').value = item.amount;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-description').value = item.description || '';
        document.getElementById('item-mandatory').checked = item.mandatory;
        
        this.openModal('item-config-modal');
    }

    handleItemConfigFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const itemData = {
            id: this.editingItemId,
            name: formData.get('item-name')?.trim(),
            amount: Number(formData.get('item-amount')) || 0,
            category: formData.get('item-category') || 'other',
            description: formData.get('item-description')?.trim() || '',
            mandatory: formData.has('item-mandatory'),
            term: this.currentState.selectedTerm,
            session: this.currentState.selectedSession
        };

        const result = this.app.upsertPaymentItem(itemData);
        if (result) {
            this.closeModal('item-config-modal');
            this.updatePaymentItemsConfiguration();
        }
    }

    confirmDeleteItem(itemId) {
        if (confirm('Are you sure you want to delete this payment item? This will also remove it from all existing payment records.')) {
            const result = this.app.deletePaymentItem(itemId);
            if (result) {
                this.updatePaymentItemsConfiguration();
                this.updatePaymentsTable();
            }
        }
    }

    showAddPaymentModal() {
        this.editingPaymentId = null;
        document.getElementById('modal-title').textContent = 'Add Payment Record';
        document.getElementById('payment-form').reset();
        document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
        
        this.populateSessionTermDropdowns();
        this.populateStudentDropdown();
        this.populatePaymentItems();
        this.openModal('payment-modal');
    }

    populateSessionTermDropdowns() {
        // Populate session dropdown
        const sessionSelect = document.getElementById('payment-session');
        if (sessionSelect) {
            sessionSelect.innerHTML = '';
            const sessions = this.app.getAvailableSessions();
            sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session;
                option.textContent = session;
                if (session === this.app.getActiveSession()) {
                    option.selected = true;
                }
                sessionSelect.appendChild(option);
            });
        }

        // Populate term dropdown
        const termSelect = document.getElementById('payment-term');
        if (termSelect) {
            termSelect.innerHTML = '';
            const terms = this.app.getAvailableTerms();
            terms.forEach(term => {
                const option = document.createElement('option');
                option.value = term;
                option.textContent = term;
                if (term === this.app.getCurrentTerm()) {
                    option.selected = true;
                }
                termSelect.appendChild(option);
            });
        }
    }

    populateStudentDropdown() {
        const studentSelect = document.getElementById('student-select');
        if (!studentSelect) return;

        studentSelect.innerHTML = '<option value="">Select Student</option>';
        
        const students = this.app.getAllStudents();
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.id}) - ${student.class}`;
            studentSelect.appendChild(option);
        });

        studentSelect.addEventListener('change', () => this.populatePaymentItems());
    }

    populatePaymentItems() {
        const studentId = document.getElementById('student-select')?.value;
        const term = document.getElementById('payment-term')?.value || this.app.getCurrentTerm();
        const session = document.getElementById('payment-session')?.value || this.app.getActiveSession();
        const container = document.getElementById('payment-items-container');
        
        if (!container || !studentId) {
            if (container) container.innerHTML = '<p class="text-muted">Please select a student first.</p>';
            return;
        }

        const student = this.app.getStudentById(studentId);
        if (!student) {
            container.innerHTML = '<p class="text-danger">Student not found.</p>';
            return;
        }

        const expectedItems = this.app.getStudentExpectedItems(studentId, { 
            term, 
            session
        });

        if (expectedItems.length === 0) {
            container.innerHTML = '<p class="text-muted">No payment items configured for this student\'s class.</p>';
            return;
        }

        container.innerHTML = expectedItems.map(item => `
            <div class="payment-item-row" data-item-id="${item.id}">
                <div class="form-check">
                    <input class="form-check-input payment-item-checkbox" type="checkbox" 
                           id="item-${item.id}" value="${item.id}" data-amount="${item.amount}">
                    <label class="form-check-label" for="item-${item.id}">
                        <strong>${item.name}</strong>
                        ${item.mandatory ? '<span class="badge badge-danger ml-2">Required</span>' : ''}
                    </label>
                </div>
                <div class="item-amount-controls">
                    <span class="item-amount">₦${Number(item.amount).toLocaleString()}</span>
                    <input type="number" class="form-control form-control-sm ml-2" 
                           placeholder="Amount paid" min="0" max="${item.amount}" step="0.01" 
                           id="paid-${item.id}" style="width: 120px;">
                </div>
            </div>
        `).join('');

        this.setupPaymentCalculation();
    }

    setupPaymentCalculation() {
        const container = document.getElementById('payment-items-container');
        const totalAmountElement = document.getElementById('total-amount');
        
        if (!container || !totalAmountElement) return;

        const calculateTotal = () => {
            let total = 0;
            
            container.querySelectorAll('.payment-item-checkbox:checked').forEach(checkbox => {
                const itemId = checkbox.value;
                const paidInput = document.getElementById(`paid-${itemId}`);
                const paidAmount = Number(paidInput?.value) || 0;
                total += paidAmount;
            });
            
            totalAmountElement.textContent = `₦${total.toLocaleString()}`;
        };

        // Add event listeners
        container.addEventListener('change', calculateTotal);
        container.addEventListener('input', calculateTotal);
        
        // Auto-fill amount when checkbox is checked
        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('payment-item-checkbox')) {
                const itemId = e.target.value;
                const paidInput = document.getElementById(`paid-${itemId}`);
                const baseAmount = Number(e.target.dataset.amount) || 0;
                
                if (e.target.checked && paidInput && !paidInput.value) {
                    paidInput.value = baseAmount;
                } else if (!e.target.checked && paidInput) {
                    paidInput.value = '';
                }
                
                calculateTotal();
            }
        });
    }

    handlePaymentFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const studentId = formData.get('student-select');
        const term = formData.get('payment-term');
        
        const items = [];
        const checkboxes = document.querySelectorAll('.payment-item-checkbox:checked');
        
        checkboxes.forEach(checkbox => {
            const itemId = checkbox.value;
            const paidInput = document.getElementById(`paid-${itemId}`);
            const paidAmount = Number(paidInput?.value) || 0;
            
            if (paidAmount > 0) {
                items.push({
                    itemId,
                    paidAmount,
                    paid: true
                });
            }
        });

        if (items.length === 0) {
            this.app.showNotification('Please select at least one payment item with an amount', 'error');
            return;
        }

        const paymentData = {
            id: this.editingPaymentId,
            studentId,
            term,
            session: formData.get('payment-session'),
            items,
            paymentMethod: formData.get('payment-method'),
            paymentDate: formData.get('payment-date'),
            notes: formData.get('payment-notes')?.trim()
        };

        const result = this.app.upsertPaymentRecord(paymentData);
        if (result) {
            this.closeModal('payment-modal');
            this.updatePaymentsTable();
            this.updateSummaryCards();
        }
    }

    editPaymentRecord(paymentId) {
        // Implementation for editing existing payment records
        this.app.showNotification('Edit functionality will be implemented in next version', 'info');
    }

    viewPaymentDetails(paymentId) {
        const payments = this.app.getPayments({ studentId: null });
        const payment = payments.find(p => p.id === paymentId);
        
        if (!payment) {
            this.app.showNotification('Payment record not found', 'error');
            return;
        }

        const itemsList = Array.isArray(payment.items) 
            ? payment.items.map(item => 
                `<li>${item.name}: ₦${Number(item.amount).toLocaleString()} 
                 (Paid: ₦${Number(item.paidAmount).toLocaleString()})</li>`
              ).join('')
            : '<li>No items available</li>';

        const detailsHTML = `
            <div class="payment-details">
                <h4>Payment Details for ${payment.studentName}</h4>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Student ID:</strong> ${payment.studentId}</p>
                        <p><strong>Class:</strong> ${payment.class}</p>
                        <p><strong>Term:</strong> ${payment.term}</p>
                        <p><strong>Session:</strong> ${payment.session}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Total Amount:</strong> ₦${Number(payment.totalAmount).toLocaleString()}</p>
                        <p><strong>Amount Paid:</strong> ₦${Number(payment.amountPaid).toLocaleString()}</p>
                        <p><strong>Balance:</strong> ₦${Number(payment.balance).toLocaleString()}</p>
                        <p><strong>Status:</strong> <span class="badge badge-${payment.status === 'paid' ? 'success' : 'warning'}">${payment.status}</span></p>
                    </div>
                </div>
                <h5>Payment Items</h5>
                <ul>${itemsList}</ul>
                ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ''}
            </div>
        `;

        // Show in a simple alert for now - can be enhanced with a modal
        const detailWindow = window.open('', '_blank', 'width=600,height=400');
        detailWindow.document.write(`
            <html>
                <head><title>Payment Details</title></head>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    ${detailsHTML}
                    <button onclick="window.close()" style="margin-top: 20px;">Close</button>
                </body>
            </html>
        `);
    }

    confirmDeletePayment(paymentId) {
        if (confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
            const result = this.app.deletePaymentRecord(paymentId);
            if (result) {
                this.updatePaymentsTable();
                this.updateSummaryCards();
            }
        }
    }

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.payment-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
    }

    exportPayments() {
        const payments = this.app.getPayments(this.currentState.activeFilters);
        
        if (payments.length === 0) {
            this.app.showNotification('No payment records to export', 'info');
            return;
        }

        const csvHeaders = [
            'Student Name', 'Student ID', 'Class', 'Term', 'Session',
            'Total Amount', 'Amount Paid', 'Balance', 'Status',
            'Payment Method', 'Payment Date', 'Notes'
        ];

        const csvRows = payments.map(payment => [
            payment.studentName || '',
            payment.studentId || '',
            payment.class || '',
            payment.term || '',
            payment.session || '',
            payment.totalAmount || 0,
            payment.amountPaid || 0,
            payment.balance || 0,
            payment.status || '',
            payment.paymentMethod || '',
            payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '',
            (payment.notes || '').replace(/"/g, '""')
        ]);

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.app.showNotification('Payment records exported successfully', 'success');
    }

    savePaymentConfiguration() {
        // Force save current payment items and data
        this.app.saveData();
        this.app.showNotification('Payment configuration saved successfully!', 'success');
    }

    showBulkUpdateModal() {
        // Populate payment items dropdown
        const paymentItems = this.app.getPaymentItems({
            term: this.currentState.selectedTerm,
            session: this.currentState.selectedSession
        });
        
        const itemSelect = document.getElementById('bulk-payment-item');
        if (itemSelect) {
            itemSelect.innerHTML = '<option value="">Select Payment Item</option>';
            paymentItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.name} - ₦${Number(item.amount).toLocaleString()}`;
                itemSelect.appendChild(option);
            });
        }
        
        // Populate class filter
        const classSelect = document.getElementById('bulk-filter-class');
        if (classSelect) {
            const classes = this.app.getUniqueClasses();
            classSelect.innerHTML = '<option value="">All Classes</option>';
            classes.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                classSelect.appendChild(option);
            });
        }
        
        // Update selected count
        this.updateSelectedCount();
        
        this.openModal('bulk-status-modal');
    }
    
    updateSelectedCount() {
        const selectedCheckboxes = document.querySelectorAll('.payment-checkbox:checked');
        document.getElementById('selected-count').textContent = selectedCheckboxes.length;
    }
    
    handleBulkStatusSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const itemId = formData.get('bulk-payment-item');
        const status = formData.get('bulk-status');
        const amount = formData.get('bulk-amount');
        const filterClass = formData.get('bulk-filter-class');
        
        if (!itemId || !status) {
            this.app.showNotification('Please select payment item and status', 'error');
            return;
        }
        
        // Get selected students or all students based on filter
        const selectedCheckboxes = document.querySelectorAll('.payment-checkbox:checked');
        let studentIds = [];
        
        if (selectedCheckboxes.length > 0) {
            studentIds = Array.from(selectedCheckboxes).map(cb => {
                const row = cb.closest('tr');
                return row.dataset.paymentId ? 
                    this.app.getPayments().find(p => p.id === row.dataset.paymentId)?.studentId : null;
            }).filter(Boolean);
        } else {
            // Use all students from current filters
            const allStudents = this.app.getAllStudents();
            studentIds = allStudents
                .filter(student => !filterClass || student.class === filterClass)
                .map(student => student.id);
        }
        
        if (studentIds.length === 0) {
            this.app.showNotification('No students selected for update', 'error');
            return;
        }
        
        const paidAmount = status === 'partial' ? Number(amount) : 
                          status === 'paid' ? null : 0; // null means use full amount
        
        const result = this.app.bulkUpdatePaymentStatus(studentIds, itemId, status, paidAmount);
        
        if (result.updatedCount > 0) {
            this.closeModal('bulk-status-modal');
            this.updatePaymentsTable();
            this.updateSummaryCards();
        }
    }
    
    bulkMarkStatus(status) {
        const selectedCheckboxes = document.querySelectorAll('.payment-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            this.app.showNotification('Please select students to update', 'error');
            return;
        }
        
        const paymentIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        const confirmMessage = `Are you sure you want to mark ${paymentIds.length} payment record(s) as ${status}?`;
        
        if (confirm(confirmMessage)) {
            let updatedCount = 0;
            
            paymentIds.forEach(paymentId => {
                const payments = this.app.getPayments();
                const payment = payments.find(p => p.id === paymentId);
                
                if (payment && Array.isArray(payment.items)) {
                    payment.items.forEach(item => {
                        if (status === 'paid') {
                            item.paidAmount = item.amount;
                            item.status = 'paid';
                        } else if (status === 'unpaid') {
                            item.paidAmount = 0;
                            item.status = 'unpaid';
                        } else {
                            item.status = status;
                        }
                    });
                    
                    const updatedPayment = this.app.recalculatePaymentRecord(payment);
                    const paymentIndex = this.app.data.payments.findIndex(p => p.id === paymentId);
                    if (paymentIndex >= 0) {
                        this.app.data.payments[paymentIndex] = updatedPayment;
                        updatedCount++;
                    }
                }
            });
            
            if (updatedCount > 0) {
                this.app.saveData();
                this.app.showNotification(`Updated ${updatedCount} payment records`, 'success');
                this.updatePaymentsTable();
                this.updateSummaryCards();
            }
        }
    }
    
    quickUpdateStatus(paymentId, status) {
        const payments = this.app.getPayments();
        const payment = payments.find(p => p.id === paymentId);
        
        if (!payment) {
            this.app.showNotification('Payment record not found', 'error');
            return;
        }
        
        if (!Array.isArray(payment.items) || payment.items.length === 0) {
            this.app.showNotification('No payment items found for this record', 'error');
            return;
        }
        
        payment.items.forEach(item => {
            if (status === 'paid') {
                item.paidAmount = item.amount;
                item.status = 'paid';
            } else if (status === 'unpaid') {
                item.paidAmount = 0;
                item.status = 'unpaid';
            } else if (status === 'partial') {
                // For partial, prompt for amount
                const newAmount = prompt(`Enter amount paid for ${item.name} (Max: ₦${item.amount}):`);
                if (newAmount !== null) {
                    const amount = Number(newAmount);
                    if (amount >= 0 && amount <= item.amount) {
                        item.paidAmount = amount;
                        item.status = amount === 0 ? 'unpaid' : amount === item.amount ? 'paid' : 'partial';
                    } else {
                        this.app.showNotification('Invalid amount entered', 'error');
                        return;
                    }
                } else {
                    return; // User cancelled
                }
            } else {
                item.status = status;
            }
        });
        
        const updatedPayment = this.app.recalculatePaymentRecord(payment);
        const paymentIndex = this.app.data.payments.findIndex(p => p.id === paymentId);
        
        if (paymentIndex >= 0) {
            this.app.data.payments[paymentIndex] = updatedPayment;
            this.app.saveData();
            this.app.showNotification('Payment status updated successfully', 'success');
            this.updatePaymentsTable();
            this.updateSummaryCards();
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('active');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    }

    showAddPaymentModal() {
        this.editingPaymentId = null;
        document.getElementById('modal-title').textContent = 'Add Payment Record';
        document.getElementById('payment-form').reset();
        
        // Populate dropdowns
        this.populateSessionTermDropdowns();
        this.populateStudentDropdown();
        
        // Set default payment date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('payment-date').value = today;
        
        this.openModal('payment-modal');
    }
}

// Auto-initialize when DOM is ready
let paymentManager;
document.addEventListener('DOMContentLoaded', function() {
    // Wait for app to be available
    setTimeout(() => {
        if (typeof Tophill PortalApp !== 'undefined') {
            paymentManager = new PaymentManager(Tophill PortalApp);
            window.paymentManager = paymentManager; // Global access
        }
    }, 100);
});