/* =====================================================================
   COURSE · Databases  (section: system-design)
   A story-first building block: why data needs a home, the data models
   (relational / document / graph), how it stores & finds data (indexes,
   storage engines), transactions (ACID), scaling (replication, sharding,
   CAP), and how to choose (SQL vs NoSQL).
   Grounded in the framing of "Designing Data-Intensive Applications".
   ===================================================================== */

/* ----- the story beats (the narration script) ----- */
const DB_BEATS = [
  {ch:'DB · Why?', scene:'dbProblem', ttl:'Where does the data live?',
   txt:'Every app is really a pile of <b>data</b> — users, posts, payments. But memory vanishes on restart, and a plain file can’t handle <b>search</b>, <b>many writers at once</b>, or a crash <i>mid-write</i>. Before we scale anything else, the data needs a safe place to live.'},
  {ch:'DB · Why?', scene:'dbSolution', ttl:'Enter the database',
   txt:'A <b>database</b> is a program whose entire job is to store and answer questions about data <b>safely</b> — like a tireless librarian who never forgets, finds anything instantly, and keeps order even under a stampede. Almost everything else in system design leans on it.'},

  {ch:'DB · Data models', scene:'dbModels', ttl:'First choice: the data model',
   txt:'The biggest early decision is how you <b>shape</b> your data — each model is a different lens on the world. Pick the one that matches how your data is connected and how you’ll read it back. These five cover almost everything you’ll meet.'},
  {ch:'DB · Data models', scene:'dbRelDoc', ttl:'Relational vs Document',
   txt:'The two you’ll choose between most. <b>Relational</b> splits data into tidy tables stitched together with <b>joins</b>; <b>Document</b> stores each thing as one self-contained <b>JSON</b> tree. It’s a trade between <b>no duplication</b> and <b>read locality</b>.'},
  {ch:'DB · Data models', scene:'dbGraph', ttl:'When relationships are the point',
   txt:'Sometimes the <b>connections</b> matter more than the records. A <b>graph</b> model makes relationships first-class, so “friends of friends in my city” is a quick walk instead of a pile of self-joins. <span class="hl">Match the model to your questions.</span>'},

  {ch:'DB · Query', scene:'dbQuery', ttl:'Ask <i>what</i>, not <i>how</i>',
   txt:'SQL is <b>declarative</b>: you describe the <i>result</i> you want and let the engine’s <b>optimizer</b> plan the fastest path. That’s why it can quietly use indexes, reorder work and parallelize — things hand-written loops can’t do for free.'},

  {ch:'DB · Storage engine', scene:'dbIndex', ttl:'The index: find without searching',
   txt:'How does a database find one row among millions without reading them all? An <b>index</b> — a sorted side-structure that lets it <b>jump</b> straight to the answer. The trade-off is fundamental: faster reads, but <b>slower writes</b> and extra storage.'},
  {ch:'DB · Storage engine', scene:'dbLsmBtree', ttl:'Under the hood: how it stores',
   txt:'Two engine families power most databases. <b>B-trees</b> update data in place — fast, predictable reads (the relational default). <b>LSM-trees</b> append everything and merge later — superb write throughput. Read-heavy or write-heavy decides the winner.'},
  {ch:'DB · Storage engine', scene:'dbOltpOlap', ttl:'Two jobs: OLTP vs OLAP',
   txt:'The same data serves two very different jobs. <b>OLTP</b> runs the live app — many tiny, fast transactions. <b>OLAP</b> answers big analytical questions over history, storing data by <b>column</b> to scan millions of rows efficiently. Cram both in one database and both suffer.'},

  {ch:'DB · Transactions', scene:'dbAcid', ttl:'Transactions: all-or-nothing',
   txt:'What stops money from vanishing mid-transfer? <b>Transactions</b> with <b>ACID</b> guarantees — a group of writes that either <b>all</b> succeed or <b>all</b> roll back, and survive a crash once committed. This is why relational databases are trusted with the important stuff.'},
  {ch:'DB · Transactions', scene:'dbIsolation', ttl:'Two writers, one last seat',
   txt:'Run transactions at the same time and they can trip over each other — like two people booking the <b>last seat</b> at once. <b>Isolation levels</b> let you dial how strictly the DB prevents these races, trading raw <b>concurrency</b> for <b>safety</b>.'},

  {ch:'DB · Scaling', scene:'dbReplication', ttl:'Copies everywhere: replication',
   txt:'To survive failures and serve more reads, the database keeps <b>copies</b>. A <b>leader</b> takes writes and streams them to <b>followers</b> that handle reads. Beware the catch — followers <b>lag</b>, so your own just-written change might not show up immediately.'},
  {ch:'DB · Scaling', scene:'dbPartition', ttl:'Too big for one box: partitioning',
   txt:'When the data — or the write load — outgrows a single machine, you <b>shard</b> it: split rows across servers by a key. Each shard owns a slice, so storage and writes scale <b>horizontally</b>. The art is picking a key that spreads load evenly and avoids <b style="color:#ff7675">hot spots</b>.'},
  {ch:'DB · Scaling', scene:'dbCap', ttl:'CAP: choose when the network breaks',
   txt:'Once data is spread across machines, networks <b>will</b> split. When they do, a distributed DB must choose: stay <b>Consistent</b> (refuse stale answers) or stay <b>Available</b> (answer anyway, reconcile later). You can’t have both <i>during</i> a partition — so choose by use case.'},

  {ch:'DB · Choosing', scene:'dbSqlNoSql', ttl:'Choosing: SQL vs NoSQL',
   txt:'Not “which is better” but “which <b>fits</b>”. Need joins, transactions and clean structure? Reach for <b>SQL</b>. Need flexible shapes and massive write scale? Reach for <b>NoSQL</b>. Big systems happily use <b>both</b> — the right tool per job (<i>polyglot persistence</i>).'},

  {ch:'DB · Gotcha', scene:'dbGotcha', ttl:'The database is the bottleneck',
   txt:'The lesson teams learn the hard way: app servers scale in minutes, but the <b>database holds state</b> — making it the <b>hardest, riskiest tier</b> to scale. Reads grow via replicas, writes via sharding, and caching shields it. <span class="hl">Respect the database.</span>'},
];

/* ----- scene renderers (the visuals) — return HTML wrapped in .art ----- */
function rDbProblem(){
  return `<div class="art" style="gap:16px">
    ${chainHtml([
      {icon:'👤',nm:'Users',sub:'thousands at once'},
      {icon:'🖥️',nm:'Your app',sub:'data in memory'},
      {icon:'📄',nm:'A plain file',sub:'lost on crash',gl:'#ff7675aa'}
    ], 2, 1, 'fwd', 'save? search? two writers?', '')}
    <div class="farm-cap">Your app is full of data — users, orders, messages — but the moment it restarts, memory is <b style="color:#ff7675">gone</b>. A plain file isn’t enough either: how do you <b>search</b> it, let <b>thousands write at once</b> without corruption, or survive a crash <i>mid-write</i>? Data needs a real home.</div>
  </div>`;
}
function rDbSolution(){
  return `<div class="art" style="gap:18px">
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:880px">
      ${infoCard('💾','Durable','Once it says “saved”, it stays saved — surviving crashes, power loss and restarts.')}
      ${infoCard('🔎','Queryable','Ask rich questions — filter, sort, join, aggregate — without scanning everything yourself.')}
      ${infoCard('👥','Concurrent','Thousands of clients read &amp; write at once, safely, without stepping on each other.')}
      ${infoCard('🛡️','Consistent','Rules &amp; transactions keep the data valid even when things go wrong.')}
    </div>
    <div class="farm-cap">A <b style="color:#a29bfe">database</b> is a program whose whole job is to <b>store, protect and answer questions about your data</b>. Think of a meticulous librarian: never forgets, finds anything fast, and keeps order even when the whole town shows up at once.</div>
  </div>`;
}
function rDbModels(){
  const models=[
    {n:'Relational',  color:'#0984e3', use:'Tables of rows &amp; columns, linked by keys and joined with SQL. The trusted default — Postgres, MySQL.'},
    {n:'Document',    color:'#00b894', use:'Self-contained JSON documents. Great when data is read together as one tree — MongoDB, DynamoDB.'},
    {n:'Key–Value',   color:'#fdcb6e', use:'A giant dictionary: get/set by key. Blazing fast and dead simple — Redis, Memcached.'},
    {n:'Wide-Column', color:'#e17055', use:'Rows with flexible, huge column sets. Built for massive write scale — Cassandra, HBase.'},
    {n:'Graph',       color:'#e84393', use:'Nodes and edges as first-class citizens. Shines on many-to-many webs — Neo4j.'},
  ];
  return `<div class="art"><div class="algogrid">`+models.map(m=>`
    <div class="algocard" style="border-left-color:${m.color}">
      <div class="an" style="color:${m.color}">${m.n}</div>
      <div class="at" style="background:${m.color}">data model</div>
      <div class="au">${m.use}</div>
    </div>`).join('')+`</div></div>`;
}
function rDbRelDoc(){
  const th=`text-align:left;padding:4px 10px;border:1px solid var(--line);font-size:11.5px;color:var(--muted);background:var(--panel2)`;
  const td=`padding:4px 10px;border:1px solid var(--line);font-size:12.5px`;
  const panel=`background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px;min-width:230px`;
  const usersTbl=`<table style="border-collapse:collapse;margin-bottom:10px">
      <tr><th style="${th}">id</th><th style="${th}">name</th></tr>
      <tr><td style="${td}">1</td><td style="${td}">Ada</td></tr></table>`;
  const ordersTbl=`<table style="border-collapse:collapse">
      <tr><th style="${th}">id</th><th style="${th}">user_id</th><th style="${th}">item</th></tr>
      <tr><td style="${td}">9</td><td style="${td}">1</td><td style="${td}">Keyboard</td></tr>
      <tr><td style="${td}">10</td><td style="${td}">1</td><td style="${td}">Mouse</td></tr></table>`;
  const doc=`<pre class="mono" style="margin:0;font-size:12.5px;line-height:1.5;color:#cdeee0">{
  "id": 1,
  "name": "Ada",
  "orders": [
    { "item": "Keyboard" },
    { "item": "Mouse" }
  ]
}</pre>`;
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;align-items:flex-start">
      <div style="${panel}">
        <div style="color:#74b9ff;font-weight:700;margin-bottom:10px">🗂️ Relational — split into tables</div>
        ${usersTbl}${ordersTbl}
        <div style="color:var(--muted);font-size:11.5px;margin-top:8px">joined on <span class="mono">user_id</span></div>
      </div>
      <div style="${panel}">
        <div style="color:#55efc4;font-weight:700;margin-bottom:10px">📄 Document — one nested tree</div>
        ${doc}
      </div>
    </div>
    <div class="farm-cap">Same data, two philosophies. <b>Relational</b> <b style="color:#74b9ff">normalizes</b> — each fact lives once, spread across tables you <b>join</b> at read time (no duplication, flexible queries). <b>Document</b> favours <b style="color:#55efc4">locality</b> — everything read together is stored together as one tree (fast reads, but data can duplicate and cross-document joins get awkward).</div>
  </div>`;
}
function rDbGraph(){
  const svg=`<svg width="470" height="195" viewBox="0 0 470 195" style="max-width:100%;height:auto">
    <line x1="112" y1="55" x2="200" y2="55" stroke="#e84393" stroke-width="2" opacity=".7"/>
    <line x1="258" y1="55" x2="346" y2="55" stroke="#e84393" stroke-width="2" opacity=".7"/>
    <line x1="230" y1="82" x2="230" y2="122" stroke="#6c5ce7" stroke-width="2" opacity=".7"/>
    <line x1="362" y1="78" x2="256" y2="132" stroke="#6c5ce7" stroke-width="2" opacity=".7"/>
    <text x="156" y="44" fill="#b2bec3" font-size="10" text-anchor="middle">FOLLOWS</text>
    <text x="302" y="44" fill="#b2bec3" font-size="10" text-anchor="middle">FOLLOWS</text>
    <text x="196" y="106" fill="#b2bec3" font-size="10" text-anchor="middle">LIVES_IN</text>
    <text x="322" y="120" fill="#b2bec3" font-size="10" text-anchor="middle">LIVES_IN</text>
    <g><circle cx="84" cy="55" r="28" fill="#241b34" stroke="#e84393" stroke-width="2"/>
       <text x="84" y="52" fill="#fff" font-size="12" text-anchor="middle">Ada</text>
       <text x="84" y="66" fill="#8a8fa3" font-size="8.5" text-anchor="middle">Person</text></g>
    <g><circle cx="230" cy="55" r="28" fill="#241b34" stroke="#e84393" stroke-width="2"/>
       <text x="230" y="52" fill="#fff" font-size="12" text-anchor="middle">Lin</text>
       <text x="230" y="66" fill="#8a8fa3" font-size="8.5" text-anchor="middle">Person</text></g>
    <g><circle cx="374" cy="55" r="28" fill="#241b34" stroke="#e84393" stroke-width="2"/>
       <text x="374" y="52" fill="#fff" font-size="12" text-anchor="middle">Mira</text>
       <text x="374" y="66" fill="#8a8fa3" font-size="8.5" text-anchor="middle">Person</text></g>
    <g><circle cx="230" cy="150" r="30" fill="#1f1b3a" stroke="#6c5ce7" stroke-width="2"/>
       <text x="230" y="147" fill="#fff" font-size="11.5" text-anchor="middle">Mumbai</text>
       <text x="230" y="161" fill="#8a8fa3" font-size="8.5" text-anchor="middle">City</text></g>
  </svg>`;
  return `<div class="art" style="gap:16px">
    ${svg}
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:860px">
      ${infoCard('🔵','Nodes','Entities — a person, a city, a product.')}
      ${infoCard('➡️','Edges','Relationships, directed and first-class — FOLLOWS, LIVES_IN, BOUGHT.')}
      ${infoCard('🕸️','Best for','Many-to-many webs: social graphs, recommendations, fraud rings — where the joins never end.')}
    </div>
    <div class="farm-cap">When the <b>connections</b> matter most — “friends of friends who live in my city” — a <b style="color:#e84393">graph database</b> treats relationships as first-class and just walks them. The same query in SQL becomes a tangle of self-joins.</div>
  </div>`;
}
function rDbQuery(){
  return `<div class="art">${compareHtml(
    {color:'#00b894',icon:'🗣️',title:'Declarative (SQL)',sub:'say WHAT you want',
     rows:[['📝','<span class="mono">SELECT name FROM users WHERE age &gt; 18</span>'],['🧠','The engine’s optimizer figures out HOW'],['⚡','Free to use indexes, reorder &amp; parallelize'],['📖','Reads almost like a sentence']],
     foot:'You ask the question; the engine plans the answer.'},
    {color:'#fdcb6e',icon:'🔧',title:'Imperative (code)',sub:'spell out HOW, step by step',
     rows:[['🔁','<span class="mono">for u in users: if u.age &gt; 18 …</span>'],['🐢','You hand-write the scan &amp; the loops'],['🚧','No optimizer — you own the performance'],['🧱','More control, but more code']],
     foot:'Powerful, but you do all the planning yourself.'}
  )}</div>`;
}
function rDbIndex(){
  return `<div class="art" style="gap:16px">${compareHtml(
    {color:'#ff7675',icon:'🐌',title:'No index — full scan',sub:'find “Zoë” among 10M rows',
     rows:[['🔍','Check every single row, top to bottom'],['🕐','O(n) — slower as data grows'],['💢','Fine for tiny tables, agony for big ones']],
     foot:'Like reading a whole book to find one name.'},
    {color:'#00b894',icon:'⚡',title:'With an index',sub:'a sorted lookup structure',
     rows:[['🗂️','Jump straight to the matching rows'],['🌳','O(log n) via a B-tree (or O(1) via a hash)'],['✍️','But every write must update it too']],
     foot:'Like a book’s index — find the page instantly.'}
  )}
    <div class="farm-cap">An <b>index</b> is the database’s secret weapon: an extra <b>sorted structure</b> that turns “scan everything” into “jump straight there”. The catch — indexes <b style="color:#fdcb6e">speed up reads but slow down writes</b> and cost storage, so you add them deliberately, not everywhere.</div>
  </div>`;
}
function rDbLsmBtree(){
  return `<div class="art">${compareHtml(
    {color:'#0984e3',icon:'🌳',title:'B-tree',sub:'in-place pages — Postgres, MySQL',
     rows:[['📄','Data lives in fixed pages, updated in place'],['🔎','Very fast, predictable reads'],['✍️','Each write may rewrite a page (+ a WAL)'],['🏆','The relational default']],
     foot:'Read-optimized; the classic choice.'},
    {color:'#00b894',icon:'🌲',title:'LSM-tree',sub:'log-structured — Cassandra, RocksDB',
     rows:[['✍️','Writes append to memory, flush as sorted files'],['🚀','Excellent write throughput'],['🧹','Background compaction merges files'],['🔎','A read may check several files']],
     foot:'Write-optimized; great for heavy ingest.'}
  )}</div>`;
}
function rDbOltpOlap(){
  return `<div class="art">${compareHtml(
    {color:'#a29bfe',icon:'🧾',title:'OLTP — transactions',sub:'the live app database',
     rows:[['⚡','Many tiny reads/writes, mostly by key'],['🧱','Row-oriented storage'],['👥','Serves users in real time'],['🔧','Postgres, MySQL, Mongo']],
     foot:'Run the business, right now.'},
    {color:'#fab1a0',icon:'📊',title:'OLAP — analytics',sub:'the data warehouse',
     rows:[['🔭','A few huge scans over millions of rows'],['📚','Column-oriented storage (great compression)'],['🌙','Reports &amp; dashboards, often batched'],['🔧','BigQuery, Redshift, Snowflake']],
     foot:'Understand the business, over time.'}
  )}</div>`;
}
function rDbAcid(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('⚛️','Atomicity','All steps happen, or none do — a transfer never debits one account without crediting the other.')}
      ${infoCard('✅','Consistency','Every transaction moves the DB from one valid state to another — constraints always hold.')}
      ${infoCard('🚧','Isolation','Concurrent transactions don’t corrupt each other — as if they ran one at a time.')}
      ${infoCard('💾','Durability','Once it says “committed”, it survives crashes — written safely to disk (WAL).')}
    </div>
    <div class="farm-cap"><b>Transfer ₹100 from A to B</b>: debit A, then credit B. If the server dies <i>between</i> the two steps, money must not vanish. <b style="color:#a29bfe">ACID</b> transactions guarantee the pair is <b>all-or-nothing</b> and permanent — the bedrock of trustworthy data.</div>
  </div>`;
}
function rDbIsolation(){
  return `<div class="art" style="gap:16px">
    ${chainHtml([
      {icon:'🙋',nm:'Alice',sub:'books 12A',gl:'#fdcb6eaa'},
      {icon:'🎟️',nm:'Last seat',sub:'only 1 left!',gl:'#a29bfeaa'},
      {icon:'🙋‍♂️',nm:'Bob',sub:'books 12A',gl:'#fdcb6eaa'}
    ], 1, -1, 'fwd', 'both at the same instant 😬', '')}
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:880px">
      ${infoCard('🟢','Read Committed','Only see committed data — but a value can still change between two reads.')}
      ${infoCard('🟡','Snapshot / Repeatable Read','Each transaction sees a consistent snapshot — blocks many anomalies.')}
      ${infoCard('🔵','Serializable','Strongest: as if transactions ran one-by-one. Safest, but costs throughput.')}
    </div>
    <div class="farm-cap">Two people grab the <b>last seat</b> at the same instant — without protection, both “succeed” and you’ve <b style="color:#ff7675">double-booked</b>. <b>Isolation levels</b> let you choose how strictly the DB prevents these races, trading <b>concurrency</b> for <b>safety</b>.</div>
  </div>`;
}
function rDbReplication(){
  const box=(icon,label,sub,color)=>`<div style="background:var(--panel);border:1px solid ${color};border-radius:14px;padding:10px 16px;text-align:center;min-width:118px">
    <div style="font-size:26px">${icon}</div><div style="font-weight:700;color:${color}">${label}</div><div style="color:var(--muted);font-size:11.5px">${sub}</div></div>`;
  return `<div class="art" style="gap:16px">
    <div style="display:flex;flex-direction:column;align-items:center;gap:9px">
      <div style="color:#74b9ff;font-size:12.5px">✍️ all writes go to one place</div>
      ${box('🗄️','Leader','accepts writes','#74b9ff')}
      <div style="color:var(--muted);font-size:11.5px">⬇ replicate (usually async) ⬇</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
        ${box('🗄️','Follower','serves reads','#00b894')}
        ${box('🗄️','Follower','serves reads','#00b894')}
      </div>
      <div style="color:#00b894;font-size:12.5px">🔎 reads spread across followers</div>
    </div>
    <div class="farm-cap"><b>Replication</b> keeps copies of the data on several machines. One <b style="color:#74b9ff">leader</b> takes all writes and streams them to <b style="color:#00b894">followers</b> that serve reads — so you survive a node dying <i>and</i> <b>scale reads</b> cheaply. The gotcha: followers <b>lag</b>, so a just-written value may not appear instantly (<i>eventual consistency</i>).</div>
  </div>`;
}
function rDbPartition(){
  const shard=(range,color)=>`<div style="background:var(--panel);border:1px solid ${color};border-top:3px solid ${color};border-radius:12px;padding:12px 18px;text-align:center;min-width:104px">
    <div style="font-size:24px">🗄️</div><div style="font-weight:700;color:${color}">Shard</div><div class="mono" style="color:var(--muted);font-size:12px">${range}</div></div>`;
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
      ${shard('A – H','#0984e3')}${shard('I – P','#00b894')}${shard('Q – Z','#e84393')}
    </div>
    <div class="farm-cap">When even one machine can’t hold all the data — or absorb all the writes — you <b>partition</b> (shard) it: split rows across servers by a <b>key</b> (by range, or by a hash of the key). Each shard owns a slice, so storage and write load scale <b>horizontally</b>. The cost: cross-shard queries, and choosing a key that won’t create <b style="color:#ff7675">hot spots</b>.</div>
  </div>`;
}
function rDbCap(){
  return `<div class="art">${compareHtml(
    {color:'#0984e3',icon:'🛡️',title:'Consistency (CP)',sub:'every read sees the latest write',
     rows:[['🎯','Nodes agree before answering'],['⛔','During a split, refuse rather than serve stale'],['🏦','Banking, inventory, bookings'],['🔧','Postgres, HBase, Spanner']],
     foot:'Correctness first — may sacrifice availability.'},
    {color:'#00b894',icon:'🟢',title:'Availability (AP)',sub:'always answer, even if slightly stale',
     rows:[['📲','Every node replies from its own copy'],['🔀','Reconciles later (eventual consistency)'],['🛒','Feeds, carts, likes, sensors'],['🔧','Cassandra, DynamoDB']],
     foot:'Uptime first — may serve stale data.'}
  )}</div>`;
}
function rDbSqlNoSql(){
  return `<div class="art">${compareHtml(
    {color:'#0984e3',icon:'🗃️',title:'SQL (relational)',sub:'structure &amp; correctness',
     rows:[['🔗','Rich queries &amp; joins (SQL)'],['🛡️','Strong ACID transactions'],['📐','A fixed schema keeps data clean'],['🧭','Mature tooling; scales up well'],['🏦','Money, orders, anything relational']],
     foot:'Default when data is relational and integrity matters.'},
    {color:'#00b894',icon:'🧩',title:'NoSQL (document / KV / wide / graph)',sub:'scale &amp; flexibility',
     rows:[['🤸','Flexible / evolving schema'],['📈','Built to scale writes horizontally'],['⚡','Huge throughput on simple access'],['🌍','Often AP — high availability'],['📊','Feeds, sessions, logs, big data']],
     foot:'Reach for it for scale, flexible shapes, or specific access patterns.'}
  )}</div>`;
}
function rDbGotcha(){
  return `<div class="art" style="gap:16px">
    ${chainHtml([
      {icon:'🟢',nm:'App tier',sub:'add servers freely'},
      {icon:'⚖️',nm:'Load balancer',sub:'easy to scale'},
      {icon:'🗄️',nm:'Database',sub:'the hard part',gl:'#ff7675aa'}
    ], 2, 1, 'fwd', 'everything piles up here', '')}
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('📖','Reads scale easily','Add replicas — but mind replication lag (read-your-own-writes bugs).')}
      ${infoCard('✍️','Writes are hard','A single leader is a ceiling; sharding adds real complexity.')}
      ${infoCard('🧠','It’s stateful','Unlike app servers, you can’t just kill &amp; restart it — the data must be protected.')}
    </div>
    <div class="farm-cap">The twist every team learns: the <b>app tier scales in minutes</b>, but the <b style="color:#ff7675">database is the bottleneck</b>. Because it holds state, it’s the hardest, riskiest tier to scale — which is exactly why caching, replicas and careful sharding exist. <i>Respect the database.</i></div>
  </div>`;
}

/* ----- register this building block with the app ----- */
App.registerCourse({
  key: 'database',
  section: 'systemdesign',
  card: {
    icon: '🗄️', color: '#6c5ce7', title: 'Databases',
    blurb: 'Where data lives — relational vs document vs graph, indexes & storage engines, ACID transactions, replication, sharding, CAP, and SQL vs NoSQL.',
  },
  beats: DB_BEATS,
  scenes: {
    dbProblem: rDbProblem, dbSolution: rDbSolution,
    dbModels: rDbModels, dbRelDoc: rDbRelDoc, dbGraph: rDbGraph,
    dbQuery: rDbQuery,
    dbIndex: rDbIndex, dbLsmBtree: rDbLsmBtree, dbOltpOlap: rDbOltpOlap,
    dbAcid: rDbAcid, dbIsolation: rDbIsolation,
    dbReplication: rDbReplication, dbPartition: rDbPartition, dbCap: rDbCap,
    dbSqlNoSql: rDbSqlNoSql, dbGotcha: rDbGotcha,
  },
});
