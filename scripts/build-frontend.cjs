"use strict";
const fs=require("node:fs"),path=require("node:path");
const {readPolicy,targets}=require("../backend/config/environmentSafety");
const root=path.resolve(__dirname,"..");
function buildFrontend({mode,policy=readPolicy(),outputDir=path.join(root,"artifacts",`${mode}-frontend`)}) {
  if(!["production","staging"].includes(mode)) throw new Error("INVALID_BUILD_ENVIRONMENT");
  const artifacts=path.join(root,"artifacts");
  const output=path.resolve(outputDir);
  if(!output.startsWith(artifacts+path.sep) || fs.existsSync(output)) throw new Error("BUILD_OUTPUT_MUST_BE_NEW_ARTIFACT_DIRECTORY");
  let staging=null;
  if(mode==="staging") {
    const s=targets(policy).staging;
    staging={frontendOrigins:s.frontendOrigins,apiOrigin:s.apiOrigin,mediaOrigin:s.mediaOrigin};
  }
  const p=policy.production;
  const production={frontendOrigins:p.frontendOrigins,apiOrigin:p.apiOrigin,additionalApiOrigins:p.additionalApiOrigins,mediaOrigins:p.mediaOrigins};
  let headers=fs.readFileSync(path.join(root,"frontend/_headers"),"utf8");
  if(mode==="staging") {
    const forbidden=new Set([...p.frontendOrigins,p.apiOrigin,...(p.additionalApiOrigins||[]),...p.mediaOrigins]);
    const match=headers.match(/Content-Security-Policy: ([^\r\n]+)/);
    if(!match) throw new Error("CSP_TEMPLATE_MISSING");
    const replaced=match[1].split(";").map((directive)=>{
      const parts=directive.trim().split(/\s+/),name=parts[0];
      if(!["connect-src","img-src","media-src"].includes(name)) return directive.trim();
      const entries=parts.slice(1).filter((entry)=>!forbidden.has(entry));
      entries.push(staging.mediaOrigin); if(name==="connect-src") entries.push(staging.apiOrigin);
      return [name,...new Set(entries)].join(" ");
    }).join("; ");
    headers=headers.replace(match[0],`Content-Security-Policy: ${replaced}`);
  }
  fs.mkdirSync(artifacts,{recursive:true});
  fs.cpSync(path.join(root,"frontend"),output,{recursive:true,force:false,errorOnExist:true,
    filter:(source)=>!path.basename(source).startsWith(".env")});
  fs.writeFileSync(path.join(output,"js/deployment-policy.js"),`// Generated public targets; no credentials.\nexport const DEPLOYMENT = ${JSON.stringify({mode,production,staging},null,2)};\n`);
  fs.writeFileSync(path.join(output,"_headers"),headers);
  return output;
}
if(require.main===module) {
  try {console.log(buildFrontend({mode:process.argv[2]}));}
  catch(error) {console.error(error.code||error.message);process.exitCode=1;}
}
module.exports={buildFrontend};
