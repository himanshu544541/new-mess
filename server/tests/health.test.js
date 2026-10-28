process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('../src/server');

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`[Test Server] Listening on dynamic port ${port}`);

  http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);
        console.log('[Test Result] Health Check Response:', parsedData);
        if (parsedData.status === 'ok') {
          console.log('>>> HEALTH CHECK TEST PASSED <<<');
          server.close(() => process.exit(0));
        } else {
          console.error('>>> HEALTH CHECK TEST FAILED: unexpected status <<<');
          server.close(() => process.exit(1));
        }
      } catch (e) {
        console.error('>>> HEALTH CHECK PARSE ERROR:', e.message);
        server.close(() => process.exit(1));
      }
    });
  }).on('error', (e) => {
    console.error(`>>> HEALTH CHECK REQUEST FAILED: ${e.message}`);
    server.close(() => process.exit(1));
  });
});

