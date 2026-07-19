// ============================================================
// charts.js — dependency-free inline SVG charts
// Text/grid use CSS classes (cx-*) so they follow the theme.
// ============================================================

function lineChart(series, w, h){
  // series: [{color,label,points:[num]}]  y range 0..10
  var pad={l:30,r:12,t:12,b:22}, iw=w-pad.l-pad.r, ih=h-pad.t-pad.b, yMax=10;
  var maxLen=1; series.forEach(function(s){ maxLen=Math.max(maxLen,s.points.length); });
  function X(i){ return pad.l + (maxLen<=1?iw/2:(i/(maxLen-1))*iw); }
  function Y(v){ return pad.t + ih - (v/yMax)*ih; }
  var svg='<svg viewBox="0 0 '+w+' '+h+'" width="100%" height="'+h+'">';
  for(var g=0; g<=10; g+=2){ var y=Y(g);
    svg+='<line class="cx-grid" x1="'+pad.l+'" y1="'+y+'" x2="'+(w-pad.r)+'" y2="'+y+'"/>';
    svg+='<text class="cx-axis" x="'+(pad.l-6)+'" y="'+(y+3)+'" font-size="9" text-anchor="end">'+g+'</text>';
  }
  series.forEach(function(s){
    if(!s.points.length) return;
    var d=s.points.map(function(v,i){ return (i?'L':'M')+X(i)+' '+Y(v); }).join(' ');
    svg+='<path d="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
    s.points.forEach(function(v,i){ svg+='<circle cx="'+X(i)+'" cy="'+Y(v)+'" r="3" fill="'+s.color+'"/>'; });
  });
  return svg+'</svg>';
}

function barChart(items, w, h){
  // items: [{label,value,color}] value 0..10
  var pad={l:30,r:12,t:12,b:40}, iw=w-pad.l-pad.r, ih=h-pad.t-pad.b, yMax=10;
  var n=items.length||1, bw=Math.min(60, iw/n*0.6), gap=iw/n;
  var svg='<svg viewBox="0 0 '+w+' '+h+'" width="100%" height="'+h+'">';
  for(var g=0; g<=10; g+=2){ var y=pad.t+ih-(g/yMax)*ih;
    svg+='<line class="cx-grid" x1="'+pad.l+'" y1="'+y+'" x2="'+(w-pad.r)+'" y2="'+y+'"/>';
    svg+='<text class="cx-axis" x="'+(pad.l-6)+'" y="'+(y+3)+'" font-size="9" text-anchor="end">'+g+'</text>';
  }
  items.forEach(function(it,i){
    var x=pad.l+gap*i+(gap-bw)/2, bh=(it.value/yMax)*ih, y=pad.t+ih-bh;
    svg+='<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+Math.max(0,bh)+'" rx="5" fill="'+it.color+'"/>';
    svg+='<text class="cx-val" x="'+(x+bw/2)+'" y="'+(y-5)+'" font-size="10" font-weight="700" text-anchor="middle">'+it.value.toFixed(1)+'</text>';
    var lbl=it.label.length>10?it.label.slice(0,9)+'…':it.label;
    svg+='<text class="cx-lbl" x="'+(x+bw/2)+'" y="'+(pad.t+ih+16)+'" font-size="10" text-anchor="middle">'+esc(lbl)+'</text>';
  });
  return svg+'</svg>';
}
