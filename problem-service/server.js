const express = require('express');
const app = express();

app.use(express.json());

const problems = [
    {
        id: 1,
        title: 'Two Sum',
        difficulty: 'Easy',
        description: 'Given an array of integers nums and an integer target, return indices of two numbers that add up to target.',
        testCases: [
            { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
            { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] }
        ]
    },
    {
        id: 2,
        title: 'Reverse String',
        difficulty: 'Easy',
        description: 'Write a function that reverses a string.',
        testCases: [
            { input: 'hello', expected: 'olleh' },
            { input: 'world', expected: 'dlrow' }
        ]
    }
];

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'problem-service' });
});

app.get('/problems', (req, res) => {
    res.json(problems);
});

app.get('/problems/:id', (req, res) => {
    const problem = problems.find(p => p.id === parseInt(req.params.id));
    if (problem) {
        res.json(problem);
    } else {
        res.status(404).json({ error: 'Problem not found' });
    }
});

app.listen(3003, () => {
    console.log('Problem Service running on port 3003');
});