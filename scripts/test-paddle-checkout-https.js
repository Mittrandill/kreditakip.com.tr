require('dotenv').config({ path: '.env.local' });
const https = require('https');

const API_KEY = process.env.PADDLE_API_KEY;
if (!API_KEY) {
  console.error('❌ PADDLE_API_KEY not found in .env.local');
  process.exit(1);
}

const checkoutData = JSON.stringify({
  items: [{
    price_id: 'pri_01kb7ra837dxxjgeabezwr2tpk',
    quantity: 1
  }],
  customer_email: 'test@example.com',
  custom_data: {
    user_id: 'test-user-123',
    plan_id: 'premium'
  },
  success_url: 'https://undeaf-shaneka-fernless.ngrok-free.dev/api/subscription/checkout/callback?success=true',
  cancel_url: 'https://undeaf-shaneka-fernless.ngrok-free.dev/subscription?canceled=true'
});

const options = {
  hostname: 'sandbox-api.paddle.com',
  port: 443,
  path: '/checkouts',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': checkoutData.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.data) {
        console.log('\n✅ Checkout created successfully!');
        console.log(`URL: ${response.data.url}`);
        console.log(`ID: ${response.data.id}`);
      } else {
        console.error('\n❌ Error:');
        console.error(JSON.stringify(response, null, 2));
      }
    } catch (e) {
      console.error('Failed to parse response:', e);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(checkoutData);
req.end();