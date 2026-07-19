// ============================================================
// board.js — the card grid (light cards, matches card_grid.png)
// ============================================================

function renderBoard(){
  var wrap=$('grid');
  var list=cards.filter(function(c){ return currentFilter==='active' ? c.status!=='deleted' : c.status==='deleted'; });
  list.sort(function(a,b){ return a.priority-b.priority; });
  $('boardTitle').textContent = currentFilter==='active' ? 'Board' : 'Deleted cards';
  $('boardSub').textContent = list.length + (list.length===1?' card':' cards') +
    (currentFilter==='deleted' ? ' · still present as tabs in your Sheet' : '');
  if(!list.length){
    wrap.innerHTML='<div class="empty"><div class="big">'+(currentFilter==='active'?'🗂️':'🗑️')+'</div>'+
      (currentFilter==='active'?'No cards yet. Hit <b>＋ Action</b> to create one.':'Nothing deleted.')+'</div>';
    return;
  }
  var pnames={0:'Critical',1:'High',2:'Medium',3:'Low'};
  var pcolor={0:'#b91c1c',1:'var(--bad)',2:'var(--warn)',3:'var(--good)'}; // Critical/High red · Medium amber · Low green
  wrap.innerHTML=list.map(function(c){
    var f=freshness(c.lastProgress);
    var pct=Math.round((c.completion||0)*100);
    var rating=(c.avgRating!=null)?c.avgRating.toFixed(1):'—';
    var archived=currentFilter==='deleted';
    // Card carries a soft tint of its own color (mock: green/orange/etc. cards).
    var cardBg=archived ? 'var(--panel)' : 'linear-gradient(180deg,'+hexToRgba(c.color,0.10)+',var(--panel))';
    var cardBorder=archived ? 'var(--stroke)' : hexToRgba(c.color,0.30);
    return '<div class="lifecard'+(archived?' archived':'')+'" data-tab="'+esc(c.tab)+'" style="background:'+cardBg+';border-color:'+cardBorder+'">'+
      '<div class="lc-top">'+
        '<div class="lc-emoji" style="background:'+hexToRgba(c.color,0.20)+'">'+esc(c.emoji||'🗂️')+'</div>'+
        '<div class="lc-title">'+esc(c.name)+'</div>'+
      '</div>'+
      '<div class="lc-priority" style="color:'+(pcolor[c.priority]||'var(--muted)')+'">'+(pnames[c.priority]||'—')+' Priority</div>'+
      '<div class="lc-meta">'+
        '<div class="lc-meta-row"><span>🕐 '+c.hoursPerDay+' hrs/day</span><span>★ '+rating+'</span></div>'+
        '<div class="lc-meta-row"><span>👁 '+c.tapCount+' opens</span></div>'+
      '</div>'+
      '<div class="lc-progress">'+
        '<div class="lc-bar"><div class="lc-fill" style="width:'+pct+'%;background:'+c.color+'"></div></div>'+
        '<span class="lc-pct">'+pct+'%</span>'+
      '</div>'+
      (archived
        ? '<div class="lc-foot archived-foot">ARCHIVED</div>'
        : '<div class="lc-foot">Updated '+updatedPhrase(f)+'</div>')+
    '</div>';
  }).join('');
  Array.prototype.forEach.call(wrap.querySelectorAll('.lifecard'), function(el){
    el.addEventListener('click', function(){ openDetail(el.getAttribute('data-tab')); });
  });
}
