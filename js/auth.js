// ============================================================
// auth.js — Google Identity Services token flow + persistence
// ============================================================
// Persist the token (+ expiry) so a page refresh reuses it instead
// of forcing a fresh sign-in. Tokens last ~1h; after that we refresh
// silently (no popup) because the Google session + prior consent remain.

function saveToken(token, expiresInSec){
  try {
    var expiresAt = new Date().getTime() + (expiresInSec||3600)*1000;
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token:token, expiresAt:expiresAt }));
    console.log('[auth] token saved, expires in', expiresInSec, 's');
  } catch(e){ console.warn('[auth] saveToken FAILED — localStorage unavailable:', e); }
}
function loadStoredToken(){
  try {
    var raw=localStorage.getItem(TOKEN_KEY);
    console.log('[auth] loadStoredToken raw =', raw);
    if(!raw) return null;
    var o=JSON.parse(raw);
    var msLeft = o.expiresAt - new Date().getTime();
    console.log('[auth] stored token has', Math.round(msLeft/1000), 's left');
    // Treat as valid only with >60s of life left (buffer for in-flight calls).
    if(o && o.token && o.expiresAt && msLeft > 60000) return o.token;
  } catch(e){ console.warn('[auth] loadStoredToken error:', e); }
  return null;
}
function clearStoredToken(){ try { localStorage.removeItem(TOKEN_KEY); } catch(e){} }

// Ask Google for a token without showing UI. Resolves once the token
// callback fires. Used on 401 (expiry) and on load when we had a session.
var _silentResolve=null, _silentReject=null;
function refreshTokenSilently(){
  return new Promise(function(resolve, reject){
    if(!tokenClient){ reject(new Error('auth not ready')); return; }
    _silentResolve=resolve; _silentReject=reject;
    try { tokenClient.requestAccessToken({ prompt:'' }); }
    catch(e){ _silentResolve=_silentReject=null; reject(e); }
  });
}

function onSignedIn(){
  $('authStatus').textContent='Signed in';
  $('signin').classList.add('hidden'); $('signout').classList.remove('hidden');
  $('splash').classList.add('hidden');
  toast('Loading board…');
  loadCards().then(function(){ showView('board'); toast('Board loaded'); }).catch(fail);
}
function onSignOut(){
  if(accessToken) google.accounts.oauth2.revoke(accessToken, function(){});
  accessToken=null; cards=[]; clearStoredToken();
  $('authStatus').textContent='Not signed in';
  $('signin').classList.remove('hidden'); $('signout').classList.add('hidden');
  $('boardView').classList.add('hidden'); $('analyticsView').classList.add('hidden');
  $('splash').classList.remove('hidden');
}
function initAuth(){
  tokenClient=google.accounts.oauth2.initTokenClient({
    client_id:CLIENT_ID, scope:SCOPES,
    callback:function(resp){
      if(resp.error){
        if(_silentReject){ var rj=_silentReject; _silentResolve=_silentReject=null; rj(new Error(resp.error)); return; }
        fail(new Error(resp.error)); return;
      }
      accessToken=resp.access_token;
      saveToken(resp.access_token, parseInt(resp.expires_in,10)||3600);
      if(_silentResolve){ var rs=_silentResolve; _silentResolve=_silentReject=null; rs(); }
      else { onSignedIn(); }
    }
  });
  $('signin').disabled=false;

  // Restore a previous session on load.
  var stored=loadStoredToken();
  console.log('[auth] initAuth — restored token?', !!stored, '| had-token-key?', !!localStorage.getItem(TOKEN_KEY));
  if(stored){
    accessToken=stored;
    onSignedIn(); // token still valid; api() will silent-refresh if it 401s.
  } else if(localStorage.getItem(TOKEN_KEY)){
    // We had a session before (token just expired) — refresh without a popup.
    clearStoredToken();
    refreshTokenSilently().then(onSignedIn).catch(function(){ /* stay on splash */ });
  }
}
