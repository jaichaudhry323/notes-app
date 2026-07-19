// ============================================================
// location.js — Locations view
// Groups action items (events) that have a location, so you can see
// what's happening at each place. Locations are set on an action via
// the "Add Action" modal (or the card's Tasks tab).
// ============================================================

function renderLocations(){
  var body=$('locationsBody');
  var active=cards.filter(function(c){ return c.status!=='deleted'; });
  if(!active.length){ body.innerHTML='<div class="empty"><div class="big">📍</div>No cards yet.</div>'; return; }
  body.innerHTML='<div style="text-align:center;padding:40px"><span class="loader"></span> Loading…</div>';
  Promise.all(active.map(function(c){ return readCard(c.tab); })).then(function(all){
    var byLoc={};
    all.forEach(function(full,i){
      var c=active[i];
      full.actions.forEach(function(a){
        if(a.location){ (byLoc[a.location]=byLoc[a.location]||[]).push({ card:c.name, color:c.color, emoji:c.emoji, text:a.item, by:a.by, done:a.done }); }
      });
    });
    var locs=Object.keys(byLoc).sort();
    if(!locs.length){
      body.innerHTML='<div class="empty"><div class="big">📍</div>No events have a location yet.<br>'+
        '<span style="font-size:13px">Add a <b>Location</b> when you create an action (＋ Add Action).</span></div>';
      return;
    }
    body.innerHTML=locs.map(function(loc){
      var evs=byLoc[loc];
      return '<div class="loc-card"><div class="loc-head">📍 '+esc(loc)+' <span class="loc-count">'+evs.length+'</span></div>'+
        evs.map(function(e){
          return '<div class="loc-evt'+(e.done?' done':'')+'"><span class="cal-evt-dot" style="background:'+e.color+'"></span>'+
            '<div><div class="cal-evt-top">'+esc(e.emoji||'')+' <b>'+esc(e.card)+'</b>'+(e.by?' · 📅 '+esc(e.by):'')+(e.done?' ✓':'')+'</div>'+
            '<div class="cal-evt-txt">'+esc(e.text)+'</div></div></div>';
        }).join('')+
      '</div>';
    }).join('');
  }).catch(fail);
}
