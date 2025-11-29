require('dotenv').config({ path: '.env.local' });
const https = require('https');

// Get API key from environment
const API_KEY = process.env.PADDLE_API_KEY;
const PRICE_ID = 'pri_01kb7rczq5dj86fcq63941dn2m';

if (!API_KEY) {
  console.error('❌ PADDLE_API_KEY not found in .env.local');
  process.exit(1);
}

const options = {
  hostname: 'sandbox-api.paddle.com',
  port: 443,
  path: `/prices/${PRICE_ID}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('\n✅ Price found:');
        console.log(JSON.stringify(response, null, 2));
      } else {
        console.log('\n❌ Error:');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (e) {
      console.error('Failed to parse response:', e);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();

// Also list all prices to see available ones
console.log('\nFetching all prices...');

const listOptions = {
  hostname: 'sandbox-api.paddle.com',
  port: 443,
  path: '/prices',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
};

const listReq = https.request(listOptions, (res) => {
  console.log(`\nList Status: ${res.statusCode}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (res.statusCode === 200 && response.data) {
        console.log('\n📦 Available Prices:');
        response.data.forEach((price, index) => {
          console.log(`${index + 1}. ID: ${price.id}`);
          console.log(`   Product ID: ${price.product_id}`);
          console.log(`   Amount: ${price.unit_price?.amount} ${price.unit_price?.currency_code}`);
          console.log(`   Description: ${price.description || 'No description'}`);
          console.log('---');
        });
      }
    } catch (e) {
      console.error('Failed to parse list response:', e);
    }
  });
});

listReq.on('error', (e) => {
  console.error(`List request error: ${e.message}`);
});

listReq.end();