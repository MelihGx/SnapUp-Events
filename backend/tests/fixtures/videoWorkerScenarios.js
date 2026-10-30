"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createVideoWorker } = require("../../services/videoWorkerService");
const { runReconcile } = require("../../scripts/r2Reconcile");
module.exports = async function videoWorkerScenarios({ t, sql, connect, workerConnection, testEnv }) {
  const migration = await fs.readFile(path.join(__dirname, "../../database/2026-10-30-video-worker-safety.sql"), "utf8");
  const event = "90000000-0000-0000-0000-000000000001", guest = "a0000000-0000-0000-0000-000000000001";
  const q = (v) => v === null ? "null" : `'${String(typeof v === "object" ? JSON.stringify(v) : v).replaceAll("'", "''")}'`;
  const statement = (name, args) => `select public.${name}(${Object.values(args).map(q).join(",")})::text`;
  const call = async (name, args) => JSON.parse(await sql(statement(name, args)) || "null");
  const count = async (table) => Number(await sql(`select count(*) from public.${table}`));
  const consumed = async () => Number(await sql(`select storage_consumed_bytes from public.event where event_id='${event}'`));
  async function reset() {
    await sql("truncate public.media,public.video_processing_jobs,public.event_settings,public.event_guests,public.event,public.upload_quota_reservations,public.upload_admission_leases cascade");
    await sql(`insert into public.event(event_id,storage_consumed_bytes) values('${event}',100);
      insert into public.event_guests(guest_id,event_id) values('${guest}','${event}');
      insert into public.event_settings(event_id,max_upload_per_guest) values('${event}',null)`);
    bucket.clear();
  }
  async function queue(status = "queued") {
    const id = crypto.randomUUID(), prefix = `events/${event}/media/${id}`;
    await sql(`insert into public.video_processing_jobs(job_id,event_id,guest_id,status,target_media_status,original_key,display_key,poster_key,original_bytes)
      values('${id}','${event}','${guest}','${status}','pending','${prefix}/original.mp4','${prefix}/display.mp4','${prefix}/poster.webp',100)`);
    return id;
  }
  const own = (j) => ({ p_job: j.job_id, p_owner: j.worker_owner, p_generation: j.worker_generation });
  const claim = (owner = crypto.randomUUID()) => call("claim_video_job", { p_owner: owner, p_lease_seconds: 30 });
  const expire = (id) => sql(`update public.video_processing_jobs set worker_lease_expires_at=clock_timestamp()-interval '1 second' where job_id='${id}'`);
  const media = (j) => ({ media_id: j.job_id, event_id: event, guest_id: guest, media_type_id: 2, media_url: `https://fake.invalid/${j.worker_display_key}`,
    media_status: "pending", bytes: 100, storage_provider: "r2", r2_original_key: j.original_key,
    r2_display_key: j.worker_display_key, r2_poster_key: j.worker_poster_key, display_bytes: 10 });
  const publish = (j) => call("publish_video_job", { ...own(j), p_media: media(j) });
  const bucket = new Map();
  const gate = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
  async function render(options) {
    assert.equal(options.preserveOnError, true); options.assertValid();
    bucket.set(options.displayKey, "display"); bucket.set(options.posterKey, "poster");
    return { displayUrl: `https://fake.invalid/${options.displayKey}`, displayBytes: 10, durationSeconds: 1, originalWidth: 10, originalHeight: 10 };
  }
  const db = { rpc(name, args) { return { async abortSignal() {
    try { return { data: await call(name, args) }; } catch (_) { return { error: { code: "INJECTED_OR_DB_ERROR" } }; }
  } }; } };
  const worker = (extra = {}) => createVideoWorker({ supabase: db, processVideo: render, getVideoMediaTypeId: async () => 2,
    leaseSeconds: 30, heartbeatMs: 5000, rpcTimeoutMs: 2000, log() {}, ...extra });

  await t.test("PATCH 7 migration preserves legacy queued/processing/ready rows and rejects replay transactionally", async () => {
    await reset(); await queue(); await queue("processing"); await queue("ready");
    const before = await sql("select jsonb_agg(to_jsonb(j) order by job_id)::text from public.video_processing_jobs j");
    const rollback6=await fs.readFile(path.join(__dirname,"../../database/rollback/2026-10-30-quota-event-locks.sql"),"utf8");
    const forward6=await fs.readFile(path.join(__dirname,"../../database/2026-10-30-quota-event-locks.sql"),"utf8");
    await sql(rollback6);
    try { await assert.rejects(sql(migration),/PATCH 7 requires PATCH 6/); }
    finally { await sql(forward6); }
    assert.equal(await sql("select to_regclass('public.video_worker_attempts') is null"),"t");
    await sql(migration);
    const after = await sql("select jsonb_agg(to_jsonb(j)-'worker_owner'-'worker_generation'-'worker_lease_expires_at' order by job_id)::text from public.video_processing_jobs j");
    assert.deepEqual(JSON.parse(after), JSON.parse(before));
    await assert.rejects(sql(migration)); assert.equal(await count("video_processing_jobs"), 3); assert.equal(await consumed(), 100);
  });
  assert.equal(await sql("select to_regclass('public.video_worker_attempts') is not null"), "t", "Stop dependent scenarios if migration failed");
  await t.test("PATCH 7 normal worker publishes media/job/attempt atomically and consumes no additional quota", async () => {
    await reset(); await queue(); assert.equal(await worker().runOnce(), true);
    assert.equal(await sql("select status from public.video_processing_jobs"), "ready");
    assert.equal(await sql("select state from public.video_worker_attempts order by created_at desc limit 1"), "committed");
    assert.equal(await sql("select media_status from public.media"), "pending"); assert.equal(await consumed(), 100);
  });
  await t.test("PATCH 7 actual quota finalize after migration queues video and charges once across worker publication", async () => {
    await reset(); await sql(`update public.event set storage_consumed_bytes=0 where event_id='${event}'`);
    const owner="c".repeat(64),lease=crypto.randomUUID(),id=crypto.randomUUID(),asset=crypto.randomUUID();
    const prefix=`events/${event}/media/${asset}`;
    const manifest={kind:"video",asset_id:asset,bytes:100,original_key:`${prefix}/original.mp4`,display_key:`${prefix}/display.mp4`,poster_key:`${prefix}/poster.webp`};
    await call("acquire_upload_admission",{lease,owner,event,guest});
    await call("reserve_upload_quota",{id,lease,owner,event,guest,key:crypto.randomUUID(),fingerprint:"b".repeat(64),bytes:100,count:1,assets:[manifest]});
    const args={id,owner,media:[],jobs:[{event_id:event,guest_id:guest,target_media_status:"pending",original_key:manifest.original_key,display_key:manifest.display_key,poster_key:manifest.poster_key,original_bytes:100}]};
    const accepted=await call("finalize_upload_quota",args);
    assert.equal(accepted.video_jobs.length,1); assert.equal(await consumed(),100);
    assert.equal(await sql("select worker_generation from public.video_processing_jobs"),"0");
    await worker().runOnce(); assert.equal(await count("media"),1); assert.equal(await consumed(),100);
    assert.deepEqual(await call("finalize_upload_quota",args),accepted); assert.equal(await consumed(),100);
  });
  await t.test("PATCH 7 two independent claim connections have exactly one valid owner", async () => {
    await reset(); await queue(); const results = await Promise.all([claim(), claim()]);
    assert.equal(results.filter(Boolean).length, 1); assert.equal(await sql("select worker_generation from public.video_processing_jobs"), "1");
  });
  await t.test("PATCH 7 starting worker B preserves worker A live lease", async () => {
    await reset(); await queue(); const a = await claim();
    assert.equal(await worker().runOnce(), false); assert.equal(await claim(), null);
    assert.equal(await sql("select worker_owner::text from public.video_processing_jobs"), a.worker_owner);
  });
  await t.test("PATCH 7 expired crashed claim is taken over with new generation and isolated keys", async () => {
    await reset(); const id = await queue(); const a = await claim(); await expire(id); const b = await claim();
    assert.equal(b.worker_generation, a.worker_generation + 1); assert.notEqual(a.worker_display_key, b.worker_display_key);
    assert.notEqual(a.worker_poster_key, b.worker_poster_key); assert.equal(await sql(`select state from public.video_worker_attempts where attempt_id='${a.worker_owner}'`), "abandoned");
    assert.equal((await publish(b)).state, "committed"); assert.equal(await consumed(), 100);
  });
  await t.test("PATCH 7 killed Node worker leaves committed claim/manifest recoverable by another worker", async () => {
    await reset(); const id = await queue();
    const child = require("node:child_process").fork(path.join(__dirname,"videoWorkerClaimChild.js"), [], { env:testEnv, windowsHide:true, stdio:["ignore","ignore","pipe","ipc"] });
    let timeout;
    try {
      const claimed = new Promise((resolve,reject) => {
        timeout=setTimeout(()=>reject(new Error("child claim deadline")),5000);
        child.once("error",reject); child.once("message",(message)=>message.error ? reject(new Error(message.error)) : resolve(message.claimed));
      });
      child.send({connection:workerConnection,owner:crypto.randomUUID()});
      const a = await claimed;
      bucket.set(a.worker_display_key,"uploaded-before-crash");
      const exit=new Promise((resolve)=>child.once("exit",resolve)); child.kill(); await exit;
      assert.equal(await claim(),null); await expire(id); const b=await claim();
      assert.equal(b.worker_generation,2); assert.notEqual(a.worker_display_key,b.worker_display_key);
      assert.equal(bucket.get(a.worker_display_key),"uploaded-before-crash"); await publish(b); assert.equal(await consumed(),100);
    } finally { clearTimeout(timeout); if(child.exitCode===null) child.kill(); }
  });
  await t.test("PATCH 7 late heartbeat/finalize/failure from fenced worker cannot mutate new owner", async () => {
    await reset(); const id = await queue(); const a = await claim(); await expire(id); const b = await claim();
    assert.equal((await call("renew_video_job", { ...own(a), p_lease_seconds: 30 })).renewed, false);
    await assert.rejects(publish(a), /VIDEO_OWNERSHIP_LOST/);
    assert.equal(await call("fail_video_job", { ...own(a), p_code: "stale" }), false);
    assert.equal(await sql("select worker_owner::text from public.video_processing_jobs"), b.worker_owner);
  });
  await t.test("PATCH 7 live heartbeat is renewed during blocked fake FFmpeg work", async () => {
    await reset(); await queue(); const entered = gate(), release = gate(), renewed = gate();
    const heartbeatDb = { rpc(name, args) { return { async abortSignal() {
      const data = await call(name, args); if (name === "renew_video_job" && data.renewed) renewed.resolve(); return { data };
    } }; } };
    const w = worker({ supabase: heartbeatDb, heartbeatMs: 20, processVideo: async (options) => {
      entered.resolve(); await release.promise; return render(options);
    } });
    const running = w.runOnce(); await entered.promise;
    try { await Promise.race([renewed.promise, new Promise((_, reject) => setTimeout(() => reject(new Error("heartbeat missing")), 3000))]); }
    finally { release.resolve(); await running; await w.stop(); }
    assert.equal(await sql("select status from public.video_processing_jobs"), "ready");
  });
  await t.test("PATCH 7 R2-complete crash leaves protected attempt manifest and recovery does not overwrite old keys", async () => {
    await reset(); const id = await queue(); const a = await claim();
    bucket.set(a.worker_display_key, "A"); bucket.set(a.worker_poster_key, "A");
    await expire(id); const b = await claim(); assert.notEqual(a.worker_display_key, b.worker_display_key);
    await publish(b); assert.equal(bucket.get(a.worker_display_key), "A"); assert.equal(await consumed(), 100);
  });
  await t.test("PATCH 7 lost committed REST reply resolves persisted outcome without R2 deletion", async () => {
    await reset(); await queue(); let lost = false;
    const loseReply = { rpc(name, args) { return { async abortSignal() {
      const data = await call(name, args);
      if (name === "publish_video_job") { lost = true; return { error: { code: "LOST_REPLY" } }; }
      return { data };
    } }; } };
    await worker({ supabase: loseReply }).runOnce(); assert.equal(lost, true); assert.equal(bucket.size, 2);
    assert.equal(await sql("select status from public.video_processing_jobs"), "ready"); assert.equal(await count("media"), 1); assert.equal(await consumed(), 100);
  });
  await t.test("PATCH 7 publication and outcome outage preserves files and durable cleanup-required manifest", async () => {
    await reset(); await queue(); const outage = { rpc(name, args) { return { async abortSignal() {
      if (["publish_video_job", "video_job_outcome"].includes(name)) throw new Error("outage");
      return { data: await call(name, args) };
    } }; } };
    await worker({ supabase: outage }).runOnce(); assert.equal(bucket.size, 2);
    assert.equal(await sql("select status from public.video_processing_jobs"), "processing");
    assert.equal(await sql("select cleanup_required from public.video_worker_attempts order by created_at desc limit 1"), "t");
  });
  await t.test("PATCH 7 duplicate publication replays committed result without duplicate media or quota", async () => {
    await reset(); await queue(); const a = await claim(); const first = await publish(a);
    assert.deepEqual(await publish(a), first); assert.equal(await count("media"), 1); assert.equal(await consumed(), 100);
    assert.equal(await claim(), null);
  });
  await t.test("PATCH 7 failed render records failure, retains manifest, and explicit retry gets fresh keys", async () => {
    await reset(); const id = await queue(); await worker({ processVideo: async () => { throw new Error("fake ffmpeg failure"); } }).runOnce();
    assert.equal(await sql("select status from public.video_processing_jobs"), "failed");
    assert.equal(await count("media"), 0); assert.equal(await consumed(), 100);
    const old = await sql("select display_key from public.video_worker_attempts order by created_at desc limit 1");
    await sql(`update public.video_processing_jobs set status='queued' where job_id='${id}'`);
    const next = await claim(); assert.notEqual(next.worker_display_key, old); await publish(next); assert.equal(await consumed(), 100);
  });
  await t.test("PATCH 7 shutdown during render leaves reclaimable lease and forbids late publication", async () => {
    await reset(); const id = await queue(); const entered = gate(), release = gate();
    const w = worker({ processVideo: async (options) => { entered.resolve(); await release.promise; return render(options); } });
    const running = w.runOnce(); await entered.promise; await w.stop({ timeoutMs: 10 }); release.resolve(); await running;
    assert.equal(await count("media"), 0); await expire(id); assert.ok(await claim());
  });
  await t.test("PATCH 7 deploy overlap with expired A cannot overwrite B publication", async () => {
    await reset(); const id = await queue(); const entered = gate(), release = gate();
    const a = worker({ processVideo: async (options) => { entered.resolve(); await release.promise; return render(options); } });
    const running = a.runOnce(); await entered.promise;
    assert.equal(await worker().runOnce(), false); await expire(id); await worker().runOnce();
    const published = await sql("select r2_display_key from public.media"); release.resolve(); await running; await a.stop();
    assert.equal(await sql("select r2_display_key from public.media"), published); assert.equal(await count("media"), 1); assert.equal(await consumed(), 100);
  });
  await t.test("PATCH 7 invalid publication rolls back atomically and old media moderation is preserved", async () => {
    await reset(); await queue(); const a = await claim();
    await assert.rejects(call("publish_video_job", { ...own(a), p_media: { ...media(a), r2_display_key: "wrong" } }), /INVALID_VIDEO_PUBLICATION/);
    assert.equal(await count("media"), 0); assert.equal(await sql("select status from public.video_processing_jobs"), "processing");
    await publish(a); await sql("update public.media set media_status='approved'"); await publish(a);
    assert.equal(await sql("select media_status from public.media"), "approved");
  });
  await t.test("PATCH 7 legacy publication gap repairs ready without reprocessing or moderation changes", async () => {
    await reset(); const id = await queue("processing");
    await sql(`insert into public.media(media_id,event_id,guest_id,bytes,media_status,storage_provider,r2_original_key,r2_display_key,r2_poster_key)
      select job_id,event_id,guest_id,original_bytes,'approved','r2',original_key,display_key,poster_key from public.video_processing_jobs where job_id='${id}'`);
    assert.equal(await claim(), null); assert.equal(await sql("select status from public.video_processing_jobs"), "ready");
    assert.equal(await sql("select media_status from public.media"), "approved"); assert.equal(await consumed(), 100);
  });
  await t.test("PATCH 7 ambiguous legacy media identity is preserved and never associated with a job", async () => {
    await reset(); const id=await queue("processing");
    await sql(`insert into public.media(media_id,event_id,guest_id,bytes,media_status,r2_original_key)
      values('${id}','${event}','${guest}',100,'approved','unrelated-original')`);
    await assert.rejects(claim(),/VIDEO_MEDIA_CONFLICT/);
    assert.equal(await sql("select status from public.video_processing_jobs"),"processing");
    assert.equal(await sql("select media_status from public.media"),"approved"); assert.equal(await consumed(),100);
  });
  await t.test("PATCH 7 RPC ACL/RLS denies public clients and permits service_role", async () => {
    for (const signature of ["claim_video_job(uuid,integer)","renew_video_job(uuid,uuid,bigint,integer)","publish_video_job(uuid,uuid,bigint,jsonb)","video_job_outcome(uuid,uuid,bigint)","fail_video_job(uuid,uuid,bigint,text)"]) {
      assert.equal(await sql(`select has_function_privilege('anon','public.${signature}','EXECUTE')`), "f");
      assert.equal(await sql(`select has_function_privilege('authenticated','public.${signature}','EXECUTE')`), "f");
      assert.equal(await sql(`select has_function_privilege('service_role','public.${signature}','EXECUTE')`), "t");
    }
    await assert.rejects(sql("set role anon; select * from public.video_worker_attempts"));
    assert.equal(await sql("select relrowsecurity from pg_class where oid='public.video_worker_attempts'::regclass"), "t");
  });
  await t.test("PATCH 7 fenced publish and quota reserve serialize without a new deadlock", async () => {
    await reset(); await queue(); const j=await claim();
    const owner="a".repeat(64), lease=crypto.randomUUID(), reservation=crypto.randomUUID(), asset=crypto.randomUUID();
    await call("acquire_upload_admission",{lease,owner,event,guest});
    const gateSession=connect(), publisher=connect(), uploader=connect(); let pub, upload;
    async function blocked(waiter,blocker) {
      const until=Date.now()+2500;
      while(Date.now()<until) if(await sql(`select ${blocker}=any(pg_blocking_pids(${waiter}))`)==="t") return;
      throw new Error("worker/quota barrier missing");
    }
    try {
      const gpid=Number(await gateSession.query("select pg_backend_pid()")), ppid=Number(await publisher.query("select pg_backend_pid()")), upid=Number(await uploader.query("select pg_backend_pid()"));
      await gateSession.query(`begin; select 1 from public.event_guests where guest_id='${guest}' for update`);
      pub=publisher.query(statement("publish_video_job",{...own(j),p_media:media(j)})); pub.catch(()=>{});
      await blocked(ppid,gpid);
      upload=uploader.query(statement("reserve_upload_quota",{id:reservation,lease,owner,event,guest,key:crypto.randomUUID(),fingerprint:"b".repeat(64),bytes:10,count:1,
        assets:[{kind:"image",asset_id:asset,bytes:10,original_key:`events/${event}/media/${asset}/original.png`,display_key:`events/${event}/media/${asset}/display.webp`,poster_key:null}]})); upload.catch(()=>{});
      await blocked(upid,ppid); await gateSession.query("commit"); await Promise.all([pub,upload]);
      assert.equal(await consumed(),100); assert.equal(await count("media"),1); assert.equal(await sql(`select state from public.upload_quota_reservations where reservation_id='${reservation}'`),"reserved");
    } finally { await Promise.all([gateSession.close(),publisher.close(),uploader.close()]); await Promise.allSettled([pub,upload].filter(Boolean)); }
  });
  await t.test("PATCH 7 reconciliation protects abandoned/failed attempt keys and rejects uncertain attempt reads", async () => {
    await reset(); const id = await queue(); const a = await claim(); await expire(id); const b = await claim();
    await call("fail_video_job", { ...own(b), p_code: "failed" });
    // Real SQL-backed reference reader, including legacy + attempt tables.
    await sql("alter table public.event add column if not exists event_cover_r2_original_key text, add column if not exists event_cover_r2_display_key text, add column if not exists event_cover_storage_provider text");
    const queryDb = { from(table) { let columns, order, after, limit;
      const query = { select(v) { columns=v; return query; }, order(v) { order=v; return query; }, limit(v) { limit=v; return query; }, gt(_c,v) { after=v; return query; },
        then(resolve,reject) { return sql(`select coalesce(json_agg(x),'[]')::text from(select ${columns} from public.${table}${after ? ` where ${order}>${q(after)}` : ""} order by ${order} limit ${limit}) x`).then((data)=>({data:JSON.parse(data)})).then(resolve,reject); } }; return query;
    } };
    const keys = [a.worker_display_key,a.worker_poster_key,b.worker_display_key,b.worker_poster_key];
    const options = { supabase: queryDb, buckets: { originals:"fake-original",display:"fake-display" },
      listObjects: async ({bucket}) => bucket === "fake-display" ? keys.map((key)=>({key,size:10,lastModified:new Date(0)})) : [],
      deleteObject: async () => { throw new Error("ambiguous DELETE must never be called"); } };
    assert.equal((await runReconcile(options)).audit.candidates.length,0);
    await sql("alter table public.video_worker_attempts rename to hidden_worker_attempts");
    try { await assert.rejects(runReconcile(options)); } finally { await sql("alter table public.hidden_worker_attempts rename to video_worker_attempts"); }
  });
};
