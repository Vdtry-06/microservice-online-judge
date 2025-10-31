export const LANGUAGES = {
  javascript: {
    name: "JavaScript",
    template: `function solve(input) {\n  // Your code here\n  // input: string or object\n  // return: result\n  return input;\n}`,
    icon: "🟨",
  },
  python: {
    name: "Python",
    template: `def solve(input):\n    # Your code here\n    # input: string or object\n    # return: result\n    return input`,
    icon: "🐍",
  },
  cpp: {
    name: "C++",
    template: `// Define your solve function that takes a string and returns a string
string solve(string input) {
    // Your code here
    // Process input and return result
    return input;
}`,
    icon: "⚡",
  },
  java: {
    name: "Java",
    template: `public class Solution {
    // Define your solve method that takes a string and returns a string
    public String solve(String input) {
        // Your code here
        // Process input and return result
        return input;
    }
}`,
    icon: "☕",
  },
};

export const DIFFICULTY_COLORS = {
  Easy: {
    text: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/30",
  },
  Medium: {
    text: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/30",
  },
  Hard: {
    text: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
  },
};

export const STATUS_COLORS = {
  queued: { text: "text-gray-400", icon: "⏳" },
  judging: { text: "text-blue-400", icon: "⚙️" },
  accepted: { text: "text-green-400", icon: "✅" },
  wrong_answer: { text: "text-red-400", icon: "❌" },
  failed: { text: "text-red-500", icon: "💥" },
  completed: { text: "text-green-400", icon: "✅" },
};
