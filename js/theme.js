// ============================================================
// theme.js — light / dark theme toggle + persistence
// Theme is applied via <html data-theme="light|dark">; the CSS
// variable sets in styles.css do the rest.
// ============================================================

function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(THEME_KEY, t); } catch(e){}
  var btn=$('themeToggle');
  if(btn) btn.innerHTML = (t==='dark') ? '<span class="ic">☀️</span> Light mode' : '<span class="ic">🌙</span> Dark mode';
}
function toggleTheme(){
  var cur=document.documentElement.getAttribute('data-theme')||'light';
  applyTheme(cur==='dark' ? 'light' : 'dark');
}
function initTheme(){
  var saved='light';
  try { saved=localStorage.getItem(THEME_KEY)||'light'; } catch(e){}
  applyTheme(saved);
  var btn=$('themeToggle');
  if(btn) btn.addEventListener('click', toggleTheme);
}
initTheme();
