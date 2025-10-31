const express = require("express");
const Redis = require("ioredis");
const amqp = require("amqplib");
const { MongoClient } = require("mongodb");
const axios = require("axios");

const app = express();
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/submissions";
const PROBLEM_SERVICE_URL =
  process.env.PROBLEM_SERVICE_URL || "http://localhost:3001";
const PORT = process.env.PORT || 3002;
const QUEUE_NAME = "judge_submissions";
const SERVICE_ID =
  process.env.HOSTNAME ||
  "submission-" + Math.random().toString(36).substr(2, 9);

// Redis
const redis = new Redis(REDIS_URL);
redis.on("connect", () => console.log("[Submission Service] Redis connected"));

// MongoDB
let db;
MongoClient.connect(MONGODB_URI, { maxPoolSize: 10 })
  .then((client) => {
    db = client.db();
    console.log("[Submission Service] MongoDB connected");

    // Create indexes
    db.collection("submissions").createIndex({ submissionId: 1 });
    db.collection("submissions").createIndex({ userId: 1 });
    db.collection("submissions").createIndex({ problemId: 1 });
    db.collection("submissions").createIndex({ status: 1 });
    db.collection("submissions").createIndex({ createdAt: -1 });
    db.collection("submissions").createIndex({ userId: 1, problemId: 1 });
  })
  .catch((err) => console.error("MongoDB error:", err));

// RabbitMQ
let channel;
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });
    console.log("[Submission Service] RabbitMQ connected");
  } catch (error) {
    console.error("RabbitMQ error:", error);
    setTimeout(connectRabbitMQ, 5000);
  }
}
connectRabbitMQ();

// Distributed Lock
async function acquireLock(key, ttl = 3000) {
  const lockKey = `lock:${key}`;
  const lockValue = Date.now() + ttl;
  const result = await redis.set(lockKey, lockValue, "PX", ttl, "NX");
  return result === "OK";
}

async function releaseLock(key) {
  await redis.del(`lock:${key}`);
}

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "submission-service",
    id: SERVICE_ID,
    mongodb: !!db,
    redis: redis.status === "ready",
    rabbitmq: !!channel,
    timestamp: new Date().toISOString(),
  });
});

// Metrics
app.get("/metrics", async (req, res) => {
  try {
    const queueInfo = channel
      ? await channel.checkQueue(QUEUE_NAME)
      : { messageCount: 0 };
    const submissionCount = await db.collection("submissions").countDocuments();
    const pendingCount = await db
      .collection("submissions")
      .countDocuments({ status: "queued" });

    res.json({
      service: "submission-service",
      queueSize: queueInfo.messageCount,
      totalSubmissions: submissionCount,
      pendingSubmissions: pendingCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit Code - UPDATED WITH USERID AND PROBLEMID
app.post("/submit", async (req, res) => {
  const { code, language, problemId, userId } = req.body;

  if (!code || !language || !problemId || !userId) {
    return res.status(400).json({
      error: "Missing required fields: code, language, problemId, userId",
    });
  }

  try {
    const submissionId = `sub_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Distributed lock to prevent spam
    const lockKey = `user:${userId}:submit`;
    const acquired = await acquireLock(lockKey, 3000);

    if (!acquired) {
      return res.status(429).json({
        error: "Too fast",
        message: "Please wait 3 seconds before submitting again",
      });
    }

    try {
      // Get test cases from Problem Service
      const problemResponse = await axios.get(
        `${PROBLEM_SERVICE_URL}/internal/problems/${problemId}/testcases`,
        { timeout: 5000 }
      );

      const { testCases } = problemResponse.data;

      if (!testCases || testCases.length === 0) {
        return res.status(404).json({ error: "Problem test cases not found" });
      }

      // Create submission record
      const submission = {
        submissionId,
        userId,
        problemId,
        code,
        language,
        status: "queued",
        createdAt: new Date(),
        ip: req.get("X-User-IP") || req.ip,
      };

      await db.collection("submissions").insertOne(submission);

      // Send to queue WITH userId and problemId
      const message = {
        submissionId,
        code,
        language,
        testCases,
        userId,
        problemId,
        priority: 5,
      };

      channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), {
        persistent: true,
        priority: message.priority,
      });

      // Stats
      await redis.incr(
        `stats:submissions:${new Date().toISOString().split("T")[0]}`
      );

      // Get current queue size for estimate
      const queueInfo = await channel.checkQueue(QUEUE_NAME);
      const estimatedWaitTime = Math.ceil(queueInfo.messageCount / 10) + 1;

      res.json({
        submissionId,
        status: "queued",
        message: "Submission received and queued for judging",
        queuePosition: queueInfo.messageCount,
        estimatedWaitTime: `${estimatedWaitTime}s`,
      });
    } finally {
      await releaseLock(lockKey);
    }
  } catch (error) {
    console.error("[Submission Service] Submit error:", error);
    res.status(500).json({
      error: "Failed to submit code",
      message: error.message,
    });
  }
});

// Get Submission by ID
app.get("/submission/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Try cache first
    const cached = await redis.get(`result:${id}`);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Query database
    const submission = await db
      .collection("submissions")
      .findOne({ submissionId: id }, { projection: { _id: 0 } });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Cache if completed
    if (
      submission.status === "completed" ||
      submission.status === "accepted" ||
      submission.status === "wrong_answer" ||
      submission.status === "failed"
    ) {
      await redis.setex(`result:${id}`, 3600, JSON.stringify(submission));
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Submissions
app.get("/submissions", async (req, res) => {
  try {
    const { userId, status, limit = 50, skip = 0 } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const submissions = await db
      .collection("submissions")
      .find(query, { projection: { _id: 0, code: 0 } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .toArray();

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Submission (Internal - from Worker)
app.put("/internal/submission/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await db
      .collection("submissions")
      .updateOne(
        { submissionId: id },
        { $set: { ...updates, updatedAt: new Date() } }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Cache result if completed
    if (
      updates.status === "completed" ||
      updates.status === "accepted" ||
      updates.status === "wrong_answer" ||
      updates.status === "failed"
    ) {
      const submission = await db
        .collection("submissions")
        .findOne({ submissionId: id });
      await redis.setex(`result:${id}`, 3600, JSON.stringify(submission));
    }

    res.json({ message: "Submission updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Submission Stats
app.get("/stats", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const stats = {
      today: {
        total: parseInt((await redis.get(`stats:submissions:${today}`)) || 0),
        accepted: parseInt((await redis.get(`stats:accepted:${today}`)) || 0),
        rejected: parseInt((await redis.get(`stats:rejected:${today}`)) || 0),
      },
      allTime: {
        total: await db.collection("submissions").countDocuments(),
        accepted: await db
          .collection("submissions")
          .countDocuments({ status: "accepted" }),
        queued: await db
          .collection("submissions")
          .countDocuments({ status: "queued" }),
        judging: await db
          .collection("submissions")
          .countDocuments({ status: "judging" }),
      },
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Graceful Shutdown
process.on("SIGTERM", async () => {
  console.log("[Submission Service] Shutting down...");
  if (channel) await channel.close();
  await redis.quit();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`[${SERVICE_ID}] Submission Service running on port ${PORT}`);
});
