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
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    acceptanceRate: 45.2,
    tags: ["Array", "Hash Table"],
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    testCases: [
      {
        input: { nums: [2, 7, 11, 15], target: 9 },
        expected: [0, 1],
      },
      {
        input: { nums: [3, 2, 4], target: 6 },
        expected: [1, 2],
      },
      {
        input: { nums: [3, 3], target: 6 },
        expected: [0, 1],
      },
    ],
    createdAt: new Date(),
  },
  {
    id: 2,
    title: "Add Two Numbers",
    difficulty: "Medium",
    description:
      "Given two non-empty arrays representing two non-negative integers, add the two numbers and return the result as an array. The digits are stored in reverse order.",
    acceptanceRate: 38.5,
    tags: ["Array", "Math"],
    examples: [
      { input: "[2,4,3], [5,6,4]", output: "[7,0,8]" },
      { input: "[0], [0]", output: "[0]" },
    ],
    testCases: [
      {
        input: { l1: [2, 4, 3], l2: [5, 6, 4] },
        expected: [7, 0, 8],
      },
      {
        input: { l1: [0], l2: [0] },
        expected: [0],
      },
      {
        input: { l1: [9, 9, 9], l2: [9, 9, 9, 9] },
        expected: [8, 9, 9, 0, 1],
      },
    ],
    createdAt: new Date(),
  },
  {
    id: 3,
    title: "Reverse Array",
    difficulty: "Easy",
    description:
      "Write a function that reverses an array. Modify the array in-place and return it.",
    acceptanceRate: 72.5,
    tags: ["Array", "Two Pointers"],
    examples: [
      { input: "[1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: '["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
    ],
    testCases: [
      {
        input: [1, 2, 3, 4, 5],
        expected: [5, 4, 3, 2, 1],
      },
      {
        input: ["h", "e", "l", "l", "o"],
        expected: ["o", "l", "l", "e", "h"],
      },
      {
        input: [1],
        expected: [1],
      },
    ],
    createdAt: new Date(),
  },
  {
    id: 4,
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
      { input: 0, expected: true },
    ],
    createdAt: new Date(),
  },
  {
    id: 5,
    title: "Maximum Subarray Sum",
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
      { input: [-1], expected: -1 },
    ],
    createdAt: new Date(),
  },
  {
    id: 6,
    title: "Find Maximum",
    difficulty: "Easy",
    description:
      "Given an array of numbers, return the maximum number in the array.",
    acceptanceRate: 85.2,
    tags: ["Array"],
    examples: [
      { input: "[1,5,3,9,2]", output: "9" },
      { input: "[-5,-2,-10,-1]", output: "-1" },
    ],
    testCases: [
      { input: [1, 5, 3, 9, 2], expected: 9 },
      { input: [-5, -2, -10, -1], expected: -1 },
      { input: [42], expected: 42 },
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
      { input: "{[]}", expected: true },
    ],
    createdAt: new Date(),
  },
  {
    id: 8,
    title: "Fibonacci Number",
    difficulty: "Easy",
    description:
      "Calculate the nth Fibonacci number. F(0) = 0, F(1) = 1, F(n) = F(n - 1) + F(n - 2) for n > 1.",
    acceptanceRate: 68.9,
    tags: ["Math", "Recursion", "Dynamic Programming"],
    examples: [
      { input: "2", output: "1" },
      { input: "3", output: "2" },
      { input: "4", output: "3" },
    ],
    testCases: [
      { input: 2, expected: 1 },
      { input: 3, expected: 2 },
      { input: 4, expected: 3 },
      { input: 5, expected: 5 },
      { input: 10, expected: 55 },
    ],
    createdAt: new Date(),
  },
];

async function seedDatabase() {
  let client;

  try {
    console.log("Connecting to MongoDB (Problems)...");
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db("problems");

    console.log("Clearing existing problems...");
    await db.collection("problems").deleteMany({});

    console.log("Inserting sample problems...");
    const result = await db.collection("problems").insertMany(sampleProblems);

    console.log(`Successfully inserted ${result.insertedCount} problems!`);

    // Create indexes
    console.log("Creating indexes...");
    await db.collection("problems").createIndex({ id: 1 }, { unique: true });
    await db.collection("problems").createIndex({ difficulty: 1 });
    await db.collection("problems").createIndex({ tags: 1 });

    console.log("Problem database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    // Don't exit - let the service continue
  } finally {
    if (client) {
      await client.close();
      console.log("Database connection closed");
    }
  }
}

seedDatabase();
