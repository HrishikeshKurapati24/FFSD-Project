# 🚀 Redis Performance Benchmark Results

This report details the performance impact of Redis caching on the core dashboard and discovery endpoints of the CollabSync platform.

## 📊 Overview
The benchmark tests the "Cold Load" (direct database/service processing) versus a "Redis Hit" (retrieving the pre-processed JSON from cache).

| Scenario | Cold Load (Time to Process) | Redis Hit (Time to Retrieve) | Speedup Improvement |
| :--- | :---: | :---: | :---: |
| **Brand Dashboard** | 650.5 ms | 30.4 ms | **95.3%** |
| **Influencer Dashboard** | 482.1 ms | 28.5 ms | **94.1%** |
| **Brand Explore (Discovery)** | 300.6 ms | 32.4 ms | **89.2%** |
| **Influencer Explore** | 99.7 ms | 46.0 ms | **53.8%** |

---

## 🔍 Key Insights

### 1. Brand Dashboard (High Complexity)
The Brand Dashboard is the most expensive operation as it aggregates data from multiple services:
- Subscription status & limits
- Active campaign metrics
- Product inventory & sales
- Financial analytics
- **Impact:** Caching reduces wait time from over half a second to near-instant (30ms).

### 2. Startup Benchmarks & Fallbacks
The script automatically tests the application's resiliency. When running outside of the Docker environment:
- **Elasticsearch:** Falls back to MongoDB regex search when `elasticsearch:9200` is unreachable.
- **Redis:** Automatically reconnects or fallbacks during the processing phase.

### 3. Scaling Benefits
By offloading these complex queries to Redis, the application can handle significantly more concurrent users without increasing the load on the MongoDB Atlas cluster.

---

## 🛠️ Reproduction
To re-run these benchmarks on your local machine:

1. Ensure your `.env` has a valid `MONGO_URI`.
2. Run the specialized test script:
   ```bash
   node scripts/test_redis_5_scenarios.js
   ```

> *Generated on April 20, 2026*
