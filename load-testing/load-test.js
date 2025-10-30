// ============================================
// LOAD TEST 1: Node.js Script với nhiều concurrent requests
// File: load-test.js
// ============================================

const axios = require('axios');

const API_URL = 'http://localhost/api';

// Test cases
const testCodes = {
  javascript: `function solve(str) {
  return str.split('').reverse().join('');
}`,
  
  cpp: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    string input;
    cin >> input;
    reverse(input.begin(), input.end());
    cout << input;
    return 0;
}`,

  python: `input_str = input()
print(input_str[::-1])`,

  java: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();
        String reversed = new StringBuilder(input).reverse().toString();
        System.out.println(reversed);
        scanner.close();
    }
}`
};

const testData = {
  code: testCodes.javascript,
  language: 'javascript',
  testCases: [
    { input: 'hello', expected: 'olleh' },
    { input: 'world', expected: 'dlrow' }
  ]
};

// Statistics
let stats = {
  total: 0,
  success: 0,
  failed: 0,
  totalTime: 0,
  minTime: Infinity,
  maxTime: 0,
  errors: {}
};

async function submitCode() {
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${API_URL}/submit`, testData, {
      timeout: 30000
    });
    
    const duration = Date.now() - startTime;
    
    stats.success++;
    stats.totalTime += duration;
    stats.minTime = Math.min(stats.minTime, duration);
    stats.maxTime = Math.max(stats.maxTime, duration);
    
    return { success: true, duration, judgeId: response.data.judgeId };
  } catch (error) {
    stats.failed++;
    const errorType = error.code || error.response?.status || 'unknown';
    stats.errors[errorType] = (stats.errors[errorType] || 0) + 1;
    return { success: false, error: error.message };
  } finally {
    stats.total++;
  }
}

async function runLoadTest(concurrentUsers, requestsPerUser) {
  console.log('Starting Load Test...');
  console.log(`Concurrent Users: ${concurrentUsers}`);
  console.log(`Requests per User: ${requestsPerUser}`);
  console.log(`Total Requests: ${concurrentUsers * requestsPerUser}`);
  console.log('━'.repeat(50));
  
  const startTime = Date.now();
  
  // Create batches of concurrent requests
  const allPromises = [];
  
  for (let i = 0; i < concurrentUsers; i++) {
    for (let j = 0; j < requestsPerUser; j++) {
      allPromises.push(submitCode());
    }
  }
  
  // Execute all requests
  const results = await Promise.all(allPromises);
  
  const totalDuration = Date.now() - startTime;
  
  // Print results
  console.log('\nLoad Test Complete!');
  console.log('━'.repeat(50));
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`Total Requests: ${stats.total}`);
  console.log(`Successful: ${stats.success} (${(stats.success/stats.total*100).toFixed(2)}%)`);
  console.log(`Failed: ${stats.failed} (${(stats.failed/stats.total*100).toFixed(2)}%)`);
  console.log(`Requests/sec: ${(stats.total / (totalDuration / 1000)).toFixed(2)}`);
  console.log(`Avg Response Time: ${(stats.totalTime / stats.success).toFixed(2)}ms`);
  console.log(`Min Response Time: ${stats.minTime}ms`);
  console.log(`Max Response Time: ${stats.maxTime}ms`);
  
  if (Object.keys(stats.errors).length > 0) {
    console.log('\nError Breakdown:');
    Object.entries(stats.errors).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }
  
  // Judge distribution
  const judgeDistribution = {};
  results.filter(r => r.success).forEach(r => {
    judgeDistribution[r.judgeId] = (judgeDistribution[r.judgeId] || 0) + 1;
  });
  
  console.log('\nLoad Balancer Distribution:');
  Object.entries(judgeDistribution).forEach(([judgeId, count]) => {
    const percentage = (count / stats.success * 100).toFixed(2);
    console.log(`   ${judgeId}: ${count} requests (${percentage}%)`);
  });
}

// Run test with different scenarios
async function runTestScenarios() {
  console.log('\nTEST SCENARIO 1: Light Load');
  stats = { total: 0, success: 0, failed: 0, totalTime: 0, minTime: Infinity, maxTime: 0, errors: {} };
  await runLoadTest(10, 5); // 10 users, 5 requests each = 50 requests
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n\nTEST SCENARIO 2: Medium Load');
  stats = { total: 0, success: 0, failed: 0, totalTime: 0, minTime: Infinity, maxTime: 0, errors: {} };
  await runLoadTest(50, 10); // 50 users, 10 requests each = 500 requests
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n\nTEST SCENARIO 3: Heavy Load');
  stats = { total: 0, success: 0, failed: 0, totalTime: 0, minTime: Infinity, maxTime: 0, errors: {} };
  await runLoadTest(100, 20); // 100 users, 20 requests each = 2000 requests
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n\nTEST SCENARIO 4: Extreme Load (Stress Test)');
  stats = { total: 0, success: 0, failed: 0, totalTime: 0, minTime: Infinity, maxTime: 0, errors: {} };
  await runLoadTest(500, 10); // 500 users, 10 requests each = 5000 requests
}

// Custom test
async function customTest(users, requests) {
  stats = { total: 0, success: 0, failed: 0, totalTime: 0, minTime: Infinity, maxTime: 0, errors: {} };
  await runLoadTest(users, requests);
}

// Run based on command line arguments
const args = process.argv.slice(2);
if (args.length === 2) {
  const users = parseInt(args[0]);
  const requests = parseInt(args[1]);
  customTest(users, requests);
} else {
  runTestScenarios();
}

// Export for use in other scripts
module.exports = { submitCode, runLoadTest, customTest };