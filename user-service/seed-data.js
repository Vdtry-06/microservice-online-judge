const { MongoClient } = require("mongodb");

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://admin:admin123@localhost:27019/users?authSource=admin";

const sampleUsers = [
  {
    userId: "user_alice",
    username: "Alice",
    email: "alice@example.com",
    score: 2850,
    solved: 45,
    submissions: 120,
    rank: 1,
    createdAt: new Date(),
  },
  {
    userId: "user_bob",
    username: "Bob",
    email: "bob@example.com",
    score: 2640,
    solved: 38,
    submissions: 95,
    rank: 2,
    createdAt: new Date(),
  },
  {
    userId: "user_charlie",
    username: "Charlie",
    email: "charlie@example.com",
    score: 2420,
    solved: 35,
    submissions: 88,
    rank: 3,
    createdAt: new Date(),
  },
  {
    userId: "user_diana",
    username: "Diana",
    email: "diana@example.com",
    score: 2180,
    solved: 28,
    submissions: 72,
    rank: 4,
    createdAt: new Date(),
  },
  {
    userId: "user_eve",
    username: "Eve",
    email: "eve@example.com",
    score: 1950,
    solved: 24,
    submissions: 65,
    rank: 5,
    createdAt: new Date(),
  },
  {
    userId: "user_frank",
    username: "Frank",
    email: "frank@example.com",
    score: 1720,
    solved: 20,
    submissions: 58,
    rank: 6,
    createdAt: new Date(),
  },
  {
    userId: "user_grace",
    username: "Grace",
    email: "grace@example.com",
    score: 1580,
    solved: 18,
    submissions: 52,
    rank: 7,
    createdAt: new Date(),
  },
  {
    userId: "user_hank",
    username: "Hank",
    email: "hank@example.com",
    score: 1340,
    solved: 15,
    submissions: 45,
    rank: 8,
    createdAt: new Date(),
  },
];

async function seedDatabase() {
  let client;

  try {
    console.log("🔌 Connecting to MongoDB (Users)...");
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db("users");

    console.log("🗑️  Clearing existing users...");
    await db.collection("users").deleteMany({});

    console.log("👥 Inserting sample users...");
    const result = await db.collection("users").insertMany(sampleUsers);

    console.log(`✅ Successfully inserted ${result.insertedCount} users!`);

    // Create indexes
    console.log("📊 Creating indexes...");
    await db.collection("users").createIndex({ userId: 1 }, { unique: true });
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    await db.collection("users").createIndex({ score: -1 });

    console.log("✅ User database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding user database:", error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log("👋 Database connection closed");
    }
  }
}

seedDatabase();
