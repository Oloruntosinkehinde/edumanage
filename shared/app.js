/**
 * EduManage - Enhanced Backend System
 * Comprehensive data management and application logic
 */

const DEFAULT_CLASS_SECTIONS = ['A', 'B'];
const DEFAULT_CLASS_LEVELS = [1, 2, 3, 4, 5, 6];
const DEFAULT_CLASSES = DEFAULT_CLASS_LEVELS.flatMap(level =>
    DEFAULT_CLASS_SECTIONS.map(section => `Class ${level}${section}`)
);

function parseClassNameForSorting(value) {
    const normalized = (value ?? '').toString().trim();
    if (!normalized) {
        return {
            hasNumeric: false,
            grade: Number.POSITIVE_INFINITY,
            section: '',
            normalized: ''
        };
    }

    const primaryMatch = normalized.match(/^(?:Class\s*)?(\d{1,2})(?:[-\s]?)([A-Za-z])?$/i);
    if (primaryMatch) {
        return {
            hasNumeric: true,
            grade: parseInt(primaryMatch[1], 10),
            section: (primaryMatch[2] || '').toUpperCase(),
            normalized: normalized.toUpperCase()
        };
    }

    const suffixMatch = normalized.match(/(\d{1,2})(?:[-\s]?)([A-Za-z])?$/);
    if (suffixMatch) {
        return {
            hasNumeric: true,
            grade: parseInt(suffixMatch[1], 10),
            section: (suffixMatch[2] || '').toUpperCase(),
            normalized: normalized.toUpperCase()
        };
    }

    return {
        hasNumeric: false,
        grade: Number.POSITIVE_INFINITY,
        section: normalized.toUpperCase(),
        normalized: normalized.toUpperCase()
    };
}

function compareClassNames(a, b) {
    const classA = parseClassNameForSorting(a);
    const classB = parseClassNameForSorting(b);

    if (classA.hasNumeric && classB.hasNumeric) {
        if (classA.grade !== classB.grade) {
            return classA.grade - classB.grade;
        }

        if (classA.section !== classB.section) {
            return classA.section.localeCompare(classB.section);
        }
    } else if (classA.hasNumeric !== classB.hasNumeric) {
        return classA.hasNumeric ? -1 : 1;
    }

    return classA.normalized.localeCompare(classB.normalized);
}

class EduManageApp {
    constructor() {
        this.data = {
            students: [],
            teachers: [],
            subjects: [],
            results: [],
            paymentItems: [],
            payments: [],
            assignments: [],
            submissions: [],
            attendance: [],
            attendanceSettings: {
                workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                holidays: [],
                academicYear: '2025-2026'
            },
            settings: {
                currentSession: '2025-2026',
                currentTerm: 'First Term',
                terms: ['First Term', 'Second Term', 'Third Term'],
                sessions: ['2024-2025', '2025-2026', '2026-2027']
            },
            users: []
        };
        
        this.currentUser = null;
        this.filters = {};
        this.pagination = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0
        };

        this.defaultClasses = [...DEFAULT_CLASSES];
        
        this.init();
    }

    init() {
        this.loadStoredData();
        this.setupEventListeners();
        this.initializeUI();
        this.setupDefaultData();
    }

    // ==================== DATA MANAGEMENT ====================
    
    /**
     * Load data from localStorage
     */
    loadStoredData() {
        try {
            const storedData = localStorage.getItem('edumanage_data');
            if (storedData) {
                this.data = { ...this.data, ...JSON.parse(storedData) };
            }
            
            const currentUser = localStorage.getItem('edumanage_current_user');
            if (currentUser) {
                this.currentUser = JSON.parse(currentUser);
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
            this.showNotification('Error loading data from storage', 'error');
        }
    }

    /**
     * Save data to localStorage
     */
    saveData() {
        try {
            localStorage.setItem('edumanage_data', JSON.stringify(this.data));
            if (this.currentUser) {
                localStorage.setItem('edumanage_current_user', JSON.stringify(this.currentUser));
            }
        } catch (error) {
            console.error('Error saving data:', error);
            this.showNotification('Error saving data', 'error');
        }
    }

    /**
     * Setup default demo data
     */
    setupDefaultData() {
        if (this.data.students.length === 0) {
            this.data.students = [
                {
                    id: 'S001',
                    name: 'John Smith',
                    email: 'john.smith@student.school.com',
                    class: '10-A',
                    subjects: ['MATH101', 'PHY102', 'CHEM103'],
                    guardian: 'Robert Smith',
                    phone: '+1234567890',
                    address: '123 Main St, City',
                    dateOfBirth: '2008-05-15',
                    enrollmentDate: '2023-09-01',
                    status: 'active'
                },
                {
                    id: 'S002',
                    name: 'Emma Johnson',
                    email: 'emma.johnson@student.school.com',
                    class: '9-B',
                    subjects: ['BIO104', 'ENG105', 'HIST106'],
                    guardian: 'Sarah Johnson',
                    phone: '+1234567891',
                    address: '456 Oak Ave, City',
                    dateOfBirth: '2009-03-22',
                    enrollmentDate: '2023-09-01',
                    status: 'active'
                },
                {
                    id: 'S003',
                    name: 'Michael Brown',
                    email: 'michael.brown@student.school.com',
                    class: '11-C',
                    subjects: ['MATH101', 'CS107', 'PHY102'],
                    guardian: 'David Brown',
                    phone: '+1234567892',
                    address: '789 Pine Rd, City',
                    dateOfBirth: '2007-11-10',
                    enrollmentDate: '2023-09-01',
                    status: 'active'
                }
            ];
        }

        if (this.data.teachers.length === 0) {
            this.data.teachers = [
                {
                    id: 'T001',
                    name: 'Mr. Johnson',
                    email: 'johnson@school.com',
                    subjects: ['MATH101'],
                    classes: ['10-A', '10-B', '11-A'],
                    phone: '+1234567800',
                    qualification: 'M.Sc Mathematics',
                    experience: '8 years',
                    joinDate: '2018-08-15',
                    status: 'active'
                },
                {
                    id: 'T002',
                    name: 'Dr. Smith',
                    email: 'smith@school.com',
                    subjects: ['PHY102'],
                    classes: ['10-A', '11-A', '11-B'],
                    phone: '+1234567801',
                    qualification: 'Ph.D Physics',
                    experience: '12 years',
                    joinDate: '2015-07-20',
                    status: 'active'
                },
                {
                    id: 'T003',
                    name: 'Ms. Davis',
                    email: 'davis@school.com',
                    subjects: ['CHEM103'],
                    classes: ['10-B', '11-A', '12-A'],
                    phone: '+1234567802',
                    qualification: 'M.Sc Chemistry',
                    experience: '6 years',
                    joinDate: '2020-06-10',
                    status: 'active'
                }
            ];
        }

        if (this.data.subjects.length === 0) {
            this.data.subjects = [
                {
                    code: 'MATH101',
                    name: 'Mathematics',
                    description: 'Advanced Mathematics for Secondary Students',
                    credits: 4,
                    teacherId: 'T001',
                    classes: ['10-A', '10-B', '11-A'],
                    status: 'active'
                },
                {
                    code: 'PHY102',
                    name: 'Physics',
                    description: 'Fundamental Physics Concepts',
                    credits: 4,
                    teacherId: 'T002',
                    classes: ['10-A', '11-A', '11-B'],
                    status: 'active'
                },
                {
                    code: 'CHEM103',
                    name: 'Chemistry',
                    description: 'Organic and Inorganic Chemistry',
                    credits: 4,
                    teacherId: 'T003',
                    classes: ['10-B', '11-A', '12-A'],
                    status: 'active'
                },
                {
                    code: 'BIO104',
                    name: 'Biology',
                    description: 'Life Sciences and Human Biology',
                    credits: 3,
                    teacherId: 'T004',
                    classes: ['9-B', '10-B'],
                    status: 'active'
                },
                {
                    code: 'ENG105',
                    name: 'English',
                    description: 'English Language and Literature',
                    credits: 3,
                    teacherId: 'T005',
                    classes: ['9-B', '10-A', '11-A'],
                    status: 'active'
                }
            ];
        }

        if (this.data.results.length === 0) {
            this.initializeComprehensiveResultsData();
        }

        const defaultTerm = 'First Term';
        const activeSession = this.getActiveSession();

        if (this.data.paymentItems.length === 0) {
            const defaultItems = [
                // Academic Fees
                {
                    name: 'Tuition Fee',
                    amount: 120000,
                    category: 'academic',
                    classes: [],
                    mandatory: true,
                    description: 'Main academic fee per term/semester'
                },
                {
                    name: 'Examination Fee',
                    amount: 25000,
                    category: 'academic',
                    classes: [],
                    mandatory: true,
                    description: 'Internal and external exams (WAEC/NECO/IGCSE)'
                },
                {
                    name: 'Registration/Admission Fee',
                    amount: 15000,
                    category: 'academic',
                    classes: [],
                    mandatory: true,
                    description: 'One-time payment when enrolling (new students)'
                },
                {
                    name: 'Library Fee',
                    amount: 8000,
                    category: 'academic',
                    classes: [],
                    mandatory: true,
                    description: 'Library access and resource usage'
                },
                {
                    name: 'ICT/Computer Lab Fee',
                    amount: 18000,
                    category: 'academic',
                    classes: [],
                    mandatory: true,
                    description: 'Computer lab usage and maintenance'
                },
                {
                    name: 'Laboratory Fee',
                    amount: 22000,
                    category: 'academic',
                    classes: [],
                    mandatory: true,
                    description: 'Science labs and practical sessions'
                },
                // Uniform & Clothing
                {
                    name: 'School Uniform Fee',
                    amount: 35000,
                    category: 'uniform',
                    classes: [],
                    mandatory: true,
                    description: 'School wear and uniform requirements'
                },
                {
                    name: 'Sports Wear/Games Kit',
                    amount: 15000,
                    category: 'uniform',
                    classes: [],
                    mandatory: true,
                    description: 'Sports and physical education attire'
                },
                {
                    name: 'House Wear/Cultural Wear',
                    amount: 12000,
                    category: 'uniform',
                    classes: [],
                    mandatory: false,
                    description: 'Special events and boarding house wear'
                },
                // Boarding Fees
                {
                    name: 'Boarding/Hostel Fee',
                    amount: 180000,
                    category: 'boarding',
                    classes: [],
                    mandatory: false,
                    description: 'Boarding accommodation per term'
                },
                {
                    name: 'Feeding Fee',
                    amount: 95000,
                    category: 'boarding',
                    classes: [],
                    mandatory: false,
                    description: 'Meals and catering services'
                },
                {
                    name: 'Laundry Fee',
                    amount: 12000,
                    category: 'boarding',
                    classes: [],
                    mandatory: false,
                    description: 'Laundry and cleaning services'
                },
                // Student Welfare & Activities
                {
                    name: 'Medical/Health Fee',
                    amount: 15000,
                    category: 'welfare',
                    classes: [],
                    mandatory: true,
                    description: 'Clinic, nurse, and first aid services'
                },
                {
                    name: 'Sports & Recreation Fee',
                    amount: 10000,
                    category: 'welfare',
                    classes: [],
                    mandatory: false,
                    description: 'Sports activities and recreational programs'
                },
                {
                    name: 'Excursion/Field Trip Fee',
                    amount: 20000,
                    category: 'welfare',
                    classes: [],
                    mandatory: false,
                    description: 'Educational trips and excursions'
                },
                {
                    name: 'Cultural Day/Special Events Fee',
                    amount: 8000,
                    category: 'welfare',
                    classes: [],
                    mandatory: false,
                    description: 'Cultural activities and special events'
                },
                // Administrative & Development Fees
                {
                    name: 'PTA Levy',
                    amount: 5000,
                    category: 'administrative',
                    classes: [],
                    mandatory: true,
                    description: 'Parent-Teacher Association contribution'
                },
                {
                    name: 'Development Levy',
                    amount: 25000,
                    category: 'administrative',
                    classes: [],
                    mandatory: true,
                    description: 'Building projects and school expansion'
                },
                {
                    name: 'Maintenance Fee',
                    amount: 12000,
                    category: 'administrative',
                    classes: [],
                    mandatory: true,
                    description: 'Facilities upkeep and maintenance'
                },
                {
                    name: 'Insurance Fee',
                    amount: 7000,
                    category: 'administrative',
                    classes: [],
                    mandatory: false,
                    description: 'Student accident insurance coverage'
                },
                // Other Fees
                {
                    name: 'Transport/Bus Fee',
                    amount: 35000,
                    category: 'transport',
                    classes: [],
                    mandatory: false,
                    description: 'School bus transportation services'
                },
                {
                    name: 'Locker/Desk Fee',
                    amount: 3000,
                    category: 'other',
                    classes: [],
                    mandatory: false,
                    description: 'Personal locker and desk assignment'
                },
                {
                    name: 'ID Card Fee',
                    amount: 2000,
                    category: 'other',
                    classes: [],
                    mandatory: true,
                    description: 'Student identification card'
                },
                {
                    name: 'Graduation/Valedictory Fee',
                    amount: 15000,
                    category: 'other',
                    classes: ['SS3', '12-A', '12-B'],
                    mandatory: false,
                    description: 'Final year graduation ceremony and activities'
                }
            ];

            defaultItems.forEach(itemConfig => {
                this.data.paymentItems.push({
                    id: this.generateId('paymentItems'),
                    name: itemConfig.name,
                    amount: Number(itemConfig.amount) || 0,
                    category: itemConfig.category || 'other',
                    description: itemConfig.description || '',
                    mandatory: Boolean(itemConfig.mandatory),
                    term: itemConfig.term || defaultTerm,
                    session: itemConfig.session || activeSession,
                    classes: Array.isArray(itemConfig.classes) ? itemConfig.classes : [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            });
        }

        if (this.data.payments.length === 0) {
            const sampleStudents = this.data.students.slice(0, 3);

            sampleStudents.forEach((student, index) => {
                const applicableItems = this.getPaymentItems({
                    className: student.class,
                    term: defaultTerm,
                    session: activeSession
                });

                if (applicableItems.length === 0) {
                    return;
                }

                const itemsForRecord = applicableItems.map(item => {
                    const paymentFactor = index === 0 ? 1 : index === 1 ? 0.6 : 0;
                    const paidAmount = Number((item.amount * paymentFactor).toFixed(2));
                    return {
                        itemId: item.id,
                        name: item.name,
                        amount: Number(item.amount) || 0,
                        paidAmount,
                        mandatory: Boolean(item.mandatory)
                    };
                });

                const totals = itemsForRecord.reduce((acc, item) => {
                    acc.total += item.amount;
                    acc.paid += Math.min(item.paidAmount, item.amount);
                    return acc;
                }, { total: 0, paid: 0 });

                const balance = Number(Math.max(totals.total - totals.paid, 0).toFixed(2));
                const status = balance <= 0 ? 'paid' : totals.paid > 0 ? 'partial' : 'unpaid';

                this.data.payments.push({
                    id: this.generateId('payments'),
                    studentId: student.id,
                    studentName: student.name,
                    class: student.class,
                    term: defaultTerm,
                    session: activeSession,
                    items: itemsForRecord,
                    totalAmount: Number(totals.total.toFixed(2)),
                    amountPaid: Number(totals.paid.toFixed(2)),
                    balance,
                    status,
                    paymentMethod: index === 2 ? 'cash' : 'bank_transfer',
                    paymentDate: new Date().toISOString(),
                    notes: status === 'paid' ? 'Payment completed in full.' : status === 'partial' ? 'Partial payment recorded.' : 'Awaiting payment.',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            });
        }

        // Setup sample attendance data
        if (this.data.attendance.length === 0) {
            const today = new Date();
            const students = this.data.students;
            
            // Generate attendance for the last 30 days
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                
                // Skip weekends
                if (date.getDay() === 0 || date.getDay() === 6) continue;
                
                const dateStr = date.toISOString().split('T')[0];
                
                students.forEach((student, index) => {
                    let status = 'present';
                    
                    // Add some realistic variation
                    const random = Math.random();
                    if (random < 0.05) status = 'absent';
                    else if (random < 0.08) status = 'late';
                    else if (random < 0.1) status = 'sick';
                    else if (random < 0.11) status = 'excused';
                    
                    // Add some holidays
                    if (i === 20 || i === 15) status = 'holiday';
                    
                    this.data.attendance.push({
                        id: `ATT_${dateStr}_${student.id}`,
                        studentId: student.id,
                        date: dateStr,
                        status: status,
                        notes: status === 'late' ? 'Arrived 15 minutes late' : 
                               status === 'sick' ? 'Doctor\'s note provided' :
                               status === 'holiday' ? 'National Holiday' : '',
                        markedBy: 'T001',
                        markedAt: new Date().toISOString()
                    });
                });
            }
        }

        this.saveData();
    }

    // ==================== CRUD OPERATIONS ====================

    /**
     * Generic create operation
     */
    create(type, data) {
        try {
            // Generate ID if not provided
            if (!data.id) {
                data.id = this.generateId(type);
            }

            // Validate data
            if (!this.validateData(type, data)) {
                throw new Error('Invalid data provided');
            }

            // Add timestamps
            data.createdAt = new Date().toISOString();
            data.updatedAt = new Date().toISOString();

            this.data[type].push(data);
            this.saveData();
            
            this.showNotification(`${type.slice(0, -1)} created successfully`, 'success');
            this.updateUI(type);
            
            return data;
        } catch (error) {
            console.error(`Error creating ${type}:`, error);
            this.showNotification(`Error creating ${type.slice(0, -1)}: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Generic read operation with filtering and pagination
     */
    read(type, filters = {}, pagination = null) {
        try {
            let items = [...this.data[type]];

            // Apply filters
            if (Object.keys(filters).length > 0) {
                items = this.applyFilters(items, filters);
            }

            // Apply pagination
            if (pagination) {
                const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
                const endIndex = startIndex + pagination.itemsPerPage;
                
                return {
                    items: items.slice(startIndex, endIndex),
                    totalItems: items.length,
                    currentPage: pagination.currentPage,
                    totalPages: Math.ceil(items.length / pagination.itemsPerPage)
                };
            }

            return items;
        } catch (error) {
            console.error(`Error reading ${type}:`, error);
            this.showNotification(`Error loading ${type}`, 'error');
            return [];
        }
    }

    /**
     * Generic update operation
     */
    update(type, id, updates) {
        try {
            const itemIndex = this.data[type].findIndex(item => item.id === id);
            
            if (itemIndex === -1) {
                throw new Error(`${type.slice(0, -1)} not found`);
            }

            // Validate updates
            if (!this.validateData(type, updates, true)) {
                throw new Error('Invalid update data provided');
            }

            // Apply updates
            this.data[type][itemIndex] = {
                ...this.data[type][itemIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            this.saveData();
            
            this.showNotification(`${type.slice(0, -1)} updated successfully`, 'success');
            this.updateUI(type);
            
            return this.data[type][itemIndex];
        } catch (error) {
            console.error(`Error updating ${type}:`, error);
            this.showNotification(`Error updating ${type.slice(0, -1)}: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Generic delete operation
     */
    delete(type, id) {
        try {
            const itemIndex = this.data[type].findIndex(item => item.id === id);
            
            if (itemIndex === -1) {
                throw new Error(`${type.slice(0, -1)} not found`);
            }

            // Check for dependencies before deletion
            if (!this.canDelete(type, id)) {
                throw new Error('Cannot delete: item has dependencies');
            }

            this.data[type].splice(itemIndex, 1);
            this.saveData();
            
            this.showNotification(`${type.slice(0, -1)} deleted successfully`, 'success');
            this.updateUI(type);
            
            return true;
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            this.showNotification(`Error deleting ${type.slice(0, -1)}: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Replace entire collection with supplied data (used after server sync)
     */
    replaceCollection(type, items) {
        try {
            if (!Array.isArray(items)) {
                items = [];
            }

            if (!this.data[type]) {
                this.data[type] = [];
            }

            this.data[type] = items;
            this.saveData();
            this.updateUI(type);
        } catch (error) {
            console.error(`Error replacing ${type} collection:`, error);
            this.showNotification(`Unable to refresh ${type} data`, 'error');
        }
    }

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Generate unique ID for different types
     */
    generateId(type) {
        const prefix = {
            students: 'S',
            teachers: 'T',
            subjects: 'SUB',
            results: 'R',
            users: 'U',
            paymentItems: 'PAYI',
            payments: 'PAY',
            HOL: 'HOL'
        };

        let existingIds = [];

        if (Array.isArray(this.data[type])) {
            existingIds = this.data[type].map(item => item.id).filter(Boolean);
        } else if (type === 'HOL' && Array.isArray(this.data.attendanceSettings?.holidays)) {
            existingIds = this.data.attendanceSettings.holidays.map(item => item.id).filter(Boolean);
        }

        let counter = existingIds.length + 1;
        const basePrefix = prefix[type] || (typeof type === 'string' ? type.toUpperCase() : 'ID');
        let newId;

        do {
            newId = `${basePrefix}${counter.toString().padStart(3, '0')}`;
            counter++;
        } while (existingIds.includes(newId));

        return newId;
    }

    getAllStudents() {
        return Array.isArray(this.data.students) ? [...this.data.students] : [];
    }

    getStudentCount(session = null) {
        if (!Array.isArray(this.data.students)) {
            return 0;
        }

        if (!session) {
            return this.data.students.length;
        }

        return this.data.students.filter(student => {
            const studentSession = student.session || student.academicSession || student.currentSession;
            return !studentSession || studentSession === session;
        }).length;
    }

    getStudentsByClass(className, session = null) {
        if (!className) {
            return [];
        }

        return this.getAllStudents().filter(student => {
            if (student.class !== className) {
                return false;
            }

            if (!session) {
                return true;
            }

            const studentSession = student.session || student.academicSession || student.currentSession;
            return !studentSession || studentSession === session;
        });
    }

    getAllTeachers() {
        return Array.isArray(this.data.teachers) ? [...this.data.teachers] : [];
    }

    getTeacherById(teacherId) {
        try {
            if (!teacherId) {
                return null;
            }

            return this.getAllTeachers().find(teacher => teacher.id === teacherId) || null;
        } catch (error) {
            console.error('Error getting teacher by ID:', error);
            return null;
        }
    }

    getTeacherClasses(teacherId) {
        try {
            const classSet = new Set();
            const teacher = this.getTeacherById(teacherId);

            if (teacher && Array.isArray(teacher.classes)) {
                teacher.classes
                    .filter(Boolean)
                    .forEach(className => classSet.add(className));
            }

            const subjects = this.getAllSubjects().filter(subject => subject.teacherId === teacherId);
            subjects.forEach(subject => {
                if (Array.isArray(subject.classes)) {
                    subject.classes
                        .filter(Boolean)
                        .forEach(className => classSet.add(className));
                }
            });

            return Array.from(classSet);
        } catch (error) {
            console.error('Error getting teacher classes:', error);
            return [];
        }
    }

    getStudentsForTeacher(teacherId) {
        try {
            const classes = this.getTeacherClasses(teacherId);
            const allStudents = this.getAllStudents();

            let students = allStudents.filter(student => classes.includes(student.class));

            if (!students.length) {
                const subjectCodes = new Set(
                    this.getSubjectsByTeacher(teacherId).map(subject => subject.code || subject.id)
                );

                if (subjectCodes.size > 0) {
                    students = allStudents.filter(student =>
                        Array.isArray(student.subjects) && student.subjects.some(code => subjectCodes.has(code))
                    );
                }
            }

            return students;
        } catch (error) {
            console.error('Error getting students for teacher:', error);
            return [];
        }
    }

    getResultsForTeacher(teacherId) {
        try {
            if (!Array.isArray(this.data.results)) {
                return [];
            }

            const studentIds = new Set(this.getStudentsForTeacher(teacherId).map(student => student.id));

            if (studentIds.size === 0) {
                return [];
            }

            return this.data.results.filter(result => studentIds.has(result.studentId));
        } catch (error) {
            console.error('Error getting results for teacher:', error);
            return [];
        }
    }

    getTeacherDashboardSnapshot(teacherId) {
        try {
            const subjects = this.getSubjectsByTeacher(teacherId);
            const classes = this.getTeacherClasses(teacherId);
            const students = this.getStudentsForTeacher(teacherId);
            const results = this.getResultsForTeacher(teacherId);

            const pendingGrades = results.filter(result =>
                result.score === undefined || result.score === null || result.score === ''
            ).length;

            return {
                students: students.length,
                subjects: subjects.length,
                pendingGrades,
                classesToday: Math.min(subjects.length, 3),
                classes,
                subjectsList: subjects,
                studentsList: students,
                resultsList: results
            };
        } catch (error) {
            console.error('Error building teacher dashboard snapshot:', error);
            return {
                students: 0,
                subjects: 0,
                pendingGrades: 0,
                classesToday: 0,
                classes: [],
                subjectsList: [],
                studentsList: [],
                resultsList: []
            };
        }
    }

    getStudentById(studentId) {
        return this.data.students.find(student => student.id === studentId) || null;
    }

    getClassList() {
        try {
            const classSet = new Set(this.defaultClasses);

            this.getUniqueClasses().forEach(className => {
                if (className) {
                    classSet.add(className);
                }
            });

            const subjects = this.getAllSubjects();

            subjects.forEach(subject => {
                if (Array.isArray(subject.classes)) {
                    subject.classes.forEach(className => {
                        if (className) {
                            classSet.add(className);
                        }
                    });
                }
            });

            const teachers = this.getAllTeachers();
            teachers.forEach(teacher => {
                if (Array.isArray(teacher.classes)) {
                    teacher.classes.forEach(className => {
                        if (className) {
                            classSet.add(className);
                        }
                    });
                }
            });

            return Array.from(classSet)
                .filter(Boolean)
                .sort(compareClassNames);
        } catch (error) {
            console.error('Error getting class list:', error);
            return [];
        }
    }

    getUniqueClasses() {
        const classes = [
            ...this.defaultClasses,
            ...this.data.students
                .map(student => student.class)
                .filter(className => className && className.trim() !== '')
        ];

        return [...new Set(classes.filter(Boolean))].sort(compareClassNames);
    }

    getActiveSession() {
        if (this.data.settings && this.data.settings.currentSession) {
            return this.data.settings.currentSession;
        }

        if (this.data.attendanceSettings && this.data.attendanceSettings.academicYear) {
            return this.data.attendanceSettings.academicYear;
        }

        const year = new Date().getFullYear();
        return `${year}-${year + 1}`;
    }

    /**
     * Get current academic term
     */
    getCurrentTerm() {
        if (this.data.settings && this.data.settings.currentTerm) {
            return this.data.settings.currentTerm;
        }
        return 'First Term';
    }

    /**
     * Get all available terms
     */
    getAvailableTerms() {
        if (this.data.settings && this.data.settings.terms) {
            return this.data.settings.terms;
        }
        return ['First Term', 'Second Term', 'Third Term'];
    }

    /**
     * Get all available sessions
     */
    getAvailableSessions() {
        if (this.data.settings && this.data.settings.sessions) {
            return this.data.settings.sessions;
        }
        const currentYear = new Date().getFullYear();
        return [
            `${currentYear - 1}-${currentYear}`,
            `${currentYear}-${currentYear + 1}`,
            `${currentYear + 1}-${currentYear + 2}`
        ];
    }

    /**
     * Set current session
     */
    setCurrentSession(session) {
        if (!this.data.settings) {
            this.data.settings = {};
        }
        this.data.settings.currentSession = session;
        this.saveData();
        this.showNotification(`Current session set to ${session}`, 'success');
    }

    /**
     * Set current term
     */
    setCurrentTerm(term) {
        if (!this.data.settings) {
            this.data.settings = {};
        }
        this.data.settings.currentTerm = term;
        this.saveData();
        this.showNotification(`Current term set to ${term}`, 'success');
    }

    /**
     * Get session and term info for display
     */
    getSessionTermInfo() {
        return {
            currentSession: this.getActiveSession(),
            currentTerm: this.getCurrentTerm(),
            availableSessions: this.getAvailableSessions(),
            availableTerms: this.getAvailableTerms()
        };
    }

    /**
     * Validate data based on type
     */
    validateData(type, data, isUpdate = false) {
        const validators = {
            students: (data) => {
                if (!isUpdate && (!data.name || !data.email || !data.class)) return false;
                if (data.email && !this.isValidEmail(data.email)) return false;
                return true;
            },
            teachers: (data) => {
                if (!isUpdate && (!data.name || !data.email)) return false;
                if (data.email && !this.isValidEmail(data.email)) return false;
                return true;
            },
            subjects: (data) => {
                if (!isUpdate && (!data.code || !data.name)) return false;
                return true;
            },
            results: (data) => {
                if (!isUpdate && (!data.studentId || !data.subjectCode || data.marks === undefined)) return false;
                if (data.marks !== undefined && (data.marks < 0 || data.marks > (data.maxMarks || 100))) return false;
                return true;
            }
        };

        return validators[type] ? validators[type](data) : true;
    }

    /**
     * Check if item can be deleted (no dependencies)
     */
    canDelete(type, id) {
        switch (type) {
            case 'teachers':
                return !this.data.subjects.some(subject => subject.teacherId === id);
            case 'subjects':
                return !this.data.results.some(result => result.subjectCode === id);
            case 'students':
                return !this.data.results.some(result => result.studentId === id);
            default:
                return true;
        }
    }

    /**
     * Apply filters to data
     */
    applyFilters(items, filters) {
        return items.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];
                const itemValue = item[key];

                if (filterValue === '' || filterValue === null || filterValue === undefined) {
                    return true;
                }

                if (typeof filterValue === 'string') {
                    return itemValue && itemValue.toString().toLowerCase().includes(filterValue.toLowerCase());
                }

                return itemValue === filterValue;
            });
        });
    }

    /**
     * Email validation
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ==================== UI MANAGEMENT ====================

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeMenuNavigation();
            this.initializeTabs();
            this.initializeModals();
            this.initializeSearch();
            this.initializePagination();
            this.setupMobileMenu();
        });
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        this.updateDashboardStats();
        this.setupFormHandlers();
    }

    /**
     * Update dashboard statistics
     */
    updateDashboardStats() {
        const stats = {
            students: this.data.students.filter(s => s.status === 'active').length,
            teachers: this.data.teachers.filter(t => t.status === 'active').length,
            subjects: this.data.subjects.filter(s => s.status === 'active').length,
            results: this.data.results.length
        };

        // Update dashboard cards
        const updateCard = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value.toLocaleString();
            }
        };

        updateCard('.card:nth-child(1) .card-value', stats.students);
        updateCard('.card:nth-child(2) .card-value', stats.teachers);
        updateCard('.card:nth-child(3) .card-value', stats.subjects);
        updateCard('.card:nth-child(4) .card-value', stats.results);
    }

    /**
     * Update UI for specific data type
     */
    updateUI(type) {
        this.updateDashboardStats();
        
        // Refresh current page if viewing the updated type
        const currentPage = this.getCurrentPage();
        if (currentPage === type) {
            this.renderDataTable(type);
        }
    }

    /**
     * Get current page
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '');
        return page === 'index' ? 'dashboard' : page;
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // ==================== INITIALIZATION ====================

    initializeMenuNavigation() {
        const menuItems = document.querySelectorAll('.menu-item[data-page]');
        const pageContents = document.querySelectorAll('.page-content');

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all menu items
                menuItems.forEach(i => i.classList.remove('active'));
                
                // Add active class to clicked menu item
                item.classList.add('active');
                
                // Hide all page contents
                pageContents.forEach(content => content.classList.remove('active'));
                
                // Show the corresponding page content
                const pageId = item.getAttribute('data-page');
                const pageElement = document.getElementById(pageId);
                if (pageElement) {
                    pageElement.classList.add('active');
                    this.renderPage(pageId);
                }
                
                // Update header title
                const headerTitle = document.querySelector('.header-title');
                if (headerTitle) {
                    const title = item.querySelector('span').textContent;
                    headerTitle.textContent = title + (pageId === 'dashboard' ? '' : ' Management');
                }
            });
        });
    }

    initializeTabs() {
        const tabs = document.querySelectorAll('.tab[data-tab]');
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

    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');

        if (mobileMenuToggle && sidebar) {
            mobileMenuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // Handle responsive behavior
        const handleResize = () => {
            if (window.innerWidth > 768 && sidebar) {
                sidebar.classList.remove('active');
            }
        };

        window.addEventListener('resize', handleResize);
    }

    renderPage(pageId) {
        switch (pageId) {
            case 'students':
                this.renderDataTable('students');
                break;
            case 'teachers':
                this.renderDataTable('teachers');
                break;
            case 'subjects':
                this.renderDataTable('subjects');
                break;
            case 'results':
                this.renderDataTable('results');
                break;
            default:
                break;
        }
    }

    renderDataTable(type) {
        // This method would render the appropriate data table
        // Implementation would depend on the specific HTML structure
        console.log(`Rendering ${type} table`);
    }

    setupFormHandlers() {
        // Setup form submission handlers
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('data-form')) {
                e.preventDefault();
                this.handleFormSubmission(e.target);
            }
        });
    }

    handleFormSubmission(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const type = form.dataset.type;
        const action = form.dataset.action || 'create';
        const id = form.dataset.id;

        if (action === 'create') {
            this.create(type, data);
        } else if (action === 'update') {
            this.update(type, id, data);
        }

        form.reset();
    }

    initializeModals() {
        // Modal functionality for forms and dialogs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-overlay')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            }
        });
    }

    initializeSearch() {
        const searchInputs = document.querySelectorAll('.search-input');
        
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const searchTerm = e.target.value;
                const tableType = e.target.dataset.table;
                
                if (tableType) {
                    this.performSearch(tableType, searchTerm);
                }
            });
        });
    }

    performSearch(type, searchTerm) {
        const filters = {};
        
        // Apply search to multiple fields based on type
        if (searchTerm) {
            this.filters[type] = { searchTerm };
        } else {
            delete this.filters[type];
        }
        
        this.renderDataTable(type);
    }

    initializePagination() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn')) {
                const page = parseInt(e.target.dataset.page);
                const type = e.target.dataset.type;
                
                this.pagination.currentPage = page;
                this.renderDataTable(type);
            }
        });
    }

    // ==================== PAYMENT MANAGEMENT ====================

    getPaymentItems(filters = {}) {
        try {
            const { className, term, session, id } = filters;

            if (id) {
                return this.data.paymentItems.find(item => item.id === id) || null;
            }

            return this.data.paymentItems.filter(item => {
                const classes = Array.isArray(item.classes) ? item.classes : [];
                const matchesClass = !className || classes.length === 0 || classes.includes(className);
                const matchesTerm = !term || item.term === term;
                const matchesSession = !session || item.session === session;
                return matchesClass && matchesTerm && matchesSession;
            });
        } catch (error) {
            console.error('Error getting payment items:', error);
            return [];
        }
    }

    upsertPaymentItem(itemData) {
        try {
            const timestamp = new Date().toISOString();
            const normalizedData = {
                id: itemData.id || this.generateId('paymentItems'),
                name: (itemData.name || '').trim(),
                amount: Number(itemData.amount) || 0,
                category: itemData.category || 'other',
                description: itemData.description || '',
                mandatory: Boolean(itemData.mandatory),
                term: itemData.term || 'First Term',
                session: itemData.session || this.getActiveSession(),
                classes: Array.isArray(itemData.classes) ? itemData.classes.filter(Boolean) : [],
                updatedAt: timestamp
            };

            if (!normalizedData.name) {
                throw new Error('Item name is required');
            }

            const existingIndex = this.data.paymentItems.findIndex(item => item.id === normalizedData.id);

            if (existingIndex === -1) {
                normalizedData.createdAt = timestamp;
                this.data.paymentItems.push(normalizedData);
            } else {
                const existingItem = this.data.paymentItems[existingIndex];
                this.data.paymentItems[existingIndex] = {
                    ...existingItem,
                    ...normalizedData,
                    createdAt: existingItem.createdAt || timestamp
                };
            }

            this.saveData();
            this.showNotification('Payment item saved successfully!', 'success');
            return normalizedData;
        } catch (error) {
            console.error('Error saving payment item:', error);
            this.showNotification(`Error saving payment item: ${error.message}`, 'error');
            return null;
        }
    }

    deletePaymentItem(itemId) {
        try {
            const index = this.data.paymentItems.findIndex(item => item.id === itemId);
            if (index === -1) {
                throw new Error('Payment item not found');
            }

            this.data.paymentItems.splice(index, 1);

            this.data.payments = this.data.payments.map(payment => {
                if (!Array.isArray(payment.items)) {
                    return payment;
                }

                payment.items = payment.items.filter(item => item.itemId !== itemId);
                return this.recalculatePaymentRecord(payment);
            });

            this.saveData();
            this.showNotification('Payment item deleted successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error deleting payment item:', error);
            this.showNotification(`Error deleting payment item: ${error.message}`, 'error');
            return false;
        }
    }

    getPayments(filters = {}) {
        try {
            const { studentId, studentIds, className, term, session, status, search } = filters;

            let payments = [...this.data.payments];

            if (studentId) {
                payments = payments.filter(payment => payment.studentId === studentId);
            }

            if (Array.isArray(studentIds) && studentIds.length > 0) {
                payments = payments.filter(payment => studentIds.includes(payment.studentId));
            }

            if (className) {
                payments = payments.filter(payment => payment.class === className);
            }

            if (term) {
                payments = payments.filter(payment => payment.term === term);
            }

            if (session) {
                payments = payments.filter(payment => payment.session === session);
            }

            if (status) {
                payments = payments.filter(payment => payment.status === status);
            }

            if (search) {
                const lowerSearch = search.toLowerCase();
                payments = payments.filter(payment =>
                    (payment.studentName && payment.studentName.toLowerCase().includes(lowerSearch)) ||
                    (payment.studentId && payment.studentId.toLowerCase().includes(lowerSearch))
                );
            }

            return payments.sort((a, b) => {
                const dateA = new Date(a.paymentDate || a.updatedAt || 0);
                const dateB = new Date(b.paymentDate || b.updatedAt || 0);
                return dateB - dateA;
            });
        } catch (error) {
            console.error('Error getting payments:', error);
            return [];
        }
    }

    recalculatePaymentRecord(payment) {
        if (!payment || !Array.isArray(payment.items)) {
            return payment;
        }

        const totals = payment.items.reduce((acc, item) => {
            const amount = Number(item.amount) || 0;
            const paid = Number(item.paidAmount) || 0;
            acc.total += amount;
            acc.paid += Math.min(paid, amount);
            return acc;
        }, { total: 0, paid: 0 });

        payment.totalAmount = Number(totals.total.toFixed(2));
        payment.amountPaid = Number(totals.paid.toFixed(2));
        payment.balance = Number(Math.max(payment.totalAmount - payment.amountPaid, 0).toFixed(2));

        if (payment.totalAmount === 0) {
            payment.status = 'not_configured';
        } else if (payment.balance <= 0) {
            payment.status = 'paid';
        } else if (payment.amountPaid > 0) {
            payment.status = 'partial';
        } else {
            payment.status = 'unpaid';
        }

        return payment;
    }

    upsertPaymentRecord(paymentData) {
        try {
            const { studentId, term, session, items, paymentMethod, paymentDate, notes, id } = paymentData;
            
            if (!studentId) {
                throw new Error('Student ID is required');
            }

            const student = this.getStudentById(studentId);
            if (!student) {
                throw new Error('Student not found');
            }

            const timestamp = new Date().toISOString();
            const activeSession = session || this.getActiveSession();
            const activeTerm = term || 'First Term';

            let existingPaymentIndex = -1;
            if (id) {
                existingPaymentIndex = this.data.payments.findIndex(p => p.id === id);
            } else {
                existingPaymentIndex = this.data.payments.findIndex(p => 
                    p.studentId === studentId && 
                    p.term === activeTerm && 
                    p.session === activeSession
                );
            }

            const paymentItems = Array.isArray(items) ? items.map(item => {
                const paymentItem = this.getPaymentItems({ id: item.itemId });
                return {
                    itemId: item.itemId,
                    name: paymentItem ? paymentItem.name : 'Unknown Item',
                    amount: paymentItem ? Number(paymentItem.amount) : 0,
                    paidAmount: Number(item.paidAmount) || 0,
                    mandatory: paymentItem ? paymentItem.mandatory : false,
                    status: item.status || (Number(item.paidAmount) > 0 ? 'paid' : 'unpaid')
                };
            }) : [];

            const totals = paymentItems.reduce((acc, item) => {
                acc.total += item.amount;
                acc.paid += Math.min(item.paidAmount, item.amount);
                return acc;
            }, { total: 0, paid: 0 });

            const paymentRecord = {
                id: id || this.generateId('payments'),
                studentId,
                studentName: student.name,
                class: student.class,
                term: activeTerm,
                session: activeSession,
                items: paymentItems,
                totalAmount: Number(totals.total.toFixed(2)),
                amountPaid: Number(totals.paid.toFixed(2)),
                balance: Number(Math.max(totals.total - totals.paid, 0).toFixed(2)),
                status: totals.total === 0 ? 'not_configured' : 
                        totals.paid >= totals.total ? 'paid' : 
                        totals.paid > 0 ? 'partial' : 'unpaid',
                paymentMethod: paymentMethod || 'cash',
                paymentDate: paymentDate || timestamp,
                notes: notes || '',
                updatedAt: timestamp
            };

            if (existingPaymentIndex >= 0) {
                paymentRecord.createdAt = this.data.payments[existingPaymentIndex].createdAt || timestamp;
                this.data.payments[existingPaymentIndex] = paymentRecord;
            } else {
                paymentRecord.createdAt = timestamp;
                this.data.payments.push(paymentRecord);
            }

            this.saveData();
            this.showNotification('Payment record saved successfully!', 'success');
            return paymentRecord;
        } catch (error) {
            console.error('Error saving payment record:', error);
            this.showNotification(`Error saving payment record: ${error.message}`, 'error');
            return null;
        }
    }

    updatePaymentItemStatus(studentId, itemId, status, paidAmount = null) {
        try {
            const payments = this.getPayments({ studentId });
            let updated = false;

            payments.forEach(payment => {
                if (Array.isArray(payment.items)) {
                    payment.items.forEach(item => {
                        if (item.itemId === itemId) {
                            item.status = status;
                            if (paidAmount !== null) {
                                item.paidAmount = Number(paidAmount) || 0;
                            } else if (status === 'paid') {
                                item.paidAmount = item.amount;
                            } else if (status === 'unpaid') {
                                item.paidAmount = 0;
                            }
                            updated = true;
                        }
                    });
                    
                    if (updated) {
                        this.recalculatePaymentRecord(payment);
                        const paymentIndex = this.data.payments.findIndex(p => p.id === payment.id);
                        if (paymentIndex >= 0) {
                            this.data.payments[paymentIndex] = payment;
                        }
                    }
                }
            });

            if (updated) {
                this.saveData();
                this.showNotification('Payment status updated successfully!', 'success');
                return true;
            } else {
                throw new Error('Payment item not found');
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            this.showNotification(`Error updating payment status: ${error.message}`, 'error');
            return false;
        }
    }

    bulkUpdatePaymentStatus(studentIds, itemId, status, paidAmount = null) {
        try {
            let updatedCount = 0;
            const results = [];

            studentIds.forEach(studentId => {
                const result = this.updatePaymentItemStatus(studentId, itemId, status, paidAmount);
                if (result) {
                    updatedCount++;
                }
                results.push({ studentId, success: result });
            });

            this.showNotification(`Updated payment status for ${updatedCount} students`, 'success');
            return { updatedCount, results };
        } catch (error) {
            console.error('Error in bulk update:', error);
            this.showNotification(`Error in bulk update: ${error.message}`, 'error');
            return { updatedCount: 0, results: [] };
        }
    }

    getStudentExpectedItems(studentId, options = {}) {
        try {
            const student = this.getStudentById(studentId);
            if (!student) return [];

            const { term, session } = options;
            return this.getPaymentItems({
                className: student.class,
                term: term || 'First Term',
                session: session || this.getActiveSession()
            });
        } catch (error) {
            console.error('Error getting student expected items:', error);
            return [];
        }
    }

    getStudentPaymentSummary(studentId) {
        try {
            const student = this.getStudentById(studentId);
            if (!student) return null;

            const expectedItems = this.getStudentExpectedItems(studentId);
            const payments = this.getPayments({ studentId });
            
            if (expectedItems.length === 0) {
                return {
                    studentId,
                    studentName: student.name,
                    class: student.class,
                    expectedItems: [],
                    payments: [],
                    totalExpected: 0,
                    totalPaid: 0,
                    balance: 0,
                    status: 'not_configured',
                    latestPaymentDate: null
                };
            }

            const totalExpected = expectedItems.reduce((sum, item) => sum + Number(item.amount), 0);
            const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0);
            const balance = Math.max(totalExpected - totalPaid, 0);
            
            const status = totalExpected === 0 ? 'not_configured' :
                          balance <= 0 ? 'paid' :
                          totalPaid > 0 ? 'partial' : 'unpaid';

            const latestPaymentDate = payments.length > 0 
                ? payments.reduce((latest, payment) => {
                    const paymentDate = new Date(payment.paymentDate || 0);
                    return paymentDate > latest ? paymentDate : latest;
                }, new Date(0)).toISOString()
                : null;

            return {
                studentId,
                studentName: student.name,
                class: student.class,
                expectedItems,
                payments,
                totalExpected: Number(totalExpected.toFixed(2)),
                totalPaid: Number(totalPaid.toFixed(2)),
                balance: Number(balance.toFixed(2)),
                status,
                latestPaymentDate
            };
        } catch (error) {
            console.error('Error getting student payment summary:', error);
            return null;
        }
    }

    getPaymentDashboardSummary(filters = {}) {
        try {
            const payments = this.getPayments(filters);
            
            const summary = {
                totalRevenue: 0,
                paidStudents: 0,
                pendingPayments: 0,
                monthRevenue: 0,
                totalStudents: 0
            };

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            payments.forEach(payment => {
                summary.totalRevenue += Number(payment.amountPaid || 0);
                
                if (payment.status === 'paid') {
                    summary.paidStudents++;
                } else if (payment.status === 'partial' || payment.status === 'unpaid') {
                    summary.pendingPayments++;
                }

                // Month revenue calculation
                if (payment.paymentDate) {
                    const paymentDate = new Date(payment.paymentDate);
                    if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
                        summary.monthRevenue += Number(payment.amountPaid || 0);
                    }
                }
            });

            summary.totalStudents = payments.length;
            return summary;
        } catch (error) {
            console.error('Error getting payment dashboard summary:', error);
            return {
                totalRevenue: 0,
                paidStudents: 0,
                pendingPayments: 0,
                monthRevenue: 0,
                totalStudents: 0
            };
        }
    }

    deletePaymentRecord(paymentId) {
        try {
            const index = this.data.payments.findIndex(p => p.id === paymentId);
            if (index === -1) {
                throw new Error('Payment record not found');
            }

            this.data.payments.splice(index, 1);
            this.saveData();
            this.showNotification('Payment record deleted successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error deleting payment record:', error);
            this.showNotification(`Error deleting payment record: ${error.message}`, 'error');
            return false;
        }
    }

    // ==================== ASSIGNMENT MANAGEMENT ====================
    
    /**
     * Create a new assignment
     */
    createAssignment(assignmentData) {
        try {
            const assignment = {
                id: this.generateId('ASG'),
                ...assignmentData,
                createdBy: this.currentUser?.id || 'teacher',
                createdAt: new Date().toISOString(),
                status: assignmentData.status || 'active',
                submissions: []
            };
            
            this.data.assignments.push(assignment);
            this.saveData();
            this.showNotification('Assignment created successfully!', 'success');
            return assignment;
        } catch (error) {
            console.error('Error creating assignment:', error);
            this.showNotification('Error creating assignment', 'error');
            return null;
        }
    }

    /**
     * Update an assignment
     */
    updateAssignment(id, updateData) {
        try {
            const index = this.data.assignments.findIndex(a => a.id === id);
            if (index !== -1) {
                this.data.assignments[index] = { 
                    ...this.data.assignments[index], 
                    ...updateData,
                    updatedAt: new Date().toISOString()
                };
                this.saveData();
                this.showNotification('Assignment updated successfully!', 'success');
                return this.data.assignments[index];
            }
            throw new Error('Assignment not found');
        } catch (error) {
            console.error('Error updating assignment:', error);
            this.showNotification('Error updating assignment', 'error');
            return null;
        }
    }

    /**
     * Delete an assignment
     */
    deleteAssignment(id) {
        try {
            const index = this.data.assignments.findIndex(a => a.id === id);
            if (index !== -1) {
                this.data.assignments.splice(index, 1);
                // Also remove associated submissions
                this.data.submissions = this.data.submissions.filter(s => s.assignmentId !== id);
                this.saveData();
                this.showNotification('Assignment deleted successfully!', 'success');
                return true;
            }
            throw new Error('Assignment not found');
        } catch (error) {
            console.error('Error deleting assignment:', error);
            this.showNotification('Error deleting assignment', 'error');
            return false;
        }
    }

    /**
     * Submit assignment by student
     */
    submitAssignment(submissionData) {
        try {
            const submission = {
                id: this.generateId('SUB'),
                ...submissionData,
                submittedBy: this.currentUser?.id || 'student',
                submittedAt: new Date().toISOString(),
                status: 'submitted',
                grade: null,
                feedback: null
            };
            
            this.data.submissions.push(submission);
            this.saveData();
            this.showNotification('Assignment submitted successfully!', 'success');
            return submission;
        } catch (error) {
            console.error('Error submitting assignment:', error);
            this.showNotification('Error submitting assignment', 'error');
            return null;
        }
    }

    /**
     * Grade an assignment submission
     */
    gradeSubmission(submissionId, gradeData) {
        try {
            const index = this.data.submissions.findIndex(s => s.id === submissionId);
            if (index !== -1) {
                this.data.submissions[index] = {
                    ...this.data.submissions[index],
                    grade: gradeData.marks,
                    feedback: gradeData.feedback,
                    gradedBy: this.currentUser?.id || 'teacher',
                    gradedAt: new Date().toISOString(),
                    status: 'graded'
                };
                this.saveData();
                this.showNotification('Assignment graded successfully!', 'success');
                return this.data.submissions[index];
            }
            throw new Error('Submission not found');
        } catch (error) {
            console.error('Error grading submission:', error);
            this.showNotification('Error grading submission', 'error');
            return null;
        }
    }

    /**
     * Get assignments for current user
     */
    getAssignmentsForUser(role, userId) {
        try {
            if (role === 'teacher') {
                return this.data.assignments.filter(a => a.createdBy === userId);
            } else if (role === 'student') {
                const student = this.data.students.find(s => s.id === userId);
                if (student) {
                    return this.data.assignments.filter(a => 
                        a.class === student.class && 
                        a.status === 'active'
                    );
                }
            }
            return [];
        } catch (error) {
            console.error('Error getting assignments:', error);
            return [];
        }
    }

    /**
     * Get submissions for assignment
     */
    getSubmissionsForAssignment(assignmentId) {
        try {
            return this.data.submissions.filter(s => s.assignmentId === assignmentId);
        } catch (error) {
            console.error('Error getting submissions:', error);
            return [];
        }
    }

    /**
     * Get student's submissions
     */
    getStudentSubmissions(studentId) {
        try {
            return this.data.submissions.filter(s => s.submittedBy === studentId);
        } catch (error) {
            console.error('Error getting student submissions:', error);
            return [];
        }
    }

    // ==================== ATTENDANCE MANAGEMENT ====================
    
    /**
     * Mark attendance for students
     */
    markAttendance(attendanceData) {
        try {
            const attendance = {
                id: this.generateId('ATT'),
                date: attendanceData.date,
                class: attendanceData.class,
                markedBy: this.currentUser?.id || 'teacher',
                markedAt: new Date().toISOString(),
                records: attendanceData.records || []
            };
            
            // Check if attendance already exists for this date and class
            const existingIndex = this.data.attendance.findIndex(
                a => a.date === attendance.date && a.class === attendance.class
            );
            
            if (existingIndex !== -1) {
                // Update existing attendance
                this.data.attendance[existingIndex] = attendance;
                this.showNotification('Attendance updated successfully!', 'success');
            } else {
                // Add new attendance
                this.data.attendance.push(attendance);
                this.showNotification('Attendance marked successfully!', 'success');
            }
            
            this.saveData();
            return attendance;
        } catch (error) {
            console.error('Error marking attendance:', error);
            this.showNotification('Error marking attendance', 'error');
            return null;
        }
    }

    /**
     * Get attendance for a specific date and class
     */
    getAttendance(date, className) {
        try {
            return this.data.attendance.find(
                a => a.date === date && a.class === className
            );
        } catch (error) {
            console.error('Error getting attendance:', error);
            return null;
        }
    }

    /**
     * Get attendance summary for a student
     */
    getStudentAttendanceSummary(studentId, startDate = null, endDate = null) {
        try {
            const student = this.data.students.find(s => s.id === studentId);
            if (!student) return null;

            const studentClass = student.class;
            let attendanceRecords = this.data.attendance.filter(a => a.class === studentClass);

            // Filter by date range if provided
            if (startDate && endDate) {
                attendanceRecords = attendanceRecords.filter(a => {
                    const recordDate = new Date(a.date);
                    return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
                });
            }

            let totalDays = 0;
            let presentDays = 0;
            let absentDays = 0;
            let lateDays = 0;
            let excusedDays = 0;
            let sickDays = 0;
            let holidayDays = 0;

            attendanceRecords.forEach(attendance => {
                const record = attendance.records.find(r => r.studentId === studentId);
                if (record) {
                    totalDays++;
                    switch (record.status) {
                        case 'present':
                            presentDays++;
                            break;
                        case 'absent':
                            absentDays++;
                            break;
                        case 'late':
                            lateDays++;
                            presentDays++; // Late is counted as present
                            break;
                        case 'excused':
                            excusedDays++;
                            break;
                        case 'sick':
                            sickDays++;
                            break;
                        case 'holiday':
                            holidayDays++;
                            break;
                    }
                }
            });

            const attendancePercentage = totalDays > 0 ? 
                ((presentDays + lateDays) / (totalDays - holidayDays)) * 100 : 0;

            return {
                studentId,
                studentName: student.name,
                totalDays,
                presentDays,
                absentDays,
                lateDays,
                excusedDays,
                sickDays,
                holidayDays,
                attendancePercentage: Math.round(attendancePercentage * 100) / 100,
                workingDays: totalDays - holidayDays
            };
        } catch (error) {
            console.error('Error getting student attendance summary:', error);
            return null;
        }
    }

    /**
     * Get class attendance summary
     */
    getClassAttendanceSummary(className, startDate = null, endDate = null) {
        try {
            const classStudents = this.data.students.filter(s => s.class === className);
            const summaries = classStudents.map(student => 
                this.getStudentAttendanceSummary(student.id, startDate, endDate)
            ).filter(summary => summary !== null);

            const classStats = {
                totalStudents: classStudents.length,
                averageAttendance: 0,
                totalWorkingDays: 0,
                presentToday: 0,
                absentToday: 0
            };

            if (summaries.length > 0) {
                classStats.averageAttendance = summaries.reduce((sum, s) => sum + s.attendancePercentage, 0) / summaries.length;
                classStats.totalWorkingDays = Math.max(...summaries.map(s => s.workingDays));
                
                // Get today's attendance
                const today = new Date().toISOString().split('T')[0];
                const todayAttendance = this.getAttendance(today, className);
                if (todayAttendance) {
                    todayAttendance.records.forEach(record => {
                        if (['present', 'late'].includes(record.status)) {
                            classStats.presentToday++;
                        } else if (record.status === 'absent') {
                            classStats.absentToday++;
                        }
                    });
                }
            }

            return {
                className,
                students: summaries,
                stats: classStats
            };
        } catch (error) {
            console.error('Error getting class attendance summary:', error);
            return null;
        }
    }

    /**
     * Get attendance statistics for date range
     */
    getAttendanceStats(className, startDate, endDate) {
        try {
            let attendanceRecords = this.data.attendance.filter(a => a.class === className);
            
            if (startDate && endDate) {
                attendanceRecords = attendanceRecords.filter(a => {
                    const recordDate = new Date(a.date);
                    return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
                });
            }

            const stats = {
                totalDays: attendanceRecords.length,
                dailyStats: []
            };

            attendanceRecords.forEach(attendance => {
                const dayStats = {
                    date: attendance.date,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    sick: 0,
                    holiday: 0,
                    total: attendance.records.length
                };

                attendance.records.forEach(record => {
                    switch (record.status) {
                        case 'present':
                            dayStats.present++;
                            break;
                        case 'absent':
                            dayStats.absent++;
                            break;
                        case 'late':
                            dayStats.late++;
                            break;
                        case 'excused':
                            dayStats.excused++;
                            break;
                        case 'sick':
                            dayStats.sick++;
                            break;
                        case 'holiday':
                            dayStats.holiday++;
                            break;
                    }
                });

                dayStats.attendanceRate = dayStats.total > 0 ? 
                    ((dayStats.present + dayStats.late) / dayStats.total) * 100 : 0;

                stats.dailyStats.push(dayStats);
            });

            return stats;
        } catch (error) {
            console.error('Error getting attendance stats:', error);
            return null;
        }
    }

    /**
     * Mark holiday for specific date
     */
    markHoliday(date, reason, className = null) {
        try {
            const holiday = {
                id: this.generateId('HOL'),
                date,
                reason,
                class: className, // null for school-wide holiday
                markedBy: this.currentUser?.id || 'admin',
                markedAt: new Date().toISOString()
            };

            this.data.attendanceSettings.holidays.push(holiday);
            this.saveData();
            this.showNotification('Holiday marked successfully!', 'success');
            return holiday;
        } catch (error) {
            console.error('Error marking holiday:', error);
            this.showNotification('Error marking holiday', 'error');
            return null;
        }
    }

    /**
     * Check if date is a holiday
     */
    isHoliday(date, className = null) {
        try {
            return this.data.attendanceSettings.holidays.some(holiday => 
                holiday.date === date && 
                (holiday.class === null || holiday.class === className)
            );
        } catch (error) {
            console.error('Error checking holiday:', error);
            return false;
        }
    }

    // ============== SUBJECT MANAGEMENT METHODS ==============

    /**
     * Get all subjects
     */
    getAllSubjects() {
        try {
            return this.data.subjects || [];
        } catch (error) {
            console.error('Error getting subjects:', error);
            return [];
        }
    }

    /**
     * Get subject by code
     */
    getSubjectByCode(code) {
        try {
            return this.data.subjects.find(subject => subject.code === code) || null;
        } catch (error) {
            console.error('Error getting subject by code:', error);
            return null;
        }
    }

    /**
     * Get subjects by teacher ID
     */
    getSubjectsByTeacher(teacherId) {
        try {
            return this.data.subjects.filter(subject => subject.teacherId === teacherId);
        } catch (error) {
            console.error('Error getting subjects by teacher:', error);
            return [];
        }
    }

    /**
     * Get subjects by class
     */
    getSubjectsByClass(className) {
        try {
            return this.data.subjects.filter(subject => 
                subject.classes.includes(className) && subject.status === 'active'
            );
        } catch (error) {
            console.error('Error getting subjects by class:', error);
            return [];
        }
    }

    /**
     * Create a new subject
     */
    createSubject(subjectData) {
        try {
            // Validate required fields
            if (!subjectData.code || !subjectData.name) {
                throw new Error('Subject code and name are required');
            }

            // Check if subject code already exists
            if (this.data.subjects.find(s => s.code === subjectData.code)) {
                throw new Error('Subject code already exists');
            }

            // Validate teacher exists
            if (subjectData.teacherId) {
                const teacher = this.getAllTeachers().find(t => t.id === subjectData.teacherId);
                if (!teacher) {
                    throw new Error('Selected teacher not found');
                }
            }

            // Create subject object
            const subject = {
                id: this.generateId('subjects'),
                code: subjectData.code.toUpperCase(),
                name: subjectData.name,
                description: subjectData.description || '',
                credits: parseInt(subjectData.credits) || 3,
                teacherId: subjectData.teacherId || null,
                classes: Array.isArray(subjectData.classes) ? subjectData.classes : [],
                status: subjectData.status || 'active',
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser?.id || 'admin',
                updatedAt: new Date().toISOString(),
                updatedBy: this.currentUser?.id || 'admin'
            };

            this.data.subjects.push(subject);
            this.saveData();
            this.showNotification('Subject created successfully!', 'success');
            return subject;
        } catch (error) {
            console.error('Error creating subject:', error);
            this.showNotification('Error creating subject: ' + error.message, 'error');
            throw error;
        }
    }

    addSubject(subjectData) {
        const originalNotifier = this.showNotification;
        try {
            this.showNotification = () => {};
            return this.createSubject(subjectData);
        } finally {
            this.showNotification = originalNotifier;
        }
    }

    /**
     * Update an existing subject
     */
    updateSubject(subjectCode, updateData) {
        try {
            const subjectIndex = this.data.subjects.findIndex(s => s.code === subjectCode);
            if (subjectIndex === -1) {
                throw new Error('Subject not found');
            }

            // If changing code, check for duplicates
            if (updateData.code && updateData.code !== subjectCode) {
                if (this.data.subjects.find(s => s.code === updateData.code && s.code !== subjectCode)) {
                    throw new Error('Subject code already exists');
                }
            }

            // Validate teacher exists
            if (updateData.teacherId) {
                const teacher = this.getAllTeachers().find(t => t.id === updateData.teacherId);
                if (!teacher) {
                    throw new Error('Selected teacher not found');
                }
            }

            // Update subject
            const subject = this.data.subjects[subjectIndex];
            Object.assign(subject, {
                code: (updateData.code || subject.code).toUpperCase(),
                name: updateData.name || subject.name,
                description: updateData.description !== undefined ? updateData.description : subject.description,
                credits: updateData.credits !== undefined ? parseInt(updateData.credits) : subject.credits,
                teacherId: updateData.teacherId !== undefined ? updateData.teacherId : subject.teacherId,
                classes: Array.isArray(updateData.classes) ? updateData.classes : subject.classes,
                status: updateData.status || subject.status,
                updatedAt: new Date().toISOString(),
                updatedBy: this.currentUser?.id || 'admin'
            });

            this.saveData();
            this.showNotification('Subject updated successfully!', 'success');
            return subject;
        } catch (error) {
            console.error('Error updating subject:', error);
            this.showNotification('Error updating subject: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Delete a subject
     */
    deleteSubject(subjectCode) {
        try {
            const subjectIndex = this.data.subjects.findIndex(s => s.code === subjectCode);
            if (subjectIndex === -1) {
                throw new Error('Subject not found');
            }

            // Check if subject has related data (results, etc.)
            const hasResults = this.data.results && this.data.results.some(r => r.subjectCode === subjectCode);
            if (hasResults) {
                // Instead of deleting, deactivate the subject
                this.data.subjects[subjectIndex].status = 'inactive';
                this.data.subjects[subjectIndex].deactivatedAt = new Date().toISOString();
                this.data.subjects[subjectIndex].deactivatedBy = this.currentUser?.id || 'admin';
                this.saveData();
                this.showNotification('Subject deactivated (has associated results)', 'warning');
                return this.data.subjects[subjectIndex];
            }

            // Safe to delete
            const deletedSubject = this.data.subjects.splice(subjectIndex, 1)[0];
            this.saveData();
            this.showNotification('Subject deleted successfully!', 'success');
            return deletedSubject;
        } catch (error) {
            console.error('Error deleting subject:', error);
            this.showNotification('Error deleting subject: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Get unique classes from all students
     */
    getUniqueClasses() {
        try {
            const classes = [
                ...this.defaultClasses,
                ...this.data.students
                    .map(student => student.class)
                    .filter(className => className && className.trim() !== '')
            ];

            return [...new Set(classes.filter(Boolean))].sort(compareClassNames);
        } catch (error) {
            console.error('Error getting unique classes:', error);
            return [];
        }
    }

    /**
     * Get subject statistics
     */
    getSubjectStatistics() {
        try {
            const subjects = this.getAllSubjects();
            const teachers = this.getAllTeachers();
            const students = this.getAllStudents();

            const stats = {
                totalSubjects: subjects.length,
                activeSubjects: subjects.filter(s => s.status === 'active').length,
                inactiveSubjects: subjects.filter(s => s.status === 'inactive').length,
                subjectsWithoutTeacher: subjects.filter(s => !s.teacherId).length,
                totalCredits: subjects.reduce((sum, s) => sum + (s.credits || 0), 0),
                averageCredits: subjects.length > 0 ? subjects.reduce((sum, s) => sum + (s.credits || 0), 0) / subjects.length : 0,
                classesCovered: new Set(subjects.flatMap(s => s.classes)).size,
                teachersAssigned: new Set(subjects.filter(s => s.teacherId).map(s => s.teacherId)).size
            };

            return stats;
        } catch (error) {
            console.error('Error getting subject statistics:', error);
            return {};
        }
    }

    /**
     * Assign teacher to subject
     */
    assignTeacherToSubject(subjectCode, teacherId) {
        try {
            const subject = this.getSubjectByCode(subjectCode);
            if (!subject) {
                throw new Error('Subject not found');
            }

            const teacher = this.getAllTeachers().find(t => t.id === teacherId);
            if (!teacher) {
                throw new Error('Teacher not found');
            }

            return this.updateSubject(subjectCode, { teacherId });
        } catch (error) {
            console.error('Error assigning teacher to subject:', error);
            throw error;
        }
    }

    /**
     * Remove teacher from subject
     */
    removeTeacherFromSubject(subjectCode) {
        try {
            return this.updateSubject(subjectCode, { teacherId: null });
        } catch (error) {
            console.error('Error removing teacher from subject:', error);
            throw error;
        }
    }

    /**
     * Add class to subject
     */
    addClassToSubject(subjectCode, className) {
        try {
            const subject = this.getSubjectByCode(subjectCode);
            if (!subject) {
                throw new Error('Subject not found');
            }

            if (!subject.classes.includes(className)) {
                const updatedClasses = [...subject.classes, className];
                return this.updateSubject(subjectCode, { classes: updatedClasses });
            }

            return subject;
        } catch (error) {
            console.error('Error adding class to subject:', error);
            throw error;
        }
    }

    assignSubjectToClass(className, subjectCode) {
        try {
            return this.addClassToSubject(subjectCode, className);
        } catch (error) {
            console.error('Error assigning subject to class:', error);
            throw error;
        }
    }

    /**
     * Remove class from subject
     */
    removeClassFromSubject(subjectCode, className) {
        try {
            const subject = this.getSubjectByCode(subjectCode);
            if (!subject) {
                throw new Error('Subject not found');
            }

            const updatedClasses = subject.classes.filter(c => c !== className);
            return this.updateSubject(subjectCode, { classes: updatedClasses });
        } catch (error) {
            console.error('Error removing class from subject:', error);
            throw error;
        }
    }

    removeSubjectFromClass(className, subjectCode) {
        try {
            return this.removeClassFromSubject(subjectCode, className);
        } catch (error) {
            console.error('Error removing subject from class:', error);
            throw error;
        }
    }

    /**
     * Get teacher's subject load
     */
    getTeacherSubjectLoad(teacherId) {
        try {
            const subjects = this.getSubjectsByTeacher(teacherId);
            const totalCredits = subjects.reduce((sum, subject) => sum + (subject.credits || 0), 0);
            const totalClasses = new Set(subjects.flatMap(s => s.classes)).size;
            const students = this.getAllStudents();
            const totalStudents = students.filter(s => 
                subjects.some(subject => subject.classes.includes(s.class))
            ).length;

            return {
                subjects: subjects.length,
                totalCredits,
                totalClasses,
                totalStudents,
                subjectList: subjects
            };
        } catch (error) {
            console.error('Error getting teacher subject load:', error);
            return { subjects: 0, totalCredits: 0, totalClasses: 0, totalStudents: 0, subjectList: [] };
        }
    }

    // ============== RESULT MANAGEMENT METHODS ==============

    /**
     * Initialize comprehensive demo results data
     */
    initializeComprehensiveResultsData() {
        try {
            console.log('Initializing comprehensive results demo data...');
            
            const students = this.getAllStudents();
            const subjects = this.getAllSubjects();
            const sessions = this.getAvailableSessions();
            const terms = this.getAvailableTerms();
            
            this.data.results = [];
            
            // Generate comprehensive results for current session and term
            const currentSession = this.getActiveSession();
            const currentTerm = this.getCurrentTerm();
            
            students.forEach(student => {
                const classSubjects = subjects.filter(subject => 
                    subject.classes.includes(student.class) && subject.status === 'active'
                );
                
                classSubjects.forEach(subject => {
                    // Generate multiple assessments per subject
                    const assessments = [
                        { type: 'First CA', maxScore: 10, weight: 10 },
                        { type: 'Second CA', maxScore: 10, weight: 10 },
                        { type: 'Third CA', maxScore: 10, weight: 10 },
                        { type: 'Mid-term Exam', maxScore: 30, weight: 30 },
                        { type: 'Final Exam', maxScore: 40, weight: 40 }
                    ];
                    
                    assessments.forEach(assessment => {
                        // Generate realistic scores
                        let basePerformance = 0.7; // Default 70% performance
                        
                        // Adjust based on student class
                        if (student.class.includes('12')) basePerformance += 0.05;
                        else if (student.class.includes('11')) basePerformance += 0.03;
                        
                        // Add subject-specific variance
                        if (subject.code === 'MATH101') basePerformance += Math.random() * 0.1 - 0.05;
                        else if (subject.code === 'ENG105') basePerformance += Math.random() * 0.08 - 0.04;
                        
                        // Add random variance
                        const variance = (Math.random() - 0.5) * 0.3;
                        const performance = Math.max(0.2, Math.min(0.95, basePerformance + variance));
                        
                        const score = Math.round(assessment.maxScore * performance);
                        const percentage = Math.round((score / assessment.maxScore) * 100);
                        const grade = this.calculateGrade(score, assessment.maxScore);
                        
                        const result = {
                            id: this.generateId('results'),
                            studentId: student.id,
                            studentName: student.name,
                            studentClass: student.class,
                            subjectCode: subject.code,
                            subjectName: subject.name,
                            session: currentSession,
                            term: currentTerm,
                            assessmentType: assessment.type,
                            maxScore: assessment.maxScore,
                            score: score,
                            percentage: percentage,
                            grade: grade.letter,
                            gradePoint: grade.point,
                            remark: grade.remark,
                            weight: assessment.weight,
                            examDate: this.generateRandomDate(currentSession, currentTerm),
                            teacherId: subject.teacherId,
                            status: Math.random() > 0.1 ? 'published' : 'draft',
                            publishDate: Math.random() > 0.1 ? this.generateRandomDate(currentSession, currentTerm) : null,
                            createdAt: new Date().toISOString(),
                            createdBy: 'system',
                            updatedAt: new Date().toISOString(),
                            updatedBy: 'system'
                        };
                        
                        this.data.results.push(result);
                    });
                });
            });
            
            console.log(`Generated ${this.data.results.length} result records`);
            this.saveData();
        } catch (error) {
            console.error('Error initializing results data:', error);
        }
    }
    
    /**
     * Generate random date within session/term
     */
    generateRandomDate(session, term) {
        const currentYear = new Date().getFullYear();
        let startMonth, endMonth;
        
        switch (term) {
            case 'First Term':
                startMonth = 8; // September
                endMonth = 11;  // December
                break;
            case 'Second Term':
                startMonth = 0; // January
                endMonth = 3;   // April
                break;
            case 'Third Term':
                startMonth = 4; // May
                endMonth = 6;   // July
                break;
            default:
                startMonth = 0;
                endMonth = 11;
        }
        
        const startDate = new Date(currentYear, startMonth, 1);
        const endDate = new Date(currentYear, endMonth + 1, 0);
        const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
        
        return new Date(randomTime).toISOString().split('T')[0];
    }
    
    /**
     * Calculate grade based on score and max score
     */
    calculateGrade(score, maxScore) {
        const percentage = (score / maxScore) * 100;
        
        if (percentage >= 90) return { letter: 'A+', point: 4.0, remark: 'Excellent' };
        if (percentage >= 85) return { letter: 'A', point: 3.7, remark: 'Very Good' };
        if (percentage >= 80) return { letter: 'B+', point: 3.3, remark: 'Good' };
        if (percentage >= 75) return { letter: 'B', point: 3.0, remark: 'Above Average' };
        if (percentage >= 70) return { letter: 'C+', point: 2.7, remark: 'Average' };
        if (percentage >= 65) return { letter: 'C', point: 2.3, remark: 'Below Average' };
        if (percentage >= 60) return { letter: 'D+', point: 2.0, remark: 'Poor' };
        if (percentage >= 50) return { letter: 'D', point: 1.0, remark: 'Very Poor' };
        return { letter: 'F', point: 0.0, remark: 'Fail' };
    }

    /**
     * Get all results
     */
    getAllResults() {
        try {
            return this.data.results || [];
        } catch (error) {
            console.error('Error getting results:', error);
            return [];
        }
    }

    /**
     * Get results by student ID
     */
    getResultsByStudent(studentId, session = null, term = null) {
        try {
            let results = this.data.results.filter(result => result.studentId === studentId);
            
            if (session) {
                results = results.filter(result => result.session === session);
            }
            
            if (term) {
                results = results.filter(result => result.term === term);
            }
            
            return results;
        } catch (error) {
            console.error('Error getting results by student:', error);
            return [];
        }
    }

    /**
     * Get results by class
     */
    getResultsByClass(className, session = null, term = null, subjectCode = null) {
        try {
            let results = this.data.results.filter(result => result.studentClass === className);
            
            if (session) {
                results = results.filter(result => result.session === session);
            }
            
            if (term) {
                results = results.filter(result => result.term === term);
            }
            
            if (subjectCode) {
                results = results.filter(result => result.subjectCode === subjectCode);
            }
            
            return results;
        } catch (error) {
            console.error('Error getting results by class:', error);
            return [];
        }
    }

    /**
     * Create a new result
     */
    createResult(resultData) {
        try {
            // Validate required fields
            if (!resultData.studentId || !resultData.subjectCode || !resultData.assessmentType) {
                throw new Error('Student, subject, and assessment type are required');
            }

            // Get student and subject details
            const student = this.getStudentById(resultData.studentId);
            const subject = this.getSubjectByCode(resultData.subjectCode);
            
            if (!student) throw new Error('Student not found');
            if (!subject) throw new Error('Subject not found');

            // Calculate grade
            const percentage = Math.round((resultData.score / resultData.maxScore) * 100);
            const grade = this.calculateGrade(resultData.score, resultData.maxScore);

            // Create result object
            const result = {
                id: this.generateId('results'),
                studentId: resultData.studentId,
                studentName: student.name,
                studentClass: student.class,
                subjectCode: resultData.subjectCode,
                subjectName: subject.name,
                session: resultData.session || this.getActiveSession(),
                term: resultData.term || this.getCurrentTerm(),
                assessmentType: resultData.assessmentType,
                maxScore: parseInt(resultData.maxScore) || 100,
                score: parseInt(resultData.score) || 0,
                percentage: percentage,
                grade: grade.letter,
                gradePoint: grade.point,
                remark: grade.remark,
                weight: parseInt(resultData.weight) || 100,
                examDate: resultData.examDate || new Date().toISOString().split('T')[0],
                teacherId: subject.teacherId,
                status: resultData.status || 'draft',
                publishDate: resultData.status === 'published' ? new Date().toISOString().split('T')[0] : null,
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser?.id || 'admin',
                updatedAt: new Date().toISOString(),
                updatedBy: this.currentUser?.id || 'admin'
            };

            this.data.results.push(result);
            this.saveData();
            this.showNotification('Result created successfully!', 'success');
            return result;
        } catch (error) {
            console.error('Error creating result:', error);
            this.showNotification('Error creating result: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Update an existing result
     */
    updateResult(resultId, updateData) {
        try {
            const resultIndex = this.data.results.findIndex(r => r.id === resultId);
            if (resultIndex === -1) {
                throw new Error('Result not found');
            }

            const result = this.data.results[resultIndex];

            // If score or maxScore is being updated, recalculate grade
            if (updateData.score !== undefined || updateData.maxScore !== undefined) {
                const score = updateData.score !== undefined ? parseInt(updateData.score) : result.score;
                const maxScore = updateData.maxScore !== undefined ? parseInt(updateData.maxScore) : result.maxScore;
                const percentage = Math.round((score / maxScore) * 100);
                const grade = this.calculateGrade(score, maxScore);
                
                updateData.percentage = percentage;
                updateData.grade = grade.letter;
                updateData.gradePoint = grade.point;
                updateData.remark = grade.remark;
            }

            // Update publish date if status is being changed to published
            if (updateData.status === 'published' && result.status !== 'published') {
                updateData.publishDate = new Date().toISOString().split('T')[0];
            }

            // Update result
            Object.assign(result, {
                ...updateData,
                updatedAt: new Date().toISOString(),
                updatedBy: this.currentUser?.id || 'admin'
            });

            this.saveData();
            this.showNotification('Result updated successfully!', 'success');
            return result;
        } catch (error) {
            console.error('Error updating result:', error);
            this.showNotification('Error updating result: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Delete a result
     */
    deleteResult(resultId) {
        try {
            const resultIndex = this.data.results.findIndex(r => r.id === resultId);
            if (resultIndex === -1) {
                throw new Error('Result not found');
            }

            const deletedResult = this.data.results.splice(resultIndex, 1)[0];
            this.saveData();
            this.showNotification('Result deleted successfully!', 'success');
            return deletedResult;
        } catch (error) {
            console.error('Error deleting result:', error);
            this.showNotification('Error deleting result: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Get result statistics
     */
    getResultStatistics(session = null, term = null) {
        try {
            let results = this.getAllResults();
            
            if (session) {
                results = results.filter(r => r.session === session);
            }
            
            if (term) {
                results = results.filter(r => r.term === term);
            }

            const stats = {
                totalResults: results.length,
                publishedResults: results.filter(r => r.status === 'published').length,
                draftResults: results.filter(r => r.status === 'draft').length,
                averageScore: results.length > 0 ? 
                    Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0,
                gradeDistribution: {
                    'A+': results.filter(r => r.grade === 'A+').length,
                    'A': results.filter(r => r.grade === 'A').length,
                    'B+': results.filter(r => r.grade === 'B+').length,
                    'B': results.filter(r => r.grade === 'B').length,
                    'C+': results.filter(r => r.grade === 'C+').length,
                    'C': results.filter(r => r.grade === 'C').length,
                    'D+': results.filter(r => r.grade === 'D+').length,
                    'D': results.filter(r => r.grade === 'D').length,
                    'F': results.filter(r => r.grade === 'F').length
                }
            };

            return stats;
        } catch (error) {
            console.error('Error getting result statistics:', error);
            return {};
        }
    }
}

// Initialize the application
const eduManageApp = new EduManageApp();

// Export for global access
window.eduManageApp = eduManageApp;
window.app = eduManageApp;