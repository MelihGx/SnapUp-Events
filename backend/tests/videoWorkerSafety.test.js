"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { Readable } = require("node:stream");
const { createVideoWorker } = require("../services/videoWorkerService");

test("PATCH 7 actual R2 processing adapter retains uploaded derivatives on ambiguous PUT/DELETE", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(),"snapup-patch7-r2-"));
  const Module = require("node:module"), originalLoad=Module._load;
  const modulePath=require.resolve("../services/r2MediaService"); delete require.cache[modulePath];
  let deletes=0, service; const bucket=new Map();
  const display=path.join(root,"display.mp4"), poster=path.join(root,"poster.webp");
  try {
    Module._load=function(name,parent,isMain) {
      if(parent?.filename===modulePath && name==="../config/r2") return {
        getR2Buckets:()=>({originals:"fake-original",display:"fake-display"}),getR2DisplayPublicBaseUrl:()=>"https://fake.invalid",
        getR2Client:()=>({async send(command) {
          if(command.constructor.name==="GetObjectCommand") return {Body:Readable.from([Buffer.from("fake-original")])};
          if(command.constructor.name==="DeleteObjectCommand") { deletes++; throw new Error("ambiguous DELETE"); }
          if(command.constructor.name==="PutObjectCommand") {
            for await(const _chunk of command.input.Body) { /* consume stream */ }
            bucket.set(command.input.Key,true);
            if(command.input.Key.endsWith("poster.webp")) throw new Error("PUT reply lost after storage");
            return {};
          }
          throw new Error("unexpected R2 command");
        } }),
      };
      if(parent?.filename===modulePath && name==="./videoProcessingService") return {
        async transcodeVideoForDisplay() { await fs.writeFile(display,"fake-display"); await fs.writeFile(poster,"fake-poster");
          return {displayPath:display,posterPath:poster,displayBytes:12,posterBytes:11,displayContentType:"video/mp4",posterContentType:"image/webp"}; },
        async cleanupVideoDerivatives() { await Promise.all([fs.unlink(display),fs.unlink(poster)]); },
      };
      return originalLoad.call(this,name,parent,isMain);
    };
    service=require(modulePath);
  } finally { Module._load=originalLoad; delete require.cache[modulePath]; }
  try {
    await assert.rejects(service.processStoredVideoOriginal({eventId:"test",originalKey:"events/test/original.mp4",
      displayKey:"events/test/attempt-1/display.mp4",posterKey:"events/test/attempt-1/poster.webp",preserveOnError:true,assertValid() {}}));
    assert.equal(bucket.size,2); assert.equal(deletes,0);
  } finally {
    assert.equal(path.dirname(root),path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith("snapup-patch7-r2-"));
    await fs.rm(root,{recursive:true,force:true});
  }
});

test("PATCH 7 malformed ownership/lease response cannot reach processing", async () => {
  let renders=0;
  const worker=createVideoWorker({supabase:{rpc(){return{abortSignal:async()=>({data:{job_id:"job",worker_owner:"owner",worker_generation:1}})};}},
    processVideo:async()=>{renders++;},getVideoMediaTypeId:async()=>2,log(){}});
  await worker.runOnce(); assert.equal(renders,0); await worker.stop();
});

test("PATCH 7 hung claim RPC is bounded and no media/R2 operation starts", async () => {
  let renders=0;
  const worker=createVideoWorker({supabase:{rpc(){return new Promise(()=>{});}},rpcTimeoutMs:20,
    processVideo:async()=>{renders++;},getVideoMediaTypeId:async()=>2,log(){}});
  await assert.rejects(worker.runOnce(),/deadline/); assert.equal(renders,0); await worker.stop();
});

test("PATCH 7 startup claims atomically without resetting jobs; shutdown prevents later wakeups", async () => {
  const Module=require("node:module"), original=Module._load;
  const modulePath=require.resolve("../services/videoProcessingQueueService"); delete require.cache[modulePath];
  let claims=0, service;
  try {
    Module._load=function(name,parent,isMain) {
      if(parent?.filename===modulePath && name==="../config/supabaseClient") return {
        rpc(name) { assert.equal(name,"claim_video_job"); claims++; return {abortSignal:async()=>({data:null})}; },
        from() { throw new Error("startup must not reset processing rows"); },
      };
      return original.call(this,name,parent,isMain);
    };
    service=require(modulePath); await service.startVideoProcessingWorker();
    await new Promise((resolve)=>setImmediate(resolve));
    assert.equal(claims,1); await service.stopVideoProcessingWorker();
    service.wakeVideoProcessingWorker(); await service.startVideoProcessingWorker();
    await new Promise((resolve)=>setImmediate(resolve)); assert.equal(claims,1);
  } finally { Module._load=original; await service?.stopVideoProcessingWorker(); delete require.cache[modulePath]; }
});

test("PATCH 7 late successful heartbeat cannot resurrect an expired local deadline", async () => {
  let clock=0, renewResolve, enteredResolve, releaseResolve, requestedResolve, published=0;
  const entered=new Promise((r)=>{enteredResolve=r;}), release=new Promise((r)=>{releaseResolve=r;}), requested=new Promise((r)=>{requestedResolve=r;});
  const worker=createVideoWorker({now:()=>clock,leaseSeconds:30,heartbeatMs:1,rpcTimeoutMs:1000,log(){},getVideoMediaTypeId:async()=>2,
    supabase:{rpc(name){return{abortSignal:async()=>{
      if(name==="claim_video_job") return {data:{job_id:"test",worker_owner:"owner",worker_generation:1,lease_seconds:30}};
      if(name==="renew_video_job") { requestedResolve(); return new Promise((resolve)=>{renewResolve=resolve;}); }
      if(name==="publish_video_job") { published++; return {data:{state:"committed"}}; }
      return {data:{state:"owned"}};
    }};}},
    processVideo:async(options)=>{enteredResolve(); await release; assert.equal(options.signal.aborted,true); return {};},
  });
  // Production has a listening server. Keep this isolated timer test alive
  // while the worker's intentionally unref'ed heartbeat becomes runnable.
  const keepAlive=setTimeout(()=>{},3000);
  try {
    const running=worker.runOnce(); await entered; await requested; clock=40000;
    renewResolve({data:{renewed:true,lease_seconds:30}}); await new Promise((r)=>setImmediate(r));
    releaseResolve(); await running; assert.equal(published,0);
  } finally { clearTimeout(keepAlive); await worker.stop(); }
});
