// ============================================================
// modal.js — card detail modal (tabs + two-column, light)
// Matches card_modal_after_click.png
// ============================================================

function openDetail(tab){
  var card=cards.filter(function(c){return c.tab===tab;})[0]; if(!card) return;
  currentTab='overview';
  $('overlay').classList.add('show'); $('detailSheet').classList.add('show');
  $('detailBody').innerHTML='<div style="text-align:center;padding:40px"><span class="loader"></span></div>';
  $('detailSide').innerHTML=''; $('dChips').innerHTML=''; $('dTabs').innerHTML='';
  $('dTitle').textContent=card.name; $('dEmoji').textContent=card.emoji||'🗂️';
  Promise.all([ readCard(tab), bumpTap(card) ]).then(function(r){
    openCard=r[0]; openCard.meta.tapCount=card.tapCount;
    renderDetail();
  }).catch(fail);
}
function closeDetail(){
  $('overlay').classList.remove('show'); $('detailSheet').classList.remove('show'); openCard=null;
  loadCards().then(renderBoard); // refresh board (status, tap counts, stats).
}

function renderDetail(){
  var c=openCard.meta, entries=openCard.entries, actions=openCard.actions;
  var ratings=entries.filter(function(e){return e.rating!=null;}).map(function(e){return e.rating;});
  var avg=ratings.length?(ratings.reduce(function(a,b){return a+b;},0)/ratings.length):null;
  var pct=actions.length?Math.round(actions.filter(function(a){return a.done;}).length/actions.length*100):0;
  var f=freshness(c.lastProgress);
  var pnames={0:'Critical',1:'High',2:'Medium',3:'Low'};
  var pcolor={0:'#b91c1c',1:'var(--m-bad)',2:'var(--m-warn)',3:'var(--m-good)'};
  var deleted=c.status==='deleted';

  // ---- header ----
  $('dEmoji').textContent=c.emoji||'🗂️';
  $('dEmoji').style.background=hexToRgba(c.color,0.16);
  $('dColorDot').style.background=f.color;
  $('dTitle').textContent=c.name;
  $('dDesc').textContent=c.description||''; $('dDesc').style.display=c.description?'block':'none';
  $('dStar').textContent=c.favorite?'★':'☆';
  $('dChips').innerHTML=
    '<span class="chip" style="color:'+(pcolor[c.priority]||'var(--m-2)')+'">● '+(pnames[c.priority]||'—')+' Priority</span>'+
    '<span class="chip">🕐 '+c.hoursPerDay+' hrs/day</span>'+
    '<span class="chip" style="color:'+f.color+'">◐ '+pct+'% Complete</span>'+
    '<span class="chip">📅 Created '+fmtDate(c.createdAt)+'</span>';

  // ---- tabs ----
  var tabs=[['overview','🏠 Overview'],['daily','🗓 Daily Log'],['tasks','☑ Tasks'],['notes','📝 Notes'],['files','📎 Files'],['settings','⚙ Settings']];
  $('dTabs').innerHTML=tabs.map(function(t){ return '<button data-tab="'+t[0]+'" class="'+(currentTab===t[0]?'active':'')+'">'+t[1]+'</button>'; }).join('');

  // ---- main (active tab) ----
  var main='';
  if(currentTab==='overview') main=viewOverview(c,entries,actions,avg,pct,f);
  else if(currentTab==='daily') main=viewDaily(entries);
  else if(currentTab==='tasks') main=viewTasks(actions);
  else if(currentTab==='notes') main=viewNotes();
  else if(currentTab==='files') main=viewFiles();
  else if(currentTab==='settings') main=viewSettings(c,deleted,pnames);
  $('detailBody').innerHTML=main;

  // ---- side ----
  $('detailSide').innerHTML=viewSide(c,entries,actions,avg,pct,f);
  wireDetail();
}

function entryHtml(e){
  var m=moodFor(e.rating);
  return '<div class="dl-entry"><div class="top"><span class="dot"></span>'+
    '<span class="rating">★ '+(e.rating==null?'–':e.rating)+'/10</span>'+
    (m?'<span class="mood" style="color:'+m.c+';background:'+m.bg+'">'+m.label+'</span>':'')+
    '</div><div class="note">'+esc(e.note||'')+'</div></div>';
}
function taskHtml(a){
  var sub=[]; if(a.by) sub.push('📅 by '+esc(a.by)); if(a.location) sub.push('📍 '+esc(a.location));
  return '<div class="m-task '+(a.done?'done':'')+'"><input type="checkbox" data-row="'+a.row+'" '+(a.done?'checked':'')+'>'+
    '<div class="txt">'+esc(a.item)+(sub.length?'<div class="by">'+sub.join(' · ')+'</div>':'')+'</div></div>';
}

function viewOverview(c,entries,actions,avg,pct,f){
  var recent=entries.slice().reverse().slice(0,4);
  var open=actions.filter(function(a){return !a.done;}).slice(0,6);
  var h='<div class="m-sec-head"><h3>Overview</h3></div>';
  h+='<div style="display:flex;gap:30px;flex-wrap:wrap;margin-bottom:22px">'+
    '<div><div style="font-size:30px;font-weight:800">'+pct+'%</div><div style="color:var(--m-2);font-size:13px">Completion</div></div>'+
    '<div><div style="font-size:30px;font-weight:800">'+(avg!=null?avg.toFixed(1):'—')+'</div><div style="color:var(--m-2);font-size:13px">Avg rating</div></div>'+
    '<div><div style="font-size:30px;font-weight:800">'+entries.length+'</div><div style="color:var(--m-2);font-size:13px">Entries</div></div>'+
    '<div><div style="font-size:30px;font-weight:800;color:'+f.color+'">'+(f.days===null?'—':f.days)+'</div><div style="color:var(--m-2);font-size:13px">Days since progress</div></div>'+
    '</div>';
  h+='<h4 style="margin:0 0 10px;font-size:14px">Recent entries</h4>';
  h+= recent.length ? recent.map(function(e){ return '<div class="dl-day" style="margin:0 0 6px">'+esc(e.date||'')+'</div>'+entryHtml(e); }).join('') : '<div class="m-empty">No entries yet.</div>';
  h+='<h4 style="margin:20px 0 10px;font-size:14px">Open action items</h4>';
  h+= open.length ? open.map(taskHtml).join('') : '<div class="m-empty">No open items.</div>';
  return h;
}
function viewDaily(entries){
  var h='<div class="m-sec-head"><h3>Daily Log</h3><button class="m-btn ghost" id="focusAddEntry">＋ Add Entry</button></div>';
  h+='<div class="row-form">'+
    '<textarea id="eNote" placeholder="What did you do today?" style="min-height:70px"></textarea>'+
    '<div class="rating-slider-wrap"><span style="font-size:12px;color:var(--m-2)">Rating</span>'+
      '<input id="eRating" type="range" min="0" max="10" value="7" style="flex:1" oninput="document.getElementById(\'eRatingOut\').textContent=this.value">'+
      '<output id="eRatingOut">7</output>'+
      '<button class="m-btn" id="addEntry">Add</button>'+
    '</div></div>';
  var list=entries.slice().reverse();
  if(!list.length){ return h+'<div class="m-empty">No entries yet.</div>'; }
  var lastDay=null;
  list.forEach(function(e){
    if(e.date!==lastDay){ lastDay=e.date; var rel=relDay(e.date);
      h+='<div class="dl-day">'+esc(e.date||'')+(rel?'<span class="today">'+rel+'</span>':'')+'</div>'; }
    h+=entryHtml(e);
  });
  return h;
}
function viewTasks(actions){
  var h='<div class="m-sec-head"><h3>Tasks</h3></div>';
  h+='<div class="row-form"><input id="aItem" placeholder="New task…">'+
    '<div style="display:flex;gap:8px"><input id="aBy" type="date" style="flex:1" title="Planned completion"><input id="aLoc" placeholder="Location (optional)" style="flex:1"><button class="m-btn" id="addAction">Add</button></div></div>';
  h+= actions.length ? actions.map(taskHtml).join('') : '<div class="m-empty">No tasks yet.</div>';
  return h;
}
function viewNotes(){
  return '<div class="m-sec-head"><h3>Notes</h3></div>'+
    '<div class="field" style="margin-bottom:8px"><label>Notepad</label><textarea id="notepad" style="min-height:130px" placeholder="Free space — braindump, research, links…">'+esc(openCard.notepad||'')+'</textarea></div>'+
    '<button class="m-btn" id="saveNotepad" style="margin-bottom:24px">Save notepad</button>'+
    '<div class="field" style="margin-bottom:8px"><label>Things to keep in mind</label><textarea id="keepInMind" style="min-height:100px" placeholder="Reminders, constraints, principles…">'+esc(openCard.keepInMind||'')+'</textarea></div>'+
    '<button class="m-btn" id="saveKeep">Save</button>';
}
function viewFiles(){
  return '<div class="m-sec-head"><h3>Files</h3></div>'+
    '<div class="m-empty">File uploads aren\'t supported in the Sheets-backed version. Paste links into <b>Notes</b> instead.</div>';
}
function viewSettings(c,deleted,pnames){
  return '<div class="m-sec-head"><h3>Settings</h3></div>'+
    '<div class="field-grid">'+
      '<div class="field"><label>Name</label><input id="fName" value="'+esc(c.name)+'"></div>'+
      '<div class="field"><label>Emoji</label><input id="fEmoji" value="'+esc(c.emoji||'🗂️')+'" maxlength="4"></div>'+
      '<div class="field"><label>Priority</label><select id="fPriority">'+[0,1,2,3].map(function(p){return '<option value="'+p+'"'+(c.priority===p?' selected':'')+'>'+pnames[p]+'</option>';}).join('')+'</select></div>'+
      '<div class="field"><label>Hours / day</label><input id="fHours" type="number" step="0.5" min="0" value="'+c.hoursPerDay+'"></div>'+
      '<div class="field"><label>Color</label><input id="fColor" type="color" value="'+c.color+'" style="height:40px;padding:4px"></div>'+
    '</div>'+
    '<div class="field" style="margin-top:12px"><label>Description</label><textarea id="fDesc" style="min-height:60px">'+esc(c.description||'')+'</textarea></div>'+
    '<div style="display:flex;gap:8px;margin-top:16px">'+
      '<button class="m-btn" id="saveMeta">Save changes</button>'+
      (deleted?'<button class="m-btn ghost" id="restoreCard">♻ Restore</button>':'<button class="m-btn danger" id="deleteCard">🗑 Delete card</button>')+
    '</div>'+
    (deleted?'<div class="m-empty" style="margin-top:10px">This card is soft-deleted — its tab still exists in your Google Sheet.</div>':'');
}
function viewSide(c,entries,actions,avg,pct,f){
  var open=actions.filter(function(a){return !a.done;}).length;
  return '<div class="side-card"><h4>Summary</h4>'+
      '<div class="side-row"><span class="k">Average Rating</span><span class="v">'+(avg!=null?avg.toFixed(1)+'/10':'—')+'</span></div>'+
      '<div class="side-row"><span class="k">Entries</span><span class="v">'+entries.length+'</span></div>'+
      '<div class="side-row"><span class="k">Open Tasks</span><span class="v">'+open+'</span></div>'+
      '<div class="side-row"><span class="k">Completion</span><span class="v">'+pct+'%</span></div>'+
      '<div class="side-row"><span class="k">Times Opened</span><span class="v">'+c.tapCount+'</span></div>'+
      '<div class="side-row"><span class="k">Last progress</span><span class="v" style="color:'+f.color+'">'+f.label+'</span></div>'+
    '</div>'+
    '<div class="side-card"><h4>Quick Actions</h4>'+
      '<button class="qa-btn" data-goto="daily"><span class="ic">🗓</span> Add Daily Log</button>'+
      '<button class="qa-btn" data-goto="tasks"><span class="ic">☑</span> Add Task</button>'+
      '<button class="qa-btn" data-goto="notes"><span class="ic">📝</span> Add Note</button>'+
      '<button class="qa-btn" data-goto="settings"><span class="ic">⚙</span> Edit / Settings</button>'+
    '</div>';
}

function wireDetail(){
  var tab=openCard.meta.tab;
  // tab switches
  Array.prototype.forEach.call($('dTabs').querySelectorAll('button'), function(b){
    b.addEventListener('click', function(){ currentTab=b.getAttribute('data-tab'); renderDetail(); });
  });
  // quick actions
  Array.prototype.forEach.call($('detailSide').querySelectorAll('.qa-btn'), function(b){
    b.addEventListener('click', function(){ currentTab=b.getAttribute('data-goto'); renderDetail(); });
  });
  // favorite
  $('dStar').onclick=function(){
    var nv=!openCard.meta.favorite;
    setMetaCell(tab,'favorite', nv?'TRUE':'FALSE').then(function(){ openCard.meta.favorite=nv; $('dStar').textContent=nv?'★':'☆'; }).catch(fail);
  };
  // settings save
  var save=$('saveMeta');
  if(save) save.addEventListener('click', function(){
    var name=$('fName').value.trim()||'(untitled)';
    var pr=$('fPriority').value, hrs=$('fHours').value||0, col=$('fColor').value;
    var emoji=($('fEmoji').value||'🗂️').trim()||'🗂️';
    var desc=$('fDesc').value.trim();
    save.textContent='Saving…';
    Promise.all([ setMetaCell(tab,'name',name), setMetaCell(tab,'priority',pr), setMetaCell(tab,'hoursPerDay',hrs),
      setMetaCell(tab,'color',col), setMetaCell(tab,'emoji',emoji), setMetaCell(tab,'description',desc) ])
      .then(function(){ openCard.meta.name=name; openCard.meta.priority=parseInt(pr,10); openCard.meta.hoursPerDay=parseFloat(hrs);
        openCard.meta.color=col; openCard.meta.emoji=emoji; openCard.meta.description=desc; toast('Saved'); renderDetail(); })
      .catch(fail);
  });
  // delete → soft-delete, then close + reload board (so it leaves the active grid)
  var del=$('deleteCard');
  if(del) del.addEventListener('click', function(){
    del.textContent='Deleting…';
    console.log('[delete] soft-deleting', tab);
    setMetaCell(tab,'status','deleted')
      .then(function(){ toast('Card deleted (tab kept in Sheet)'); closeDetail(); })
      .catch(fail);
  });
  var res=$('restoreCard');
  if(res) res.addEventListener('click', function(){
    res.textContent='Restoring…';
    setMetaCell(tab,'status','active').then(function(){ openCard.meta.status='active'; toast('Restored'); renderDetail(); }).catch(fail);
  });
  // add daily entry
  var ae=$('addEntry');
  if(ae) ae.addEventListener('click', function(){
    var note=$('eNote').value.trim(); var rating=$('eRating').value;
    if(!note){ toast('Write a note first', true); return; }
    ae.innerHTML='<span class="loader"></span>';
    addEntry(tab, todayISO(), note, rating).then(function(){ return readCard(tab); })
      .then(function(r){ openCard=r; renderDetail(); toast('Entry added'); }).catch(fail);
  });
  var fae=$('focusAddEntry'); if(fae) fae.addEventListener('click', function(){ var n=$('eNote'); if(n) n.focus(); });
  // add task
  var aa=$('addAction');
  if(aa) aa.addEventListener('click', function(){
    var item=$('aItem').value.trim(); var by=$('aBy').value; var loc=($('aLoc')?$('aLoc').value.trim():'');
    if(!item){ toast('Enter a task', true); return; }
    aa.innerHTML='<span class="loader"></span>';
    addAction(tab, item, by, loc).then(function(){ return readCard(tab); })
      .then(function(r){ openCard=r; renderDetail(); toast('Task added'); }).catch(fail);
  });
  // notes
  var sn=$('saveNotepad');
  if(sn) sn.addEventListener('click', function(){ var text=$('notepad').value; sn.textContent='Saving…';
    saveCell(tab,'N1',text).then(function(){ openCard.notepad=text; sn.textContent='Save notepad'; toast('Notepad saved'); }).catch(fail); });
  var sk=$('saveKeep');
  if(sk) sk.addEventListener('click', function(){ var text=$('keepInMind').value; sk.textContent='Saving…';
    saveCell(tab,'N2',text).then(function(){ openCard.keepInMind=text; sk.textContent='Save'; toast('Saved'); }).catch(fail); });
  // task checkboxes (Tasks tab + Overview open items)
  Array.prototype.forEach.call(document.querySelectorAll('.modal .m-task input[type=checkbox]'), function(cb){
    cb.addEventListener('change', function(){
      var row=cb.getAttribute('data-row'), done=cb.checked;
      toggleAction(tab, row, done).then(function(){ return readCard(tab); })
        .then(function(r){ openCard=r; renderDetail(); }).catch(fail);
    });
  });
}
