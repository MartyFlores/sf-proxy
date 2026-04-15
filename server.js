const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// 🎯 Target Salesforce (Litify) endpoint
const TARGET_URL =
  'https://reyeslaw.my.salesforce-sites.com/api/services/apexrest/litify_pm/api/v1/intake/create';

/**
 * Proxy Endpoint
 * Salesforce → Node → Reyes Salesforce
 */
app.post('/proxy', async (req, res) => {
  try {

    console.log('📥 Incoming request:');
    console.log(JSON.stringify(req.body, null, 2));

    // 🚀 Forward request directly to Reyes Salesforce
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

    // ✅ Return response back to your Salesforce org
    return res.status(response.status).json(response.data);

  } catch (error) {

    console.error('❌ Proxy Error:', error.message);

    if (error.response) {
      console.error('📛 Error response data:', error.response.data);

      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      error: 'Proxy failed',
      message: error.message
    });
  }
});

// 🌐 Health check
app.get('/', (req, res) => {
  res.send('Salesforce Proxy is running 🚀');
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Proxy running on port ${PORT}`);
});