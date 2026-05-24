async function initApp() {
  // Init Supabase
  const { createClient } = supabase;
  window.db = createClient(
    'https://golijzcjitljymhpjaur.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvbGlqemNqaXRsanltaHBqYXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDYxMDQsImV4cCI6MjA5NTEyMjEwNH0.fRLEv-8VrrrdnN6Ds9iux4PuDfHcLS3x2ezodp4w_Bk'
  );

  // Init Auth0
  window.client = await auth0.createAuth0Client({
    domain: 'dev-wdfb7tfjkndmtcl5.us.auth0.com',
    clientId: 'Ix662hc4PCymFOpQeFK4OvMKWzAjF3Cn',
    authorizationParams: {
      redirect_uri: location.origin,
      audience: 'https://performr.api',
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
  });

  // Guard — redirect if not logged in
  if (!await window.client.isAuthenticated()) {
    window.location.href = 'index.html';
    return false;
  }

  // Set globals used by every page
  window.currentUser = await window.client.getUser();
  const token = await window.client.getTokenSilently();
  window.db.functions.setAuth(token);

  return true;
}