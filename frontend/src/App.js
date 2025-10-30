import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost/api';

function App() {
  const [code, setCode] = useState(`function solve(nums, target) {
  // Write your solution here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`);
  
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('idle');
  const [executionTime, setExecutionTime] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);

  useEffect(() => {
    loadProblems();
    loadSubmissions();
  }, []);

  const loadProblems = async () => {
    try {
      const response = await axios.get(`${API_URL}/problems`);
      setProblems(response.data);
      if (response.data.length > 0) {
        setSelectedProblem(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load problems:', error);
      setProblems([{
        id: 1,
        title: 'Two Sum',
        difficulty: 'Easy',
        description: 'Given an array of integers nums and an integer target, return indices of two numbers that add up to target.',
        testCases: [
          { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
          { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] }
        ]
      }]);
    }
  };

  const loadSubmissions = async () => {
    try {
      const response = await axios.get(`${API_URL}/submissions`);
      setSubmissions(response.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const handleSubmit = async () => {
    setStatus('running');
    setOutput('Submitting to judge server...\n');
    
    try {
      const response = await axios.post(`${API_URL}/submit`, {
        code,
        language,
        testCases: selectedProblem?.testCases || [
          { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] }
        ]
      });
      
      setExecutionTime(response.data.executionTime);
      
      if (response.data.status === 'accepted') {
        setStatus('accepted');
        setOutput(`✓ All test cases passed!\n\nJudge Server: ${response.data.judgeId}\n` +
          response.data.results.map((r, i) => 
            `Test Case ${i + 1}: Passed (${r.time}ms)`
          ).join('\n') +
          `\n\nMemory: ${response.data.memory.toFixed(2)} MB\nExecution Time: ${response.data.executionTime}ms`
        );
      } else {
        setStatus('failed');
        setOutput(`✗ ${response.data.status}\n\nJudge Server: ${response.data.judgeId}\n` +
          response.data.results.map((r, i) => 
            `Test Case ${i + 1}: ${r.passed ? 'Passed' : 'Failed'}\n` +
            (r.error ? `Error: ${r.error}` : `Expected: ${JSON.stringify(r.expected)}\nGot: ${JSON.stringify(r.output)}`)
          ).join('\n\n')
        );
      }
      
      loadSubmissions();
    } catch (error) {
      setStatus('failed');
      setOutput(`✗ Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'Easy': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = () => {
    switch(status) {
      case 'accepted': return 'bg-green-50 border-green-500 text-green-900';
      case 'failed': return 'bg-red-50 border-red-500 text-red-900';
      case 'running': return 'bg-blue-50 border-blue-500 text-blue-900';
      default: return 'bg-gray-50 border-gray-300 text-gray-900';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              MJ
            </div>
            <h1 className="text-2xl font-bold text-gray-800">MicroJudge</h1>
            <span className="ml-4 text-sm text-gray-600 bg-green-100 px-3 py-1 rounded-full">
              ● System Online
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Load Balanced • 3 Nodes Active
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Problem List */}
        <div className="col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Problems</h2>
            <div className="space-y-2">
              {problems.map(problem => (
                <div 
                  key={problem.id}
                  onClick={() => setSelectedProblem(problem)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                    selectedProblem?.id === problem.id 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-transparent bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-800">{problem.title}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Recent Submissions</h2>
            <div className="space-y-2">
              {submissions.length === 0 ? (
                <p className="text-sm text-gray-500">No submissions yet</p>
              ) : (
                submissions.map((sub, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded text-xs border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800">Problem #{sub.id}</span>
                      <span className={sub.result?.status === 'accepted' ? 'text-green-600' : 'text-red-600'}>
                        {sub.result?.status === 'accepted' ? '✓ AC' : '✗ WA'}
                      </span>
                    </div>
                    <div className="text-gray-600">{sub.result?.executionTime}ms</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Editor */}
        <div className="col-span-9 space-y-4">
          {/* Problem Description */}
          {selectedProblem && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold mb-3 text-gray-800">{selectedProblem.title}</h2>
              <span className={`inline-block px-3 py-1 rounded text-sm mb-4 ${getDifficultyColor(selectedProblem.difficulty)}`}>
                {selectedProblem.difficulty}
              </span>
              <p className="text-gray-700 mb-4">{selectedProblem.description}</p>
              <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono border border-gray-200">
                <div><span className="text-purple-600 font-bold">Input:</span> {JSON.stringify(selectedProblem.testCases[0].input)}</div>
                <div><span className="text-purple-600 font-bold">Output:</span> {JSON.stringify(selectedProblem.testCases[0].expected)}</div>
              </div>
            </div>
          )}

          {/* Code Editor */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white text-gray-800 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-purple-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
              
              <button
                onClick={handleSubmit}
                disabled={status === 'running'}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'running' ? 'Running...' : 'Submit'}
              </button>
            </div>
            
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-80 bg-gray-50 text-gray-800 p-4 font-mono text-sm focus:outline-none resize-none"
              spellCheck="false"
            />
          </div>

          {/* Output */}
          {output && (
            <div className={`rounded-xl p-4 border-2 shadow-lg ${getStatusColor()}`}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-bold">
                  {status === 'accepted' && '✓ Accepted'}
                  {status === 'failed' && '✗ Wrong Answer'}
                  {status === 'running' && '⏳ Running Tests...'}
                  {status === 'idle' && 'Output'}
                </h3>
                {executionTime > 0 && (
                  <span className="ml-auto text-sm">Runtime: {executionTime}ms</span>
                )}
              </div>
              <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;