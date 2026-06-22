/* =====================================================================
   COURSE · The Journey of a Click  (section: networking)
   Self-contained: story beats + scene renderers + home metadata + register.
   To tweak this topic, you only need this file.
   ===================================================================== */

/* ----- constants for the example request ----- */
const PAYLOAD='GET google.com';
const SERVER_IP='142.250.190.78';
const MY_IP='192.168.1.5';
const PUBLIC_IP='49.36.144.10';
const GATEWAY='192.168.1.1';

/* ----- OSI encapsulation layer details (BUILD + ARRIVAL scenes) ----- */
const LYR={
  7:{tag:'HTTP',name:'Application',pdu:'Data',
     fields:[['Method','GET'],['Path','/'],['Host','google.com']],
     why:'The actual message your browser wants to send.'},
  6:{tag:'TLS',name:'Presentation',pdu:'Data',
     fields:[['Protocol','TLS 1.3'],['Cipher','AES-GCM'],['Payload','🔒 encrypted']],
     why:'Encrypts it so nobody on the way can read it.'},
  5:{tag:'SESS',name:'Session',pdu:'Data',
     fields:[['Session','0xA17C'],['State','ESTABLISHED']],
     why:'Remembers this is one ongoing conversation.'},
  4:{tag:'TCP',name:'Transport',pdu:'Segment',
     fields:[['Src Port','51000'],['Dst Port','443'],['Flag','SYN'],['Seq #','1029384756']],
     why:'Adds ports + guarantees reliable, in-order delivery.'},
  3:{tag:'IP',name:'Network',pdu:'Packet',
     fields:[['Src IP',MY_IP],['Dst IP',SERVER_IP],['TTL','64'],['Proto','6 (TCP)']],
     why:'Stamps the source & destination IP so routers can forward it.'},
  2:{tag:'ETH',name:'Data Link',pdu:'Frame',
     fields:[['Src MAC','AA:BB:CC:11:22:33'],['Dst MAC','5C:F9:38:AB:CD:01'],['Type','0x0800']],
     why:'Adds hardware (MAC) addresses for the next hop on the local link.'},
  1:{tag:'BITS',name:'Physical',pdu:'Bits',
     fields:[['Medium','Wi-Fi radio'],['Encoding','OFDM'],['Preamble','10101010…']],
     why:'Turns the whole frame into 1s and 0s on the air.'},
};

/* ----- THE STORY: a flat list of user-paced beats ----- */
const NET_BEATS=[
  {ch:'1 · The Click', scene:'title', ttl:'You open <span class="hl">google.com</span>',
   txt:'You type four letters and hit Enter. In the next ~100 milliseconds, your request will be wrapped in five layers of headers, find Google’s address through a chain of servers, hop across your home, your city, and the internet backbone — and come back with a web page. Let’s follow it, one step at a time.'},

  /* ---- DNS ---- */
  {ch:'2 · Finding Google', scene:'dns', sub:0, ttl:'“Where <i>is</i> google.com?”',
   txt:'Computers don’t route to names — they route to <b>numbers (IP addresses)</b>. Before anything can be sent, your computer must translate <b>google.com</b> into an IP. This translation is called <b>DNS</b> (the internet’s phone book).'},
  {ch:'2 · Finding Google', scene:'dns', sub:1, ttl:'First, check your own memory',
   txt:'Your computer checks its <b>local DNS cache</b> — maybe it looked up Google recently. This time it’s a <span class="hl">miss</span>. So it has to go ask someone who knows.'},
  {ch:'2 · Finding Google', scene:'dns', sub:2, ttl:'Ask the resolver',
   txt:'It sends the question to a <b>recursive resolver</b> (here, <b>8.8.8.8</b>) — usually run by your ISP or a public provider. The resolver’s job: do the legwork and come back with an answer.'},
  {ch:'2 · Finding Google', scene:'dns', sub:3, ttl:'Step 1: ask a Root server',
   txt:'The resolver asks a <b>Root server</b>: “where do I find <b>.com</b>?” The root doesn’t know Google, but it knows who runs <b>.com</b> and replies: <span class="hl">“Ask the .com servers.”</span>'},
  {ch:'2 · Finding Google', scene:'dns', sub:4, ttl:'Step 2: ask the .com servers',
   txt:'Next the resolver asks the <b>.com TLD server</b>: “where’s <b>google.com</b>?” It replies with the address of Google’s own name servers: <span class="hl">“Ask Google’s nameserver.”</span>'},
  {ch:'2 · Finding Google', scene:'dns', sub:5, ttl:'Step 3: Google’s nameserver answers',
   txt:'Finally the resolver asks <b>Google’s authoritative nameserver</b>, which knows for sure: <span class="hl">google.com = '+SERVER_IP+'</span>.'},
  {ch:'2 · Finding Google', scene:'dns', sub:6, ttl:'The address comes back to you',
   txt:'The resolver hands the IP back to your computer (and caches it for next time). 🎉 <b>Now we know where to send the request:</b> <span class="hl">'+SERVER_IP+'</span>.'},

  /* ---- TCP 3-way handshake ---- */
  {ch:'3 · The Connection', scene:'tcp', sub:0, ttl:'Knock knock — open a connection',
   txt:'Before any secure data flows, the two machines open a reliable channel with the <b>TCP 3-way handshake</b>. Your computer sends a <b>SYN</b> (“let’s synchronise”) carrying a starting sequence number.'},
  {ch:'3 · The Connection', scene:'tcp', sub:1, ttl:'Google answers',
   txt:'Google replies with <b>SYN-ACK</b>: it acknowledges your number and sends its own. Both sides now know each other’s starting points.'},
  {ch:'3 · The Connection', scene:'tcp', sub:2, ttl:'Connection established',
   txt:'Your computer sends a final <b>ACK</b>. ✅ A reliable, ordered channel is open — the foundation the <b>TLS</b> security handshake will build on.'},

  /* ---- TLS handshake ---- */
  {ch:'4 · The Secret Handshake', scene:'tls', sub:0, ttl:'The problem: a wire everyone can read',
   txt:'Your data crosses routers and cables owned by strangers. To stay private it must be <b>encrypted</b> — but symmetric encryption needs <b>both sides to share the same secret key</b>. How do you agree on a secret while the whole world is watching? Enter the <b>TLS handshake</b>.'},
  {ch:'4 · The Secret Handshake', scene:'tls', sub:1, ttl:'ClientHello',
   txt:'Your browser says hello and offers: the <b>cipher suites</b> it supports, a fresh <b>random number</b>, and its <b>key share</b> — a public value <b class="mono">gᵃ</b> derived from a secret <b class="mono">a</b> that only your browser knows.'},
  {ch:'4 · The Secret Handshake', scene:'tls', sub:2, ttl:'ServerHello',
   txt:'Google picks a cipher (<b>AES-256-GCM</b>), sends its own <b>random</b> and its <b>key share</b> <b class="mono">gᵇ</b>. Now each side holds the other’s public key share — the ingredients for a shared secret.'},
  {ch:'4 · The Secret Handshake', scene:'tls', sub:3, ttl:'Sharing a secret in plain sight 🪄',
   txt:'This is the magic: <b>Diffie–Hellman key exchange</b>. Each side mixes the other’s public share with its own private secret and lands on the <b>same shared secret</b> <b class="mono">gᵃᵇ</b> — which was <b>never sent</b>. An eavesdropper sees both public shares but can’t reverse them to get the secret.'},
  {ch:'4 · The Secret Handshake', scene:'tls', sub:4, ttl:'Turn the secret into keys',
   txt:'The shared secret is run through a <b>key-derivation function (HKDF)</b> to produce the real <b>symmetric session keys</b>. From here, fast AES-GCM protects every byte — and the keys themselves never travel the wire.'},
  {ch:'4 · The Secret Handshake', scene:'tls', sub:5, ttl:'But is it really Google?',
   txt:'A shared key is worthless if you handed it to an impostor. Google presents a <b>certificate</b> signed by a <b>Certificate Authority</b>. Your browser verifies the signature chain up to a <b>trusted Root CA</b>, and <b>CertificateVerify</b> proves Google owns the matching private key — blocking man-in-the-middle attacks.'},
  {ch:'4 · The Secret Handshake', scene:'tls', sub:6, ttl:'🔒 Secure channel ready',
   txt:'Both sides send an encrypted <b>Finished</b> message covering the whole handshake, confirming nothing was tampered with. The secure tunnel is open — <b>now</b> the real request can travel, fully encrypted.'},

  /* ---- Encryption, explained ---- */
  {ch:'5 · Encryption, Explained', scene:'encwhy', ttl:'Why encrypt at all?',
   txt:'Everything you send hops across routers and cables owned by strangers — we even saw an eavesdropper sitting on the wire. <b>Encryption</b> scrambles your data so only the intended party can make sense of it, protecting three things: <b>Confidentiality</b>, <b>Integrity</b>, and <b>Authenticity</b>.'},
  {ch:'5 · Encryption, Explained', scene:'enctypes', ttl:'Two families: symmetric & asymmetric',
   txt:'Encryption comes in two great families. <b>Symmetric</b> uses one shared key to both lock and unlock — fast, but how do you share the key safely? <b>Asymmetric</b> uses a key <i>pair</i> — a public key anyone can lock with, and a private key only you can unlock with. TLS cleverly uses <b>both</b>.'},
  {ch:'5 · Encryption, Explained', scene:'hashing', ttl:'Hashing — a one-way fingerprint',
   txt:'Not all crypto hides data. <b>Hashing</b> turns any input into a fixed-size <b>fingerprint</b> that can’t be reversed — the same input always gives the same hash, but the tiniest change produces a completely different one. It powers <b>integrity</b> checks, password storage, and certificate signatures.'},
  {ch:'5 · Encryption, Explained', scene:'algos', ttl:'The algorithms you actually use',
   txt:'Here are the workhorses protecting you every day — including the ones from the TLS handshake you just watched. Each fits a specific job: bulk encryption, key exchange, signatures, or fingerprints.'},

  /* ---- BUILD / encapsulation ---- */
  {ch:'6 · Packaging It', scene:'build', sub:0, ttl:'Layer 7 — write the request',
   txt:'The secure tunnel is open. Now we build the actual request to send through it. At the top, your <b>browser</b> writes the HTTP request — the core that everything below will wrap around. (Each handshake message you just saw was wrapped and routed the very same way.)'},
  {ch:'6 · Packaging It', scene:'build', sub:1, ttl:'Layer 6 — lock it up',
   txt:'The <b>TLS</b> layer <b>encrypts</b> the request using the <b>session key</b> agreed during the handshake. From here on, anyone watching the wire sees only scrambled ciphertext.'},
  {ch:'6 · Packaging It', scene:'build', sub:2, ttl:'Layer 5 — remember the conversation',
   txt:'The <b>Session</b> layer keeps track that this is one ongoing exchange between you and Google.'},
  {ch:'6 · Packaging It', scene:'build', sub:3, ttl:'Layer 4 — add ports & reliability (TCP)',
   txt:'<b>TCP</b> wraps it with port numbers (you:51000 → Google:443) and sequence numbers so nothing is lost or out of order. It’s now a <b>Segment</b>.'},
  {ch:'6 · Packaging It', scene:'build', sub:4, ttl:'Layer 3 — add the addresses (IP)',
   txt:'<b>IP</b> stamps the <b>source and destination IP</b> ('+MY_IP+' → '+SERVER_IP+') and a <b>TTL</b> of 64. It’s now a <b>Packet</b> the whole internet can route.'},
  {ch:'6 · Packaging It', scene:'build', sub:5, ttl:'Layer 2 — address the next hop (MAC)',
   txt:'<b>Ethernet/Wi-Fi</b> wraps it in a <b>Frame</b> with MAC addresses — crucially, the destination MAC is your <b>home router</b>, the next hop, not Google.'},
  {ch:'6 · Packaging It', scene:'build', sub:6, ttl:'Layer 1 — become bits',
   txt:'The fully-wrapped frame is turned into <b>raw 1s and 0s</b> — radio waves ready to leave your laptop’s Wi-Fi antenna.'},

  /* ---- A closer look: transport & network ---- */
  {ch:'7 · A Closer Look', scene:'tcpudp', ttl:'Transport layer: TCP <span class="hl">vs</span> UDP',
   txt:'Layer 4 has two main protocols. We used <b>TCP</b> for the web request because every byte must arrive correctly and in order. But for speed-critical traffic, <b>UDP</b> trades guarantees for raw speed — that’s why <b>DNS</b> earlier rode on UDP.'},
  {ch:'7 · A Closer Look', scene:'mtu', ttl:'One message → many small packets',
   txt:'Networks cap how much fits in a single packet — the <b>MTU</b> (Maximum Transmission Unit), typically <b>1500 bytes</b> on Ethernet/Wi-Fi. Bigger data is split: <b>TCP</b> chops it into segments of ≈<b>1460 bytes</b> (the MSS), each tagged with a <b>sequence number</b>. The packets may take different routes and arrive out of order — the receiver uses the sequence numbers to reassemble them perfectly and re-request any that go missing. So the Google page comes back as <b>dozens of small packets</b>, not one big blob.'},
  {ch:'7 · A Closer Look', scene:'ipaddr', ttl:'Network layer: what is an IP address?',
   txt:'Layer 3 delivers by <b>IP address</b>. Let’s break one down — what it is, and what its two parts mean.'},
  {ch:'7 · A Closer Look', scene:'ipversion', ttl:'Two versions: IPv4 and IPv6',
   txt:'The internet is slowly moving from <b>IPv4</b> (we’re running out of addresses) to <b>IPv6</b> (effectively unlimited). Both identify devices — they just differ in size and format.'},
  {ch:'7 · A Closer Look', scene:'iptype', ttl:'Public vs private IP addresses',
   txt:'Not all IPs are equal. Devices in your home share <b>private</b> addresses that can’t travel the internet, hidden behind a single <b>public</b> address. That mismatch is exactly why the next step — <b>NAT</b> — exists.'},

  /* ---- LAN / leave home ---- */
  {ch:'8 · Leaving Home', scene:'lan', sub:0, ttl:'But… what’s the router’s MAC?',
   txt:'The frame needs the router’s hardware (MAC) address. Your computer shouts an <b>ARP</b> broadcast on the local network: <span class="hl">“Who has '+GATEWAY+'?”</span>'},
  {ch:'8 · Leaving Home', scene:'lan', sub:1, ttl:'The router answers',
   txt:'Your <b>home router</b> replies: <span class="hl">“That’s me — my MAC is 5C:F9:38:AB:CD:01.”</span> Now the frame can be addressed to it.'},
  {ch:'8 · Leaving Home', scene:'lan', sub:2, ttl:'Send it over Wi-Fi',
   txt:'The bits travel over <b>Wi-Fi radio</b> a few metres to your router. First hop complete!'},
  {ch:'8 · Leaving Home', scene:'lan', sub:3, ttl:'NAT: borrow a public address',
   txt:'Your laptop’s <b>'+MY_IP+'</b> is a <b>private</b> address that can’t travel the public internet. The router performs <b>NAT</b>: it rewrites the source IP to its own <b>public IP</b> and notes the swap so replies find their way back.'},

  /* ---- How the signal travels: media, bandwidth, cellular ---- */
  {ch:'9 · How the Signal Travels', scene:'fiber', ttl:'Down the fibre — at the speed of light',
   txt:'Across cities and under oceans, your bits travel as <b>pulses of light</b> through hair-thin strands of <b>optical fibre</b>. A laser flashes on and off — light on = 1, off = 0 — and the glass core guides the light by <b>total internal reflection</b>, keeping it trapped even around bends.'},
  {ch:'9 · How the Signal Travels', scene:'bandwidth', ttl:'Bandwidth — the width of the pipe',
   txt:'Why is fibre such a big deal? <b>Bandwidth</b>. Here’s what that word actually means, and why a wider “pipe” carries far more data at once.'},
  {ch:'9 · How the Signal Travels', scene:'cellular', ttl:'Wireless: 2G → 3G → 4G → 5G',
   txt:'Not on Wi-Fi or fibre? Your phone reaches the internet over the <b>cellular</b> network. Each generation roughly multiplied the bandwidth and cut the latency of the one before it.'},

  /* ---- BGP: how routers learn the way ---- */
  {ch:'10 · BGP — Mapping the Internet', scene:'bgpProblem', ttl:'No one owns the map',
   txt:'We’ve been forwarding toward Google’s IP — but <b>how does any router know the way</b>? The internet is tens of thousands of separate networks with <b>no central directory</b>. The protocol that stitches them together is <b>BGP</b>.'},
  {ch:'10 · BGP — Mapping the Internet', scene:'bgpAS', ttl:'Autonomous Systems & their numbers',
   txt:'Each network is an <b>Autonomous System</b> with a unique <b>ASN</b>. BGP is spoken at the <b>borders</b> between them, exchanging which destinations each can reach.'},
  {ch:'10 · BGP — Mapping the Internet', scene:'bgpAnnounce', ttl:'“I can reach this!”',
   txt:'Routing starts at the destination. <b>Google announces its prefix</b> — a range of IPs — to its neighbouring networks, saying it can be reached through them.'},
  {ch:'10 · BGP — Mapping the Internet', scene:'bgpPath', ttl:'The announcement spreads — building the AS-PATH',
   txt:'Neighbours pass the announcement along, each <b>stamping its own ASN</b> onto the path. Hop by hop, the whole internet learns a route to Google — and the recorded <b>AS-PATH</b> shows exactly which networks it crosses.'},
  {ch:'10 · BGP — Mapping the Internet', scene:'bgpBest', ttl:'Choosing the best route',
   txt:'Often there’s more than one way to reach a prefix. BGP runs a <b>best-path selection</b> — shortest AS-PATH plus business policy — and installs the winner.'},
  {ch:'10 · BGP — Mapping the Internet', scene:'bgpForward', ttl:'Forwarding your packet',
   txt:'With routes in hand, every router knows where to send your packet next. This is the control-plane knowledge that makes the upcoming journey possible.'},
  {ch:'10 · BGP — Mapping the Internet', scene:'bgpTrust', ttl:'Built on trust (and why that’s risky)',
   txt:'BGP’s great weakness: it mostly <b>trusts</b> what networks announce. One bad announcement can hijack traffic worldwide — which is why modern defences like <b>RPKI</b> exist.'},

  /* ---- WAN / across the internet ---- */
  {ch:'11 · Across the Internet', scene:'wan', sub:0, ttl:'Out to your ISP',
   txt:'The router forwards the packet to your <b>ISP</b>. The ISP’s router reads only the <b>destination IP</b> ('+SERVER_IP+'), decides the best next hop, and <b>decrements the TTL</b>. It never opens your encrypted data.'},
  {ch:'11 · Across the Internet', scene:'wan', sub:1, ttl:'Onto the backbone',
   txt:'From the ISP, the packet enters the high-capacity <b>internet backbone</b> — long-haul fibre carrying it across cities (and maybe under oceans). Another router, another TTL tick down.'},
  {ch:'11 · Across the Internet', scene:'wan', sub:2, ttl:'Into Google’s network',
   txt:'At a <b>peering point</b>, the packet crosses into <b>Google’s edge network</b>. Google often has servers close to you, so this is usually nearer than you’d think.'},
  {ch:'11 · Across the Internet', scene:'wan', sub:3, ttl:'Arrival at the data center',
   txt:'A final hop delivers the packet to a <b>Google server</b> at '+SERVER_IP+'. It made it across the internet — and the original data inside was <b>never opened</b> by any router on the way.'},

  /* ---- ARRIVAL / reply ---- */
  {ch:'12 · Arrival & Reply', scene:'arrival', sub:0, ttl:'Google unwraps the packet',
   txt:'The server reverses the whole process — <b>de-encapsulation</b>. It peels off each header from the outside in: bits → frame → packet → segment → decrypt → the original request.'},
  {ch:'12 · Arrival & Reply', scene:'arrival', sub:1, ttl:'It reads your request',
   txt:'At the top, Google’s application finally sees the original <b class="mono">'+PAYLOAD+'</b> — byte-for-byte what you sent. It builds the <b>response</b>: the search page.'},
  {ch:'12 · Arrival & Reply', scene:'arrival', sub:2, ttl:'The reply makes the trip back',
   txt:'The response gets wrapped in the same five layers and travels the <b>entire journey in reverse</b> — back through the backbone, your ISP, your router (NAT reverses), and to your laptop.'},

  {ch:'✓ Done', scene:'done', ttl:'google.com is on your screen 🎉',
   txt:'All of that — DNS lookup, five layers of wrapping, the trip across the internet, and the reply — happened in roughly <b>100 milliseconds</b>. Every time you load a page, this entire story plays out.'},
];

/* ----- network-specific render helpers ----- */
function ringStack(layers){ // layers: array innermost-control; we pass set of n's
  const ls=[...layers].sort((a,b)=>b-a); // 7 innermost first
  let html=`<div class="core">📄 ${PAYLOAD}</div>`;
  ls.forEach(n=>{
    const L=LYR[n], c=colorN(n);
    html=`<div class="ring" style="border-color:${c}">
            <div class="tab" style="background:${c}">L${n} ${L.name} · ${L.tag}</div>${html}
          </div>`;
  });
  return html;
}
function sideCard(n){
  const L=LYR[n], c=colorN(n);
  return `<div class="sidecard">
    <h4 style="color:${c}">Layer ${n} · ${L.name} <span style="color:var(--muted);font-weight:400;font-size:12px">(${L.tag})</span></h4>
    <div class="pdu">Unit becomes: <b>${L.pdu}</b></div>
    ${L.fields.map(f=>`<div class="frow"><span class="k">${f[0]}</span><span class="v mono">${f[1]}</span></div>`).join('')}
    <div class="why">${L.why}</div>
  </div>`;
}

/* ----- scene renderers ----- */
/* =====================================================================
   SCENE RENDERERS
   ===================================================================== */
function rTitle(){
  return `<div class="art">
    <div class="browser">
      <div class="bar"><div class="dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
        <div class="url mono">google.com<span class="caret"></span></div></div>
      <div class="page">↩ press Enter…</div>
    </div>
  </div>`;
}

function rDns(sub){
  const nodes=[
    {icon:'💻',nm:'Your computer',sub:MY_IP,gl:'#74b9ffaa'},
    {icon:'🧭',nm:'Resolver',sub:'8.8.8.8',gl:'#4c6ef5aa'},
    {icon:'🌍',nm:'Root server',sub:'“.”',gl:'#fdcb6eaa'},
    {icon:'🏷️',nm:'.com TLD',sub:'top-level',gl:'#e17055aa'},
    {icon:'🔷',nm:'Google NS',sub:'authoritative',gl:'#0984e3aa'},
  ];
  let active=-1, conn=-1, dir='fwd', msg='', kind='';
  let extra='';
  if(sub===0){active=0;}
  if(sub===1){active=0; extra=`<div class="pkt"><span class="dotc"></span>Local cache: <b style="color:#ff7675;margin-left:6px">no entry — miss</b></div>`;}
  if(sub===2){active=1; conn=0; msg='What’s the IP of google.com?';}
  if(sub===3){active=2; conn=1; msg='Where is .com?'; }
  if(sub===4){active=3; conn=2; msg='Where is google.com?';}
  if(sub===5){active=4; conn=3; msg='= '+SERVER_IP; kind='ans';}
  if(sub===6){active=0; conn=0; dir='back'; msg='IP: '+SERVER_IP; kind='ans';
              extra=`<div class="pkt"><span class="dotc" style="background:#55efc4;box-shadow:0 0 10px #55efc4"></span>Resolved & cached: <b class="mono" style="color:#55efc4;margin-left:6px">${SERVER_IP}</b></div>`;}
  return `<div class="art">${chainHtml(nodes,active,conn,dir,msg,kind)}${extra?`<div>${extra}</div>`:''}</div>`;
}

function rBuild(sub){
  const n=7-sub;                 // sub0->L7 ... sub6->L1
  const set=new Set();
  for(let k=7;k>=n;k--) set.add(k);
  return `<div class="art"><div class="stack-wrap">
      <div>${ringStack(set)}</div>
      ${sideCard(n)}
    </div></div>`;
}

function rLan(sub){
  const nodes=[
    {icon:'💻',nm:'Your laptop',sub:MY_IP,gl:'#74b9ffaa'},
    {icon:'🏠',nm:'Home router',sub:GATEWAY+' / NAT',gl:'#6c5ce7aa'},
  ];
  let active=1, conn=-1, dir='fwd', msg='', kind='', extra='';
  if(sub===0){active=1; conn=0; dir='fwd'; msg='Who has '+GATEWAY+'? (ARP)';}
  if(sub===1){active=0; conn=0; dir='back'; msg='Me! MAC 5C:F9:38:AB:CD:01'; kind='ans';}
  if(sub===2){active=1; conn=0; dir='fwd'; msg='📶 frame over Wi-Fi'; extra=`<div class="wifi">📡 ～～～ bits crossing the air to the router ～～～</div>`;}
  if(sub===3){active=1; conn=-1;
    extra=`<div class="nat"><h4>🔁 NAT — what the router rewrites in the packet header</h4>
      <table class="nattbl mono">
        <tr><th>Header field</th><th>Before (from laptop)</th><th>After (router rewrites)</th></tr>
        <tr class="chg"><td>Source IP</td><td class="from">${MY_IP} <small>private</small></td><td class="to">${PUBLIC_IP} <small>public</small></td></tr>
        <tr class="chg"><td>Source Port</td><td class="from">51000</td><td class="to">40231</td></tr>
        <tr class="same"><td>Dest IP</td><td>${SERVER_IP}</td><td>${SERVER_IP}</td></tr>
        <tr class="same"><td>Dest Port</td><td>443</td><td>443</td></tr>
        <tr class="chg"><td>Checksums</td><td class="from">old</td><td class="to">recalculated ✓</td></tr>
        <tr class="same"><td>Payload 🔒</td><td>encrypted</td><td>untouched</td></tr>
      </table>
      <div class="natnote">📒 NAT table entry: <span class="mono" style="color:#fff">${PUBLIC_IP}:40231 → ${MY_IP}:51000</span><br>Only the <b style="color:#55efc4">source</b> changes; the destination and your encrypted data are untouched. The mapping lets replies find their way back to your laptop.</div>
    </div>`;}
  return `<div class="art" style="gap:34px">${chainHtml(nodes,active,conn,dir,msg,kind)}${extra}</div>`;
}

function rWan(sub){
  const nodes=[
    {icon:'🏠',nm:'Home router',sub:PUBLIC_IP,gl:'#6c5ce7aa'},
    {icon:'🏢',nm:'Your ISP',sub:'first hop',gl:'#00b894aa'},
    {icon:'🌐',nm:'Backbone',sub:'long-haul fibre',gl:'#0984e3aa'},
    {icon:'📍',nm:'Google edge',sub:'peering point',gl:'#e84393aa'},
    {icon:'🖥️',nm:'Google server',sub:SERVER_IP,gl:'#74b9ffaa'},
  ];
  const ttls=[63,62,61,60];
  let active=sub+1, conn=sub, dir='fwd';
  const arrived=(sub===3);
  const msg=arrived?'✅ delivered':('dst '+SERVER_IP);
  const extra=`<div class="ttl">⏱️ TTL (hop limit): <b>${ttls[sub]}</b> &nbsp;<span style="color:var(--muted);font-size:12px">each router subtracts 1 — hits 0 ⇒ dropped</span></div>`;
  return `<div class="art" style="gap:34px">${chainHtml(nodes,active,conn,dir,msg,arrived?'ans':'')}${extra}</div>`;
}

function rArrival(sub){
  if(sub===0){
    return `<div class="art"><div class="stack-wrap">
      <div>${ringStack(new Set([2,3,4]))}</div>
      <div class="sidecard"><h4>🖥️ Google peels the layers off</h4>
        <div class="pdu">De-encapsulation — outside in</div>
        <div class="frow"><span class="k">L1 Physical</span><span class="v">bits → frame ✓</span></div>
        <div class="frow"><span class="k">L2 Ethernet</span><span class="v">checked MAC/FCS ✓</span></div>
        <div class="frow"><span class="k">L3 IP</span><span class="v">it’s for me ✓</span></div>
        <div class="frow"><span class="k">L4 TCP</span><span class="v">reorder, port 443 ✓</span></div>
        <div class="why">Each layer reads its own header, then removes it and passes what’s inside upward.</div>
      </div></div></div>`;
  }
  if(sub===1){
    return `<div class="art"><div class="core" style="font-size:18px;padding:22px 30px">📄 ${PAYLOAD}</div>
      <div class="pkt" style="font-size:15px">🖥️ Google’s app reads your request → builds the <b style="margin-left:6px">search page</b> 🔎</div></div>`;
  }
  // sub2: reply travels back
  const nodes=[
    {icon:'🖥️',nm:'Google',sub:SERVER_IP,gl:'#74b9ffaa'},
    {icon:'🌐',nm:'Backbone',sub:'',gl:'#0984e3aa'},
    {icon:'🏢',nm:'Your ISP',sub:'',gl:'#00b894aa'},
    {icon:'🏠',nm:'Home router',sub:'NAT reverses',gl:'#6c5ce7aa'},
    {icon:'💻',nm:'You',sub:MY_IP,gl:'#fdcb6eaa'},
  ];
  return `<div class="art" style="gap:30px">${chainHtml(nodes,4,3,'fwd','📦 response',' ')}
    <div class="pkt"><span class="dotc" style="background:#55efc4;box-shadow:0 0 10px #55efc4"></span>The page is on its way back to your browser</div></div>`;
}

function rDone(){
  return `<div class="art"><div class="chk">✓</div>
    <div class="browser" style="width:min(560px,86%)">
      <div class="bar"><div class="dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
        <div class="url mono">https://google.com</div></div>
      <div class="page" style="color:#11142b;font-size:26px;font-weight:800;letter-spacing:1px">
        <span style="color:#4285F4">G</span><span style="color:#EA4335">o</span><span style="color:#FBBC05">o</span><span style="color:#4285F4">g</span><span style="color:#34A853">l</span><span style="color:#EA4335">e</span>
      </div>
    </div>
    <div class="recap">
      <div class="r"><b>1 · DNS</b>name → IP via resolver chain</div>
      <div class="r"><b>2 · Encapsulate</b>7 layers of headers (L7→L1)</div>
      <div class="r"><b>3 · LAN</b>ARP + Wi-Fi + NAT to the router</div>
      <div class="r"><b>4 · WAN</b>router hops, TTL ticking down</div>
      <div class="r"><b>5 · Reply</b>de-encapsulate + same trip back</div>
      <div class="r"><b>⏱ Total</b>~100 milliseconds</div>
    </div></div>`;
}

/* ----- TCP / TLS shared bits ----- */
function laneHtml(dir,label,detail){
  return `<div class="lane">
     <div class="endlabel l">💻 You</div>
     <div class="endlabel r">🖥️ Google</div>
     <div class="fly ${dir==='cs'?'toR':'toL'}">
        <div class="ml">${dir==='cs'?'➡ ':'⬅ '}${label}</div>
        <div class="md">${detail}</div>
     </div>
   </div>`;
}
function transcriptHtml(items,cur){
  return `<div class="transcript">`+items.map((m,i)=>`
    <div class="trow ${i===cur?'cur':''} ${i>cur?'future':''}">
      <span class="dir">${m.dir==='cs'?'➡':'⬅'}</span><span>${m.label}</span>
    </div>`).join('')+`</div>`;
}
function tlsStepper(active){
  const steps=['ClientHello','ServerHello + key share','Shared secret (Diffie–Hellman)','Derive session keys','Verify certificate','Finished → 🔒 secure'];
  return `<div class="stepper">`+steps.map((s,i)=>`
    <div class="st ${i===active?'cur':''} ${i<active?'done':''}">
      <span class="stn">${i<active?'✓':i+1}</span><span>${s}</span>
    </div>`).join('')+`</div>`;
}

function rTcp(sub){
  const msgs=[
    {dir:'cs',label:'SYN',     detail:'“Can we talk?”  seq=1000, flag=SYN'},
    {dir:'sc',label:'SYN-ACK', detail:'“Sure.”  ack=1001, seq=5000, flags=SYN+ACK'},
    {dir:'cs',label:'ACK',     detail:'“Great.”  ack=5001, flag=ACK — open ✅'},
  ];
  const m=msgs[sub];
  const note = sub===2 ? `<div class="pkt"><span class="dotc" style="background:#55efc4;box-shadow:0 0 10px #55efc4"></span>Reliable connection established — now TLS can secure it</div>` : '';
  return `<div class="art" style="gap:22px">
    ${laneHtml(m.dir,m.label,m.detail)}
    ${transcriptHtml(msgs.map(x=>({dir:x.dir,label:x.label})),sub)}
    ${note}
  </div>`;
}

function dhVisual(){
  return `
  <div class="dh">
    <div class="dh-side">
      <div class="who">💻 You</div>
      <div class="blob secret">🔴 secret <b>a</b><div style="font-weight:400;color:#9aa3c7;font-size:11px">never leaves your device</div></div>
      <div class="blob pub">🟠 send  A = gᵃ mod p  →</div>
    </div>
    <div class="dh-mid">
      <div style="font-size:30px">🕵️</div>
      <div class="eve-tag">Eavesdropper</div>
      <div style="font-size:12px;color:#9aa3c7">sees 🟠 and 🟢 fly by,<br>but <b style="color:#ff7675">cannot</b> compute 🟣</div>
    </div>
    <div class="dh-side">
      <div class="who">🖥️ Google</div>
      <div class="blob secret">🔵 secret <b>b</b><div style="font-weight:400;color:#9aa3c7;font-size:11px">never leaves the server</div></div>
      <div class="blob pub">←  B = gᵇ mod p  send 🟢</div>
    </div>
  </div>
  <div class="dh-result">Each combines the other’s public value with their own secret →<br>both reach the <b>same</b> shared secret <b class="mono">gᵃᵇ mod p</b> 🟣</div>
  <div class="dh-math">🎨 Like mixing paint: a public base colour + your private colour makes a mix you can share. Combine the two mixes and you both land on the same final colour — but an eavesdropper can’t “un-mix” it back to the secrets.</div>`;
}
function keysVisual(){
  return `<div class="keys-vis">
    <div class="blob shared" style="margin:0">🟣 shared secret<div class="mono" style="font-weight:400">gᵃᵇ mod p</div></div>
    <div style="font-size:24px">→</div>
    <div class="step2">🧮 HKDF<div style="font-size:11px;color:#9aa3c7">key-derivation</div></div>
    <div style="font-size:24px">→</div>
    <div class="blob pub" style="margin:0">🔑 AES-256-GCM<div style="font-weight:400;font-size:11px;color:#9aa3c7">session keys</div></div>
  </div>
  <div style="max-width:580px;text-align:center;color:var(--muted);font-size:13.5px">Both sides feed the shared secret through the same function and get <b style="color:#fff">identical symmetric keys</b>. Encryption from here is fast — and the keys are never sent.</div>`;
}
function certVisual(){
  return `<div class="certchain">
    <div class="cert"><div class="ci">📜</div>google.com<div style="font-size:11px;color:#9aa3c7">server cert</div></div>
    <div class="signedby">← signed by ←</div>
    <div class="cert"><div class="ci">🏢</div>Intermediate CA<div style="font-size:11px;color:#9aa3c7">e.g. Google Trust</div></div>
    <div class="signedby">← signed by ←</div>
    <div class="cert" style="border-color:#00b894"><div class="ci">🏛️</div>Root CA<div style="font-size:11px;color:#55efc4">in your trust store ✅</div></div>
  </div>
  <div style="max-width:600px;text-align:center;color:var(--muted);font-size:13.5px">Google sends a <b style="color:#fff">certificate</b> proving it really is google.com. Your browser follows the signatures up to a <b>Root CA</b> it already trusts. <b>CertificateVerify</b> proves Google holds the matching private key — defeating man-in-the-middle impostors.</div>`;
}
function rTls(sub){
  let main='';
  if(sub===0){
    main=`<div class="wire-eve">
        <div class="big2">💻</div><div class="line"></div>
        <div style="text-align:center"><div style="font-size:30px">🕵️</div><div class="eve-tag">anyone can read packets</div></div>
        <div class="line"></div><div class="big2">🖥️</div>
      </div>
      <div style="max-width:560px;text-align:center;color:var(--muted);font-size:13.5px">Symmetric encryption is fast — but both sides need the <b style="color:#fff">same secret key</b>. How do you agree on a key over a wire everyone can see? That’s the puzzle TLS solves.</div>`;
  }
  else if(sub===1){ main=laneHtml('cs','ClientHello','cipher suites I support · client random · my key share gᵃ'); }
  else if(sub===2){ main=laneHtml('sc','ServerHello','chosen: AES-256-GCM · server random · key share gᵇ'); }
  else if(sub===3){ main=dhVisual(); }
  else if(sub===4){ main=keysVisual(); }
  else if(sub===5){ main=certVisual(); }
  else { main=`<div class="secure-banner">🔒 Secure channel established<div style="font-size:13px;color:#9aa3c7;font-weight:500;margin-top:6px">Both sides verified the whole handshake with an encrypted “Finished”. All data now flows under AES-GCM.</div></div>`; }
  return `<div class="art"><div class="tls-wrap"><div class="tls-main">${main}</div>${tlsStepper(sub-1)}</div></div>`;
}

/* ----- deep-dive: transport & network ----- */
function rTcpUdp(){
  return `<div class="art">${compareHtml(
    {color:'#00b894',icon:'📦',title:'TCP',sub:'Transmission Control Protocol — reliable',
     rows:[['🤝','Connection-oriented: 3-way handshake first'],['✅','Reliable: lost data is re-sent'],['🔢','Ordered: bytes arrive in sequence'],['🧾','Acknowledged & error-checked'],['🐢','Bigger header (20 bytes), a bit slower'],['🌐','Web (HTTP/S), email, SSH, file transfer']],
     foot:'📞 Like a phone call + registered mail — confirmed delivery.'},
    {color:'#0984e3',icon:'⚡',title:'UDP',sub:'User Datagram Protocol — fast',
     rows:[['🚀','Connectionless: just send, no setup'],['🎲','Unreliable: no retransmission'],['🔀','Unordered: may arrive out of order'],['🪶','Tiny header (8 bytes)'],['⏱️','Low latency — speed over guarantees'],['🎮','DNS, video/voice calls, gaming, DHCP']],
     foot:'📣 Like shouting / postcards — fast, no confirmation.'}
  )}</div>`;
}
function rIpAddr(){
  return `<div class="art"><div class="ipbox">
    <div class="octets mono">
      <span class="octet net">192</span><span>.</span><span class="octet net">168</span><span>.</span><span class="octet net">1</span><span>.</span><span class="octet host">5</span>
    </div>
    <div style="display:flex;gap:36px;font-size:12.5px;flex-wrap:wrap;justify-content:center">
      <span style="color:#74b9ff">↑ Network part — <i>which network</i></span>
      <span style="color:#ff9ff3">↑ Host part — <i>which device</i></span>
    </div>
    <div style="max-width:640px;text-align:center;color:var(--muted);font-size:14px;line-height:1.6">
      An <b style="color:#fff">IP address</b> is a unique number identifying a device on a network — a postal address for your computer. A <b>subnet mask</b> (e.g. <span class="mono">255.255.255.0</span> = <span class="mono">/24</span>) marks where the <b style="color:#74b9ff">network</b> part ends and the <b style="color:#ff9ff3">host</b> part begins, so routers know which network to deliver to — then which device within it.
    </div>
  </div></div>`;
}
function rIpVersion(){
  return `<div class="art">${compareHtml(
    {color:'#fdcb6e',icon:'4️⃣',title:'IPv4',sub:'32-bit addresses',
     rows:[['#','32 bits → ~4.3 billion addresses'],['📝','Dotted decimal: <span class="mono">192.168.1.5</span>'],['⚠️','Address space exhausted — NAT stretches it'],['🌍','Still the most widely used today']],
     foot:'Example: 142.250.190.78 (google.com)'},
    {color:'#a29bfe',icon:'6️⃣',title:'IPv6',sub:'128-bit addresses',
     rows:[['#','128 bits → 340 undecillion (3.4×10³⁸)'],['📝','Hex + colons: <span class="mono">2001:db8:85a3::7334</span>'],['✅','Practically unlimited — no NAT needed'],['🛡️','Simpler routing, modern features built in']],
     foot:'Enough addresses for every grain of sand on Earth — many times over.'}
  )}</div>`;
}
function rIpType(){
  return `<div class="art" style="gap:20px">
    <div class="homenet">
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="dev"><span class="di">💻</span>192.168.1.5</div>
        <div class="dev"><span class="di">📱</span>192.168.1.6</div>
        <div class="dev"><span class="di">📺</span>192.168.1.7</div>
      </div>
      <span class="a">→</span>
      <div class="rt"><span class="di" style="font-size:30px">🏠</span>Router<br><span style="color:#55efc4">public 49.36.144.10</span></div>
      <span class="a">→</span>
      <div class="rt"><span class="di" style="font-size:30px">🌐</span>Internet</div>
    </div>
    ${compareHtml(
      {color:'#e17055',icon:'🏠',title:'Private IP',sub:'inside your network (LAN)',
       rows:[['🔒','Not routable on the public internet'],['♻️','Reused everywhere — your 192.168.1.5 isn’t unique'],['📋','Ranges: 10.x · 172.16–31.x · 192.168.x'],['🆓','Handed out by your router (DHCP)']],
       foot:'Your laptop, phone & TV each get a private IP from the router.'},
      {color:'#00b894',icon:'🌐',title:'Public IP',sub:'on the open internet',
       rows:[['🆔','Globally unique — no two the same'],['🛰️','Assigned by your ISP (ultimately IANA)'],['👪','One public IP shared by all your devices'],['↔️','NAT maps private ⇄ public — coming up next!']],
       foot:'This is the address the rest of the internet sees you as.'}
    )}
  </div>`;
}

function rMtu(){
  let cells='';
  for(let i=1;i<=6;i++) cells+=`<div class="pktcell" style="animation-delay:${(i*0.09).toFixed(2)}s">#${i}<br>1460 B</div>`;
  cells+=`<div class="pktcell more" style="animation-delay:.65s">… ×29<br>more</div>`;
  return `<div class="art"><div class="mtu-wrap">
    <div class="bigdata">📄 Response: google.com page  ≈ 50 KB</div>
    <div style="font-size:22px;color:#3a4170">↓  too big for one packet — split up  ↓</div>
    <div class="splitrow">${cells}</div>
    <div class="mturuler">📏 Max per packet on Ethernet/Wi-Fi — <b>MTU = 1500 bytes</b><br>usable data per TCP segment — <b>MSS ≈ 1460 bytes</b> (1500 − 20 IP − 20 TCP)<br><span style="color:#9aa3c7">Each segment is numbered, may take a different route, and is reassembled in order at the far end.</span></div>
  </div></div>`;
}

/* ----- how the signal travels: fibre, bandwidth, cellular ----- */
function rFiber(){
  let pulses='';
  for(let i=0;i<6;i++) pulses+=`<div class="pulse" style="animation-delay:${(i*0.4).toFixed(2)}s"></div>`;
  return `<div class="art" style="gap:18px">
    <div class="fiber"><div class="core"></div>${pulses}</div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:780px">
      ${infoCard('💡','Bits become light','A laser flashes on/off billions of times a second — light on = 1, off = 0.')}
      ${infoCard('🪞','Total internal reflection','Light stays trapped inside the glass core, bouncing off the cladding — even around bends.')}
      ${infoCard('🚀','Fast & far','Travels ~⅔ the speed of light with tiny loss — perfect for cross-country & undersea cables.')}
      ${infoCard('🌈','Many colours at once','Different wavelengths carry separate streams in one fibre (WDM) → massive capacity.')}
    </div>
  </div>`;
}
function rBandwidth(){
  let narrow=''; for(let i=0;i<2;i++) narrow+=`<span class="dotp" style="top:50%;animation-delay:${(i*0.9).toFixed(2)}s"></span>`;
  let wide='';   for(let i=0;i<9;i++) wide+=`<span class="dotp" style="top:${20+(i%3)*30}%;animation-delay:${(i*0.2).toFixed(2)}s"></span>`;
  return `<div class="art" style="gap:22px">
    <div class="pipes">
      <div class="pipe-row"><div class="pipelabel">📶 5 Mbps<br><small>narrow pipe</small></div><div class="pipe narrow">${narrow}</div></div>
      <div class="pipe-row"><div class="pipelabel">🚀 1 Gbps<br><small>wide pipe</small></div><div class="pipe wide">${wide}</div></div>
    </div>
    <div style="max-width:680px;text-align:center;color:var(--muted);font-size:14px;line-height:1.6">
      <b style="color:#fff">Bandwidth</b> is how much data a link carries <b>per second</b> — its capacity, in <b>Mbps / Gbps</b>. Picture a <b>pipe’s width</b> or <b>lanes on a highway</b>: wider = more data flows at once. Fibre offers enormous bandwidth, which is why backbones are built from it.<br>
      <span style="font-size:12.5px">It isn’t the same as <b>latency</b> — bandwidth = how <i>much</i> at once; latency = how <i>long</i> one bit takes to arrive.</span>
    </div>
  </div>`;
}
function rCellular(){
  const gens=[
    {g:'2G', yr:'~1991', color:'#b2bec3', speed:'~0.05–0.2 Mbps', bar:4,   use:'Digital voice + SMS texting'},
    {g:'3G', yr:'~2001', color:'#fdcb6e', speed:'~2–42 Mbps',     bar:18,  use:'Mobile internet, video calls'},
    {g:'4G / LTE', yr:'~2009', color:'#00b894', speed:'~10–100+ Mbps', bar:55, use:'HD streaming, apps, maps'},
    {g:'5G', yr:'~2019', color:'#e84393', speed:'~0.1–10 Gbps',   bar:100, use:'Ultra-fast, <10 ms latency, billions of IoT devices'},
  ];
  return `<div class="art"><div class="gens">`+gens.map(x=>`
    <div class="gen" style="border-top-color:${x.color}">
      <div class="gg" style="color:${x.color}">${x.g}</div>
      <div class="gy">${x.yr}</div>
      <div class="gbarwrap"><div class="gbar" style="width:${x.bar}%;background:${x.color}"></div></div>
      <div class="gs">${x.speed}</div>
      <div class="gu">${x.use}</div>
    </div>`).join('')+`</div>
    <div style="max-width:700px;text-align:center;color:var(--muted);font-size:13px;margin-top:8px;line-height:1.6">Each cellular generation brought roughly <b style="color:#fff">10–100× the bandwidth</b> of the last and <b>lower latency</b> — from text messages (2G) to real-time everything (5G). This is the <b>wireless</b> path your data takes when you’re not on Wi-Fi.</div>
  </div>`;
}

/* ----- encryption, explained ----- */
function rEncWhy(){
  return `<div class="art" style="gap:22px">
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;justify-content:center">
      <div class="plainbox">🔓 “password: hunter2”<small>plaintext — anyone on the wire can read it</small></div>
      <div style="font-size:26px">🔒→</div>
      <div class="cipherbox mono">x9$@kL7#qZ…<small>encrypted — gibberish to an eavesdropper</small></div>
    </div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:780px">
      ${infoCard('🙈','Confidentiality','Only the intended reader can understand the data.')}
      ${infoCard('🛡️','Integrity','Any tampering in transit is detected.')}
      ${infoCard('🪪','Authenticity','You can prove who you’re really talking to.')}
    </div>
  </div>`;
}
function rEncTypes(){
  return `<div class="art" style="gap:18px">
    ${compareHtml(
      {color:'#00b894',icon:'🔑',title:'Symmetric',sub:'one shared key',
       rows:[['🔑','The same key both encrypts and decrypts'],['⚡','Very fast — ideal for bulk data'],['⚠️','Challenge: how to share the key safely? → Diffie–Hellman'],['🔧','e.g. AES, ChaCha20']],
       foot:'TLS uses this for all your actual data, once a key is agreed.'},
      {color:'#0984e3',icon:'🗝️',title:'Asymmetric',sub:'a public + private key pair',
       rows:[['🔓','Public key (shared) locks → only the private key unlocks'],['✍️','Private key signs → anyone verifies with the public key'],['🐢','Slower — used for setup, not bulk data'],['🔧','e.g. RSA, ECC']],
       foot:'TLS uses this to verify the certificate and set up the session.'}
    )}
    <div class="hybridnote">🤝 Real systems are <b>hybrid</b>: asymmetric crypto safely agrees a key, then fast <b>symmetric</b> (AES) protects the data — exactly what the TLS handshake did.</div>
  </div>`;
}
function rHashing(){
  return `<div class="art" style="gap:18px">
    <div class="hashdemo">
      <div class="hrow"><span class="hin mono">"hello"</span><span>→</span><span class="hfn">SHA-256</span><span>→</span><span class="hout mono">2cf24dba5fb0a3…9824</span></div>
      <div class="hrow"><span class="hin mono">"hellp"</span><span>→</span><span class="hfn">SHA-256</span><span>→</span><span class="hout mono">7f83b1657ff1fc…b8e2</span></div>
    </div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:780px">
      ${infoCard('➡️','One-way','You can’t reverse a hash back into the original input.')}
      ${infoCard('📏','Fixed size','Any input — a word or a movie — yields the same-length fingerprint.')}
      ${infoCard('🌊','Avalanche','Change one letter and the entire hash changes completely.')}
      ${infoCard('🔐','HMAC','Add a secret key to a hash to prove integrity AND authenticity.')}
    </div>
  </div>`;
}
function rAlgos(){
  const algos=[
    {n:'AES',          type:'Symmetric',    color:'#00b894', size:'128 / 256-bit key', use:'The workhorse for bulk data: TLS, disk & Wi-Fi (WPA) encryption. Fast, hardware-accelerated.'},
    {n:'RSA',          type:'Asymmetric',   color:'#0984e3', size:'2048 / 4096-bit',   use:'Classic public-key crypto for key exchange & digital signatures / certificates. Based on factoring huge numbers.'},
    {n:'ECC',          type:'Asymmetric',   color:'#a29bfe', size:'256-bit ≈ RSA-3072',use:'Elliptic curves: same security as RSA with far smaller keys → faster & mobile-friendly. The modern TLS default (ECDHE/ECDSA).'},
    {n:'Diffie–Hellman',type:'Key exchange',color:'#fdcb6e', size:'—',                 use:'Agrees a shared secret over a public channel without ever sending it — you watched this in the handshake.'},
    {n:'SHA-256',      type:'Hashing',      color:'#e84393', size:'256-bit digest',    use:'One-way fingerprints for integrity checks, certificates, password storage and blockchains.'},
  ];
  return `<div class="art"><div class="algogrid">`+algos.map(a=>`
    <div class="algocard" style="border-left-color:${a.color}">
      <div class="an" style="color:${a.color}">${a.n}</div>
      <div class="at" style="background:${a.color}">${a.type}</div>
      <div class="asz mono">${a.size}</div>
      <div class="au">${a.use}</div>
    </div>`).join('')+`</div></div>`;
}

/* ----- BGP: how routers learn the way ----- */
const AS_NODES=[
  {icon:'🏠',nm:'Your ISP', sub:'AS9498',  gl:'#00b894aa'},
  {icon:'🌐',nm:'Backbone', sub:'AS3356',  gl:'#0984e3aa'},
  {icon:'🔷',nm:'Google',   sub:'AS15169', gl:'#e84393aa'},
];
function rBgpProblem(){
  const sample=[9498,3356,15169,7018,2914,6939,13335,32934,701,174,16509,8075];
  const icons=['🏢','🌐','🏫','🔷','📡','🏬','💼','🛰️'];
  let chips=''; sample.forEach((n,i)=> chips+=`<div class="aschip"><span class="ai">${icons[i%icons.length]}</span>AS${n}<div class="an">network</div></div>`);
  return `<div class="art" style="gap:18px"><div class="ascloud">${chips}</div>
    <div class="bgp-card">The internet isn’t one network — it’s <b>~75,000 independent networks</b> called <b>Autonomous Systems (AS)</b>, each run by a different ISP, company or university. There’s <b>no central map</b>. So how does your ISP know the way to Google? <b>BGP</b> — the Border Gateway Protocol — is how these networks tell each other who they can reach.</div></div>`;
}
function rBgpAS(){
  return `<div class="art" style="gap:24px">${chainHtml(AS_NODES,-1,-1,'fwd','','')}
    <div class="bgp-card">Every network gets a unique <b>AS Number (ASN)</b>. Your ISP might be <b>AS9498</b>, a Tier-1 backbone carrier <b>AS3356</b>, and Google <b>AS15169</b>. BGP is the language these networks speak at their <b>borders</b> to exchange routes.</div></div>`;
}
function rBgpAnnounce(){
  return `<div class="art" style="gap:22px">${chainHtml(AS_NODES,2,1,'back','📢 I own 142.250.0.0/15','ans')}
    <div class="bgp-card">It starts at the source. <b>Google (AS15169)</b> announces to its neighbours: <span class="mono">“the block <b>142.250.0.0/15</b> is reachable through me.”</span> A <b>prefix</b> is simply a range of IP addresses.</div></div>`;
}
function rBgpPath(){
  return `<div class="art" style="gap:20px">${chainHtml(AS_NODES,0,0,'back','📢 reach 142.250.0.0/15 via me','ans')}
    <div class="aspath">AS-PATH:<span class="asn">9498</span><span class="arrow">→</span><span class="asn">3356</span><span class="arrow">→</span><span class="asn">15169</span></div>
    <div class="bgp-card">Each neighbour relays the announcement and <b>prepends its own ASN</b>, recording the trail. Your ISP now knows the full <b>AS-PATH</b> to Google: <b>9498 → 3356 → 15169</b>. That path is also a loop check — an AS that spots itself already in the path drops the route.</div></div>`;
}
function rBgpBest(){
  return `<div class="art" style="gap:18px"><div class="routecmp">
      <div class="routerow win"><span class="tag">CHOSEN</span><div class="aspath" style="font-size:14px;padding:6px 10px"><span class="asn">9498</span>→<span class="asn">3356</span>→<span class="asn">15169</span></div><span style="color:#55efc4;font-size:12px">shortest · 3 hops</span></div>
      <div class="routerow lose"><span class="tag">IGNORED</span><div class="aspath" style="font-size:14px;padding:6px 10px"><span class="asn">9498</span>→<span class="asn">701</span>→<span class="asn">174</span>→<span class="asn">15169</span></div><span style="font-size:12px">longer · 4 hops</span></div>
    </div>
    <div class="bgp-card">A router often hears <b>several paths</b> to the same prefix. BGP picks the <b>best</b> — usually the <b>shortest AS-PATH</b>, but also weighing business <b>policy</b> (cheaper peering over paid transit, local preference). The winner goes into the routing table.</div></div>`;
}
function rBgpForward(){
  return `<div class="art" style="gap:22px">${chainHtml(AS_NODES,2,1,'fwd','📦 → 142.250.190.78','')}
    <div class="bgp-card">Now your packet for <b class="mono">142.250.190.78</b> arrives. Each router matches the <b>longest prefix</b> in its table and forwards to the next AS on the chosen path — <b>AS9498 → AS3356 → AS15169</b> — until it reaches Google. <b>This is exactly the hop-by-hop journey you’re about to watch.</b></div></div>`;
}
function rBgpTrust(){
  return `<div class="art" style="gap:18px"><div class="routecmp">
      <div class="routerow win"><span class="tag">LEGIT</span><span>🔷 Google <b>AS15169</b> announces <span class="mono">142.250.0.0/15</span></span></div>
      <div class="routerow" style="border-color:#ff7675"><span class="tag" style="background:#ff7675;color:#2a0d0d">ROGUE</span><span>😈 Another AS wrongly announces the <i>same</i> block — a <b style="color:#ff7675">BGP hijack</b>, and traffic gets diverted</span></div>
    </div>
    <div class="bgp-card">BGP largely runs on <b>trust</b> — announcements are believed by default. A mistaken or malicious one (a <b>route leak / hijack</b>) can silently misroute global traffic. Defences like <b>route filtering</b> and <b>RPKI</b> — cryptographically signing who owns each prefix — now help routers reject bogus routes.</div></div>`;
}

/* ----- system design: Load Balancer ----- */

/* ----- home-screen metadata: one card per chapter ----- */
const CHMETA={
  '1 · The Click':            {icon:'🖱️', color:'#4c6ef5', blurb:'You type google.com and hit Enter — the journey begins.'},
  '2 · Finding Google':       {icon:'🔎', color:'#0984e3', blurb:'DNS turns the name into an IP through a chain of servers.'},
  '3 · The Connection':       {icon:'🤝', color:'#00b894', blurb:'TCP’s 3-way handshake opens a reliable channel.'},
  '4 · The Secret Handshake': {icon:'🔐', color:'#6c5ce7', blurb:'TLS agrees a shared secret — Diffie–Hellman & certificates.'},
  '5 · Encryption, Explained':{icon:'🧩', color:'#a29bfe', blurb:'Why we encrypt; symmetric vs asymmetric, hashing & key algorithms.'},
  '6 · Packaging It':         {icon:'📦', color:'#e84393', blurb:'Wrap the request layer by layer — the OSI encapsulation onion.'},
  '7 · A Closer Look':        {icon:'🔬', color:'#e17055', blurb:'TCP vs UDP, MTU & packets, IP addresses, IPv4/6, public vs private.'},
  '8 · Leaving Home':         {icon:'🏠', color:'#fdcb6e', blurb:'ARP finds the router, a Wi-Fi hop, then NAT rewrites your address.'},
  '9 · How the Signal Travels':{icon:'💡',color:'#74b9ff', blurb:'Optical fibre & light pulses, bandwidth, and 2G → 5G.'},
  '10 · BGP — Mapping the Internet':{icon:'🗺️',color:'#ffeaa7', blurb:'How ~75,000 networks tell each other the way — Autonomous Systems, announcements & AS-PATHs.'},
  '11 · Across the Internet':  {icon:'🌐', color:'#00cec9', blurb:'Router hops to Google’s data center, TTL ticking down.'},
  '12 · Arrival & Reply':      {icon:'📨', color:'#55efc4', blurb:'Google unwraps, builds the page, and the reply comes back.'},
  '✓ Done':                    {icon:'✅', color:'#00b894', blurb:'The recap — all of it in roughly 100 milliseconds.'},
};

/* ----- register this course with the app ----- */
App.registerCourse({
  key: 'network',
  section: 'network',
  title: 'The Journey of a Click',
  card: { icon: '🌐', color: '#0984e3', title: 'The Journey of a Click',
          blurb: 'Follow one request across the internet — DNS, TLS, encryption, packaging, routing, BGP and back.' },
  beats: NET_BEATS,
  chapterMeta: CHMETA,
  scenes: {
    title: rTitle, dns: rDns, tcp: rTcp, tls: rTls,
    encwhy: rEncWhy, enctypes: rEncTypes, hashing: rHashing, algos: rAlgos,
    build: rBuild, tcpudp: rTcpUdp, mtu: rMtu, ipaddr: rIpAddr, ipversion: rIpVersion, iptype: rIpType,
    fiber: rFiber, bandwidth: rBandwidth, cellular: rCellular,
    bgpProblem: rBgpProblem, bgpAS: rBgpAS, bgpAnnounce: rBgpAnnounce, bgpPath: rBgpPath,
    bgpBest: rBgpBest, bgpForward: rBgpForward, bgpTrust: rBgpTrust,
    lan: rLan, wan: rWan, arrival: rArrival, done: rDone,
  },
});
