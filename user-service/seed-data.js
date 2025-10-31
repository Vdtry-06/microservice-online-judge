const { MongoClient } = require("mongodb");

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://admin:admin123@localhost:27019/users?authSource=admin";

const bcrypt = require("bcryptjs");

const sampleUsers = [
  {
    userId: "user_alice",
    username: "Alice",
    email: "alice@example.com",
    password: bcrypt.hashSync("alice123", 10),
    score: 0,
    solved: 0,
    submissions: 0,
    rank: 1,
    createdAt: new Date(),
  },
  {
    userId: "user_bob",
    username: "Bob",
    email: "bob@example.com",
    password: bcrypt.hashSync("bob123", 10),
    score: 0,
    solved: 0,
    submissions: 0,
    rank: 2,
    createdAt: new Date(),
  },
  {
    userId: "user_charlie",
    username: "Charlie",
    email: "charlie@example.com",
    password: bcrypt.hashSync("charlie123", 10),
    score: 0,
    solved: 0,
    submissions: 0,
    rank: 3,
    createdAt: new Date(),
  },
  {
    userId: "user_diana",
    username: "Diana",
    email: "diana@example.com",
    password: bcrypt.hashSync("diana123", 10),
    score: 0,
    solved: 0,
    submissions: 0,
    rank: 4,
    createdAt: new Date(),
  },
  {
    userId: "user_eve",
    username: "Eve",
    email: "eve@example.com",
    password: bcrypt.hashSync("eve123", 10),
    score: 0,
    solved: 0,
    submissions: 0,
    rank: 5,
    createdAt: new Date(),
  },
  {
    userId: "user_frank",
    username: "Frank",
    email: "frank@example.com",
    password: bcrypt.hashSync("frank123", 10),
    score: 0,
    solved: 0,
    submissions: 0,
    rank: 6,
    createdAt: new Date(),
  },
  {
    userId: "user_grace",
    username: "Grace",
    email: "grace@example.com",
    password: bcrypt.hashSync("grace123", 10),
    score: 0,
    solved: 0,
    submissions: 0,
    rank: 7,
    createdAt: new Date(),
  },
  {
    userId: "user_hank",
    username: "Hank",
    email: "hank@example.com",
    password: bcrypt.hashSync("hank123", 10),
    score: 0,
    solved: 0,
    submissions: 0,
    rank: 8,
    createdAt: new Date(),
  },
];

async function seedDatabase() {
  let client;

  try {
    console.log("Connecting to MongoDB (Users)...");
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db("users");

    console.log("Clearing existing users...");
    await db.collection("users").deleteMany({});

    console.log("Inserting sample users...");
    const result = await db.collection("users").insertMany(sampleUsers);

    console.log(`Successfully inserted ${result.insertedCount} users!`);

    // Create indexes
    console.log("Creating indexes...");
    await db.collection("users").createIndex({ userId: 1 }, { unique: true });
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    await db.collection("users").createIndex({ score: -1 });

    console.log("User database seeded successfully!");
  } catch (error) {
    console.error("Error seeding user database:", error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log("Database connection closed");
    }
  }
}

seedDatabase().catch(console.error);
