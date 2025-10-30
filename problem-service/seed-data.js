const { MongoClient } = require("mongodb");

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://admin:admin123@localhost:27017/problems?authSource=admin";

const sampleProblems = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    acceptanceRate: 45.2,
    tags: ["Array", "Hash Table"],
    examples: [
      { input: "[2,7,11,15], target = 9", output: "[0,1]" },
      { input: "[3,2,4], target = 6", output: "[1,2]" },
    ],
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1] },
    ],
    createdAt: new Date(),
  },
  {
    id: 2,
    title: "Reverse String",
    difficulty: "Easy",
    description:
      "Write a function that reverses a string. The input string is given as an array of characters.",
    acceptanceRate: 72.5,
    tags: ["String", "Two Pointers"],
    examples: [
      { input: '["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
      {
        input: '["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]',
      },
    ],
    testCases: [
      { input: ["h", "e", "l", "l", "o"], expected: ["o", "l", "l", "e", "h"] },
      {
        input: ["H", "a", "n", "n", "a", "h"],
        expected: ["h", "a", "n", "n", "a", "H"],
      },
    ],
    createdAt: new Date(),
  },
  {
    id: 3,
    title: "Palindrome Number",
    difficulty: "Easy",
    description:
      "Given an integer x, return true if x is a palindrome, and false otherwise.",
    acceptanceRate: 52.3,
    tags: ["Math"],
    examples: [
      { input: "121", output: "true" },
      { input: "-121", output: "false" },
      { input: "10", output: "false" },
    ],
    testCases: [
      { input: 121, expected: true },
      { input: -121, expected: false },
      { input: 10, expected: false },
      { input: 12321, expected: true },
    ],
    createdAt: new Date(),
  },
  {
    id: 4,
    title: "Maximum Subarray",
    difficulty: "Medium",
    description:
      "Given an integer array nums, find the contiguous subarray which has the largest sum and return its sum.",
    acceptanceRate: 49.8,
    tags: ["Array", "Dynamic Programming"],
    examples: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", output: "6" },
      { input: "[1]", output: "1" },
      { input: "[5,4,-1,7,8]", output: "23" },
    ],
    testCases: [
      { input: [-2, 1, -3, 4, -1, 2, 1, -5, 4], expected: 6 },
      { input: [1], expected: 1 },
      { input: [5, 4, -1, 7, 8], expected: 23 },
    ],
    createdAt: new Date(),
  },
  {
    id: 5,
    title: "Merge Two Sorted Lists",
    difficulty: "Medium",
    description:
      "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list.",
    acceptanceRate: 58.9,
    tags: ["Linked List", "Recursion"],
    examples: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]" },
      { input: "list1 = [], list2 = []", output: "[]" },
    ],
    testCases: [
      {
        input: { list1: [1, 2, 4], list2: [1, 3, 4] },
        expected: [1, 1, 2, 3, 4, 4],
      },
      { input: { list1: [], list2: [] }, expected: [] },
    ],
    createdAt: new Date(),
  },
  {
    id: 6,
    title: "Binary Tree Maximum Path Sum",
    difficulty: "Hard",
    description:
      "A path in a binary tree is a sequence of nodes where each pair of adjacent nodes has an edge connecting them. Find the maximum path sum.",
    acceptanceRate: 38.2,
    tags: ["Tree", "Depth-First Search", "Dynamic Programming"],
    examples: [
      { input: "[1,2,3]", output: "6" },
      { input: "[-10,9,20,null,null,15,7]", output: "42" },
    ],
    testCases: [
      { input: [1, 2, 3], expected: 6 },
      { input: [-10, 9, 20, null, null, 15, 7], expected: 42 },
    ],
    createdAt: new Date(),
  },
  {
    id: 7,
    title: "Valid Parentheses",
    difficulty: "Easy",
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    acceptanceRate: 40.1,
    tags: ["String", "Stack"],
    examples: [
      { input: '"()"', output: "true" },
      { input: '"()[]{}"', output: "true" },
      { input: '"(]"', output: "false" },
    ],
    testCases: [
      { input: "()", expected: true },
      { input: "()[]{}", expected: true },
      { input: "(]", expected: false },
      { input: "([)]", expected: false },
    ],
    createdAt: new Date(),
  },
  {
    id: 8,
    title: "Longest Common Subsequence",
    difficulty: "Medium",
    description:
      "Given two strings text1 and text2, return the length of their longest common subsequence.",
    acceptanceRate: 58.7,
    tags: ["String", "Dynamic Programming"],
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: "3" },
      { input: 'text1 = "abc", text2 = "abc"', output: "3" },
    ],
    testCases: [
      { input: { text1: "abcde", text2: "ace" }, expected: 3 },
      { input: { text1: "abc", text2: "abc" }, expected: 3 },
      { input: { text1: "abc", text2: "def" }, expected: 0 },
    ],
    createdAt: new Date(),
  },
];

async function seedDatabase() {
  let client;

  try {
    console.log("🔌 Connecting to MongoDB...");
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db("problems");

    console.log("🗑️  Clearing existing problems...");
    await db.collection("problems").deleteMany({});

    console.log("📝 Inserting sample problems...");
    const result = await db.collection("problems").insertMany(sampleProblems);

    console.log(`✅ Successfully inserted ${result.insertedCount} problems!`);

    // Create indexes
    console.log("📊 Creating indexes...");
    await db.collection("problems").createIndex({ id: 1 }, { unique: true });
    await db.collection("problems").createIndex({ difficulty: 1 });
    await db.collection("problems").createIndex({ tags: 1 });

    console.log("✅ Database seeded successfully!");

    // Display summary
    const count = await db.collection("problems").countDocuments();
    console.log(`\n📊 Total problems in database: ${count}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log("👋 Database connection closed");
    }
  }
}

// Run the seed function
seedDatabase();
