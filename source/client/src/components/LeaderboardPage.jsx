import React, { useState, useEffect } from "react";
import { Loader, Trophy } from "lucide-react";
import apiService from "../services/api";

export default function LeaderboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await apiService.getLeaderboard();
        if (mounted) setUsers(data);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        if (mounted) setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    const handler = () => {
      load();
    };
    window.addEventListener("user:updated", handler);

    return () => {
      mounted = false;
      window.removeEventListener("user:updated", handler);
    };
  }, []);

  if (loading)
    return (
      <div className="text-center py-20">
        <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
        <p className="text-white text-xl">Loading leaderboard...</p>
      </div>
    );

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
        <Trophy className="w-10 h-10 text-yellow-400" />
        Global Leaderboard
      </h1>
      <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr className="text-left">
              <th className="px-6 py-4 text-gray-400 font-semibold">Rank</th>
              <th className="px-6 py-4 text-gray-400 font-semibold">User</th>
              <th className="px-6 py-4 text-gray-400 font-semibold">Score</th>
              <th className="px-6 py-4 text-gray-400 font-semibold">Solved</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr
                key={user.userId}
                className="border-t border-purple-500/10 hover:bg-slate-900/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <span
                    className={`font-bold ${
                      i === 0
                        ? "text-yellow-400 text-xl"
                        : i === 1
                        ? "text-gray-300 text-lg"
                        : i === 2
                        ? "text-orange-400 text-lg"
                        : "text-gray-400"
                    }`}
                  >
                    #{i + 1}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="text-white font-medium">
                      {user.username}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-purple-400 font-semibold">
                  {user.score}
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {user.solved} problems
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
