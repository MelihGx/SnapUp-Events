export function resolveFrontendTarget(location, policy) {
  const fail=(code)=>{throw Object.assign(new Error(code),{code});};
  const local=location.protocol==="file:" || ["localhost","127.0.0.1","[::1]","::1"].includes(location.hostname);
  if(policy.mode==="production" && local) return {mode:"development",apiOrigin:"http://localhost:3000"};
  const current=location.origin;
  if(policy.mode==="staging") {
    const s=policy.staging,p=policy.production;
    if(!s || !s.frontendOrigins?.includes(current) || !s.apiOrigin || !s.mediaOrigin) fail("STAGING_FRONTEND_UNCONFIGURED");
    const prod=[...p.frontendOrigins,p.apiOrigin,...(p.additionalApiOrigins||[]),...p.mediaOrigins];
    for(const value of [...s.frontendOrigins,s.apiOrigin,s.mediaOrigin]) {
      let url; try {url=new URL(value);} catch(_){fail("STAGING_FRONTEND_TARGET_INVALID");}
      if(url.protocol!=="https:" || url.origin!==value || prod.includes(value)) fail("STAGING_FRONTEND_TARGET_INVALID");
    }
    return {mode:"staging",apiOrigin:s.apiOrigin,blockedOrigins:prod};
  }
  if(policy.mode!=="production" || !policy.production.frontendOrigins.includes(current)) fail("FRONTEND_ORIGIN_NOT_CONFIGURED");
  return {mode:"production",apiOrigin:policy.production.apiOrigin};
}
