/**
 * Tophill Portal Dropdown Utilities
 * Centralized dropdown management for consistent class, session, term, and subject options
 */

class DropdownManager {
    constructor(app = null) {
        this.app = app || window.app;
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
        
        // Default options
        this.defaults = {
            sessions: ['2024-2025', '2025-2026', '2026-2027'],
            terms: ['First Term', 'Second Term', 'Third Term'],
            classes: [
                'JSS 1A', 'JSS 1B', 'JSS 2A', 'JSS 2B', 'JSS 3A', 'JSS 3B',
                'SS 1A', 'SS 1B', 'SS 2A', 'SS 2B', 'SS 3A', 'SS 3B',
                'Class 1A', 'Class 1B', 'Class 2A', 'Class 2B', 'Class 3A', 'Class 3B',
                'Class 4A', 'Class 4B', 'Class 5A', 'Class 5B', 'Class 6A', 'Class 6B'
            ],
            subjects: [
                { code: 'MATH', name: 'Mathematics' },
                { code: 'ENG', name: 'English Language' },
                { code: 'PHY', name: 'Physics' },
                { code: 'CHEM', name: 'Chemistry' },
                { code: 'BIO', name: 'Biology' },
                { code: 'GEO', name: 'Geography' },
                { code: 'HIS', name: 'History' },
                { code: 'CIV', name: 'Civic Education' },
                { code: 'ECO', name: 'Economics' },
                { code: 'GOV', name: 'Government' },
                { code: 'LIT', name: 'Literature' },
                { code: 'CS', name: 'Computer Science' }
            ],
            gradeLevels: [
                { value: 'jss1', label: 'JSS 1' },
                { value: 'jss2', label: 'JSS 2' },
                { value: 'jss3', label: 'JSS 3' },
                { value: 'ss1', label: 'SS 1' },
                { value: 'ss2', label: 'SS 2' },
                { value: 'ss3', label: 'SS 3' }
            ],
            classSections: ['A', 'B', 'C', 'D'],
            statuses: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' },
                { value: 'suspended', label: 'Suspended' }
            ],
            resultStatuses: [
                { value: 'all', label: 'All Results' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
                { value: 'pending', label: 'Pending Review' }
            ]
        };
    }

    /**
     * Get current session from app or fallback to default
     */
    getCurrentSession() {
        return this.app?.data?.settings?.currentSession || 
               this.app?.currentSession || 
               this.defaults.sessions[1];
    }

    /**
     * Get current term from app or fallback to default
     */
    getCurrentTerm() {
        return this.app?.data?.settings?.currentTerm || 
               this.app?.currentTerm || 
               this.defaults.terms[0];
    }

    /**
     * Get sessions with caching
     */
    getSessions() {
        const cacheKey = 'sessions';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const sessions = this.app?.data?.settings?.sessions || 
                        this.app?.getAcademicSessions?.() || 
                        this.defaults.sessions;
        
        this.setCache(cacheKey, sessions);
        return sessions;
    }

    /**
     * Get terms with caching
     */
    getTerms() {
        const cacheKey = 'terms';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const terms = this.app?.data?.settings?.terms || 
                     this.app?.getAcademicTerms?.() || 
                     this.defaults.terms;
        
        this.setCache(cacheKey, terms);
        return terms;
    }

    /**
     * Get classes with caching and sorting
     */
    getClasses() {
        const cacheKey = 'classes';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        let classes = [];
        
        if (this.app?.getClassList) {
            classes = this.app.getClassList();
        } else if (this.app?.data?.students) {
            // Extract unique classes from students
            const classSet = new Set();
            this.app.data.students.forEach(student => {
                if (student.class) classSet.add(student.class);
            });
            classes = Array.from(classSet);
        }
        
        if (!classes.length) {
            classes = this.defaults.classes;
        }

        // Sort classes naturally
        classes.sort(this.compareClassNames);
        
        this.setCache(cacheKey, classes);
        return classes;
    }

    /**
     * Get subjects with caching
     */
    getSubjects() {
        const cacheKey = 'subjects';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        let subjects = [];
        
        if (this.app?.getAllSubjects) {
            subjects = this.app.getAllSubjects().map(subject => ({
                code: subject.code,
                name: subject.name || subject.code
            }));
        } else if (this.app?.data?.subjects) {
            subjects = this.app.data.subjects.map(subject => ({
                code: subject.code,
                name: subject.name || subject.code
            }));
        }
        
        if (!subjects.length) {
            subjects = this.defaults.subjects;
        }

        // Sort subjects by name
        subjects.sort((a, b) => a.name.localeCompare(b.name));
        
        this.setCache(cacheKey, subjects);
        return subjects;
    }

    /**
     * Get subjects for a specific class
     */
    getSubjectsForClass(className) {
        if (!className) return [];
        
        const cacheKey = `subjects_${className}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        let subjects = [];
        
        if (this.app?.getSubjectsByClass) {
            subjects = this.app.getSubjectsByClass(className).map(subject => ({
                code: subject.code,
                name: subject.name || subject.code
            }));
        } else if (this.app?.data?.subjects) {
            subjects = this.app.data.subjects
                .filter(subject => subject.classes && subject.classes.includes(className))
                .map(subject => ({
                    code: subject.code,
                    name: subject.name || subject.code
                }));
        }
        
        if (!subjects.length) {
            // Fallback to all subjects
            subjects = this.getSubjects();
        }

        subjects.sort((a, b) => a.name.localeCompare(b.name));
        
        this.setCache(cacheKey, subjects);
        return subjects;
    }

    /**
     * Populate a select element with options
     */
    populateSelect(selectElement, options, selectedValue = '', config = {}) {
        if (!selectElement) return;

        const {
            emptyLabel = '-- Select --',
            valueKey = 'value',
            labelKey = 'label',
            includeEmpty = true,
            disabled = false
        } = config;

        selectElement.disabled = disabled;
        
        let html = '';
        
        if (includeEmpty) {
            html += `<option value="">${emptyLabel}</option>`;
        }

        const normalizedOptions = options.map(option => {
            if (typeof option === 'string') {
                return { value: option, label: option };
            }
            return {
                value: option[valueKey] || option.value || option.code || option,
                label: option[labelKey] || option.label || option.name || option
            };
        });

        html += normalizedOptions
            .map(({ value, label }) => {
                const selected = value === selectedValue ? 'selected' : '';
                return `<option value="${value}" ${selected}>${label}</option>`;
            })
            .join('');

        selectElement.innerHTML = html;
        
        if (selectedValue) {
            selectElement.value = selectedValue;
        }
    }

    /**
     * Populate session dropdown
     */
    populateSessionDropdown(selectElement, selectedValue = '') {
        const sessions = this.getSessions();
        const currentSession = selectedValue || this.getCurrentSession();
        
        this.populateSelect(selectElement, sessions, currentSession, {
            emptyLabel: '-- Select Session --'
        });
    }

    /**
     * Populate term dropdown
     */
    populateTermDropdown(selectElement, selectedValue = '') {
        const terms = this.getTerms();
        const currentTerm = selectedValue || this.getCurrentTerm();
        
        this.populateSelect(selectElement, terms, currentTerm, {
            emptyLabel: '-- Select Term --'
        });
    }

    /**
     * Populate class dropdown
     */
    populateClassDropdown(selectElement, selectedValue = '') {
        const classes = this.getClasses();
        
        this.populateSelect(selectElement, classes, selectedValue, {
            emptyLabel: '-- Select Class --'
        });
    }

    /**
     * Populate subject dropdown
     */
    populateSubjectDropdown(selectElement, selectedValue = '', className = '') {
        const subjects = className ? this.getSubjectsForClass(className) : this.getSubjects();
        
        this.populateSelect(selectElement, subjects, selectedValue, {
            emptyLabel: '-- Select Subject --',
            valueKey: 'code',
            labelKey: 'name'
        });
    }

    /**
     * Populate grade level dropdown
     */
    populateGradeLevelDropdown(selectElement, selectedValue = '') {
        this.populateSelect(selectElement, this.defaults.gradeLevels, selectedValue, {
            emptyLabel: '-- Select Grade --'
        });
    }

    /**
     * Populate class section dropdown
     */
    populateClassSectionDropdown(selectElement, selectedValue = '') {
        this.populateSelect(selectElement, this.defaults.classSections, selectedValue, {
            emptyLabel: '-- Select Section --'
        });
    }

    /**
     * Populate status dropdown
     */
    populateStatusDropdown(selectElement, selectedValue = '', type = 'general') {
        const statuses = type === 'result' ? this.defaults.resultStatuses : this.defaults.statuses;
        
        this.populateSelect(selectElement, statuses, selectedValue, {
            emptyLabel: '-- Select Status --'
        });
    }

    /**
     * Auto-populate dropdown based on ID conventions
     */
    autoPopulate(selectElement) {
        if (!selectElement) return;

        const id = selectElement.id.toLowerCase();
        const classes = Array.from(selectElement.classList);
        
        // Determine dropdown type from ID or class
        if (id.includes('session') || classes.includes('session-select')) {
            this.populateSessionDropdown(selectElement);
        } else if (id.includes('term') || classes.includes('term-select')) {
            this.populateTermDropdown(selectElement);
        } else if (id.includes('class') && !id.includes('section') || classes.includes('class-select')) {
            this.populateClassDropdown(selectElement);
        } else if (id.includes('subject') || classes.includes('subject-select')) {
            this.populateSubjectDropdown(selectElement);
        } else if (id.includes('grade') || classes.includes('grade-select')) {
            this.populateGradeLevelDropdown(selectElement);
        } else if (id.includes('section') || classes.includes('section-select')) {
            this.populateClassSectionDropdown(selectElement);
        } else if (id.includes('status') || classes.includes('status-select')) {
            const type = id.includes('result') || classes.includes('result-status') ? 'result' : 'general';
            this.populateStatusDropdown(selectElement, '', type);
        }
    }

    /**
     * Initialize all dropdowns on a page
     */
    initializeAllDropdowns(container = document) {
        const selects = container.querySelectorAll('select[id*="session"], select[id*="term"], select[id*="class"], select[id*="subject"], select[id*="grade"], select[id*="status"], select.auto-populate');
        
        selects.forEach(select => {
            this.autoPopulate(select);
        });
    }

    /**
     * Compare class names for natural sorting
     */
    compareClassNames(a, b) {
        const parseClass = (className) => {
            const match = className.match(/(\D+)?\s*(\d+)([A-Za-z])?/);
            if (!match) return { prefix: className, number: 0, suffix: '' };
            
            return {
                prefix: (match[1] || '').trim(),
                number: parseInt(match[2]) || 0,
                suffix: (match[3] || '').toUpperCase()
            };
        };

        const classA = parseClass(a);
        const classB = parseClass(b);

        // Compare prefix first
        if (classA.prefix !== classB.prefix) {
            return classA.prefix.localeCompare(classB.prefix);
        }

        // Then compare numbers
        if (classA.number !== classB.number) {
            return classA.number - classB.number;
        }

        // Finally compare suffix
        return classA.suffix.localeCompare(classB.suffix);
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }
}

// Initialize global dropdown manager
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.dropdownManager) {
            window.dropdownManager = new DropdownManager();
            
            // Auto-initialize dropdowns on page load
            window.dropdownManager.initializeAllDropdowns();
        }
    });
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DropdownManager;
}