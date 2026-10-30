"use strict";
const crypto=require("node:crypto");
module.exports=function stagingFixture() {
 const env={APP_ENV:"staging",NODE_ENV:"production",RENDER_SERVICE_ID:"srv-isolated-staging",
  SUPABASE_URL:`https://${"b".repeat(20)}.supabase.co`,SUPABASE_SERVICE_ROLE_KEY:"isolated-supabase-secret",
  R2_ACCOUNT_ID:"b".repeat(32),R2_ACCESS_KEY_ID:"isolated-r2-access",R2_SECRET_ACCESS_KEY:"isolated-r2-secret",
  R2_ORIGINAL_BUCKET:"snapup-stg-original",R2_DISPLAY_BUCKET:"snapup-stg-display",R2_DISPLAY_PUBLIC_BASE_URL:"https://stage-media.snapup.test",
  JWT_SECRET:"isolated-jwt-secret",GUEST_JWT_SECRET:"isolated-guest-secret",FRONTEND_URL:"https://staging.snapup.test",CORS_ORIGINS:"https://staging.snapup.test"};
 const policy={version:1,production:{frontendOrigins:["https://snapupevents.com","https://www.snapupevents.com","https://snapup-events.pages.dev","https://snapup-events.netlify.app"],
  apiOrigin:"https://snapup-events-api.onrender.com",additionalApiOrigins:["https://api.snapupevents.com"],mediaOrigins:["https://media.snapupevents.com","https://res.cloudinary.com"],
  supabaseProjectRef:"a".repeat(20),r2AccountId:"a".repeat(32),r2Buckets:["snapup-prod-original","snapup-prod-display"],renderServiceIds:["srv-isolated-production"]},
 staging:{frontendOrigins:[env.FRONTEND_URL],apiOrigin:"https://stage-api.snapup.test",mediaOrigin:env.R2_DISPLAY_PUBLIC_BASE_URL,
  supabaseProjectRef:"b".repeat(20),r2AccountId:env.R2_ACCOUNT_ID,r2Buckets:[env.R2_ORIGINAL_BUCKET,env.R2_DISPLAY_BUCKET],renderServiceIds:[env.RENDER_SERVICE_ID],credentialSha256:{}}};
 for(const key of ["SUPABASE_SERVICE_ROLE_KEY","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","JWT_SECRET","GUEST_JWT_SECRET"]) policy.staging.credentialSha256[key]=crypto.createHash("sha256").update(env[key]).digest("hex");
 return {env,policy};
};
