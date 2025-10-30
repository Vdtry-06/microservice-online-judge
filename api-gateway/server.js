const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const JUDGE_SERVICE_URL =
  process.env.JUDGE_SERVICE_URL || "http://localhost:3001";
const SUBMISSION_SERVICE_URL =
  process.env.SUBMISSION_SERVICE_URL || "http://localhost:3002";
const PROBLEM_SERVICE_URL =
  process.env.PROBLEM_SERVICE_URL || "http://localhost:3003";

// Round-robin load balancer for judge services
const judgeServices = [
  "http://judge-service-1:3001",
  "http://judge-service-2:3001",
  "http://judge-service-3:3001",
];
let currentJudgeIndex = 0;

function getNextJudgeService() {
  const service = judgeServices[currentJudgeIndex];
  currentJudgeIndex = (currentJudgeIndex + 1) % judgeServices.length;
  return service;
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "api-gateway" });
});

// Submit code for judging
app.post("/submit", async (req, res) => {
  try {
    const judgeService = getNextJudgeService();
    console.log(`Routing to ${judgeService}`);

    const response = await axios.post(`${judgeService}/execute`, req.body, {
      timeout: 30000,
    });

    // Save submission
    await axios
      .post(`${SUBMISSION_SERVICE_URL}/submissions`, {
        ...req.body,
        result: response.data,
        timestamp: new Date(),
      })
      .catch((err) => console.error("Failed to save submission:", err));

    res.json(response.data);
  } catch (error) {
    console.error("Submission error:", error.message);
    res.status(500).json({
      error: "Submission failed",
      message: error.message,
    });
  }
});

// Get problems
app.get("/problems", async (req, res) => {
  try {
    const response = await axios.get(`${PROBLEM_SERVICE_URL}/problems`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

// Get submissions
app.get("/submissions", async (req, res) => {
  try {
    const response = await axios.get(`${SUBMISSION_SERVICE_URL}/submissions`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
