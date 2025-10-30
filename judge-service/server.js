const express = require('express');
const { VM } = require('vm2');
const app = express();

app.use(express.json());

const SERVICE_ID = process.env.SERVICE_ID || 'judge-unknown';
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'judge-service',
        id: SERVICE_ID 
    });
});

app.post('/execute', async (req, res) => {
    const { code, language, testCases } = req.body;
    
    console.log(`[${SERVICE_ID}] Executing code submission`);
    
    const startTime = Date.now();
    
    try {
        if (language === 'javascript') {
            const vm = new VM({
                timeout: 5000,
                sandbox: {}
            });
            
            const results = [];
            let allPassed = true;
            
            for (const testCase of testCases || []) {
                try {
                    const result = vm.run(`
                        ${code}
                        JSON.stringify(solve(${JSON.stringify(testCase.input)}))
                    `);
                    
                    const output = JSON.parse(result);
                    const passed = JSON.stringify(output) === JSON.stringify(testCase.expected);
                    
                    results.push({
                        input: testCase.input,
                        expected: testCase.expected,
                        output: output,
                        passed: passed,
                        time: Date.now() - startTime
                    });
                    
                    if (!passed) allPassed = false;
                } catch (err) {
                    results.push({
                        input: testCase.input,
                        error: err.message,
                        passed: false
                    });
                    allPassed = false;
                }
            }
            
            const executionTime = Date.now() - startTime;
            
            res.json({
                status: allPassed ? 'accepted' : 'wrong_answer',
                executionTime,
                results,
                judgeId: SERVICE_ID,
                memory: process.memoryUsage().heapUsed / 1024 / 1024
            });
        } else {
            res.status(400).json({ 
                error: 'Unsupported language',
                message: 'Currently only JavaScript is supported' 
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'runtime_error',
            error: error.message,
            judgeId: SERVICE_ID
        });
    }
});

app.listen(PORT, () => {
    console.log(`[${SERVICE_ID}] Judge Service running on port ${PORT}`);
});