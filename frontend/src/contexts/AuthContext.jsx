import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import apiService from "../services/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !user?.userId) return;
      const fresh = await apiService.getUser(user.userId, token);
      setUser(fresh);
    } catch (err) {
      console.error("refreshUser failed", err);
    }
  }, [user?.userId]);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await apiService.validateToken(token);

      if (response.valid && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      // Fix: Pass username and password directly, not as nested object
      const response = await apiService.login(username, password);

      if (response.token) {
        localStorage.setItem("token", response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: response.error || "Login failed" };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        error: error.message || "Login failed",
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await apiService.register(username, email, password);

      if (response.success && response.token) {
        localStorage.setItem("token", response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: response.message };
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Add solved problem tracking
  const updateSolvedProblem = useCallback((problemId) => {
    setUser((prev) => ({
      ...prev,
      solved: (prev.solved || 0) + 1,
      solvedProblems: [...(prev.solvedProblems || []), problemId],
    }));
  }, []);

  // Update the context value
  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout, // Add logout to context value
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
