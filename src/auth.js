// auth.js — shared Auth0 initializer for all pages
// Usage: await initAuth()  → returns { client, user, token }
// Usage: await initAuth({ public: true })  → skips redirect, returns { client } even if not logged in

const AUTH0_CONFIG = {
  domain: 'dev-wdfb7tfjkndmtcl5.us.auth0.com',
  clientId: 'Ix662hc4PCymFOpQeFK4OvMKWzAjF3Cn',
  authorizationParams: {
    redirect_uri: location.origin,
    audience: 'https://performr.api',
  },
  cacheLocation: 'localstorage',   // ← persists session across page navigations
  useRefreshTokens: true,          // ← silently refreshes expired tokens
};

async function initAuth(opts = {}) {
  const client = await auth0.createAuth0Client(AUTH0_CONFIG);

  // If Auth0 just redirected back with a code, process it
  if (location.search.includes('code=') && location.search.includes('state=')) {
    try {
      await client.handleRedirectCallback();
    } catch (e) {
      console.warn('handleRedirectCallback error (safe to ignore on direct nav):', e.message);
    }
    history.replaceState({}, document.title, location.pathname);
  }

  if (opts.public) return { client };

  if (!(await client.isAuthenticated())) {
    window.location.href = 'index.html';
    return null;
  }

  const user  = await client.getUser();
  const token = await client.getTokenSilently();

  return { client, user, token };
}