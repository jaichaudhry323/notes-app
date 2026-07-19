// ============================================================
// api.js — Google Sheets REST layer (all reads/writes)
// ============================================================

// fetch wrapper: attaches token, throws on non-2xx, and retries
// once via a silent token refresh on 401 (expiry).
function api(path, opts){
  return apiRaw(path, opts).catch(function(e){
    if(e && e.status===401 && tokenClient){
      return refreshTokenSilently().then(function(){ return apiRaw(path, opts); });
    }
    throw e;
  });
}
function apiRaw(path, opts){
  opts=opts||{}; opts.headers=opts.headers||{};
  opts.headers['Authorization']='Bearer '+accessToken;
  opts.headers['Content-Type']='application/json';
  return fetch(API+path, opts).then(function(res){
    return res.text().then(function(b){
      var j=b?JSON.parse(b):{};
      if(!res.ok){ var err=new Error((j.error&&j.error.message)||('HTTP '+res.status)); err.status=res.status; throw err; }
      return j;
    });
  });
}
function rangeParam(ranges){ return ranges.map(function(r){ return 'ranges='+encodeURIComponent(r); }).join('&'); }
function q(tab){ return "'"+tab.replace(/'/g,"''")+"'"; }

function getSpreadsheet(){ return api('', {method:'GET'}); }

// Parse a 2-col key/value valueRange into a normalized meta object.
function parseMeta(values){
  var o={}; (values||[]).forEach(function(row){ if(row[0]!==undefined) o[row[0]]=row[1]; });
  return {
    tab: null,
    id: o.id||'', name: o.name||'(untitled)', color: o.color||'#6366f1',
    priority: parseInt(o.priority||'2',10), hoursPerDay: parseFloat(o.hoursPerDay||'0')||0,
    tapCount: parseInt(o.tapCount||'0',10)||0, status: o.status||'active',
    createdAt: o.createdAt||'', lastProgress: o.lastProgress||'', emoji: o.emoji||'🗂️',
    description: o.description||'', favorite: (o.favorite==='TRUE'||o.favorite===true||o.favorite==='true'),
    category: o.category||'', tags: o.tags||'', pinned: (o.pinned==='TRUE'||o.pinned===true||o.pinned==='true')
  };
}

// Load every card tab in one batchGet: metadata + entries (avg rating)
// + action items (completion %). Three ranges per tab.
function loadCards(){
  return getSpreadsheet().then(function(meta){
    var tabs=(meta.sheets||[]).map(function(s){return s.properties;})
      .filter(function(p){ return p.title.indexOf(CARD_PREFIX)===0; });
    if(!tabs.length){ cards=[]; return cards; }
    var ranges=[];
    tabs.forEach(function(p){ ranges.push(q(p.title)+'!A1:B15', q(p.title)+'!D2:F1000', q(p.title)+'!H2:K1000'); });
    return api('/values:batchGet?'+rangeParam(ranges), {method:'GET'})
      .then(function(resp){
        var vr=resp.valueRanges||[];
        cards=tabs.map(function(p,i){
          var base=i*3;
          var m=parseMeta(vr[base]&&vr[base].values); m.tab=p.title; m.gid=p.sheetId;
          // avg rating from daily entries
          var erows=(vr[base+1]&&vr[base+1].values)||[];
          var ratings=erows.map(function(r){ return (r[2]===''||r[2]==null)?null:parseFloat(r[2]); })
                           .filter(function(x){ return x!=null && !isNaN(x); });
          m.avgRating=ratings.length?ratings.reduce(function(a,b){return a+b;},0)/ratings.length:null;
          // completion % from action items (done / total)
          var arows=(vr[base+2]&&vr[base+2].values)||[];
          var done=0,total=0;
          arows.forEach(function(r){ if(r[0]){ total++; if(r[2]==='TRUE'||r[2]===true||r[2]==='true') done++; } });
          m.actionsTotal=total; m.actionsDone=done; m.completion=total?done/total:0;
          return m;
        });
        return cards;
      });
  });
}

// Full card: meta + daily entries + action items + free-text blocks.
function readCard(tab){
  var ranges=[ q(tab)+'!A1:B15', q(tab)+'!D2:F1000', q(tab)+'!H2:L1000', q(tab)+'!N1:N2' ];
  return api('/values:batchGet?'+rangeParam(ranges), {method:'GET'}).then(function(resp){
    var vr=resp.valueRanges||[];
    var meta=parseMeta(vr[0]&&vr[0].values); meta.tab=tab;
    var entries=((vr[1]&&vr[1].values)||[]).map(function(r,i){
      return { row:i+2, date:r[0]||'', note:r[1]||'', rating:(r[2]===''||r[2]==null)?null:parseFloat(r[2]) };
    }).filter(function(e){ return e.date||e.note||e.rating!=null; });
    var actions=((vr[2]&&vr[2].values)||[]).map(function(r,i){
      return { row:i+2, item:r[0]||'', by:r[1]||'', done:(r[2]==='TRUE'||r[2]===true||r[2]==='true'), createdAt:r[3]||'', location:r[4]||'' };
    }).filter(function(a){ return a.item; });
    var ntv=(vr[3]&&vr[3].values)||[];
    var notepad=(ntv[0]&&ntv[0][0])||'';
    var keepInMind=(ntv[1]&&ntv[1][0])||'';
    return { meta:meta, entries:entries, actions:actions, notepad:notepad, keepInMind:keepInMind };
  });
}

function createCard(name, priority, hours, emoji, description, extra){
  extra=extra||{};
  var id=uuid(), tab=CARD_PREFIX+id, color=extra.color||colorForIndex(cards.length);
  return api(':batchUpdate', {method:'POST', body:JSON.stringify({
    requests:[{ addSheet:{ properties:{ title:tab } } }]
  })}).then(function(){
    var body={ valueInputOption:'RAW', data:[
      { range:q(tab)+'!A1:B15', values:[
        ['id',id],['name',name],['color',color],['priority',priority],
        ['hoursPerDay',hours],['tapCount',0],['status','active'],['createdAt',new Date().toISOString()],['lastProgress',''],['emoji',emoji||'🗂️'],['description',description||''],['favorite','FALSE'],
        ['category',extra.category||''],['tags',extra.tags||''],['pinned',extra.pinned?'TRUE':'FALSE']
      ]},
      { range:q(tab)+'!D1:F1', values:[['Date','Note','Rating']] },
      { range:q(tab)+'!H1:L1', values:[['Item','PlannedBy','Done','CreatedAt','Location']] },
      { range:q(tab)+'!M1:N2', values:[['Notepad',''],['KeepInMind','']] }
    ]};
    return api('/values:batchUpdate', {method:'POST', body:JSON.stringify(body)});
  });
}

// Write a metadata value by LOOKING UP its key in column A (not by a fixed
// row index). This keeps writes consistent with parseMeta's key-based reads,
// so edits/deletes still work if the tab's rows were shifted or hand-edited.
// If the key is missing entirely, it appends a new [key, value] pair.
function setMetaCell(tab, key, value){
  if(META_KEYS.indexOf(key)<0) return Promise.reject(new Error('bad key: '+key));
  return api('/values/'+encodeURIComponent(q(tab)+'!A1:A30'), {method:'GET'}).then(function(resp){
    var keys=(resp.values||[]).map(function(r){ return r[0]; });
    var row=keys.indexOf(key)+1; // 1-based; 0 means "not found"
    if(row<1){
      row=keys.length+1; // self-heal: append the missing key/value pair
      console.warn('[meta] key "'+key+'" not found in '+tab+' — appending at row '+row);
      return api('/values/'+encodeURIComponent(q(tab)+'!A'+row+':B'+row)+'?valueInputOption=RAW',
        {method:'PUT', body:JSON.stringify({values:[[key,value]]})});
    }
    return api('/values/'+encodeURIComponent(q(tab)+'!B'+row)+'?valueInputOption=RAW',
      {method:'PUT', body:JSON.stringify({values:[[value]]})});
  });
}
function bumpTap(card){
  var n=(card.tapCount||0)+1; card.tapCount=n;
  return setMetaCell(card.tab,'tapCount',n);
}
function addEntry(tab, date, note, rating){
  // Logging a daily entry counts as progress → refresh the freshness date.
  return api('/values/'+encodeURIComponent(q(tab)+'!D:F')+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',
    {method:'POST', body:JSON.stringify({values:[[date,note,rating]]})})
    .then(function(){ return setMetaCell(tab,'lastProgress',date); });
}
function addAction(tab, item, by, location){
  return api('/values/'+encodeURIComponent(q(tab)+'!H:L')+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',
    {method:'POST', body:JSON.stringify({values:[[item,by,'FALSE',new Date().toISOString(),location||'']]})});
}
function toggleAction(tab, row, done){
  return api('/values/'+encodeURIComponent(q(tab)+'!J'+row)+'?valueInputOption=RAW',
    {method:'PUT', body:JSON.stringify({values:[[done?'TRUE':'FALSE']]})})
    .then(function(r){ return done ? setMetaCell(tab,'lastProgress',todayISO()).then(function(){return r;}) : r; });
}
// Save a single cell (used for the free-text Notepad / Keep-in-mind blocks).
function saveCell(tab, cell, text){
  return api('/values/'+encodeURIComponent(q(tab)+'!'+cell)+'?valueInputOption=RAW',
    {method:'PUT', body:JSON.stringify({values:[[text]]})});
}
