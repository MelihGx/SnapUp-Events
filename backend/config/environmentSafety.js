"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
function reject(code) { throw Object.assign(new Error(code), { code }); }
function readPolicy() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname,"deployment-targets.json"),"utf8").replace(/^\uFEFF/,"")); }
  catch (_) { reject("DEPLOYMENT_POLICY_UNREADABLE"); }
}
function origin(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol!=="https:" || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname!=="/") reject("INVALID_TARGET_ORIGIN");
    return parsed.origin;
  } catch (_) { reject("INVALID_TARGET_ORIGIN"); }
}
function targets(policy) {
  if (policy?.version!==1 || !policy.production || !policy.staging) reject("STAGING_POLICY_INCOMPLETE");
  const p=policy.production,s=policy.staging;
  if (!/^[a-z0-9]{20}$/.test(p.supabaseProjectRef||"") || !/^[a-z0-9]{20}$/.test(s.supabaseProjectRef||"") ||
      !/^[a-f0-9]{32}$/.test(p.r2AccountId||"") || !/^[a-f0-9]{32}$/.test(s.r2AccountId||"")) reject("STAGING_POLICY_INCOMPLETE");
  if (p.supabaseProjectRef===s.supabaseProjectRef || p.r2AccountId===s.r2AccountId) reject("STAGING_PRODUCTION_IDENTITY_CONFLICT");
  if (!Array.isArray(p.r2Buckets) || p.r2Buckets.length!==2 || !Array.isArray(s.r2Buckets) || s.r2Buckets.length!==2 ||
      [...p.r2Buckets,...s.r2Buckets].some((v)=>typeof v!=="string" || !/^[a-z0-9-]{3,63}$/.test(v)) ||
      new Set([...p.r2Buckets,...s.r2Buckets]).size!==4) reject("STAGING_BUCKET_POLICY_INVALID");
  if (!Array.isArray(s.renderServiceIds) || !s.renderServiceIds.length || s.renderServiceIds.some((v)=>typeof v!=="string" || !v.startsWith("srv-"))) reject("STAGING_SERVICE_POLICY_INVALID");
  if (!Array.isArray(s.frontendOrigins) || !s.frontendOrigins.length) reject("STAGING_FRONTEND_POLICY_INVALID");
  const prodOrigins=[...p.frontendOrigins,p.apiOrigin,...(p.additionalApiOrigins||[]),...p.mediaOrigins].map(origin);
  const stageOrigins=[...s.frontendOrigins,s.apiOrigin,s.mediaOrigin].map(origin);
  if (stageOrigins.some((v)=>prodOrigins.includes(v)) || new Set(stageOrigins).size!==stageOrigins.length) reject("STAGING_PRODUCTION_ORIGIN_CONFLICT");
  return { production:p, staging:s };
}
function environmentName(env=process.env,policy=readPolicy()) {
  const mode=env.APP_ENV || (env.NODE_ENV==="production" ? "production" : "development");
  if (!["production","staging","development"].includes(mode)) reject("INVALID_APP_ENV");
  if ((policy.staging?.renderServiceIds||[]).includes(env.RENDER_SERVICE_ID) && mode!=="staging") reject("STAGING_ENVIRONMENT_SELECTION_REQUIRED");
  if ((policy.production?.renderServiceIds||[]).includes(env.RENDER_SERVICE_ID) && mode==="staging") reject("PRODUCTION_SERVICE_REJECTED");
  return mode;
}
function assertSafeEnvironment(env=process.env,policy=readPolicy()) {
  const mode=environmentName(env,policy);
  if (mode!=="staging") return { mode };
  const { production:p,staging:s }=targets(policy);
  if (env.NODE_ENV!=="production") reject("STAGING_REQUIRES_PRODUCTION_SECURITY");
  if (!s.renderServiceIds.includes(env.RENDER_SERVICE_ID)) reject("STAGING_SERVICE_ID_MISMATCH");
  if (origin(env.SUPABASE_URL)!==`https://${s.supabaseProjectRef}.supabase.co`) reject("STAGING_SUPABASE_TARGET_MISMATCH");
  if (env.R2_ACCOUNT_ID!==s.r2AccountId || env.R2_ACCOUNT_ID===p.r2AccountId) reject("STAGING_R2_ACCOUNT_MISMATCH");
  const jurisdiction=String(env.R2_JURISDICTION||"").trim().toLowerCase();
  if (!["","eu","us"].includes(jurisdiction)) reject("STAGING_R2_JURISDICTION_INVALID");
  const expected=`https://${s.r2AccountId}${jurisdiction ? `.${jurisdiction}` : ""}.r2.cloudflarestorage.com`;
  if (env.R2_S3_ENDPOINT && origin(env.R2_S3_ENDPOINT)!==expected) reject("STAGING_R2_ENDPOINT_MISMATCH");
  if (env.R2_ORIGINAL_BUCKET!==s.r2Buckets[0] || env.R2_DISPLAY_BUCKET!==s.r2Buckets[1]) reject("STAGING_R2_BUCKET_MISMATCH");
  if (origin(env.R2_DISPLAY_PUBLIC_BASE_URL)!==origin(s.mediaOrigin)) reject("STAGING_MEDIA_ORIGIN_MISMATCH");
  const cors=String(env.CORS_ORIGINS||"").split(",").map((v)=>v.trim()).filter(Boolean).map(origin);
  if (cors.length!==s.frontendOrigins.length || new Set(cors).size!==cors.length || cors.some((v)=>!s.frontendOrigins.includes(v))) reject("STAGING_CORS_MISMATCH");
  if (origin(env.FRONTEND_URL)!==s.frontendOrigins[0]) reject("STAGING_FRONTEND_URL_MISMATCH");
  const values={ SUPABASE_SERVICE_ROLE_KEY:env.SUPABASE_SERVICE_ROLE_KEY,R2_ACCESS_KEY_ID:env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY:env.R2_SECRET_ACCESS_KEY,JWT_SECRET:env.JWT_SECRET,GUEST_JWT_SECRET:env.GUEST_JWT_SECRET||env.JWT_SECRET };
  for (const key of ["CLOUDINARY_API_KEY","CLOUDINARY_API_SECRET","CLOUDINARY_AUTH_TOKEN_KEY","RESEND_API_KEY","TURNSTILE_SECRET_KEY"]) {
    if(env[key]) values[key]=env[key];
  }
  for (const [key,value] of Object.entries(values)) {
    const expectedHash=s.credentialSha256?.[key];
    if (typeof value!=="string" || !value || !/^[a-f0-9]{64}$/.test(expectedHash||"")) reject("STAGING_CREDENTIAL_POLICY_INCOMPLETE");
    const actual=crypto.createHash("sha256").update(value).digest();
    if (!crypto.timingSafeEqual(actual,Buffer.from(expectedHash,"hex"))) reject("STAGING_CREDENTIAL_MISMATCH");
  }
  return { mode, corsOrigins:cors };
}
module.exports={readPolicy,origin,targets,environmentName,assertSafeEnvironment};
