const amqp = require("amqplib");
const Redis = require("ioredis");
const axios = require("axios");
const { VM } = require("vm2");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ============= CONFIGURATION =============
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const SUBMISSION_SERVICE_URL =
  process.env.SUBMISSION_SERVICE_URL || "http://localhost:3002";
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3003";
const QUEUE_NAME = "judge_submissions";
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS) || 5;
const WORKER_ID =
  process.env.HOSTNAME || "worker-" + Math.random().toString(36).substr(2, 9);

// ============= CONNECTIONS =============
const redis = new Redis(REDIS_URL);
let channel;
let currentJobs = 0;

// ============= RABBITMQ =============
async function connectRabbitMQ() {
  const connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.prefetch(MAX_CONCURRENT_JOBS);
  console.log("RabbitMQ connected");
}

// ============= HELPER: Deep Comparison =============
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (let key of keysA) {
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

// ============= JAVASCRIPT EXECUTION =============
function executeJavaScript(code, testCases) {
  const results = [];
  let allPassed = true;

  for (const testCase of testCases) {
    try {
      const startTime = Date.now();
      const vm = new VM({
        timeout: 3000,
        sandbox: {},
      });

      let inputParam;
      if (typeof testCase.input === "object") {
        inputParam = JSON.stringify(testCase.input);
      } else {
        inputParam = testCase.input;
      }

      const executeCode = `
        ${code}
        const result = solve(${inputParam});
        JSON.stringify(result);
      `;

      const outputStr = vm.run(executeCode);
      const output = JSON.parse(outputStr);
      const executionTime = Date.now() - startTime;

      const passed = deepEqual(output, testCase.expected);

      results.push({
        input: testCase.input,
        expected: testCase.expected,
        output,
        passed,
        time: executionTime,
      });

      if (!passed) allPassed = false;
    } catch (err) {
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        error: err.message,
        passed: false,
      });
      allPassed = false;
    }
  }

  return { allPassed, results };
}

// ============= PYTHON EXECUTION =============
function executePython(code, testCases) {
  const tempDir = `/tmp/judge-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  fs.mkdirSync(tempDir, { recursive: true });
  const pyFile = path.join(tempDir, "solution.py");

  try {
    const wrappedCode = `
import json
import sys

${code}

if __name__ == "__main__":
    input_data = sys.stdin.read()
    try:
        input_value = json.loads(input_data)
    except:
        input_value = input_data.strip()
    
    result = solve(input_value)
    print(json.dumps(result))
`;

    fs.writeFileSync(pyFile, wrappedCode);

    const results = [];
    let allPassed = true;

    for (const testCase of testCases) {
      try {
        const startTime = Date.now();
        const input = JSON.stringify(testCase.input);

        const outputStr = execSync(`python3 ${pyFile}`, {
          input,
          timeout: 5000,
          encoding: "utf-8",
          cwd: tempDir,
        }).trim();

        const output = JSON.parse(outputStr);
        const executionTime = Date.now() - startTime;
        const passed = deepEqual(output, testCase.expected);

        results.push({
          input: testCase.input,
          expected: testCase.expected,
          output,
          passed,
          time: executionTime,
        });

        if (!passed) allPassed = false;
      } catch (err) {
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          error: err.message,
          passed: false,
        });
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

// ============= C++ EXECUTION (FIXED) =============
function executeCpp(code, testCases) {
  const tempDir = `/tmp/judge-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  fs.mkdirSync(tempDir, { recursive: true });

  const cppFile = path.join(tempDir, "solution.cpp");
  const exeFile = path.join(tempDir, "solution");

  try {
    // Wrap user code with JSON I/O handling
    const wrappedCode = `
#include <iostream>
#include <string>
#include <sstream>
#include <vector>
using namespace std;

// User's solve function
${code}

int main() {
    string input_line;
    getline(cin, input_line);
    
    // Simple JSON parsing for basic types
    // Remove quotes if string input
    if (input_line.front() == '"' && input_line.back() == '"') {
        input_line = input_line.substr(1, input_line.length() - 2);
    }
    
    // Call user's solve function
    auto result = solve(input_line);
    
    // Output result
    cout << result << endl;
    
    return 0;
}
`;

    fs.writeFileSync(cppFile, wrappedCode);

    // Compile
    execSync(`g++ -o ${exeFile} ${cppFile} -std=c++17 -O2`, {
      timeout: 10000,
      cwd: tempDir,
    });

    const results = [];
    let allPassed = true;

    for (const testCase of testCases) {
      try {
        const startTime = Date.now();
        
        // Prepare input
        let input;
        if (typeof testCase.input === "string") {
          input = `"${testCase.input}"`;
        } else {
          input = JSON.stringify(testCase.input);
        }

        const outputStr = execSync(exeFile, {
          input,
          timeout: 5000,
          encoding: "utf-8",
          cwd: tempDir,
        }).trim();

        // Parse output
        let output;
        try {
          output = JSON.parse(outputStr);
        } catch {
          output = outputStr;
        }

        const executionTime = Date.now() - startTime;
        const passed = deepEqual(output, testCase.expected);

        results.push({
          input: testCase.input,
          expected: testCase.expected,
          output,
          passed,
          time: executionTime,
        });

        if (!passed) allPassed = false;
      } catch (err) {
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          error: err.message,
          passed: false,
        });
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

// ============= JAVA EXECUTION (FIXED) =============
function executeJava(code, testCases) {
  const tempDir = `/tmp/judge-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Wrap user code with JSON I/O
    const wrappedCode = `
import java.util.*;
import java.io.*;

${code}

class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input = br.readLine();
        
        // Remove quotes if string
        if (input.startsWith("\\"") && input.endsWith("\\"")) {
            input = input.substring(1, input.length() - 1);
        }
        
        Solution solution = new Solution();
        String result = solution.solve(input);
        
        System.out.println(result);
    }
}
`;

    const javaFile = path.join(tempDir, "Main.java");
    fs.writeFileSync(javaFile, wrappedCode);

    // Compile
    execSync(`javac ${javaFile}`, { cwd: tempDir, timeout: 10000 });

    const results = [];
    let allPassed = true;

    for (const testCase of testCases) {
      try {
        const startTime = Date.now();

        let input;
        if (typeof testCase.input === "string") {
          input = `"${testCase.input}"`;
        } else {
          input = JSON.stringify(testCase.input);
        }

        const outputStr = execSync(`java Main`, {
          cwd: tempDir,
          input,
          timeout: 5000,
          encoding: "utf-8",
        }).trim();

        let output;
        try {
          output = JSON.parse(outputStr);
        } catch {
          output = outputStr;
        }

        const executionTime = Date.now() - startTime;
        const passed = deepEqual(output, testCase.expected);

        results.push({
          input: testCase.input,
          expected: testCase.expected,
          output,
          passed,
          time: executionTime,
        });

        if (!passed) allPassed = false;
      } catch (err) {
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          error: err.message,
          passed: false,
        });
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
  const { submissionId, code, language, testCases, userId, problemId } = job;

  console.log(`[${WORKER_ID}] Processing ${submissionId} (${language})`);
  currentJobs++;

  try {
    await axios
      .put(`${SUBMISSION_SERVICE_URL}/internal/submission/${submissionId}`, {
        status: "judging",
        workerId: WORKER_ID,
        startedAt: new Date(),
      })
      .catch((err) => console.error("Failed to update status:", err));

    await redis.setex(`judging:${submissionId}`, 300, WORKER_ID);

    const startTime = Date.now();
    let allPassed, results;

    switch (language.toLowerCase()) {
      case "javascript":
      case "js":
        ({ allPassed, results } = executeJavaScript(code, testCases));
        break;
      case "python":
      case "python3":
      case "py":
        ({ allPassed, results } = executePython(code, testCases));
        break;
      case "cpp":
      case "c++":
        ({ allPassed, results } = executeCpp(code, testCases));
        break;
      case "java":
        ({ allPassed, results } = executeJava(code, testCases));
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    const executionTime = Date.now() - startTime;

    const result = {
      status: allPassed ? "accepted" : "wrong_answer",
      executionTime,
      results,
      workerId: WORKER_ID,
      memory: process.memoryUsage().heapUsed / 1024 / 1024,
      completedAt: new Date(),
    };

    await axios.put(
      `${SUBMISSION_SERVICE_URL}/internal/submission/${submissionId}`,
      {
        ...result,
        status: "completed",
        result: result,
      }
    );

    // UPDATE USER SCORE IF ACCEPTED
    if (allPassed && userId && problemId) {
      try {
        await axios.post(`${USER_SERVICE_URL}/internal/user/${userId}/solved`, {
          problemId,
          score: 10, // Base score
        });
        console.log(`[${WORKER_ID}] Updated score for user ${userId}`);
      } catch (err) {
        console.error("Failed to update user score:", err.message);
      }
    }

    await redis.setex(`result:${submissionId}`, 3600, JSON.stringify(result));

    const today = new Date().toISOString().split("T")[0];
    await redis.incr(`stats:${allPassed ? "accepted" : "rejected"}:${today}`);
    await redis.incr(`stats:worker:${WORKER_ID}:processed`);

    console.log(
      `[${WORKER_ID}] ✓ ${submissionId} - ${result.status} (${executionTime}ms)`
    );

    channel.ack(message);
  } catch (error) {
    console.error(`[${WORKER_ID}] ✗ ${submissionId} -`, error.message);

    await axios
      .put(`${SUBMISSION_SERVICE_URL}/internal/submission/${submissionId}`, {
        status: "failed",
        error: error.message,
        completedAt: new Date(),
      })
      .catch((err) => console.error("Failed to update error:", err));

    channel.ack(message);
  } finally {
    await redis.del(`judging:${submissionId}`);
    currentJobs--;
  }
}

// ============= START WORKER =============
async function startWorker() {
  try {
    await connectRabbitMQ();

    console.log(`Judge Worker [${WORKER_ID}] started`);
    console.log(`Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`);

    channel.consume(QUEUE_NAME, async (message) => {
      if (message) {
        if (currentJobs < MAX_CONCURRENT_JOBS) {
          processJob(message);
        } else {
          channel.nack(message, false, true);
        }
      }
    });

    setInterval(async () => {
      await redis.setex(
        `worker:${WORKER_ID}:health`,
        30,
        JSON.stringify({
          status: "healthy",
          currentJobs,
          timestamp: Date.now(),
        })
      );
    }, 10000);
  } catch (error) {
    console.error("Worker startup error:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await redis.quit();
  if (channel) await channel.close();
  process.exit(0);
});

startWorker();