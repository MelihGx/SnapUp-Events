"use strict";
const fs=require("node:fs"),path=require("node:path");
const {readPolicy,targets}=require("../backend/config/environmentSafety");
const root=path.resolve(__dirname,"..");
const privatePathSegments = new Set([
  "node_modules", "test-results", "playwright-report", "playwright-results",
  "playwright-traces", "playwright-screenshots", "blob-report", "browser-results",
  "test-reports", "test-screenshots", "coverage", "screenshots", "__tests__",
  ".git", ".github", ".vscode", ".idea",
  ".cache", ".tmp", "tmp", "temp", ".npmrc", ".netrc", ".ds_store", "thumbs.db",
]);

function isPublicSource(frontendRoot, source) {
  const relative = path.relative(frontendRoot, source);
  if (!relative) return true;
  const segments = relative.toLowerCase().split(path.sep);
  const name = segments[segments.length - 1];
  if (segments[0] === "tests" || segments.some((segment) =>
    privatePathSegments.has(segment) || segment.startsWith(".env")
  )) return false;
  if (/(?:^|\.)(?:spec|test|backup)\.[^.]+$/.test(name) ||
      /^(?:playwright|vitest|jest)\.config\./.test(name) ||
      /^(?:trace(?:[-.].*)?|playwright[-.]trace.*)\.zip$/.test(name) ||
      /^(?:(?:playwright|test)[-.])?(?:report|screenshot)(?:[-.].*)?\.(?:html|json|xml|png|jpe?g|webp)$/.test(name) ||
      /^test-(?:failed|finished)-\d+\.(?:png|jpe?g|webp)$/.test(name) ||
      /(?:\.(?:tmp|temp|swp|swo|bak|log|tap)|~)$/.test(name)) return false;

  // A symlink can point outside the public tree or into an excluded directory.
  const entry = fs.lstatSync(source);
  return entry.isFile() || entry.isDirectory();
}

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
  const frontendRoot = path.join(root, "frontend");
  fs.cpSync(frontendRoot,output,{recursive:true,force:false,errorOnExist:true,
    filter:(source)=>isPublicSource(frontendRoot, source)});
  fs.writeFileSync(path.join(output,"js/deployment-policy.js"),`// Generated public targets; no credentials.\nexport const DEPLOYMENT = ${JSON.stringify({mode,production,staging},null,2)};\n`);
  fs.writeFileSync(path.join(output,"_headers"),headers);
  return output;
}
if(require.main===module) {
  try {console.log(buildFrontend({mode:process.argv[2]}));}
  catch(error) {console.error(error.code||error.message);process.exitCode=1;}
}
module.exports={buildFrontend};
