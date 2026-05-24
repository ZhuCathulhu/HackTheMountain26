const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the src directory
app.use(express.static(path.join(__dirname, 'src')));

const AUTH0_DOMAIN = 'dev-wdfb7tfjkndmtcl5.us.auth0.com';
const MANAGEMENT_API_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InZSY1JmZklKb0RCU3dQSlNvd091MyJ9.eyJpc3MiOiJodHRwczovL2Rldi13ZGZiN3RmamtuZG10Y2w1LnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJDZFhMaExnZjNtVFhaS3RwS1pNY2VRTEc4b0c5STBBYUBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9kZXYtd2RmYjd0ZmprbmRtdGNsNS51cy5hdXRoMC5jb20vYXBpL3YyLyIsImlhdCI6MTc3OTU2OTEyMCwiZXhwIjoxNzc5NjU1NTIwLCJzY29wZSI6ImNyZWF0ZTp1c2VycyByZWFkOnVzZXJzIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXpwIjoiQ2RYTGhMZ2YzbVRYWkt0cEtaTWNlUUxHOG9HOUkwQWEifQ.Y32faCB5wgj_-cqfgRkLADPrp_Fh6C2PyzPPvPaI_0pjLtq5w4Gj_aAvdjku9HjOEllcFQFu-dv8cbw_doOlBpT2Wbr1CsBenrylwtJZrPSFFqkDyOo6ymW2gnJ1aE-Do2TxAliXC1p1iva8JzvR6IlPpxP6AHq23vRb3Fw2lDaQVnl-XYgkzIyewYuR8ywT67UDeFWM8YLtax4B-xq4GqiQJJJxV1B7H06iL7fAHNXxzKs1KDVPB2MB_5u9ou3VsHD0Dsxj9kqS6MlkEUoZwlzL-yiDPVKf_jhVh4f2xCUsIVEUFaoqtDsYXYldKwVZ_Gw22Auw_ovRXXjfG_x5ng';

app.post('/api/signup', async (req, res) => {
  const { email, password, nickname } = req.body;

  if (!email || !password || !nickname) {
    return res.status(400).json({ error: 'Email, password, and nickname are required' });
  }

  try {
    const response = await axios.post(`https://${AUTH0_DOMAIN}/api/v2/users`, {
      email,
      password,
      nickname,
      connection: 'Username-Password-Authentication',
      user_metadata: { username: nickname }
    }, {
      headers: { 
        Authorization: `Bearer ${MANAGEMENT_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ success: true, message: 'User created successfully', user: response.data });
  } catch (error) {
    console.error('Auth0 Error:', error.response?.data || error.message);
    res.status(400).json({ 
      error: error.response?.data?.message || error.message,
      details: error.response?.data
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
