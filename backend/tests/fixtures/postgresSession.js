"use strict";
// Persistent psql connections to the disposable cluster supplied by the launcher.
// No dotenv, PGHOST, external database or npm database adapter is used.
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");

module.exports = function postgresSession({ executable, args, env }) {
  const child = spawn(executable, ["-X", "-w", "-qAt", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose", ...args],
    { env, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  let pending, buffer = "", stderr = "", ended = false;
  const closed = new Promise((resolve) => {
    child.once("error", (error) => { ended = true; pending?.reject(error); resolve(); });
    child.once("close", (code) => {
      ended = true;
      if (pending) pending.reject(Object.assign(new Error(stderr || `psql exited ${code}`), {
        sqlState: stderr.match(/ERROR:\s+([A-Z0-9]{5}):/)?.[1],
      }));
      resolve();
    });
  });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newline).replace(/\r$/, ""); buffer = buffer.slice(newline + 1);
      if (!pending) continue;
      if (line === pending.marker) { const done = pending; pending = null; done.resolve(done.lines.join("\n").trim()); }
      else pending.lines.push(line);
    }
  });
  return {
    query(statement) {
      if (ended || pending) return Promise.reject(new Error("psql session is closed or busy"));
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { child.kill(); reject(new Error("isolated SQL session deadline")); }, 15000);
        pending = { marker: `patch6_${crypto.randomUUID()}`, lines: [],
          resolve(value) { clearTimeout(timer); resolve(value); }, reject(error) { clearTimeout(timer); reject(error); } };
        stderr = "";
        child.stdin.write(`${statement};\nselect '${pending.marker}';\n`, (error) => { if (error) pending?.reject(error); });
      });
    },
    async close() {
      if (!ended) child.stdin.end("\\q\n");
      const timer = setTimeout(() => child.kill(), 2000);
      try { await closed; } finally { clearTimeout(timer); }
    },
  };
};
