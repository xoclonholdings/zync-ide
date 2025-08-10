import { apiRequest } from "./queryClient";
import type { User, InsertUser } from "@shared/schema";

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData extends InsertUser {}

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  private constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      const data = await response.json();
      
      if (data.success) {
        this.token = data.token;
        this.user = data.user;
        
        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token);
        }
      }
      
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Login failed"
      };
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Registration failed"
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await apiRequest("POST", "/api/auth/logout", {});
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn("Logout API call failed:", error);
    } finally {
      // Clear local state
      this.token = null;
      this.user = null;
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, clear it
          this.clearAuth();
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        this.user = data.user;
        return data.user;
      } else {
        throw new Error(data.error || "Failed to get user");
      }
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  }

  async validateToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    const user = await this.getCurrentUser();
    return !!user;
  }

  private clearAuth(): void {
    this.token = null;
    this.user = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  // Set up automatic token refresh
  setupTokenRefresh(): void {
    if (typeof window !== 'undefined') {
      // Check token validity every 5 minutes
      setInterval(async () => {
        if (this.token) {
          const isValid = await this.validateToken();
          if (!isValid) {
            this.clearAuth();
            // Could trigger a re-login flow here
            window.location.href = '/login';
          }
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
  }

  // Utility method to add auth headers to requests
  getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Helper method for making authenticated API requests
  async authenticatedRequest(
    method: string,
    url: string,
    data?: unknown
  ): Promise<Response> {
    const headers = {
      ...this.getAuthHeaders(),
      ...(data ? { 'Content-Type': 'application/json' } : {})
    };

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (response.status === 401) {
      // Token expired or invalid
      this.clearAuth();
      throw new Error("Authentication expired");
    }

    return response;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Helper functions for common operations
export const login = (credentials: LoginCredentials) => authService.login(credentials);
export const register = (userData: RegisterData) => authService.register(userData);
export const logout = () => authService.logout();
export const getCurrentUser = () => authService.getCurrentUser();
export const getAuthToken = () => authService.getToken();
export const isAuthenticated = () => authService.isAuthenticated();
