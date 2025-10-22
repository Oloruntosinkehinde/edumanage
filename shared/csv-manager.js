/**
 * Enhanced CSV Operations Module
 * Handles import/export with validation and error handling
 */

class CSVManager {
    constructor(app) {
        this.app = app;
        this.supportedTypes = ['students', 'teachers', 'subjects', 'results'];
        this.templates = this.getTemplates();
        this.apiBasePath = null;
    }

    /**
     * Get CSV templates for different data types
     */
    getTemplates() {
        return {
            students: [
                'id', 'name', 'email', 'class', 'guardian', 'phone', 'address', 
                'dateOfBirth', 'enrollmentDate', 'status'
            ],
            teachers: [
                'id', 'name', 'email', 'phone', 'qualification', 'experience', 
                'joinDate', 'status'
            ],
            subjects: [
                'code', 'name', 'description', 'credits', 'teacherId', 'status'
            ],
            results: [
                'id', 'studentId', 'subjectCode', 'examType', 'marks', 'maxMarks', 
                'grade', 'examDate', 'status'
            ]
        };
    }

    /**
     * Download CSV template
     */
    downloadTemplate(type) {
        if (!this.supportedTypes.includes(type)) {
            this.app.showNotification('Invalid data type for template', 'error');
            return;
        }

        const headers = this.templates[type];
        const csvContent = headers.join(',') + '\n';
        
        this.downloadCSV(csvContent, `${type}_template.csv`);
        this.app.showNotification(`${type} template downloaded`, 'success');
    }

    /**
     * Build API URL for backend requests
     */
    buildApiUrl(endpoint) {
        if (!this.apiBasePath) {
            const pathSegments = window.location.pathname.split('/').filter(Boolean);
            const projectIndex = pathSegments.indexOf('edumanage');

            if (projectIndex !== -1) {
                this.apiBasePath = '/' + pathSegments.slice(0, projectIndex + 1).join('/');
            } else {
                this.apiBasePath = '';
            }
        }

        const normalizedEndpoint = '/' + endpoint.replace(/^\/+/, '');
        const url = `${this.apiBasePath}${normalizedEndpoint}`.replace(/\/+/g, '/');
        return url.startsWith('/') ? url : `/${url}`;
    }

    /**
     * Export data to CSV
     */
    exportData(type, filters = {}) {
        try {
            const data = this.app.read(type, filters);
            const headers = this.templates[type];
            
            if (!data || data.length === 0) {
                this.app.showNotification('No data to export', 'warning');
                return;
            }

            let csvContent = headers.join(',') + '\n';
            
            data.forEach(item => {
                const row = headers.map(header => {
                    let value = item[header] || '';
                    
                    // Handle arrays (like subjects for students)
                    if (Array.isArray(value)) {
                        value = value.join(';');
                    }
                    
                    // Escape commas and quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                    
                    return value;
                }).join(',');
                
                csvContent += row + '\n';
            });

            const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
            this.downloadCSV(csvContent, filename);
            
            this.app.showNotification(`${data.length} ${type} exported successfully`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.app.showNotification('Error exporting data', 'error');
        }
    }

    /**
     * Import data from CSV
     */
    async importData(file, type, options = {}) {
        try {
            const csvText = await this.readFile(file);
            const parsed = this.parseCSV(csvText);
            
            if (!parsed || parsed.length === 0) {
                throw new Error('No valid data found in CSV file');
            }

            const validation = this.validateCSVData(parsed, type);
            
            if (validation.errors.length > 0) {
                this.showValidationErrors(validation.errors);
                return { success: false, errors: validation.errors };
            }

            // Show preview and confirmation
            const confirmed = await this.showImportPreview(parsed, type, validation.warnings);
            
            if (!confirmed) {
                return { success: false, message: 'Import cancelled by user' };
            }

            // Process the import
            const result = await this.processImport(parsed, type, options);

            const summaryMessage = result.message ||
                `Import completed. Imported: ${result.imported}, Updated: ${result.updated}, Skipped: ${result.skipped}.`;

            this.app.showNotification(summaryMessage, result.errors?.length ? 'warning' : 'success');

            if (Array.isArray(result.errors) && result.errors.length > 0) {
                this.showImportErrors(result.errors);
            }

            return { success: true, ...result };
            
        } catch (error) {
            console.error('Import error:', error);
            this.app.showNotification(`Import failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Parse CSV content
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            throw new Error('Empty CSV file');
        }

        const headers = this.parseCSVLine(lines[0]);
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    let value = values[index].trim();
                    
                    // Handle array fields (subjects separated by semicolons)
                    if ((header === 'subjects' || header === 'classes') && value) {
                        value = value.split(';').map(v => v.trim()).filter(v => v);
                    }
                    
                    row[header] = value;
                });
                data.push(row);
            }
        }

        return data;
    }

    /**
     * Parse a single CSV line handling quotes and commas
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    }

    /**
     * Validate CSV data
     */
    validateCSVData(data, type) {
        const errors = [];
        const warnings = [];
        const requiredFields = this.getRequiredFields(type);
        const template = this.templates[type];

        // Check headers
        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            const missingHeaders = requiredFields.filter(field => !headers.includes(field));
            
            if (missingHeaders.length > 0) {
                errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
            }

            const extraHeaders = headers.filter(header => !template.includes(header));
            if (extraHeaders.length > 0) {
                warnings.push(`Extra columns will be ignored: ${extraHeaders.join(', ')}`);
            }
        }

        // Validate each row
        data.forEach((row, index) => {
            const rowNumber = index + 2; // +2 because of header and 0-based index

            // Check required fields
            requiredFields.forEach(field => {
                if (!row[field] || row[field].toString().trim() === '') {
                    errors.push(`Row ${rowNumber}: Missing required field '${field}'`);
                }
            });

            // Type-specific validations
            this.validateRowData(row, type, rowNumber, errors, warnings);
        });

        return { errors, warnings };
    }

    /**
     * Get required fields for data type
     */
    getRequiredFields(type) {
        const required = {
            students: ['name', 'email', 'class'],
            teachers: ['name', 'email'],
            subjects: ['code', 'name'],
            results: ['studentId', 'subjectCode', 'marks']
        };

        return required[type] || [];
    }

    /**
     * Validate individual row data
     */
    validateRowData(row, type, rowNumber, errors, warnings) {
        switch (type) {
            case 'students':
                if (row.email && !this.app.isValidEmail(row.email)) {
                    errors.push(`Row ${rowNumber}: Invalid email format`);
                }
                if (row.phone && !/^[\+\-\s\d\(\)]+$/.test(row.phone)) {
                    warnings.push(`Row ${rowNumber}: Phone number format may be invalid`);
                }
                break;

            case 'teachers':
                if (row.email && !this.app.isValidEmail(row.email)) {
                    errors.push(`Row ${rowNumber}: Invalid email format`);
                }
                break;

            case 'results':
                if (row.marks && (isNaN(row.marks) || row.marks < 0 || row.marks > (row.maxMarks || 100))) {
                    errors.push(`Row ${rowNumber}: Invalid marks value`);
                }
                break;
        }
    }

    /**
     * Show import preview dialog
     */
    showImportPreview(data, type, warnings) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Import Preview - ${type.charAt(0).toUpperCase() + type.slice(1)}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Found <strong>${data.length}</strong> records to import.</p>
                        
                        ${warnings.length > 0 ? `
                            <div class="alert alert-warning">
                                <h4>Warnings:</h4>
                                <ul>
                                    ${warnings.map(w => `<li>${w}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        <div class="preview-table-container">
                            <table class="preview-table">
                                <thead>
                                    <tr>
                                        ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.slice(0, 5).map(row => `
                                        <tr>
                                            ${Object.values(row).map(value => 
                                                `<td>${Array.isArray(value) ? value.join(', ') : value}</td>`
                                            ).join('')}
                                        </tr>
                                    `).join('')}
                                    ${data.length > 5 ? `
                                        <tr>
                                            <td colspan="${Object.keys(data[0]).length}" class="text-center">
                                                ... and ${data.length - 5} more rows
                                            </td>
                                        </tr>
                                    ` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove(); window.csvResolve(false);">
                            Cancel
                        </button>
                        <button class="btn btn-primary" onclick="this.closest('.modal').remove(); window.csvResolve(true);">
                            Import Data
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            window.csvResolve = resolve;

            // Handle modal close
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-overlay')) {
                    modal.remove();
                    resolve(false);
                }
            });
        });
    }

    /**
     * Process the actual import
     */
    async processImport(data, type, options) {
        const payload = {
            type,
            records: data,
            options
        };

        if (type === 'results') {
            if (typeof this.app.getActiveSession === 'function') {
                payload.session = options.session || this.app.getActiveSession();
            }
            if (typeof this.app.getCurrentTerm === 'function') {
                payload.term = options.term || this.app.getCurrentTerm();
            }
        }

        const response = await fetch(this.buildApiUrl('php/import.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const rawText = await response.text();
        let result;

        try {
            result = rawText ? JSON.parse(rawText) : {};
        } catch (error) {
            console.error('Import response parse error:', rawText);
            throw new Error('Server returned an invalid response');
        }

        if (!response.ok) {
            const message = result?.message || `Import failed with status ${response.status}`;
            throw new Error(message);
        }

        const normalizedData = this.normalizeBackendData(type, result.data || []);

        if (Array.isArray(normalizedData)) {
            if (typeof this.app.replaceCollection === 'function') {
                this.app.replaceCollection(type, normalizedData);
            } else {
                this.app.data[type] = normalizedData;
                if (typeof this.app.saveData === 'function') {
                    this.app.saveData();
                }
                if (typeof this.app.updateUI === 'function') {
                    this.app.updateUI(type);
                }
            }
        }

        return {
            imported: result.imported ?? 0,
            updated: result.updated ?? 0,
            skipped: result.skipped ?? 0,
            errors: result.errors || [],
            message: result.message || null,
            success: result.success !== false
        };
    }

    /**
     * Check if item is duplicate
     */
    isDuplicate(existing, newItem, type) {
        switch (type) {
            case 'students':
                return existing.email === newItem.email || existing.id === newItem.id;
            case 'teachers':
                return existing.email === newItem.email || existing.id === newItem.id;
            case 'subjects':
                return existing.code === newItem.code;
            case 'results':
                return existing.studentId === newItem.studentId && 
                       existing.subjectCode === newItem.subjectCode && 
                       existing.examType === newItem.examType;
            default:
                return existing.id === newItem.id;
        }
    }

    /**
     * Show validation errors
     */
    showValidationErrors(errors) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Import Validation Errors</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-danger">
                        <h4>Please fix the following errors before importing:</h4>
                        <ul>
                            ${errors.map(error => `<li>${error}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove();">
                        OK
                    </button>
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

    /**
     * Show errors returned after import
     */
    showImportErrors(errors) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Import Completed With Issues</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <h4>Some records could not be processed:</h4>
                        <ul>
                            ${errors.map(error => `<li>${error}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove();">
                        Close
                    </button>
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

    /**
     * Read file as text
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Download CSV file
     */
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Normalize backend data into frontend-friendly format
     */
    normalizeBackendData(type, records) {
        if (!Array.isArray(records)) {
            return [];
        }

        switch (type) {
            case 'students':
                return records.map(record => this.normalizeStudent(record));
            case 'teachers':
                return records.map(record => this.normalizeTeacher(record));
            case 'subjects':
                return records.map(record => this.normalizeSubject(record));
            case 'results':
                return records.map(record => this.normalizeResult(record));
            default:
                return records;
        }
    }

    normalizeStudent(record) {
        const subjects = Array.isArray(record.subjects)
            ? record.subjects
            : this.parseJsonArray(record.subjects);

        return {
            id: record.id || record.student_id || record.studentId || '',
            name: record.name || record.full_name || '',
            email: (record.email || '').toLowerCase(),
            class: record.class || record.class_name || '',
            guardian: record.guardian || record.guardian_name || '',
            phone: record.phone || record.guardian_phone || '',
            address: record.address || '',
            dateOfBirth: record.date_of_birth || record.dateOfBirth || null,
            enrollmentDate: record.enrollment_date || record.enrollmentDate || null,
            status: record.status || 'active',
            subjects: subjects,
            createdAt: record.created_at || record.createdAt || new Date().toISOString(),
            updatedAt: record.updated_at || record.updatedAt || new Date().toISOString()
        };
    }

    normalizeTeacher(record) {
        const subjects = Array.isArray(record.subjects)
            ? record.subjects
            : this.parseJsonArray(record.subjects);
        const classes = Array.isArray(record.classes)
            ? record.classes
            : this.parseJsonArray(record.classes);

        return {
            id: record.id || record.teacher_id || '',
            name: record.name || record.full_name || '',
            email: (record.email || '').toLowerCase(),
            subjects,
            classes,
            phone: record.phone || '',
            qualification: record.qualification || '',
            experience: record.experience || '',
            joinDate: record.join_date || record.joinDate || null,
            status: record.status || 'active',
            createdAt: record.created_at || new Date().toISOString(),
            updatedAt: record.updated_at || new Date().toISOString()
        };
    }

    normalizeSubject(record) {
        const teacherIds = Array.isArray(record.teacher_ids)
            ? record.teacher_ids
            : this.parseJsonArray(record.teacher_ids);

        const schedule = Array.isArray(record.schedule)
            ? record.schedule
            : (Array.isArray(record.schedule_json) ? record.schedule_json : this.parseJsonArray(record.schedule_json));

        const name = record.title || record.name || '';

        return {
            id: record.id || record.code || '',
            code: record.code || record.id || '',
            name,
            title: name,
            description: record.description || '',
            department: record.department || '',
            level: record.level || '',
            credits: Number(record.credits ?? 0),
            teacherId: record.teacher_id || (Array.isArray(teacherIds) && teacherIds.length ? teacherIds[0] : null),
            teacherIds: teacherIds || [],
            classes: Array.isArray(record.classes) ? record.classes : [],
            schedule: schedule || [],
            status: record.status || 'active',
            sortOrder: Number(record.sort_order ?? 0),
            createdAt: record.created_at || new Date().toISOString(),
            updatedAt: record.updated_at || new Date().toISOString()
        };
    }

    normalizeResult(record) {
        const metadata = record.metadata || {};
        const raw = metadata.raw || {};
        const subjectCode = record.subject_code || raw.subjectCode || raw.subject_code || this.resolveSubjectCode(record.subject_id);
        const marks = record.score ?? raw.marks ?? 0;
        const numericMarks = typeof marks === 'number' ? marks : Number(marks || 0);
        const maxMarks = metadata.max_score || raw.maxMarks || 100;

        return {
            id: record.id || raw.id || '',
            studentId: record.student_id || raw.studentId || raw.student_id || '',
            subjectId: record.subject_id || '',
            subjectCode,
            examType: raw.examType || metadata.exam_type || '',
            marks: numericMarks,
            score: numericMarks,
            maxMarks,
            maxScore: maxMarks,
            grade: record.grade || raw.grade || '',
            remarks: record.remarks || raw.remarks || raw.remark || '',
            examDate: raw.examDate || record.published_at || null,
            status: metadata.status || (record.published_at ? 'published' : 'draft'),
            class: record.class || raw.class || '',
            term: record.term || metadata.term || '',
            session: record.session || metadata.session || '',
            recordedAt: record.recorded_at || new Date().toISOString(),
            publishedAt: record.published_at || null,
            metadata
        };
    }

    parseJsonArray(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value;

        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    resolveSubjectCode(subjectId) {
        if (!subjectId || !this.app || !this.app.data || !Array.isArray(this.app.data.subjects)) {
            return null;
        }

        const subject = this.app.data.subjects.find(item => item.id === subjectId || item.code === subjectId);
        return subject ? subject.code : null;
    }
}

// Export the class
window.CSVManager = CSVManager;