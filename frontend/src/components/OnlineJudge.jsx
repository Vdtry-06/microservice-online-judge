import React, { useState } from "react";
import { Code } from "lucide-react";

import HomePage from "./HomePage";
import ProblemsPage from "./ProblemsPage";
import ProblemPage from "./ProblemPage";
import LeaderboardPage from "./LeaderboardPage";

// Main App Component
export default function OnlineJudge() {
  const [page, setPage] = useState("home");
  const [selectedProblem, setSelectedProblem] = useState(null);

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
      <nav className="bg-slate-900/50 backdrop-blur-lg border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setPage("home")}
            >
              <Code className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">CodeJudge</span>
            </div>
            <div className="flex gap-6">
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
