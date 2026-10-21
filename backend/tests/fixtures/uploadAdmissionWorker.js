"use strict";

// Child of the disposable-PG test only; no environment/service configuration.
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { createUploadAdmissionService } = require("../../services/uploadAdmissionService");

async function main() {
  if (!process.send) throw new Error("Test worker requires IPC");
  const config = JSON.parse(process.argv[2]);
  const exec = promisify(execFile);
  const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
  const service = createUploadAdmissionService({ localLimit: 6, log() {}, supabase: {
    async rpc(name, args) {
      if (!["acquire_upload_admission", "renew_upload_admission", "release_upload_admission"].includes(name)) throw new Error("Unexpected RPC");
      const { stdout } = await exec(config.psql, ["-X", "-w", "-h", "127.0.0.1", "-p", String(config.port), "-U", config.user, "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-c", `select public.${name}(${Object.values(args).map(quote).join(",")})::text`], { windowsHide: true, timeout: 10000 });
      return { data: JSON.parse(stdout.trim()) };
    },
  } });
  const results = await Promise.allSettled(config.guests.map((guestId) => service.acquire({ eventId: config.eventId, guestId })));
  const leases = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
  process.send({ granted: leases.length, denied: results.length - leases.length });
  await new Promise((resolve) => process.once("message", resolve));
  await Promise.all(leases.map((lease) => lease.release()));
  process.disconnect();
}

if (require.main === module) main().catch((error) => {
  process.send?.({ error: error.message });
  process.exitCode = 1;
  process.disconnect?.();
});
