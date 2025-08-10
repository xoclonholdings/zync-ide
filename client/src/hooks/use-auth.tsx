import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema-sqlite";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  });

  // Check authentication status
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const response = await fetch("/api/auth/me", {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Authentication failed");
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  const user = userData?.user || null;
  const isAuthenticated = !!user && !!token;

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    },
    onSettled: () => {
      // Clear auth state regardless of API call success
      setToken(null);
      localStorage.removeItem('auth_token');
      queryClient.clear();
      setLocation('/login');
    },
  });

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
    
    // Update the query cache with the user data
    queryClient.setQueryData(["/api/auth/me"], {
      success: true,
      user: newUser,
    });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  // Handle authentication errors
  useEffect(() => {
    if (error && token) {
      // Token is invalid, clear it
      setToken(null);
      localStorage.removeItem('auth_token');
      queryClient.clear();
      setLocation('/login');
    }
  }, [error, token, setLocation, queryClient]);

  // Redirect based on auth state
  useEffect(() => {
    if (!isLoading) {
      const currentPath = window.location.pathname;
      
      if (!isAuthenticated && currentPath !== '/login') {
        setLocation('/login');
      } else if (isAuthenticated && currentPath === '/login') {
        setLocation('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Add token to default headers if available
  useEffect(() => {
    if (token) {
      // Set default authorization header for all API requests
      queryClient.setDefaultOptions({
        queries: {
          ...queryClient.getDefaultOptions().queries,
          queryFn: async ({ queryKey }) => {
            const response = await fetch(queryKey.join("/") as string, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (!response.ok) {
              if (response.status === 401) {
                // Token expired or invalid
                setToken(null);
                localStorage.removeItem('auth_token');
                setLocation('/login');
                throw new Error("Authentication expired");
              }
              throw new Error(`${response.status}: ${response.statusText}`);
            }
            
            return response.json();
          },
        },
      });
    }
  }, [token, queryClient, setLocation]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
