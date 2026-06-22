/* =====================================================================
   COURSE · Reliable, Scalable & Maintainable Applications  (system-design)
   The foundational mindset for data-intensive systems: the three pillars
   of Reliability, Scalability and Maintainability — what they mean, how
   they break, and how to reason about them.
   Grounded in Chapter 1 of "Designing Data-Intensive Applications".
   ===================================================================== */

/* ----- the story beats (the narration script) ----- */
const RSM_BEATS = [
  {ch:'RSM · Foundations', scene:'rsmDataIntensive', ttl:'It’s not the CPU — it’s the data',
   txt:'Most apps today are <b>data-intensive</b>, not compute-intensive: raw CPU is rarely the limit. The hard problems are the <b>amount</b> of data, the <b>complexity</b> of it, and the <b>speed</b> at which it changes. <span class="hl">Data is the bottleneck, not arithmetic.</span>'},
  {ch:'RSM · Foundations', scene:'rsmBlocks', ttl:'The building blocks you reach for',
   txt:'Nobody writes a storage engine from scratch — we assemble apps from standard <b>data systems</b>, each a battle-tested abstraction. You’ll meet the same five over and over. The trick is knowing <i>which</i> one fits the job.'},
  {ch:'RSM · Foundations', scene:'rsmDesigner', ttl:'You’re now a data system designer',
   txt:'The categories blur — Redis is a store <i>and</i> a queue; Kafka is a queue with database-grade durability. No single tool meets every need, so you <b>stitch several together</b> behind one API. The moment you guarantee “the cache stays in sync,” you’ve built a new data system — and become its designer.'},
  {ch:'RSM · Foundations', scene:'rsmThreePillars', ttl:'Three questions every system must answer',
   txt:'Many forces shape a design — skills, deadlines, regulations — but three concerns matter in almost every system. Keep asking: is it <b>Reliable</b>, is it <b>Scalable</b>, is it <b>Maintainable</b>? The rest of the chapter unpacks each one.'},

  {ch:'RSM · Reliability', scene:'rsmReliability', ttl:'Working correctly, even when things go wrong',
   txt:'<b>Reliability</b> means roughly “continuing to work correctly even when things go wrong.” The app does what users expect, tolerates their mistakes, performs well enough under real load, and blocks abuse. Things <i>will</i> go wrong — the question is whether the system copes.'},
  {ch:'RSM · Reliability', scene:'rsmFaultFailure', ttl:'A fault is not a failure',
   txt:'A <b>fault</b> is one component drifting from its spec; a <b>failure</b> is the whole system stopping service to users. You can’t drive faults to zero (a black hole eating Earth needs hosting in space 🕳️), so build <b>fault-tolerance</b> that stops faults from becoming failures — and like <b>Chaos Monkey</b>, trigger faults on purpose to prove it works.'},
  {ch:'RSM · Reliability', scene:'rsmHardware', ttl:'Hardware breaks — constantly',
   txt:'Disks die, RAM rots, power blinks, someone trips a cable. With a 10–50 year <b>MTTF</b> per disk, a 10,000-disk cluster loses <b>~one a day</b>. The old fix was <b>hardware redundancy</b> (RAID, dual PSUs); the modern move is <b>software fault-tolerance</b> so a whole machine can vanish without downtime.'},
  {ch:'RSM · Reliability', scene:'rsmSoftware', ttl:'The bug that takes down everything at once',
   txt:'Hardware faults are random and independent. <b>Software faults are systematic</b> — and <i>correlated</i>, so they topple many nodes together (remember the 2012 leap-second kernel bug that hung apps worldwide?). No quick fix: test thoroughly, isolate processes, let things crash &amp; restart, and <b>measure constantly</b>.'},
  {ch:'RSM · Reliability', scene:'rsmHuman', ttl:'Humans are the leading cause of outages',
   txt:'Studies blame operator <b>configuration errors</b> for most outages — hardware causes just 10–25%. Make systems reliable <i>in spite of</i> people: design interfaces that make the right thing easy, give real <b>sandboxes</b>, test at every level, enable fast <b>rollback</b>, and watch everything with <b>telemetry</b>.'},

  {ch:'RSM · Scalability', scene:'rsmScalability', ttl:'Will it still work at 10× the load?',
   txt:'<b>Scalability</b> is a system’s ability to cope with <b>increased load</b>. It’s not a label — “X is scalable” is meaningless. Ask instead: <i>“if load grows this way, what are our options?”</i> First you must describe the load, then the performance, then the plan.'},
  {ch:'RSM · Scalability', scene:'rsmLoad', ttl:'First, describe the load',
   txt:'You can’t reason about growth until you can <b>name the load</b> with a few numbers — <b>load parameters</b>. Requests/sec, read:write ratio, active users, cache hit rate… the right one depends on your architecture. And sometimes it’s not the average that hurts you, but a few <b>extreme cases</b>.'},
  {ch:'RSM · Scalability', scene:'rsmTwitter', ttl:'Twitter’s fan-out problem',
   txt:'Twitter’s pain wasn’t 12k tweets/sec — it was <b>fan-out</b> against 300k timeline reads/sec. <b>Approach 1</b>: merge tweets at read time (cheap writes, expensive reads). <b>Approach 2</b>: fan a tweet into every follower’s timeline cache at write time (cheap reads, brutal writes — 30M+ for a celebrity). The answer is a <b>hybrid</b>.'},
  {ch:'RSM · Scalability', scene:'rsmPerformance', ttl:'Throughput vs response time',
   txt:'Once load is described, measure performance. Batch systems care about <b>throughput</b> (records/sec); online systems care about <b>response time</b> — what the client actually waits. Mind the distinction: <b>latency</b> is time spent waiting to be served; <b>response time</b> = service time + queueing + network.'},
  {ch:'RSM · Scalability', scene:'rsmPercentiles', ttl:'Forget the average — watch the tail',
   txt:'Response time is a <b>distribution</b>, not a number, so the <b>mean lies</b>. Use <b>percentiles</b>: p50 is typical, but <b>tail latencies</b> (p99, p999) hit your most valuable users. Amazon found <b>100 ms slower → 1% fewer sales</b>, and one slow backend call slows the whole request (<b>tail amplification</b>). SLOs/SLAs are written in percentiles.'},
  {ch:'RSM · Scalability', scene:'rsmCoping', ttl:'Scale up vs scale out',
   txt:'Two directions: <b>scale up</b> (a bigger machine) or <b>scale out</b> (spread across many — a <b>shared-nothing</b> design). Real systems mix both. Some are <b>elastic</b> (auto-add capacity), others scaled by hand. Beware: there’s <b>no magic scaling sauce</b> — large-scale architecture is specific to your app’s load.'},

  {ch:'RSM · Maintainability', scene:'rsmMaintainability', ttl:'Most of the cost comes later',
   txt:'The majority of software cost isn’t the first version — it’s the <b>ongoing maintenance</b>: fixing bugs, adapting, repaying tech debt. Design to avoid creating tomorrow’s legacy system, around three principles: <b>Operability</b>, <b>Simplicity</b>, and <b>Evolvability</b>.'},
  {ch:'RSM · Maintainability', scene:'rsmOperability', ttl:'Make life easy for operations',
   txt:'“Good operations can work around bad software, but good software can’t run on bad operations.” <b>Operability</b> means giving the ops team <b>visibility</b> (monitoring), automation hooks, no dependence on a single machine, predictable behavior, and good defaults you can override. Make the routine tasks easy.'},
  {ch:'RSM · Maintainability', scene:'rsmSimplicity', ttl:'Fight the big ball of mud',
   txt:'As projects grow they rot into a <b>big ball of mud</b> — tangled dependencies, inconsistent naming, hacks on hacks. The enemy is <b>accidental complexity</b>: pain from the implementation, not the problem itself. The best tool to remove it is a good <b>abstraction</b> (high-level languages, SQL) that hides detail behind a clean façade.'},
  {ch:'RSM · Maintainability', scene:'rsmEvolvability', ttl:'Make change easy',
   txt:'Requirements <b>always</b> change — new features, platforms, regulations. <b>Evolvability</b> is how easily you can adapt the system, and it’s tightly bound to simplicity: simple systems are easy to change. Agile tools like TDD and refactoring help in the small; this idea scales the same instinct to the <b>whole data system</b>.'},

  {ch:'RSM · Wrap-up', scene:'rsmProsCons', ttl:'Is it worth building for RSM?',
   txt:'Reliability, scalability and maintainability pay off enormously — but they aren’t free. You may deliberately <b>cut corners</b> (a throwaway prototype, a razor-thin margin), and that can be the right call. The rule: be <b>conscious</b> of the trade, never accidental.'},
  {ch:'RSM · Wrap-up', scene:'rsmGotcha', ttl:'Don’t scale for a load you don’t have yet',
   txt:'The classic trap: an architecture is built on <b>assumptions about load</b>. Guess wrong and the scaling effort is wasted — or counterproductive. In an early-stage product, the ability to <b>iterate quickly on features</b> usually beats scaling for some hypothetical future. <span class="hl">Solve the load you have.</span>'},
];

/* ----- scene renderers (the visuals) — return HTML wrapped in .art ----- */
function rRsmDataIntensive(){
  return `<div class="art" style="gap:16px">
    ${chainHtml([
      {icon:'⚙️',nm:'CPU',sub:'rarely the limit'},
      {icon:'📦',nm:'Your app',sub:'drowning in data',gl:'#00cec9aa'},
      {icon:'🌊',nm:'Data',sub:'volume · complexity · change',gl:'#0984e3aa'}
    ], 2, 1, 'fwd', 'too much, too complex, too fast', '')}
    <div class="farm-cap">For most modern apps the limiting factor isn’t <b>compute</b> — a CPU can crunch numbers all day. The pressure comes from the <b style="color:#74b9ff">sheer amount of data</b>, how <b>tangled</b> it is, and how <b>fast</b> it keeps changing. That’s what <b>data-intensive</b> means.</div>
  </div>`;
}
function rRsmBlocks(){
  const blocks=[
    {n:'Databases',         color:'#6c5ce7', use:'Store data so you (or another app) can find it again later.'},
    {n:'Caches',            color:'#fdcb6e', use:'Remember the result of an expensive operation to speed up reads.'},
    {n:'Search indexes',    color:'#00b894', use:'Let users search by keyword or filter data in flexible ways.'},
    {n:'Stream processing', color:'#0984e3', use:'Send a message to another process, handled asynchronously.'},
    {n:'Batch processing',  color:'#e84393', use:'Periodically crunch a large pile of accumulated data.'},
  ];
  return `<div class="art"><div class="algogrid">`+blocks.map(b=>`
    <div class="algocard" style="border-left-color:${b.color}">
      <div class="an" style="color:${b.color}">${b.n}</div>
      <div class="at" style="background:${b.color}">building block</div>
      <div class="au">${b.use}</div>
    </div>`).join('')+`</div></div>`;
}
function rRsmDesigner(){
  return `<div class="art" style="gap:16px">
    ${chainHtml([
      {icon:'👤',nm:'Clients',sub:'see one API'},
      {icon:'🧩',nm:'Your service',sub:'composite system',gl:'#00cec9aa'},
      {icon:'🗄️',nm:'Database',sub:'source of truth'},
    ], 1, 0, 'back', 'hides the moving parts', 'ans')}
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:880px">
      ${infoCard('🌀','Categories blur','Redis is a store <i>and</i> a queue; Kafka is a queue with database-grade durability.')}
      ${infoCard('🧵','Stitched together','One tool can’t do it all, so app code keeps caches &amp; indexes in sync with the DB.')}
      ${infoCard('🛡️','You make guarantees','“The cache is invalidated on write” is a promise — now you own a new data system.')}
    </div>
  </div>`;
}
function rRsmThreePillars(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:880px">
      ${infoCard('🛡️','Reliability','Keep working correctly even in the face of faults, errors and human mistakes.')}
      ${infoCard('📈','Scalability','As data, traffic or complexity grow, have reasonable ways to cope.')}
      ${infoCard('🔧','Maintainability','Let many people work on it productively over its whole lifetime.')}
    </div>
    <div class="farm-cap">These three words get thrown around loosely. The rest of this course makes each one <b>concrete</b> — what it means, how it fails, and how to think about it.</div>
  </div>`;
}

/* ----- Reliability ----- */
function rRsmReliability(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('🎯','Does the job','Performs the function the user expected.')}
      ${infoCard('🤲','Tolerant of users','Copes with mistakes and unexpected use.')}
      ${infoCard('⚡','Good enough','Performs under the expected load &amp; data volume.')}
      ${infoCard('🔒','Safe','Prevents unauthorized access and abuse.')}
    </div>
    <div class="farm-cap">Put together, “working correctly” gives us a working definition of <b style="color:#00cec9">reliability</b>: <span class="hl">continuing to work correctly, even when things go wrong</span>. Note we don’t say <i>if</i> things go wrong — we say <i>when</i>.</div>
  </div>`;
}
function rRsmFaultFailure(){
  return `<div class="art" style="gap:16px">${compareHtml(
    {color:'#fdcb6e',icon:'🔩',title:'Fault',sub:'a component drifts from spec',
     rows:[['🧩','One part misbehaves (a disk, a process)'],['🔁','Can’t be reduced to zero'],['🛡️','Design tolerance so it stays contained'],['🐒','Chaos Monkey triggers them on purpose']],
     foot:'Inevitable — plan for it.'},
    {color:'#ff7675',icon:'💥',title:'Failure',sub:'the whole system stops serving',
     rows:[['🚫','Users no longer get the service'],['📉','What fault-tolerance is meant to prevent'],['🕳️','Can’t tolerate <i>every</i> fault (a black hole? host in space)'],['🎯','Goal: faults must not become failures']],
     foot:'Avoidable — if faults stay contained.'}
  )}</div>`;
}
function rRsmHardware(){
  return `<div class="art" style="gap:16px">
    ${chainHtml([
      {icon:'💽',nm:'10,000 disks',sub:'MTTF 10–50 yrs each'},
      {icon:'📅',nm:'Every day',sub:'~1 disk dies',gl:'#ff7675aa'},
    ], 1, 0, 'fwd', 'something is always broken', '')}
    <div class="farm-cap">At scale, hardware faults are a <b>daily certainty</b>, not a rare event. The first response is <b>redundancy</b> — RAID, dual power supplies, backup generators. But as fleets grow, the modern answer is <b style="color:#74b9ff">software fault-tolerance</b>: tolerate losing a whole machine, so you can patch and reboot <b>one node at a time</b> with no downtime.</div>
  </div>`;
}
function rRsmSoftware(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('🐛','Bad-input crash','One input that crashes every server instance at once (e.g. the 2012 leap-second bug).')}
      ${infoCard('🐏','Runaway process','Eats a shared resource — CPU, memory, disk or bandwidth.')}
      ${infoCard('🐌','Slow dependency','A service you rely on degrades, hangs, or returns corrupt data.')}
      ${infoCard('🌊','Cascading failure','A small fault trips the next component, which trips the next…')}
    </div>
    <div class="farm-cap">Unlike random hardware faults, software faults are <b style="color:#ff7675">systematic and correlated</b> — they take down many nodes together. There’s no quick fix: thorough testing, process isolation, crash-and-restart, and <b>measuring/monitoring in production</b> so the system can even check its own guarantees.</div>
  </div>`;
}
function rRsmHuman(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:920px">
      ${infoCard('🧱','Minimize error','Design abstractions &amp; APIs that make the right thing easy, the wrong thing hard.')}
      ${infoCard('🧪','Decouple risk','Give full non-prod sandboxes to explore with real data, safely.')}
      ${infoCard('✅','Test all levels','Unit → integration → manual; automation covers the rare corner cases.')}
      ${infoCard('↩️','Fast recovery','Quick config rollback, gradual rollouts, tools to recompute data.')}
      ${infoCard('📡','Telemetry','Detailed monitoring of metrics &amp; error rates — early warning + diagnosis.')}
    </div>
    <div class="farm-cap">One study found operator <b style="color:#ff7675">configuration errors</b> were the leading cause of outages — hardware faults played a role in only <b>10–25%</b>. We can’t make people perfect, so we design the system to be reliable <i>despite</i> them.</div>
  </div>`;
}

/* ----- Scalability ----- */
function rRsmScalability(){
  return `<div class="art" style="gap:16px">
    ${chainHtml([
      {icon:'👥',nm:'10k users',sub:'today'},
      {icon:'🚀',nm:'10× growth',sub:'tomorrow?',gl:'#00cec9aa'},
      {icon:'🖥️',nm:'Same system',sub:'will it cope?'},
    ], 1, 0, 'fwd', '“what are our options if load grows?”', '')}
    <div class="farm-cap"><b>Scalability</b> is the ability to cope with <b>increased load</b> — but it’s not a one-dimensional badge. Saying “X scales” is meaningless. The real questions: <i>“if the system grows this particular way, how do we cope?”</i> and <i>“how do we add resources to handle it?”</i></div>
  </div>`;
}
function rRsmLoad(){
  const params=[
    {n:'Requests / sec',    color:'#0984e3', use:'Throughput hitting a web server — the everyday workhorse metric.'},
    {n:'Read : write ratio',color:'#00b894', use:'Is your database mostly answering reads, or absorbing writes?'},
    {n:'Active users',       color:'#fdcb6e', use:'Simultaneously online — e.g. people in a chat room right now.'},
    {n:'Cache hit rate',     color:'#e17055', use:'How often the fast path wins before you touch the slow backend.'},
  ];
  return `<div class="art" style="gap:14px"><div class="algogrid">`+params.map(p=>`
    <div class="algocard" style="border-left-color:${p.color}">
      <div class="an" style="color:${p.color}">${p.n}</div>
      <div class="at" style="background:${p.color}">load parameter</div>
      <div class="au">${p.use}</div>
    </div>`).join('')+`</div>
    <div class="farm-cap">Pick the few numbers — <b>load parameters</b> — that actually describe <i>your</i> system. The best choice depends on the architecture, and sometimes the bottleneck is a handful of <b style="color:#ff7675">extreme cases</b>, not the average.</div>
  </div>`;
}
function rRsmTwitter(){
  return `<div class="art" style="gap:16px">${compareHtml(
    {color:'#0984e3',icon:'1️⃣',title:'Fan-out on read',sub:'merge timelines at read time',
     rows:[['✍️','Post = one insert into a global table'],['📖','Read = join follows + tweets, sort by time'],['🐢','300k reads/sec made this too slow'],['💡','Cheap writes, expensive reads']],
     foot:'Simple, but reads don’t keep up.'},
    {color:'#00b894',icon:'2️⃣',title:'Fan-out on write',sub:'precompute each home timeline',
     rows:[['📬','Post = insert into every follower’s cache'],['⚡','Read = just fetch your ready-made timeline'],['💣','A celebrity tweet = 30M+ writes'],['💡','Cheap reads, brutal writes']],
     foot:'Fast reads, but write amplification.'}
  )}
    <div class="farm-cap">Twitter started with approach 1, switched to approach 2 (reads outnumber writes ~100:1, so do the work at write time). The final twist: a <b>hybrid</b> — fan out normal users on write, but fetch <b style="color:#fdcb6e">celebrities</b> at read time and merge. The <b>follower distribution</b> is the key load parameter.</div>
  </div>`;
}
function rRsmPerformance(){
  return `<div class="art" style="gap:16px">${compareHtml(
    {color:'#a29bfe',icon:'🏭',title:'Throughput',sub:'matters for batch (Hadoop)',
     rows:[['📊','Records processed per second'],['⏱️','Or total time to run a job over a dataset'],['📦','“How much can we get through?”']],
     foot:'The batch-processing yardstick.'},
    {color:'#00b894',icon:'⏳',title:'Response time',sub:'matters for online systems',
     rows:[['👤','Time between request sent and response received'],['🌐','= service time + queueing + network delays'],['🎯','“How long does the user wait?”']],
     foot:'The online-system yardstick.'}
  )}
    <div class="farm-cap">Don’t conflate two words: <b>response time</b> is what the client sees (service + queueing + network); <b>latency</b> is just the duration a request sits <i>waiting</i> to be handled. Same request, repeated, gives different times — so think of it as a <b>distribution</b>.</div>
  </div>`;
}
function rRsmPercentiles(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('🅿️50','Median (p50)','Half of requests are faster, half slower — your <b>typical</b> wait.')}
      ${infoCard('🅿️99','p99 / p999','Tail latencies — the slowest 1-in-100 / 1-in-1000 requests.')}
      ${infoCard('💰','Valuable users','The slowest requests often belong to your <b>biggest</b> accounts.')}
      ${infoCard('📜','SLO / SLA','Contracts written in percentiles: “p99 &lt; 1 s, up 99.9%.”')}
    </div>
    <div class="farm-cap">The <b style="color:#ff7675">mean lies</b> — it hides how many users actually felt the delay. Watch <b>percentiles</b>, especially the <b>tail</b>: Amazon saw <span class="hl">100 ms slower → 1% fewer sales</span>. And if one request needs many backend calls, a single slow one drags the whole thing down — <b>tail latency amplification</b>.</div>
  </div>`;
}
function rRsmCoping(){
  return `<div class="art" style="gap:16px">${compareHtml(
    {color:'#fdcb6e',icon:'⬆️',title:'Scale up (vertical)',sub:'a bigger, stronger machine',
     rows:[['🧱','One node — simpler to operate'],['🧠','Stateful data stays easy on a single box'],['💸','High-end machines get expensive fast'],['📈','There’s a hard ceiling']],
     foot:'Simple — until the machine isn’t big enough.'},
    {color:'#00b894',icon:'↔️',title:'Scale out (horizontal)',sub:'many smaller machines',
     rows:[['🌐','Spread load — a <b>shared-nothing</b> design'],['♾️','Stateless services distribute easily'],['🧩','Distributing <b>stateful</b> data adds real complexity'],['🤖','Can be <b>elastic</b> (auto) or scaled by hand']],
     foot:'Necessary at scale — but harder for state.'}
  )}
    <div class="farm-cap">Good architectures <b>mix both</b>. And there’s <b style="color:#ff7675">no magic scaling sauce</b>: a system for 100k tiny requests/sec looks nothing like one for 3 huge requests/min, even at the same throughput. Architecture is built around <b>assumptions about your load</b>.</div>
  </div>`;
}

/* ----- Maintainability ----- */
function rRsmMaintainability(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:880px">
      ${infoCard('🛟','Operability','Make it easy for ops to keep the system running smoothly.')}
      ${infoCard('🧼','Simplicity','Remove complexity so new engineers can understand it.')}
      ${infoCard('🌱','Evolvability','Make it easy to change for unanticipated future needs.')}
    </div>
    <div class="farm-cap">Most of software’s cost is <b style="color:#00cec9">not the first build</b> — it’s the years of bug-fixing, adapting, and feature-adding that follow. Nobody enjoys maintaining a legacy mess, so we design against creating one, guided by three principles.</div>
  </div>`;
}
function rRsmOperability(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:920px">
      ${infoCard('🔭','Visibility','Good monitoring into runtime behavior &amp; internals.')}
      ${infoCard('🤖','Automatable','Solid support for automation and standard tooling.')}
      ${infoCard('🖧','No single-machine ties','Take a node down for maintenance, system keeps running.')}
      ${infoCard('📘','Clear model','“If I do X, Y happens” — plus good defaults you can override.')}
      ${infoCard('🔮','Predictable','Minimize surprises; self-heal, but allow manual control.')}
    </div>
    <div class="farm-cap"><span class="hl">“Good operations can work around bad software, but good software can’t run on bad operations.”</span> Good <b style="color:#00cec9">operability</b> makes routine tasks easy, freeing the ops team for the high-value work.</div>
  </div>`;
}
function rRsmSimplicity(){
  return `<div class="art" style="gap:16px">${compareHtml(
    {color:'#ff7675',icon:'🫠',title:'Big ball of mud',sub:'complexity that slows everyone',
     rows:[['🕸️','Tangled dependencies, tight coupling'],['🔤','Inconsistent naming &amp; terminology'],['🩹','Hacks &amp; special-cases on top of hacks'],['🐞','Hidden assumptions → more bugs on change']],
     foot:'Accidental complexity — from the implementation, not the problem.'},
    {color:'#00b894',icon:'🪞',title:'Good abstraction',sub:'the antidote',
     rows:[['🎭','Hides detail behind a clean façade'],['♻️','Reusable across many applications'],['🔤','SQL hides on-disk structures &amp; concurrency'],['🏆','Improvements benefit every user of it']],
     foot:'Hard to find — but the best tool for cutting complexity.'}
  )}</div>`;
}
function rRsmEvolvability(){
  return `<div class="art" style="gap:16px">
    ${chainHtml([
      {icon:'🧼',nm:'Simplicity',sub:'easy to understand'},
      {icon:'➡️',nm:'leads to',sub:''},
      {icon:'🌱',nm:'Evolvability',sub:'easy to change',gl:'#00cec9aa'},
    ], 2, 1, 'fwd', 'simple systems bend, not break', 'ans')}
    <div class="farm-cap">Requirements never stand still — new features, platforms, laws, growth. <b style="color:#00cec9">Evolvability</b> is how easily a data system adapts, and it’s bound tightly to <b>simplicity</b> and good <b>abstractions</b>. Agile’s TDD &amp; refactoring tackle this in the small; here we apply the same instinct to a whole system of services. <i>How would you “refactor” Twitter from approach 1 to approach 2?</i></div>
  </div>`;
}

/* ----- Wrap-up: trade-offs (required) + gotcha ----- */
function rRsmProsCons(){
  return `<div class="art">${compareHtml(
    {color:'#00b894',icon:'✅',title:'Investing in R · S · M',sub:'why it pays off',
     rows:[['🛡️','Survives faults — no costly outages'],['📈','Copes as load grows by orders of magnitude'],['🔧','Cheaper to operate &amp; change over years'],['😊','Earns user trust (their photos, their money)'],['🧭','Turns vague goals into concrete decisions']],
     foot:'The backbone of any system meant to last.'},
    {color:'#ff7675',icon:'⚠️',title:'The costs to weigh',sub:'nothing is free',
     rows:[['🧩','Redundancy &amp; abstraction add complexity'],['💸','Engineering &amp; infra effort up front'],['🐢','Can slow early iteration if overdone'],['🎯','Wrong load assumptions = wasted work'],['🤔','Sometimes corners are worth cutting']],
     foot:'Just be <b>conscious</b> when you cut them.'}
  )}</div>`;
}
function rRsmGotcha(){
  return `<div class="art" style="gap:16px">
    ${chainHtml([
      {icon:'🌱',nm:'Early-stage app',sub:'unproven product'},
      {icon:'🏗️',nm:'Build for 10M users?',sub:'load you don’t have',gl:'#ff7675aa'},
      {icon:'🗑️',nm:'Often wasted',sub:'or counterproductive'},
    ], 1, 0, 'fwd', 'scaling for a guess', '')}
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('🎲','Built on assumptions','Scalable architectures assume which ops are common. Guess wrong and the effort backfires.')}
      ${infoCard('🏃','Iterate first','Early on, shipping &amp; learning beats scaling for a hypothetical future.')}
      ${infoCard('🧱','Familiar parts','Even bespoke scale is built from general-purpose blocks in familiar patterns.')}
    </div>
    <div class="farm-cap">The twist teams learn the hard way: <b style="color:#ff7675">don’t scale for a load you don’t have yet</b>. Reliability, scalability and maintainability are goals to <i>reason</i> about continuously — not boxes to over-engineer on day one. <span class="hl">Solve the load you have.</span></div>
  </div>`;
}

/* ----- register this building block with the app ----- */
App.registerCourse({
  key: 'rsm',
  section: 'systemdesign',
  card: {
    icon: '🏛️', color: '#00cec9', title: 'Reliable · Scalable · Maintainable',
    blurb: 'The mindset behind every data-intensive system — faults vs failures, load parameters & tail latency, scale up vs out, and operability, simplicity & evolvability. (DDIA Ch. 1)',
  },
  beats: RSM_BEATS,
  scenes: {
    rsmDataIntensive: rRsmDataIntensive, rsmBlocks: rRsmBlocks, rsmDesigner: rRsmDesigner, rsmThreePillars: rRsmThreePillars,
    rsmReliability: rRsmReliability, rsmFaultFailure: rRsmFaultFailure, rsmHardware: rRsmHardware, rsmSoftware: rRsmSoftware, rsmHuman: rRsmHuman,
    rsmScalability: rRsmScalability, rsmLoad: rRsmLoad, rsmTwitter: rRsmTwitter, rsmPerformance: rRsmPerformance, rsmPercentiles: rRsmPercentiles, rsmCoping: rRsmCoping,
    rsmMaintainability: rRsmMaintainability, rsmOperability: rRsmOperability, rsmSimplicity: rRsmSimplicity, rsmEvolvability: rRsmEvolvability,
    rsmProsCons: rRsmProsCons, rsmGotcha: rRsmGotcha,
  },
});
