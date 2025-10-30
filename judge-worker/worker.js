const amqp = require('amqplib');
const Redis = require('ioredis');
const axios = require('axios');
const { VM } = require('vm2');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============= CONFIGURATION =============
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const SUBMISSION_SERVICE_URL = process.env.SUBMISSION_SERVICE_URL || 'http://localhost:3002';
const QUEUE_NAME = 'judge_submissions';
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS) || 5;
const WORKER_ID = process.env.HOSTNAME || 'worker-' + Math.random().toString(36).substr(2, 9);

// ============= CONNECTIONS =============
const redis = new Redis(REDIS_URL);
let channel;

let currentJobs = 0;

// ============= RABBITMQ =============
async function connectRabbitMQ() {
  const connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.prefetch(MAX_CONCURRENT_JOBS); // Limit concurrent processing
  console.log('RabbitMQ connected');
}

// ============= EXECUTION FUNCTIONS =============

function executeJavaScript(code, testCases) {
  const vm = new VM({ timeout: 5000, sandbox: {} });
  const results = [];
  let allPassed = true;
  
  for (const testCase of testCases) {
    try {
      const startTime = Date.now();
      const result = vm.run(`
        ${code}
        JSON.stringify(solve(${JSON.stringify(testCase.input)}))
      `);
      
      const output = JSON.parse(result);
      const executionTime = Date.now() - startTime;
      const passed = JSON.stringify(output) === JSON.stringify(testCase.expected);
      
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        output,
        passed,
        time: executionTime
      });
      
      if (!passed) allPassed = false;
    } catch (err) {
      results.push({
        input: testCase.input,
        error: err.message,
        passed: false
      });
      allPassed = false;
    }
  }
  
  return { allPassed, results };
}

function executeCpp(code, testCases) {
  const tempDir = `/tmp/judge-${Date.now()}`;
  fs.mkdirSync(tempDir, { recursive: true });
  
  const cppFile = path.join(tempDir, 'solution.cpp');
  const exeFile = path.join(tempDir, 'solution');
  
  try {
    fs.writeFileSync(cppFile, code);
    execSync(`g++ -o ${exeFile} ${cppFile} -std=c++17`, { timeout: 10000 });
    
    const results = [];
    let allPassed = true;
    
    for (const testCase of testCases) {
      try {
        const startTime = Date.now();
        const input = typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input);
        const output = execSync(exeFile, {
          input,
          timeout: 5000,
          encoding: 'utf-8'
        }).trim();
        
        const executionTime = Date.now() - startTime;
        const passed = output === testCase.expected;
        
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          output,
          passed,
          time: executionTime
        });
        
        if (!passed) allPassed = false;
      } catch (err) {
        results.push({ input: testCase.input, error: err.message, passed: false });
        allPassed = false;
      }
    }
    
    fs.rmSync(tempDir, { recursive: true, force: true });
    return { allPassed, results };
  } catch (error) {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw error;
  }
}

function executePython(code, testCases) {
  const tempDir = `/tmp/judge-${Date.now()}`;
  fs.mkdirSync(tempDir, { recursive: true });
  const pyFile = path.join(tempDir, 'solution.py');
  
  try {
    fs.writeFileSync(pyFile, code);
    
    const results = [];
    let allPassed = true;
    
    for (const testCase of testCases) {
      try {
        const startTime = Date.now();
        const input = typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input);
        const output = execSync(`python3 ${pyFile}`, {
          input,
          timeout: 5000,
          encoding: 'utf-8'
        }).trim();
        
        const executionTime = Date.now() - startTime;
        const passed = output === testCase.expected;
        
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          output,
          passed,
          time: executionTime
        });
        
        if (!passed) allPassed = false;
      } catch (err) {
        results.push({ input: testCase.input, error: err.message, passed: false });
        allPassed = false;
      }
    }
    
    fs.rmSync(tempDir, { recursive: true, force: true });
    return { allPassed, results };
  } catch (error) {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw error;
  }
}

function executeJava(code, testCases) {
  const tempDir = `/tmp/judge-${Date.now()}`;
  fs.mkdirSync(tempDir, { recursive: true });
  
  const classNameMatch = code.match(/public\s+class\s+(\w+)/);
  const className = classNameMatch ? classNameMatch[1] : 'Solution';
  const javaFile = path.join(tempDir, `${className}.java`);
  
  try {
    fs.writeFileSync(javaFile, code);
    execSync(`javac ${javaFile}`, { cwd: tempDir, timeout: 10000 });
    
    const results = [];
    let allPassed = true;
    
    for (const testCase of testCases) {
      try {
        const startTime = Date.now();
        const input = typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input);
        const output = execSync(`java ${className}`, {
          cwd: tempDir,
          input,
          timeout: 5000,
          encoding: 'utf-8'
        }).trim();
        
        const executionTime = Date.now() - startTime;
        const passed = output === testCase.expected;
        
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          output,
          passed,
          time: executionTime
        });
        
        if (!passed) allPassed = false;
      } catch (err) {
        results.push({ input: testCase.input, error: err.message, passed: false });
        allPassed = false;
      }
    }
    
    fs.rmSync(tempDir, { recursive: true, force: true });
    return { allPassed, results };
  } catch (error) {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw error;
  }
}

// ============= PROCESS JOB =============
async function processJob(message) {
  const job = JSON.parse(message.content.toString());
  const { submissionId, code, language, testCases } = job;
  
  console.log(`[${WORKER_ID}] Processing ${submissionId} (${language})`);
  currentJobs++;
  
  // Update status to judging via Submission Service
  await axios.put(`${SUBMISSION_SERVICE_URL}/internal/submission/${submissionId}`, {
    status: 'judging',
    workerId: WORKER_ID,
    startedAt: new Date()
  }).catch(err => console.error('Failed to update status:', err));
  
  // Set processing indicator in Redis
  await redis.setex(`judging:${submissionId}`, 300, WORKER_ID);
  
  const startTime = Date.now();
  
  try {
    let allPassed, results;
    
    switch (language.toLowerCase()) {
      case 'javascript':
        ({ allPassed, results } = executeJavaScript(code, testCases));
        break;
      case 'cpp':
      case 'c++':
        ({ allPassed, results } = executeCpp(code, testCases));
        break;
      case 'python':
        ({ allPassed, results } = executePython(code, testCases));
        break;
      case 'java':
        ({ allPassed, results } = executeJava(code, testCases));
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
    
    const executionTime = Date.now() - startTime;
    
    const result = {
      status: allPassed ? 'accepted' : 'wrong_answer',
      executionTime,
      results,
      workerId: WORKER_ID,
      memory: process.memoryUsage().heapUsed / 1024 / 1024,
      completedAt: new Date()
    };
    
    // Update database via Submission Service
    await axios.put(`${SUBMISSION_SERVICE_URL}/internal/submission/${submissionId}`, {
      ...result,
      status: 'completed'
    });
    
    // Cache result
    await redis.setex(`result:${submissionId}`, 3600, JSON.stringify(result));
    
    // Update stats
    await redis.incr(`stats:${allPassed ? 'accepted' : 'rejected'}:${new Date().toISOString().split('T')[0]}`);
    await redis.incr(`stats:worker:${WORKER_ID}:processed`);
    
    console.log(`[${WORKER_ID}] ok ${submissionId} - ${result.status} (${executionTime}ms)`);
    
    channel.ack(message);
  } catch (error) {
    console.error(`[${WORKER_ID}] error ${submissionId} -`, error.message);
    
    await axios.put(`${SUBMISSION_SERVICE_URL}/internal/submission/${submissionId}`, {
      status: 'failed',
      error: error.message,
      completedAt: new Date()
    }).catch(err => console.error('Failed to update error:', err));
    
    channel.ack(message); // Don't retry automatically
  } finally {
    await redis.del(`judging:${submissionId}`);
    currentJobs--;
  }
}

// ============= START WORKER =============
async function startWorker() {
  try {
    await connectRabbitMQ();
    
    console.log(`🚀 Judge Worker [${WORKER_ID}] started`);
    console.log(`⚙️  Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`);
    
    // Consume messages
    channel.consume(QUEUE_NAME, async (message) => {
      if (message) {
        if (currentJobs < MAX_CONCURRENT_JOBS) {
          processJob(message);
        } else {
          // Requeue if at capacity
          channel.nack(message, false, true);
        }
      }
    });
    
    // Health check
    setInterval(async () => {
      await redis.setex(`worker:${WORKER_ID}:health`, 30, JSON.stringify({
        status: 'healthy',
        currentJobs,
        timestamp: Date.now()
      }));
    }, 10000);
    
  } catch (error) {
    console.error('Worker startup error:', error);
    process.exit(1);
  }
}

// ============= GRACEFUL SHUTDOWN =============
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await redis.quit();
  if (channel) await channel.close();
  process.exit(0);
});

startWorker();