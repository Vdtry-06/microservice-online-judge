import React, { useState, useEffect } from 'react';
import { ChevronRight, Code, Trophy, Users, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

// API Service
const API_URL = '/api';

const api = {
  getProblems: () => fetch(`${API_URL}/problems`).then(r => r.json()),
  getProblem: (id) => fetch(`${API_URL}/problems/${id}`).then(r => r.json()),
  submitCode: (data) => fetch(`${API_URL}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  getSubmission: (id) => fetch(`${API_URL}/submission/${id}`).then(r => r.json()),
  getLeaderboard: () => fetch(`${API_URL}/leaderboard`).then(r => r.json()),
};

// Main App Component
export default function OnlineJudge() {
  const [page, setPage] = useState('home');
  const [selectedProblem, setSelectedProblem] = useState(null);

  const renderPage = () => {
    switch(page) {
      case 'problems': return <ProblemsPage onSelect={(p) => { setSelectedProblem(p); setPage('problem'); }} />;
      case 'problem': return <ProblemPage problem={selectedProblem} onBack={() => setPage('problems')} />;
      case 'leaderboard': return <LeaderboardPage />;
      default: return <HomePage onNavigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur-lg border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPage('home')}>
              <Code className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">CodeJudge</span>
            </div>
            <div className="flex gap-6">
              {['problems', 'leaderboard'].map(p => (
                <button 
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    page === p 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:bg-slate-800'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

// Home Page
function HomePage({ onNavigate }) {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold text-white mb-6">
        Code. Compete. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Conquer.</span>
      </h1>
      <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
        Challenge yourself with coding problems, compete with others, and level up your programming skills
      </p>
      <button 
        onClick={() => onNavigate('problems')}
        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:scale-105 transform transition-all shadow-2xl"
      >
        Start Coding <ChevronRight className="inline w-5 h-5 ml-2" />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
        {[
          { icon: Code, title: 'Multiple Languages', desc: 'JavaScript, Python, C++, Java' },
          { icon: Zap, title: 'Real-time Judging', desc: 'Instant feedback on your code' },
          { icon: Trophy, title: 'Compete & Rank', desc: 'Climb the global leaderboard' }
        ].map((feature, i) => (
          <div key={i} className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/50 transition-all">
            <feature.icon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-gray-400">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Problems Page
function ProblemsPage({ onSelect }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProblems().then(data => {
      setProblems(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-20 text-white text-xl">Loading problems...</div>;

  const difficultyColor = {
    Easy: 'text-green-400 bg-green-400/10 border-green-400/30',
    Medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    Hard: 'text-red-400 bg-red-400/10 border-red-400/30'
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-8">Problem Set</h1>
      <div className="space-y-4">
        {problems.map(problem => (
          <div 
            key={problem.id}
            onClick={() => onSelect(problem)}
            className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-gray-400 font-mono">#{problem.id}</span>
                  <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                    {problem.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${difficultyColor[problem.difficulty]}`}>
                    {problem.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <span>{problem.acceptanceRate}% Acceptance</span>
                  <span>•</span>
                  <span>{problem.tags?.join(', ')}</span>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Problem Page with Code Editor
function ProblemPage({ problem, onBack }) {
  const [code, setCode] = useState(`function solve(input) {\n  // Your code here\n  return null;\n}`);
  const [language, setLanguage] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const submission = await api.submitCode({
        code,
        language,
        problemId: problem.id,
        userId: 'user_' + Date.now()
      });

      // Poll for result
      let attempts = 0;
      const pollResult = setInterval(async () => {
        attempts++;
        const res = await api.getSubmission(submission.submissionId);
        if (res.status === 'completed' || res.status === 'failed' || attempts > 30) {
          setResult(res);
          setSubmitting(false);
          clearInterval(pollResult);
        }
      }, 1000);
    } catch (err) {
      setResult({ error: err.message });
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Problem Description */}
      <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
        <button onClick={onBack} className="text-purple-400 hover:text-purple-300 mb-4 flex items-center gap-2">
          ← Back to Problems
        </button>
        <h1 className="text-3xl font-bold text-white mb-4">{problem.title}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border inline-block mb-6 ${
          problem.difficulty === 'Easy' ? 'text-green-400 bg-green-400/10 border-green-400/30' :
          problem.difficulty === 'Medium' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' :
          'text-red-400 bg-red-400/10 border-red-400/30'
        }`}>
          {problem.difficulty}
        </span>
        
        <div className="prose prose-invert max-w-none">
          <h3 className="text-xl font-semibold text-white mb-3">Description</h3>
          <p className="text-gray-300 mb-6">{problem.description}</p>
          
          <h3 className="text-xl font-semibold text-white mb-3">Examples</h3>
          {problem.examples?.map((ex, i) => (
            <div key={i} className="bg-slate-900/50 rounded-lg p-4 mb-4">
              <div className="mb-2">
                <span className="text-gray-400">Input:</span>
                <code className="text-purple-400 ml-2">{ex.input}</code>
              </div>
              <div>
                <span className="text-gray-400">Output:</span>
                <code className="text-green-400 ml-2">{ex.output}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Editor */}
      <div className="space-y-4">
        <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? 'Judging...' : 'Submit Code'}
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-96 bg-slate-900 text-gray-100 font-mono text-sm p-4 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none resize-none"
            spellCheck={false}
          />
        </div>

        {/* Results */}
        {result && (
          <div className={`bg-slate-800/50 backdrop-blur border rounded-xl p-6 ${
            result.status === 'accepted' ? 'border-green-500/50' : 'border-red-500/50'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {result.status === 'accepted' ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-xl font-semibold text-green-400">Accepted!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-400" />
                  <span className="text-xl font-semibold text-red-400">Wrong Answer</span>
                </>
              )}
            </div>
            {result.results && (
              <div className="space-y-2">
                {result.results.map((test, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-slate-900/50 p-3 rounded-lg">
                    <span className="text-gray-400">Test Case {i + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{test.time}ms</span>
                      {test.passed ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Leaderboard Page
function LeaderboardPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.getLeaderboard().then(setUsers);
  }, []);

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
              <tr key={user.userId} className="border-t border-purple-500/10 hover:bg-slate-900/30 transition-colors">
                <td className="px-6 py-4">
                  <span className={`font-bold ${
                    i === 0 ? 'text-yellow-400 text-xl' :
                    i === 1 ? 'text-gray-300 text-lg' :
                    i === 2 ? 'text-orange-400 text-lg' :
                    'text-gray-400'
                  }`}>
                    #{i + 1}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{user.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-purple-400 font-semibold">{user.score}</td>
                <td className="px-6 py-4 text-gray-300">{user.solved} problems</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}