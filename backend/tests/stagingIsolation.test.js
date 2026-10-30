"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),http=require("node:http"),Module=require("node:module");
const {assertSafeEnvironment,readPolicy}=require("../config/environmentSafety");
const {createOriginValidator}=require("../config/originPolicy");
const fixture=require("./fixtures/stagingPolicy");
const root=path.resolve(__dirname,"../..");
function loadFrontend(policy,url) {
 const scope={URL,DEPLOYMENT:policy,window:{location:new URL(url),fetch:async(...args)=>{scope.calls.push(args);return {ok:true};}},calls:[]};
 const runtime=fs.readFileSync(path.join(root,"frontend/js/runtime-target.js"),"utf8").replace(/\bexport /g,"");
 const config=fs.readFileSync(path.join(root,"frontend/js/config.js"),"utf8").replace(/^import .*;\s*$/gm,"").replace(/\bexport /g,"");
 vm.runInNewContext(`${runtime}\n${config}\nglobalThis.exposed={API_URL,apiUrl};`,scope);
 return scope;
}
function frontendPolicy(mode="production") {
 const {policy}=fixture(); return {mode,production:policy.production,staging:policy.staging};
}
test("8A production frontend keeps known production domains/API and local development target",()=>{
 const context={};
 vm.runInNewContext(fs.readFileSync(path.join(root,"frontend/js/deployment-policy.js"),"utf8").replace(/\bexport /g,"")+"\nglobalThis.value=DEPLOYMENT;",context);
 const p=context.value, authoritative=readPolicy().production;
 assert.equal(JSON.stringify(p.production),JSON.stringify({frontendOrigins:authoritative.frontendOrigins,apiOrigin:authoritative.apiOrigin,additionalApiOrigins:authoritative.additionalApiOrigins,mediaOrigins:authoritative.mediaOrigins}));
 for(const url of p.production.frontendOrigins) assert.equal(loadFrontend(p,url).exposed.API_URL,p.production.apiOrigin);
 for(const url of ["http://localhost:5173","http://127.0.0.1:9000","file:///index.html"]) assert.equal(loadFrontend(p,url).exposed.API_URL,"http://localhost:3000");
});
test("8A staging artifact chooses only approved staging API and rejects unknown/prod frontend origin",()=>{
 const p=frontendPolicy("staging"); assert.equal(loadFrontend(p,p.staging.frontendOrigins[0]).exposed.API_URL,p.staging.apiOrigin);
 for(const url of [p.production.frontendOrigins[0],"https://unexpected.pages.dev"]) assert.throws(()=>loadFrontend(p,url));
});
test("8A missing staging API/policy and unknown preview never fall back to production",()=>{
 const p=frontendPolicy("staging"); delete p.staging.apiOrigin; assert.throws(()=>loadFrontend(p,"https://staging.snapup.test"));
 p.staging=null; assert.throws(()=>loadFrontend(p,"https://staging.snapup.test"));
 assert.throws(()=>loadFrontend(frontendPolicy(),"https://preview.snapup-events.pages.dev"));
});
test("8A fetch credentials compare exact origins; staging blocks explicit production fetch",async()=>{
 const p=frontendPolicy("staging"),s=loadFrontend(p,p.staging.frontendOrigins[0]);
 await s.window.fetch(s.exposed.apiUrl("api/auth/login")); assert.equal(s.calls[0][1].credentials,"include");
 await assert.rejects(s.window.fetch(`${p.production.apiOrigin}/api/media/upload`)); assert.equal(s.calls.length,1);
  await assert.rejects(s.window.fetch(new URL(`${p.production.apiOrigin}/api/media/upload`))); assert.equal(s.calls.length,1);
 await s.window.fetch(`${p.staging.apiOrigin}.evil.test/api`); assert.equal(s.calls[1][1].credentials,undefined);
});
test("8A auth/register/detail/gallery/upload clients share config with no remaining hardcoded backend selector",()=>{
 for(const file of ["login.js","register.js","auth-api.js","event-detail.js","event-gallery.js","join-upload-modal.js"]) {
  const source=fs.readFileSync(path.join(root,"frontend/js",file),"utf8"); assert.match(source,/from ["']\.\/config\.js/);
 }
 const script=fs.readFileSync(path.join(root,"frontend/js/script.js"),"utf8"); assert.match(script,/import\("\.\/config\.js/); assert.doesNotMatch(script,/https:\/\/snapup-events-api/);
});
test("8A correct staging identity, exact endpoints and pinned credentials accepted offline",()=>{
 const {env,policy}=fixture(); assert.equal(assertSafeEnvironment(env,policy).mode,"staging");
 env.R2_S3_ENDPOINT=`https://${env.R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`;env.R2_JURISDICTION="eu";
 assert.equal(assertSafeEnvironment(env,policy).mode,"staging");
});
test("8A production Supabase/account/bucket/API origins are rejected locally",()=>{
 const mutations=[(e,p)=>{e.SUPABASE_URL=`https://${p.production.supabaseProjectRef}.supabase.co`;},(e,p)=>{e.R2_ACCOUNT_ID=p.production.r2AccountId;},
 (e,p)=>{e.R2_ORIGINAL_BUCKET=p.production.r2Buckets[0];},(e,p)=>{e.R2_S3_ENDPOINT=`https://${p.production.r2AccountId}.r2.cloudflarestorage.com`;},
 (e,p)=>{e.R2_DISPLAY_PUBLIC_BASE_URL=p.production.mediaOrigins[0];},(e,p)=>{e.CORS_ORIGINS=p.production.frontendOrigins[0];}];
 for(const mutate of mutations){const {env,policy}=fixture();mutate(env,policy);assert.throws(()=>assertSafeEnvironment(env,policy));}
});
test("8A endpoint spoofing, wrong credentials and insecure staging cookies are rejected without exposing secrets",()=>{
 for(const change of [{SUPABASE_URL:`https://${"b".repeat(20)}.supabase.co.evil.test`},{SUPABASE_URL:"https://secret-user:secret-pass@invalid.test"},
 {R2_SECRET_ACCESS_KEY:"production-secret-must-not-leak"},{NODE_ENV:"development"},{RENDER_SERVICE_ID:"srv-unapproved"},{R2_S3_ENDPOINT:"http://localhost:9000"}]) {
  const {env,policy}=fixture(); Object.assign(env,change);
  assert.throws(()=>assertSafeEnvironment(env,policy),(error)=>{for(const value of Object.values(change))assert.ok(!error.message.includes(value));return true;});
 }
});
test("8A missing/inconsistent policy refuses staging; trusted service identity prevents missing APP_ENV fallback",()=>{
 const {env,policy}=fixture();assert.throws(()=>assertSafeEnvironment(env,readPolicy()));
 const absent={...env};delete absent.APP_ENV; assert.throws(()=>assertSafeEnvironment(absent,policy),/SELECTION_REQUIRED/);
 const corrupt=structuredClone(policy);corrupt.staging.supabaseProjectRef=corrupt.production.supabaseProjectRef;assert.throws(()=>assertSafeEnvironment(env,corrupt));
});
test("8A existing production/development backend remains compatible with unconfigured staging",()=>{
 for(const env of [{NODE_ENV:"production"},{NODE_ENV:"development"},{}])assert.doesNotThrow(()=>assertSafeEnvironment(env,readPolicy()));
 const allow=createOriginValidator({NODE_ENV:"production"},readPolicy());assert.equal(allow("https://snapupevents.com"),true);assert.equal(allow("http://localhost:3000"),false);
});
test("8A staging CORS is exact, HTTPS-only and uses unchanged secure cookie semantics",()=>{
 const {env,policy}=fixture(),allow=createOriginValidator(env,policy);
 assert.equal(allow(env.FRONTEND_URL),true);assert.equal(allow("https://snapupevents.com"),false);assert.equal(allow("http://localhost:3000"),false);
 const prior=process.env.NODE_ENV;process.env.NODE_ENV="production";
 try {let name,options;require("../utils/authCookie").setAuthCookie({cookie(n,_v,o){name=n;options=o;}},"synthetic");assert.equal(name,"__Host-snapup_session");assert.equal(options.secure,true);assert.equal(options.sameSite,"none");}
 finally {if(prior===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=prior;}
});
test("8A invalid staging startup fails before route clients, HTTP listen or worker construction",()=>{
 const modulePath=require.resolve("../index"),old=Module._load;delete require.cache[modulePath];let reached=0;
 try {Module._load=function(name,parent,isMain){
  if(parent?.filename===modulePath && name==="dotenv")return{config(){}};
  if(parent?.filename===modulePath && name==="./config/environmentSafety")return{assertSafeEnvironment(){const {env}=fixture();return assertSafeEnvironment(env,readPolicy());}};
  if(parent?.filename===modulePath && (name.startsWith("./routes/")||name.includes("videoProcessingQueueService"))){reached++;throw new Error("unsafe route/worker load");}
  return old.call(this,name,parent,isMain);
 };assert.throws(()=>require(modulePath),/STAGING_POLICY_INCOMPLETE/);assert.equal(reached,0);}
 finally{Module._load=old;delete require.cache[modulePath];}
});
test("8A standalone queue bootstrap cannot construct a worker before environment validation",async()=>{
 const modulePath=require.resolve("../services/videoProcessingQueueService"),old=Module._load;delete require.cache[modulePath];let claims=0;
 try{Module._load=function(name,parent,isMain){
  if(parent?.filename===modulePath && name==="../config/environmentSafety")return{assertSafeEnvironment(){throw new Error("STAGING_POLICY_INCOMPLETE");}};
  if(parent?.filename===modulePath && name==="../config/supabaseClient")return{rpc(){claims++;}};
  return old.call(this,name,parent,isMain);
 };const queue=require(modulePath);await assert.rejects(queue.startVideoProcessingWorker(),/STAGING_POLICY_INCOMPLETE/);assert.equal(claims,0);await queue.stopVideoProcessingWorker();}
 finally{Module._load=old;delete require.cache[modulePath];}
});
test("8A Supabase/R2 configuration guards run before SDK constructors",()=>{
 for(const [file,sdk]of [["../config/supabaseClient","@supabase/supabase-js"],["../config/r2","@aws-sdk/client-s3"]]){
  const modulePath=require.resolve(file),old=Module._load;delete require.cache[modulePath];let constructors=0;
  try{Module._load=function(name,parent,isMain){
   if(parent?.filename===modulePath && name==="./environmentSafety")return{assertSafeEnvironment(){throw new Error("STAGING_TARGET_REJECTED");}};
   if(parent?.filename===modulePath && name===sdk){constructors++;throw new Error("SDK should not load");}
   return old.call(this,name,parent,isMain);
  };assert.throws(()=>require(modulePath),/STAGING_TARGET_REJECTED/);assert.equal(constructors,0);}
  finally{Module._load=old;delete require.cache[modulePath];}
 }
});
test("8A production CSP stays byte-identical; staging artifact replaces only target directives and contains no credentials",()=>{
 const {buildFrontend}=require("../../scripts/build-frontend.cjs"),{policy,env}=fixture();
 const dirs=[];
 try{for(const mode of ["production","staging"]){const out=path.join(root,"artifacts",`test-${mode}-${require("node:crypto").randomUUID()}`);dirs.push(out);buildFrontend({mode,policy,outputDir:out});
  const headers=fs.readFileSync(path.join(out,"_headers"),"utf8"),generated=fs.readFileSync(path.join(out,"js/deployment-policy.js"),"utf8");
  if(mode==="production")assert.equal(headers,fs.readFileSync(path.join(root,"frontend/_headers"),"utf8"));
  else{for(const key of ["connect-src","img-src","media-src"]){const d=headers.match(new RegExp(`${key} ([^;]+)`))[1];assert.ok(d.includes(policy.staging.mediaOrigin));assert.ok(!d.includes("media.snapupevents.com"));assert.ok(!d.includes("res.cloudinary.com"));}assert.ok(headers.includes(policy.staging.apiOrigin));assert.ok(!headers.includes(policy.production.apiOrigin));}
  for(const key of ["SUPABASE_SERVICE_ROLE_KEY","R2_SECRET_ACCESS_KEY","JWT_SECRET"])assert.ok(!generated.includes(env[key]));
 }}finally{for(const dir of dirs){assert.equal(path.dirname(dir),path.join(root,"artifacts"));assert.ok(path.basename(dir).startsWith("test-"));fs.rmSync(dir,{recursive:true,force:true});}}
});
test("8A staging build refuses missing targets without creating an artifact",()=>{
 const {buildFrontend}=require("../../scripts/build-frontend.cjs");assert.throws(()=>buildFrontend({mode:"staging",policy:readPolicy()}),/STAGING_POLICY_INCOMPLETE/);
});

test("8A valid staging SDK wiring uses approved endpoints without sending any request",()=>{
 const {env,policy}=fixture(),saved={};for(const [k,v]of Object.entries(env)){saved[k]=process.env[k];process.env[k]=v;}
 const old=Module._load,paths=[require.resolve("../config/supabaseClient"),require.resolve("../config/r2")];let supabaseUrl,endpoint;
 try{for(const p of paths)delete require.cache[p];Module._load=function(name,parent,isMain){
  if(paths.includes(parent?.filename)&&name==="./environmentSafety")return{assertSafeEnvironment:()=>assertSafeEnvironment(env,policy)};
  if(parent?.filename===paths[0]&&name==="@supabase/supabase-js")return{createClient(url){supabaseUrl=url;return {rpc(){throw new Error("network forbidden");}};}};
  if(parent?.filename===paths[1]&&name==="@aws-sdk/client-s3")return{S3Client:class{constructor(options){endpoint=options.endpoint;}send(){throw new Error("network forbidden");}}};
  return old.call(this,name,parent,isMain);
 };require(paths[0]);const r2=require(paths[1]);r2.getR2Client();assert.equal(supabaseUrl,env.SUPABASE_URL);assert.equal(endpoint,`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);}
 finally{Module._load=old;for(const p of paths)delete require.cache[p];for(const [k,v]of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
test("8A staging CORS preflight permits credentials/required headers only for staging origin",async()=>{
 const express=require("express"),cors=require("cors"),{env,policy}=fixture(),allow=createOriginValidator(env,policy);
 const app=express();app.use(cors({origin(value,cb){cb(null,allow(value));},credentials:true,
  allowedHeaders:["Authorization","X-Guest-Token","Idempotency-Key"],exposedHeaders:["Retry-After"]}));app.get("/",(_req,res)=>res.send("synthetic"));
 const server=app.listen(0,"127.0.0.1");await new Promise((r)=>server.once("listening",r));
 const request=(origin)=>new Promise((resolve,reject)=>{const req=http.request({host:"127.0.0.1",port:server.address().port,path:"/",method:"OPTIONS",
  headers:{Origin:origin,"Access-Control-Request-Method":"POST","Access-Control-Request-Headers":"X-Guest-Token,Idempotency-Key"}},(res)=>{res.resume();res.on("end",()=>resolve(res));});req.on("error",reject);req.end();});
 try{const good=await request(env.FRONTEND_URL);assert.equal(good.statusCode,204);assert.equal(good.headers["access-control-allow-origin"],env.FRONTEND_URL);assert.equal(good.headers["access-control-allow-credentials"],"true");assert.match(good.headers["access-control-allow-headers"],/Idempotency-Key/);
 const denied=await request("https://snapupevents.com");assert.equal(denied.headers["access-control-allow-origin"],undefined);}
 finally{await new Promise((r)=>server.close(r));}
});
