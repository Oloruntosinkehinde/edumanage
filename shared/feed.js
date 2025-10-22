/**
 * Tophill Portal - Feed System
 * Comprehensive feed management system for announcements, news and notifications
 */

// Feed types and constants
const FEED_TYPES = {
    ANNOUNCEMENT: 'announcement',
    NEWS: 'news',
    NOTIFICATION: 'notification',
    EVENT: 'event'
};

const TARGET_TYPES = {
    SCHOOL: 'school',
    CLASS: 'class',
    STUDENT: 'student',
    STAFF: 'staff',
    TEACHER: 'teacher',
    ADMIN: 'admin'
};

const FEED_PRIORITIES = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
};

// Feed System Class
class FeedSystem {
    constructor() {
        this.baseUrl = this.getApiBaseUrl();
        this.token = localStorage.getItem('token') || 'demo-token';
        this.feedContainers = {};
        this.feeds = {
            public: [],
            announcements: [],
            notifications: [],
            events: []
        };
        this.templates = {};
        this.filters = {};
        this.initialized = false;
    }

    // Initialize the feed system
    async initialize() {
        if (this.initialized) return;
        
        // Register feed containers
        this.registerFeedContainer('public-feeds', 'public-feeds-container');
        this.registerFeedContainer('admin-feeds', 'feeds-container');
        this.registerFeedContainer('notifications', 'notification-container');
        
        // Load feeds
        await this.loadFeeds('public');
        
        // Check user role for loading appropriate feeds
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'admin' || userRole === 'teacher') {
            await this.loadFeeds('announcements');
        }
        
        // Register event listeners
        this.registerEventListeners();
        
        this.initialized = true;
        console.log('Feed system initialized');
    }
    
    // Register a feed container
    registerFeedContainer(feedType, containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            this.feedContainers[feedType] = container;
            console.log(`Registered ${feedType} container: ${containerId}`);
        } else {
            console.warn(`Container ${containerId} not found for ${feedType}`);
        }
    }
    
    // Register event listeners
    registerEventListeners() {
        // Refresh buttons
        const refreshPublicBtn = document.getElementById('refresh-public-feeds');
        const refreshFeedsBtn = document.getElementById('refresh-feeds');
        
        if (refreshPublicBtn) {
            refreshPublicBtn.addEventListener('click', () => this.loadFeeds('public'));
        }
        
        if (refreshFeedsBtn) {
            refreshFeedsBtn.addEventListener('click', () => this.loadFeeds('announcements'));
        }
        
        // Feed form handling
        const feedForm = document.getElementById('new-feed-form');
        if (feedForm) {
            feedForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitNewFeed(feedForm);
            });
        }
        
        // Target type change handling
        const targetTypeSelect = document.getElementById('target-type');
        if (targetTypeSelect) {
            targetTypeSelect.addEventListener('change', () => {
                this.handleTargetTypeChange(targetTypeSelect.value);
            });
        }
        
        // Filter handling
        const filterButtons = document.querySelectorAll('.feed-filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filterType = e.target.dataset.filter;
                this.applyFilter(filterType);
            });
        });
    }
    
    // Handle target type change
    handleTargetTypeChange(targetType) {
        const classField = document.getElementById('class-target-field');
        const studentField = document.getElementById('student-target-field');
        const staffField = document.getElementById('staff-target-field');
        
        // Hide all fields first
        [classField, studentField, staffField].forEach(field => {
            if (field) field.classList.remove('show');
        });
        
        // Show appropriate field
        if (targetType === 'class' && classField) {
            classField.classList.add('show');
        } else if (targetType === 'student' && studentField) {
            studentField.classList.add('show');
        } else if ((targetType === 'staff' || targetType === 'teacher') && staffField) {
            staffField.classList.add('show');
        }
    }
    
    // Load class options for target dropdown
    async loadClassOptions() {
        const select = document.getElementById('class-target');
        if (!select) return;
        
        select.innerHTML = '<option value="">Loading...</option>';
        
        try {
            const response = await fetch(`${this.baseUrl}/classes`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const data = await response.json();
            
            if (data && data.success) {
                select.innerHTML = '';
                data.data.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.id;
                    option.textContent = cls.name;
                    select.appendChild(option);
                });
            } else {
                this.addSampleClassOptions();
            }
        } catch (error) {
            console.error('Error loading class options:', error);
            this.addSampleClassOptions();
        }
    }
    
    // Add sample class options
    addSampleClassOptions() {
        const appInstance = window.app || window.Tophill PortalApp;
        const classNames = Array.isArray(appInstance?.getClassList)
            ? appInstance.getClassList()
            : this.getDefaultClassFallback();

        const classes = classNames.map((name, index) => ({
            id: `default-class-${index + 1}`,
            name
        }));
        
        const select = document.getElementById('class-target');
        if (!select) return;
        
        select.innerHTML = '';
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            select.appendChild(option);
        });
    }

    getDefaultClassFallback() {
        const levels = Array.from({ length: 6 }, (_, idx) => `Class ${idx + 1}`);
        const sections = ['A', 'B'];
        const combinations = [];

        levels.forEach(level => {
            sections.forEach(section => {
                combinations.push(`${level}${section}`);
            });
        });

        return combinations;
    }
    
    // Load student options for target dropdown
    async loadStudentOptions() {
        const select = document.getElementById('student-target');
        if (!select) return;
        
        select.innerHTML = '<option value="">Loading...</option>';
        
        try {
            const response = await fetch(`${this.baseUrl}/students`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const data = await response.json();
            
            if (data && data.success) {
                select.innerHTML = '';
                data.data.forEach(student => {
                    const option = document.createElement('option');
                    option.value = student.id;
                    option.textContent = `${student.name} (${student.class})`;
                    select.appendChild(option);
                });
            } else {
                this.addSampleStudentOptions();
            }
        } catch (error) {
            console.error('Error loading student options:', error);
            this.addSampleStudentOptions();
        }
    }
    
    // Add sample student options
    addSampleStudentOptions() {
        const students = [
            { id: 'S001', name: 'John Doe', class: 'Class 10A' },
            { id: 'S002', name: 'Jane Smith', class: 'Class 10A' },
            { id: 'S003', name: 'Robert Johnson', class: 'Class 10B' },
            { id: 'S004', name: 'Emily Brown', class: 'Class 11A' },
            { id: 'S005', name: 'Michael Wilson', class: 'Class 11B' },
            { id: 'S006', name: 'Sarah Davis', class: 'Class 12A' }
        ];
        
        const select = document.getElementById('student-target');
        if (!select) return;
        
        select.innerHTML = '';
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.class})`;
            select.appendChild(option);
        });
    }
    
    // Load staff options for target dropdown
    async loadStaffOptions() {
        const select = document.getElementById('staff-target');
        if (!select) return;
        
        select.innerHTML = '<option value="">Loading...</option>';
        
        try {
            const response = await fetch(`${this.baseUrl}/staff`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const data = await response.json();
            
            if (data && data.success) {
                select.innerHTML = '';
                data.data.forEach(staff => {
                    const option = document.createElement('option');
                    option.value = staff.id;
                    option.textContent = `${staff.name} (${staff.role})`;
                    select.appendChild(option);
                });
            } else {
                this.addSampleStaffOptions();
            }
        } catch (error) {
            console.error('Error loading staff options:', error);
            this.addSampleStaffOptions();
        }
    }
    
    // Add sample staff options
    addSampleStaffOptions() {
        const staff = [
            { id: 'T001', name: 'Mr. Anderson', role: 'Math Teacher' },
            { id: 'T002', name: 'Ms. Johnson', role: 'English Teacher' },
            { id: 'T003', name: 'Mr. Williams', role: 'Science Teacher' },
            { id: 'T004', name: 'Mrs. Brown', role: 'History Teacher' },
            { id: 'T005', name: 'Mr. Davis', role: 'PE Teacher' },
            { id: 'T006', name: 'Ms. Wilson', role: 'Art Teacher' }
        ];
        
        const select = document.getElementById('staff-target');
        if (!select) return;
        
        select.innerHTML = '';
        staff.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = `${member.name} (${member.role})`;
            select.appendChild(option);
        });
    }
    
    // Load feeds by type
    async loadFeeds(type = 'public') {
        const container = this.feedContainers[type === 'announcements' ? 'admin-feeds' : type];
        if (!container) {
            console.warn(`Container for ${type} feeds not found`);
            return;
        }
        
        // Show loading indicator
        container.innerHTML = '<div class="loading">Loading...</div>';
        
        let endpoint = '/feeds';
        if (type === 'public') {
            endpoint = '/feeds/public';
        } else if (type === 'notifications') {
            endpoint = '/feeds/notifications';
        }
        
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const data = await response.json();
            
            if (data && data.success) {
                this.feeds[type] = data.data;
                this.renderFeeds(type);
            } else {
                this.loadSampleFeeds(type);
            }
        } catch (error) {
            console.error(`Error loading ${type} feeds:`, error);
            this.loadSampleFeeds(type);
        }
    }
    
    // Load sample feeds
    loadSampleFeeds(type = 'public') {
        let sampleFeeds = [];
        
        if (type === 'public') {
            sampleFeeds = [
                {
                    id: 'P001',
                    type: FEED_TYPES.NEWS,
                    title: 'School Reopening Notice',
                    message: 'School will reopen for the new academic year on October 5, 2025. All students are expected to be present in their full school uniforms.',
                    createdBy: 'School Administration',
                    createdAt: '2025-09-15T08:30:00Z',
                    priority: FEED_PRIORITIES.HIGH,
                    targetType: TARGET_TYPES.SCHOOL,
                    targetId: null,
                    attachments: [],
                    tags: ['reopening', 'important']
                },
                {
                    id: 'P002',
                    type: FEED_TYPES.EVENT,
                    title: 'Annual Sports Day',
                    message: 'The annual sports day will be held on October 20, 2025. Parents are invited to attend and support their children in various sporting activities.',
                    createdBy: 'Sports Department',
                    createdAt: '2025-09-20T10:15:00Z',
                    priority: FEED_PRIORITIES.NORMAL,
                    targetType: TARGET_TYPES.SCHOOL,
                    targetId: null,
                    attachments: [],
                    tags: ['sports', 'event']
                },
                {
                    id: 'P003',
                    type: FEED_TYPES.ANNOUNCEMENT,
                    title: 'Parent-Teacher Meeting',
                    message: 'A parent-teacher meeting is scheduled for October 10, 2025, from 9:00 AM to 3:00 PM. Please make arrangements to attend and discuss your child\'s progress.',
                    createdBy: 'Principal\'s Office',
                    createdAt: '2025-09-25T14:45:00Z',
                    priority: FEED_PRIORITIES.HIGH,
                    targetType: TARGET_TYPES.SCHOOL,
                    targetId: null,
                    attachments: [],
                    tags: ['meeting', 'parents', 'important']
                },
                {
                    id: 'P004',
                    type: FEED_TYPES.NEWS,
                    title: 'School Achievement Award',
                    message: 'We are proud to announce that our school has been awarded the "Excellence in Education" award for the third consecutive year. Congratulations to all students, teachers, and staff for their hard work and dedication.',
                    createdBy: 'Principal\'s Office',
                    createdAt: '2025-09-22T11:30:00Z',
                    priority: FEED_PRIORITIES.NORMAL,
                    targetType: TARGET_TYPES.SCHOOL,
                    targetId: null,
                    attachments: [],
                    tags: ['achievement', 'award']
                },
                {
                    id: 'P005',
                    type: FEED_TYPES.EVENT,
                    title: 'Science Exhibition',
                    message: 'The annual science exhibition will be held on October 15, 2025. Students participating in the exhibition should submit their project proposals by October 5, 2025.',
                    createdBy: 'Science Department',
                    createdAt: '2025-09-18T09:00:00Z',
                    priority: FEED_PRIORITIES.NORMAL,
                    targetType: TARGET_TYPES.SCHOOL,
                    targetId: null,
                    attachments: [],
                    tags: ['science', 'exhibition', 'event']
                }
            ];
        } else if (type === 'announcements') {
            sampleFeeds = [
                {
                    id: 'A001',
                    type: FEED_TYPES.ANNOUNCEMENT,
                    title: 'End of Semester Exams',
                    message: 'The end of semester exams will begin on November 15, 2025. Please ensure all coursework is submitted by November 10.',
                    createdBy: 'Administrator',
                    createdAt: '2025-09-25T10:30:00Z',
                    priority: FEED_PRIORITIES.HIGH,
                    targetType: TARGET_TYPES.SCHOOL,
                    targetId: null,
                    attachments: [],
                    tags: ['exams', 'important']
                },
                {
                    id: 'A002',
                    type: FEED_TYPES.ANNOUNCEMENT,
                    title: 'Science Fair Reminder',
                    message: 'The annual science fair is scheduled for October 5, 2025. All Class 10 students must submit their project proposals by September 30.',
                    createdBy: 'Administrator',
                    createdAt: '2025-09-20T14:15:00Z',
                    priority: FEED_PRIORITIES.NORMAL,
                    targetType: TARGET_TYPES.CLASS,
                    targetId: 'C001', // Class 10A
                    attachments: [],
                    tags: ['science fair', 'class 10']
                },
                {
                    id: 'A003',
                    type: FEED_TYPES.ANNOUNCEMENT,
                    title: 'Sports Day Announcement',
                    message: 'The annual sports day will be held on October 12, 2025. All students are required to participate in at least one event.',
                    createdBy: 'Administrator',
                    createdAt: '2025-09-18T09:45:00Z',
                    priority: FEED_PRIORITIES.NORMAL,
                    targetType: TARGET_TYPES.SCHOOL,
                    targetId: null,
                    attachments: [],
                    tags: ['sports', 'event']
                }
            ];
        } else if (type === 'notifications') {
            sampleFeeds = [
                {
                    id: 'N001',
                    type: FEED_TYPES.NOTIFICATION,
                    title: 'New Assignment Posted',
                    message: 'A new math assignment has been posted. Due date: October 5, 2025.',
                    createdBy: 'Mr. Anderson',
                    createdAt: '2025-09-27T15:30:00Z',
                    priority: FEED_PRIORITIES.NORMAL,
                    targetType: TARGET_TYPES.CLASS,
                    targetId: 'C001', // Class 10A
                    isRead: false,
                    attachments: [],
                    tags: ['assignment', 'math']
                },
                {
                    id: 'N002',
                    type: FEED_TYPES.NOTIFICATION,
                    title: 'Result Published',
                    message: 'Your English test results have been published. You can view them in the Results section.',
                    createdBy: 'System',
                    createdAt: '2025-09-26T10:15:00Z',
                    priority: FEED_PRIORITIES.NORMAL,
                    targetType: TARGET_TYPES.STUDENT,
                    targetId: 'S001', // John Doe
                    isRead: true,
                    attachments: [],
                    tags: ['result', 'english']
                }
            ];
        }
        
        this.feeds[type] = sampleFeeds;
        this.renderFeeds(type);
    }
    
    // Render feeds by type
    renderFeeds(type = 'public') {
        const container = this.feedContainers[type === 'announcements' ? 'admin-feeds' : type];
        if (!container) return;
        
        const feeds = this.feeds[type] || [];
        
        if (feeds.length === 0) {
            container.innerHTML = `<p class="no-data">No ${type} available.</p>`;
            return;
        }
        
        // Sort feeds by date (newest first)
        feeds.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Clear container
        container.innerHTML = '';
        
        // Render each feed
        feeds.forEach(feed => {
            const feedElement = this.createFeedElement(feed, type);
            container.appendChild(feedElement);
        });
    }
    
    // Create feed element
    createFeedElement(feed, type) {
        const card = document.createElement('div');
        
        // Set classes based on feed properties
        let cardClasses = ['feed-card'];
        
        // Add priority-based class
        if (feed.priority === FEED_PRIORITIES.HIGH || feed.priority === FEED_PRIORITIES.URGENT) {
            cardClasses.push('important');
        }
        
        // Add type-based class
        cardClasses.push(`feed-type-${feed.type || 'default'}`);
        
        // Add unread class if applicable
        if (feed.isRead === false) {
            cardClasses.push('unread');
        }
        
        card.className = cardClasses.join(' ');
        card.dataset.id = feed.id;
        card.dataset.type = feed.type || 'default';
        card.dataset.priority = feed.priority || 'normal';
        
        // Format date
        const createdAt = new Date(feed.createdAt).toLocaleString();
        
        // Determine target label
        let targetLabel = '';
        let targetClass = '';
        
        if (feed.targetType && feed.targetType !== TARGET_TYPES.SCHOOL) {
            switch (feed.targetType) {
                case TARGET_TYPES.CLASS:
                    targetLabel = `Class: ${feed.targetId}`;
                    targetClass = 'target-class';
                    break;
                case TARGET_TYPES.STUDENT:
                    targetLabel = `Student: ${feed.targetId}`;
                    targetClass = 'target-student';
                    break;
                case TARGET_TYPES.STAFF:
                case TARGET_TYPES.TEACHER:
                    targetLabel = `Staff: ${feed.targetId}`;
                    targetClass = 'target-staff';
                    break;
                default:
                    targetLabel = `${feed.targetType}: ${feed.targetId}`;
                    targetClass = `target-${feed.targetType}`;
            }
        }
        
        // Different templates for different feed types
        if (type === 'public') {
            // Simple template for public feeds
            card.innerHTML = `
                <div class="feed-header">
                    <h3 class="feed-title">${feed.title}</h3>
                    ${feed.priority === FEED_PRIORITIES.HIGH || feed.priority === FEED_PRIORITIES.URGENT ? 
                      `<span class="priority-badge priority-${feed.priority}">${feed.priority}</span>` : ''}
                    ${feed.type ? `<span class="feed-type-badge">${feed.type}</span>` : ''}
                </div>
                <div class="feed-content">
                    <p>${feed.message}</p>
                    ${targetLabel ? `<span class="feed-target ${targetClass}">${targetLabel}</span>` : ''}
                    ${feed.tags && feed.tags.length ? `
                        <div class="feed-tags">
                            ${feed.tags.map(tag => `<span class="feed-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="feed-meta">
                    <span>Posted by: ${feed.createdBy}</span>
                    <span>Date: ${createdAt}</span>
                </div>
            `;
        } else if (type === 'announcements') {
            // Admin template with actions
            card.innerHTML = `
                <div class="feed-header">
                    <h3 class="feed-title">${feed.title}</h3>
                    <div class="feed-actions">
                        <button class="btn btn-secondary btn-sm edit-feed" data-id="${feed.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm delete-feed" data-id="${feed.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="feed-content">
                    <p>${feed.message}</p>
                    ${targetLabel ? `<span class="feed-target ${targetClass}">${targetLabel}</span>` : ''}
                    ${feed.priority ? `<span class="priority-badge priority-${feed.priority}">${feed.priority}</span>` : ''}
                    ${feed.tags && feed.tags.length ? `
                        <div class="feed-tags">
                            ${feed.tags.map(tag => `<span class="feed-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="feed-meta">
                    <span>Posted by: ${feed.createdBy}</span>
                    <span>Date: ${createdAt}</span>
                </div>
            `;
            
            // Add event listeners for edit and delete buttons
            setTimeout(() => {
                const editBtn = card.querySelector('.edit-feed');
                const deleteBtn = card.querySelector('.delete-feed');
                
                if (editBtn) {
                    editBtn.addEventListener('click', () => this.editFeed(feed));
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.deleteFeed(feed));
                }
            }, 0);
        } else if (type === 'notifications') {
            // Notifications template with mark as read button
            card.innerHTML = `
                <div class="feed-header">
                    <h3 class="feed-title">${feed.title}</h3>
                    ${!feed.isRead ? `<button class="mark-read-btn" data-id="${feed.id}">Mark as Read</button>` : ''}
                </div>
                <div class="feed-content">
                    <p>${feed.message}</p>
                </div>
                <div class="feed-meta">
                    <span>From: ${feed.createdBy}</span>
                    <span>Date: ${createdAt}</span>
                </div>
            `;
            
            // Add event listener for mark as read button
            setTimeout(() => {
                const markReadBtn = card.querySelector('.mark-read-btn');
                if (markReadBtn) {
                    markReadBtn.addEventListener('click', () => this.markFeedAsRead(feed.id));
                }
            }, 0);
        }
        
        return card;
    }
    
    // Submit new feed
    async submitNewFeed(form) {
        // Get form data
        const title = document.getElementById('feed-title').value;
        const message = document.getElementById('feed-message').value;
        const targetType = document.getElementById('target-type').value;
        const feedType = document.getElementById('feed-type')?.value || FEED_TYPES.ANNOUNCEMENT;
        const priority = document.getElementById('feed-priority')?.value || FEED_PRIORITIES.NORMAL;
        const tags = document.getElementById('feed-tags')?.value || '';
        
        // Get target ID based on target type
        let targetId = null;
        if (targetType === TARGET_TYPES.CLASS) {
            targetId = document.getElementById('class-target').value;
        } else if (targetType === TARGET_TYPES.STUDENT) {
            targetId = document.getElementById('student-target').value;
        } else if (targetType === TARGET_TYPES.STAFF || targetType === TARGET_TYPES.TEACHER) {
            targetId = document.getElementById('staff-target').value;
        }
        
        // Create feed data object
        const feedData = {
            title,
            message,
            targetType,
            targetId,
            type: feedType,
            priority,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        };
        
        try {
            // Try to post to API
            const response = await fetch(`${this.baseUrl}/feeds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(feedData)
            });
            
            const data = await response.json();
            
            if (data && data.success) {
                this.showNotification('Feed created successfully!', 'success');
                
                // Clear form
                form.reset();
                document.querySelectorAll('.target-id-field').forEach(field => {
                    field.classList.remove('show');
                });
                
                // Reload feeds
                await this.loadFeeds('announcements');
                if (feedData.type === FEED_TYPES.NEWS && targetType === TARGET_TYPES.SCHOOL) {
                    await this.loadFeeds('public');
                }
            } else {
                // For demo, simulate success
                this.simulateNewFeedSuccess(feedData);
            }
        } catch (error) {
            console.error('Error creating feed:', error);
            // For demo, simulate success
            this.simulateNewFeedSuccess(feedData);
        }
    }
    
    // Simulate new feed success
    simulateNewFeedSuccess(feedData) {
        this.showNotification('Feed created successfully! (Demo mode)', 'success');
        
        // Clear form
        document.getElementById('new-feed-form').reset();
        document.querySelectorAll('.target-id-field').forEach(field => {
            field.classList.remove('show');
        });
        
        // Create a new feed object with the entered data
        const newFeed = {
            id: 'F' + Math.floor(1000 + Math.random() * 9000),
            title: feedData.title,
            message: feedData.message,
            type: feedData.type || FEED_TYPES.ANNOUNCEMENT,
            priority: feedData.priority || FEED_PRIORITIES.NORMAL,
            targetType: feedData.targetType,
            targetId: feedData.targetId,
            createdBy: localStorage.getItem('username') || 'Administrator',
            createdAt: new Date().toISOString(),
            tags: feedData.tags || [],
            attachments: []
        };
        
        // Add to appropriate feed arrays
        if (feedData.type === FEED_TYPES.NEWS && feedData.targetType === TARGET_TYPES.SCHOOL) {
            this.feeds.public.unshift(newFeed);
            this.renderFeeds('public');
        }
        
        this.feeds.announcements.unshift(newFeed);
        this.renderFeeds('announcements');
    }
    
    // Edit feed
    editFeed(feed) {
        // Set form values
        document.getElementById('feed-title').value = feed.title;
        document.getElementById('feed-message').value = feed.message;
        
        if (document.getElementById('feed-type')) {
            document.getElementById('feed-type').value = feed.type || FEED_TYPES.ANNOUNCEMENT;
        }
        
        if (document.getElementById('feed-priority')) {
            document.getElementById('feed-priority').value = feed.priority || FEED_PRIORITIES.NORMAL;
        }
        
        if (document.getElementById('feed-tags')) {
            document.getElementById('feed-tags').value = feed.tags ? feed.tags.join(', ') : '';
        }
        
        // Set target type and show appropriate field
        const targetTypeSelect = document.getElementById('target-type');
        if (targetTypeSelect) {
            targetTypeSelect.value = feed.targetType || TARGET_TYPES.SCHOOL;
            
            // Update visible target fields
            this.handleTargetTypeChange(targetTypeSelect.value);
            
            // Set target value if applicable
            if (feed.targetType === TARGET_TYPES.CLASS && document.getElementById('class-target')) {
                document.getElementById('class-target').value = feed.targetId;
            } else if (feed.targetType === TARGET_TYPES.STUDENT && document.getElementById('student-target')) {
                document.getElementById('student-target').value = feed.targetId;
            } else if ((feed.targetType === TARGET_TYPES.STAFF || feed.targetType === TARGET_TYPES.TEACHER) && document.getElementById('staff-target')) {
                document.getElementById('staff-target').value = feed.targetId;
            }
        }
        
        // Scroll to form
        document.querySelector('.new-feed-form').scrollIntoView({ behavior: 'smooth' });
        
        // Store editing state
        this.currentEditingFeed = feed.id;
        
        // Change button text to "Update"
        const submitBtn = document.querySelector('#new-feed-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Announcement';
            submitBtn.classList.add('editing');
        }
        
        // Add cancel button if it doesn't exist
        if (!document.getElementById('cancel-edit-feed')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancel-edit-feed';
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
            cancelBtn.style.marginRight = '10px';
            cancelBtn.addEventListener('click', () => this.cancelEditFeed());
            
            submitBtn.parentNode.insertBefore(cancelBtn, submitBtn);
        }
    }
    
    // Cancel edit feed
    cancelEditFeed() {
        // Reset form
        document.getElementById('new-feed-form').reset();
        
        // Hide target fields
        document.querySelectorAll('.target-id-field').forEach(field => {
            field.classList.remove('show');
        });
        
        // Reset button text
        const submitBtn = document.querySelector('#new-feed-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Post Announcement';
            submitBtn.classList.remove('editing');
        }
        
        // Remove cancel button
        const cancelBtn = document.getElementById('cancel-edit-feed');
        if (cancelBtn) {
            cancelBtn.remove();
        }
        
        // Reset editing state
        this.currentEditingFeed = null;
    }
    
    // Delete feed
    async deleteFeed(feed) {
        if (!confirm(`Are you sure you want to delete the announcement: "${feed.title}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/feeds/${feed.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const data = await response.json();
            
            if (data && data.success) {
                this.showNotification('Feed deleted successfully!', 'success');
                await this.loadFeeds('announcements');
                
                // Also reload public feeds if this was a public news item
                if (feed.type === FEED_TYPES.NEWS && feed.targetType === TARGET_TYPES.SCHOOL) {
                    await this.loadFeeds('public');
                }
            } else {
                // For demo, simulate success
                this.simulateDeleteFeedSuccess(feed);
            }
        } catch (error) {
            console.error('Error deleting feed:', error);
            // For demo, simulate success
            this.simulateDeleteFeedSuccess(feed);
        }
    }
    
    // Simulate delete feed success
    simulateDeleteFeedSuccess(feed) {
        this.showNotification('Feed deleted successfully! (Demo mode)', 'success');
        
        // Remove from announcements array
        this.feeds.announcements = this.feeds.announcements.filter(f => f.id !== feed.id);
        this.renderFeeds('announcements');
        
        // Also remove from public feeds if applicable
        if (feed.type === FEED_TYPES.NEWS && feed.targetType === TARGET_TYPES.SCHOOL) {
            this.feeds.public = this.feeds.public.filter(f => f.id !== feed.id);
            this.renderFeeds('public');
        }
    }
    
    // Mark feed as read
    async markFeedAsRead(feedId) {
        try {
            const response = await fetch(`${this.baseUrl}/feeds/${feedId}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const data = await response.json();
            
            if (data && data.success) {
                // Update feed in array
                const feedIndex = this.feeds.notifications.findIndex(f => f.id === feedId);
                if (feedIndex !== -1) {
                    this.feeds.notifications[feedIndex].isRead = true;
                }
                
                // Update UI
                const feedCard = document.querySelector(`.feed-card[data-id="${feedId}"]`);
                if (feedCard) {
                    feedCard.classList.remove('unread');
                    const markReadBtn = feedCard.querySelector('.mark-read-btn');
                    if (markReadBtn) {
                        markReadBtn.remove();
                    }
                }
                
                // Update notification badge
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('Error marking feed as read:', error);
            
            // For demo, simulate success
            const feedIndex = this.feeds.notifications.findIndex(f => f.id === feedId);
            if (feedIndex !== -1) {
                this.feeds.notifications[feedIndex].isRead = true;
            }
            
            // Update UI
            const feedCard = document.querySelector(`.feed-card[data-id="${feedId}"]`);
            if (feedCard) {
                feedCard.classList.remove('unread');
                const markReadBtn = feedCard.querySelector('.mark-read-btn');
                if (markReadBtn) {
                    markReadBtn.remove();
                }
            }
            
            // Update notification badge
            this.updateNotificationBadge();
        }
    }
    
    // Update notification badge
    updateNotificationBadge() {
        const badge = document.getElementById('notifications-badge');
        if (!badge) return;
        
        const unreadCount = this.feeds.notifications.filter(f => !f.isRead).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
    
    // Apply filter to feeds
    applyFilter(filterType) {
        // Toggle active state on filter buttons
        document.querySelectorAll('.feed-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filterType);
        });
        
        // Store current filter
        this.currentFilter = filterType === 'all' ? null : filterType;
        
        // Apply filters to public and announcements feeds
        ['public', 'announcements'].forEach(feedType => {
            if (!this.feedContainers[feedType === 'announcements' ? 'admin-feeds' : feedType]) return;
            
            const container = this.feedContainers[feedType === 'announcements' ? 'admin-feeds' : feedType];
            const feeds = this.feeds[feedType];
            
            if (!feeds || !feeds.length) return;
            
            // Show or hide feed cards based on filter
            Array.from(container.children).forEach(card => {
                if (card.classList.contains('feed-card')) {
                    if (!this.currentFilter || card.dataset.type === this.currentFilter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
            
            // Show "no feeds" message if no feeds match filter
            const visibleCards = Array.from(container.children).filter(
                card => card.classList.contains('feed-card') && card.style.display !== 'none'
            );
            
            if (visibleCards.length === 0) {
                // Remove any existing no-data message
                const existingNoData = container.querySelector('.no-data');
                if (existingNoData) existingNoData.remove();
                
                // Add new no-data message
                const noData = document.createElement('p');
                noData.className = 'no-data';
                noData.textContent = `No ${this.currentFilter} feeds available.`;
                container.appendChild(noData);
            } else {
                // Remove any existing no-data message
                const existingNoData = container.querySelector('.no-data');
                if (existingNoData) existingNoData.remove();
            }
        });
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add close button handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Helper function to get API base URL
    getApiBaseUrl() {
        // Check if running on localhost
        if (window.location.hostname === 'localhost') {
            return '/api';
        }
        // Default to relative path for simplicity
        return '/api';
    }
}

// Create and export the feed system instance
const feedSystem = new FeedSystem();

// Initialize the feed system when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    feedSystem.initialize();
});

// Export the feed system instance
window.feedSystem = feedSystem;