const express = require('express');
const Redis = require('ioredis');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
// const RedisStore = require('rate-limit-redis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const PROBLEM_SERVICE_URL = process.env.PROBLEM_SERVICE_URL || 'http://localhost:3001';
const SUBMISSION_SERVICE_URL = process.env.SUBMISSION_SERVICE_URL || 'http://localhost:3002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3003';
const PORT = process.env.PORT || 3000;

// Redis
const redis = new Redis(REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

// Rate Limiting
const limiter = rateLimit({
  // store: new RedisStore({ client: redis, prefix: 'rate_limit:' }),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Too many requests', message: 'Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Load Shedding
let currentLoad = 0;
const MAX_LOAD = 1000;

app.use((req, res, next) => {
  if (currentLoad >= MAX_LOAD) {
    return res.status(503).json({
      error: 'Service Overloaded',
      message: 'System at capacity. Please try again later.',
      retryAfter: 5
    });
  }
  currentLoad++;
  res.on('finish', () => currentLoad--);
  next();
});

// Health Check
app.get('/health', async (req, res) => {
  try {
    const services = await Promise.allSettled([
      axios.get(`${PROBLEM_SERVICE_URL}/health`, { timeout: 2000 }),
      axios.get(`${SUBMISSION_SERVICE_URL}/health`, { timeout: 2000 }),
      axios.get(`${USER_SERVICE_URL}/health`, { timeout: 2000 })
    ]);

    const health = {
      status: 'healthy',
      service: 'api-gateway',
      load: currentLoad,
      maxLoad: MAX_LOAD,
      services: {
        redis: redis.status === 'ready',
        problemService: services[0].status === 'fulfilled',
        submissionService: services[1].status === 'fulfilled',
        userService: services[2].status === 'fulfilled'
      },
      timestamp: new Date().toISOString()
    };

    const allHealthy = Object.values(health.services).every(v => v);
    res.status(allHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

// ============= PROBLEM SERVICE ROUTES =============

app.get('/api/problems', async (req, res) => {
  try {
    const response = await axios.get(`${PROBLEM_SERVICE_URL}/problems`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch problems',
      message: error.message
    });
  }
});

app.get('/api/problems/:id', async (req, res) => {
  try {
    const response = await axios.get(`${PROBLEM_SERVICE_URL}/problems/${req.params.id}`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch problem',
      message: error.message
    });
  }
});

// ============= SUBMISSION SERVICE ROUTES =============

app.post('/api/submit', async (req, res) => {
  try {
    const response = await axios.post(`${SUBMISSION_SERVICE_URL}/submit`, req.body, {
      timeout: 10000,
      headers: {
        'X-User-IP': req.ip,
        'X-User-Agent': req.get('user-agent')
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to submit code',
      message: error.response?.data?.message || error.message
    });
  }
});

app.get('/api/submission/:id', async (req, res) => {
  try {
    const response = await axios.get(`${SUBMISSION_SERVICE_URL}/submission/${req.params.id}`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch submission',
      message: error.message
    });
  }
});

app.get('/api/submissions', async (req, res) => {
  try {
    const response = await axios.get(`${SUBMISSION_SERVICE_URL}/submissions`, {
      params: req.query,
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch submissions',
      message: error.message
    });
  }
});

// ============= USER SERVICE ROUTES =============

app.get('/api/leaderboard', async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/leaderboard`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch leaderboard',
      message: error.message
    });
  }
});

app.get('/api/user/:id', async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/user/${req.params.id}`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// ============= METRICS =============

app.get('/api/metrics', async (req, res) => {
  try {
    const [problemsHealth, submissionsHealth, usersHealth] = await Promise.allSettled([
      axios.get(`${PROBLEM_SERVICE_URL}/metrics`, { timeout: 2000 }),
      axios.get(`${SUBMISSION_SERVICE_URL}/metrics`, { timeout: 2000 }),
      axios.get(`${USER_SERVICE_URL}/metrics`, { timeout: 2000 })
    ]);

    res.json({
      gateway: {
        currentLoad,
        maxLoad: MAX_LOAD,
        loadPercentage: ((currentLoad / MAX_LOAD) * 100).toFixed(2)
      },
      problemService: problemsHealth.status === 'fulfilled' ? problemsHealth.value.data : { error: 'unavailable' },
      submissionService: submissionsHealth.status === 'fulfilled' ? submissionsHealth.value.data : { error: 'unavailable' },
      userService: usersHealth.status === 'fulfilled' ? usersHealth.value.data : { error: 'unavailable' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await redis.quit();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Rate limit: ${process.env.RATE_LIMIT_MAX || 100} req/min`);
  console.log(`Max load: ${MAX_LOAD} concurrent requests`);
});