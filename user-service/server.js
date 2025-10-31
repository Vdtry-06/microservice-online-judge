const express = require('express');
const Redis = require('ioredis');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/users';
const PORT = process.env.PORT || 3003;
const SERVICE_ID = process.env.HOSTNAME || 'user-' + Math.random().toString(36).substr(2, 9);

// Redis
const redis = new Redis(REDIS_URL);
redis.on('connect', () => console.log('[User Service] Redis connected'));

// MongoDB
let db;
MongoClient.connect(MONGODB_URI, { maxPoolSize: 10 }).then(client => {
  db = client.db();
  console.log('[User Service] MongoDB connected');
  
  // Create indexes
  db.collection('users').createIndex({ userId: 1 }, { unique: true });
  db.collection('users').createIndex({ score: -1 });
  db.collection('users').createIndex({ username: 1 }, { unique: true });
}).catch(err => console.error('MongoDB error:', err));

// Caching Helper
async function getCached(key, fetchFunction, ttl = 60) {
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
    service: 'user-service',
    id: SERVICE_ID,
    mongodb: !!db,
    redis: redis.status === 'ready',
    timestamp: new Date().toISOString()
  });
});

// Metrics
app.get('/metrics', async (req, res) => {
  try {
    const userCount = await db.collection('users').countDocuments();
    
    res.json({
      service: 'user-service',
      totalUsers: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Leaderboard (with caching)
app.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;
    
    const leaderboard = await getCached(`leaderboard:top${limit}`, async () => {
      return await db.collection('users')
        .find({})
        .sort({ score: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .project({ _id: 0 })
        .toArray();
    }, 60); // Cache for 1 minute
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get User Profile
app.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await getCached(`user:${id}`, async () => {
      return await db.collection('users').findOne(
        { userId: id },
        { projection: { _id: 0 } }
      );
    }, 300); // Cache for 5 minutes
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create/Register User
app.post('/user', async (req, res) => {
  try {
    const { userId, username, email } = req.body;
    
    if (!userId || !username) {
      return res.status(400).json({ error: 'Missing required fields: userId, username' });
    }
    
    const user = {
      userId,
      username,
      email,
      score: 0,
      solved: 0,
      rank: 0,
      submissions: 0,
      createdAt: new Date()
    };
    
    await db.collection('users').insertOne(user);
    
    // Invalidate leaderboard cache
    const keys = await redis.keys('leaderboard:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    res.status(201).json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update User Score (Internal)
app.put('/internal/user/:id/score', async (req, res) => {
  try {
    const { id } = req.params;
    const { increment } = req.body;
    
    const result = await db.collection('users').findOneAndUpdate(
      { userId: id },
      {
        $inc: { 
          score: increment || 0,
          solved: 1,
          submissions: 1
        },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Invalidate cache
    await redis.del(`user:${id}`, 'leaderboard:*');
    
    res.json(result.value);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update score' });
  }
});

// Get User Statistics
app.get('/user/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await db.collection('users').findOne({ userId: id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const stats = {
      userId: user.userId,
      username: user.username,
      score: user.score,
      solved: user.solved,
      submissions: user.submissions,
      rank: user.rank,
      acceptanceRate: user.submissions > 0 
        ? ((user.solved / user.submissions) * 100).toFixed(2) + '%'
        : '0%'
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Update Rankings (Batch job - called periodically)
app.post('/internal/update-rankings', async (req, res) => {
  try {
    const users = await db.collection('users')
      .find({})
      .sort({ score: -1 })
      .toArray();
    
    const bulkOps = users.map((user, index) => ({
      updateOne: {
        filter: { userId: user.userId },
        update: { $set: { rank: index + 1 } }
      }
    }));
    
    if (bulkOps.length > 0) {
      await db.collection('users').bulkWrite(bulkOps);
    }
    
    // Invalidate cache
    const keys = await redis.keys('leaderboard:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    res.json({ message: 'Rankings updated successfully', updated: users.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update rankings' });
  }
});

// Clear cache
app.post('/cache/clear', async (req, res) => {
  try {
    const keys = await redis.keys('user:*', 'leaderboard:*');
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
  console.log('[User Service] Shutting down...');
  await redis.quit();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(` [${SERVICE_ID}] User Service running on port ${PORT}`);
});