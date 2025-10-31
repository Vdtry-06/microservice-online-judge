import React from "react";
import { ChevronRight, Code, Trophy, Zap } from "lucide-react";

export default function HomePage({ onNavigate }) {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold text-white mb-6">
        Code. Compete.{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Conquer.
        </span>
      </h1>
      <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
        Challenge yourself with coding problems, compete with others, and level
        up your programming skills
      </p>
      <button
        onClick={() => onNavigate("problems")}
        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:scale-105 transform transition-all shadow-2xl"
      >
        Start Coding <ChevronRight className="inline w-5 h-5 ml-2" />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
        {[
          {
            icon: Code,
            title: "Multiple Languages",
            desc: "JavaScript, Python, C++, Java",
          },
          {
            icon: Zap,
            title: "Real-time Judging",
            desc: "Instant feedback on your code",
          },
          {
            icon: Trophy,
            title: "Compete & Rank",
            desc: "Climb the global leaderboard",
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/50 transition-all"
          >
            <feature.icon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-400">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
