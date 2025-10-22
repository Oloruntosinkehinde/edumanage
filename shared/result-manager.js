/**
 * Result Management System
 * Handles all result calculations, data operations, and academic performance tracking
 * Author: Tophill Portal System
 * Version: 2.0.0 (Optimized)
 */

class ResultManager {
    constructor() {
        // Core data storage
        this.resultData = {};
        
        // Configuration objects
        this.scoringConfig = {
            ca: 10,
            test: 20,
            exam: 70,
            total: 100,
            passMark: 40
        };
        
        this.gradingScale = {
            'A+': 90, 'A': 80, 'B+': 70, 'B': 60,
            'C+': 50, 'C': 40, 'D': 35, 'F': 0
        };

        this.gradingRemarks = {
            'A+': 'Outstanding performance',
            'A': 'Excellent performance',
            'B+': 'Very good result',
            'B': 'Good effort',
            'C+': 'Fair performance',
            'C': 'Needs improvement',
            'D': 'At risk',
            'F': 'Fail'
        };

        this.scoringConfigByPeriod = {};
        this.gradingScaleByPeriod = {};
        this.studentQuickScores = {};
        
        // Subject and academic period management
        this.classSubjects = {};
        this.academicSessions = ['2024/2025', '2023/2024', '2025/2026'];
        this.academicTerms = ['1st Term', '2nd Term', '3rd Term'];
        this.currentSession = '2024/2025';
        this.currentTerm = '1st Term';
        
        // Cache system for improved performance
        this.cache = {
            classSummaries: {},
            studentResults: {},
            classBenchmarks: {},
            classResults: {}
        };
        
        // Initialize with default data
        this.initializeDefaultData();
    }

    /**
     * Initialize default class-subject mappings and demo data
     */
    initializeDefaultData() {
        // Define class-subject mappings
        this.classSubjects = {
            'JSS 1A': ['MTH101', 'ENG101', 'PHY101', 'CHM101', 'BIO101', 'CIV101', 'GEO101', 'HIS101'],
            'JSS 1B': ['MTH101', 'ENG101', 'PHY101', 'CHM101', 'BIO101', 'CIV101', 'GEO101', 'HIS101'],
            'JSS 2A': ['MTH201', 'ENG201', 'PHY201', 'CHM201', 'BIO201', 'CIV201', 'GEO201', 'HIS201'],
            'JSS 2B': ['MTH201', 'ENG201', 'PHY201', 'CHM201', 'BIO201', 'CIV201', 'GEO201', 'HIS201'],
            'JSS 3A': ['MTH301', 'ENG301', 'PHY301', 'CHM301', 'BIO301', 'CIV301', 'GEO301', 'HIS301'],
            'JSS 3B': ['MTH301', 'ENG301', 'PHY301', 'CHM301', 'BIO301', 'CIV301', 'GEO301', 'HIS301'],
            'SS 1A': ['MTH401', 'ENG401', 'PHY401', 'CHM401', 'BIO401', 'ECO401', 'GOV401', 'LIT401'],
            'SS 1B': ['MTH401', 'ENG401', 'PHY401', 'CHM401', 'BIO401', 'ECO401', 'GOV401', 'LIT401'],
            'SS 2A': ['MTH501', 'ENG501', 'PHY501', 'CHM501', 'BIO501', 'ECO501', 'GOV501', 'LIT501'],
            'SS 2B': ['MTH501', 'ENG501', 'PHY501', 'CHM501', 'BIO501', 'ECO501', 'GOV501', 'LIT501'],
            'SS 3A': ['MTH601', 'ENG601', 'PHY601', 'CHM601', 'BIO601', 'ECO601', 'GOV601', 'LIT601'],
            'SS 3B': ['MTH601', 'ENG601', 'PHY601', 'CHM601', 'BIO601', 'ECO601', 'GOV601', 'LIT601']
        };

        // Generate demo results using Web Workers if available
        if (typeof Worker !== 'undefined' && typeof window !== 'undefined') {
            this._generateDemoResultsAsync();
        } else {
            // Fallback to synchronous generation
            this._generateDemoResults();
        }
    }

    /**
     * Generate demo results asynchronously using Web Workers
     * @private
     */
    _generateDemoResultsAsync() {
        // Initialize empty structure to prevent errors during async generation
        this.resultData = {};
        this.academicTerms.forEach(term => {
            this.resultData[term] = {};
            this.academicSessions.forEach(session => {
                this.resultData[term][session] = {};
            });
        });
        
        // In a real implementation, this would use a Web Worker
        setTimeout(() => this._generateDemoResults(), 0);
    }

    /**
     * Generate realistic demo results for all students
     * @private
     */
    _generateDemoResults() {
        console.time('generateDemoResults');
        this.resultData = {};
        
        // Create data structure with improved batch processing
        const batchSize = 2; // Process two terms at once
        for (let i = 0; i < this.academicTerms.length; i += batchSize) {
            const termBatch = this.academicTerms.slice(i, i + batchSize);
            
            termBatch.forEach(term => {
                this.resultData[term] = {};
                
                this.academicSessions.forEach(session => {
                    this.resultData[term][session] = {};
                    
                    // Process classes in batches
                    const classes = Object.keys(this.classSubjects);
                    for (let j = 0; j < classes.length; j++) {
                        const className = classes[j];
                        this.resultData[term][session][className] = {};
                        
                        // Get students for this class
                        const classStudents = this.getStudentsByClass(className);
                        
                        classStudents.forEach(student => {
                            this.resultData[term][session][className][student.id] = {};
                            
                            // Use performance patterns to generate consistent results
                            const studentPerformancePattern = this._getStudentPerformancePattern(student.id);
                            
                            this.classSubjects[className].forEach(subjectCode => {
                                // Generate realistic scores based on student performance patterns
                                const performance = this._generateStudentPerformance(
                                    student.id, 
                                    subjectCode, 
                                    studentPerformancePattern
                                );
                                
                                this.resultData[term][session][className][student.id][subjectCode] = {
                                    ca: performance.ca,
                                    test: performance.test,
                                    exam: performance.exam,
                                    total: performance.total,
                                    grade: this.calculateGrade(performance.total),
                                    percentage: this.calculatePercentage(performance.total),
                                    remark: this.generateRemark(performance.total),
                                    lastUpdated: new Date().toISOString()
                                };
                            });
                        });
                        
                        // Calculate class positions after all results are generated
                        this.calculateClassPositions(term, session, className);
                    }
                });
            });
        }
        console.timeEnd('generateDemoResults');
    }

    /**
     * Get consistent performance pattern for a student
     * @private
     */
    _getStudentPerformancePattern(studentId) {
        // Create a consistent performance level based on student ID
        const studentHash = this._hashCode(studentId);
        const performanceLevel = studentHash % 5; // 0-4 performance levels
        
        switch (performanceLevel) {
            case 0: // Excellent student
                return { ca: 0.8, test: 0.85, exam: 0.9 };
            case 1: // Good student
                return { ca: 0.7, test: 0.75, exam: 0.8 };
            case 2: // Average student
                return { ca: 0.6, test: 0.65, exam: 0.7 };
            case 3: // Below average student
                return { ca: 0.5, test: 0.55, exam: 0.6 };
            default: // Struggling student
                return { ca: 0.4, test: 0.45, exam: 0.5 };
        }
    }

    /**
     * Generate realistic performance data for a student in a subject
     * @private
     */
    _generateStudentPerformance(studentId, subjectCode, basePerformance) {
        // Add subject-specific variance
        const subjectHash = this._hashCode(subjectCode);
        const subjectFactor = ((subjectHash % 20) - 10) / 100; // -0.1 to 0.1 adjustment
        
        // Apply subject factor to base performance
        const adjusted = {
            ca: Math.min(1, Math.max(0, basePerformance.ca + subjectFactor)),
            test: Math.min(1, Math.max(0, basePerformance.test + subjectFactor)),
            exam: Math.min(1, Math.max(0, basePerformance.exam + subjectFactor))
        };
        
        // Add randomness (±10%)
        const variance = 0.1;
        const ca = Math.round(this.scoringConfig.ca * adjusted.ca * (1 + (Math.random() - 0.5) * variance));
        const test = Math.round(this.scoringConfig.test * adjusted.test * (1 + (Math.random() - 0.5) * variance));
        const exam = Math.round(this.scoringConfig.exam * adjusted.exam * (1 + (Math.random() - 0.5) * variance));
        
        // Ensure values are within valid ranges
        return {
            ca: Math.max(0, Math.min(this.scoringConfig.ca, ca)),
            test: Math.max(0, Math.min(this.scoringConfig.test, test)),
            exam: Math.max(0, Math.min(this.scoringConfig.exam, exam)),
            total: Math.max(0, Math.min(this.scoringConfig.total, ca + test + exam))
        };
    }

    /**
     * Optimized hash function for consistent randomization
     * @private
     */
    _hashCode(str) {
        if (!str) return 0;
        
        // Use a faster hashing algorithm (FNV-1a)
        let hash = 2166136261; // FNV offset basis
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return Math.abs(hash >>> 0); // Convert to unsigned 32-bit integer
    }

    /**
     * Get students by class from the app
     * With caching for improved performance
     */
    getStudentsByClass(className) {
        // Cache key for this request
        const cacheKey = `students_${className}`;
        
        // Check if we have cached data
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }
        
        // Get data from app and cache it
        let students = [];
        if (typeof app !== 'undefined' && app.getAllStudents) {
            students = app.getAllStudents().filter(s => s.class === className);
            
            // Cache the result for future use
            this.cache[cacheKey] = students;
        }
        
        return students;
    }

    _getPeriodKey(session, term) {
        const sessionToUse = session || this.currentSession;
        const termToUse = term || this.currentTerm;
        return `${sessionToUse || 'default'}__${termToUse || 'default'}`;
    }

    _getClassResultCacheKey(className, term, session) {
        return `class_results_${className}_${term}_${session}`;
    }

    _getQuickEntryContainer(session, term, className) {
        const periodKey = this._getPeriodKey(session, term);
        if (!this.studentQuickScores[periodKey]) {
            this.studentQuickScores[periodKey] = {};
        }
        if (!this.studentQuickScores[periodKey][className]) {
            this.studentQuickScores[periodKey][className] = {};
        }
        return this.studentQuickScores[periodKey][className];
    }

    _getStudentProfile(studentId) {
        if (typeof app !== 'undefined' && app?.getStudentById) {
            return app.getStudentById(studentId);
        }
        if (typeof window !== 'undefined' && window.app?.getStudentById) {
            return window.app.getStudentById(studentId);
        }
        return null;
    }

    _normalizeScoringConfig(newConfig = {}) {
        const payload = newConfig || {};
        const base = this.scoringConfig || { ca: 0, test: 0, exam: 0, total: 100, passMark: 40 };
        const hasWeightFields = ['caWeight', 'examWeight', 'testWeight'].some((key) => key in payload);

        const safeNumber = (value, fallback = 0) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? Math.max(0, parsed) : Math.max(0, Number(fallback) || 0);
        };

        const ca = hasWeightFields
            ? safeNumber(payload.caWeight ?? payload.ca, base.ca)
            : safeNumber(payload.ca, base.ca);

        const exam = hasWeightFields
            ? safeNumber(payload.examWeight ?? payload.exam, base.exam)
            : safeNumber(payload.exam, base.exam);

        const testDefault = hasWeightFields ? 0 : base.test;
        const test = safeNumber(payload.testWeight ?? payload.test, testDefault);

        let total = safeNumber(payload.total, 0);
        if (total <= 0) {
            total = ca + test + exam;
        }

        if (total <= 0) {
            return {
                success: false,
                message: 'Total score must be greater than 0'
            };
        }

        const passMark = safeNumber(payload.passMark, base.passMark ?? 40);

        return {
            success: true,
            config: {
                ca,
                test,
                exam,
                total,
                passMark
            },
            gradingScale: Array.isArray(payload.gradingScale) ? payload.gradingScale : null
        };
    }

    _normalizeGradingScale(newScale) {
        if (!newScale) {
            return null;
        }

        const gradeOrder = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
        const thresholds = {};
        const remarks = {};

        if (Array.isArray(newScale)) {
            newScale
                .filter((entry) => entry && entry.grade !== undefined)
                .forEach((entry) => {
                    const grade = String(entry.grade).toUpperCase();
                    const minValue = Number(entry.min ?? entry.minimum ?? entry.score ?? 0);
                    if (!Number.isFinite(minValue)) {
                        return;
                    }
                    thresholds[grade] = Math.max(0, Math.round(minValue));
                    if (entry.remark) {
                        remarks[grade] = entry.remark;
                    }
                });
        } else if (typeof newScale === 'object') {
            Object.entries(newScale).forEach(([grade, value]) => {
                thresholds[String(grade)] = Math.max(0, Math.round(Number(value) || 0));
            });
        }

        gradeOrder.forEach((grade) => {
            if (thresholds[grade] === undefined) {
                thresholds[grade] = grade === 'F' ? 0 : this.gradingScale[grade] ?? 0;
            }
            if (remarks[grade] === undefined && this.gradingRemarks[grade]) {
                remarks[grade] = this.gradingRemarks[grade];
            }
        });

        thresholds['F'] = 0;

        return { thresholds, remarks };
    }

    getGradingScale(session = null, term = null) {
        if (session || term) {
            const periodKey = this._getPeriodKey(session, term);
            const periodScale = this.gradingScaleByPeriod[periodKey];
            if (periodScale?.thresholds) {
                return periodScale.thresholds;
            }
        }
        return this.gradingScale;
    }

    getGradingRemarks(session = null, term = null) {
        const base = { ...this.gradingRemarks };
        if (session || term) {
            const periodKey = this._getPeriodKey(session, term);
            const periodScale = this.gradingScaleByPeriod[periodKey];
            if (periodScale?.remarks) {
                return { ...base, ...periodScale.remarks };
            }
        }
        return base;
    }

    getScoringConfig(session = null, term = null) {
        if (session || term) {
            const periodKey = this._getPeriodKey(session, term);
            if (this.scoringConfigByPeriod[periodKey]) {
                const scoped = { ...this.scoringConfigByPeriod[periodKey] };
                return {
                    ...scoped,
                    caWeight: scoped.ca,
                    examWeight: scoped.exam,
                    testWeight: scoped.test,
                    gradingScale: this.getDefaultGradingScale(session, term)
                };
            }
        }
        const base = { ...this.scoringConfig };
        return {
            ...base,
            caWeight: base.ca,
            examWeight: base.exam,
            testWeight: base.test,
            gradingScale: this.getDefaultGradingScale()
        };
    }

    getDefaultGradingScale(session = null, term = null) {
        const gradeOrder = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
        const thresholds = this.getGradingScale(session, term);
        const remarks = this.getGradingRemarks(session, term);

        const result = [];

        gradeOrder.forEach((grade, index) => {
            if (thresholds[grade] === undefined) {
                return;
            }

            const currentMin = thresholds[grade];
            const previousGrade = gradeOrder[index - 1];
            const previousMin = previousGrade ? thresholds[previousGrade] : null;
            const max = previousMin !== null && previousMin !== undefined ? Math.max(previousMin - 1, currentMin) : 100;

            result.push({
                grade,
                min: currentMin,
                max,
                remark: remarks[grade] || ''
            });
        });

        return result;
    }

    /**
     * Calculate grade based on total score
     */
    calculateGrade(total, session = null, term = null) {
        const percentage = this.calculatePercentage(total);
        const scale = this.getGradingScale(session, term) || this.gradingScale;

        const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];

        for (const grade of grades) {
            const minimum = scale?.[grade];
            if (minimum === undefined) {
                continue;
            }
            if (percentage >= minimum) {
                return grade;
            }
        }

        return 'F';
    }

    /**
     * Calculate percentage from total score
     * Memoized for performance
     */
    calculatePercentage(total) {
        // Cache key for this calculation
        const cacheKey = `percentage_${total}_${this.scoringConfig.total}`;
        
        // Check if we have cached result
        if (this.cache[cacheKey] !== undefined) {
            return this.cache[cacheKey];
        }
        
        // Calculate and cache the result
        const percentage = Math.round((total / this.scoringConfig.total) * 100);
        this.cache[cacheKey] = percentage;
        
        return percentage;
    }

    /**
     * Generate performance remark based on percentage
     * With caching for improved performance
     */
    generateRemark(total) {
        const percentage = this.calculatePercentage(total);
        
        // Cache key for this request
        const cacheKey = `remark_${percentage}`;
        
        // Check if we have cached data
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }
        
        let remark;
        if (percentage >= 90) remark = 'Excellent performance! Keep it up.';
        else if (percentage >= 80) remark = 'Very good work. Well done!';
        else if (percentage >= 70) remark = 'Good performance. You can do better.';
        else if (percentage >= 60) remark = 'Satisfactory. More effort needed.';
        else if (percentage >= 50) remark = 'Fair performance. Needs improvement.';
        else if (percentage >= 40) remark = 'Below average. Requires serious attention.';
        else if (percentage >= 35) remark = 'Poor performance. Needs intensive support.';
        else remark = 'Very poor. Immediate intervention required.';
        
        // Cache the result
        this.cache[cacheKey] = remark;
        
        return remark;
    }

    /**
     * Calculate class positions for all students
     * Optimized for performance
     */
    calculateClassPositions(term, session, className) {
        const classResults = this.resultData[term]?.[session]?.[className];
        if (!classResults) return;
        
        const subjects = this.classSubjects[className] || [];
        if (subjects.length === 0) return;
        
        const students = Object.keys(classResults);
        if (students.length === 0) return;
        
        // Pre-calculate totals for better performance
        const studentTotals = new Map();
        
        students.forEach(studentId => {
            const totalScore = subjects.reduce((sum, subjectCode) => {
                return sum + (classResults[studentId][subjectCode]?.total || 0);
            }, 0);
            
            studentTotals.set(studentId, {
                totalScore,
                subjectCount: subjects.length,
                average: subjects.length > 0 ? totalScore / subjects.length : 0
            });
        });
        
        // Sort by total score (descending)
        const rankedStudents = [...studentTotals.entries()].sort((a, b) => b[1].totalScore - a[1].totalScore);
        
        // Assign positions (handle ties correctly)
        let currentPosition = 1;
        let currentScore = -1;
        let samePositionCount = 0;
        
        rankedStudents.forEach(([studentId, stats], index) => {
            // Handle ties (same score = same position)
            if (stats.totalScore !== currentScore) {
                currentPosition = index + 1;
                currentScore = stats.totalScore;
                samePositionCount = 0;
            } else {
                samePositionCount++;
            }
            
            subjects.forEach(subjectCode => {
                if (classResults[studentId]?.[subjectCode]) {
                    const result = classResults[studentId][subjectCode];
                    result.position = currentPosition;
                    result.totalClassScore = stats.totalScore;
                    result.classAverage = stats.average.toFixed(1);
                    
                    // Add percentile rank (useful for analytics)
                    result.percentile = Math.round(((students.length - currentPosition + 1) / students.length) * 100);
                }
            });
        });
        
        // Cache class statistics for quick access
        this._cacheClassStatistics(term, session, className, rankedStudents);
    }

    /**
     * Cache class statistics for improved performance
     * @private
     */
    _cacheClassStatistics(term, session, className, rankedStudents) {
        const cacheKey = `class_stats_${term}_${session}_${className}`;
        
        const highestScore = rankedStudents.length > 0 ? rankedStudents[0][1].totalScore : 0;
        const lowestScore = rankedStudents.length > 0 ? 
            rankedStudents[rankedStudents.length - 1][1].totalScore : 0;
        
        const totalScore = rankedStudents.reduce((sum, [, stats]) => sum + stats.totalScore, 0);
        const averageScore = rankedStudents.length > 0 ? totalScore / rankedStudents.length : 0;
        
        this.cache[cacheKey] = {
            highestScore,
            lowestScore,
            averageScore: Math.round(averageScore * 10) / 10,
            studentCount: rankedStudents.length,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Invalidate all caches
     */
    invalidateAllCaches() {
        this.cache = {
            classSummaries: {},
            studentResults: {},
            classBenchmarks: {},
            classResults: {}
        };
    }

    /**
     * Get student results for a specific term, session, and class
     * With caching for improved performance
     */
    getStudentResults(studentId, className, term = null, session = null) {
        const termToUse = term || this.currentTerm;
        const sessionToUse = session || this.currentSession;
        
        // Cache key for this request
        const cacheKey = `results_${studentId}_${className}_${termToUse}_${sessionToUse}`;
        
        // Check if we have cached data that's not stale
        if (this.cache.studentResults[cacheKey]) {
            return this.cache.studentResults[cacheKey];
        }
        
        if (!this.resultData[termToUse] || 
            !this.resultData[termToUse][sessionToUse] || 
            !this.resultData[termToUse][sessionToUse][className] || 
            !this.resultData[termToUse][sessionToUse][className][studentId]) {
            return {};
        }
        
        // Get and cache the result
        const results = this.resultData[termToUse][sessionToUse][className][studentId];
        this.cache.studentResults[cacheKey] = results;
        
        return results;
    }

    /**
     * Update student result for a specific subject
     * With cache invalidation
     */
    updateStudentResult(studentId, className, subjectCode, scores, term = null, session = null) {
        const termToUse = term || this.currentTerm;
        const sessionToUse = session || this.currentSession;
        
        // Initialize structure if it doesn't exist
        if (!this.resultData[termToUse]) this.resultData[termToUse] = {};
        if (!this.resultData[termToUse][sessionToUse]) this.resultData[termToUse][sessionToUse] = {};
        if (!this.resultData[termToUse][sessionToUse][className]) this.resultData[termToUse][sessionToUse][className] = {};
        if (!this.resultData[termToUse][sessionToUse][className][studentId]) this.resultData[termToUse][sessionToUse][className][studentId] = {};
        
        // Validate scores
        const ca = Math.max(0, Math.min(this.scoringConfig.ca, parseInt(scores.ca) || 0));
        const test = Math.max(0, Math.min(this.scoringConfig.test, parseInt(scores.test) || 0));
        const exam = Math.max(0, Math.min(this.scoringConfig.exam, parseInt(scores.exam) || 0));
        const total = ca + test + exam;
        
        // Update result
        this.resultData[termToUse][sessionToUse][className][studentId][subjectCode] = {
            ca,
            test,
            exam,
            total,
            grade: this.calculateGrade(total),
            percentage: this.calculatePercentage(total),
            remark: this.generateRemark(total),
            lastUpdated: new Date().toISOString()
        };
        
        // Invalidate relevant caches
        this._invalidateStudentCache(studentId, className, termToUse, sessionToUse);
        this._invalidateClassCache(className, termToUse, sessionToUse);
        
        // Recalculate positions for the class
        this.calculateClassPositions(termToUse, sessionToUse, className);
        
        return {
            success: true,
            message: 'Result updated successfully',
            result: this.resultData[termToUse][sessionToUse][className][studentId][subjectCode]
        };
    }

    deleteStudentResult(studentId, className, subjectCode, term = null, session = null) {
        const termToUse = term || this.currentTerm;
        const sessionToUse = session || this.currentSession;

        if (!this.resultData?.[termToUse]?.[sessionToUse]?.[className]?.[studentId]?.[subjectCode]) {
            return {
                success: false,
                message: 'Result not found'
            };
        }

        delete this.resultData[termToUse][sessionToUse][className][studentId][subjectCode];

        const studentSubjects = this.resultData[termToUse][sessionToUse][className][studentId];
        if (studentSubjects && Object.keys(studentSubjects).length === 0) {
            delete this.resultData[termToUse][sessionToUse][className][studentId];
        }

        const classStudents = this.resultData[termToUse][sessionToUse][className];
        if (classStudents && Object.keys(classStudents).length === 0) {
            delete this.resultData[termToUse][sessionToUse][className];
        }

        const sessionClasses = this.resultData[termToUse][sessionToUse];
        if (sessionClasses && Object.keys(sessionClasses).length === 0) {
            delete this.resultData[termToUse][sessionToUse];
        }

        const termSessions = this.resultData[termToUse];
        if (termSessions && Object.keys(termSessions).length === 0) {
            delete this.resultData[termToUse];
        }

        const periodKey = this._getPeriodKey(sessionToUse, termToUse);
        const quickEntries = this.studentQuickScores?.[periodKey]?.[className];
        if (quickEntries && quickEntries[studentId]) {
            delete quickEntries[studentId];
        }

        this._invalidateStudentCache(studentId, className, termToUse, sessionToUse);
        this._invalidateClassCache(className, termToUse, sessionToUse);
        this.calculateClassPositions(termToUse, sessionToUse, className);

        return {
            success: true,
            message: 'Result removed successfully'
        };
    }

    saveStudentScore({ studentId, className, session = null, term = null, scores = {} }) {
        if (!studentId || !className) {
            return {
                success: false,
                message: 'Student ID and class name are required'
            };
        }

        const termToUse = term || this.currentTerm;
        const sessionToUse = session || this.currentSession;
        const config = this.getScoringConfig(sessionToUse, termToUse);

        const clamp = (value, max) => {
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) {
                return 0;
            }
            return Math.max(0, Math.min(Number(max ?? 100), numeric));
        };

        const ca = clamp(scores.ca, config.ca);
        const test = clamp(scores.test, config.test);
        const exam = clamp(scores.exam, config.exam);
        const total = ca + test + exam;
        const average = total;
        const grade = this.calculateGrade(average, sessionToUse, termToUse);

        const container = this._getQuickEntryContainer(sessionToUse, termToUse, className);
        container[studentId] = {
            studentId,
            studentName: scores.studentName || this._getStudentProfile(studentId)?.name || studentId,
            ca,
            test,
            exam,
            total,
            average,
            grade,
            status: 'Captured',
            lastUpdated: new Date().toISOString()
        };

        this._invalidateStudentCache(studentId, className, termToUse, sessionToUse);
        this._invalidateClassCache(className, termToUse, sessionToUse);

        return {
            success: true,
            studentId,
            className,
            session: sessionToUse,
            term: termToUse,
            data: container[studentId]
        };
    }

    /**
     * Invalidate caches for a specific student
     * @private
     */
    _invalidateStudentCache(studentId, className, term, session) {
        // Clear specific student result cache
        const resultCacheKey = `results_${studentId}_${className}_${term}_${session}`;
        delete this.cache.studentResults[resultCacheKey];
        
        // Clear student result sheet cache
        const sheetCacheKey = `sheet_${studentId}_${className}_${term}_${session}`;
        delete this.cache.studentResults[sheetCacheKey];
    }

    /**
     * Invalidate caches for a class
     * @private
     */
    _invalidateClassCache(className, term, session) {
        // Clear class summary cache
        const summaryCacheKey = `summary_${className}_${term}_${session}`;
        delete this.cache.classSummaries[summaryCacheKey];
        
        // Clear class statistics cache
        const statsCacheKey = `class_stats_${term}_${session}_${className}`;
        delete this.cache[statsCacheKey];

        if (this.cache.classResults) {
            const resultsCacheKey = this._getClassResultCacheKey(className, term, session);
            delete this.cache.classResults[resultsCacheKey];
        }
    }

    /**
     * Bulk update results for multiple students
     * Optimized with batch processing and parallel updates where available
     */
    bulkUpdateResults(className, subjectCode, studentsScores, term = null, session = null) {
        const termToUse = term || this.currentTerm;
        const sessionToUse = session || this.currentSession;
        
        let successCount = 0;
        const errors = [];
        const batchSize = 50; // Process in batches of 50 students
        
        // Process in batches to avoid UI freezing with large datasets
        for (let i = 0; i < studentsScores.length; i += batchSize) {
            const batch = studentsScores.slice(i, i + batchSize);
            
            batch.forEach(studentScore => {
                try {
                    const result = this.updateStudentResult(
                        studentScore.studentId, 
                        className, 
                        subjectCode, 
                        studentScore.scores, 
                        termToUse, 
                        sessionToUse
                    );
                    
                    if (result.success) {
                        successCount++;
                    } else {
                        errors.push(`${studentScore.studentId}: ${result.message}`);
                    }
                } catch (error) {
                    errors.push(`${studentScore.studentId}: ${error.message}`);
                }
            });
        }
        
        // We only need to calculate class positions once after all updates
        this.calculateClassPositions(termToUse, sessionToUse, className);
        
        return {
            success: errors.length === 0,
            successCount,
            totalCount: studentsScores.length,
            errors,
            message: `Updated ${successCount} out of ${studentsScores.length} results`
        };
    }

    /**
     * Get class performance summary
     * With caching for improved performance
     */
    getClassSummary(className, term = null, session = null) {
        const termToUse = term || this.currentTerm;
        const sessionToUse = session || this.currentSession;
        
        // Cache key for this request
        const cacheKey = `summary_${className}_${termToUse}_${sessionToUse}`;
        
        // Check if we have cached data
        if (this.cache.classSummaries[cacheKey]) {
            return this.cache.classSummaries[cacheKey];
        }
        
        const classResults = this.resultData[termToUse]?.[sessionToUse]?.[className] || {};
        const subjects = this.classSubjects[className] || [];
        const students = Object.keys(classResults);
        
        if (students.length === 0) {
            const emptySummary = {
                className,
                term: termToUse,
                session: sessionToUse,
                totalStudents: 0,
                totalSubjects: subjects.length,
                subjectSummaries: [],
                overallAverage: 0,
                gradeDistribution: {}
            };
            
            this.cache.classSummaries[cacheKey] = emptySummary;
            return emptySummary;
        }
        
        // Process subject summaries using reduce for better performance
        const subjectSummaries = subjects.map(subjectCode => {
            // Get all scores for this subject
            const subjectResults = students.map(studentId => ({
                score: classResults[studentId][subjectCode]?.total || 0,
                grade: classResults[studentId][subjectCode]?.grade || 'F'
            })).filter(result => result.score > 0);
            
            // Calculate statistics
            const stats = subjectResults.reduce((acc, result) => {
                acc.total += result.score;
                acc.gradeCount[result.grade] = (acc.gradeCount[result.grade] || 0) + 1;
                return acc;
            }, { 
                total: 0, 
                gradeCount: { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0 } 
            });
            
            const scores = subjectResults.map(r => r.score);
            
            return {
                subjectCode,
                average: subjectResults.length > 0 ? Math.round((stats.total / subjectResults.length) * 100) / 100 : 0,
                highest: scores.length > 0 ? Math.max(...scores) : 0,
                lowest: scores.length > 0 ? Math.min(...scores) : 0,
                totalStudents: subjectResults.length,
                gradeDistribution: stats.gradeCount
            };
        });
        
        // Calculate overall statistics
        const overallStats = students.reduce((acc, studentId) => {
            subjects.forEach(subjectCode => {
                const result = classResults[studentId][subjectCode];
                if (result) {
                    acc.scores.push(result.total);
                    acc.gradeCount[result.grade] = (acc.gradeCount[result.grade] || 0) + 1;
                }
            });
            return acc;
        }, { 
            scores: [], 
            gradeCount: { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0 } 
        });
        
        const overallAverage = overallStats.scores.length > 0 ? 
            overallStats.scores.reduce((sum, score) => sum + score, 0) / overallStats.scores.length : 0;
        
        // Create summary object
        const summary = {
            className,
            term: termToUse,
            session: sessionToUse,
            totalStudents: students.length,
            totalSubjects: subjects.length,
            subjectSummaries,
            overallAverage: Math.round(overallAverage * 100) / 100,
            gradeDistribution: overallStats.gradeCount,
            generatedAt: new Date().toISOString()
        };
        
        // Cache the result
        this.cache.classSummaries[cacheKey] = summary;
        
        return summary;
    }

    getSummaryStatistics(session = null, term = null) {
        const termToUse = term || this.currentTerm;
        const sessionToUse = session || this.currentSession;

        const totalSet = new Set();
        const submittedSet = new Set();
        let cumulativeAverage = 0;

        const classData = this.resultData[termToUse]?.[sessionToUse] || {};

        Object.entries(classData).forEach(([className, students]) => {
            Object.entries(students || {}).forEach(([studentId, subjects]) => {
                const key = `${className}:${studentId}`;
                totalSet.add(key);

                const subjectEntries = Object.values(subjects || {});
                if (!subjectEntries.length) {
                    return;
                }

                submittedSet.add(key);
                const totalScore = subjectEntries.reduce((sum, subject) => sum + (subject.total || 0), 0);
                const average = subjectEntries.length > 0 ? totalScore / subjectEntries.length : 0;
                cumulativeAverage += average;
            });
        });

        const quickEntriesByClass = this.studentQuickScores[this._getPeriodKey(sessionToUse, termToUse)] || {};
        Object.entries(quickEntriesByClass).forEach(([className, students]) => {
            Object.values(students || {}).forEach((entry) => {
                const key = `${className}:${entry.studentId}`;
                totalSet.add(key);
                if (!submittedSet.has(key)) {
                    submittedSet.add(key);
                    const aggregate = entry.average ?? entry.total ?? (entry.ca || 0) + (entry.test || 0) + (entry.exam || 0);
                    cumulativeAverage += Number(aggregate) || 0;
                }
            });
        });

        const totalStudents = totalSet.size;
        const resultsSubmitted = submittedSet.size;
        const averageScore = resultsSubmitted > 0 ? cumulativeAverage / resultsSubmitted : 0;

        return {
            session: sessionToUse,
            term: termToUse,
            totalStudents,
            resultsSubmitted,
            averageScore: Number(averageScore.toFixed(1)),
            outstanding: Math.max(totalStudents - resultsSubmitted, 0)
        };
    }

    getClassResults(className, session = null, term = null) {
        if (!className) {
            return [];
        }

        const termToUse = term || this.currentTerm;
        const sessionToUse = session || this.currentSession;
        const cacheKey = this._getClassResultCacheKey(className, termToUse, sessionToUse);

        if (this.cache.classResults?.[cacheKey]) {
            return this.cache.classResults[cacheKey];
        }

        const round = (value) => Number(Number(value ?? 0).toFixed(1));
        const classData = this.resultData[termToUse]?.[sessionToUse]?.[className] || {};
        const subjectList = this.classSubjects[className] || [];
        const resultsMap = new Map();

        Object.entries(classData).forEach(([studentId, subjectScores]) => {
            const subjects = Object.values(subjectScores || {});
            const metrics = subjects.reduce(
                (acc, subject) => {
                    acc.total += subject.total || 0;
                    acc.ca += subject.ca || 0;
                    acc.test += subject.test || 0;
                    acc.exam += subject.exam || 0;
                    acc.count += 1;
                    if (subject.lastUpdated) {
                        const subjectDate = new Date(subject.lastUpdated);
                        if (!acc.lastUpdated || subjectDate > new Date(acc.lastUpdated)) {
                            acc.lastUpdated = subject.lastUpdated;
                        }
                    }
                    if (!acc.position && subject.position) {
                        acc.position = subject.position;
                    }
                    return acc;
                },
                { total: 0, ca: 0, test: 0, exam: 0, count: 0, lastUpdated: null, position: null }
            );

            const averageScore = metrics.count > 0 ? metrics.total / metrics.count : 0;
            const studentProfile = this._getStudentProfile(studentId) || {};
            const studentName = studentProfile.name || studentProfile.fullName || studentProfile.studentName || studentId;
            const status = metrics.count >= subjectList.length && subjectList.length > 0
                ? 'Completed'
                : metrics.count > 0
                    ? 'In Progress'
                    : 'Pending';

            resultsMap.set(studentId, {
                studentId,
                studentName,
                className,
                subjectCount: metrics.count,
                averageScore: round(averageScore),
                totalScore: round(metrics.total),
                grade: this.calculateGrade(averageScore, sessionToUse, termToUse),
                position: metrics.position || null,
                status,
                caScore: metrics.count > 0 ? round(metrics.ca / metrics.count) : 0,
                examScore: metrics.count > 0 ? round(metrics.exam / metrics.count) : 0,
                testScore: metrics.count > 0 ? round(metrics.test / metrics.count) : 0,
                lastUpdated: metrics.lastUpdated
            });
        });

        const quickEntries = this._getQuickEntryContainer(sessionToUse, termToUse, className);
        Object.values(quickEntries).forEach((entry) => {
            const existing = resultsMap.get(entry.studentId);
            const studentProfile = this._getStudentProfile(entry.studentId) || {};
            const studentName = existing?.studentName || entry.studentName || studentProfile.name || studentProfile.fullName || entry.studentId;

            const caScore = entry.ca !== undefined ? Number(entry.ca) : existing?.caScore ?? 0;
            const examScore = entry.exam !== undefined ? Number(entry.exam) : existing?.examScore ?? 0;
            const testScore = entry.test !== undefined ? Number(entry.test) : existing?.testScore ?? 0;
            const totalScore = entry.total !== undefined ? Number(entry.total) : existing?.totalScore ?? (caScore + examScore + testScore);
            const average = entry.average !== undefined
                ? Number(entry.average)
                : existing?.subjectCount
                    ? existing.averageScore
                    : totalScore;

            resultsMap.set(entry.studentId, {
                studentId: entry.studentId,
                studentName,
                className,
                subjectCount: existing?.subjectCount || (this.classSubjects[className]?.length || 0),
                averageScore: round(average),
                totalScore: round(totalScore),
                grade: entry.grade || this.calculateGrade(average, sessionToUse, termToUse),
                position: entry.position || existing?.position || null,
                status: entry.status || existing?.status || 'Captured',
                caScore: round(caScore),
                examScore: round(examScore),
                testScore: round(testScore),
                lastUpdated: entry.lastUpdated || existing?.lastUpdated || new Date().toISOString()
            });
        });

        const rows = Array.from(resultsMap.values()).sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
        rows.forEach((row, index) => {
            if (!row.position) {
                row.position = index + 1;
            }
        });

        this.cache.classResults[cacheKey] = rows;
        return rows;
    }

    /**
     * Get student's complete result sheet
     * With caching for improved performance
     */
    getStudentResultSheet(studentId, className, term = null, session = null) {
        const termToUse = term || this.currentTerm;
        const sessionToUse = session || this.currentSession;
        
        // Cache key for this request
        const cacheKey = `sheet_${studentId}_${className}_${termToUse}_${sessionToUse}`;
        
        // Check if we have cached data
        if (this.cache.studentResults[cacheKey]) {
            return this.cache.studentResults[cacheKey];
        }
        
        const studentResults = this.getStudentResults(studentId, className, termToUse, sessionToUse);
        const subjects = this.classSubjects[className] || [];
        
        const subjectResults = subjects.map(subjectCode => {
            const result = studentResults[subjectCode] || {
                ca: 0, test: 0, exam: 0, total: 0, grade: 'F', 
                percentage: 0, remark: 'No result available'
            };
            
            return {
                subjectCode,
                ...result
            };
        });
        
        // Calculate totals and averages more efficiently
        const stats = subjectResults.reduce((acc, subject) => {
            acc.totalScore += subject.total;
            return acc;
        }, { totalScore: 0 });
        
        const averageScore = subjects.length > 0 ? stats.totalScore / subjects.length : 0;
        const averagePercentage = (averageScore / this.scoringConfig.total) * 100;
        const overallGrade = this.calculateGrade(averageScore);
        
        // Get position from first subject result (all subjects have the same position)
        const position = subjectResults.length > 0 ? 
            (subjectResults[0].position || 0) : 0;
        
        // Create the result sheet
        const resultSheet = {
            studentId,
            className,
            term: termToUse,
            session: sessionToUse,
            subjectResults,
            summary: {
                totalSubjects: subjects.length,
                totalScore: stats.totalScore,
                averageScore: Math.round(averageScore * 100) / 100,
                averagePercentage: Math.round(averagePercentage * 100) / 100,
                overallGrade,
                position,
                remark: this.generateRemark(averageScore)
            },
            generatedAt: new Date().toISOString()
        };
        
        // Cache the result
        this.cache.studentResults[cacheKey] = resultSheet;
        
        return resultSheet;
    }

    /**
     * Update scoring configuration
     */
    updateScoringConfig(newConfig, session = null, term = null) {
        const normalized = this._normalizeScoringConfig(newConfig);
        if (!normalized?.success) {
            return normalized || { success: false, message: 'Invalid scoring configuration supplied' };
        }

        const periodKey = this._getPeriodKey(session, term);
        const config = normalized.config;

        if (session || term) {
            this.scoringConfigByPeriod[periodKey] = { ...config };
        } else {
            this.scoringConfig = { ...config };
        }

        if (normalized.gradingScale) {
            this.updateGradingScale(normalized.gradingScale, session, term);
        }

        this.invalidateAllCaches();
        this._recalculateAllResults();

        return {
            success: true,
            message: 'Scoring configuration updated successfully',
            config
        };
    }

    /**
     * Update grading scale
     */
    updateGradingScale(newScale, session = null, term = null) {
        const normalized = this._normalizeGradingScale(newScale);
        if (!normalized) {
            return {
                success: false,
                message: 'Invalid grading scale supplied'
            };
        }

        const { thresholds, remarks } = normalized;
        const periodKey = this._getPeriodKey(session, term);

        if (session || term) {
            this.gradingScaleByPeriod[periodKey] = {
                thresholds: { ...thresholds },
                remarks: { ...remarks }
            };
        }

        this.gradingScale = { ...thresholds };
        this.gradingRemarks = { ...this.gradingRemarks, ...remarks };

        this.invalidateAllCaches();
        this._recalculateAllGrades();

        return {
            success: true,
            message: 'Grading scale updated successfully',
            scale: this.gradingScale
        };
    }

    /**
     * Recalculate all results after configuration changes
     * @private
     */
    _recalculateAllResults() {
        // Optimize for large datasets by using setTimeout for batch processing
        const processTerms = (termIndex = 0) => {
            const terms = Object.keys(this.resultData);
            
            if (termIndex >= terms.length) {
                return; // Done processing
            }
            
            const term = terms[termIndex];
            const sessions = Object.keys(this.resultData[term]);
            
            sessions.forEach(session => {
                const classes = Object.keys(this.resultData[term][session]);
                
                classes.forEach(className => {
                    const students = Object.keys(this.resultData[term][session][className]);
                    
                    students.forEach(studentId => {
                        const subjects = Object.keys(this.resultData[term][session][className][studentId]);
                        
                        subjects.forEach(subjectCode => {
                            const result = this.resultData[term][session][className][studentId][subjectCode];
                            result.total = result.ca + result.test + result.exam;
                            result.grade = this.calculateGrade(result.total);
                            result.percentage = this.calculatePercentage(result.total);
                            result.remark = this.generateRemark(result.total);
                        });
                    });
                    
                    // Recalculate positions
                    this.calculateClassPositions(term, session, className);
                });
            });
            
            // Process next term in the next event loop to avoid blocking
            setTimeout(() => processTerms(termIndex + 1), 0);
        };
        
        // Start processing
        processTerms();
    }

    /**
     * Recalculate all grades after grading scale changes
     * @private
     */
    _recalculateAllGrades() {
        // Similar to _recalculateAllResults but only updates grades
        const processTerms = (termIndex = 0) => {
            const terms = Object.keys(this.resultData);
            
            if (termIndex >= terms.length) {
                return; // Done processing
            }
            
            const term = terms[termIndex];
            const sessions = Object.keys(this.resultData[term]);
            
            sessions.forEach(session => {
                const classes = Object.keys(this.resultData[term][session]);
                
                classes.forEach(className => {
                    const students = Object.keys(this.resultData[term][session][className]);
                    
                    students.forEach(studentId => {
                        const subjects = Object.keys(this.resultData[term][session][className][studentId]);
                        
                        subjects.forEach(subjectCode => {
                            const result = this.resultData[term][session][className][studentId][subjectCode];
                            result.grade = this.calculateGrade(result.total);
                            result.remark = this.generateRemark(result.total);
                        });
                    });
                    
                    // Update positions if grade changes affect ranking
                    this.calculateClassPositions(term, session, className);
                });
            });
            
            // Process next term in the next event loop
            setTimeout(() => processTerms(termIndex + 1), 0);
        };
        
        // Start processing
        processTerms();
    }

    /**
     * Export class results to CSV format
     * Optimized with streaming for large datasets
     */
    exportClassResultsToCSV(className, term = null, session = null) {
        const termToUse = term || this.currentTerm;
        const sessionToUse = session || this.currentSession;
        
        const students = this.getStudentsByClass(className);
        const subjects = this.classSubjects[className] || [];
        
        // CSV Headers
        const headers = [
            'S/N', 'Student Name', 'Registration Number',
            ...subjects.flatMap(subjectCode => [
                `${subjectCode}_CA`, `${subjectCode}_Test`, `${subjectCode}_Exam`, 
                `${subjectCode}_Total`, `${subjectCode}_Grade`
            ]),
            'Grand Total', 'Average', 'Position'
        ];
        
        // For large datasets, process in chunks
        const rows = [];
        const batchSize = 50;
        
        // Process students in batches
        for (let i = 0; i < students.length; i += batchSize) {
            const batch = students.slice(i, i + batchSize);
            
            batch.forEach((student, index) => {
                const studentResults = this.getStudentResults(student.id, className, termToUse, sessionToUse);
                
                const row = [
                    i + index + 1, // S/N
                    student.name,
                    student.id
                ];
                
                // Pre-compute total to avoid repeated calculations
                let grandTotal = 0;
                
                subjects.forEach(subjectCode => {
                    const result = studentResults[subjectCode] || { 
                        ca: 0, test: 0, exam: 0, total: 0, grade: 'F' 
                    };
                    
                    row.push(result.ca, result.test, result.exam, result.total, result.grade);
                    grandTotal += result.total;
                });
                
                const average = subjects.length > 0 ? (grandTotal / subjects.length).toFixed(1) : 0;
                const position = subjects.length > 0 ? (studentResults[subjects[0]]?.position || 0) : 0;
                
                row.push(grandTotal, average, position);
                rows.push(row);
            });
        }
        
        // Convert to CSV string efficiently
        const csvRows = [headers, ...rows].map(row => 
            row.map(cell => {
                // Handle cell content with commas or quotes
                const cellStr = String(cell);
                return cellStr.includes(',') || cellStr.includes('\"') ? 
                    `\"${cellStr.replace(/\"/g, '\"\"')}\"` : cellStr;
            }).join(',')
        );
        
        const csvString = csvRows.join('\n');
        
        return {
            success: true,
            data: csvString,
            filename: `${className}_${termToUse}_${sessionToUse}_Results.csv`,
            generatedAt: new Date().toISOString()
        };
    }

    exportClassResults(className, session = null, term = null) {
        return this.exportClassResultsToCSV(className, term, session);
    }

    getAvailableSessions() {
        return Array.isArray(this.academicSessions) ? [...this.academicSessions] : [];
    }

    getAvailableTerms() {
        return Array.isArray(this.academicTerms) ? [...this.academicTerms] : [];
    }

    /**
     * Get available classes
     */
    getAvailableClasses() {
        return Object.keys(this.classSubjects);
    }

    /**
     * Get all classes with additional metadata
     */
    getAllClasses() {
        return Object.keys(this.classSubjects).map(className => ({
            name: className,
            subjectCount: this.classSubjects[className]?.length || 0,
            subjects: this.classSubjects[className] || []
        }));
    }

    /**
     * Get subjects for a class
     */
    getClassSubjects(className) {
        return this.classSubjects[className] || [];
    }

    /**
     * Add subject to class
     */
    addSubjectToClass(className, subjectCode) {
        if (!this.classSubjects[className]) {
            this.classSubjects[className] = [];
        }
        
        if (!this.classSubjects[className].includes(subjectCode)) {
            this.classSubjects[className].push(subjectCode);
            
            // Invalidate relevant cache
            this._invalidateClassCache(className, this.currentTerm, this.currentSession);
            
            return {
                success: true,
                message: 'Subject added to class successfully'
            };
        }
        
        return {
            success: false,
            message: 'Subject already exists in this class'
        };
    }

    /**
     * Remove subject from class
     */
    removeSubjectFromClass(className, subjectCode) {
        if (this.classSubjects[className]) {
            const index = this.classSubjects[className].indexOf(subjectCode);
            if (index > -1) {
                this.classSubjects[className].splice(index, 1);
                
                // Also remove results for this subject
                Object.keys(this.resultData).forEach(term => {
                    Object.keys(this.resultData[term]).forEach(session => {
                        if (this.resultData[term][session][className]) {
                            Object.keys(this.resultData[term][session][className]).forEach(studentId => {
                                delete this.resultData[term][session][className][studentId][subjectCode];
                            });
                        }
                    });
                });
                
                // Invalidate all class and student caches for this class
                this._invalidateClassCache(className, this.currentTerm, this.currentSession);
                
                return {
                    success: true,
                    message: 'Subject removed from class successfully'
                };
            }
        }
        
        return {
            success: false,
            message: 'Subject not found in this class'
        };
    }

    /**
     * Import results from CSV data
     */
    importResultsFromCSV(csvData) {
        try {
            // Parse CSV data
            const rows = csvData.split('\n').map(row => {
                // Handle quoted values properly
                const regex = /\"([^\"]*)\"|([^,]+)/g;
                const values = [];
                let match;
                
                while ((match = regex.exec(row))) {
                    values.push(match[1] || match[2]);
                }
                
                return values;
            });
            
            // Process headers to determine column mappings
            const headers = rows[0] || [];
            const studentIdIndex = headers.findIndex(h => 
                h.toLowerCase().includes('registration') || h.toLowerCase().includes('student id'));
            
            if (studentIdIndex === -1) {
                return {
                    success: false,
                    message: 'Could not find student ID column in CSV'
                };
            }
            
            // Find subject columns
            const subjectColumns = {};
            const scoreTypes = ['ca', 'test', 'exam'];
            
            headers.forEach((header, index) => {
                scoreTypes.forEach(scoreType => {
                    const match = header.match(new RegExp(`(.+)_${scoreType}`, 'i'));
                    if (match) {
                        const subjectCode = match[1];
                        if (!subjectColumns[subjectCode]) {
                            subjectColumns[subjectCode] = {};
                        }
                        subjectColumns[subjectCode][scoreType] = index;
                    }
                });
            });
            
            // Import data
            let success = 0;
            let failures = 0;
            
            // Process in batches
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length <= studentIdIndex) continue;
                
                const studentId = row[studentIdIndex];
                const studentsScores = [];
                
                Object.keys(subjectColumns).forEach(subjectCode => {
                    const scores = {};
                    let hasData = false;
                    
                    scoreTypes.forEach(scoreType => {
                        const index = subjectColumns[subjectCode][scoreType];
                        if (index !== undefined && index < row.length) {
                            scores[scoreType] = parseInt(row[index]) || 0;
                            hasData = true;
                        }
                    });
                    
                    if (hasData) {
                        studentsScores.push({
                            studentId,
                            subjectCode,
                            scores
                        });
                    }
                });
                
                // Update results
                try {
                    studentsScores.forEach(data => {
                        this.updateStudentResult(
                            data.studentId,
                            this.className, // This should be passed as parameter
                            data.subjectCode,
                            data.scores,
                            this.currentTerm,
                            this.currentSession
                        );
                    });
                    success++;
                } catch (e) {
                    failures++;
                }
            }
            
            return {
                success: failures === 0,
                imported: success,
                failures,
                message: `Successfully imported ${success} results, ${failures} failures`
            };
            
        } catch (error) {
            return {
                success: false,
                message: `Error importing CSV: ${error.message}`,
                error
            };
        }
    }

    /**
     * Generate report cards for all students in a class
     */
    generateReportCards(className, session = null, term = null) {
        const termToUse = term || this.currentTerm;
        const sessionToUse = session || this.currentSession;
        
        const students = this.getStudentsByClass(className);
        const results = students.map(student => {
            return this.getStudentResultSheet(student.id, className, termToUse, sessionToUse);
        }).filter(result => result?.subjectResults?.length > 0);
        
        return {
            success: true,
            reportCards: results,
            className,
            term: termToUse,
            session: sessionToUse
        };
    }

    /**
     * Get current configuration
     */
    getConfiguration() {
        return {
            scoringConfig: this.scoringConfig,
            gradingScale: this.gradingScale,
            classSubjects: this.classSubjects,
            academicSessions: this.academicSessions,
            academicTerms: this.academicTerms,
            currentSession: this.currentSession,
            currentTerm: this.currentTerm
        };
    }

    /**
     * Set current session and term
     */
    setCurrentPeriod(session, term) {
        if (this.academicSessions.includes(session)) {
            this.currentSession = session;
        }
        if (this.academicTerms.includes(term)) {
            this.currentTerm = term;
        }
        
        return {
            success: true,
            currentSession: this.currentSession,
            currentTerm: this.currentTerm
        };
    }
}

// Initialize global result manager instance
const resultManager = new ResultManager();

if (typeof window !== 'undefined') {
    window.resultManager = resultManager;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultManager;
}