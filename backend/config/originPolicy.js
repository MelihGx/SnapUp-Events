"use strict";
const { assertSafeEnvironment }=require("./environmentSafety");
function createOriginValidator(env=process.env,policy) {
  const checked=assertSafeEnvironment(env,policy);
  if(checked.mode==="staging") {
    const allowed=new Set(checked.corsOrigins);
    return (origin)=>!origin || allowed.has(origin);
  }
  const configured=String(env.CORS_ORIGINS||"").split(",").map((v)=>v.trim()).filter(Boolean);
  const production=new Set(["https://snapupevents.com","https://www.snapupevents.com",...configured]);
  const development=new Set([...production,"https://snapup-events.pages.dev","https://snapup-events.netlify.app"]);
  return (origin)=>!origin || (env.NODE_ENV==="production" ? production : development).has(origin) ||
    (env.NODE_ENV!=="production" && (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) || /^https:\/\/[a-z0-9-]+\.snapup-events\.pages\.dev$/i.test(origin)));
}
module.exports={createOriginValidator};
