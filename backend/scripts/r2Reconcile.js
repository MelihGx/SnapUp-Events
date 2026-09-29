"use strict";

require("dotenv").config();

const supabase = require("../config/supabaseClient");
const {
  deleteBucketObject,
  listBucketObjects,
} = require("../services/r2MediaService");
const { getR2Buckets } = require("../config/r2");

const DEFAULT_MIN_AGE_HOURS = 24;
const PAGE_SIZE = 500;

function parseArgs(argv) {
  const args = new Set(argv.slice(2));

  return {
    apply: args.has("--apply"),
    verbose: args.has("--verbose"),
  };
}

function getMinAgeHours() {
  const value = Number.parseInt(
    String(process.env.R2_RECONCILE_MIN_AGE_HOURS || ""),
    10,
  );

  if (!Number.isFinite(value)) return DEFAULT_MIN_AGE_HOURS;
  return Math.min(24 * 30, Math.max(1, value));
}

async function loadAllRows(createQuery) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await createQuery().range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    rows.push(...(data || []));

    if (!data || data.length < PAGE_SIZE) {
      return rows;
    }

    from += PAGE_SIZE;
  }
}

async function loadExpectedR2References() {
  const [mediaRows, coverRows] = await Promise.all([
    loadAllRows(() =>
      supabase
        .from("media")
        .select(
          "media_id, event_id, r2_original_key, r2_display_key",
        )
        .eq("storage_provider", "r2"),
    ),
    loadAllRows(() =>
      supabase
        .from("event")
        .select(
          "event_id, event_cover_r2_original_key, event_cover_r2_display_key",
        )
        .eq("event_cover_storage_provider", "r2"),
    ),
  ]);

  const originals = new Map();
  const display = new Map();

  for (const row of mediaRows) {
    if (row.r2_original_key) {
      originals.set(row.r2_original_key, {
        kind: "media",
        id: row.media_id,
        eventId: row.event_id,
      });
    }

    if (row.r2_display_key) {
      display.set(row.r2_display_key, {
        kind: "media",
        id: row.media_id,
        eventId: row.event_id,
      });
    }
  }

  for (const row of coverRows) {
    if (row.event_cover_r2_original_key) {
      originals.set(row.event_cover_r2_original_key, {
        kind: "cover",
        id: row.event_id,
        eventId: row.event_id,
      });
    }

    if (row.event_cover_r2_display_key) {
      display.set(row.event_cover_r2_display_key, {
        kind: "cover",
        id: row.event_id,
        eventId: row.event_id,
      });
    }
  }

  return {
    originals,
    display,
    mediaRowCount: mediaRows.length,
    coverRowCount: coverRows.length,
  };
}

function analyzeBucket({
  objects,
  expected,
  minAgeMs,
  now,
}) {
  const actual = new Map(objects.map((item) => [item.key, item]));

  const missing = [];
  for (const [key, reference] of expected.entries()) {
    if (!actual.has(key)) {
      missing.push({
        key,
        reference,
      });
    }
  }

  const orphan = [];
  const protectedRecent = [];

  for (const item of objects) {
    if (expected.has(item.key)) continue;

    const ageMs = item.lastModified
      ? now - item.lastModified.getTime()
      : Number.POSITIVE_INFINITY;

    if (ageMs >= minAgeMs) {
      orphan.push(item);
    } else {
      protectedRecent.push(item);
    }
  }

  return {
    missing,
    orphan,
    protectedRecent,
    actualCount: objects.length,
  };
}

function printKeyList(title, rows, keySelector, verbose) {
  if (!rows.length) return;

  const limit = verbose ? rows.length : Math.min(rows.length, 25);

  console.log(`\n${title} (${rows.length})`);

  for (const row of rows.slice(0, limit)) {
    console.log(`  - ${keySelector(row)}`);
  }

  if (!verbose && rows.length > limit) {
    console.log(
      `  ... ${rows.length - limit} more (use --verbose to show all)`,
    );
  }
}

async function deleteOrphans(bucket, rows) {
  const failures = [];

  for (const item of rows) {
    try {
      await deleteBucketObject({
        bucket,
        key: item.key,
      });
    } catch (error) {
      failures.push({
        key: item.key,
        error: error.message,
      });
    }
  }

  return failures;
}

async function main() {
  const { apply, verbose } = parseArgs(process.argv);
  const minAgeHours = getMinAgeHours();
  const minAgeMs = minAgeHours * 60 * 60 * 1000;
  const now = Date.now();
  const buckets = getR2Buckets();

  console.log("SnapUp R2 reconciliation");
  console.log("========================");
  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`Orphan safety age: ${minAgeHours} hour(s)`);
  console.log(`Original bucket: ${buckets.originals}`);
  console.log(`Display bucket: ${buckets.display}`);

  const expected = await loadExpectedR2References();

  const [originalObjects, displayObjects] = await Promise.all([
    listBucketObjects({
      bucket: buckets.originals,
      prefix: "events/",
    }),
    listBucketObjects({
      bucket: buckets.display,
      prefix: "events/",
    }),
  ]);

  const originalAnalysis = analyzeBucket({
    objects: originalObjects,
    expected: expected.originals,
    minAgeMs,
    now,
  });

  const displayAnalysis = analyzeBucket({
    objects: displayObjects,
    expected: expected.display,
    minAgeMs,
    now,
  });

  console.log("\nDatabase references");
  console.log(`  R2 media rows: ${expected.mediaRowCount}`);
  console.log(`  R2 cover rows: ${expected.coverRowCount}`);
  console.log(`  Expected originals: ${expected.originals.size}`);
  console.log(`  Expected display objects: ${expected.display.size}`);

  console.log("\nR2 objects");
  console.log(`  Actual originals: ${originalAnalysis.actualCount}`);
  console.log(`  Actual display objects: ${displayAnalysis.actualCount}`);

  console.log("\nIntegrity");
  console.log(`  Missing originals: ${originalAnalysis.missing.length}`);
  console.log(`  Missing display objects: ${displayAnalysis.missing.length}`);
  console.log(`  Orphan originals eligible: ${originalAnalysis.orphan.length}`);
  console.log(`  Orphan display eligible: ${displayAnalysis.orphan.length}`);
  console.log(
    `  Recent unreferenced objects protected: ${
      originalAnalysis.protectedRecent.length +
      displayAnalysis.protectedRecent.length
    }`,
  );

  printKeyList(
    "Missing original objects",
    originalAnalysis.missing,
    (item) =>
      `${item.key} [${item.reference.kind}:${item.reference.id}]`,
    verbose,
  );

  printKeyList(
    "Missing display objects",
    displayAnalysis.missing,
    (item) =>
      `${item.key} [${item.reference.kind}:${item.reference.id}]`,
    verbose,
  );

  printKeyList(
    "Eligible orphan originals",
    originalAnalysis.orphan,
    (item) => item.key,
    verbose,
  );

  printKeyList(
    "Eligible orphan display objects",
    displayAnalysis.orphan,
    (item) => item.key,
    verbose,
  );

  if (!apply) {
    console.log(
      "\nNo objects were deleted. Re-run with --apply only after reviewing this report.",
    );
  } else {
    const [originalFailures, displayFailures] = await Promise.all([
      deleteOrphans(buckets.originals, originalAnalysis.orphan),
      deleteOrphans(buckets.display, displayAnalysis.orphan),
    ]);

    const failures = [
      ...originalFailures.map((item) => ({
        ...item,
        bucket: buckets.originals,
      })),
      ...displayFailures.map((item) => ({
        ...item,
        bucket: buckets.display,
      })),
    ];

    console.log("\nDeletion result");
    console.log(
      `  Deleted: ${
        originalAnalysis.orphan.length +
        displayAnalysis.orphan.length -
        failures.length
      }`,
    );
    console.log(`  Failed: ${failures.length}`);

    printKeyList(
      "Deletion failures",
      failures,
      (item) => `${item.bucket}/${item.key} — ${item.error}`,
      true,
    );
  }

  if (
    originalAnalysis.missing.length ||
    displayAnalysis.missing.length
  ) {
    console.error(
      "\nWARNING: database rows reference R2 objects that do not exist. Do not auto-repair these rows without investigating the affected events.",
    );
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error("\nR2 reconciliation failed:");
  console.error(error);
  process.exitCode = 1;
});
