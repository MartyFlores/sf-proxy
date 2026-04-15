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
// Optional Health Check
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
    // BASIC VALIDATION
    // =====================
    if (!instanceUrl || !endpoint || !method) {
      return res.status(400).json({
        error: 'Missing required fields: instanceUrl, endpoint, method'
      });
    }

    if (!endpoint.startsWith('/services/')) {
      return res.status(400).json({
        error: 'Invalid Salesforce endpoint format'
      });
    }

    // =====================
    // HEADERS SAFE PARSING
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
          details: err.message
        });
      }
    }

    // =====================
    // LOG REQUEST (Render logs)
    // =====================
    console.log('📤 Incoming Proxy Request');
    console.log('Instance:', instanceUrl);
    console.log('Endpoint:', endpoint);
    console.log('Method:', method);

    // =====================
    // CALL SALESFORCE
    // =====================
    const response = await axios({
      method: method,
      url: `${instanceUrl}${endpoint}`,
      headers: parsedHeaders,
      data: body,
      timeout: 30000
    });

    // =====================
    // SUCCESS LOG
    // =====================
    console.log('✅ Success:', response.status);

    return res.status(response.status).json(response.data);

  } catch (error) {

    console.error('❌ Proxy Error:', error.message);

    // =====================
    // Salesforce/API ERROR
    // =====================
    if (error.response) {
      console.error('📥 Response Error:', error.response.status);

      return res.status(error.response.status).json({
        error: 'Salesforce/API Error',
        status: error.response.status,
        data: error.response.data
      });
    }

    // =====================
    // NETWORK / UNKNOWN ERROR
    // =====================
    return res.status(500).json({
      error: 'Proxy failed',
      message: error.message
    });
  }
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Proxy running on port ${PORT}`);
});