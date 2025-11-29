require('dotenv').config({ path: '.env.local' });
const https = require('https');

const API_KEY = process.env.PADDLE_API_KEY;
if (!API_KEY) {
  console.error('❌ PADDLE_API_KEY not found in .env.local');
  process.exit(1);
}

const endpoints = [
  '/products',
  '/prices',
  '/customers',
  '/checkouts',
  '/subscriptions',
  '/v1/products',
  '/v1/prices',
  '/v1/checkouts'
];

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'sandbox-api.paddle.com',
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`\n${endpoint}:`);
      console.log(`  Status: ${res.statusCode}`);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.data) {
            console.log(`  ✅ Working - Found ${response.data.length || 1} items`);
            if (endpoint === '/products' || endpoint === '/v1/products') {
              console.log('  📦 Sample products:');
              response.data.slice(0, 2).forEach((p, i) => {
                console.log(`    ${i + 1}. ${p.name} (ID: ${p.id})`);
              });
            }
          } else if (response.error) {
            console.log(`  ❌ Error: ${response.error.detail}`);
          } else {
            console.log(`  ℹ️  Response: ${data.substring(0, 100)}...`);
          }
        } catch (e) {
          console.log(`  Raw response: ${data.substring(0, 100)}...`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`\n${endpoint}: ❌ Request error: ${e.message}`);
      resolve();
    });

    req.setTimeout(5000, () => {
      console.log(`\n${endpoint}: ⏰ Timeout`);
      req.abort();
      resolve();
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🔍 Testing Paddle API endpoints...\n');

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }

  console.log('\n✅ Testing complete!');
}

testAllEndpoints();