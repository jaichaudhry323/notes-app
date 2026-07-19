// ============================================================
// util.js — DOM, formatting, color, and freshness helpers
// ============================================================

function $(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function uuid(){ return (crypto&&crypto.randomUUID)?crypto.randomUUID().slice(0,8):String(Date.now()); }
function todayISO(){ return new Date().toISOString().slice(0,10); }

// ---- toast ----
var _toastT;
function toast(msg, isErr){
  var t=$('toast'); t.textContent=msg; t.className='toast show'+(isErr?' err':'');
  clearTimeout(_toastT); _toastT=setTimeout(function(){ t.className='toast'; }, 2600);
}
function fail(e){ console.error(e); toast((e&&e.message)?e.message:'Something went wrong', true); }

// ---- color ----
function hslToHex(h,s,l){
  s/=100; l/=100;
  var c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2, r=0,g=0,b=0;
  if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;}
  else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;}
  function h2(v){ return ('0'+Math.round((v+m)*255).toString(16)).slice(-2); }
  return '#'+h2(r)+h2(g)+h2(b);
}
function colorForIndex(i){ return hslToHex((i*137.508)%360, 68, 62); }
function hexToRgba(hex,a){ var n=parseInt(hex.slice(1),16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }

// ---- progress freshness ----
// green (progress today) → red (no progress for STALE_DAYS+). "Progress" =
// the card's lastProgress date (set on a daily-log entry or a checked task).
function freshness(lastProgressISO){
  if(!lastProgressISO){ return { days:null, hue:0, label:'No progress yet', color:'hsl(0,55%,52%)' }; }
  var last=new Date(lastProgressISO.slice(0,10)+'T00:00:00');
  var today=new Date(todayISO()+'T00:00:00');
  var days=Math.max(0, Math.round((today-last)/86400000));
  var hue=120*(1-Math.min(days,STALE_DAYS)/STALE_DAYS); // 120=green … 0=red
  var label=days===0?'Progress today':(days===1?'Yesterday':days+' days ago');
  return { days:days, hue:hue, label:label, color:'hsl('+hue+',65%,52%)' };
}
// Relative "updated" phrase for card footers.
function updatedPhrase(f){ return f.days===null?'—':(f.days===0?'today':f.days===1?'yesterday':f.days+' days ago'); }

// ---- misc formatting used by the modal ----
function moodFor(r){
  if(r==null) return null;
  if(r>=8) return {label:'Great', c:'var(--m-good)', bg:'rgba(16,185,129,0.14)'};
  if(r>=6) return {label:'Good',  c:'var(--m-good)', bg:'rgba(16,185,129,0.10)'};
  if(r>=4) return {label:'Okay',  c:'var(--m-warn)', bg:'rgba(245,158,11,0.14)'};
  return          {label:'Tough', c:'var(--m-bad)',  bg:'rgba(239,68,68,0.14)'};
}
function fmtDate(iso){
  if(!iso) return '—';
  var d=new Date(iso); if(isNaN(d.getTime())) return String(iso).slice(0,10);
  var m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return m[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear();
}
function relDay(dateStr){
  if(!dateStr) return '';
  var today=todayISO(); if(dateStr===today) return 'Today';
  var d=new Date(dateStr+'T00:00:00'), t=new Date(today+'T00:00:00');
  return Math.round((t-d)/86400000)===1 ? 'Yesterday' : '';
}
