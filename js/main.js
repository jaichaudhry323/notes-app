// ============================================================
// main.js — view switching, card creation, and app bootstrap
// Loaded last. Wires static controls and starts auth.
// ============================================================

function showView(v){
  currentView=v;
  var views={ board:'boardView', analytics:'analyticsView', calendar:'calendarView', locations:'locationsView' };
  var navs ={ board:'navBoard', analytics:'navAnalytics', calendar:'navCalendar', locations:'navLocations' };
  Object.keys(views).forEach(function(k){ $(views[k]).classList.toggle('hidden', v!==k); });
  Object.keys(navs).forEach(function(k){ $(navs[k]).classList.toggle('active', v===k); });
  if(v==='board') renderBoard();
  else if(v==='analytics') renderAnalytics();
  else if(v==='calendar') renderCalendar();
  else if(v==='locations') renderLocations();
}

// Create card / add action are handled by the modals in create.js
// (openNewCard / openAddAction).

function setFilter(f){
  currentFilter=f;
  $('viewActive').classList.toggle('active', f==='active');
  $('viewDeleted').classList.toggle('active', f==='deleted');
  if(currentView==='board') renderBoard();
}

// ---- wire static controls ----
$('signin').addEventListener('click', function(){
  if(!tokenClient){ toast('Google auth not ready — try again', true); return; }
  tokenClient.requestAccessToken({prompt: accessToken?'':'consent'});
});
$('signout').addEventListener('click', onSignOut);
$('btnNewCard').addEventListener('click', openNewCard);
$('btnAddAction').addEventListener('click', openAddAction);
$('navBoard').addEventListener('click', function(){ showView('board'); });
$('navAnalytics').addEventListener('click', function(){ showView('analytics'); });
$('navCalendar').addEventListener('click', function(){ showView('calendar'); });
$('navLocations').addEventListener('click', function(){ showView('locations'); });
$('viewActive').addEventListener('click', function(){ setFilter('active'); });
$('viewDeleted').addEventListener('click', function(){ setFilter('deleted'); });
$('dClose').addEventListener('click', closeDetail);
$('overlay').addEventListener('click', closeDetail);
$('createOverlay').addEventListener('click', closeCreate);

// ---- boot: wait for Google Identity Services, then init auth ----
window.addEventListener('load', function(){
  var tries=0;
  (function wait(){
    if(window.google&&google.accounts&&google.accounts.oauth2){ initAuth(); }
    else if(tries++<50){ setTimeout(wait,100); }
    else { toast('Could not load Google Identity Services', true); }
  })();
});
