import React, { useState, useEffect } from "react";
import { Loader, ChevronRight, CheckCircle } from "lucide-react";
import apiService from "../services/api";
import { DIFFICULTY_COLORS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";

export default function ProblemsPage({ onSelect }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const data = await apiService.getProblems();
        setProblems(data);
      } catch (error) {
        console.error("Failed to fetch problems:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [user?.solved]);

  const handleSelect = (problem) => {
    if (typeof onSelect === "function") {
      onSelect(problem);
    } else {
      console.error("onSelect is not a function");
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
        <p className="text-white text-xl">Loading problems...</p>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-white">Problem Set</h1>
        {user && (
          <div className="text-gray-400 text-sm">
            Solved: {user.solved || 0} / {problems.length}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {problems.map((problem) => {
          const colors =
            DIFFICULTY_COLORS[problem.difficulty] || DIFFICULTY_COLORS.Easy;

          const isSolved = user?.solvedProblems?.includes(problem.id);

          return (
            <div
              key={problem.id}
              onClick={() => handleSelect(problem)}
              className={`bg-slate-800/50 backdrop-blur border rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer group ${
                isSolved ? "border-green-500/30" : "border-purple-500/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Solved Indicator */}
                  {isSolved && (
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-gray-400 font-mono">
                        #{problem.id}
                      </span>
                      <h3
                        className={`text-xl font-semibold transition-colors ${
                          isSolved
                            ? "text-green-400"
                            : "text-white group-hover:text-purple-400"
                        }`}
                      >
                        {problem.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${colors.text} ${colors.bg} ${colors.border}`}
                      >
                        {problem.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <span>{problem.acceptanceRate}% Acceptance</span>
                      <span>•</span>
                      <span>{problem.tags?.join(", ")}</span>
                      {isSolved && (
                        <>
                          <span>•</span>
                          <span className="text-green-400 font-medium">
                            ✓ Solved
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-purple-400 transition-colors flex-shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
