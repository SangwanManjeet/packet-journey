/* =====================================================================
   COURSE · Data Models & Query Languages  (section: system-design)
   A story-first chapter adapted from "Designing Data-Intensive
   Applications", Chapter 2. The arc: data models are layers of thought
   -> relational vs document -> relationships & history -> schema &
   locality -> query languages (declarative vs imperative, MapReduce)
   -> graph models (Cypher, SPARQL, Datalog) -> how to choose.
   ===================================================================== */

/* ----- the story beats (the narration script) ----- */
const DM_BEATS = [
  {ch:'Models · Why?', scene:'dmLayers', ttl:'The limits of your model are the limits of your world',
   txt:'<i>“The limits of my language mean the limits of my world.”</i> — Wittgenstein. Software is built by <b>layering</b> one data model on another: you model the messy real world as <b>objects</b>, store those as a <b>general-purpose data model</b>, which the database turns into <b>bytes</b>, which hardware turns into <b>electrons</b>. Each layer hides the one below. <span class="hl">The model you pick shapes what your software can even think.</span>'},

  {ch:'Models · Why?', scene:'dmRelational', ttl:'The model that took over the world',
   txt:'In 1970 <b>Edgar Codd</b> proposed the <b>relational model</b>: data as <b>relations</b> (tables) of <b>tuples</b> (rows), with no hidden structure. People doubted it could be efficient — yet by the mid-1980s <b>SQL</b> ruled, and it has reigned for ~30 years. Its trick: <b>hide the storage details</b> behind a clean interface.'},

  {ch:'Models · NoSQL', scene:'dmNoSQL', ttl:'The birth of NoSQL',
   txt:'In the 2010s, <b>NoSQL</b> rose to challenge the relational throne. The name is unfortunate — it began as a <b>Twitter hashtag</b> for a 2009 meetup, later softened to <i>“Not Only SQL.”</i> Several pressures drove it. The likely future isn’t one winner but <b>polyglot persistence</b>: SQL <i>and</i> non-relational stores, side by side.'},

  {ch:'Models · Document', scene:'dmMismatch', ttl:'The object–relational mismatch',
   txt:'Most code is <b>object-oriented</b>; most databases are <b>tables</b>. Bridging the two needs an awkward translation layer — the <b>impedance mismatch</b>. <b>ORMs</b> like Hibernate and ActiveRecord shrink the boilerplate, but they can’t make the two shapes truly fit.'},

  {ch:'Models · Document', scene:'dmDocument', ttl:'A résumé wants to be a document',
   txt:'A LinkedIn profile is mostly a self-contained tree: one user, many positions, many schools. The <b>document model</b> (MongoDB, CouchDB) stores it as <b>one JSON tree</b>. That gives <b>locality</b> — fetch the whole profile in <span class="hl">one query</span>, no messy multi-table join — and the tree of one-to-many relationships is made explicit.'},

  {ch:'Models · Relationships', scene:'dmManyOne', ttl:'ID or text? The many-to-one question',
   txt:'Why store <span class="mono">region_id</span> instead of <span class="mono">"Greater Seattle Area"</span>? An <b>ID</b> never has to change, so the human-meaningful name lives in <b>one place</b> — consistent, unambiguous, easy to update and localize. Storing the text instead <b>duplicates</b> it everywhere. Removing that duplication is the heart of <b>normalization</b>.'},

  {ch:'Models · Relationships', scene:'dmManyMany', ttl:'Data gets tangled: many-to-many',
   txt:'Normalizing needs <b>many-to-one</b> links, and apps grow <b>many-to-many</b> ones: organizations become <b>entities</b> with their own pages; one user <b>recommends</b> another. These references must be resolved by <b>joins</b> — exactly what document databases are weak at. <i>Data tends to get more interconnected over time.</i>'},

  {ch:'Models · History', scene:'dmHistory', ttl:'Are document databases repeating history?',
   txt:'This debate is older than NoSQL. The 1970s giant <b>IMS</b> used the <b>hierarchical model</b> — a tree of records inside records, just like JSON. It was great at one-to-many, but <b>many-to-many was painful</b> and joins didn’t exist: you had to <b>denormalize</b> or chase references by hand. Sound familiar?'},

  {ch:'Models · History', scene:'dmNetworkRel', ttl:'The great debate: network vs relational',
   txt:'Two answers emerged. The <b>network model (CODASYL)</b> let a record have many parents, but you reached data only by walking a hand-coded <b>access path</b> — fast on 1970s tape, impossible to change. The <b>relational model</b> laid data in the open and let a <b>query optimizer</b> pick the path for you. <span class="hl">Build the optimizer once; every app benefits.</span>'},

  {ch:'Models · Schema', scene:'dmSchema', ttl:'Schema-on-read vs schema-on-write',
   txt:'“Schemaless” is misleading — there’s always an <b>implicit</b> schema. The real difference: <b>schema-on-read</b> (document DBs) interprets structure when reading, like <b>dynamic typing</b>; <b>schema-on-write</b> (relational) enforces it up front, like <b>static typing</b>. Changing a field’s shape is a code branch on one side, an <span class="mono">ALTER TABLE</span> migration on the other.'},

  {ch:'Models · Schema', scene:'dmConvergence', ttl:'Locality, and a quiet convergence',
   txt:'Locality is a real win when you read a <b>whole</b> document — but the DB loads it all even for one field, and a growing document gets rewritten in full, so keep them small. Meanwhile the camps are <b>converging</b>: Postgres &amp; MySQL store and query <b>JSON</b>; RethinkDB and Mongo add <b>joins</b>. <span class="hl">A hybrid is the future.</span>'},

  {ch:'Models · Trade-offs', scene:'dmProsCons', ttl:'The document model: honest trade-offs',
   txt:'So when does the document model help, and when does it bite? Here is the balance sheet. The rule of thumb: <b>document for self-contained trees</b>, <b>relational when relationships matter</b>, and reach for a <b>graph</b> when everything connects to everything.'},

  {ch:'Query · Languages', scene:'dmDeclImp', ttl:'Ask <i>what</i>, not <i>how</i>',
   txt:'SQL is <b>declarative</b>: you describe the <i>result</i> (<span class="mono">σ family = "Sharks"</span>) and the optimizer plans the <i>how</i>. Imperative code spells out every loop and order. Declarative is shorter, hides engine details so it can be <b>optimized</b> and <b>parallelized</b> — imperative code can’t, because order is baked in.'},

  {ch:'Query · Languages', scene:'dmWeb', ttl:'Even your browser prefers declarative',
   txt:'The same lesson plays out far from databases. To highlight the selected page you can <b>declare a pattern in CSS</b> — and the browser keeps it correct as state changes — or you can <b>imperatively poke the DOM</b> in JavaScript and own every edge case yourself. Declarative wins here too.'},

  {ch:'Query · MapReduce', scene:'dmMapReduce', ttl:'MapReduce: between the two worlds',
   txt:'<b>MapReduce</b> (popularized by Google) is neither fully declarative nor imperative: you supply two <b>pure functions</b> — <span class="mono">map</span> emits key→value pairs, <span class="mono">reduce</span> folds the values per key. Powerful, but writing two coordinated functions is awkward — so MongoDB added a <b>declarative aggregation pipeline</b>, <span class="hl">accidentally reinventing SQL</span>.'},

  {ch:'Graph · Models', scene:'dmGraphIntro', ttl:'When everything connects: graphs',
   txt:'If many-to-many relationships dominate, model the data as a <b>graph</b>: <b>vertices</b> (entities) joined by <b>edges</b> (relationships). Social networks, the web, road maps — and Facebook stores <i>people, places, events, comments</i> all in one graph. <span class="hl">Graphs are built for evolvability.</span>'},

  {ch:'Graph · Models', scene:'dmCypher', ttl:'Cypher: query the property graph',
   txt:'In the <b>property graph</b> model (Neo4j), vertices and edges each carry a label and key-value properties. <b>Cypher</b> describes patterns with an arrow notation — <span class="mono">(a)-[:WITHIN*0..]-&gt;(b)</span> means “follow WITHIN zero-or-more times.” The same query in SQL needs clumsy <span class="mono">WITH RECURSIVE</span> — <b>4 lines vs 29</b>.'},

  {ch:'Graph · Models', scene:'dmTriples', ttl:'Triple-stores & SPARQL',
   txt:'A <b>triple-store</b> says the same thing in three-part facts: <span class="mono">(subject, predicate, object)</span> — <span class="mono">(lucy, bornIn, idaho)</span>. Written as <b>Turtle</b> / <b>RDF</b>, it underpins the (over-hyped) <b>semantic web</b>, but works great just internally. Its query language <b>SPARQL</b> inspired Cypher — they look like cousins.'},

  {ch:'Graph · Models', scene:'dmDatalog', ttl:'Datalog: the foundation underneath',
   txt:'Older and deeper, <b>Datalog</b> (a subset of Prolog) writes facts as <span class="mono">predicate(subject, object)</span> and builds queries from small <b>rules</b> that can call each other and <b>recurse</b>. It’s less handy for one-offs, but rules <b>combine and reuse</b> — so it copes best when the data and questions get complex.'},

  {ch:'Summary', scene:'dmSummary', ttl:'Pick the model that fits the question',
   txt:'Data began as one big <b>tree</b> (hierarchical), the <b>relational</b> model fixed many-to-many, then <b>NoSQL</b> split two ways: <b>documents</b> for self-contained data, <b>graphs</b> for everything-connected. All three thrive — emulating one with another is awkward, which is why we have different tools. <span class="hl">There is no one-size-fits-all.</span>'},
];

/* ----- small shared helper for code panels ----- */
function dmCode(s, color){
  return `<pre class="mono" style="margin:0;font-size:12px;line-height:1.55;color:${color||'#cdeee0'};text-align:left;background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;overflow:auto;max-width:100%">${s}</pre>`;
}

/* ----- scene renderers (the visuals) — return HTML wrapped in .art ----- */
function rDmLayers(){
  const tier=(label,row,desc,col)=>`<div class="tier" style="border-color:${col}">
    <div class="tlabel">${label}</div>
    <div class="trow" style="font-size:15px;letter-spacing:normal">${row}</div>
    <div class="tdesc">${desc}</div></div>`;
  const arr=`<div class="tier-arrow">↓ represented as ↓</div>`;
  return `<div class="art" style="gap:7px">
    ${tier('The real world','🌍 people · money · sensors · actions','the messy reality you want to capture','#00cec9')}
    ${arr}
    ${tier('Application','🧱 objects, data structures &amp; APIs','shapes specific to your app','#74b9ff')}
    ${arr}
    ${tier('Data model','🗂️ JSON · tables · graph','general-purpose storage shape — <b>this chapter</b>','#fdcb6e')}
    ${arr}
    ${tier('Storage engine','💾 bytes in memory, on disk, on the wire','how the DB lays it out (next chapter)','#e17055')}
    ${arr}
    ${tier('Hardware','⚡ currents · light · magnetism','the physics underneath','#a29bfe')}
    <div class="farm-cap">Each layer offers a <b>clean model</b> and hides the complexity below it — so the database vendor’s engineers and the app developers can work together without knowing each other’s internals. But every model bakes in <b>assumptions</b>: some things become easy, others awkward or impossible. <span style="color:#fff">Choose the one that fits the job.</span></div>
  </div>`;
}

function rDmRelational(){
  const th=`text-align:left;padding:5px 12px;border:1px solid var(--line);font-size:11.5px;color:var(--muted);background:var(--panel2)`;
  const td=`padding:5px 12px;border:1px solid var(--line);font-size:12.5px`;
  const tdk=`padding:5px 12px;border:1px solid var(--line);font-size:12.5px;color:#81ecec;font-weight:600`;
  return `<div class="art" style="gap:16px">
    <div style="background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 18px">
      <div style="color:#81ecec;font-weight:700;margin-bottom:10px">📊 relation <span style="color:var(--muted);font-weight:400;font-size:12px">(a table of tuples)</span></div>
      <table style="border-collapse:collapse">
        <tr><th style="${th}">user_id</th><th style="${th}">first_name</th><th style="${th}">last_name</th><th style="${th}">region_id</th></tr>
        <tr><td style="${tdk}">251</td><td style="${td}">Bill</td><td style="${td}">Gates</td><td style="${td}">us:91</td></tr>
        <tr><td style="${tdk}">252</td><td style="${td}">Ada</td><td style="${td}">Lovelace</td><td style="${td}">uk:3</td></tr>
        <tr><td style="${tdk}">253</td><td style="${td}">Lin</td><td style="${td}">Wu</td><td style="${td}">cn:7</td></tr>
      </table>
    </div>
    <div class="farm-cap">Proposed by <b>Edgar Codd in 1970</b>: data is just a <b>relation</b> (table) — an unordered collection of <b>tuples</b> (rows). No labyrinth of nested structures, no access paths to follow. Read any row that matches a condition, designate a <b>key</b>, insert freely. <span style="color:#fff">SQL</span> followed this closely and dominated for ~30 years.</div>
  </div>`;
}

function rDmNoSQL(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('📈','Scale','Bigger datasets and far higher write throughput than a single relational box handles easily.')}
      ${infoCard('🆓','Open source','A preference for free, community software over commercial database products.')}
      ${infoCard('🧬','Special queries','Operations (graphs, full-text, time-series) the relational model serves poorly.')}
      ${infoCard('🤸','Flexibility','Frustration with rigid schemas — a wish for a more dynamic, expressive shape.')}
    </div>
    <div class="farm-cap">“<b>NoSQL</b>” wasn’t a technology — it began as a catchy <b>2009 meetup hashtag</b> and stuck, later reread as <i>“Not Only SQL.”</i> Different apps have different needs, so the realistic future is <b style="color:#00cec9">polyglot persistence</b>: relational and non-relational datastores living happily side by side.</div>
  </div>`;
}

function rDmMismatch(){
  const panel=`background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px;min-width:240px`;
  const obj=dmCode(`class Profile {\n  String firstName;\n  List&lt;Position&gt; positions;\n  List&lt;School&gt;   education;\n}`, '#cdeee0');
  const th=`text-align:left;padding:4px 9px;border:1px solid var(--line);font-size:11px;color:var(--muted);background:var(--panel2)`;
  const td=`padding:4px 9px;border:1px solid var(--line);font-size:11.5px`;
  const tables=`<table style="border-collapse:collapse;margin-bottom:8px"><tr><th style="${th}">users</th></tr><tr><td style="${td}">id · first_name</td></tr></table>
    <table style="border-collapse:collapse;margin-bottom:8px"><tr><th style="${th}">positions</th></tr><tr><td style="${td}">id · user_id · title</td></tr></table>
    <table style="border-collapse:collapse"><tr><th style="${th}">education</th></tr><tr><td style="${td}">id · user_id · school</td></tr></table>`;
  return `<div class="art" style="gap:14px">
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center">
      <div style="${panel}"><div style="color:#74b9ff;font-weight:700;margin-bottom:8px">🧱 Objects (your code)</div>${obj}</div>
      <div style="text-align:center;color:#fdcb6e;font-weight:700;font-size:13px">⇄<br><span style="font-size:11px">ORM<br>translation</span></div>
      <div style="${panel}"><div style="color:#81ecec;font-weight:700;margin-bottom:8px">📊 Tables (the database)</div>${tables}</div>
    </div>
    <div class="farm-cap">Code thinks in <b>objects and lists</b>; relational databases think in <b>tables, rows and columns</b>. Stitching them together needs an awkward bridge — the <b style="color:#fdcb6e">impedance mismatch</b>. <b>ORMs</b> (Hibernate, ActiveRecord) cut the boilerplate, but can’t hide that the two shapes simply don’t line up.</div>
  </div>`;
}

function rDmDocument(){
  const doc=dmCode(`{\n  "user_id": 251,\n  "first_name": "Bill",\n  "last_name": "Gates",\n  "positions": [\n    {"title":"Co-chair",  "org":"Gates Foundation"},\n    {"title":"Co-founder","org":"Microsoft"}\n  ],\n  "education": [\n    {"school":"Harvard", "start":1973, "end":1975}\n  ],\n  "contact_info": {"twitter":"@BillGates"}\n}`, '#cdeee0');
  const node=(t,c)=>`<div style="background:var(--panel2);border:1px solid ${c};border-radius:9px;padding:5px 11px;font-size:11.5px;font-weight:600;color:${c}">${t}</div>`;
  const tree=`<div style="display:flex;flex-direction:column;align-items:center;gap:8px">
      ${node('user 251','#81ecec')}
      <div style="color:#3a4170;font-size:14px">┌────┬────┬────┐</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        ${node('positions []','#00b894')}${node('education []','#fdcb6e')}${node('contact_info','#e17055')}
      </div>
      <div style="color:var(--muted);font-size:11px;text-align:center">one-to-many ⇒ a <b style="color:#fff">tree</b></div>
    </div>`;
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;align-items:center">
      ${doc}${tree}
    </div>
    <div class="farm-cap">A résumé is mostly a self-contained tree, so a single <b style="color:#00cec9">JSON document</b> fits beautifully. The relational version shreds it into many tables needing a join; here, everything is <b>in one place</b> — <span class="hl">one query loads the whole profile</span>. The one-to-many links (positions, education, contact) form an explicit tree.</div>
  </div>`;
}

function rDmManyOne(){
  return `<div class="art" style="gap:16px">${compareHtml(
    {color:'#00b894',icon:'🔑',title:'Store an ID (normalized)',sub:'region_id → 1 row in a regions table',
     rows:[['🎯','The name lives in exactly <b>one</b> place'],['✏️','Rename a city once — everywhere updates'],['🌍','Localize &amp; disambiguate easily'],['🔎','“Philanthropists in Washington” can match Seattle']],
     foot:'IDs have no human meaning, so they never need to change.'},
    {color:'#fdcb6e',icon:'📝',title:'Store the text (duplicated)',sub:'"Greater Seattle Area" in every record',
     rows:[['📋','The same string copied across rows'],['⚠️','Renaming means rewriting every copy'],['🐛','Risk of inconsistency &amp; typos'],['🚫','Hard to search by region hierarchy']],
     foot:'Human-meaningful data tends to change — duplication hurts.'}
  )}
    <div class="farm-cap">Whether to store an ID or text is a question of <b>duplication</b>. Removing it via <b style="color:#00b894">normalization</b> needs <b>many-to-one</b> relationships (many people, one region) — which join cleanly in relational databases but fit <b style="color:#fdcb6e">poorly</b> in the document model.</div>
  </div>`;
}

function rDmManyMany(){
  const svg=`<svg width="460" height="180" viewBox="0 0 460 180" style="max-width:100%;height:auto">
    <line x1="120" y1="60" x2="210" y2="95" stroke="#fdcb6e" stroke-width="2" opacity=".75"/>
    <line x1="340" y1="60" x2="250" y2="95" stroke="#fdcb6e" stroke-width="2" opacity=".75"/>
    <line x1="120" y1="60" x2="320" y2="55" stroke="#e84393" stroke-width="2" opacity=".7" stroke-dasharray="4 3"/>
    <text x="150" y="86" fill="#b2bec3" font-size="9.5">works_at</text>
    <text x="288" y="86" fill="#b2bec3" font-size="9.5">studied_at</text>
    <text x="210" y="42" fill="#b2bec3" font-size="9.5" text-anchor="middle">recommends →</text>
    <g><rect x="58" y="36" width="124" height="44" rx="9" fill="#241b34" stroke="#74b9ff" stroke-width="2"/>
       <text x="120" y="56" fill="#fff" font-size="12" text-anchor="middle">Résumé: Bill</text>
       <text x="120" y="70" fill="#8a8fa3" font-size="8.5" text-anchor="middle">document</text></g>
    <g><rect x="278" y="34" width="124" height="44" rx="9" fill="#241b34" stroke="#74b9ff" stroke-width="2"/>
       <text x="340" y="54" fill="#fff" font-size="12" text-anchor="middle">Résumé: Alain</text>
       <text x="340" y="68" fill="#8a8fa3" font-size="8.5" text-anchor="middle">recommender</text></g>
    <g><rect x="188" y="98" width="84" height="44" rx="9" fill="#1f1b3a" stroke="#00b894" stroke-width="2"/>
       <text x="230" y="118" fill="#fff" font-size="11.5" text-anchor="middle">Microsoft</text>
       <text x="230" y="132" fill="#8a8fa3" font-size="8.5" text-anchor="middle">entity</text></g>
  </svg>`;
  return `<div class="art" style="gap:14px">
    ${svg}
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:880px">
      ${infoCard('🏢','Entities, not strings','Organizations &amp; schools become shared entities with their own page, logo, news feed.')}
      ${infoCard('🤝','Recommendations','One user recommends another — the recommendation must reference the author’s profile.')}
      ${infoCard('🔗','Joins return','These many-to-many references resolve via <b>joins</b> — document DBs’ weak spot.')}
    </div>
    <div class="farm-cap">Even an app that starts join-free drifts toward connection. Each dotted record is one document, but the <b>references</b> between them — to orgs, schools, other users — are <b style="color:#e84393">many-to-many</b>, and that’s where the relational model (or a graph) pulls ahead.</div>
  </div>`;
}

function rDmHistory(){
  const node=(t,c)=>`<div style="background:var(--panel2);border:1px solid ${c};border-radius:9px;padding:5px 12px;font-size:12px;font-weight:600;color:${c}">${t}</div>`;
  return `<div class="art" style="gap:14px">
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
      ${node('IMS record (root)','#a29bfe')}
      <div style="color:#3a4170">│</div>
      <div style="display:flex;gap:12px">${node('child','#74b9ff')}${node('child','#74b9ff')}</div>
      <div style="color:#3a4170">│</div>
      ${node('grand-child','#00b894')}
      <div style="color:var(--muted);font-size:11px">a tree of records nested in records — <b style="color:#fff">just like JSON</b></div>
    </div>
    <div class="farm-cap">The debate predates NoSQL by decades. <b>IBM’s IMS</b> (1968, built for the Apollo program) used the <b style="color:#a29bfe">hierarchical model</b> — remarkably similar to today’s document model. It nailed one-to-many, but <b>many-to-many was hard</b> and there were <b>no joins</b>: developers had to <b>denormalize</b> or resolve references by hand. <i>The 1970s pain is the document-DB pain.</i></div>
  </div>`;
}

function rDmNetworkRel(){
  return `<div class="art" style="gap:14px">${compareHtml(
    {color:'#ff7675',icon:'🧭',title:'Network model (CODASYL)',sub:'records with many parents',
     rows:[['🔗','Links are pointers; reach data via an <b>access path</b>'],['🧶','Many-to-many means juggling paths in your head'],['⚡','Squeezed max speed from 1970s tape drives'],['🧱','No path to your data? Rewrite lots of code']],
     foot:'Imperative, fast, and rigid — hard to change.'},
    {color:'#00b894',icon:'📊',title:'Relational model',sub:'data laid out in the open',
     rows:[['🟢','Read any row by condition; insert freely'],['🤖','A <b>query optimizer</b> chooses the access path'],['➕','Want a new query? Just declare an index'],['🏆','Easy to add features as needs change']],
     foot:'Build the optimizer once — every app benefits.'}
  )}
    <div class="farm-cap">The “great debate” of the 1970s. The <b style="color:#00b894">relational</b> model won by <b>automating the access path</b>. (Graph databases echo CODASYL’s flexibility, but unlike it they allow direct lookups by ID and offer <b>declarative</b> query languages.)</div>
  </div>`;
}

function rDmSchema(){
  const read=dmCode(`// schema-on-read (document DB)\nif (user && !user.first_name) {\n  user.first_name =\n    user.name.split(" ")[0];\n}`, '#cdeee0');
  const write=dmCode(`-- schema-on-write (relational)\nALTER TABLE users\n  ADD COLUMN first_name text;\nUPDATE users SET first_name =\n  split_part(name, ' ', 1);`, '#ffe8b3');
  return `<div class="art" style="gap:14px">${compareHtml(
    {color:'#00b894',icon:'📖',title:'Schema-on-read',sub:'structure interpreted on read',
     rows:[['🤸','Just start writing the new shape'],['🧠','Like <b>dynamic</b> typing — flexible'],['🧩','Great for heterogeneous / external data'],['⚠️','No guarantees about what fields exist']],
     foot:'Adapt fast; the reader copes with old data.'},
    {color:'#0984e3',icon:'📐',title:'Schema-on-write',sub:'structure enforced up front',
     rows:[['✅','DB guarantees every row conforms'],['🧱','Like <b>static</b> typing — safe'],['📝','Self-documenting structure'],['🐢','Changing shape needs a migration']],
     foot:'Catch errors early; structure is explicit.'}
  )}
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">${read}${write}</div>
  </div>`;
}

function rDmConvergence(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('⚡','Locality wins','Reading the whole document at once is fast — it’s one continuous string on disk.')}
      ${infoCard('🐘','Locality costs','The DB loads the entire document even for one field, and rewrites it whole on update — keep them small.')}
      ${infoCard('🔄','Converging','Postgres/MySQL/DB2 query <b>JSON</b>; RethinkDB &amp; Mongo add <b>joins</b>. The lines blur.')}
      ${infoCard('🧬','Hybrid future','A DB that does documents <i>and</i> relational queries lets apps mix the best of both.')}
    </div>
    <div class="farm-cap">Grouping related data for locality isn’t unique to documents — Spanner interleaves rows, Oracle clusters tables, Bigtable’s column families do the same. <span class="hl">Relational and document databases are growing toward each other — and that’s a good thing.</span></div>
  </div>`;
}

function rDmProsCons(){
  return `<div class="art">${compareHtml(
    {color:'#00b894',icon:'✅',title:'Document model — strengths',sub:'why you’d reach for it',
     rows:[['🤸','Schema flexibility (schema-on-read)'],['⚡','Locality — whole tree in one read'],['🧩','Maps cleanly to app data structures'],['🌳','Perfect for self-contained one-to-many trees']],
     foot:'Great when data is a document.'},
    {color:'#ff7675',icon:'⚠️',title:'Document model — weaknesses',sub:'the costs to weigh',
     rows:[['🔗','Weak joins — many-to-many gets awkward'],['📍','Can’t reference a nested item directly'],['🧹','Denormalizing shifts consistency work to the app'],['🐘','Big / growing documents waste reads &amp; writes']],
     foot:'Painful when data is highly interconnected.'}
  )}</div>`;
}

function rDmDeclImp(){
  const sql=dmCode(`-- declarative: say WHAT\nSELECT * FROM animals\nWHERE family = 'Sharks';`, '#a8e6cf');
  const imp=dmCode(`// imperative: spell out HOW\nsharks = [];\nfor (a of animals)\n  if (a.family === "Sharks")\n    sharks.push(a);`, '#ffe8b3');
  return `<div class="art" style="gap:14px">
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">${sql}${imp}</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('🧠','Optimizer-friendly','SQL hides the engine, so it can use indexes, reorder work — no query change needed.')}
      ${infoCard('🧵','Parallelizable','Declarative specifies results, not order — easy to spread across CPU cores.')}
      ${infoCard('🔒','Order baked in','Imperative code fixes the sequence, so the DB can’t safely reorder or rerun it.')}
    </div>
    <div class="farm-cap">In relational algebra this is just <span class="mono">σ family = "Sharks" (animals)</span>. <b>Declarative</b> languages are more concise <i>and</i> give the engine room to get faster — <span class="hl">without you rewriting a single query.</span></div>
  </div>`;
}

function rDmWeb(){
  const cssCode=dmCode(`/* declarative — CSS */\nli.selected &gt; p {\n  background: blue;\n}`, '#a8e6cf');
  const jsCode=dmCode(`// imperative — JS DOM\nfor (li of document\n     .getElementsByTagName("li")) {\n  if (li.className === "selected")\n    /* …find &amp; recolor &lt;p&gt;… */\n}`, '#ffe8b3');
  return `<div class="art" style="gap:14px">
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:flex-start">${cssCode}${jsCode}</div>
    <div class="farm-cap">Same idea, far from databases. <b style="color:#a8e6cf">CSS</b> declares a <b>pattern</b> and the browser keeps it correct as state changes — remove the class and the highlight vanishes automatically. The <b style="color:#ffe8b3">imperative</b> JavaScript is longer, brittle (won’t un-highlight on its own), and must be rewritten to use faster APIs. <span class="hl">Declarative wins here too.</span></div>
  </div>`;
}

function rDmMapReduce(){
  const box=(icon,t,sub,c)=>`<div style="background:var(--panel);border:1px solid ${c};border-radius:12px;padding:9px 14px;text-align:center;min-width:120px">
    <div style="font-size:22px">${icon}</div><div style="font-weight:700;color:${c};font-size:13px">${t}</div><div style="color:var(--muted);font-size:11px">${sub}</div></div>`;
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:center">
      ${box('📄','documents','observations','#74b9ff')}
      <div class="tier-arrow">→</div>
      ${box('🗺️','map()','emit(key, value)','#fdcb6e')}
      <div class="tier-arrow">→</div>
      ${box('🧺','group','by key','#a29bfe')}
      <div class="tier-arrow">→</div>
      ${box('➕','reduce()','fold values','#00b894')}
      <div class="tier-arrow">→</div>
      ${box('📊','result','count per month','#00cec9')}
    </div>
    ${dmCode(`map():    emit("1995-12", numAnimals)   // per document\nreduce("1995-12", [3, 4]):  return 7   // fold per key`, '#cdeee0')}
    <div class="farm-cap"><b>map</b> and <b>reduce</b> must be <b>pure functions</b> — no side effects, no extra queries — so the DB can run them anywhere, in any order, and retry on failure. Writing two coordinated functions is fiddly, so MongoDB added a declarative <b>aggregation pipeline</b> — <span class="hl">a NoSQL system accidentally reinventing SQL.</span></div>
  </div>`;
}

function rDmGraphIntro(){
  const svg=`<svg width="480" height="250" viewBox="0 0 480 250" style="max-width:100%;height:auto">
    <line x1="148" y1="48" x2="332" y2="48" stroke="#e84393" stroke-width="2" opacity=".75"/>
    <line x1="108" y1="68" x2="86"  y2="114" stroke="#6c5ce7" stroke-width="2" opacity=".7"/>
    <line x1="86"  y1="166" x2="86" y2="196" stroke="#6c5ce7" stroke-width="2" opacity=".7"/>
    <line x1="132" y1="62" x2="276" y2="178" stroke="#00b894" stroke-width="2" opacity=".7"/>
    <line x1="348" y1="68" x2="324" y2="172" stroke="#00b894" stroke-width="2" opacity=".7"/>
    <text x="240" y="36" fill="#b2bec3" font-size="9.5" text-anchor="middle">MARRIED</text>
    <text x="74"  y="98" fill="#b2bec3" font-size="9" text-anchor="middle">BORN_IN</text>
    <text x="62"  y="184" fill="#b2bec3" font-size="9" text-anchor="middle">WITHIN</text>
    <text x="186" y="128" fill="#b2bec3" font-size="9">LIVES_IN</text>
    <text x="356" y="128" fill="#b2bec3" font-size="9">LIVES_IN</text>
    <g><circle cx="120" cy="48" r="26" fill="#241b34" stroke="#e84393" stroke-width="2"/>
       <text x="120" y="46" fill="#fff" font-size="12" text-anchor="middle">Lucy</text>
       <text x="120" y="60" fill="#8a8fa3" font-size="8" text-anchor="middle">Person</text></g>
    <g><circle cx="360" cy="48" r="26" fill="#241b34" stroke="#e84393" stroke-width="2"/>
       <text x="360" y="46" fill="#fff" font-size="12" text-anchor="middle">Alain</text>
       <text x="360" y="60" fill="#8a8fa3" font-size="8" text-anchor="middle">Person</text></g>
    <g><circle cx="86" cy="140" r="26" fill="#1f1b3a" stroke="#6c5ce7" stroke-width="2"/>
       <text x="86" y="138" fill="#fff" font-size="11" text-anchor="middle">Idaho</text>
       <text x="86" y="151" fill="#8a8fa3" font-size="8" text-anchor="middle">state</text></g>
    <g><circle cx="86" cy="220" r="27" fill="#1f1b3a" stroke="#6c5ce7" stroke-width="2"/>
       <text x="86" y="218" fill="#fff" font-size="11" text-anchor="middle">USA</text>
       <text x="86" y="231" fill="#8a8fa3" font-size="8" text-anchor="middle">country</text></g>
    <g><circle cx="300" cy="192" r="29" fill="#102b2b" stroke="#00b894" stroke-width="2"/>
       <text x="300" y="190" fill="#fff" font-size="11.5" text-anchor="middle">London</text>
       <text x="300" y="203" fill="#8a8fa3" font-size="8" text-anchor="middle">city</text></g>
  </svg>`;
  return `<div class="art" style="gap:14px">
    ${svg}
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:880px">
      ${infoCard('🔵','Vertices','Entities — people, locations, events. Any vertex may connect to any other.')}
      ${infoCard('➡️','Edges','Labeled, directed relationships — MARRIED, BORN_IN, WITHIN — with their own properties.')}
      ${infoCard('🌱','Evolvable','Add a new kind of fact (allergies, foods) by adding vertices &amp; edges — no schema migration.')}
    </div>
    <div class="farm-cap">When <b>anything can relate to everything</b>, model it as a <b style="color:#e84393">graph</b>. One store can hold wildly different things — France has <i>régions</i>, the US has <i>states</i>; Lucy’s home is a city, her birthplace just a state — and it all coexists without a rigid schema.</div>
  </div>`;
}

function rDmCypher(){
  const create=dmCode(`CREATE\n  (USA:Location   {name:'United States'}),\n  (Idaho:Location {name:'Idaho'}),\n  (Lucy:Person    {name:'Lucy'}),\n  (Idaho) -[:WITHIN]-&gt;  (USA),\n  (Lucy)  -[:BORN_IN]-&gt; (Idaho)`, '#a8e6cf');
  const match=dmCode(`MATCH\n  (p) -[:BORN_IN]-&gt;  () -[:WITHIN*0..]-&gt; (:Location {name:'United States'}),\n  (p) -[:LIVES_IN]-&gt; () -[:WITHIN*0..]-&gt; (:Location {name:'Europe'})\nRETURN p.name`, '#81ecec');
  return `<div class="art" style="gap:14px">
    <div style="display:flex;flex-direction:column;gap:12px;align-items:center;max-width:100%">
      <div style="color:#a8e6cf;font-weight:700;font-size:12.5px">① build the graph with arrows</div>
      ${create}
      <div style="color:#81ecec;font-weight:700;font-size:12.5px">② find people who emigrated US → Europe</div>
      ${match}
    </div>
    <div class="farm-cap"><b>Cypher</b> (Neo4j) matches <b>patterns</b>: <span class="mono">(a)-[:WITHIN*0..]-&gt;(b)</span> follows an edge <b>zero or more times</b>, like <span class="mono">*</span> in a regex. You never specify execution order — the optimizer does. The same query in SQL needs <span class="mono">WITH RECURSIVE</span>: <span class="hl">4 lines here vs ~29 there.</span></div>
  </div>`;
}

function rDmTriples(){
  const turtle=dmCode(`@prefix : &lt;urn:example:&gt;.\n_:lucy  a :Person;   :name "Lucy";\n        :bornIn _:idaho.\n_:idaho a :Location; :name "Idaho";\n        :within _:usa.\n_:usa   a :Location; :name "United States".`, '#cdeee0');
  const sparql=dmCode(`SELECT ?name WHERE {\n  ?p :name ?name.\n  ?p :bornIn  / :within* / :name "United States".\n  ?p :livesIn / :within* / :name "Europe".\n}`, '#81ecec');
  return `<div class="art" style="gap:14px">
    <div style="text-align:center;color:var(--muted);font-size:12.5px">every fact is a triple: <span class="mono" style="color:#fff">(subject, predicate, object)</span> — e.g. <span class="mono">(lucy, bornIn, idaho)</span></div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:flex-start">
      <div><div style="color:#cdeee0;font-weight:700;font-size:12px;margin-bottom:6px">Turtle / RDF</div>${turtle}</div>
      <div><div style="color:#81ecec;font-weight:700;font-size:12px;margin-bottom:6px">SPARQL query</div>${sparql}</div>
    </div>
    <div class="farm-cap">The <b>triple-store</b> model equals the property graph in different words. Written as <b>RDF</b>, it powered the over-hyped <b>semantic web</b> — but is a fine internal model regardless. <b style="color:#81ecec">SPARQL</b> predates and inspired Cypher, so the two read like cousins.</div>
  </div>`;
}

function rDmDatalog(){
  const facts=dmCode(`name(usa, 'United States').\nwithin(usa, namerica).\nname(idaho, 'Idaho').\nwithin(idaho, usa).\nborn_in(lucy, idaho).`, '#cdeee0');
  const rules=dmCode(`within_rec(L, N) :- name(L, N).\nwithin_rec(L, N) :- within(L, Via),\n                    within_rec(Via, N).\n\nmigrated(N, B, Li) :- name(P, N),\n  born_in(P, BL),  within_rec(BL, B),\n  lives_in(P, LL), within_rec(LL, Li).\n\n?- migrated(Who, 'United States', 'Europe').`, '#a8e6cf');
  return `<div class="art" style="gap:14px">
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:flex-start">
      <div><div style="color:#cdeee0;font-weight:700;font-size:12px;margin-bottom:6px">facts: predicate(subject, object)</div>${facts}</div>
      <div><div style="color:#a8e6cf;font-weight:700;font-size:12px;margin-bottom:6px">rules build up the query</div>${rules}</div>
    </div>
    <div class="farm-cap"><b>Datalog</b> (a subset of Prolog) takes small steps: define <b>rules</b> that derive new predicates and can <b>recurse</b> or call one another. Capitalized words are variables; a rule fires when all predicates after <span class="mono">:-</span> match. Less convenient for one-offs, but <span class="hl">rules combine and reuse</span> — it scales to complex data. It’s the <b>foundation</b> Cypher and SPARQL build on.</div>
  </div>`;
}

function rDmSummary(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center;color:var(--muted);font-size:12.5px">
      <span style="color:#a29bfe;font-weight:700">hierarchical tree</span> →
      <span style="color:#0984e3;font-weight:700">relational</span> →
      <span style="color:#00cec9;font-weight:700">NoSQL splits in two</span>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('📄','Document','Self-contained data, rare cross-document links. One tree, loaded at once.')}
      ${infoCard('📊','Relational','Good support for joins, many-to-one &amp; many-to-many. The acceptable middle ground.')}
      ${infoCard('🕸️','Graph','Anything relates to everything. The most natural fit for highly interconnected data.')}
    </div>
    <div class="farm-cap">All three are widely used and each shines in its domain. You <i>can</i> emulate one with another — graph data in a relational table — but the result is <b>awkward</b>. Document and graph stores usually skip an enforced schema, trading guarantees for adaptability. <span class="hl">There’s no one-size-fits-all — pick the model that fits your questions.</span></div>
  </div>`;
}

/* ----- register this building block with the app ----- */
App.registerCourse({
  key: 'data-models',
  section: 'systemdesign',
  card: {
    icon: '🗂️', color: '#00cec9', title: 'Data Models & Query Languages',
    blurb: 'How you shape data shapes your software — relational vs document vs graph, schema-on-read, and the query languages (SQL, MapReduce, Cypher, SPARQL, Datalog) that go with them.',
  },
  beats: DM_BEATS,
  scenes: {
    dmLayers: rDmLayers, dmRelational: rDmRelational, dmNoSQL: rDmNoSQL,
    dmMismatch: rDmMismatch, dmDocument: rDmDocument,
    dmManyOne: rDmManyOne, dmManyMany: rDmManyMany,
    dmHistory: rDmHistory, dmNetworkRel: rDmNetworkRel,
    dmSchema: rDmSchema, dmConvergence: rDmConvergence, dmProsCons: rDmProsCons,
    dmDeclImp: rDmDeclImp, dmWeb: rDmWeb, dmMapReduce: rDmMapReduce,
    dmGraphIntro: rDmGraphIntro, dmCypher: rDmCypher, dmTriples: rDmTriples,
    dmDatalog: rDmDatalog, dmSummary: rDmSummary,
  },
});
