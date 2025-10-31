import React, { useState } from "react";
import { Code, Loader, AlertCircle, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth(); // Make sure to destructure login correctly

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call login with individual parameters, not an object
      const result = await login(formData.username, formData.password);

      if (result.success) {
        onLoginSuccess?.(); // Use optional chaining
      } else {
        setError(result.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Code className="w-12 h-12 text-purple-400" />
            <span className="text-4xl font-bold text-white">CodeJudge</span>
          </div>
          <p className="text-gray-400">
            {isLogin ? "Welcome back!" : "Create your account"}
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                isLogin
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700/50 text-gray-400 hover:bg-slate-700"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                !isLogin
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700/50 text-gray-400 hover:bg-slate-700"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-medium">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Email (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {isLogin ? "Logging in..." : "Creating account..."}
                </>
              ) : (
                <>{isLogin ? "Login" : "Create Account"}</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setError("");
                  }}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setError("");
                  }}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Login here
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
