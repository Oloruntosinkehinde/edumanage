/**
 * Communication Manager
 * Unified communication system for students, teachers, and admin
 * Handles feeds, messages, notifications, and results integration
 * @version 2.0
 */

class CommunicationManager {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.feeds = [];
        this.notifications = [];
        this.unreadCount = 0;
        this.resultManager = null;
        this.cache = {};
        this.eventListeners = new Map();
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            autoRefreshInterval: 30000, // 30 seconds
            maxCacheAge: 300000, // 5 minutes
            maxNotifications: 50,
            enableRealTime: false
        };
    }

    /**
     * Initialize the communication manager
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            console.log('Initializing Communication Manager...');
            
            // Check authentication
            await this.checkAuth();
            
            // Initialize result manager if available
            if (typeof ResultManager !== 'undefined') {
                this.resultManager = window.resultManager || new ResultManager();
            }
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup UI elements
            this.setupUI();
            
            // Bind event listeners
            this.bindEvents();
            
            // Start auto refresh
            this.startAutoRefresh();
            
            this.isInitialized = true;
            console.log('Communication Manager initialized successfully');
            
            // Emit initialization event
            this.emit('initialized', { user: this.currentUser });
            
        } catch (error) {
            console.error('Failed to initialize Communication Manager:', error);
            this.showNotification('Failed to load communication system', 'error');
        }
    }

    /**
     * Check user authentication
     */
    async checkAuth() {
        // Use the API client to get current user
        try {
            if (window.apiClient) {
                const user = await window.apiClient.getCurrentUser();
                
                if (user) {
                    this.currentUser = user;
                    this.currentRole = user.role;
                    console.log(`Authenticated as ${this.currentUser.firstName} ${this.currentUser.lastName} (${this.currentRole})`);
                    return;
                }
            } else {
                // Fallback to localStorage if API client not available
                const session = localStorage.getItem('edumanage_session');
                
                if (session) {
                    const sessionData = JSON.parse(session);
                    this.currentUser = sessionData.user;
                    this.currentRole = this.currentUser.role;
                    console.log(`Authenticated as ${this.currentUser.name} (${this.currentRole})`);
                    return;
                }
            }
            
            // If we got here, no valid authentication was found
            console.log('No authentication found, using demo mode');
            this.setupDemoMode();
            
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.setupDemoMode();
        }
    }

    /**
     * Setup demo mode
     */
    setupDemoMode() {
        this.currentUser = {
            id: 'demo_user',
            name: 'Demo User',
            role: 'student',
            class: 'Demo Class'
        };
        this.currentRole = 'student';
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        console.log('Loading initial communication data...');
        
        // Load from cache first
        const cachedData = this.getFromCache('initial_data');
        if (cachedData) {
            this.feeds = cachedData.feeds || [];
            this.notifications = cachedData.notifications || [];
            this.unreadCount = cachedData.unreadCount || 0;
            console.log('Loaded data from cache');
        }
        
        // Load fresh data in background
        await this.loadFreshData();
        
        // Restore read states after loading fresh data
        await this.restoreReadStates();
    }
    
    /**
     * Restore read states from API or cache
     */
    async restoreReadStates() {
        try {
            if (window.apiClient && window.apiClient.apiMode === 'http') {
                console.log('Restoring read states from API...');
                
                try {
                    // No need to fetch states separately if using API - the feed data from API
                    // should already have the correct isRead states for the current user
                    console.log('Read states should already be included in API feed data');
                    return;
                } catch (error) {
                    console.error('Failed to restore read states from API:', error);
                    // Fall back to cache
                }
            }
            
            // Restore from cache if API not available
            console.log('Restoring read states from cache...');
            
            // Restore feed states
            const feedStates = this.getFromCache('feed_states');
            if (feedStates) {
                feedStates.forEach(state => {
                    const feed = this.feeds.find(f => f.id === state.id);
                    if (feed) {
                        feed.isRead = state.isRead;
                    }
                });
            }
            
            // Restore notification states
            const notificationStates = this.getFromCache('notification_states');
            if (notificationStates) {
                notificationStates.forEach(state => {
                    const notification = this.notifications.find(n => n.id === state.id);
                    if (notification) {
                        notification.isRead = state.isRead;
                    }
                });
            }
            
            // Update unread count
            this.unreadCount = this.calculateUnreadCount();
            this.updateNotificationBadge();
            
            console.log('Read states restored from cache');
        } catch (error) {
            console.error('Error restoring read states:', error);
        }
    }

    /**
     * Load fresh data from API or generate demo data if API not available
     */
    async loadFreshData() {
        try {
            let feeds = [];
            let notifications = [];
            
            // Try to load data from API client if available
            if (window.apiClient && window.apiClient.apiMode === 'http') {
                console.log('Loading communication data from API...');
                
                try {
                    // Load feeds from API
                    feeds = await window.apiClient.read('feeds');
                    
                    // Load notifications from API
                    notifications = await window.apiClient.read('notifications', { 
                        userId: this.currentUser.id 
                    });
                    
                    console.log('Successfully loaded data from API');
                } catch (apiError) {
                    console.error('Failed to load data from API, falling back to demo data:', apiError);
                    const demoData = this.generateDemoData();
                    feeds = demoData.feeds;
                    notifications = demoData.notifications;
                }
            } else {
                console.log('API client not available, using demo data');
                const demoData = this.generateDemoData();
                feeds = demoData.feeds;
                notifications = demoData.notifications;
            }
            
            this.feeds = feeds;
            this.notifications = notifications;
            this.unreadCount = this.calculateUnreadCount();
            
            // Cache the data
            this.setCache('initial_data', {
                feeds: this.feeds,
                notifications: this.notifications,
                unreadCount: this.unreadCount,
                timestamp: Date.now()
            });
            
            // Update UI
            this.updateUI();
            
            console.log(`Loaded ${this.feeds.length} feeds and ${this.notifications.length} notifications`);
            
        } catch (error) {
            console.error('Failed to load fresh data:', error);
        }
    }

    /**
     * Generate demo data based on user role
     */
    generateDemoData() {
        const now = new Date();
        const feeds = [];
        const notifications = [];
        
        // Base feeds for all users
        const baseFeeds = [
            {
                id: 'feed_1',
                type: 'announcement',
                title: 'Welcome to EduManage Communication Center',
                content: 'Stay updated with all school announcements and important information.',
                author: 'Admin',
                timestamp: new Date(now - 3600000), // 1 hour ago
                priority: 'normal',
                category: 'announcement',
                isRead: false,
                targetAudience: ['all'],
                attachments: []
            },
            {
                id: 'feed_2',
                type: 'event',
                title: 'School Science Fair',
                content: 'Annual science fair is scheduled for next month. Start preparing your projects!',
                author: 'Science Department',
                timestamp: new Date(now - 7200000), // 2 hours ago
                priority: 'high',
                category: 'event',
                isRead: false,
                targetAudience: ['students', 'teachers'],
                attachments: []
            }
        ];
        
        // Role-specific content
        if (this.currentRole === 'student') {
            feeds.push(
                {
                    id: 'feed_3',
                    type: 'assignment',
                    title: 'Mathematics Assignment Due',
                    content: 'Complete exercises 1-10 from Chapter 5. Submission deadline is tomorrow.',
                    author: 'Math Teacher',
                    timestamp: new Date(now - 1800000), // 30 minutes ago
                    priority: 'urgent',
                    category: 'assignment',
                    isRead: false,
                    targetAudience: ['students'],
                    targetClass: this.currentUser.class,
                    attachments: []
                },
                {
                    id: 'feed_4',
                    type: 'result',
                    title: 'Test Results Published',
                    content: 'Your recent test results are now available in the results section.',
                    author: 'Academic Office',
                    timestamp: new Date(now - 3600000), // 1 hour ago
                    priority: 'normal',
                    category: 'result',
                    isRead: false,
                    targetAudience: ['students'],
                    attachments: []
                }
            );
            
            notifications.push(
                {
                    id: 'notif_1',
                    title: 'New Assignment',
                    message: 'You have a new mathematics assignment',
                    type: 'assignment',
                    timestamp: new Date(now - 1800000),
                    isRead: false,
                    actionUrl: '../teacher/assignments.html'
                },
                {
                    id: 'notif_2',
                    title: 'Results Available',
                    message: 'Your test results are now available',
                    type: 'result',
                    timestamp: new Date(now - 3600000),
                    isRead: false,
                    actionUrl: '#results'
                }
            );
            
        } else if (this.currentRole === 'teacher') {
            feeds.push(
                {
                    id: 'feed_5',
                    type: 'staff',
                    title: 'Staff Meeting Tomorrow',
                    content: 'Monthly staff meeting scheduled for 2 PM in the conference room.',
                    author: 'Principal',
                    timestamp: new Date(now - 1800000),
                    priority: 'high',
                    category: 'meeting',
                    isRead: false,
                    targetAudience: ['teachers', 'staff'],
                    attachments: []
                },
                {
                    id: 'feed_6',
                    type: 'submission',
                    title: 'New Assignment Submissions',
                    content: '5 students have submitted their assignments for review.',
                    author: 'System',
                    timestamp: new Date(now - 900000), // 15 minutes ago
                    priority: 'normal',
                    category: 'submission',
                    isRead: false,
                    targetAudience: ['teachers'],
                    attachments: []
                }
            );
            
            notifications.push(
                {
                    id: 'notif_3',
                    title: 'New Submissions',
                    message: '5 new assignment submissions to review',
                    type: 'submission',
                    timestamp: new Date(now - 900000),
                    isRead: false,
                    actionUrl: '../teacher/assignments.html'
                },
                {
                    id: 'notif_4',
                    title: 'Staff Meeting',
                    message: 'Monthly staff meeting tomorrow at 2 PM',
                    type: 'meeting',
                    timestamp: new Date(now - 1800000),
                    isRead: false,
                    actionUrl: '#calendar'
                }
            );
        }
        
        return {
            feeds: [...baseFeeds, ...feeds],
            notifications
        };
    }

    /**
     * Setup UI elements
     */
    setupUI() {
        // Setup notification badge
        this.updateNotificationBadge();
        
        // Setup feed containers
        this.setupFeedContainers();
        
        // Setup communication widgets
        this.setupCommunicationWidgets();
    }

    /**
     * Setup feed containers
     */
    setupFeedContainers() {
        // Find and setup main feed container
        const mainFeedContainer = document.getElementById('main-feed-container') || 
                                 document.querySelector('.feed-container') ||
                                 document.querySelector('.communication-feed');
        
        if (mainFeedContainer) {
            this.renderFeeds(mainFeedContainer);
        }
        
        // Setup notification container
        const notificationContainer = document.getElementById('notification-container') ||
                                    document.querySelector('.notification-container');
        
        if (notificationContainer) {
            this.renderNotifications(notificationContainer);
        }
        
        // Setup communication summary
        const summaryContainer = document.getElementById('communication-summary') ||
                               document.querySelector('.communication-summary');
        
        if (summaryContainer) {
            this.renderCommunicationSummary(summaryContainer);
        }
    }

    /**
     * Setup communication widgets for role-based pages
     */
    setupCommunicationWidgets() {
        // Communication widget for dashboard
        const widgetContainer = document.getElementById('communication-widget') ||
                              document.querySelector('.communication-widget');
        
        if (widgetContainer) {
            this.renderCommunicationWidget(widgetContainer);
        }
        
        // Quick actions
        const quickActionsContainer = document.getElementById('quick-actions') ||
                                    document.querySelector('.quick-actions');
        
        if (quickActionsContainer) {
            this.renderQuickActions(quickActionsContainer);
        }
    }

    /**
     * Render feeds in container
     */
    renderFeeds(container, limit = null) {
        if (!container) return;
        
        const feedsToRender = limit ? this.feeds.slice(0, limit) : this.feeds;
        
        if (feedsToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No messages yet</h3>
                    <p>Check back later for updates</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = feedsToRender.map(feed => this.renderFeedCard(feed)).join('');
        
        // Add event listeners to feed cards
        container.querySelectorAll('.feed-card').forEach(card => {
            card.addEventListener('click', () => {
                const feedId = card.dataset.feedId;
                this.handleFeedClick(feedId);
            });
        });
    }

    /**
     * Render individual feed card
     */
    renderFeedCard(feed) {
        const timeAgo = this.getTimeAgo(feed.timestamp);
        const priorityClass = feed.priority !== 'normal' ? `priority-${feed.priority}` : '';
        const unreadClass = !feed.isRead ? 'unread' : '';
        
        return `
            <div class="feed-card ${unreadClass} ${priorityClass}" data-feed-id="${feed.id}">
                <div class="feed-header">
                    <div class="feed-category">
                        <i class="fas ${this.getCategoryIcon(feed.category)}"></i>
                        <span>${this.getCategoryLabel(feed.category)}</span>
                    </div>
                    <div class="feed-meta">
                        <span class="feed-author">${feed.author}</span>
                        <span class="feed-time">${timeAgo}</span>
                    </div>
                </div>
                <div class="feed-content">
                    <h3 class="feed-title">${this.escapeHtml(feed.title)}</h3>
                    <p class="feed-description">${this.escapeHtml(feed.content)}</p>
                    ${feed.attachments.length > 0 ? `
                        <div class="feed-attachments">
                            <i class="fas fa-paperclip"></i>
                            <span>${feed.attachments.length} attachment(s)</span>
                        </div>
                    ` : ''}
                </div>
                <div class="feed-actions">
                    ${!feed.isRead ? `
                        <button class="btn btn-sm btn-primary mark-read-btn" onclick="(async function() { await communicationManager.markAsRead('${feed.id}'); })()">
                            <i class="fas fa-check"></i> Mark as Read
                        </button>
                    ` : ''}
                    ${feed.category === 'assignment' ? `
                        <button class="btn btn-sm btn-secondary" onclick="communicationManager.viewAssignment('${feed.id}')">
                            <i class="fas fa-eye"></i> View Assignment
                        </button>
                    ` : ''}
                    ${feed.category === 'result' ? `
                        <button class="btn btn-sm btn-secondary" onclick="communicationManager.viewResults('${feed.id}')">
                            <i class="fas fa-chart-line"></i> View Results
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render notifications
     */
    renderNotifications(container, limit = 5) {
        if (!container) return;
        
        const notificationsToRender = limit ? this.notifications.slice(0, limit) : this.notifications;
        
        if (notificationsToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell"></i>
                    <h3>No notifications</h3>
                    <p>You're all caught up!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="notification-list">
                ${notificationsToRender.map(notification => `
                    <div class="notification-item ${!notification.isRead ? 'unread' : ''}" data-notification-id="${notification.id}">
                        <div class="notification-icon">
                            <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                        </div>
                        <div class="notification-content">
                            <h4>${this.escapeHtml(notification.title)}</h4>
                            <p>${this.escapeHtml(notification.message)}</p>
                            <span class="notification-time">${this.getTimeAgo(notification.timestamp)}</span>
                        </div>
                        <div class="notification-actions">
                            ${notification.actionUrl ? `
                                <button class="btn btn-sm btn-primary" onclick="communicationManager.handleNotificationAction('${notification.id}', '${notification.actionUrl}')">
                                    <i class="fas fa-external-link-alt"></i>
                                </button>
                            ` : ''}
                            ${!notification.isRead ? `
                                <button class="btn btn-sm btn-secondary" onclick="(async function() { await communicationManager.markNotificationAsRead('${notification.id}'); })()">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render communication summary widget
     */
    renderCommunicationSummary(container) {
        if (!container) return;
        
        const unreadFeeds = this.feeds.filter(feed => !feed.isRead).length;
        const unreadNotifications = this.notifications.filter(notif => !notif.isRead).length;
        const urgentItems = this.feeds.filter(feed => feed.priority === 'urgent').length;
        
        container.innerHTML = `
            <div class="communication-summary-grid">
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${unreadFeeds}</h3>
                        <p>Unread Messages</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${unreadNotifications}</h3>
                        <p>Notifications</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${urgentItems}</h3>
                        <p>Urgent Items</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${this.feeds.length}</h3>
                        <p>Total Messages</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render communication widget for dashboard
     */
    renderCommunicationWidget(container) {
        if (!container) return;
        
        const recentFeeds = this.feeds.slice(0, 3);
        const recentNotifications = this.notifications.slice(0, 3);
        
        container.innerHTML = `
            <div class="communication-widget">
                <div class="widget-header">
                    <h3><i class="fas fa-comments"></i> Recent Communication</h3>
                    <button class="btn btn-sm btn-primary" onclick="communicationManager.openCommunicationCenter()">
                        <i class="fas fa-external-link-alt"></i> View All
                    </button>
                </div>
                <div class="widget-content">
                    <div class="widget-section">
                        <h4>Recent Messages</h4>
                        <div class="recent-items">
                            ${recentFeeds.map(feed => `
                                <div class="recent-item ${!feed.isRead ? 'unread' : ''}" onclick="communicationManager.handleFeedClick('${feed.id}')">
                                    <div class="recent-icon">
                                        <i class="fas ${this.getCategoryIcon(feed.category)}"></i>
                                    </div>
                                    <div class="recent-content">
                                        <h5>${this.escapeHtml(feed.title)}</h5>
                                        <p>${this.truncateText(feed.content, 50)}</p>
                                        <span class="recent-time">${this.getTimeAgo(feed.timestamp)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="widget-section">
                        <h4>Notifications</h4>
                        <div class="recent-items">
                            ${recentNotifications.map(notification => `
                                <div class="recent-item ${!notification.isRead ? 'unread' : ''}" onclick="communicationManager.handleNotificationAction('${notification.id}', '${notification.actionUrl}')">
                                    <div class="recent-icon">
                                        <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                                    </div>
                                    <div class="recent-content">
                                        <h5>${this.escapeHtml(notification.title)}</h5>
                                        <p>${this.escapeHtml(notification.message)}</p>
                                        <span class="recent-time">${this.getTimeAgo(notification.timestamp)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render quick actions based on user role
     */
    renderQuickActions(container) {
        if (!container) return;
        
        let actions = [];
        
        if (this.currentRole === 'student') {
            actions = [
                { icon: 'fas fa-tasks', label: 'View Assignments', action: 'viewAssignments' },
                { icon: 'fas fa-chart-line', label: 'Check Results', action: 'viewResults' },
                { icon: 'fas fa-calendar', label: 'View Schedule', action: 'viewSchedule' },
                { icon: 'fas fa-envelope', label: 'Messages', action: 'openMessages' }
            ];
        } else if (this.currentRole === 'teacher') {
            actions = [
                { icon: 'fas fa-plus', label: 'Create Assignment', action: 'createAssignment' },
                { icon: 'fas fa-grade', label: 'Grade Work', action: 'gradeWork' },
                { icon: 'fas fa-bullhorn', label: 'Send Announcement', action: 'sendAnnouncement' },
                { icon: 'fas fa-users', label: 'Manage Class', action: 'manageClass' }
            ];
        } else if (this.currentRole === 'admin') {
            actions = [
                { icon: 'fas fa-broadcast-tower', label: 'Broadcast', action: 'sendBroadcast' },
                { icon: 'fas fa-users-cog', label: 'Manage Users', action: 'manageUsers' },
                { icon: 'fas fa-chart-bar', label: 'View Reports', action: 'viewReports' },
                { icon: 'fas fa-cog', label: 'Settings', action: 'openSettings' }
            ];
        }
        
        container.innerHTML = `
            <div class="quick-actions-grid">
                ${actions.map(action => `
                    <button class="quick-action-btn" onclick="communicationManager.handleQuickAction('${action.action}')">
                        <i class="${action.icon}"></i>
                        <span>${action.label}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Update notification badge
     */
    updateNotificationBadge() {
        const badges = document.querySelectorAll('.notification-badge, .unread-count');
        
        badges.forEach(badge => {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.openCommunicationCenter();
                        break;
                    case 'm':
                        e.preventDefault();
                        this.markAllAsRead();
                        break;
                }
            }
        });
        
        // Window focus events for real-time updates
        window.addEventListener('focus', () => {
            this.loadFreshData();
        });
        
        // Page visibility API for efficient updates
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadFreshData();
            }
        });
    }

    /**
     * Event handlers
     */
    async handleFeedClick(feedId) {
        const feed = this.feeds.find(f => f.id === feedId);
        if (!feed) return;
        
        // Mark as read
        await this.markAsRead(feedId);
        
        // Handle based on category
        switch (feed.category) {
            case 'assignment':
                this.viewAssignment(feedId);
                break;
            case 'result':
                this.viewResults(feedId);
                break;
            case 'event':
                this.viewEvent(feedId);
                break;
            default:
                this.openFeedDetail(feedId);
        }
    }

    handleNotificationAction(notificationId, actionUrl) {
        // Mark notification as read
        this.markNotificationAsRead(notificationId);
        
        // Navigate to action URL
        if (actionUrl && actionUrl !== '#') {
            if (actionUrl.startsWith('http') || actionUrl.startsWith('/')) {
                window.open(actionUrl, '_blank');
            } else if (actionUrl.startsWith('#')) {
                // Scroll to element or trigger action
                const element = document.querySelector(actionUrl);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                // Navigate to page
                window.location.href = actionUrl;
            }
        }
    }

    handleQuickAction(action) {
        const actions = {
            viewAssignments: () => window.location.href = '../teacher/assignments.html',
            viewResults: () => this.openResultsPanel(),
            viewSchedule: () => this.openSchedule(),
            openMessages: () => this.openCommunicationCenter(),
            createAssignment: () => window.location.href = '../teacher/assignments.html',
            gradeWork: () => this.openGradingPanel(),
            sendAnnouncement: () => this.openAnnouncementComposer(),
            manageClass: () => this.openClassManagement(),
            sendBroadcast: () => window.location.href = '../admin/feed.html',
            manageUsers: () => window.location.href = '../admin/user-management.html',
            viewReports: () => this.openReports(),
            openSettings: () => window.location.href = '../admin/settings.html'
        };
        
        if (actions[action]) {
            actions[action]();
        } else {
            console.warn(`Unknown quick action: ${action}`);
        }
    }

    /**
     * Action methods
     */
    async markAsRead(feedId) {
        const feed = this.feeds.find(f => f.id === feedId);
        if (feed && !feed.isRead) {
            feed.isRead = true;
            this.unreadCount = this.calculateUnreadCount();
            this.updateNotificationBadge();
            this.updateUI();
            
            // Persist state
            await this.saveFeedState();
            
            console.log(`Marked feed ${feedId} as read`);
        }
    }

    async markNotificationAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
            notification.isRead = true;
            this.unreadCount = this.calculateUnreadCount();
            this.updateNotificationBadge();
            this.updateUI();
            
            // Persist state
            await this.saveNotificationState();
            
            console.log(`Marked notification ${notificationId} as read`);
        }
    }

    async markAllAsRead() {
        let changed = false;
        
        this.feeds.forEach(feed => {
            if (!feed.isRead) {
                feed.isRead = true;
                changed = true;
            }
        });
        
        this.notifications.forEach(notification => {
            if (!notification.isRead) {
                notification.isRead = true;
                changed = true;
            }
        });
        
        if (changed) {
            this.unreadCount = 0;
            this.updateNotificationBadge();
            this.updateUI();
            
            // Use Promise.all to save both states concurrently
            await Promise.all([
                this.saveFeedState(),
                this.saveNotificationState()
            ]);
            
            this.showNotification('All items marked as read', 'success');
        }
    }

    viewAssignment(feedId) {
        // Navigate to assignments page or open assignment detail
        if (this.currentRole === 'student') {
            window.location.href = '../teacher/assignments.html';
        } else {
            window.location.href = '../teacher/assignments.html';
        }
    }

    viewResults(feedId) {
        // Open results panel or navigate to results page
        this.openResultsPanel();
    }

    openResultsPanel() {
        // Check if results panel exists on current page
        const resultsPanel = document.getElementById('results-panel') || 
                           document.querySelector('.results-container');
        
        if (resultsPanel) {
            resultsPanel.scrollIntoView({ behavior: 'smooth' });
            resultsPanel.classList.add('highlight');
            setTimeout(() => resultsPanel.classList.remove('highlight'), 2000);
        } else {
            // Navigate to results page
            if (this.currentRole === 'student') {
                window.location.href = 'student-portal.html#results';
            } else {
                window.location.href = '../admin/results.html';
            }
        }
    }

    openCommunicationCenter() {
        // Navigate to communication center based on role
        if (this.currentRole === 'admin') {
            window.location.href = '../admin/feed.html';
        } else {
            window.location.href = '../admin/feed.html';
        }
    }

    openFeedDetail(feedId) {
        const feed = this.feeds.find(f => f.id === feedId);
        if (!feed) return;
        
        // Create modal to show feed details
        this.showFeedModal(feed);
    }

    showFeedModal(feed) {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.className = 'feed-modal';
        modal.innerHTML = `
            <div class="feed-modal-content">
                <div class="feed-modal-header">
                    <h2>${this.escapeHtml(feed.title)}</h2>
                    <button class="close-btn" onclick="this.closest('.feed-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="feed-modal-body">
                    <div class="feed-modal-meta">
                        <span><i class="fas fa-user"></i> ${feed.author}</span>
                        <span><i class="fas fa-clock"></i> ${this.formatDate(feed.timestamp)}</span>
                        <span class="priority-badge priority-${feed.priority}">${feed.priority.toUpperCase()}</span>
                    </div>
                    <div class="feed-modal-content-text">
                        ${this.escapeHtml(feed.content)}
                    </div>
                    ${feed.attachments.length > 0 ? `
                        <div class="feed-modal-attachments">
                            <h3>Attachments</h3>
                            ${feed.attachments.map(attachment => `
                                <div class="attachment-item">
                                    <i class="fas fa-file"></i>
                                    <span>${attachment.name}</span>
                                    <button class="btn btn-sm btn-primary">Download</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="feed-modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.feed-modal').remove()">Close</button>
                    ${!feed.isRead ? `
                        <button class="btn btn-primary" onclick="(async function() { await communicationManager.markAsRead('${feed.id}'); this.closest('.feed-modal').remove(); })()">
                            Mark as Read
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(modal);
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Utility methods
     */
    calculateUnreadCount() {
        const unreadFeeds = this.feeds.filter(feed => !feed.isRead).length;
        const unreadNotifications = this.notifications.filter(notif => !notif.isRead).length;
        return unreadFeeds + unreadNotifications;
    }

    updateUI() {
        // Re-render all UI components
        this.setupFeedContainers();
        this.updateNotificationBadge();
        
        // Emit update event
        this.emit('updated', {
            unreadCount: this.unreadCount,
            feedCount: this.feeds.length,
            notificationCount: this.notifications.length
        });
    }

    getCategoryIcon(category) {
        const icons = {
            announcement: 'fa-bullhorn',
            assignment: 'fa-tasks',
            result: 'fa-chart-line',
            event: 'fa-calendar',
            meeting: 'fa-handshake',
            submission: 'fa-upload',
            staff: 'fa-users',
            news: 'fa-newspaper',
            urgent: 'fa-exclamation-triangle'
        };
        return icons[category] || 'fa-envelope';
    }

    getCategoryLabel(category) {
        const labels = {
            announcement: 'Announcement',
            assignment: 'Assignment',
            result: 'Result',
            event: 'Event',
            meeting: 'Meeting',
            submission: 'Submission',
            staff: 'Staff',
            news: 'News',
            urgent: 'Urgent'
        };
        return labels[category] || 'Message';
    }

    getNotificationIcon(type) {
        const icons = {
            assignment: 'fa-tasks',
            result: 'fa-chart-line',
            meeting: 'fa-handshake',
            submission: 'fa-upload',
            announcement: 'fa-bullhorn',
            event: 'fa-calendar'
        };
        return icons[type] || 'fa-bell';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return new Date(timestamp).toLocaleDateString();
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    truncateText(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `toast-notification toast-${type}`;
        notification.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to page
        const container = document.getElementById('toast-container') || document.body;
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        try {
            // Try to use API client's cache if available
            if (window.apiClient) {
                const cacheKey = `comm_${key}`;
                const cachedData = window.apiClient.localStorageRead('cache', { key: cacheKey });
                
                if (cachedData && cachedData.length > 0) {
                    const data = cachedData[0];
                    
                    if (Date.now() - data.timestamp > this.config.maxCacheAge) {
                        window.apiClient.localStorageDelete('cache', data.id);
                        return null;
                    }
                    
                    return data.value;
                }
                return null;
            } 
            
            // Fallback to localStorage
            const cached = localStorage.getItem(`comm_${key}`);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp > this.config.maxCacheAge) {
                localStorage.removeItem(`comm_${key}`);
                return null;
            }
            
            return data.value;
        } catch (error) {
            console.error('Cache read error:', error);
            return null;
        }
    }

    setCache(key, value) {
        try {
            const cacheData = {
                value,
                timestamp: Date.now()
            };
            
            // Use API client if available
            if (window.apiClient) {
                const cacheKey = `comm_${key}`;
                
                // Check if entry already exists
                const existingCache = window.apiClient.localStorageRead('cache', { key: cacheKey });
                
                if (existingCache && existingCache.length > 0) {
                    // Update existing cache entry
                    window.apiClient.localStorageUpdate('cache', existingCache[0].id, {
                        key: cacheKey,
                        value: value,
                        timestamp: Date.now()
                    });
                } else {
                    // Create new cache entry
                    window.apiClient.localStorageCreate('cache', {
                        key: cacheKey,
                        value: value,
                        timestamp: Date.now()
                    });
                }
            } else {
                // Fallback to localStorage
                localStorage.setItem(`comm_${key}`, JSON.stringify(cacheData));
            }
        } catch (error) {
            console.error('Cache write error:', error);
        }
    }

    async saveFeedState() {
        const feedStates = this.feeds.map(feed => ({
            id: feed.id,
            isRead: feed.isRead
        }));
        
        // Update feed states via API if available
        if (window.apiClient && window.apiClient.apiMode === 'http') {
            try {
                // For each feed, update its read status on the server
                for (const state of feedStates) {
                    await window.apiClient.update('feeds', state.id, { isRead: state.isRead });
                }
                console.log('Feed states saved to API');
            } catch (error) {
                console.error('Failed to save feed states to API:', error);
                // Fallback to cache
                this.setCache('feed_states', feedStates);
            }
        } else {
            // Use cache as usual
            this.setCache('feed_states', feedStates);
        }
    }

    async saveNotificationState() {
        const notificationStates = this.notifications.map(notification => ({
            id: notification.id,
            isRead: notification.isRead
        }));
        
        // Update notification states via API if available
        if (window.apiClient && window.apiClient.apiMode === 'http') {
            try {
                // For each notification, update its read status on the server
                for (const state of notificationStates) {
                    await window.apiClient.update('notifications', state.id, { 
                        isRead: state.isRead,
                        userId: this.currentUser.id
                    });
                }
                console.log('Notification states saved to API');
            } catch (error) {
                console.error('Failed to save notification states to API:', error);
                // Fallback to cache
                this.setCache('notification_states', notificationStates);
            }
        } else {
            // Use cache as usual
            this.setCache('notification_states', notificationStates);
        }
    }

    /**
     * Auto refresh functionality
     */
    startAutoRefresh() {
        if (this.config.autoRefreshInterval > 0) {
            setInterval(() => {
                if (!document.hidden) {
                    this.loadFreshData();
                }
            }, this.config.autoRefreshInterval);
        }
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        // Clear intervals
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        // Clear event listeners
        this.eventListeners.clear();
        
        // Clear cache
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('comm_')) {
                localStorage.removeItem(key);
            }
        });
        
        this.isInitialized = false;
    }
}

// Initialize global communication manager
window.communicationManager = new CommunicationManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.communicationManager.init();
    });
} else {
    window.communicationManager.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommunicationManager;
}