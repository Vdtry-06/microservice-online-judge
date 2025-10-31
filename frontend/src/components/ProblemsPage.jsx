import React, { useState, useEffect } from "react";
import { Loader, ChevronRight } from "lucide-react";
import apiService from "../services/api";
import { DIFFICULTY_COLORS } from "../utils/constants";
export default function ProblemsPage({ onSelect }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sử dụng apiService
    apiService.getProblems().then((data) => {
      setProblems(data);
      setLoading(false);
    });
  }, []);

  if (loading)
    return (
      <div className="text-center py-20">
        <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
        <p className="text-white text-xl">Loading problems...</p>
      </div>
    );

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-8">Problem Set</h1>
      <div className="space-y-4">
        {problems.map((problem) => {
          // Lấy màu từ hằng số
          const colors =
            DIFFICULTY_COLORS[problem.difficulty] || DIFFICULTY_COLORS.Easy;

          return (
            <div
              key={problem.id}
              onClick={() => onSelect(problem)}
              className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-gray-400 font-mono">
                      #{problem.id}
                    </span>
                    <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
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
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
