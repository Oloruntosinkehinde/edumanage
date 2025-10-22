/**
 * Tophill Portal API Client
 * Handles all communication with the backend API
 * Allows switching between localStorage and HTTP backends
 */

class ApiClient {
    constructor() {
        this.apiMode = 'localStorage'; // 'localStorage' or 'http'
        this.apiBaseUrl = 'http://localhost:3000/api'; // Change this to your API URL
        this.authToken = null;
        this.listeners = {};

        // Try to load auth token from storage
        this.loadAuthToken();
    }

    /**
     * Switch between API modes (localStorage or HTTP)
     * @param {string} mode - 'localStorage' or 'http'
     * @returns {boolean} - Success status
     */
    setMode(mode) {
        if (['localStorage', 'http'].includes(mode)) {
            this.apiMode = mode;
            console.log(`API Mode set to: ${mode}`);
            return true;
        }
        console.error(`Invalid API mode: ${mode}`);
        return false;
    }

    /**
     * Set the base URL for HTTP API calls
     * @param {string} url - Base URL for API
     */
    setBaseUrl(url) {
        this.apiBaseUrl = url;
        console.log(`API Base URL set to: ${url}`);
    }

    /**
     * Load auth token from localStorage
     */
    loadAuthToken() {
        this.authToken = localStorage.getItem('Tophill Portal_auth_token');
    }

    /**
     * Save auth token to localStorage
     * @param {string} token - JWT auth token
     */
    saveAuthToken(token) {
        this.authToken = token;
        if (token) {
            localStorage.setItem('Tophill Portal_auth_token', token);
        } else {
            localStorage.removeItem('Tophill Portal_auth_token');
        }
    }

    /**
     * Make a HTTP request to the API
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {string} endpoint - API endpoint (e.g. /students)
     * @param {Object} data - Request payload
     * @returns {Promise<Object>} - Response data
     */
    async httpRequest(method, endpoint, data = null) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Add auth token if available
        if (this.authToken) {
            options.headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        // Add request body for POST/PUT requests
        if (data && ['POST', 'PUT'].includes(method)) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            // Handle unauthorized responses (expired token, etc.)
            if (response.status === 401) {
                this.saveAuthToken(null); // Clear token
                this.emit('auth:unauthorized');
                throw new Error('Authentication required');
            }

            const result = await response.json();
            
            // If response contains a token, save it
            if (result.token) {
                this.saveAuthToken(result.token);
            }

            if (!response.ok) {
                throw new Error(result.message || 'API request failed');
            }

            return result;
        } catch (error) {
            console.error(`API ${method} request to ${endpoint} failed:`, error);
            throw error;
        }
    }

    /**
     * Get data from localStorage
     * @param {string} type - Data type (e.g. 'students')
     * @param {Object} filters - Optional filters
     * @returns {Array|Object} - Data from localStorage
     */
    localStorageRead(type, filters = {}) {
        try {
            // Load all data from localStorage
            const allData = JSON.parse(localStorage.getItem('Tophill Portal_data')) || {};
            
            // Get specific collection
            const collection = allData[type] || [];

            // Apply filters if provided
            if (Object.keys(filters).length) {
                return collection.filter(item => {
                    return Object.entries(filters).every(([key, value]) => {
                        return item[key] === value;
                    });
                });
            }

            return collection;
        } catch (error) {
            console.error(`Error reading ${type} from localStorage:`, error);
            return [];
        }
    }

    /**
     * Save data to localStorage
     * @param {string} type - Data type (e.g. 'students')
     * @param {Array|Object} data - Data to save
     * @returns {boolean} - Success status
     */
    localStorageSave(type, data) {
        try {
            // Load existing data
            const allData = JSON.parse(localStorage.getItem('Tophill Portal_data')) || {};
            
            // Update the specific collection
            allData[type] = data;
            
            // Save back to localStorage
            localStorage.setItem('Tophill Portal_data', JSON.stringify(allData));
            
            return true;
        } catch (error) {
            console.error(`Error saving ${type} to localStorage:`, error);
            return false;
        }
    }

    /**
     * Create a new item in localStorage
     * @param {string} type - Data type (e.g. 'students')
     * @param {Object} data - Item data
     * @returns {Object} - Created item
     */
    localStorageCreate(type, data) {
        // Add metadata
        const now = new Date().toISOString();
        const newItem = {
            ...data,
            id: data.id || `${type.charAt(0).toUpperCase()}${String(Date.now()).slice(-6)}`,
            createdAt: now,
            updatedAt: now
        };

        // Get current collection
        const collection = this.localStorageRead(type);
        
        // Add new item
        collection.push(newItem);
        
        // Save updated collection
        this.localStorageSave(type, collection);
        
        return newItem;
    }

    /**
     * Update an item in localStorage
     * @param {string} type - Data type (e.g. 'students')
     * @param {string} id - Item ID
     * @param {Object} data - Updated data
     * @returns {Object} - Updated item
     */
    localStorageUpdate(type, id, data) {
        // Get current collection
        const collection = this.localStorageRead(type);
        
        // Find item index
        const index = collection.findIndex(item => item.id === id);
        
        if (index === -1) {
            throw new Error(`${type} with ID ${id} not found`);
        }
        
        // Update item
        collection[index] = {
            ...collection[index],
            ...data,
            updatedAt: new Date().toISOString()
        };
        
        // Save updated collection
        this.localStorageSave(type, collection);
        
        return collection[index];
    }

    /**
     * Delete an item from localStorage
     * @param {string} type - Data type (e.g. 'students')
     * @param {string} id - Item ID
     * @returns {boolean} - Success status
     */
    localStorageDelete(type, id) {
        // Get current collection
        const collection = this.localStorageRead(type);
        
        // Filter out the item to delete
        const updatedCollection = collection.filter(item => item.id !== id);
        
        // If nothing was removed, item wasn't found
        if (updatedCollection.length === collection.length) {
            throw new Error(`${type} with ID ${id} not found`);
        }
        
        // Save updated collection
        this.localStorageSave(type, updatedCollection);
        
        return true;
    }

    // ==================== CRUD OPERATIONS ====================

    /**
     * Create a new item
     * @param {string} type - Data type (e.g. 'students')
     * @param {Object} data - Item data
     * @returns {Promise<Object>} - Created item
     */
    async create(type, data) {
        if (this.apiMode === 'localStorage') {
            return this.localStorageCreate(type, data);
        } else {
            const result = await this.httpRequest('POST', `/${type}`, data);
            return result.data;
        }
    }

    /**
     * Read items from the database
     * @param {string} type - Data type (e.g. 'students')
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} - Items matching filters
     */
    async read(type, filters = {}) {
        if (this.apiMode === 'localStorage') {
            return this.localStorageRead(type, filters);
        } else {
            // Convert filters to query string
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                queryParams.append(key, value);
            });
            
            const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
            const result = await this.httpRequest('GET', `/${type}${query}`);
            return result.data;
        }
    }

    /**
     * Get a single item by ID
     * @param {string} type - Data type (e.g. 'students')
     * @param {string} id - Item ID
     * @returns {Promise<Object>} - Item
     */
    async get(type, id) {
        if (this.apiMode === 'localStorage') {
            const items = this.localStorageRead(type);
            const item = items.find(item => item.id === id);
            
            if (!item) {
                throw new Error(`${type} with ID ${id} not found`);
            }
            
            return item;
        } else {
            const result = await this.httpRequest('GET', `/${type}/${id}`);
            return result.data;
        }
    }

    /**
     * Update an existing item
     * @param {string} type - Data type (e.g. 'students')
     * @param {string} id - Item ID
     * @param {Object} data - Updated data
     * @returns {Promise<Object>} - Updated item
     */
    async update(type, id, data) {
        if (this.apiMode === 'localStorage') {
            return this.localStorageUpdate(type, id, data);
        } else {
            const result = await this.httpRequest('PUT', `/${type}/${id}`, data);
            return result.data;
        }
    }

    /**
     * Delete an item
     * @param {string} type - Data type (e.g. 'students')
     * @param {string} id - Item ID
     * @returns {Promise<boolean>} - Success status
     */
    async delete(type, id) {
        if (this.apiMode === 'localStorage') {
            return this.localStorageDelete(type, id);
        } else {
            await this.httpRequest('DELETE', `/${type}/${id}`);
            return true;
        }
    }

    // ==================== AUTHENTICATION ====================

    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - User data
     */
    async login(email, password) {
        if (this.apiMode === 'localStorage') {
            // Load all users
            const users = this.localStorageRead('users');
            
            // Find matching user
            const user = users.find(u => u.email === email && u.password === password);
            
            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Create a simple JWT-like token (for compatibility)
            const token = btoa(JSON.stringify({
                userId: user.id,
                role: user.role,
                exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
            }));
            
            this.saveAuthToken(token);
            
            // Remove sensitive data
            const { password: _, ...userData } = user;
            return userData;
        } else {
            const result = await this.httpRequest('POST', '/auth/login', { email, password });
            
            if (result.token) {
                this.saveAuthToken(result.token);
            }
            
            return result.user;
        }
    }

    /**
     * Logout current user
     */
    async logout() {
        if (this.apiMode === 'localStorage') {
            this.saveAuthToken(null);
            return true;
        } else {
            try {
                await this.httpRequest('POST', '/auth/logout');
            } catch (error) {
                console.error('Logout failed:', error);
            }
            
            this.saveAuthToken(null);
            return true;
        }
    }

    /**
     * Get current authenticated user
     * @returns {Promise<Object|null>} - User data or null if not authenticated
     */
    async getCurrentUser() {
        if (!this.authToken) {
            return null;
        }

        if (this.apiMode === 'localStorage') {
            try {
                // Decode token
                const tokenData = JSON.parse(atob(this.authToken));
                
                // Check expiration
                if (tokenData.exp < Date.now()) {
                    this.saveAuthToken(null);
                    return null;
                }
                
                // Find user
                const users = this.localStorageRead('users');
                const user = users.find(u => u.id === tokenData.userId);
                
                if (!user) {
                    this.saveAuthToken(null);
                    return null;
                }
                
                // Remove sensitive data
                const { password: _, ...userData } = user;
                return userData;
            } catch (error) {
                this.saveAuthToken(null);
                return null;
            }
        } else {
            try {
                const result = await this.httpRequest('GET', '/auth/me');
                return result.user;
            } catch (error) {
                this.saveAuthToken(null);
                return null;
            }
        }
    }

    // ==================== EVENT HANDLING ====================

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Emit event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => callback(data));
    }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export for global access
window.apiClient = apiClient;

// Export for module use
export default apiClient;