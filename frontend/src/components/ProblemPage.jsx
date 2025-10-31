import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Bug,
  Loader,
  Play,
  AlertCircle,
  CheckCheck,
} from "lucide-react";
import { LANGUAGES, DIFFICULTY_COLORS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";

export default function ProblemPage({ problem, onBack }) {
  const [code, setCode] = useState(LANGUAGES.javascript.template);
  const [language, setLanguage] = useState("javascript");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [syntaxError, setSyntaxError] = useState(null);
  const [testRunResult, setTestRunResult] = useState(null);
  const [isSolved, setIsSolved] = useState(false);

  const { user, refreshUser } = useAuth();
  const abortControllerRef = useRef(null);

  const colors =
    DIFFICULTY_COLORS[problem.difficulty] || DIFFICULTY_COLORS.Easy;

  // Check if user has solved this problem
  useEffect(() => {
    if (user && problem) {
      const solved = user.solvedProblems?.includes(problem.id);
      setIsSolved(solved);
    }
  }, [user, problem]);

  const checkSyntax = () => {
    setSyntaxError(null);
    try {
      if (language === "javascript") {
        new Function(code);
        setSyntaxError({ type: "success", message: "✓ Syntax is valid!" });
      } else {
        setSyntaxError({
          type: "info",
          message: "Syntax check only available for JavaScript",
        });
      }
    } catch (err) {
      setSyntaxError({ type: "error", message: err.message });
    }
  };

  const runTest = () => {
    setTestRunResult(null);
    if (language !== "javascript") {
      setTestRunResult({ error: "Test run only supports JavaScript" });
      return;
    }

    const testCase = problem.examples?.[0];
    if (!testCase) {
      setTestRunResult({ error: "No test case available" });
      return;
    }

    let input;
    try {
      input = JSON.parse(testCase.input);
    } catch {
      input = testCase.input;
    }

    try {
      const fn = new Function("input", `${code}\nreturn solve(input);`);
      const output = fn(input);
      const expectedOutput = JSON.parse(testCase.output);

      setTestRunResult({
        input,
        output,
        expected: expectedOutput,
        passed: JSON.stringify(output) === JSON.stringify(expectedOutput),
      });
    } catch (err) {
      setTestRunResult({ error: err.message });
    }
  };

  const handleSubmit = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setSubmitting(true);
    setResult(null);
    setPollCount(0);

    try {
      if (debugMode) console.log("Submitting code...");

      const submission = await apiService.submitCode({
        code,
        language,
        problemId: problem.id,
        userId: user.userId,
      });

      if (debugMode)
        console.log("Submission created:", submission.submissionId);

      let attempts = 0;
      const maxAttempts = 20;

      const poll = async () => {
        if (signal.aborted) {
          if (debugMode) console.log("Polling aborted");
          return;
        }
        attempts++;
        setPollCount(attempts);

        if (attempts > maxAttempts) {
          setSubmitting(false);
          setResult({
            status: "timeout",
            error: "Judging took too long. Please try again.",
          });
          if (debugMode) console.log("Timeout after", attempts, "polls");
          return;
        }

        try {
          if (debugMode) console.log(`Poll ${attempts}/${maxAttempts}`);
          const res = await apiService.getSubmission(submission.submissionId);

          if (signal.aborted) {
            if (debugMode) console.log("Result received but aborted");
            return;
          }

          if (
            res.status === "accepted" ||
            res.status === "wrong_answer" ||
            res.status === "failed"
          ) {
            if (debugMode)
              console.log("Complete in", attempts, "polls:", res.status);
            setResult(res);
            setSubmitting(false);

            // If accepted and wasn't solved before, refresh user data
            if (res.status === "accepted" && !isSolved) {
              setIsSolved(true);
              // Refresh user data to update solved problems list
              if (refreshUser) {
                await refreshUser();
              }
            }

            return;
          }

          if (debugMode) console.log("Still", res.status, "- waiting 1s");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (!signal.aborted) {
            await poll();
          }
        } catch (error) {
          if (signal.aborted) return;
          if (debugMode) console.error("Poll error:", error);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (!signal.aborted) {
            await poll();
          }
        }
      };
      poll();
    } catch (err) {
      console.error("Submit error:", err);
      setResult({ error: err.message });
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (problem && LANGUAGES[language]) {
      setCode(LANGUAGES[language].template);
    }
  }, [problem, language]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Problem Description */}
      <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
        <button
          onClick={onBack}
          className="text-purple-400 hover:text-purple-300 mb-4 flex items-center gap-2"
        >
          ← Back to Problems
        </button>

        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold text-white">{problem.title}</h1>
          {isSolved && (
            <div className="flex items-center gap-1 px-3 py-1 bg-green-900/30 border border-green-500/30 rounded-full">
              <CheckCheck className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Solved</span>
            </div>
          )}
        </div>

        <span
          className={`px-3 py-1 rounded-full text-sm font-medium border inline-block mb-6 ${colors.text} ${colors.bg} ${colors.border}`}
        >
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
            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
              >
                {Object.keys(LANGUAGES).map((langKey) => (
                  <option key={langKey} value={langKey}>
                    {LANGUAGES[langKey].name}
                  </option>
                ))}
              </select>

              <button
                onClick={checkSyntax}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
                title="Check Syntax"
              >
                <AlertCircle className="w-4 h-4" />
                Check
              </button>

              <button
                onClick={runTest}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2"
                title="Test with Example"
              >
                <Play className="w-4 h-4" />
                Test
              </button>

              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`px-3 py-2 rounded-lg transition-all ${
                  debugMode
                    ? "bg-yellow-600 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
                title="Toggle Debug Mode"
              >
                <Bug className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Judging ({pollCount}/20)
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-96 bg-slate-900 text-gray-100 font-mono text-sm p-4 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none resize-none"
            spellCheck={false}
          />
        </div>

        {syntaxError && (
          <div
            className={`border rounded-xl p-4 ${
              syntaxError.type === "success"
                ? "bg-green-900/20 border-green-500/30"
                : syntaxError.type === "error"
                ? "bg-red-900/20 border-red-500/30"
                : "bg-blue-900/20 border-blue-500/30"
            }`}
          >
            <p
              className={`text-sm ${
                syntaxError.type === "success"
                  ? "text-green-400"
                  : syntaxError.type === "error"
                  ? "text-red-400"
                  : "text-blue-400"
              }`}
            >
              {syntaxError.message}
            </p>
          </div>
        )}

        {testRunResult && (
          <div
            className={`border rounded-xl p-4 ${
              testRunResult.error
                ? "bg-red-900/20 border-red-500/30"
                : testRunResult.passed
                ? "bg-green-900/20 border-green-500/30"
                : "bg-yellow-900/20 border-yellow-500/30"
            }`}
          >
            <h3 className="font-semibold mb-2 text-white">Test Run Result:</h3>
            {testRunResult.error ? (
              <p className="text-red-400 text-sm">{testRunResult.error}</p>
            ) : (
              <div className="text-sm space-y-1">
                <p className="text-gray-300">
                  Input:{" "}
                  <code className="text-purple-400">
                    {JSON.stringify(testRunResult.input)}
                  </code>
                </p>
                <p className="text-gray-300">
                  Output:{" "}
                  <code
                    className={
                      testRunResult.passed ? "text-green-400" : "text-red-400"
                    }
                  >
                    {JSON.stringify(testRunResult.output)}
                  </code>
                </p>
                <p className="text-gray-300">
                  Expected:{" "}
                  <code className="text-blue-400">
                    {JSON.stringify(testRunResult.expected)}
                  </code>
                </p>
              </div>
            )}
          </div>
        )}

        {debugMode && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">Debug Mode</span>
            </div>
            <div className="text-sm text-gray-300 space-y-1">
              <p>• Problem ID: {problem.id}</p>
              <p>• Language: {language}</p>
              <p>• User: {user?.username}</p>
              <p>• Polling: {submitting ? "Active" : "Idle"}</p>
              <p>• Attempts: {pollCount}/20</p>
              {result && <p>• Status: {result.status}</p>}
            </div>
          </div>
        )}

        {result && (
          <div
            className={`bg-slate-800/50 backdrop-blur border rounded-xl p-6 ${
              result.status === "accepted"
                ? "border-green-500/50"
                : result.status === "timeout"
                ? "border-yellow-500/50"
                : "border-red-500/50"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {result.status === "accepted" ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-xl font-semibold text-green-400">
                    Accepted! 🎉
                  </span>
                </>
              ) : result.status === "timeout" ? (
                <>
                  <Clock className="w-6 h-6 text-yellow-400" />
                  <span className="text-xl font-semibold text-yellow-400">
                    Timeout
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-400" />
                  <span className="text-xl font-semibold text-red-400">
                    {result.error ? "Error" : "Wrong Answer"}
                  </span>
                </>
              )}
            </div>

            {result.error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{result.error}</p>
              </div>
            )}

            {result.result?.results && (
              <div className="space-y-2">
                {result.result.results.map((test, i) => (
                  <div key={i} className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 font-medium">
                        Test Case {i + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        {test.time && (
                          <span className="text-gray-500 text-sm">
                            {test.time}ms
                          </span>
                        )}
                        {test.passed ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    </div>

                    {!test.passed && (
                      <div className="text-sm space-y-1 mt-2">
                        <div className="text-gray-400">
                          <span className="text-gray-500">Input:</span>
                          <code className="text-purple-400 ml-2">
                            {JSON.stringify(test.input)}
                          </code>
                        </div>
                        <div className="text-gray-400">
                          <span className="text-gray-500">Expected:</span>
                          <code className="text-green-400 ml-2">
                            {JSON.stringify(test.expected)}
                          </code>
                        </div>
                        <div className="text-gray-400">
                          <span className="text-gray-500">Got:</span>
                          <code className="text-red-400 ml-2">
                            {test.error || JSON.stringify(test.output)}
                          </code>
                        </div>
                      </div>
                    )}
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
