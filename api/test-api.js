const request = require('supertest');
const app = require('./app');

const tests = [
    {
        name: 'Health check returns OK',
        run: () => request(app)
            .get('/api/health')
            .expect(200)
            .then(res => res.body?.status === 'ok')
    }
];

(async () => {
    let passed = 0;

    console.log('=================================');
    console.log('Tophill Portal API Smoke Tests');
    console.log('=================================\n');

    for (const test of tests) {
        process.stdout.write(`• ${test.name} ... `);
        try {
            const result = await test.run();
            const success = result === true || result === undefined;
            if (success) {
                passed += 1;
                console.log('✅');
            } else {
                console.log('❌  (unexpected response)');
            }
        } catch (error) {
            console.log(`❌  (${error.message})`);
        }
    }

    console.log('\n=================================');
    console.log(`Passed ${passed} of ${tests.length} tests`);
    console.log('=================================');
    process.exit(passed === tests.length ? 0 : 1);
})();