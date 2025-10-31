import React, { useState } from "react";
import { Code, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

import HomePage from "./HomePage";
import ProblemsPage from "./ProblemsPage";
import ProblemPage from "./ProblemPage";
import LeaderboardPage from "./LeaderboardPage";
import LoginPage from "./LoginPage";

export default function OnlineJudge() {
  const [page, setPage] = useState("home");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const { user, isAuthenticated, logout, loading } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Code className="w-16 h-16 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setPage("home")} />;
  }

  const handleLogout = async () => {
    await logout();
    setPage("home");
  };

  const renderPage = () => {
    switch (page) {
      case "problems":
        return (
          <ProblemsPage
            onSelect={(p) => {
              setSelectedProblem(p);
              setPage("problem");
            }}
          />
        );
      case "problem":
        return (
          <ProblemPage
            problem={selectedProblem}
            onBack={() => setPage("problems")}
          />
        );
      case "leaderboard":
        return <LeaderboardPage />;
      default:
        return <HomePage onNavigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="bg-slate-900/50 backdrop-blur-lg border-b border-purple-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setPage("home")}
            >
              <Code className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">CodeJudge</span>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-6">
              {["problems", "leaderboard"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    page === p
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-slate-800"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-6 border-l border-purple-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user?.username?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="text-white font-medium">{user?.username}</p>
                    <p className="text-gray-400 text-xs">
                      {user?.score || 0} points • {user?.solved || 0} solved
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}
