const https = require('https');

const API_KEY = 'sk-tpcfhwsckdrngcfeymudxjgnuhxadegbqzjztnakfceutvwy';
const ENDPOINT = 'https://api.siliconflow.cn/v1/images/generations';

// 64x64 Grey PNG
const BASE64_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAACQd1PeAAAARklEQVR42u3PQREAAAgDML5/0zjhgQZfs4CqmZnL5/P5fD6fz+fz+Xw+n8/n8/l8Pp/P5/P5fD6fz+fz+Xw+n8/n8/l8Pp/P5/MvF0pL6wFq9b5LAAAAAElFTkSuQmCC';

async function runTest(testName, payload) {
  console.log(`\n--- [TEST: ${testName}] ---`);
  console.log('Model:', payload.model);
  
  const data = JSON.stringify(payload);
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Length': data.length
    }
  };

  return new Promise((resolve) => {
    const req = https.request(ENDPOINT, options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('BODY:', body.substring(0, 200) + (body.length > 200 ? '...' : ''));
        resolve();
      });
    });
    req.on('error', (e) => console.error(e));
    req.write(data);
    req.end();
  });
}

async function main() {
  // Test 3: Img2Img (FLUX.1-dev)
  await runTest('Img2Img (FLUX.1-dev)', {
    model: 'black-forest-labs/FLUX.1-dev',
    prompt: 'Turn this into a red cube',
    image: BASE64_IMAGE,
    strength: 0.75,
    image_size: "1024x1024"
  });
}

main();
