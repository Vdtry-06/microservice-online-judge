const express = require('express');
const Redis = require('ioredis');
const { MongoClient } = require('mongodb');
require("dotenv").config();

const app = express();
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL;
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT;
const SERVICE_ID = process.env.HOSTNAME || 'problem-' + Math.random().toString(36).substr(2, 9);

// Redis
const redis = new Redis(REDIS_URL);
redis.on('connect', () => console.log('[Problem Service] Redis connected'));

// MongoDB
let db;
MongoClient.connect(MONGODB_URI, { maxPoolSize: 10 }).then(client => {
  db = client.db();
  console.log('[Problem Service] MongoDB connected');
}).catch(err => console.error('MongoDB error:', err));

// Caching Helper
async function getCached(key, fetchFunction, ttl = 600) {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await fetchFunction();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Get all problems
app.get('/problems', async (req, res) => {
  try {
    const problems = await getCached('problems:all', async () => {
      return await db.collection('problems')
        .find({})
        .project({ testCases: 0 })
        .toArray();
    }, 600);
    
    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// Get problem by ID
app.get("/problems/:id", async (req, res) => {
  try {
    const problemId = parseInt(req.params.id);

    const problem = await getCached(
      `problem:${problemId}`,
      async () => {
        return await db.collection("problems").findOne({ id: problemId });
      },
      600
    );

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.json(problem);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch problem" });
  }
});

// Get problem test cases
app.get('/internal/problems/:id/testcases', async (req, res) => {
  try {
    const problemId = parseInt(req.params.id);
    
    const problem = await db.collection('problems').findOne(
      { id: problemId },
      { projection: { testCases: 1 } }
    );
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    res.json({ testCases: problem.testCases });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test cases' });
  }
});


// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('[Problem Service] Shutting down...');
  await redis.quit();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`[${SERVICE_ID}] Problem Service running on port ${PORT}`);
});