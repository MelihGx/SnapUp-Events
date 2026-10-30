"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

module.exports = async function quotaDeadlocks({ t, sql, connect, reset, prepareReservation,
  reservation, finalize, rows, consumed, usage, event, guest, q }) {
  const up = await fs.readFile(path.join(__dirname, "../../database/2026-10-30-quota-event-locks.sql"), "utf8");
  const down = await fs.readFile(path.join(__dirname, "../../database/rollback/2026-10-30-quota-event-locks.sql"), "utf8");
  const workerInsert = `insert into public.media(media_id,event_id,guest_id,media_type_id,bytes,storage_provider,r2_original_key,r2_display_key,media_status)
    select job_id,event_id,guest_id,2,original_bytes,'r2',original_key,display_key,target_media_status from public.video_processing_jobs
    on conflict(media_id) do update set bytes=excluded.bytes,media_status=excluded.media_status`;
  const invocation = (name, args) => `select public.${name}(${Object.values(args).map((value) => q(value !== null && typeof value === "object" ? JSON.stringify(value) : value)).join(",")})::text`;
  async function untilBlocked(waiter, blocker) {
    const deadline = Date.now() + 2500;
    while (Date.now() < deadline) {
      if (await sql(`select ${blocker}=any(pg_blocking_pids(${waiter}))`) === "t") return;
    }
    throw new Error("Deterministic guest-lock barrier was not reached");
  }
  async function race({ mode = "reserve", baseline = false, retry = false } = {}) {
    await reset(); await finalize(await reservation({ kind: "video", bytes: 10 }));
    if (retry) await sql(workerInsert);
    const r = mode === "reserve" ? await prepareReservation({ bytes: 10 }) : await reservation({ bytes: 10 });
    const worker = connect(), quota = connect();
    let pending;
    try {
      const workerPid = Number(await worker.query("select pg_backend_pid()"));
      const quotaPid = Number(await quota.query("select pg_backend_pid()"));
      // The production BEFORE INSERT trigger holds this same guest lock. Taking
      // it explicitly gives the coordinator an observable, deterministic barrier.
      await worker.query(`set deadlock_timeout='50ms'; begin; select 1 from public.event_guests where guest_id='${guest(1)}' for update`);
      const args = mode === "reserve" ? r.args : { id: r.id, owner: r.owner, ...rows(r) };
      pending = quota.query(invocation(mode === "reserve" ? "reserve_upload_quota" : "finalize_upload_quota", args));
      pending.catch(() => {});
      await untilBlocked(quotaPid, workerPid);
      const outcomes = await Promise.allSettled([worker.query(`${workerInsert}; commit`), pending]);
      if (baseline) {
        assert.equal(outcomes[0].status, "rejected", "worker must detect the pre-fix FK cycle");
        assert.equal(outcomes[0].reason.sqlState, "40P01");
        assert.match(outcomes[0].reason.message, /FOR KEY SHARE/i);
        assert.match(outcomes[0].reason.message, /event/);
        assert.equal(outcomes[1].status, "fulfilled");
        assert.equal(await sql("select count(*) from public.media"), "0");
        assert.equal(await consumed(), 10);
        t.diagnostic("Pre-fix deterministic reproduction: 40P01; worker FK SELECT FOR KEY SHARE on event; reserve waits for worker guest lock. Worker INSERT rolled back.");
      } else {
        for (const result of outcomes) if (result.status === "rejected") throw result.reason;
        if (mode === "reserve") await finalize(r);
        assert.equal(await consumed(), 20);
        assert.deepEqual(await usage(), { bytes: 20, items: 2 });
        assert.equal(await sql("select count(*) from public.media"), "2");
        assert.equal(await sql("select media_status from public.media where media_id=(select job_id from public.video_processing_jobs limit 1)"), "pending");
        await sql(workerInsert); // same job UUID retry cannot create a third item
        assert.equal(await consumed(), 20);
        assert.deepEqual(await usage(), { bytes: 20, items: 2 });
      }
    } finally {
      await Promise.all([worker.close(), quota.close()]);
      if (pending) await Promise.allSettled([pending]);
    }
  }
  await t.test("PATCH 6 pre-fix reproduction confirms FK/trigger deadlock with SQLSTATE 40P01", async () => {
    assert.equal(await sql("select count(*) from pg_constraint where conrelid='public.media'::regclass and contype='f' and confrelid in ('public.event'::regclass,'public.event_guests'::regclass) and not condeferrable"), "2");
    assert.equal(await sql("select count(*) from pg_trigger where tgrelid='public.media'::regclass and tgname='media_guest_quota_guard' and tgenabled='O'"), "1");
    await race({ baseline: true });
  });
  async function snapshot() {
    return sql(`select jsonb_build_object(
      'event',(select jsonb_agg(to_jsonb(e) order by event_id) from public.event e),
      'guests',(select jsonb_agg(to_jsonb(g) order by guest_id) from public.event_guests g),
      'media',(select jsonb_agg(to_jsonb(m) order by media_id) from public.media m),
      'leases',(select jsonb_agg(to_jsonb(l) order by lease_id) from public.upload_admission_leases l),
      'reservations',(select jsonb_agg(to_jsonb(r) order by reservation_id) from public.upload_quota_reservations r),
      'jobs',(select jsonb_agg(to_jsonb(j) order by job_id) from public.video_processing_jobs j),
      'acl',(select jsonb_agg(jsonb_build_object('oid',oid,'owner',proowner,'acl',proacl,'security',prosecdef,'config',proconfig) order by oid)
        from pg_proc where oid in ('public.reserve_upload_quota(uuid,uuid,text,uuid,uuid,text,text,bigint,integer,jsonb)'::regprocedure,'public.finalize_upload_quota(uuid,text,jsonb,jsonb)'::regprocedure)),
      'rls',(select jsonb_agg(jsonb_build_object('oid',oid,'rls',relrowsecurity,'acl',relacl) order by oid) from pg_class where oid in ('public.upload_quota_reservations'::regclass,'public.upload_admission_leases'::regclass,'public.upload_admission_policy'::regclass)),
      'trigger',pg_get_functiondef('public.enforce_guest_media_quota()'::regprocedure))::text`);
  }
  await t.test("PATCH 6 migration and rollback preserve rows, counters, function identity/ACL and RLS", async () => {
    await sql(workerInsert);
    const before = await snapshot(); await sql(up); assert.equal(await snapshot(), before);
    await sql(up); assert.equal(await snapshot(), before);
    await sql(down); assert.equal(await snapshot(), before);
    assert.match(await sql("select pg_get_functiondef('public.reserve_upload_quota(uuid,uuid,text,uuid,uuid,text,text,bigint,integer,jsonb)'::regprocedure)"), /event_id=p_event_id for update/);
    await sql(up); assert.equal(await snapshot(), before);
    for (const signature of ["reserve_upload_quota(uuid,uuid,text,uuid,uuid,text,text,bigint,integer,jsonb)", "finalize_upload_quota(uuid,text,jsonb,jsonb)"]) {
      const definition = await sql(`select pg_get_functiondef('public.${signature}'::regprocedure)`);
      assert.match(definition, /for no key update/);
      assert.equal(await sql(`select 'lock_timeout=3s'=any(proconfig) from pg_proc where oid='public.${signature}'::regprocedure`), "t");
      assert.equal(await sql(`select has_function_privilege('anon','public.${signature}','EXECUTE')`), "f");
      assert.equal(await sql(`select has_function_privilege('authenticated','public.${signature}','EXECUTE')`), "f");
      assert.equal(await sql(`select has_function_privilege('service_role','public.${signature}','EXECUTE')`), "t");
    }
  });
  await t.test("PATCH 6 event lock admits FK KEY SHARE but still excludes another quota writer", async () => {
    const holder = connect(), observer = connect();
    try {
      await holder.query(`begin; select 1 from public.event where event_id='${event}' for no key update`);
      assert.equal(await observer.query(`select 1 from public.event where event_id='${event}' for key share nowait`), "1");
      await assert.rejects(observer.query(`select 1 from public.event where event_id='${event}' for no key update nowait`), (error) => error.sqlState === "55P03");
    } finally { await Promise.all([holder.close(), observer.close()]); }
  });
  await t.test("PATCH 6 repeated deterministic worker versus reserve/finalize/retry races", async () => {
    for (let i = 0; i < 5; i++) {
      await race({ mode: "reserve", retry: i % 2 === 1 });
      await race({ mode: "finalize", retry: i % 2 === 0 });
    }
    t.diagnostic("10 post-fix races: 5 reserve + 5 finalize, including 5 existing-media worker retries; pg_blocking_pids barrier reached in every race.");
  });
  await t.test("PATCH 6 twenty same-guest reservations cannot overshoot count or cumulative byte quota", async () => {
    for (const limits of [
      { guestMb: 2, count: 5, accepted: 5, error: /GUEST_UPLOAD_LIMIT_EXCEEDED/ },
      { guestMb: 1, count: null, accepted: 10, error: /GUEST_STORAGE_QUOTA_EXCEEDED/ },
    ]) {
      await reset({ limit: 10 * 1048576, ...limits, consumed: 1234 });
      const attempts = await Promise.allSettled(Array.from({ length: 20 }, () => reservation({ bytes: 100 * 1024 })));
      const accepted = attempts.filter((item) => item.status === "fulfilled").map((item) => item.value);
      assert.equal(accepted.length, limits.accepted);
      for (const rejected of attempts.filter((item) => item.status === "rejected")) assert.match(rejected.reason.message, limits.error);
      assert.equal(await consumed(), 1234);
      await Promise.all(accepted.map((item) => finalize(item)));
      const bytes = limits.accepted * 100 * 1024;
      assert.equal(await consumed(), 1234 + bytes);
      assert.deepEqual(await usage(), { bytes, items: limits.accepted });
      await Promise.all(accepted.map((item) => finalize(item)));
      assert.equal(await consumed(), 1234 + bytes);
    }
  });
  await t.test("PATCH 6 worker transaction rollback leaves quota/job/media consistent and can retry", async () => {
    await reset(); await finalize(await reservation({ kind: "video", bytes: 10 }));
    const worker = connect();
    try { await worker.query(`begin; ${workerInsert}; rollback`); } finally { await worker.close(); }
    assert.equal(await sql("select count(*) from public.media"), "0");
    assert.equal(await consumed(), 10); assert.deepEqual(await usage(), { bytes: 10, items: 1 });
    await sql(workerInsert); assert.equal(await consumed(), 10); assert.deepEqual(await usage(), { bytes: 10, items: 1 });
  });
  return { race };
};
