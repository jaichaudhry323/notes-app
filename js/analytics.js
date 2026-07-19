// ============================================================
// analytics.js — cross-card analytics view
// ============================================================

function renderAnalytics(){
  var body=$('analyticsBody');
  var active=cards.filter(function(c){return c.status!=='deleted';});
  if(!active.length){ body.innerHTML='<div class="empty"><div class="big">📊</div>No active cards to analyze yet.</div>'; return; }
  body.innerHTML='<div style="text-align:center;padding:40px"><span class="loader"></span> Crunching '+active.length+' cards…</div>';
  Promise.all(active.map(function(c){ return readCard(c.tab); })).then(function(all){
    var totalEntries=0, totalHours=0, allRatings=[];
    var series=[], bars=[], legend='';
    all.forEach(function(full,i){
      var c=active[i];
      var ratings=full.entries.filter(function(e){return e.rating!=null;}).map(function(e){return e.rating;});
      totalEntries+=full.entries.length; totalHours+=c.hoursPerDay;
      allRatings=allRatings.concat(ratings);
      if(ratings.length){ series.push({color:c.color,label:c.name,points:ratings}); }
      var avg=ratings.length?ratings.reduce(function(a,b){return a+b;},0)/ratings.length:0;
      bars.push({label:c.name,value:avg,color:c.color});
      legend+='<span><i style="background:'+c.color+'"></i>'+esc(c.name)+'</span>';
    });
    var overallAvg=allRatings.length?(allRatings.reduce(function(a,b){return a+b;},0)/allRatings.length):0;

    var html='';
    html+='<div class="cards-metrics">'+
      metric(active.length,'Active cards')+
      metric(totalEntries,'Daily entries')+
      metric(overallAvg.toFixed(1),'Avg rating')+
      metric(totalHours+'h','Planned / day')+
    '</div>';
    html+='<div class="chart-card"><h3>Rating progress across cards</h3>'+
      '<div class="hint">Each line is a card; x-axis is successive daily ratings (0–10).</div>'+
      (series.length? lineChart(series, 900, 300) : '<div style="color:var(--faint)">No ratings logged yet.</div>')+
      '<div class="legend">'+legend+'</div></div>';
    html+='<div class="chart-card"><h3>Average rating by card</h3>'+
      '<div class="hint">Mean of all daily ratings per card.</div>'+
      barChart(bars, 900, 280)+'</div>';
    body.innerHTML=html;
  }).catch(fail);
}
function metric(v,k){ return '<div class="metric"><div class="v">'+v+'</div><div class="k">'+k+'</div></div>'; }
