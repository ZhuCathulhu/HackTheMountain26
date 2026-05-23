const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const AUTH0_DOMAIN = 'dev-wdfb7tfjkndmtcl5.us.auth0.com';
const AUTH0_MANAGEMENT_API_TOKEN = 'YOUR_MANAGEMENT_API_TOKEN'; // Get from Auth0 Dashboard

app.post('/api/signup', async (req, res) => {
  const { email, password, nickname } = req.body;

  try {
    const response = await axios.post(`https://${AUTH0_DOMAIN}/api/v2/users`, {
      email,
      password,
      nickname,
      connection: 'Username-Password-Authentication',
      user_metadata: { username: nickname }
    }, {
      headers: { Authorization: `Bearer ${AUTH0_MANAGEMENT_API_TOKEN}` }
    });

    res.json({ success: true, user: response.data });
  } catch (error) {
    res.status(400).json({ error: error.response?.data || error.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));