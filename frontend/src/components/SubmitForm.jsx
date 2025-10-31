import React, { useState } from "react";
import apiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";

async function pollSubmission(submissionId, token, onComplete) {
  const start = Date.now();
  while (true) {
    const s = await apiService.getSubmission(submissionId, token);
    if (!["queued", "judging"].includes(s.status)) {
      return s;
    }
    if (Date.now() - start > 60_000) throw new Error("Submission timeout");
    await new Promise((r) => setTimeout(r, 800)); // poll interval
  }
}

export default function SubmitForm({
  problemId,
  code: initialCode = "",
  language: initialLang = "javascript",
}) {
  const { user, refreshUser } = useAuth();
  const token = localStorage.getItem("token");

  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLang);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setMessage(null);
    if (!token) return setMessage("You must be logged in to submit.");
    setBusy(true);
    try {
      const sub = await apiService.submitCode(
        { problemId, code, language },
        token
      );
      setMessage(`Submitted: ${sub.submissionId}. Waiting for result...`);
      const final = await pollSubmission(sub.submissionId, token);
      setMessage(`Result: ${final.status}`);
      if (final.status === "accepted") {
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Submission failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-200 mb-1">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-2 bg-gray-800 text-white"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-200 mb-1">Code</label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={12}
          className="w-full p-2 bg-gray-900 text-white font-mono"
        />
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="submit"
          disabled={!token || busy}
          className="px-4 py-2 bg-purple-600 disabled:opacity-50"
        >
          {busy ? "Submitting..." : "Submit"}
        </button>
        {message && <p className="text-sm text-gray-300">{message}</p>}
      </div>
    </form>
  );
}
