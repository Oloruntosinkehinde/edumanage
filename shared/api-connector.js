// Example of how to connect the frontend to the new REST API backend

document.addEventListener('DOMContentLoaded', function() {
  // Check if the API client is already initialized
  if (window.apiClient) {
    console.log('Switching API client to HTTP mode');
    
    // Switch to HTTP mode
    apiClient.setMode('http');
    
    // Set the base URL for API calls
    apiClient.setBaseUrl('http://localhost:3000/api');
    
    // Add event listener for unauthorized events
    apiClient.on('auth:unauthorized', () => {
      console.log('Authentication required. Redirecting to login...');
      
      // Redirect to login page if not already there
      if (!window.location.href.includes('login')) {
        window.location.href = '/admin/admin-login.html';
      }
    });
    
    // Test connection to API
    fetch('http://localhost:3000/api/health')
      .then(response => response.json())
      .then(data => {
        console.log('API connection successful:', data);
        
        // Display API status if the element exists
        const apiStatus = document.getElementById('api-status');
        if (apiStatus) {
          apiStatus.textContent = 'Connected';
          apiStatus.classList.add('connected');
        }
      })
      .catch(error => {
        console.error('API connection failed:', error);
        
        // Display API status if the element exists
        const apiStatus = document.getElementById('api-status');
        if (apiStatus) {
          apiStatus.textContent = 'Disconnected (Using Local Storage)';
          apiStatus.classList.add('disconnected');
          
          // Fallback to localStorage mode
          apiClient.setMode('localStorage');
        }
      });
  } else {
    console.error('API client not initialized');
  }
});