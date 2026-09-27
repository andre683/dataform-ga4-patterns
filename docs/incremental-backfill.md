# Incremental Backfill Pattern in Dataform

A reusable JavaScript helper that adds surgical date-range reprocessing to any incremental Dataform model via a CLI compilation variable. No code changes needed, no hardcoded dates to revert.

Part of [dataform-ga4-patterns](https://github.com/andre683/dataform-ga4-patterns) — see the [main README](../README.md) for the full multi-brand pipeline this pattern lives in. This page is standalone if you just want the pattern itself.

---

## The problem

Historical backfills used to mean one of two bad options: a full table refresh (slow and expensive), or hardcoding a date directly into the SQL, running it, and hoping you remember to revert it before the next scheduled run.

This pipeline is built on top of [GA4Dataform by Superform Labs](https://ga4dataform.com/), which uses a `date_checkpoint` pattern to handle GA4's 72-hour data latency window. GA4 allows Measurement Protocol events to arrive up to 72 hours late, so GA4Dataform only marks a date "final" (`is_final = TRUE`) once 3+ days have passed. That means the last few days always get reprocessed cleanly on every scheduled run, but there was no clean way to reprocess an arbitrary historical range on demand.

This helper extends that pattern with a `BACKFILL_DATE` compilation variable you pass at run time, instead of editing SQL.

---

## The helper

Place this in your `includes/` directory (e.g. `includes/pre_ops.js`).

Three branches handle every scenario:

1. **Full refresh** — declares the checkpoint using `START_DATE`, no delete
2. **Backfill** — uses the provided `BACKFILL_DATE`, deletes from that date forward
3. **Standard daily incremental** — finds the last finalized date (`is_final = TRUE`) and processes forward from there

```javascript
// includes/pre_ops.js

function getPartitionOverridePreOps(isIncremental, tableName, partitionCol, backfillStart, defaultStart) {
  // 1. Full Refresh
  if (!isIncremental) {
    return `
      DECLARE date_checkpoint DATE DEFAULT DATE('${defaultStart}')
    `;
  }

  // 2. Backfill from a specific date
  if (backfillStart !== "") {
    return `
      DECLARE date_checkpoint DATE DEFAULT DATE('${backfillStart}');
      DELETE FROM ${tableName} WHERE ${partitionCol} >= DATE('${backfillStart}');
    `;
  }

  // 3. Standard Daily Incremental
  return `
    DECLARE date_checkpoint DATE;
    SET date_checkpoint = (
      SELECT COALESCE(MAX(${partitionCol}) + 1, DATE('${defaultStart}'))
      FROM ${tableName}
      WHERE is_final = TRUE
    );

    DELETE FROM ${tableName}
    WHERE ${partitionCol} >= date_checkpoint;
  `;
}

module.exports = { getPartitionOverridePreOps };
```

---

## Usage

In any incremental `.sqlx` model, replace your `pre_operations` boilerplate with a single helper call. The main query filters on `date_checkpoint` as usual.

```javascript
config {
  type: "incremental",
  schema: "analytics_reporting",
  bigquery: {
    partitionBy: "session_date",
    clusterBy: ["brand", "session_id"]
  }
}

pre_operations {
  ${incremental_ops.getPartitionOverridePreOps(
    incremental(),
    self(),
    'session_date', // replace with actual partition column
    dataform.projectConfig.vars.BACKFILL_DATE,
    dataform.projectConfig.vars.START_DATE
  )}
}

SELECT
  ...
FROM ${ref("table")}
WHERE session_date >= date_checkpoint
```

---

## Configuration

Add the compilation variables to `workflow_settings.yaml`. `BACKFILL_DATE` defaults to an empty string, so scheduled runs behave exactly as before.

```yaml
defaultProject: your-project-id
defaultLocation: US
defaultDataset: your_dataset
defaultAssertionDataset: dataform_assertions
dataformCoreVersion: 3.0.0
vars:
  START_DATE: "2023-07-01"  # Used for full refreshes
  BACKFILL_DATE: ''         # CLI only: --vars=BACKFILL_DATE=YYYY-MM-DD
```

---

## CLI

```bash
# Normal scheduled run (handled by Workflow Configuration, not CLI)
# Runs all models tagged in your workflow config on schedule

# Surgical backfill from a specific date
dataform run --vars=BACKFILL_DATE=2026-05-18 --actions=your_model

# Normal incremental run (BACKFILL_DATE is empty, checkpoint = MAX(date) + 1 AND is_final = TRUE)
dataform run --actions=your_model

# Full refresh (rebuilds from START_DATE)
dataform run --full-refresh --actions=your_model
```

Surgical reprocessing. No code changes. No hardcoded dates to revert.

---

## Related

- [Case study: unified GA4 analytics pipeline](https://andrebuilds.com/#work)
- [Written walkthrough with screenshots](https://andrebuilds.com/notes/backfilling-incremental-models-dataform.html)
- [GA4Dataform by Superform Labs](https://ga4dataform.com/)
- [Dataform Tools VS Code extension](https://dataformtools.com/)
- [Dataform docs: compilation variables](https://cloud.google.com/dataform/docs/use-compilation-variables)
