/* =====================================================================
   COURSE · Load Balancer  (section: system-design)
   A story-first building block: why → how → trade-offs (pros & cons).
   Use this file as the template for new system-design building blocks.
   ===================================================================== */

/* ----- the story beats ----- */
const LB_BEATS=[
  {ch:'LB · Why?', scene:'lbProblem', ttl:'One server, too many users',
   txt:'Every system starts with one server. As users pour in, that single machine runs out of CPU, memory and connections — requests queue, the site crawls, and if it crashes <b>everything</b> goes down. We need more servers… but how does a user know which one to talk to?'},
  {ch:'LB · Why?', scene:'lbSolution', ttl:'Spread the load',
   txt:'The answer is a <b>load balancer</b>: a traffic cop in front of a pool of identical servers. Clients connect to <b>one address</b>, and the balancer decides which server handles each request — so load is spread and you can add servers as you grow (<b>horizontal scaling</b>).'},
  {ch:'LB · How it works', scene:'lbHow', ttl:'What a load balancer actually does',
   txt:'On every request a load balancer does four jobs — and quietly runs <b>health checks</b> in the background so a crashed server is pulled from rotation before any user notices.'},
  {ch:'LB · L4 vs L7', scene:'lbLayers', ttl:'Two kinds: Layer 4 vs Layer 7',
   txt:'Load balancers are named after the OSI layer they work at (remember those?). <b>Layer 4</b> is fast and simple — it forwards by IP &amp; port. <b>Layer 7</b> is smart — it reads the actual HTTP request and can route by URL, headers or cookies.'},
  {ch:'LB · Routing', scene:'lbRoundRobin', ttl:'Picking a server: Round Robin',
   txt:'How does the balancer choose <i>which</i> server? The classic answer is <b>Round Robin</b> — hand each new request to the next server in line, looping around. Even and simple when all servers are alike. Watch the requests fan out in turn above.'},
  {ch:'LB · Routing', scene:'lbAlgos', ttl:'The routing algorithms',
   txt:'Round Robin is just one option. Different workloads call for different <b>routing algorithms</b> — here are the ones you’ll meet most often.'},
  {ch:'LB · State', scene:'lbState', ttl:'Stateful vs stateless',
   txt:'A crucial question: must a server <i>remember</i> a user between requests? <b>Stateless</b> designs let any server handle any request — easy to scale. <b>Stateful</b> ones pin a user to one server (<b>sticky sessions</b>) — simpler, but fragile.'},
  {ch:'LB · Local vs Global', scene:'lbLocalGlobal', ttl:'Local LB vs Global LB (GSLB)',
   txt:'So far we’ve balanced within one building. Big services run in <b>many data centers worldwide</b>, which needs two tiers: a <b>Global</b> balancer to pick the best <i>region</i>, and a <b>Local</b> balancer inside each region to pick a <i>server</i>.'},
  {ch:'LB · Geolocation', scene:'lbGeo', ttl:'The geolocation problem',
   txt:'Why go global? <b>Geolocation.</b> If everyone hits one far-away data center, distant users suffer painful <b>latency</b> — Mumbai → Virginia is ~230 ms each way. A <b>Global Server Load Balancer (GSLB)</b> sends each user to their <b>nearest healthy</b> region instead.'},
  {ch:'LB · DNS vs Anycast', scene:'lbGslbDns', ttl:'GSLB the DNS way',
   txt:'One way to build a GSLB is with <b>DNS</b>. The GSLB acts as the domain’s authoritative DNS server and returns a <b>different IP per region</b>, based on where the request came from and which sites are healthy.'},
  {ch:'LB · DNS vs Anycast', scene:'lbGslbAnycast', ttl:'GSLB the Anycast way',
   txt:'The other way is <b>Anycast</b>. The <i>same</i> IP address is announced from many locations via <b>BGP</b> (Chapter 10!). The internet’s own routing then carries each user to the <b>closest</b> location — no DNS tricks required.'},
  {ch:'LB · DNS vs Anycast', scene:'lbGslbCompare', ttl:'DNS vs Anycast — side by side',
   txt:'Both land you at a nearby data center, but they trade off differently: control &amp; flexibility (DNS) versus speed &amp; instant failover (Anycast). Large services often use <b>both together</b>.'},
  {ch:'LB · Pros & Cons', scene:'lbProsCons', ttl:'Advantages & disadvantages',
   txt:'Load balancers are everywhere for good reason — but they’re <b>not free</b>. Here’s the honest balance sheet to weigh before adding one.'},
  {ch:'LB · No More SPOF', scene:'lbSpof', ttl:'“But now the load balancer is the SPOF!”',
   txt:'The classic gotcha: we added the LB to remove a single point of failure — but a <b>lone LB is itself a SPOF</b>. The standard fix is to run it <b>redundantly</b>, with a shared Virtual IP and a heartbeat so a standby can instantly take over.'},
  {ch:'LB · No More SPOF', scene:'lbHA', ttl:'Active–Passive vs Active–Active',
   txt:'There are two redundancy styles. <b>Active–Passive</b> keeps a hot standby; <b>Active–Active</b> runs every LB at once for more capacity. Either way, spread them across <b>zones/regions</b> and front them with <b>Anycast or DNS</b>.'},
  {ch:'LB · Tiered LBs', scene:'lbTiers', ttl:'Tiers: Layer-4 in front of Layer-7',
   txt:'Should you have multiple load balancers? At scale, yes — in <b>tiers</b>. A fast <b>Layer-4</b> front (Tier 1) absorbs massive connection volume and fans it out to a fleet of smart <b>Layer-7</b> balancers (Tier 2) that route by content. Each tier scales independently.'},
];

/* ----- scene renderers ----- */
function farmHtml(opts){
  const users = Array.from({length:opts.userCount||5}).map(()=>'👤').join('');
  let html='<div class="farm">';
  html += `<div class="lb-users">${users}</div>`;
  html += `<div class="vbeam"><div class="vb"></div></div>`;
  if(opts.lb){
    html += `<div class="lb-bar">⚖️ Load Balancer</div>`;
    html += `<div class="lb-pool">`;
    opts.servers.forEach((s,i)=>{
      const color = s.down ? '#ff7675' : (s.load>85?'#ff7675':s.load>60?'#fdcb6e':'#00b894');
      html += `<div class="poolcol">
         <div class="dconn">${s.down?'':`<div class="vb" style="animation-delay:${(i*0.28).toFixed(2)}s"></div>`}</div>
         <div class="srv ${s.down?'down':''}">
           <div class="si">${s.down?'💥':'🖥️'}</div>
           <div class="sn">${s.label||('Server '+(i+1))}</div>
           <div class="loadbar"><div style="width:${s.down?100:s.load}%;background:${color}"></div></div>
           <div class="hd" style="color:${color}">${s.down?'DOWN':s.load+'%'}</div>
         </div></div>`;
    });
    html += `</div>`;
  } else {
    const s=opts.servers[0];
    html += `<div class="srv overloaded" style="border-color:#ff7675;min-width:150px">
        <div class="si">🔥🖥️</div><div class="sn">${s.label||'Single server'}</div>
        <div class="loadbar"><div style="width:100%;background:#ff7675"></div></div>
        <div class="hd" style="color:#ff7675">${s.load||100}% — overloaded</div></div>`;
  }
  html += '</div>';
  return html;
}
function rLbProblem(){
  return `<div class="art" style="gap:16px">
    ${farmHtml({lb:false, userCount:8, servers:[{load:100,label:'Your only server'}]})}
    <div class="farm-cap">As traffic grows, <b style="color:#ff7675">one server can’t keep up</b> — requests queue, responses slow to a crawl, and a crash takes the whole site down. You need more servers… but how do users know which one to hit?</div>
  </div>`;
}
function rLbSolution(){
  return `<div class="art" style="gap:16px">
    ${farmHtml({lb:true, userCount:8, servers:[{load:45},{load:52},{load:48}]})}
    <div class="farm-cap">A <b style="color:#55efc4">load balancer</b> gives clients <b>one address</b> and spreads requests across a <b>pool of servers</b>, so none is overwhelmed. Need more capacity? Just add servers — <b>horizontal scaling</b>.</div>
  </div>`;
}
function rLbHow(){
  return `<div class="art" style="gap:16px">
    ${farmHtml({lb:true, userCount:6, servers:[{load:40},{load:44},{load:38},{load:42}]})}
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:840px">
      ${infoCard('1️⃣','Receive','A request arrives at the balancer’s single virtual IP.')}
      ${infoCard('2️⃣','Choose','It picks a healthy server using a routing algorithm.')}
      ${infoCard('3️⃣','Forward','It relays the request and streams the response back.')}
      ${infoCard('❤️','Health checks','It constantly pings servers and drops any that fail — no user hits a dead one.')}
    </div>
  </div>`;
}
function rLbLayers(){
  return `<div class="art">${compareHtml(
    {color:'#0984e3',icon:'4️⃣',title:'Layer 4 (Transport)',sub:'routes by IP + port',
     rows:[['⚡','Very fast — just forwards TCP/UDP'],['🙈','Never looks inside the request'],['🔌','Ideal for raw throughput'],['🔧','e.g. AWS NLB, IPVS']],
     foot:'Decides using only network info (IP/port).'},
    {color:'#e84393',icon:'7️⃣',title:'Layer 7 (Application)',sub:'routes by content',
     rows:[['🧠','Reads HTTP — URL, headers, cookies'],['🧭','Content routing: /api → API pool, /img → images'],['🔐','Can do TLS termination, caching, auth'],['🔧','e.g. NGINX, HAProxy, AWS ALB']],
     foot:'Smarter, but more work per request.'}
  )}</div>`;
}
function rLbRoundRobin(){
  return `<div class="art" style="gap:16px">
    ${farmHtml({lb:true, userCount:6, servers:[{load:50},{load:50},{load:50},{load:50}]})}
    <div class="farm-cap"><b>Round Robin</b>: send each new request to the next server in turn — 1 → 2 → 3 → 4 → 1 … Simple and even when servers are similar.</div>
  </div>`;
}
function rLbAlgos(){
  const algos=[
    {n:'Round Robin',          color:'#00b894', use:'Each request to the next server in turn. Simple, even — assumes servers are equal.'},
    {n:'Weighted Round Robin', color:'#0984e3', use:'Stronger servers get a higher weight → more requests. Good for mixed hardware.'},
    {n:'Least Connections',    color:'#a29bfe', use:'Send to the server with the fewest active connections. Great for long-lived or uneven requests.'},
    {n:'Least Response Time',  color:'#fdcb6e', use:'Pick the fastest-responding, least-busy server.'},
    {n:'IP Hash',              color:'#e84393', use:'Hash the client IP → the same client always maps to the same server (basic stickiness).'},
    {n:'Random / Power-of-Two',color:'#e17055', use:'Pick at random — or pick two and choose the less loaded. Cheap and surprisingly even.'},
  ];
  return `<div class="art"><div class="algogrid">`+algos.map(a=>`
    <div class="algocard" style="border-left-color:${a.color}">
      <div class="an" style="color:${a.color}">${a.n}</div>
      <div class="at" style="background:${a.color}">algorithm</div>
      <div class="au">${a.use}</div>
    </div>`).join('')+`</div></div>`;
}
function rLbState(){
  return `<div class="art" style="gap:16px">${compareHtml(
    {color:'#00b894',icon:'♾️',title:'Stateless',sub:'any server can serve any request',
     rows:[['🔀','Each request is independent'],['📈','Scales freely — add/remove servers anytime'],['💪','A server dying loses nothing'],['🗄️','Session kept in a shared store (Redis) or a token (JWT)']],
     foot:'The preferred, cloud-native design.'},
    {color:'#fdcb6e',icon:'📌',title:'Stateful (sticky sessions)',sub:'a user is tied to one server',
     rows:[['🧷','Session stored on one specific server'],['🍪','LB must pin the user there (cookie / IP hash) — “affinity”'],['⚠️','If that server dies, the session is lost'],['📉','Uneven load, harder to scale']],
     foot:'Sometimes necessary — but avoid when you can.'}
  )}</div>`;
}
function rLbLocalGlobal(){
  return `<div class="art" style="gap:16px">
    <div class="lb-bar" style="max-width:380px;border-color:#a29bfe;color:#cdb4ff;background:linear-gradient(90deg,#241b34,#1a1430)">🌍 Global LB (GSLB) — picks the region</div>
    <div style="display:flex;gap:24px;flex-wrap:wrap;justify-content:center">
      <div class="region-box">🇮🇳 Mumbai region<span class="rl">Local LB ⚖️</span><div class="reg-srv">🖥️🖥️🖥️</div></div>
      <div class="region-box">🇺🇸 Virginia region<span class="rl">Local LB ⚖️</span><div class="reg-srv">🖥️🖥️🖥️</div></div>
    </div>
    <div class="farm-cap">A <b>Local LB</b> spreads traffic across servers <i>within one data center</i> (Layer 4/7). A <b>Global LB (GSLB)</b> works <i>across regions worldwide</i> — first it sends you to the best region, then the local LB there picks a server.</div>
  </div>`;
}
function rLbGeo(){
  return `<div class="art" style="gap:16px">
    <div class="geowrap">
      <div class="geo-user">👤<div class="gname">You — Mumbai 🇮🇳</div></div>
      <div style="font-size:20px;color:#ff7675">─────→</div>
      <div class="geo-dcs"><div class="dc far"><div class="di">🏢</div><div class="dn">Virginia DC 🇺🇸</div><div class="dl" style="color:#ff7675">~230 ms ❌</div></div></div>
    </div>
    <div class="farm-cap">If every user hits <b>one far-away data center</b>, distant users suffer high <b>latency</b>. A <b>GSLB</b> fixes this by routing each user to their <b>nearest healthy</b> region — let’s see the two ways it can do that.</div>
  </div>`;
}
function rLbGslbDns(){
  return `<div class="art" style="gap:16px">
    ${chainHtml([{icon:'👤',nm:'You',sub:'Mumbai',gl:'#fdcb6eaa'},{icon:'🧭',nm:'GSLB as DNS',sub:'geo-aware',gl:'#a29bfeaa'},{icon:'🏢',nm:'Mumbai DC',sub:'nearest IP',gl:'#00b894aa'}],2,1,'back','➜ use 1.2.3.4 (Mumbai)','ans')}
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:840px">
      ${infoCard('🗺️','How it works','The GSLB is the domain’s authoritative DNS. Based on the resolver’s location &amp; server health, it answers with the IP of the nearest healthy region.')}
      ${infoCard('👍','Pros','Simple, works with any client, no special network setup.')}
      ${infoCard('👎','Cons','DNS caching/TTL makes failover slow; it sees the resolver’s location, not the user’s exact one.')}
    </div>
  </div>`;
}
function rLbGslbAnycast(){
  return `<div class="art" style="gap:16px">
    <div class="aspath" style="font-size:13.5px">Same IP <span class="asn">203.0.113.9</span> announced from Mumbai, Frankfurt &amp; Virginia — <span style="color:#74b9ff">BGP routes you to the nearest</span></div>
    ${chainHtml([{icon:'👤',nm:'You',sub:'Mumbai',gl:'#fdcb6eaa'},{icon:'🌐',nm:'BGP / Internet',sub:'shortest path',gl:'#0984e3aa'},{icon:'🏢',nm:'Mumbai PoP',sub:'same anycast IP',gl:'#00b894aa'}],2,1,'fwd','📦 → 203.0.113.9','')}
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:840px">
      ${infoCard('📡','How it works','The <i>same</i> IP is advertised from many locations via BGP (Chapter 10!). The network naturally delivers you to the closest one.')}
      ${infoCard('👍','Pros','Very fast, near-instant failover (just withdraw the route), one IP everywhere.')}
      ${infoCard('👎','Cons','Less per-user control; a route change mid-connection can reset long TCP sessions.')}
    </div>
  </div>`;
}
function rLbGslbCompare(){
  return `<div class="art">${compareHtml(
    {color:'#a29bfe',icon:'🧭',title:'DNS-based GSLB',sub:'answers with a nearby IP',
     rows:[['🗺️','Routes by resolver geo + health'],['🐢','Failover limited by DNS TTL/caching'],['🎯','Granular, policy-rich control'],['🛠️','No special network needed']],
     foot:'Flexible — but failover is only as fast as DNS caches allow.'},
    {color:'#00b894',icon:'📡',title:'Anycast GSLB',sub:'one IP, many sites (BGP)',
     rows:[['🌐','Network routes you to the nearest PoP'],['⚡','Near-instant failover via BGP'],['📍','Less granular per-user control'],['🔁','Route flaps can break long TCP sessions']],
     foot:'Fast and simple — leans on BGP routing.'}
  )}</div>`;
}
function rLbProsCons(){
  return `<div class="art">${compareHtml(
    {color:'#00b894',icon:'✅',title:'Advantages',sub:'why we add a load balancer',
     rows:[['📈','Scalability — add servers behind it freely'],['🛟','High availability — reroutes around failures'],['❤️','Health checks drop dead servers automatically'],['⚙️','Zero-downtime deploys & maintenance'],['🔐','Can offload TLS, caching, compression'],['🌍','Geo-routing & better performance (GSLB)']],
     foot:'The backbone of any scalable, resilient system.'},
    {color:'#ff7675',icon:'⚠️',title:'Disadvantages',sub:'the costs to weigh',
     rows:[['💥','A single point of failure — unless made redundant'],['🧩','Added complexity to build & operate'],['💸','Extra cost (hardware or managed service)'],['🐢','An extra hop adds a little latency'],['📌','Stateful apps need sticky sessions — harder to scale'],['🔧','Misconfiguration can take everything down']],
     foot:'Almost always worth it — but never “free”.'}
  )}</div>`;
}
function rLbSpof(){
  return `<div class="art" style="gap:16px">
    <div class="vip-badge">🌐 Virtual IP (VIP) — the one address clients use: 203.0.113.50</div>
    <div class="ha-pair">
      <div class="ha-lb active">⚖️ LB-A<span class="hastate" style="color:#55efc4">● ACTIVE — holds the VIP</span></div>
      <div class="heartbeat">❤️<div class="hb-line"></div><span>heartbeat</span></div>
      <div class="ha-lb standby">⚖️ LB-B<span class="hastate">○ STANDBY — ready to take over</span></div>
    </div>
    <div class="farm-cap">Sharp catch — a <b>lone LB just moves</b> the single point of failure, it doesn’t remove it. The fix: run <b>two or more</b> LBs. They share one <b>Virtual IP</b> and watch each other with a <b>heartbeat</b> (VRRP / keepalived). If the active one dies, the standby <b style="color:#55efc4">grabs the VIP within seconds</b> — clients change nothing.</div>
  </div>`;
}
function rLbHA(){
  return `<div class="art" style="gap:16px">${compareHtml(
    {color:'#fdcb6e',icon:'🟢',title:'Active – Passive',sub:'one serves, one waits',
     rows:[['💓','Heartbeat (VRRP/keepalived) between them'],['🔁','Standby seizes the floating/Virtual IP on failure'],['⏱️','Failover in seconds'],['😴','The spare sits idle until needed']],
     foot:'Simple and reliable; half your LB capacity is on standby.'},
    {color:'#00b894',icon:'🟢🟢',title:'Active – Active',sub:'all serve at once',
     rows:[['📈','Every LB takes traffic — more total capacity'],['🧭','DNS or Anycast spreads clients across them'],['🛟','One dies → its share reroutes to the rest'],['🧩','More complex (shared / synced state)']],
     foot:'Higher throughput; combine with multi-AZ for true HA.'}
  )}
    <div class="hybridnote">🏢 Go further: place LBs across multiple <b>Availability Zones / regions</b> and front them with <b>Anycast or DNS</b>, so even a whole-data-center outage is survived.</div>
  </div>`;
}
function rLbTiers(){
  return `<div class="art" style="gap:8px">
    <div class="tier" style="border-color:#00cec9"><div class="tlabel">🌍 Internet</div><div class="tdesc">Anycast IP → nearest edge</div></div>
    <div class="tier-arrow">↓</div>
    <div class="tier t1"><div class="tlabel" style="color:#74b9ff">Tier 1 · Layer 4 (transport)</div><div class="trow">⚖️ ⚖️ ⚖️</div><div class="tdesc">blazing-fast, spreads raw connections — cheap to scale wide</div></div>
    <div class="tier-arrow">↓</div>
    <div class="tier t2"><div class="tlabel" style="color:#ff9ff3">Tier 2 · Layer 7 (application)</div><div class="trow">⚖️ ⚖️</div><div class="tdesc">content-aware routing, TLS termination, /api vs /img</div></div>
    <div class="tier-arrow">↓</div>
    <div class="tier"><div class="tlabel">App servers</div><div class="trow">🖥️ 🖥️ 🖥️ 🖥️</div></div>
    <div class="farm-cap" style="margin-top:8px">At large scale, yes — LBs are <b>tiered</b>. A thin <b>Tier-1 Layer-4</b> layer soaks up enormous connection volume and fans it out (often via Anycast/ECMP) to a fleet of <b>Tier-2 Layer-7</b> balancers that do the expensive smart routing. Each tier <b>scales independently</b>, and the cheap fast layer shields the smart one.</div>
  </div>`;
}

/* ----- register this building block with the app ----- */
App.registerCourse({
  key: 'loadbalancer',
  section: 'systemdesign',
  card: {
    icon: '⚖️', color: '#00b894', title: 'Load Balancer',
    blurb: 'Spread traffic across many servers — how it works, L4 vs L7, routing algorithms, stateful vs stateless, and global load balancing (GSLB: DNS vs Anycast).',
  },
  beats: LB_BEATS,
  scenes: {
    lbProblem: rLbProblem, lbSolution: rLbSolution, lbHow: rLbHow, lbLayers: rLbLayers,
    lbRoundRobin: rLbRoundRobin, lbAlgos: rLbAlgos, lbState: rLbState, lbLocalGlobal: rLbLocalGlobal,
    lbGeo: rLbGeo, lbGslbDns: rLbGslbDns, lbGslbAnycast: rLbGslbAnycast, lbGslbCompare: rLbGslbCompare,
    lbProsCons: rLbProsCons, lbSpof: rLbSpof, lbHA: rLbHA, lbTiers: rLbTiers,
  },
});
