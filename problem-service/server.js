const express = require('express');
const Redis = require('ioredis');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/problems';
const PORT = process.env.PORT || 3001;
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

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'problem-service',
    id: SERVICE_ID,
    mongodb: !!db,
    redis: redis.status === 'ready',
    timestamp: new Date().toISOString()
  });
});

// Metrics
app.get('/metrics', async (req, res) => {
  try {
    const problemCount = await db.collection('problems').countDocuments();
    const cacheKeys = await redis.keys('problem:*');
    
    res.json({
      service: 'problem-service',
      problemCount,
      cachedProblems: cacheKeys.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all problems (with caching)
app.get('/problems', async (req, res) => {
  try {
    const problems = await getCached('problems:all', async () => {
      return await db.collection('problems')
        .find({})
        .project({ testCases: 0 }) // Don't expose test cases in list
        .toArray();
    }, 600); // Cache 10 minutes
    
    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// Get problem by ID (with caching)
app.get('/problems/:id', async (req, res) => {
  try {
    const problemId = parseInt(req.params.id);
    
    const problem = await getCached(`problem:${problemId}`, async () => {
      return await db.collection('problems').findOne({ id: problemId });
    }, 600);
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    res.json(problem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

// Get problem test cases (internal only)
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

// Create problem (Admin)
app.post('/problems', async (req, res) => {
  try {
    const problem = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date()
    };
    
    await db.collection('problems').insertOne(problem);
    
    // Invalidate cache
    await redis.del('problems:all');
    
    res.status(201).json(problem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create problem' });
  }
});

// Update problem (Admin)
app.put('/problems/:id', async (req, res) => {
  try {
    const problemId = parseInt(req.params.id);
    
    const result = await db.collection('problems').updateOne(
      { id: problemId },
      { $set: { ...req.body, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    // Invalidate cache
    await redis.del('problems:all', `problem:${problemId}`);
    
    res.json({ message: 'Problem updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update problem' });
  }
});

// Delete problem (Admin)
app.delete('/problems/:id', async (req, res) => {
  try {
    const problemId = parseInt(req.params.id);
    
    const result = await db.collection('problems').deleteOne({ id: problemId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    // Invalidate cache
    await redis.del('problems:all', `problem:${problemId}`);
    
    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete problem' });
  }
});

// Clear cache (Admin)
app.post('/cache/clear', async (req, res) => {
  try {
    const keys = await redis.keys('problem*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    res.json({ cleared: keys.length, message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache' });
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