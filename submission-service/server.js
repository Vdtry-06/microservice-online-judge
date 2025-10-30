const express = require('express');
const app = express();

app.use(express.json());

// In-memory storage (replace with MongoDB in production)
const submissions = [];

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'submission-service' });
});

app.post('/submissions', (req, res) => {
    const submission = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date()
    };
    submissions.push(submission);
    res.json(submission);
});

app.get('/submissions', (req, res) => {
    res.json(submissions.slice(-50).reverse()); // Last 50 submissions
});

app.listen(3002, () => {
    console.log('Submission Service running on port 3002');
});