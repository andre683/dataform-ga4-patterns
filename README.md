# dataform-ga4-patterns

Clean-room patterns extracted from a production Dataform project that unifies GA4 data across 8 ecommerce brands into a single BigQuery warehouse. All company-specific values (project IDs, property IDs, brand names, hostnames) have been replaced with placeholders.

The full case study is at [andrebuilds.com/work/unified-ga4-pipeline.html](https://andrebuilds.com/work/unified-ga4-pipeline.html).

---

## What this is

I built and maintain a Dataform pipeline that takes GA4 event exports from 8 brands, runs them through shared staging logic, and produces a unified session and transaction layer used by analysts and reporting tools. The same SQL runs for every brand with no copy-pasting and no per-brand branches.

This repo contains the architectural patterns that make that possible. It is not a plug-and-play package. It is a reference for how to structure a multi-brand GA4 pipeline in Dataform, and a record of the decisions I made along the way.

The upstream event layer builds on [GA4Dataform by Superform Labs](https://ga4dataform.com/), which handles raw event unnesting and sessionization. The patterns here live on top of that.

---

## Architecture

```
GA4 BigQuery exports (one dataset per brand, via GA4Dataform)
        |
        v
  ga4_staging          intermediate tables: union, eligibility, sessions, transactions
        |
        v
  ga4_unified          fact and dimension tables: sessions, events, transactions, paid media
        |
        v
  Reporting            Looker Studio, Power BI
```

Assertions run in a separate dataset (`ga4_assertions`) and act as gates before downstream tables are updated.

---

## Key patterns

### 1. Config-driven brand modeling (`includes/brands.js`)

Each brand is one object in an array. Every staging and unified model iterates over this array with `brands.map()`. Adding a new brand means adding one entry to this file. No model files change.

Each brand object carries the GA4 property ID, the source BigQuery dataset name, the canonical hostnames, the Google Search Console dataset, and the Google Ads customer ID. All filters and joins that are brand-specific derive from this config at compile time.

Helper functions `buildHostnameFilter()` and `buildGadsCase()` are generated from the same config, so the filter logic and the brand list can never get out of sync.

### 2. Canonical session eligibility (`definitions/analytics_staging/int_ga4_sessions_filters.sqlx`)

Every filter that determines whether a session counts lives in one incremental table. Downstream models join to this table rather than re-implementing filter logic inline.

Filters applied here:
- Hostname allowlist per brand (derived from `brands.js`)
- Country exclusions: some geographies are bot-proxy sources; others are where the development team is based
- Internal traffic type exclusion
- Referral exclusion list (tools, internal systems, known bad referrers)

When a filter changes, it changes here and applies to every downstream fact table automatically.

### 3. Incremental pre-ops with `BACKFILL_DATE` (`includes/pre_ops.js`)

The `getPartitionOverridePreOps()` helper handles three modes:

| Run type | `date_checkpoint` is set to | Also does |
|---|---|---|
| Full refresh | `START_DATE` | Nothing |
| Backfill | `BACKFILL_DATE` (passed via CLI) | Deletes rows `>= BACKFILL_DATE` before inserting |
| Standard incremental | `MAX(partition_col) + 1` where `is_final = TRUE` | Deletes rows `>= date_checkpoint` before inserting |

`BACKFILL_DATE` defaults to an empty string in `workflow_settings.yaml`. Setting it via CLI triggers the backfill branch without touching any model file. Clearing it returns to normal incremental behavior on the next run.

```
dataform run --vars=BACKFILL_DATE=2024-01-15 --actions=my_model
```

See the companion note: [Backfilling incremental models in Dataform with a compilation variable](https://andrebuilds.com/notes/backfilling-incremental-models-dataform.html).

### 4. Idempotency gate assertion (`definitions/assertions/ga4_yesterday_gate.sqlx`)

A Dataform assertion that checks whether the pipeline has already processed the latest available data across all brands. If the watermark table shows all brands are current, the assertion fails intentionally, which blocks downstream models from reprocessing data that is already up to date.

When any brand has new data the assertion returns no rows, passes, and the downstream run proceeds.

This makes the pipeline safe to trigger manually or retry without risk of double-processing.

### 5. Centralized channel classification (`includes/channel_helpers.js`)

Source, medium, campaign, and click ID signals are mapped to 18 channel categories and then to 34 marketing group IDs in one file. Every model that needs a channel dimension calls this helper. The classification logic is not duplicated across models.

The 18 channels follow a modified GA4 default channel grouping, extended for acquisition types common in direct-to-consumer ecommerce. The 34 marketing groups are a finer-grained segmentation used for campaign performance reporting.

---

## Files

```
workflow_settings.yaml
  Project config and compilation variables (START_DATE, BACKFILL_DATE, etc.)

includes/
  brands.js                     Brand config array; source of truth for all brand-specific values
  ga4_config.js                 Shared constants: start date, referral exclusions, country exclusions
  pre_ops.js                    Incremental pre-operations helper
  channel_helpers.js            Channel and marketing group classification functions

definitions/
  analytics_staging/
    int_ga4_events.sqlx         Unions raw GA4 events across all brands (incremental)
    int_ga4_sessions_filters.sqlx  Canonical session eligibility table (incremental)
  assertions/
    ga4_yesterday_gate.sqlx     Idempotency gate: blocks runs when all brands are already current
```

---

## Placeholders

All company-specific values have been replaced:

| Placeholder | Stands for |
|---|---|
| `your-gcp-project-id` | GCP project ID |
| `ga4_staging`, `ga4_unified`, `ga4_assertions` | BigQuery dataset names |
| `ga4_brand_a_source` ... `ga4_brand_h_source` | Per-brand GA4 export dataset names |
| `BRAND_A` ... `BRAND_H` | Brand codes |
| `000000001` ... `000000008` | GA4 property IDs |
| `www.brand-a.example.com` ... | Brand hostnames |
| `your-company.atlassian.net` etc. | Internal tool domains in the referral exclusion list |
| `your-crm-platform` | Internal CRM platform name used as a traffic source |

---

## Related

- Case study: [andrebuilds.com](https://andrebuilds.com/work/unified-ga4-pipeline.html)
- Upstream event layer: [GA4Dataform by Superform Labs](https://ga4dataform.com/)
- Backfill pattern note: [andrebuilds.com/notes/backfilling-incremental-models-dataform.html](https://andrebuilds.com/notes/backfilling-incremental-models-dataform.html)
