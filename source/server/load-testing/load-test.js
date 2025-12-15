const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const axios = require("axios");
const http = require("http");
const https = require("https");
const fs = require("fs");

if (!isMainThread) {
  const axios = require("axios");
  const http = require("http");
  const https = require("https");

  axios.defaults.httpAgent = new http.Agent({ keepAlive: true, maxSockets: 2000 });
  axios.defaults.httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 2000 });
  axios.defaults.timeout = 10000;

  const users = workerData.users;
  const { API_URL, PROBLEM_ID, code } = workerData;

  async function submit(user) {
    const start = Date.now();
    try {
      await axios.post(`${API_URL}/api/submit`, {
        code,
        language: "javascript",
        problemId: PROBLEM_ID,
        userId: user.userId,
      });
      return Date.now() - start;
    } catch {
      return Date.now() - start;
    }
  }

  (async () => {
    const times = [];
    await Promise.all(users.map(u => submit(u).then(t => times.push(t))));
    parentPort.postMessage(times);
  })();

  return;
}

// =================== CONFIG ===================
const API_URL = process.env.API_URL || "http://127.0.0.1:3000";
const MAX_USERS = parseInt(process.env.MAX_USERS) || 10000;
const PROBLEM_ID = 3;

// NETWORK TUNING
axios.defaults.httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 2000,
});
axios.defaults.httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 2000,
});
axios.defaults.timeout = 10000;

// =============================================

const users = Array.from({ length: MAX_USERS }, (_, i) => ({
  userId: `user${i + 1}`,
  username: `user${i + 1}`,
}));

const code = `
function solve(arr) {
  arr.reverse();
  return arr;
}
`;

const os = require("os");
const numThreads = Math.min(os.cpus().length, 8);

const chunkSize = Math.ceil(users.length / numThreads);
const workers = [];
console.log(`Running load test for ${MAX_USERS} users on ${numThreads} threads...`);

for (let i = 0; i < numThreads; i++) {
  const chunk = users.slice(i * chunkSize, (i + 1) * chunkSize);
  workers.push(
    new Promise((resolve) => {
      const worker = new Worker(__filename, {
        workerData: { users: chunk, API_URL, PROBLEM_ID, code },
      });
      worker.on("message", resolve);
    })
  );
}

(async () => {
  const start = Date.now();
  const results = await Promise.all(workers);
  const times = results.flat();

  const total = Date.now() - start;
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const sorted = [...times].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const throughput = (MAX_USERS / (total / 1000)).toFixed(2);

  console.log(`\nRESULTS`);
  console.log(`──────────────────────────────`);
  console.log(`Total Requests: ${MAX_USERS}`);
  console.log(`Total Time: ${total} ms`);
  console.log(`Avg Time: ${Math.round(avg)} ms`);
  console.log(`P95 Latency: ${p95} ms`);
  console.log(`Throughput: ${throughput} req/s`);

  fs.writeFile("results.csv", "time\n" + times.join("\n"), () => {
    console.log("Saved results.csv");
  });
})();
