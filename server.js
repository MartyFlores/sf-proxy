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
// Health Check Route
// =====================
app.get('/', (req, res) => {
  res.send('Salesforce Proxy is running 🚀');
});

// =====================
// MAIN PROXY ENDPOINT
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
        error: 'Invalid Salesforce endpoint format'
      });
    }

    // =====================
    // SAFE HEADERS PARSING
    // =====================
    let parsedHeaders = {};

    if (headers) {
      try {
        parsedHeaders =
          typeof headers === 'string'
            ? JSON.parse(headers)
            : headers;
      } catch (err) {
        return res.status(400).json({
          error: 'Invalid headers JSON',
          message: err.message
        });
      }
    }

    console.log('📤 Proxy Request:');
    console.log('Instance:', instanceUrl);
    console.log('Endpoint:', endpoint);
    console.log('Method:', method);

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

    console.log('✅ Success:', response.status);

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

// 🔥 CRITICAL FIX FOR RENDER
const PORT = process.env.PORT;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Proxy running on port ${PORT}`);
});