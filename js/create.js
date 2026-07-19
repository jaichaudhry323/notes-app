// ============================================================
// create.js — "Add New Card" and "Add Action / Task" modals
// (opened from the sidebar). Matches add_card_and_action_modals.png.
//
// Persistence note (data model limits):
//  • New Card persists: name, description, category, icon(emoji), color,
//    priority, daily-goal hours, tags, pinned.
//  • Add Action persists: card, task title, due date. The extra task fields
//    (status/priority/estimated/reminder/repeat/tags/files/description) are
//    shown for parity with the mockup but are not stored — the action-items
//    sheet only has Item | PlannedBy | Done | CreatedAt.
// ============================================================

var CARD_COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#ec4899','#6b7280'];
var PRIORITIES  = [{v:3,label:'Low'},{v:2,label:'Medium'},{v:1,label:'High'},{v:0,label:'Critical'}];
var CATEGORIES  = [
  {v:'Business',e:'🏢'},{v:'Career',e:'💼'},{v:'Finance',e:'💰'},{v:'Health',e:'❤️'},
  {v:'Learning',e:'📚'},{v:'Trading',e:'📈'},{v:'Personal',e:'🌟'},{v:'Other',e:'🗂️'}
];
var EMOJI_PRESETS = ['🚚','💼','💰','📈','❤️','📚','🍔','✈️','🏠','🎯','🛠️','🎨','🧠','🌱','⚽','🎵'];

function closeCreate(){
  $('createOverlay').classList.remove('show');
  $('cardModal').classList.remove('show');
  $('actionModal').classList.remove('show');
}

// =====================================================================
// Add New Card
// =====================================================================
var cardDraft;
function openNewCard(){
  if(!accessToken){ toast('Sign in first', true); return; }
  cardDraft={ name:'', description:'', category:'Business', emoji:'🗂️', color:CARD_COLORS[0], priority:1, hours:1, tags:[], pinned:false, emojiOpen:false };
  renderCardModal();
  $('createOverlay').classList.add('show'); $('cardModal').classList.add('show');
}
function renderCardModal(){
  var d=cardDraft;
  var swatches=CARD_COLORS.map(function(c){ return '<button type="button" class="cm-swatch'+(d.color===c?' sel':'')+'" data-color="'+c+'" style="background:'+c+'">'+(d.color===c?'✓':'')+'</button>'; }).join('');
  var prio=PRIORITIES.map(function(p){ return '<button type="button" class="cm-prio p'+p.v+(d.priority===p.v?' sel':'')+'" data-prio="'+p.v+'">'+p.label+'</button>'; }).join('');
  var cats=CATEGORIES.map(function(c){ return '<option value="'+c.v+'"'+(d.category===c.v?' selected':'')+'>'+c.e+'  '+c.v+'</option>'; }).join('');
  var tags=d.tags.map(function(t,i){ return '<span class="cm-tag" data-i="'+i+'">'+esc(t)+' <b>×</b></span>'; }).join('')+'<button type="button" class="cm-addtag" id="ccAddTag">＋ Add tag</button>';
  var presets=EMOJI_PRESETS.map(function(e){ return '<button type="button" class="cm-emoji-opt" data-emoji="'+e+'">'+e+'</button>'; }).join('');

  $('cardModal').innerHTML=
    '<button class="modal-close" id="cardClose" title="Close">✕</button>'+
    '<div class="cm-head"><div class="cm-headicon">🗂️</div>'+
      '<div><h2>Add New Card</h2><div class="cm-sub">Create a new card to organize your work and goals.</div></div></div>'+
    '<div class="cm-body two">'+
      '<div class="cm-form">'+
        '<div class="cm-field"><label>Card Name</label><div class="cm-inwrap"><input id="ccName" maxlength="60" placeholder="e.g. Food Truck" value="'+esc(d.name)+'"><span class="cm-count" id="ccNameCount">'+d.name.length+'/60</span></div></div>'+
        '<div class="cm-field"><label>Description <span class="opt">(optional)</span></label><div class="cm-inwrap"><textarea id="ccDesc" maxlength="200" placeholder="What is this card about?">'+esc(d.description)+'</textarea><span class="cm-count ta" id="ccDescCount">'+d.description.length+'/200</span></div></div>'+
        '<div class="cm-field"><label>Category</label><select id="ccCategory">'+cats+'</select></div>'+
        '<div class="cm-row2">'+
          '<div class="cm-field"><label>Icon</label>'+
            '<div class="cm-emoji-box"><input id="ccEmoji" maxlength="2" value="'+esc(d.emoji)+'"><button type="button" class="cm-emoji-toggle" id="ccEmojiToggle">▾</button></div>'+
            '<div class="cm-emoji-grid'+(d.emojiOpen?'':' hidden')+'" id="ccEmojiGrid">'+presets+'</div>'+
          '</div>'+
          '<div class="cm-field"><label>Color</label><div class="cm-swatches">'+swatches+'</div></div>'+
        '</div>'+
        '<div class="cm-field"><label>Priority</label><div class="cm-prios">'+prio+'</div></div>'+
        '<div class="cm-field"><label>Daily Goal <span class="opt">(hours)</span></label><div class="cm-hours"><input id="ccHours" type="number" min="0" step="0.5" value="'+d.hours+'"><span>hrs / day</span></div></div>'+
        '<div class="cm-field"><label>Tags <span class="opt">(optional)</span></label><div class="cm-tags" id="ccTags">'+tags+'</div></div>'+
      '</div>'+
      '<div class="cm-side">'+
        '<div class="cm-preview-label">Live Preview</div>'+
        '<div id="ccPreview"></div>'+
        '<div class="cm-tip"><b>✨ Tip</b><div>You can always change these details later from card settings.</div></div>'+
      '</div>'+
    '</div>'+
    '<div class="cm-foot">'+
      '<label class="cm-check"><input type="checkbox" id="ccPin"'+(d.pinned?' checked':'')+'> 📌 Pin this card</label>'+
      '<div class="cm-foot-btns"><button class="m-btn ghost" id="cardCancel">Cancel</button><button class="m-btn" id="cardCreate">Create Card</button></div>'+
    '</div>';
  wireCardModal();
  renderCardPreview();
}
function renderCardPreview(){
  var d=cardDraft, pnames={0:'Critical',1:'High',2:'Medium',3:'Low'};
  var pcolor={0:'#b91c1c',1:'var(--bad)',2:'var(--warn)',3:'var(--good)'};
  $('ccPreview').innerHTML=
    '<div class="lifecard" style="cursor:default;background:linear-gradient(180deg,'+hexToRgba(d.color,0.10)+',var(--panel));border-color:'+hexToRgba(d.color,0.30)+'">'+
      '<div class="lc-top"><div class="lc-emoji" style="background:'+hexToRgba(d.color,0.20)+'">'+esc(d.emoji||'🗂️')+'</div>'+
        '<div class="lc-title">'+(esc(d.name)||'Card name')+'</div></div>'+
      '<div class="lc-priority" style="color:'+(pcolor[d.priority]||'var(--muted)')+'">'+(pnames[d.priority]||'—')+' Priority</div>'+
      (d.description?'<div style="font-size:13px;color:var(--muted);margin-bottom:12px">'+esc(d.description)+'</div>':'')+
      '<div class="lc-meta"><div class="lc-meta-row"><span>🕐 '+(d.hours||0)+' hrs/day</span><span>★ –</span></div>'+
        '<div class="lc-meta-row"><span>👁 – opens</span></div></div>'+
      '<div class="lc-progress"><div class="lc-bar"><div class="lc-fill" style="width:0%;background:'+d.color+'"></div></div><span class="lc-pct">0%</span></div>'+
      '<div class="lc-foot">Created now</div>'+
    '</div>';
}
function wireCardModal(){
  var d=cardDraft;
  $('cardClose').onclick=closeCreate; $('cardCancel').onclick=closeCreate;
  $('ccName').oninput=function(){ d.name=this.value; $('ccNameCount').textContent=this.value.length+'/60'; renderCardPreview(); };
  $('ccDesc').oninput=function(){ d.description=this.value; $('ccDescCount').textContent=this.value.length+'/200'; renderCardPreview(); };
  $('ccCategory').onchange=function(){ d.category=this.value; };
  $('ccHours').oninput=function(){ d.hours=parseFloat(this.value)||0; renderCardPreview(); };
  $('ccEmoji').oninput=function(){ d.emoji=this.value||'🗂️'; renderCardPreview(); };
  $('ccPin').onchange=function(){ d.pinned=this.checked; };
  $('ccEmojiToggle').onclick=function(){ d.emojiOpen=!d.emojiOpen; renderCardModal(); };
  Array.prototype.forEach.call($('ccEmojiGrid').querySelectorAll('.cm-emoji-opt'), function(b){
    b.onclick=function(){ d.emoji=b.getAttribute('data-emoji'); d.emojiOpen=false; renderCardModal(); };
  });
  Array.prototype.forEach.call($('cardModal').querySelectorAll('.cm-swatch'), function(b){
    b.onclick=function(){ d.color=b.getAttribute('data-color'); renderCardModal(); };
  });
  Array.prototype.forEach.call($('cardModal').querySelectorAll('.cm-prio'), function(b){
    b.onclick=function(){ d.priority=parseInt(b.getAttribute('data-prio'),10); renderCardModal(); };
  });
  $('ccAddTag').onclick=function(){ var t=prompt('Tag:'); if(t&&t.trim()){ d.tags.push(t.trim()); renderCardModal(); } };
  Array.prototype.forEach.call($('ccTags').querySelectorAll('.cm-tag'), function(el){
    el.onclick=function(){ d.tags.splice(parseInt(el.getAttribute('data-i'),10),1); renderCardModal(); };
  });
  $('cardCreate').onclick=function(){
    var name=d.name.trim(); if(!name){ toast('Enter a card name', true); return; }
    $('cardCreate').textContent='Creating…';
    createCard(name, d.priority, d.hours, d.emoji, d.description.trim(),
      { color:d.color, category:d.category, tags:d.tags.join(','), pinned:d.pinned })
      .then(loadCards).then(function(){ currentFilter='active'; setFilter('active'); showView('board'); closeCreate(); toast('Card created'); })
      .catch(fail);
  };
}

// =====================================================================
// Add Action / Task
// =====================================================================
var actionDraft;
function openAddAction(preTab){
  if(!accessToken){ toast('Sign in first', true); return; }
  var active=cards.filter(function(c){ return c.status!=='deleted'; });
  if(!active.length){ toast('Create a card first', true); return; }
  actionDraft={ cardTab:(typeof preTab==='string'?preTab:active[0].tab), title:'', description:'', status:'todo', priority:1, due:'', estimated:'30', reminder:'', repeat:'none', location:'', tags:[], another:false, openAfter:true };
  renderActionModal();
  $('createOverlay').classList.add('show'); $('actionModal').classList.add('show');
}
function renderActionModal(){
  var d=actionDraft;
  var active=cards.filter(function(c){ return c.status!=='deleted'; });
  var cardOpts=active.map(function(c){ return '<option value="'+esc(c.tab)+'"'+(d.cardTab===c.tab?' selected':'')+'>'+esc(c.emoji||'🗂️')+'  '+esc(c.name)+'</option>'; }).join('');
  var tags=d.tags.map(function(t,i){ return '<span class="cm-tag" data-i="'+i+'">'+esc(t)+' <b>×</b></span>'; }).join('')+'<button type="button" class="cm-addtag" id="atAddTag">＋ Add tag</button>';

  $('actionModal').innerHTML=
    '<button class="modal-close" id="actionClose" title="Close">✕</button>'+
    '<div class="cm-head"><div class="cm-headicon">☑️</div>'+
      '<div><h2>Add Action / Task</h2><div class="cm-sub">Add an action item to your card.</div></div></div>'+
    '<div class="cm-body">'+
      '<div class="cm-field"><label>Card</label><select id="atCard">'+cardOpts+'</select></div>'+
      '<div class="cm-field"><label>Task Title</label><div class="cm-inwrap"><input id="atTitle" maxlength="100" placeholder="e.g. Call supplier" value="'+esc(d.title)+'"><span class="cm-count" id="atTitleCount">'+d.title.length+'/100</span></div></div>'+
      '<div class="cm-field"><label>Description <span class="opt">(optional)</span></label><div class="cm-inwrap"><textarea id="atDesc" maxlength="500" placeholder="Details…">'+esc(d.description)+'</textarea><span class="cm-count ta" id="atDescCount">'+d.description.length+'/500</span></div></div>'+
      '<div class="cm-grid3">'+
        '<div class="cm-field"><label>Status</label><select id="atStatus"><option value="todo">○ To Do</option><option value="doing">◐ In Progress</option><option value="done">● Done</option></select></div>'+
        '<div class="cm-field"><label>Priority</label><select id="atPriority"><option value="1" selected>🚩 High</option><option value="0">🔴 Critical</option><option value="2">🟡 Medium</option><option value="3">🟢 Low</option></select></div>'+
        '<div class="cm-field"><label>Due Date</label><input id="atDue" type="date" value="'+esc(d.due)+'"></div>'+
      '</div>'+
      '<div class="cm-grid3">'+
        '<div class="cm-field"><label>Estimated Time</label><select id="atEstimated"><option value="15">🕐 15 mins</option><option value="30" selected>🕐 30 mins</option><option value="60">🕐 1 hour</option><option value="120">🕐 2 hours</option></select></div>'+
        '<div class="cm-field"><label>Reminder</label><input id="atReminder" type="time" value=""></div>'+
        '<div class="cm-field"><label>Repeat</label><select id="atRepeat"><option value="none">🔁 Does not repeat</option><option value="daily">🔁 Daily</option><option value="weekly">🔁 Weekly</option></select></div>'+
      '</div>'+
      '<div class="cm-field"><label>Location <span class="opt">(optional)</span></label><input id="atLocation" placeholder="e.g. Kukatpally, Office, Home" value="'+esc(d.location)+'"></div>'+
      '<div class="cm-field"><label>Tags <span class="opt">(optional)</span></label><div class="cm-tags" id="atTags">'+tags+'</div></div>'+
      '<div class="cm-field"><label>Attach Files <span class="opt">(optional)</span></label>'+
        '<div class="cm-drop" title="File uploads aren\'t stored in the Sheets version">📎 <span>Upload files</span> or drag and drop</div></div>'+
    '</div>'+
    '<div class="cm-foot">'+
      '<div></div>'+
      '<div class="cm-foot-btns"><button class="m-btn ghost" id="actionCancel">Cancel</button><button class="m-btn" id="actionAdd">Add Task</button></div>'+
    '</div>'+
    '<div class="cm-foot2">'+
      '<label class="cm-check"><input type="checkbox" id="atAnother"'+(d.another?' checked':'')+'> Add another task</label>'+
      '<label class="cm-check"><input type="checkbox" id="atOpen"'+(d.openAfter?' checked':'')+'> Open task after adding</label>'+
    '</div>';
  wireActionModal();
}
function wireActionModal(){
  var d=actionDraft;
  $('actionClose').onclick=closeCreate; $('actionCancel').onclick=closeCreate;
  $('atCard').onchange=function(){ d.cardTab=this.value; };
  $('atTitle').oninput=function(){ d.title=this.value; $('atTitleCount').textContent=this.value.length+'/100'; };
  $('atDesc').oninput=function(){ d.description=this.value; $('atDescCount').textContent=this.value.length+'/500'; };
  $('atDue').onchange=function(){ d.due=this.value; };
  $('atLocation').oninput=function(){ d.location=this.value; };
  $('atAnother').onchange=function(){ d.another=this.checked; };
  $('atOpen').onchange=function(){ d.openAfter=this.checked; };
  $('atAddTag').onclick=function(){ var t=prompt('Tag:'); if(t&&t.trim()){ d.tags.push(t.trim()); renderActionModal(); } };
  Array.prototype.forEach.call($('atTags').querySelectorAll('.cm-tag'), function(el){
    el.onclick=function(){ d.tags.splice(parseInt(el.getAttribute('data-i'),10),1); renderActionModal(); };
  });
  $('actionAdd').onclick=function(){
    var title=d.title.trim(); if(!title){ toast('Enter a task title', true); return; }
    var tab=d.cardTab;
    $('actionAdd').textContent='Adding…';
    addAction(tab, title, d.due, d.location).then(function(){
      toast('Task added');
      if(d.another){ d.title=''; d.description=''; renderActionModal(); return; }
      closeCreate();
      if(d.openAfter){ openDetail(tab); }
      else { loadCards().then(renderBoard); }
    }).catch(fail);
  };
}
