const aut0 = new auth0.WebAuth({
    domain: 'AUTH0_DOMAIN_NAME',
    clientID: 'AUTH0_CLIENT_ID',
    redirectUri: 'http://localhost:3000/callback',
    responseType: 'token id_token',
    scope: 'openid profile email'
});

function login() {
    aut0.authorize();
}

function handleAuthentication() {
    aut0.parseHash((err, authResult) => {
        if (authResult && authResult.accessToken && authResult.idToken) {
            setSession(authResult);
        } else if (err) {
            console.log(err);
        }
    });
}

const jwt = require('jsonwebtoken');

function checkJwt(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).send('No token provided');
    }
    jwt.verify(token, 'YOUR_API_SECRET', (err, decoded) => {
        if (err) {
            return res.status(401).send('Invalid token');
        }
        req.decoded = decoded.sub;
        next();
    });
}

function callApi() {
    const token = localStorage.getItem('access_token');
    fetch('http://localhost:3000/api/private', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    aut0.logout({
        returnTo: 'http://localhost:3000',
    });
}