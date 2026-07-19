// ============================================================
// calendar.js — Calendar view
// Aggregates "events" across all cards (tasks by due date + daily
// log entries by date) and shows them on a month grid. Click a day
// to see its events.
// ============================================================

var calState = null;   // {y, m} of the displayed month
var calEvents = [];    // cached aggregated events
var calSelected = null;// selected 'YYYY-MM-DD'

// Load full data for every active card and flatten into events.
function collectEvents(){
  var active=cards.filter(function(c){ return c.status!=='deleted'; });
  return Promise.all(active.map(function(c){ return readCard(c.tab); })).then(function(all){
    var evts=[];
    all.forEach(function(full,i){
      var c=active[i];
      full.actions.forEach(function(a){
        if(a.by) evts.push({ date:a.by, type:'task', text:a.item, done:a.done, location:a.location||'', card:c.name, color:c.color, emoji:c.emoji });
      });
      full.entries.forEach(function(e){
        if(e.date) evts.push({ date:e.date, type:'log', text:e.note, rating:e.rating, card:c.name, color:c.color, emoji:c.emoji });
      });
    });
    return evts;
  });
}

function renderCalendar(){
  var body=$('calendarBody');
  var active=cards.filter(function(c){ return c.status!=='deleted'; });
  if(!active.length){ body.innerHTML='<div class="empty"><div class="big">📅</div>No cards yet — create one to see events here.</div>'; return; }
  body.innerHTML='<div style="text-align:center;padding:40px"><span class="loader"></span> Loading events…</div>';
  if(!calState){ var d=new Date(); calState={ y:d.getFullYear(), m:d.getMonth() }; }
  collectEvents().then(function(evts){ calEvents=evts; paintCalendar(); }).catch(fail);
}

function calShift(delta){
  var m=calState.m+delta, y=calState.y;
  if(m<0){ m=11; y--; } if(m>11){ m=0; y++; }
  calState={ y:y, m:m }; paintCalendar();
}

function paintCalendar(){
  var body=$('calendarBody');
  var y=calState.y, m=calState.m;
  var months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var startDow=new Date(y,m,1).getDay();
  var daysInMonth=new Date(y,m+1,0).getDate();
  var today=todayISO();

  var byDate={};
  calEvents.forEach(function(e){ (byDate[e.date]=byDate[e.date]||[]).push(e); });

  var wd=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var head=wd.map(function(d){ return '<div class="cal-wd">'+d+'</div>'; }).join('');

  var cells='';
  for(var i=0;i<startDow;i++){ cells+='<div class="cal-cell empty"></div>'; }
  for(var day=1; day<=daysInMonth; day++){
    var iso=y+'-'+(m+1<10?'0':'')+(m+1)+'-'+(day<10?'0':'')+day;
    var evs=byDate[iso]||[];
    var dots=evs.slice(0,3).map(function(e){ return '<span class="cal-dot" style="background:'+e.color+'"></span>'; }).join('');
    cells+='<div class="cal-cell'+(iso===today?' today':'')+(iso===calSelected?' sel':'')+(evs.length?' has':'')+'" data-date="'+iso+'">'+
      '<span class="cal-num">'+day+'</span>'+
      (evs.length?'<div class="cal-dots">'+dots+(evs.length>3?'<span class="cal-more">+'+(evs.length-3)+'</span>':'')+'</div>':'')+
    '</div>';
  }

  var selList='';
  if(calSelected){
    var evs=byDate[calSelected]||[];
    selList='<div class="cal-daylist"><h3>'+calSelected+(relDay(calSelected)?' · '+relDay(calSelected):'')+'</h3>'+
      (evs.length? evs.map(function(e){
        var meta=e.type==='task' ? ('Task'+(e.done?' ✓':'')) : ('Log'+(e.rating!=null?' ★'+e.rating:''));
        return '<div class="cal-evt"><span class="cal-evt-dot" style="background:'+e.color+'"></span>'+
          '<div><div class="cal-evt-top">'+esc(e.emoji||'')+' <b>'+esc(e.card)+'</b> · '+meta+'</div>'+
          '<div class="cal-evt-txt">'+esc(e.text||'')+'</div>'+
          (e.location?'<div class="cal-evt-loc">📍 '+esc(e.location)+'</div>':'')+'</div></div>';
      }).join('') : '<div class="m-empty" style="color:var(--faint)">No events on this day.</div>')+'</div>';
  }

  body.innerHTML=
    '<div class="cal-head"><button class="btn sm" id="calPrev">‹</button>'+
      '<div class="cal-title">'+months[m]+' '+y+'</div>'+
      '<button class="btn sm" id="calNext">›</button>'+
      '<button class="btn sm" id="calToday" style="margin-left:auto">Today</button></div>'+
    '<div class="cal-grid cal-wds">'+head+'</div>'+
    '<div class="cal-grid cal-cells">'+cells+'</div>'+
    selList;

  $('calPrev').onclick=function(){ calShift(-1); };
  $('calNext').onclick=function(){ calShift(1); };
  $('calToday').onclick=function(){ var d=new Date(); calState={ y:d.getFullYear(), m:d.getMonth() }; calSelected=todayISO(); paintCalendar(); };
  Array.prototype.forEach.call(body.querySelectorAll('.cal-cell[data-date]'), function(el){
    el.onclick=function(){ calSelected=el.getAttribute('data-date'); paintCalendar(); };
  });
}
