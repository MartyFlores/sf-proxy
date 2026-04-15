const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// 🔐 Your API Key (change this!)
const API_KEY = process.env.API_KEY || 'my-secret-key';

// 🎯 Target Salesforce (Litify) endpoint
const TARGET_URL = 'https://reyeslaw.my.salesforce-sites.com/api/services/apexrest/litify_pm/api/v1/intake/create';

/**
 * Proxy Endpoint
 * Salesforce → Node → Salesforce (Litify)
 */
app.post('/proxy', async (req, res) => {
  try {

    // 🔐 API Key check
    const clientKey = req.headers['x-api-key'];

    if (clientKey !== API_KEY) {
      return res.status(401).json({
        error: 'Unauthorized - Invalid API Key'
      });
    }

    console.log('📥 Incoming request:');
    console.log(JSON.stringify(req.body, null, 2));

    // 🚀 Forward request to Litify Salesforce
    const response = await axios({
      method: 'POST',
      url: TARGET_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: req.body,
      timeout: 30000
    });

    console.log('📤 Response from Salesforce:');
    console.log(response.data);

    // ✅ Return response back to Salesforce (your org)
    return res.status(response.status).json(response.data);

  } catch (error) {

    console.error('❌ Proxy Error:', error.message);

    if (error.response) {
      // Salesforce returned an error response
      return res.status(error.response.status).json(error.response.data);
    }

    // Network / unexpected error
    return res.status(500).json({
      error: 'Proxy failed',
      message: error.message
    });
  }
});

// 🌐 Health check (optional but useful)
app.get('/', (req, res) => {
  res.send('Salesforce Proxy is running 🚀');
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Proxy running on port ${PORT}`);
});