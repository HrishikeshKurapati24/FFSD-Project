# Implementation Plan: High-Performance Embedding Strategy

This plan outlines the strategic transition to a read-optimized, document-centric architecture. We will collapse fragmented analytics and socials into their respective profiles and introduce product snapshots within campaigns.

## User Review Required

> [!IMPORTANT]
> **Data Synchronization Policy**: Once schemas are merged, the Service Layer must be updated to treat the embedded documents as the "Primary" for read operations. We will maintain the old collections during the transition for write-safety.

> [!WARNING]
> **Schema Breaking Changes**: This will deprecateSeveral existing `$lookup` stages in aggregation pipelines. We must audit all service files listed in Phase 2.

## Phase 1: Database Schema Overhaul (Infrastructure)

Update the core Mongoose models to accommodate the merged data structures.

### [Influencer & Brand] Model Updates
#### [MODIFY] [InfluencerMongo.js](file:///Volumes/Work/Semester%20-%206/WBD/Project/models/InfluencerMongo.js)
*   **Merge `InfluencerSocials`**: Add `socialProfiles` array to `influencerInfoSchema`.
*   **Merge `InfluencerAnalytics`**: Add `analytics_snapshot` object (Reach, Engagement, Demographics).

#### [MODIFY] [BrandMongo.js](file:///Volumes/Work/Semester%20-%206/WBD/Project/models/BrandMongo.js)
*   **Merge `BrandSocials`**: Add `socialProfiles` array to `brandInfoSchema`.
*   **Merge `BrandAnalytics`**: Add `performance_metrics` object.

### [Campaign] Model Updates
#### [MODIFY] [CampaignMongo.js](file:///Volumes/Work/Semester%20-%206/WBD/Project/models/CampaignMongo.js)
*   **Merge `CampaignMetrics`**: Move `revenue`, `roi`, `clicks`, and `conversions` into a `metrics` sub-document.
*   **Partial Product Embedding**: Add `featured_products` array (id, name, price, thumbnail).

---

## Phase 2: Service & Controller Refactoring (Logic)

Update the business logic to maintain the new embedded structures and query them directly.

### Tasks
1.  **Influencer Service**: Update `influencerProfileService.js` to read/write directly to the embedded `socialProfiles` and `analytics_snapshot`.
2.  **Brand Service**: Update `brandProfileService.js` to ensure brand discovery matches the new schema.
3.  **Campaign Service**: Update `brandCampaignService.js` and `update_campaign_revenue_fixed.js` to sync metrics directly into the `CampaignInfo` document.
4.  **Order Service**: Update the product linkage logic to populate the `featured_products` summary in campaigns.
5.  **Admin Discovery**: Refactor the global search and category filters in `adminSearchService.js` to remove all `$lookup` stages for analytics/socials.

---

## Phase 3: Verification & Benchmarking (Validation)

Validate the implementation and quantify performance gains.

### Tasks
1.  **Backfill Data**: Run a "Master Migration" script to populate new embedded fields from old collection data.
2.  **Verify Integrity**: Run integrity checks to ensure embedded metrics match the source-of-truth collections.
3.  **Benchmark Baseline (Before)**: Update `benchmark_before.js` with B18-B20 (Legacy lookup queries). Run and save results.
4.  **Benchmark Optimized (After)**: Update `benchmark_after.js` with B18-B20 (New embedded queries). Run and generate comparison.

#### New Benchmarks:
*   **B18**: Get Full Influencer Profile (Old: 3 round-trips vs New: 1 fetch).
*   **B19**: Admin Dashboard Feed (Old: `$lookup` to metrics vs New: Direct projection).
*   **B20**: Campaign Product List (Old: `$lookup` to Products vs New: Embedded array).

## Open Questions
*   **Write Strategy**: Should we completely deprecate writing to separate `Analytics` collections, or keep them as a "Historical Log"?
*   **Synchronicity**: Do we need to ensure immediate consistency for metrics, or is eventual consistency (via background jobs) acceptable for the embedded snapshots?
