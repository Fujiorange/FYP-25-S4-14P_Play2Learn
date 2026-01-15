// src/services/authService.js
// MongoDB Authentication Service for Play2Learn

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthService {
  // Register new user (MongoDB)
  async register(userData) {
    try {
      const response = await fetch(`${API_URL}/mongo/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          contact: userData.contact,
          gender: userData.gender,
          organizationName: userData.organizationName,
          organizationType: userData.organizationType,
          businessRegistrationNumber: userData.businessRegistrationNumber,
          role: userData.role
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, message: 'Account created successfully', user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
    }
  }

  // Login user (MongoDB)
  async login(email, password, role) {
    try {
      const response = await fetch(`${API_URL}/mongo/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
    }
  }

  // Logout user
  async logout() {
    try {
      const token = this.getToken();
      
      if (token) {
        // Optional: call logout endpoint if you add one
        // await fetch(`${API_URL}/mongo/auth/logout`, {...});
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Get current user from localStorage
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expirationTime;
    } catch (error) {
      return false;
    }
  }

  // Get current user data from server (with fresh token verification)
  async getCurrentUserFromServer() {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      // This would need a corresponding MongoDB endpoint
      // For now, return stored user
      const user = this.getCurrentUser();
      if (user) {
        return { success: true, user: user };
      } else {
        return { success: false, error: 'No user found' };
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Get dashboard data (MongoDB)
  async getDashboardData() {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      // For now, return success with stored user data
      // You can add MongoDB dashboard endpoint later
      const user = this.getCurrentUser();
      
      if (user) {
        // Return mock dashboard data based on role
        let dashboardData = {};
        
        if (user.role === 'student') {
          dashboardData = {
            points: 0,
            level: 1,
            total_courses: 0
          };
        } else if (user.role === 'teacher') {
          dashboardData = {
            total_courses: 0
          };
        }

        return { 
          success: true, 
          data: dashboardData 
        };
      }

      return { success: false, error: 'No user data' };
    } catch (error) {
      console.error('Dashboard error:', error);
      return { success: false, error: 'Failed to load dashboard data' };
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;