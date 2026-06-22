/* =====================================================================
   SHARED RENDER HELPERS
   Generic, course-agnostic building blocks used by every course's scenes.
   ===================================================================== */

/* ----- colour utilities (OSI layer palette lives in styles/main.css) ----- */
const COL={7:'--l7',6:'--l6',5:'--l5',4:'--l4',3:'--l3',2:'--l2',1:'--l1'};
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const colorN=n=>css(COL[n]);

/* ----- node chain: a row of avatars with an animated beam between them ----- */
function chainHtml(nodes, activeIdx, activeConn, connDir, msg, msgKind){
  let h='<div class="chain">';
  nodes.forEach((nd,i)=>{
    const cls=[ 'node' ];
    if(i===activeIdx) cls.push('active');
    else if(activeIdx>=0 && i>activeIdx && activeConn<0) cls.push('dim');
    const gl=nd.gl?`--gl:${nd.gl}`:'';
    const bub = (i===activeIdx && msg)?`<div class="bubble ${msgKind||''}">${msg}</div>`:'';
    h+=`<div class="${cls.join(' ')}" style="${gl}">
          ${bub}
          <div class="av">${nd.icon}</div>
          <div class="nm">${nd.nm}</div>
          <div class="nsub">${nd.sub||''}</div>
        </div>`;
    if(i<nodes.length-1){
      const on=(i===activeConn);
      h+=`<div class="conn ${on?'active':''} ${connDir==='back'?'back':''}">
            <div class="beam"></div>
          </div>`;
    }
  });
  h+='</div>';
  return h;
}

/* ----- two-column compare card (great for pros/cons & "X vs Y") ----- */
function compareHtml(L,R){
  const card=c=>`<div class="ccard" style="border-top-color:${c.color}">
    <div class="ch"><span class="ci">${c.icon}</span><h4 style="color:${c.color}">${c.title}</h4></div>
    <div class="csub">${c.sub}</div>
    <ul>${c.rows.map(r=>`<li><span class="mk">${r[0]}</span><span>${r[1]}</span></li>`).join('')}</ul>
    <div class="foot" style="border-left-color:${c.color}">${c.foot}</div>
  </div>`;
  return `<div class="compare">${card(L)}<div class="vs">VS</div>${card(R)}</div>`;
}

/* ----- small labelled info card ----- */
function infoCard(icon,title,text){
  return `<div class="infocard"><div class="ic">${icon}</div><div class="it">${title}</div><div class="ix">${text}</div></div>`;
}
