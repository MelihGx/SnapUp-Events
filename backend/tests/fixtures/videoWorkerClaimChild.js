"use strict";
process.once("message", async ({ connection, owner }) => {
  try {
    const db = require("./postgresSession")({ ...connection, env: process.env });
    const data = JSON.parse(await db.query(`select public.claim_video_job('${owner}',30)::text`));
    process.send({ claimed: data });
    // Intentionally stay alive with no heartbeat to model abrupt worker death.
    // The parent kills this process only after the claim transaction committed.
    setInterval(() => {}, 1000);
  } catch (error) { process.send({ error: error.message }); process.exit(1); }
});
