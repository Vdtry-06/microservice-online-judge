
const express = require("express");
const Redis = require("ioredis");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
// const RedisStore = require('rate-limit-redis');
const axios = require("axios");
require("dotenv").config();

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

// Configuration
const REDIS_URL = process.env.REDIS_URL;
const PROBLEM_SERVICE_URL = process.env.PROBLEM_SERVICE_URL;
const SUBMISSION_SERVICE_URL = process.env.SUBMISSION_SERVICE_URL;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const PORT = process.env.PORT;

// Redis
const redis = new Redis(REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err));

// Rate Limiting
const limiter = rateLimit({
  // store: new RedisStore({ client: redis, prefix: 'rate_limit:' }),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: "Too many requests", message: "Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// app.use("/api/", limiter);

// Load Shedding
let currentLoad = 0;

app.use((req, res, next) => {
  if (currentLoad >= MAX_LOAD) {
    return res.status(503).json({
      error: "Service Overloaded",
      message: "System at capacity. Please try again later.",
      retryAfter: 5,
    });
  }
  currentLoad++;
  res.on("finish", () => currentLoad--);
  next();
});

const MAX_LOAD = parseInt(process.env.MAX_LOAD) || 1000;

// Graceful Shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  await redis.quit();
  process.exit(0);
});

// ============= Authen SERVICE ROUTES ===========
app.post("/api/auth/login", async (req, res) => {
  try {
    console.log("Login request body:", req.body);

    // Extract username and password correctly
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Missing credentials",
        message: "Username and password are required",
      });
    }

    const response = await axios.post(`${USER_SERVICE_URL}/login`, {
      username,
      password,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || "Login failed",
      message: error.response?.data?.message || error.message,
    });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/user`, req.body, {
      timeout: 5000,
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: "Registration failed",
      message: error.response?.data?.error || error.message,
    });
  }
});

// ============= PROBLEM SERVICE ROUTES =============

app.get("/api/problems", async (req, res) => {
  try {
    const response = await axios.get(`${PROBLEM_SERVICE_URL}/problems`, {
      timeout: 5000,
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch problems",
      message: error.message,
    });
  }
});

app.get("/api/problems/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `${PROBLEM_SERVICE_URL}/problems/${req.params.id}`,
      { timeout: 5000 }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch problem",
      message: error.message,
    });
  }
});

// ============= SUBMISSION SERVICE ROUTES =============

app.post("/api/submit", async (req, res) => {
  try {
    const response = await axios.post(
      `${SUBMISSION_SERVICE_URL}/submit`,
      req.body,
      {
        timeout: 10000,
        headers: {
          "X-User-IP": req.ip,
          "X-User-Agent": req.get("user-agent"),
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: "Failed to submit code",
      message: error.response?.data?.message || error.message,
    });
  }
});

app.get("/api/submission/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `${SUBMISSION_SERVICE_URL}/submission/${req.params.id}`,
      { timeout: 5000 }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch submission",
      message: error.message,
    });
  }
});

// ============= USER SERVICE ROUTES =============

app.get("/api/leaderboard", async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/leaderboard`, {
      timeout: 5000,
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch leaderboard",
      message: error.message,
    });
  }
});

app.get("/api/user/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/user/${req.params.id}`,
      { timeout: 5000 }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch user",
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Rate limit: ${process.env.RATE_LIMIT_MAX || 100} req/min`);
  console.log(`Max load: ${MAX_LOAD} concurrent requests`);
});
