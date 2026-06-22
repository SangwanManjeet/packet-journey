/* =====================================================================
   COURSE · Storage and Retrieval  (section: system-design)
   A story-first chapter adapted from "Designing Data-Intensive
   Applications", Chapter 3. The arc: the world's simplest database (an
   append-only log) -> indexes -> hash indexes (Bitcask) -> SSTables &
   LSM-trees -> B-trees -> B-tree vs LSM trade-offs -> other indexes
   (secondary, multi-dimensional, fuzzy) -> in-memory databases ->
   OLTP vs OLAP -> data warehouse & star schema -> column-oriented
   storage, compression, sort order, data cubes -> how to choose.
   ===================================================================== */

/* ----- the story beats (the narration script) ----- */
const SR_BEATS = [
  {ch:'Storage · Why?', scene:'srSimplest', ttl:'The world’s simplest database',
   txt:'<i>“Wer Ordnung hält, ist nur zu faul zum Suchen.”</i> A database does two things: you <b>give</b> it data, and later it <b>gives it back</b>. You can build one in two lines of Bash — <span class="mono">db_set</span> appends <span class="mono">key,value</span> to a file, <span class="mono">db_get</span> greps for the key and keeps the <b>last</b> match. <span class="hl">It actually works.</span>'},

  {ch:'Storage · Why?', scene:'srLog', ttl:'The log: brilliant writes, terrible reads',
   txt:'Appending to a file is about the <b>fastest</b> write there is, so <span class="mono">db_set</span> is genuinely good — many real databases keep an append-only <b>log</b> at their core. But <span class="mono">db_get</span> must scan the <b>whole file</b> every time: lookups are <b class="mono">O(n)</b>. Double the data, double the search time. <span class="hl">That won’t survive a million records.</span>'},

  {ch:'Storage · Why?', scene:'srIndex', ttl:'Add a signpost: the index',
   txt:'To find a key fast we keep extra metadata on the side — an <b>index</b>: a derived structure that acts as a <b>signpost</b> to the data. This is the central trade-off of storage engines: a well-chosen index <b>speeds up reads</b>, but <b>every index slows down writes</b>, because it too must be updated. So you choose indexes <i>deliberately</i>, never index everything.'},

  {ch:'Storage · Hash', scene:'srHash', ttl:'Hash index: a map of byte offsets',
   txt:'The simplest index: keep an <b>in-memory hash map</b> from every key to the <b>byte offset</b> where its value sits in the file. Write a pair → append to disk <i>and</i> update the map. Read → look up the offset, <b>seek</b>, read. This is essentially <b>Bitcask</b> (Riak): blazing reads and writes, <span class="hl">as long as all keys fit in RAM.</span>'},

  {ch:'Storage · Hash', scene:'srCompaction', ttl:'Don’t run out of disk: compaction',
   txt:'If we only ever append, the file grows forever. Fix: break the log into <b>segments</b> of fixed size, then <b>compact</b> — throw away duplicate keys, keep only the latest value per key. We can <b>merge</b> several segments at once in a background thread while still serving reads from the old ones. <span class="hl">Old keys evaporate; disk stays bounded.</span>'},

  {ch:'Storage · Hash', scene:'srHashLimits', ttl:'Where hash indexes break down',
   txt:'The append-only design is great — sequential writes, simple crash recovery, no fragmentation. But the hash table has two hard limits: <b>all keys must fit in memory</b> (an on-disk hash map is painful), and <b>range queries are impossible</b> — you can’t scan <span class="mono">kitty00000…kitty99999</span> without probing every key. <span class="hl">We need a structure without those limits.</span>'},

  {ch:'Storage · LSM', scene:'srSSTable', ttl:'Sort the segments: SSTables',
   txt:'One change unlocks everything: require each segment’s key-value pairs to be <b>sorted by key</b> — a <b>Sorted String Table (SSTable)</b>. Now merging is a <b>mergesort</b> (walk files side by side, emit the lowest key), and you no longer need every key in memory — a <b>sparse</b> index (one key per few KB) is enough. To find <span class="mono">handiwork</span>, jump to <span class="mono">handbag</span> and scan.'},

  {ch:'Storage · LSM', scene:'srMemtable', ttl:'How do writes get sorted? The memtable',
   txt:'Writes arrive in any order, so buffer them in an in-memory <b>balanced tree</b> (red-black / AVL) called the <b>memtable</b>. When it grows past a few MB, flush it to disk as a new SSTable — already sorted, so the write is sequential. To survive crashes, also append every write to a <b>log</b> first; discard it once the memtable is flushed.'},

  {ch:'Storage · LSM', scene:'srLSM', ttl:'Putting it together: the LSM-tree',
   txt:'A <b>memtable</b> plus a cascade of SSTables, merged in the background, is a <b>Log-Structured Merge-Tree</b> — the engine behind <b>LevelDB</b>, <b>RocksDB</b>, <b>Cassandra</b>, <b>HBase</b>, and <b>Lucene</b>. A <b>Bloom filter</b> skips disk reads for missing keys; <b>size-tiered</b> vs <b>leveled</b> compaction tune the merging. <span class="hl">Simple, and remarkably high write throughput.</span>'},

  {ch:'Storage · B-tree', scene:'srBtree', ttl:'The reigning champion: the B-tree',
   txt:'The most widely used index — in <b>every</b> relational database — is the <b>B-tree</b> (1970, still going). It also keeps keys sorted, but breaks the data into fixed-size <b>pages</b> (~4 KB), each pointing to child pages like on-disk pointers. To find key <span class="mono">251</span>, start at the root and follow the reference whose range <b>contains</b> it, down to a leaf. Depth is just <b class="mono">O(log n)</b>.'},

  {ch:'Storage · B-tree', scene:'srBtreeReliable', ttl:'Making B-trees crash-proof',
   txt:'B-trees <b>overwrite pages in place</b> — dangerous, because a split touches several pages and a crash mid-write corrupts the tree. The fix is a <b>write-ahead log (WAL / redo log)</b>: every change is appended there <i>before</i> touching the tree, so a crash can be replayed back to consistency. Concurrent access needs <b>latches</b> (lightweight locks).'},

  {ch:'Storage · Trade-offs', scene:'srCompare', ttl:'LSM-trees vs B-trees',
   txt:'Rule of thumb: <b>LSM-trees are faster for writes</b>, <b>B-trees faster for reads</b>. The key idea is <b>write amplification</b> — one logical write causing many physical disk writes (a B-tree writes the WAL <i>and</i> the page; LSM rewrites data during compaction). But benchmarks are fickle: <span class="hl">test with your own workload.</span>'},

  {ch:'Storage · Indexes', scene:'srSecondary', ttl:'Beyond the primary key',
   txt:'A <b>secondary index</b> lets you find rows by something other than the primary key (e.g. all rows for a <span class="mono">user_id</span>) — crucial for joins. The value an index points to is either the <b>row itself</b> (a <b>clustered</b> index) or a <b>reference</b> into a <b>heap file</b>; a <b>covering</b> index stores just enough columns to answer a query without the extra hop.'},

  {ch:'Storage · Indexes', scene:'srMultiDim', ttl:'Querying many columns at once',
   txt:'A <b>concatenated</b> index glues columns into one key — like a phone book sorted by <span class="mono">(lastname, firstname)</span> — but it can’t search by first name alone. For a map query (latitude <b>and</b> longitude together) a 1-D B-tree fails; you need a <b>multi-dimensional index</b> such as an <b>R-tree</b> (used by PostGIS). The same trick narrows <span class="mono">(date, temperature)</span> at once.'},

  {ch:'Storage · Indexes', scene:'srFuzzy', ttl:'Searching for what you almost typed',
   txt:'Exact indexes can’t handle <b>typos</b> or synonyms. <b>Full-text</b> engines like <b>Lucene</b> store their term dictionary in SSTable-like files, but the in-memory index is a <b>finite-state automaton</b> over characters. Turn it into a <b>Levenshtein automaton</b> and you can find every word within a given <b>edit distance</b> — <span class="hl">search becomes fuzzy.</span>'},

  {ch:'Storage · In memory', scene:'srInMemory', ttl:'Why bother with disk at all?',
   txt:'As RAM gets cheap, many datasets just <b>fit in memory</b>. <b>Memcached</b> accepts losing data on restart; <b>Redis</b>, <b>VoltDB</b>, and <b>RAMCloud</b> add durability via logs, snapshots, or replicas. Counter-intuitively their speed isn’t from skipping disk reads (the OS caches those anyway) — it’s from <b>not having to encode data into a disk-friendly form</b>.'},

  {ch:'Analytics · OLAP', scene:'srOltpOlap', ttl:'Two very different jobs',
   txt:'The same SQL serves two opposite patterns. <b>OLTP</b> (online transaction processing) is user-facing: huge request volume, each touching a <b>few rows by key</b> — disk <b>seek time</b> is the bottleneck. <b>OLAP</b> (analytics) scans <b>millions of rows</b> over a few columns to compute aggregates — disk <b>bandwidth</b> is the bottleneck. Mix them and both suffer.'},

  {ch:'Analytics · OLAP', scene:'srWarehouse', ttl:'A separate home for analytics',
   txt:'So analysts get their own read-only copy: the <b>data warehouse</b>. Data is pulled from every OLTP system, reshaped into an analysis-friendly schema, cleaned, and loaded — the <b>Extract–Transform–Load (ETL)</b> pipeline. Now business analysts can run heavy queries to their hearts’ content <span class="hl">without ever touching the live database.</span>'},

  {ch:'Analytics · OLAP', scene:'srStarSchema', ttl:'Stars and snowflakes',
   txt:'Warehouses are modelled in a formulaic way: a giant central <b>fact table</b> (one row per event — a sale, a click) surrounded by smaller <b>dimension tables</b> (the who/what/where/when) referenced by foreign keys. Drawn out, it looks like a <b>star</b>. Normalize the dimensions further and you get a <b>snowflake</b> — tidier, but analysts prefer the simpler star.'},

  {ch:'Analytics · OLAP', scene:'srColumn', ttl:'Store by column, not by row',
   txt:'A fact table may be 100+ columns wide, yet a query touches only 4 or 5. Row storage still drags every full row off disk. <b>Column-oriented storage</b> flips it: keep all values of <b>one column together</b>, so a query reads <b>only the columns it needs</b>. Each column file holds rows in the <b>same order</b>, so row 23 is the 23rd entry of every file.'},

  {ch:'Analytics · OLAP', scene:'srColCompress', ttl:'Columns compress beautifully',
   txt:'A single column repeats a lot — perfect for compression. <b>Bitmap encoding</b> turns a column of <span class="mono">n</span> distinct values into <span class="mono">n</span> bitmaps (one bit per row); sparse bitmaps then get <b>run-length encoded</b> into almost nothing. A <span class="mono">WHERE product_sk IN (30,68,69)</span> becomes a fast <b>bitwise OR</b>. This also keeps data in <b>L1 cache</b> for <b>vectorized</b> processing.'},

  {ch:'Analytics · OLAP', scene:'srCubes', ttl:'Sorting, and pre-baking the answers',
   txt:'A column store can be <b>sorted</b> by a chosen key (e.g. <span class="mono">date_key</span>) to speed range scans and compress the first column even further. Writes go via an <b>LSM-tree</b> (memtable → bulk-merge into columns). And for the hottest aggregates, pre-compute a <b>materialized view</b> or an <b>OLAP data cube</b> — a grid of sums grouped by dimensions. <span class="hl">Fast, but less flexible than raw data.</span>'},

  {ch:'Summary', scene:'srSummary', ttl:'Two worlds, two philosophies',
   txt:'Storage engines split in two. On <b>OLTP</b>, the <b>log-structured</b> school (Bitcask, LSM-trees, Cassandra, Lucene) only appends and merges, turning random writes into <b>sequential</b> ones; the <b>update-in-place</b> school (B-trees) overwrites fixed pages. On <b>OLAP</b>, <b>column-oriented</b> storage packs data tight to scan fast. <span class="hl">Know the internals, and you can pick — and tune — the right tool.</span>'},
];

/* ----- small shared helper for code / data panels ----- */
function srCode(s, color){
  return `<pre class="mono" style="margin:0;font-size:12px;line-height:1.55;color:${color||'#ffe3c2'};text-align:left;background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;overflow:auto;max-width:100%">${s}</pre>`;
}
const SR_ACCENT = '#f0932b';

/* ----- scene renderers (the visuals) — return HTML wrapped in .art ----- */
function rSrSimplest(){
  const fns = srCode(`db_set () {\n    echo "$1,$2" >> database\n}\n\ndb_get () {\n    grep "^$1," database | sed -e "s/^$1,//" | tail -n 1\n}`, '#a8e6cf');
  const file = srCode(`$ db_set 42 '{"name":"San Francisco"}'\n$ db_get 42\n{"name":"San Francisco"}\n\n# database (the whole storage engine):\n123456,{"name":"London", ...}\n42,{"name":"San Francisco", ...}`, '#ffe3c2');
  return `<div class="art" style="gap:14px">
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:flex-start">
      <div><div style="color:#a8e6cf;font-weight:700;font-size:12.5px;margin-bottom:6px">two Bash functions = a key-value store</div>${fns}</div>
      <div><div style="color:#ffd9a8;font-weight:700;font-size:12.5px;margin-bottom:6px">and it works</div>${file}</div>
    </div>
    <div class="farm-cap">Fundamentally a database <b>stores</b> what you give it and <b>returns</b> it later. The format is dead simple: a text file, one <span class="mono">key,value</span> line each, comma-separated like CSV. Every <span class="mono">db_set</span> just <b>appends</b>, so the <b>last</b> line for a key is the current value — hence the <span class="mono">tail -n 1</span>.</div>
  </div>`;
}

function rSrLog(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('⚡','Write: O(1)','Appending to the end of a file is the simplest, fastest write there is. Real databases keep an append-only <b>log</b> at their heart.')}
      ${infoCard('🐌','Read: O(n)','<span class="mono">db_get</span> scans the entire file end-to-end for every lookup. Double the records, double the wait.')}
      ${infoCard('📜','What is a “log”?','Not application logs — here it means an <b>append-only sequence of records</b>, possibly binary, written for machines to read.')}
    </div>
    <div class="farm-cap">The append-only log is a recurring hero of database design — sequential writes are <b>cheap</b>, concurrency and crash recovery are <b>simpler</b>. But raw scanning doesn’t scale: <span class="hl">to read fast, we need an index.</span></div>
  </div>`;
}

function rSrIndex(){
  return `<div class="art" style="gap:16px">${compareHtml(
    {color:'#00b894',icon:'🔖',title:'An index speeds up reads',sub:'a signpost beside the data',
     rows:[['🎯','Jump straight to the value — no full scan'],['🧭','Derived from the primary data, on the side'],['🔀','Different indexes for different query shapes'],['🗑️','Add or drop it without changing the data']],
     foot:'Reads get dramatically faster.'},
    {color:'#ff7675',icon:'🐢',title:'…but slows down writes',sub:'nothing is free',
     rows:[['✍️','Every write must update the index too'],['📦','Extra storage to maintain'],['⚖️','Plain appends are unbeatably fast'],['🙅','So don’t index everything by default']],
     foot:'You choose indexes deliberately.'}
  )}
    <div class="farm-cap">This is <b>the</b> fundamental trade-off of storage engines. An <b style="color:${SR_ACCENT}">index</b> keeps extra metadata that acts as a signpost to your data. Pick indexes from your knowledge of the app’s query patterns — enough benefit, not too much overhead.</div>
  </div>`;
}

function rSrHash(){
  const th=`text-align:left;padding:5px 12px;border:1px solid var(--line);font-size:11.5px;color:var(--muted);background:var(--panel2)`;
  const td=`padding:5px 12px;border:1px solid var(--line);font-size:12.5px`;
  const tdk=`padding:5px 12px;border:1px solid var(--line);font-size:12.5px;color:#ffd9a8;font-weight:600`;
  const map=`<div style="background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px">
    <div style="color:#81ecec;font-weight:700;margin-bottom:8px">🗺️ in-memory hash map</div>
    <table style="border-collapse:collapse">
      <tr><th style="${th}">key</th><th style="${th}">byte offset</th></tr>
      <tr><td style="${tdk}">42</td><td style="${td}">64</td></tr>
      <tr><td style="${tdk}">123456</td><td style="${td}">0</td></tr>
    </table></div>`;
  const log=srCode(`offset 0  → 123456,{"name":"London"}\noffset 64 → 42,{"name":"San Francisco"}`, '#ffe3c2');
  return `<div class="art" style="gap:14px">
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center">
      ${map}
      <div style="color:${SR_ACCENT};font-weight:700;font-size:13px">— seek →</div>
      <div><div style="color:#ffd9a8;font-weight:700;font-size:12.5px;margin-bottom:6px">💾 data file on disk</div>${log}</div>
    </div>
    <div class="farm-cap">Map every key to the <b>byte offset</b> of its value in the file. Write → append <i>and</i> update the map; read → look up the offset, <b>seek</b>, read one value. This is <b style="color:${SR_ACCENT}">Bitcask</b> (Riak’s default): superb when one key is updated often — <span class="hl">as long as all keys fit in RAM.</span></div>
  </div>`;
}

function rSrCompaction(){
  const before=srCode(`segment 1   |   segment 2\nmew: 1078   |   mew: 1079\npurr: 2103  |   purr: 2104\nmew: 1079   |   yawn: 511\npurr: 2104  |   purr: 2105`, '#ffb8b8');
  const after=srCode(`merged + compacted segment\nmew:  1079\npurr: 2105\nyawn: 511`, '#a8e6cf');
  return `<div class="art" style="gap:14px">
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center">
      <div><div style="color:#ffb8b8;font-weight:700;font-size:12.5px;margin-bottom:6px">before — duplicates pile up</div>${before}</div>
      <div style="color:${SR_ACCENT};font-weight:700;font-size:22px">♻️→</div>
      <div><div style="color:#a8e6cf;font-weight:700;font-size:12.5px;margin-bottom:6px">after — latest value per key</div>${after}</div>
    </div>
    <div class="farm-cap">Counting cat-video plays, the same keys are rewritten constantly. Close a segment at a fixed size, then <b>compact</b> it (keep only the newest value per key) and <b>merge</b> adjacent segments — in a <b>background thread</b>, while old segments still serve reads. Segments are immutable, so the merge writes a fresh file and the old ones are deleted.</div>
  </div>`;
}

function rSrHashLimits(){
  return `<div class="art" style="gap:16px">${compareHtml(
    {color:'#00b894',icon:'✅',title:'Why append-only wins',sub:'the log design pays off',
     rows:[['🚀','Sequential writes — far faster than random'],['🛟','Crash recovery is simple (no half-overwrites)'],['🧹','Merging avoids file fragmentation'],['🧵','One writer; segments read concurrently']],
     foot:'A surprisingly strong foundation.'},
    {color:'#ff7675',icon:'⛔',title:'Where hash indexes break',sub:'two hard limits',
     rows:[['🧠','<b>All keys must fit in memory</b>'],['💽','On-disk hash maps perform poorly'],['📈','Expensive to grow; collisions are fiddly'],['🔎','<b>No range queries</b> — can’t scan a span of keys']],
     foot:'We need a structure without these.'}
  )}
    <div class="farm-cap">You can’t scan <span class="mono">kitty00000…kitty99999</span> without probing every key individually, and a huge keyspace simply won’t fit in RAM. <span class="hl">The next idea fixes both — by keeping data sorted.</span></div>
  </div>`;
}

function rSrSSTable(){
  const seg=srCode(`SSTable segment (sorted by key)\n...\nhandbag   → offset 4 0086\nhandcuffs → offset 4 0092\nhandful   → offset 4 0103\nhandiwork → offset 4 0116   ← target\nhandkerchief\nhandlebars\nhandprinted\nhandsome  → offset 4 0210`, '#ffe3c2');
  const idx=`<div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px">
    <div style="color:#81ecec;font-weight:700;font-size:12px;margin-bottom:8px">sparse in-memory index</div>
    <div class="mono" style="font-size:12px;line-height:1.7">handbag  → 40086<br>handsome → 40210<br><span style="color:var(--muted)">…one key per few KB</span></div></div>`;
  return `<div class="art" style="gap:14px">
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:flex-start">
      ${idx}
      <div style="color:${SR_ACCENT};font-weight:700;font-size:13px;align-self:center">→ scan →</div>
      <div>${seg}</div>
    </div>
    <div class="farm-cap">Require each segment <b>sorted by key</b> — a <b style="color:${SR_ACCENT}">Sorted String Table</b>. Looking for <span class="mono">handiwork</span> without its exact offset? You know <span class="mono">handbag</span> and <span class="mono">handsome</span>, and sorting guarantees it lies <b>between</b> them — jump to <span class="mono">handbag</span> and scan. Merging is now a simple <b>mergesort</b>, and the index can be <b>sparse</b>.</div>
  </div>`;
}

function rSrMemtable(){
  const box=(icon,t,sub,c)=>`<div style="background:var(--panel);border:1px solid ${c};border-radius:12px;padding:9px 14px;text-align:center;min-width:120px">
    <div style="font-size:22px">${icon}</div><div style="font-weight:700;color:${c};font-size:13px">${t}</div><div style="color:var(--muted);font-size:11px">${sub}</div></div>`;
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:center">
      ${box('✍️','write','any order','#74b9ff')}
      <div class="tier-arrow">→</div>
      ${box('🌳','memtable','balanced tree, in RAM','#fdcb6e')}
      <div class="tier-arrow">→ flush at ~MB →</div>
      ${box('🔤','SSTable','sorted, on disk','#00b894')}
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:center">
      ${box('📜','append-only log','crash safety net','#e17055')}
      <div style="color:var(--muted);font-size:11.5px">every write also lands here first — discarded once the memtable is flushed</div>
    </div>
    <div class="farm-cap">Writes arrive unsorted, so buffer them in an in-memory <b>red-black / AVL tree</b> — the <b style="color:#fdcb6e">memtable</b>. When it’s big enough, write it out as a sorted SSTable in one <b>sequential</b> pass. A separate <b>log</b> guards the not-yet-flushed writes against a crash.</div>
  </div>`;
}

function rSrLSM(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
      <div style="background:var(--panel2);border:1px solid #fdcb6e;border-radius:9px;padding:5px 14px;font-size:12px;font-weight:700;color:#fdcb6e">🌳 memtable (RAM)</div>
      <div style="color:#3a4170">│ flush ▾</div>
      <div style="display:flex;gap:8px;align-items:center">
        <div style="background:var(--panel2);border:1px solid #00b894;border-radius:7px;padding:4px 10px;font-size:11px;color:#a8e6cf">SSTable</div>
        <div style="background:var(--panel2);border:1px solid #00b894;border-radius:7px;padding:4px 10px;font-size:11px;color:#a8e6cf">SSTable</div>
        <div style="color:${SR_ACCENT};font-weight:700">♻️ merge</div>
        <div style="background:var(--panel2);border:1px solid #0984e3;border-radius:7px;padding:4px 10px;font-size:11px;color:#81ecec">big SSTable</div>
      </div>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('🌸','Bloom filter','A tiny set-membership structure: tells you a key is <b>definitely absent</b>, saving pointless disk reads for missing keys.')}
      ${infoCard('🏗️','Compaction','<b>Size-tiered</b> (HBase) merges small into big; <b>leveled</b> (LevelDB, RocksDB) splits keys into levels — less disk, more incremental.')}
      ${infoCard('🚀','Throughput','Sequential SSTable writes + range-scannable sorted data = <b>very high write throughput.</b>')}
    </div>
    <div class="farm-cap">A cascade of SSTables merged in the background is a <b style="color:${SR_ACCENT}">Log-Structured Merge-Tree</b> — powering <b>LevelDB, RocksDB, Cassandra, HBase</b> and <b>Lucene</b>. Even when the dataset dwarfs memory, it keeps working well.</div>
  </div>`;
}

function rSrBtree(){
  const stroke=SR_ACCENT;
  const svg=`<svg width="500" height="250" viewBox="0 0 500 250" style="max-width:100%;height:auto">
    <line x1="250" y1="58" x2="170" y2="108" stroke="#3a4170" stroke-width="2"/>
    <line x1="250" y1="58" x2="320" y2="108" stroke="${stroke}" stroke-width="3"/>
    <line x1="250" y1="58" x2="430" y2="108" stroke="#3a4170" stroke-width="2"/>
    <line x1="320" y1="150" x2="300" y2="190" stroke="${stroke}" stroke-width="3"/>
    <g><rect x="150" y="30" width="200" height="30" rx="6" fill="#241b34" stroke="#74b9ff" stroke-width="2"/>
       <text x="250" y="50" fill="#fff" font-size="12" text-anchor="middle">root · 100 | 200 | 300 | 400</text></g>
    <g><rect x="95" y="108" width="150" height="30" rx="6" fill="#1f1b3a" stroke="#3a4170" stroke-width="2"/>
       <text x="170" y="128" fill="#8a8fa3" font-size="11" text-anchor="middle">…&lt;200…</text></g>
    <g><rect x="250" y="108" width="150" height="30" rx="6" fill="#241b34" stroke="${stroke}" stroke-width="2.5"/>
       <text x="325" y="128" fill="#fff" font-size="11" text-anchor="middle">200 | 250 | 270 | 290</text></g>
    <g><rect x="360" y="108" width="130" height="30" rx="6" fill="#1f1b3a" stroke="#3a4170" stroke-width="2"/>
       <text x="425" y="128" fill="#8a8fa3" font-size="11" text-anchor="middle">…&gt;300…</text></g>
    <g><rect x="235" y="190" width="130" height="32" rx="6" fill="#102b2b" stroke="#00b894" stroke-width="2.5"/>
       <text x="300" y="210" fill="#fff" font-size="11.5" text-anchor="middle">leaf · 250 251 252</text></g>
    <text x="300" y="240" fill="#ffd9a8" font-size="11" text-anchor="middle">looking up key 251 → follow 200–300 → leaf</text>
  </svg>`;
  return `<div class="art" style="gap:14px">
    ${svg}
    <div class="farm-cap">The <b style="color:${SR_ACCENT}">B-tree</b> breaks data into fixed-size <b>pages</b> (~4 KB), each holding keys and <b>references</b> to child pages — pointers, but on disk. Start at the <b>root</b>, follow the reference whose range contains your key, down to a <b>leaf</b>. The <b>branching factor</b> is often several hundred, so a 4-level tree holds ~250 TB and stays <b class="mono">O(log n)</b>.</div>
  </div>`;
}

function rSrBtreeReliable(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('✏️','Overwrite in place','A B-tree writes new data <b>onto the same page location</b> — unlike LSM-trees, which only append and never modify files.')}
      ${infoCard('💥','The danger','A page split touches several pages at once; a crash halfway leaves an <b>orphan</b> page and a corrupted index.')}
      ${infoCard('📒','Write-ahead log','Append every change to a <b>WAL / redo log</b> <i>before</i> touching the tree, so a crash replays back to a consistent state.')}
      ${infoCard('🔒','Latches','Lightweight locks protect the tree so concurrent threads never see it mid-update.')}
    </div>
    <div class="farm-cap">In-place updates are powerful but fragile, so reliability is bolted on. Some engines even use <b>copy-on-write</b> (LMDB) instead of a WAL, writing a modified page to a new location — which doubles as <b>concurrency control</b>.</div>
  </div>`;
}

function rSrCompare(){
  return `<div class="art">${compareHtml(
    {color:'#00b894',icon:'🚀',title:'LSM-trees',sub:'log-structured · append & merge',
     rows:[['✍️','Typically <b>faster writes</b>, higher throughput'],['🗜️','Compress better — smaller files, less fragmentation'],['🔁','Lower write amplification (sequential SSTables)'],['⚠️','Reads check several SSTables; compaction can stall queries']],
     foot:'Great for write-heavy workloads.'},
    {color:'#0984e3',icon:'🌲',title:'B-trees',sub:'update-in-place · fixed pages',
     rows:[['⚡','Typically <b>faster, more predictable reads</b>'],['🎯','Each key lives in exactly <b>one</b> place'],['🔐','Range locks attach to the tree — strong transactions'],['📝','Writes twice (WAL + page); page-level write amplification']],
     foot:'The mature relational default.'}
  )}
    <div class="farm-cap"><b style="color:${SR_ACCENT}">Write amplification</b> — one logical write causing many physical disk writes — is the crux, and matters most on SSDs (limited erase cycles). But results swing with the workload: <span class="hl">there’s no universal winner — benchmark with your own data.</span></div>
  </div>`;
}

function rSrSecondary(){
  const tier=(label,row,desc,col)=>`<div class="tier" style="border-color:${col}">
    <div class="tlabel">${label}</div>
    <div class="trow" style="font-size:14px;letter-spacing:normal">${row}</div>
    <div class="tdesc">${desc}</div></div>`;
  return `<div class="art" style="gap:8px">
    ${tier('Heap file + reference','🗃️ index → location → row stored elsewhere','One copy of the row; many secondary indexes just point at it. Updating a bigger value may move it (or leave a forwarding pointer).','#74b9ff')}
    ${tier('Clustered index','📌 index stores the whole row inline','Skips the extra hop to the heap. In MySQL’s InnoDB the primary key is always clustered; secondary indexes point at it.','#00b894')}
    ${tier('Covering index','🧩 index stores just enough columns','Some queries are answered by the index <b>alone</b> — it “covers” the query. Faster reads, more storage, heavier writes.',`${SR_ACCENT}`)}
    <div class="farm-cap">A <b>secondary index</b> finds rows by something other than the primary key — vital for joins. Its indexed values needn’t be unique, so an entry maps to a <b>list</b> of rows. Both B-trees and LSM-trees can serve as secondary indexes; the question is whether to <b>store the row</b> or just <b>point</b> to it.</div>
  </div>`;
}

function rSrMultiDim(){
  const sql=srCode(`-- the map viewport: two ranges at once\nSELECT * FROM restaurants WHERE\n  latitude  > 51.4946 AND latitude  < 51.5079 AND\n  longitude > -0.1162 AND longitude < -0.1004;`, '#a8e6cf');
  return `<div class="art" style="gap:14px">
    ${sql}
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('📖','Concatenated index','Glue columns into one key — (lastname, firstname). Finds by last name, or last+first — but <b>never first name alone</b>.')}
      ${infoCard('🧭','1-D index can’t','A B-tree gives you a latitude range <i>or</i> a longitude range — not both narrowed at once.')}
      ${infoCard('🌍','R-tree (multi-D)','Specialized spatial indexes (PostGIS) narrow both dimensions together. The same trick fits <span class="mono">(date, temperature)</span>.')}
    </div>
    <div class="farm-cap">Querying several columns <b>simultaneously</b> needs a <b style="color:${SR_ACCENT}">multi-dimensional index</b> — or a space-filling curve mapped onto a regular B-tree. Not just for maps: a 2-D index on <span class="mono">(date, temperature)</span> answers “all of 2013 between 25–30℃” without scanning the whole year.</div>
  </div>`;
}

function rSrFuzzy(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:center">
      <div style="background:var(--panel2);border:1px solid var(--line);border-radius:9px;padding:6px 12px;color:#ffb8b8" class="mono">"hadniwork"</div>
      <div style="color:${SR_ACCENT};font-weight:700">edit distance 1 →</div>
      <div style="background:var(--panel2);border:1px solid #00b894;border-radius:9px;padding:6px 12px;color:#a8e6cf" class="mono">"handiwork"</div>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('🔤','Term dictionary','Lucene stores terms in <b>SSTable-like</b> sorted files, merged in the background like an LSM-tree.')}
      ${infoCard('🧬','FSA index','Its in-memory index isn’t sparse keys but a <b>finite-state automaton</b> over the characters — a trie.')}
      ${infoCard('🪄','Levenshtein','Transform it into a <b>Levenshtein automaton</b> and it matches every word within an <b>edit distance</b>.')}
    </div>
    <div class="farm-cap">Exact indexes can’t cope with typos or synonyms. <b style="color:${SR_ACCENT}">Fuzzy</b> search — one added, removed, or replaced letter is edit distance 1 — needs different machinery; beyond that lies document classification and machine learning.</div>
  </div>`;
}

function rSrInMemory(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('🧊','Cache-only','<b>Memcached</b> is happy to lose data on restart — pure caching.')}
      ${infoCard('🛟','Durable in-memory','<b>Redis, VoltDB, RAMCloud</b> add durability via logs, snapshots, or replicas — disk as an append-only safety net.')}
      ${infoCard('⚡','Why it’s fast','Not from avoiding disk reads (the OS caches those) — but from <b>not encoding data into a disk-friendly form</b>.')}
      ${infoCard('🧠','Anti-caching','Evict least-recently-used records to disk, reload on access — extending in-memory DBs beyond RAM (indexes still must fit).')}
    </div>
    <div class="farm-cap">When a dataset simply <b>fits in memory</b>, an in-memory database removes the overhead of on-disk structures. It also unlocks data models that are awkward on disk — Redis serves priority queues and sets precisely because everything lives in RAM.</div>
  </div>`;
}

function rSrOltpOlap(){
  return `<div class="art">${compareHtml(
    {color:'#0984e3',icon:'🛒',title:'OLTP — transaction processing',sub:'running the live application',
     rows:[['👥','User-facing, huge volume of requests'],['🎯','A few records per query, fetched by key'],['✍️','Random-access, low-latency writes'],['⏱️','Bottleneck: disk <b>seek time</b>']],
     foot:'Latest state · GB→TB.'},
    {color:'#e17055',icon:'📊',title:'OLAP — analytics',sub:'decision support for analysts',
     rows:[['🧑‍💼','Internal analysts, low query volume'],['📈','Scan millions of rows, a few columns, aggregate'],['📥','Bulk import (ETL) or event streams'],['🚿','Bottleneck: disk <b>bandwidth</b>']],
     foot:'History of events · TB→PB.'}
  )}
    <div class="farm-cap">A <b>transaction</b> here just means a low-latency group of reads/writes (not necessarily ACID). The same indexes that shine for <b style="color:#0984e3">OLTP</b> are poor at <b style="color:#e17055">OLAP</b> — so analytics moved to its own optimized home.</div>
  </div>`;
}

function rSrWarehouse(){
  const box=(icon,t,sub,c)=>`<div style="background:var(--panel);border:1px solid ${c};border-radius:12px;padding:9px 14px;text-align:center;min-width:110px">
    <div style="font-size:22px">${icon}</div><div style="font-weight:700;color:${c};font-size:12.5px">${t}</div><div style="color:var(--muted);font-size:10.5px">${sub}</div></div>`;
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center">
      <div style="display:flex;flex-direction:column;gap:6px">
        ${box('🛒','POS','sales','#74b9ff')}
        ${box('📦','Inventory','stock','#74b9ff')}
        ${box('👤','CRM','customers','#74b9ff')}
      </div>
      <div class="tier-arrow">→ Extract →</div>
      ${box('🧼','Transform','clean &amp; reshape',`${SR_ACCENT}`)}
      <div class="tier-arrow">→ Load →</div>
      ${box('🏭','Warehouse','read-only copy','#e17055')}
    </div>
    <div class="farm-cap">A <b style="color:#e17055">data warehouse</b> is a separate, read-only copy of all the company’s OLTP data, so analysts can run heavy queries <b>without harming the live systems</b>. Getting it there is the <b style="color:${SR_ACCENT}">Extract–Transform–Load (ETL)</b> pipeline. Common in big enterprises, almost unheard-of in small ones.</div>
  </div>`;
}

function rSrStarSchema(){
  const svg=`<svg width="500" height="260" viewBox="0 0 500 260" style="max-width:100%;height:auto">
    <line x1="250" y1="130" x2="120" y2="50"  stroke="#3a4170" stroke-width="2"/>
    <line x1="250" y1="130" x2="380" y2="50"  stroke="#3a4170" stroke-width="2"/>
    <line x1="250" y1="130" x2="80"  y2="200" stroke="#3a4170" stroke-width="2"/>
    <line x1="250" y1="130" x2="250" y2="222" stroke="#3a4170" stroke-width="2"/>
    <line x1="250" y1="130" x2="420" y2="200" stroke="#3a4170" stroke-width="2"/>
    <g><rect x="180" y="108" width="140" height="46" rx="9" fill="#2b1c10" stroke="${SR_ACCENT}" stroke-width="2.5"/>
       <text x="250" y="128" fill="#fff" font-size="12.5" text-anchor="middle">fact_sales</text>
       <text x="250" y="144" fill="#ffd9a8" font-size="9" text-anchor="middle">one row per event</text></g>
    ${[['dim_date',120,50],['dim_product',380,50],['dim_store',80,200],['dim_customer',250,222],['dim_promotion',420,200]].map(([n,x,y])=>
      `<g><rect x="${x-58}" y="${y-16}" width="116" height="32" rx="8" fill="#1f1b3a" stroke="#74b9ff" stroke-width="2"/>
       <text x="${x}" y="${y+4}" fill="#cfe3ff" font-size="11" text-anchor="middle">${n}</text></g>`).join('')}
  </svg>`;
  return `<div class="art" style="gap:14px">
    ${svg}
    <div class="farm-cap">A central <b style="color:${SR_ACCENT}">fact table</b> (often 100+ columns, billions of rows — a sale, a click) is ringed by smaller <b style="color:#74b9ff">dimension tables</b> capturing the who/what/where/when via foreign keys. The shape is a <b>star</b>. Break dimensions into sub-dimensions and it becomes a <b>snowflake</b> — more normalized, but analysts usually prefer the simpler star.</div>
  </div>`;
}

function rSrColumn(){
  const th=`text-align:left;padding:3px 8px;border:1px solid var(--line);font-size:10.5px;color:var(--muted);background:var(--panel2)`;
  const td=`padding:3px 8px;border:1px solid var(--line);font-size:11px`;
  const row=`<table style="border-collapse:collapse"><tr><th style="${th}">date</th><th style="${th}">product</th><th style="${th}">qty</th><th style="${th}">…97 more</th></tr>
    <tr><td style="${td}">140102</td><td style="${td}">69</td><td style="${td}">1</td><td style="${td}">…</td></tr>
    <tr><td style="${td}">140102</td><td style="${td}">69</td><td style="${td}">3</td><td style="${td}">…</td></tr></table>`;
  const col=`<div class="mono" style="font-size:11px;line-height:1.7;text-align:left">
    <span style="color:#74b9ff">date:</span> 140102, 140102, 140103…<br>
    <span style="color:#00b894">product:</span> 69, 69, 74, 31…<br>
    <span style="color:${SR_ACCENT}">qty:</span> 1, 3, 1, 9…</div>`;
  return `<div class="art" style="gap:14px">
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center">
      <div><div style="color:#ff9f9f;font-weight:700;font-size:12px;margin-bottom:6px">row-oriented — drags whole rows</div>${row}</div>
      <div style="color:${SR_ACCENT};font-weight:700;font-size:20px">↦</div>
      <div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px"><div style="color:#a8e6cf;font-weight:700;font-size:12px;margin-bottom:6px">column-oriented — read only what you need</div>${col}</div>
    </div>
    <div class="farm-cap">A query that needs 3 of 100 columns shouldn’t read the other 97. <b style="color:${SR_ACCENT}">Column storage</b> keeps each column’s values together in its own file. Every column file lists rows in the <b>same order</b>, so you reassemble row 23 by taking the 23rd entry from each. (Parquet brings this to document data too.)</div>
  </div>`;
}

function rSrColCompress(){
  const bm=srCode(`product_sk values:  69 69 74 31 31 31 68 69 ...\n\nbitmap product_sk=69:  1 1 0 0 0 0 0 1 ...\nbitmap product_sk=31:  0 0 0 1 1 1 0 0 ...\n\nrun-length (sparse):   69 → 1×2, 0×5, 1×1, ...`, '#ffe3c2');
  return `<div class="art" style="gap:14px">
    ${bm}
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('🎛️','Bitmap encoding','Few distinct values? Make one <b>bitmap per value</b>, one bit per row. Sparse bitmaps → <b>run-length encoded</b> to near nothing.')}
      ${infoCard('🔢','Fast WHERE','<span class="mono">IN (30,68,69)</span> = bitwise <b>OR</b> of three bitmaps; <span class="mono">a AND b</span> = bitwise AND — the kth bit is always the same row.')}
      ${infoCard('🏎️','Vectorized','Compressed columns fit in <b>L1 cache</b>; operators run in tight loops over chunks — <b>vectorized processing</b>.')}
    </div>
    <div class="farm-cap">Columns repeat, so they compress wonderfully. A retailer with billions of sales but only 100,000 products turns each column into a handful of <b>bitmaps</b> — slashing both disk volume and the memory-to-CPU bandwidth a scan needs.</div>
  </div>`;
}

function rSrCubes(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('🔤','Sort the rows','Sort the whole table by a chosen key (e.g. <span class="mono">date_key</span>) to speed range scans — and the <b>first</b> sort column compresses to a few KB via run-length.')}
      ${infoCard('✍️','Writes via LSM','You can’t update compressed columns in place, so writes buffer in a memtable and bulk-merge into the column files — exactly Vertica’s approach.')}
      ${infoCard('🗃️','Materialized view','Cache a query’s results on disk; faster reads, but it must be refreshed when the source data changes.')}
      ${infoCard('🧊','Data cube','A grid of aggregates by dimension — totals are <b>precomputed</b>, so “sales per store yesterday” is instant.')}
    </div>
    <div class="farm-cap">Pre-baking aggregates is a big speed-up, but a <b style="color:${SR_ACCENT}">data cube</b> is rigid — it can’t answer a question about a dimension it didn’t precompute (like “sales of items over $100”). So warehouses keep the <b>raw</b> data and use cubes only as a turbo for the hottest queries.</div>
  </div>`;
}

function rSrSummary(){
  return `<div class="art" style="gap:16px">
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center;color:var(--muted);font-size:12.5px">
      <span style="color:#00b894;font-weight:700">log-structured</span> vs
      <span style="color:#0984e3;font-weight:700">update-in-place</span> · then
      <span style="color:#e17055;font-weight:700">column-oriented for analytics</span>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:900px">
      ${infoCard('📜','Log-structured (OLTP)','Only append &amp; merge — Bitcask, SSTables, LSM-trees, LevelDB, Cassandra, HBase, Lucene. Turns random writes into <b>sequential</b> ones.')}
      ${infoCard('🌲','Update-in-place (OLTP)','Disk as fixed-size pages, overwritten in place — <b>B-trees</b>, the backbone of every relational database.')}
      ${infoCard('🧱','Column-oriented (OLAP)','Encode data <b>compactly</b> and scan only the needed columns — the rising answer for analytics.')}
    </div>
    <div class="farm-cap">You won’t write a storage engine, but knowing what one does <b>under the hood</b> lets you pick the right tool and reason about its tuning knobs. <span class="hl">The model fits the workload — transactional or analytical.</span></div>
  </div>`;
}

/* ----- register this building block with the app ----- */
App.registerCourse({
  key: 'storage-retrieval',
  section: 'systemdesign',
  card: {
    icon: '💾', color: SR_ACCENT, title: 'Storage & Retrieval',
    blurb: 'How databases actually store and find data — append-only logs, hash indexes, LSM-trees vs B-trees, secondary/multi-dimensional/fuzzy indexes, and the column-oriented world of analytics.',
  },
  beats: SR_BEATS,
  scenes: {
    srSimplest: rSrSimplest, srLog: rSrLog, srIndex: rSrIndex,
    srHash: rSrHash, srCompaction: rSrCompaction, srHashLimits: rSrHashLimits,
    srSSTable: rSrSSTable, srMemtable: rSrMemtable, srLSM: rSrLSM,
    srBtree: rSrBtree, srBtreeReliable: rSrBtreeReliable, srCompare: rSrCompare,
    srSecondary: rSrSecondary, srMultiDim: rSrMultiDim, srFuzzy: rSrFuzzy,
    srInMemory: rSrInMemory,
    srOltpOlap: rSrOltpOlap, srWarehouse: rSrWarehouse, srStarSchema: rSrStarSchema,
    srColumn: rSrColumn, srColCompress: rSrColCompress, srCubes: rSrCubes,
    srSummary: rSrSummary,
  },
});



