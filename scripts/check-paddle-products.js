const https = require('https');

const options = {
  hostname: 'sandbox-api.paddle.com',
  port: 443,
  path: '/products',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer pdl_sandbox_apikey_01kb61em27ktbc9w3c68xa4jxn_G5YQVddCqrVgCfAhd8xwTs_Aq0',
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
      if (response.data) {
        console.log('\n📦 Your Products:\n');
        response.data.forEach(product => {
          console.log(`Product Name: ${product.name}`);
          console.log(`Product ID: ${product.id}`);
          console.log(`Type: ${product.type}`);
          if (product.prices && product.prices.length > 0) {
            console.log('Prices:');
            product.prices.forEach(price => {
              console.log(`  - Price ID: ${price.id}`);
              console.log(`    Currency: ${price.currency}`);
              console.log(`    Amount: ${price.amount}`);
              console.log(`    Status: ${price.status}`);
            });
          }
          console.log('---');
        });
      } else if (response.error) {
        console.error('Error:', response.error.detail);
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

req.end();