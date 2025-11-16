const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const Redis = require('ioredis');
require("dotenv").config();
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const REDIS_URL = process.env.REDIS_URL;
const redis = new Redis(REDIS_URL);

const INSTANCE_ID = process.env.INSTANCE_ID || 'default';
const LOG_FILE = path.join(__dirname, `seed-log-${INSTANCE_ID}.csv`);

const TOTAL_USERS = parseInt(process.env.TOTAL_USERS);
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE);
const PROGRESS_KEY = process.env.PROGRESS_KEY;
const INIT_LOCK_KEY = process.env.INIT_LOCK_KEY;
const LOCK_TTL = parseInt(process.env.LOCK_TTL);

const passwordCache = new Map();

redis.on('connect', () => console.log(`[${INSTANCE_ID}] Connected to Redis`));
redis.on('error', (err) => console.error(`[${INSTANCE_ID}] Redis error:`, err));

// ==================== LOGGING ====================
function initLogFile() {
    if (!fs.existsSync(LOG_FILE)) {
        fs.writeFileSync(LOG_FILE, 'timestamp,userId,username,email,status,message\n');
    }
}

function writeLog(userId, username, email, status, error = '') {
    const timestamp = new Date().toISOString();
    const line = `${timestamp},${userId},${username},${email},${status},"${error.replace(/"/g, '""')}"\n`;
    fs.appendFileSync(LOG_FILE, line, { encoding: 'utf8' });
}

// ==================== HELPERS ====================
function getPasswordHash(password) {
    if (!passwordCache.has(password)) {
        passwordCache.set(password, bcrypt.hashSync(password, 8)); // giảm rounds để nhanh hơn
    }
    return passwordCache.get(password);
}

function generateUsers(startIndex, count) {
    const users = [];
    const endIndex = Math.min(startIndex + count, TOTAL_USERS);
    for (let i = startIndex; i < endIndex; i++) {
        users.push({
            userId: `user${i}`,
            username: `username${i}`,
            email: `email${i}@example.com`,
            password: getPasswordHash(`password${i}`),
            score: 0,
            solved: 0,
            submission: 0,
            rank: i,
            createdAt: new Date(),
        });
    }
    return users;
}

// ==================== MAIN INSERT ====================
async function insertBatch(db, users, stats) {
    try {
        const result = await db.collection('users').insertMany(users, { ordered: false });
        stats.succeeded += result.insertedCount;
        users.forEach(u => writeLog(u.userId, u.username, u.email, 'SUCCESS'));
    } catch (err) {
        const errors = err.writeErrors || [];
        const failedCount = errors.length;
        stats.succeeded += users.length - failedCount;
        stats.failed += failedCount;
        errors.forEach(e => {
            const u = users[e.index];
            writeLog(u.userId, u.username, u.email, 'FAILURE', e.errmsg || 'Unknown error');
        });
    }
}

// ==================== PARALLEL SEEDING ====================
async function seedDistributed() {
    let client;

    try {
        initLogFile();
        console.log(`[${INSTANCE_ID}] Connecting to MongoDB...`);
        client = await MongoClient.connect(MONGODB_URI, { maxPoolSize: 20 });
        const db = client.db("users");

        const initSuccess = await redis.set(INIT_LOCK_KEY, INSTANCE_ID, "NX", "EX", LOCK_TTL);
        if (initSuccess) {
            console.log(`[${INSTANCE_ID}] Initializing DB...`);
            await db.collection("users").deleteMany({});
            await db.collection("users").createIndex({ userId: 1 }, { unique: true });
            await db.collection("users").createIndex({ username: 1 }, { unique: true });
            await db.collection("users").createIndex({ email: 1 }, { unique: true });
            await db.collection("users").createIndex({ score: -1 });
            await redis.set(INIT_LOCK_KEY, "DONE");
        } else {
            console.log(`[${INSTANCE_ID}] Waiting for initialization...`);
            while ((await redis.get(INIT_LOCK_KEY)) !== "DONE") {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        const stats = { succeeded: 0, failed: 0 };
        const totalBatches = Math.ceil(TOTAL_USERS / BATCH_SIZE);

        console.log(`[${INSTANCE_ID}] Total batches: ${totalBatches} (${BATCH_SIZE} users/batch)`);

        // CHẠY SONG SONG TỐI ĐA 5 BATCH MỘT LÚC
        const concurrency = 5;
        for (let i = 0; i < totalBatches; i += concurrency) {
            const tasks = [];
            for (let j = 0; j < concurrency && i + j < totalBatches; j++) {
                const batchId = i + j + 1;
                const start = (batchId - 1) * BATCH_SIZE;
                const users = generateUsers(start, BATCH_SIZE);
                tasks.push(insertBatch(db, users, stats));
            }
            await Promise.all(tasks); // đợi 5 batch chạy xong mới tiếp
            console.log(`[${INSTANCE_ID}] Progress: ${stats.succeeded}/${TOTAL_USERS}`);
            await redis.set(PROGRESS_KEY, stats.succeeded);
        }

        console.log(`\n[${INSTANCE_ID}] Done! Success: ${stats.succeeded}, Failed: ${stats.failed}`);
    } catch (err) {
        console.error(`[${INSTANCE_ID}] Fatal error:`, err);
        process.exit(1);
    } finally {
        if (client) await client.close();
        redis.quit();
        console.log(`[${INSTANCE_ID}] 🔒 Redis closed.`);
    }
}

// ==================== CLEANUP ====================
process.on('SIGINT', async () => {
    console.log(`\n[${INSTANCE_ID}] SIGINT received. Cleaning up...`);
    redis.quit();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log(`\n[${INSTANCE_ID}]  SIGTERM received. Cleaning up...`);
    redis.quit();
    process.exit(0);
});

seedDistributed().catch(console.error);
