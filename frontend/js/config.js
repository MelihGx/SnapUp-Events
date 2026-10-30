"use strict";
import { DEPLOYMENT } from "./deployment-policy.js";
import { resolveFrontendTarget } from "./runtime-target.js";

const target=resolveFrontendTarget(window.location,DEPLOYMENT);
export const API_URL=target.apiOrigin;
const nativeFetch=window.fetch.bind(window);
window.fetch=function snapUpFetch(input,init={}) {
  const raw=typeof input==="string" ? input : input instanceof URL ? input.href : input?.url;
  let origin;
  try {origin=new URL(raw,window.location.href).origin;} catch(_){return nativeFetch(input,init);}
  if(target.mode==="staging" && target.blockedOrigins.includes(origin)) {
    return Promise.reject(Object.assign(new Error("STAGING_PRODUCTION_TARGET_BLOCKED"),{code:"STAGING_PRODUCTION_TARGET_BLOCKED"}));
  }
  return nativeFetch(input,origin===API_URL ? {...init,credentials:"include"} : init);
};
export function apiUrl(path="") {
  return `${API_URL}${path ? `/${String(path).replace(/^\/+/,"")}` : ""}`;
}
