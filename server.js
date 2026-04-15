const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// =====================
// Middleware
// =====================
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// =====================
// Health Check (IMPORTANT)
// =====================
app.get('/', (req, res) => {
  res.status(200).send('Salesforce Proxy is running 🚀');
});

// =====================
// PROXY ENDPOINT
// =====================
app.post('/proxy', async (req, res) => {

  try {
    const {
      instanceUrl,
      endpoint,
      method,
      headers,
      body
    } = req.body;

    // =====================
    // VALIDATION
    // =====================
    if (!instanceUrl || !endpoint || !method) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    if (!endpoint.startsWith('/services/')) {
      return res.status(400).json({
        error: 'Invalid Salesforce endpoint'
      });
    }

    // =====================
    // HEADERS SAFE PARSE
    // =====================
    let parsedHeaders = {};

    if (headers) {
      try {
        parsedHeaders =
          typeof headers === 'string'
            ? JSON.parse(headers)
            : headers;
      } catch (e) {
        return res.status(400).json({
          error: 'Invalid headers JSON',
          message: e.message
        });
      }
    }

    console.log('📤 Proxy Request:', instanceUrl + endpoint);

    // =====================
    // CALL SALESFORCE
    // =====================
    const response = await axios({
      method,
      url: `${instanceUrl}${endpoint}`,
      headers: parsedHeaders,
      data: body,
      timeout: 30000
    });

    return res.status(response.status).json(response.data);

  } catch (error) {

    console.error('❌ Proxy Error:', error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Salesforce/API Error',
        status: error.response.status,
        data: error.response.data
      });
    }

    return res.status(500).json({
      error: 'Proxy failed',
      message: error.message
    });
  }
});

// =====================
// START SERVER (RENDER SAFE)
// =====================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Proxy running on port ${PORT}`);
});