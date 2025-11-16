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
      if (!token) return null;

      let userId = user?.userId;

      if (!userId) {
        const verify = await apiService.verifyToken(token);
        userId = verify?.user?.userId;
      }

      if (!userId) return null;

      const fresh = await apiService.getUser(userId, token);
      // console.log("refreshUser fetched:", fresh);
      if (fresh) {
        setUser(fresh);
        setIsAuthenticated(true);
      }
      return fresh;
    } catch (err) {
      console.error("refreshUser failed", err);
      return null;
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

      const response = await apiService.verifyToken(token);

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
      const response = await apiService.register({ username, email, password });

      if (response && (response.success || response.user)) {
        return { success: true, user: response.user };
      }

      return {
        success: false,
        error: response.error || response.message || "Registration failed",
      };
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        error: error.message || "Registration failed",
      };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
