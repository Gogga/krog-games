# KROG Chess Scalability Architecture

> "Scalability cannot be an afterthought. It requires applications and platforms to be designed with scaling in mind."
> — Werner Vogels, CTO Amazon Web Services

---

## 1. Axes of Growth

Before architecting, identify HOW the system will grow:

| Axis | Current | Year 1 | Year 3 | Scaling Strategy |
|------|---------|--------|--------|------------------|
| Concurrent games | 10 | 10,000 | 1,000,000 | Stateless servers + Redis |
| Connected players | 20 | 100,000 | 10,000,000 | WebSocket clusters |
| Position database | 0 | 100M | 10B | PostgreSQL + TimescaleDB |
| Spectators/game | 2 | 1,000 | 100,000 | Pub/Sub fan-out |
| Puzzles | 500 | 100,000 | 10,000,000 | CDN + lazy loading |
| API requests/sec | 10 | 10,000 | 1,000,000 | Horizontal scaling |

---

## 2. Current Architecture (MVP - Doesn't Scale)

```
┌─────────────┐     WebSocket      ┌─────────────────────┐
│   Browser   │◄──────────────────►│   Single Server     │
│   Client    │                    │                     │
└─────────────┘                    │  ┌───────────────┐  │
                                   │  │ Map<roomId,   │  │
                                   │  │   Chess>      │  │ ❌ In-memory
                                   │  │               │  │ ❌ Single node
                                   │  └───────────────┘  │ ❌ No persistence
                                   └─────────────────────┘
```

**Why this doesn't scale (per Vogels):**
- Adding servers doesn't increase capacity (state is local)
- No redundancy possible (state loss on failure)
- Memory limits concurrent games (~10,000 max)

---

## 3. Scalable Architecture (Production)

```
                                    ┌─────────────────┐
                                    │   Load Balancer │
                                    │   (nginx/ALB)   │
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
     ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
     │  Game Server 1  │          │  Game Server 2  │          │  Game Server N  │
     │   (Stateless)   │          │   (Stateless)   │          │   (Stateless)   │
     └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
              │                            │                            │
              └──────────────────────────────────────────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
           ┌──────────────┐      ┌──────────────────┐    ┌──────────────┐
           │    Redis     │      │   PostgreSQL     │    │   S3 / CDN   │
           │   Cluster    │      │   (Primary +     │    │   (Static)   │
           │              │      │    Replicas)     │    │              │
           │ • Game state │      │ • Users          │    │ • Puzzles    │
           │ • Pub/Sub    │      │ • Ratings        │    │ • Lessons    │
           │ • Sessions   │      │ • Game history   │    │ • Openings   │
           │ • Clocks     │      │ • Position stats │    │ • Assets     │
           └──────────────┘      └──────────────────┘    └──────────────┘
```

---

## 4. Key Design Decisions

### 4.1 Stateless Game Servers

**Principle:** "Adding resources should result in proportional performance increase"

```typescript
// ❌ BEFORE: State in server memory
const games = new Map<string, Chess>();

// ✅ AFTER: State in Redis
async function getGame(roomId: string): Promise<GameState> {
  const state = await redis.hgetall(`game:${roomId}`);
  return deserializeGame(state);
}

async function saveGame(roomId: string, game: GameState): Promise<void> {
  await redis.hset(`game:${roomId}`, serializeGame(game));
  await redis.expire(`game:${roomId}`, 86400); // 24h TTL
}
```

**Result:** Add servers → handle more games (linear scaling)

### 4.2 WebSocket Scaling with Redis Pub/Sub

**Principle:** "Redundancy should not result in loss of performance"

```typescript
// Problem: Player A on Server 1, Player B on Server 2
// Solution: Redis Pub/Sub broadcasts to all servers

import { createAdapter } from '@socket.io/redis-adapter';

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// Now io.to(roomId).emit() works across all servers!
```

### 4.3 Spectator Fan-Out

**Principle:** "Handle heterogeneity" (100,000 spectators vs 2 players)

```
Game Room Architecture:

┌─────────────────────────────────────────────────────────┐
│                      Room: ABC123                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Players (Low latency, bidirectional)                  │
│   ┌─────────┐    ┌─────────┐                           │
│   │ White   │    │ Black   │                           │
│   │ WebSocket    │ WebSocket                           │
│   └─────────┘    └─────────┘                           │
│        │              │                                 │
│        └──────┬───────┘                                │
│               ▼                                         │
│        ┌─────────────┐                                 │
│        │ Game State  │                                 │
│        │   (Redis)   │                                 │
│        └──────┬──────┘                                 │
│               │                                         │
│               ▼                                         │
│   Spectators (High latency OK, unidirectional)         │
│   ┌─────────────────────────────────────────────┐      │
│   │         Redis Pub/Sub Channel               │      │
│   │         game:ABC123:spectators              │      │
│   └─────────────────────────────────────────────┘      │
│        │         │         │         │                 │
│        ▼         ▼         ▼         ▼                 │
│   [Spec 1]  [Spec 2]  [Spec 3] ... [Spec 100,000]     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Position Database Scaling

**Principle:** "Algorithms that work at small scale can explode in cost"

```sql
-- ❌ Naive query (explodes at 1B positions)
SELECT * FROM positions WHERE fen_position = '...';

-- ✅ Indexed by hash (O(1) lookup)
CREATE INDEX idx_positions_hash ON positions(fen_hash);
SELECT * FROM positions WHERE fen_hash = 12345678 AND fen_position = '...';

-- ✅ Partitioned by game count (hot vs cold data)
CREATE TABLE positions_hot PARTITION OF positions
  FOR VALUES FROM (1000) TO (MAXVALUE);  -- Popular positions

CREATE TABLE positions_cold PARTITION OF positions
  FOR VALUES FROM (0) TO (1000);  -- Rare positions
```

### 4.5 Content Delivery (Puzzles, Lessons, Openings)

**Principle:** "Heterogeneity - some resources placed further apart"

```
Static Content Strategy:

┌─────────────────┐
│   Origin (S3)   │
│                 │
│ • puzzles.json  │
│ • lessons.json  │
│ • openings.json │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│              CloudFront CDN                      │
│                                                  │
│  Edge Locations:                                 │
│  🌍 Europe  🌎 Americas  🌏 Asia  🌍 Africa     │
│                                                  │
│  TTL: 24 hours (static content)                 │
│  Invalidation: On content update                │
└─────────────────────────────────────────────────┘
         │
         ▼
    [Users worldwide get <50ms response]
```

---

## 5. Implementation Phases

### Phase 0: MVP (Current)
```
✅ Single server
✅ In-memory state
✅ Works for development
⚠️  Max ~100 concurrent games
```

### Phase 1: Persistence (Week 1-2)
```
Add Redis for game state:
- Games survive server restart
- Foundation for horizontal scaling
- Clock state persistence

Add PostgreSQL for users:
- User accounts
- Game history
- Basic ratings
```

### Phase 2: Horizontal Scaling (Week 3-4)
```
Add Socket.IO Redis adapter:
- Multiple game servers
- Load balancer
- Zero-downtime deploys

Result: Handle 10,000+ concurrent games
```

### Phase 3: Position Database (Week 5-8)
```
Implement PHASE7-EVALUATION schema:
- Position statistics
- Move statistics  
- ELO-based filtering

Add game import pipeline:
- PGN parser
- Lichess/Chess.com importers
- Background analysis jobs
```

### Phase 4: Global Scale (Month 3+)
```
Multi-region deployment:
- EU, US, Asia game servers
- Read replicas per region
- Global CDN for static content

Result: Handle 1M+ concurrent players
```

---

## 6. Technology Choices

| Component | Choice | Why |
|-----------|--------|-----|
| Game state | **Redis Cluster** | Sub-ms latency, Pub/Sub built-in |
| User data | **PostgreSQL** | ACID, complex queries, PHASE7 stats |
| WebSocket | **Socket.IO + Redis Adapter** | Built-in scaling support |
| Load balancer | **nginx** or **AWS ALB** | Sticky sessions for WebSocket |
| CDN | **CloudFront** or **Cloudflare** | Global edge caching |
| Container | **Docker + Kubernetes** | Easy horizontal scaling |
| Monitoring | **Prometheus + Grafana** | Metrics, alerting |

---

## 7. Scalability Checklist

Before each feature, ask:

- [ ] **What axis does this grow on?** (users, games, data, requests)
- [ ] **Does this require shared state?** (if yes, how to distribute?)
- [ ] **What happens at 10x load?** (identify bottlenecks)
- [ ] **What happens at 100x load?** (plan for success)
- [ ] **Is there a single point of failure?** (add redundancy)
- [ ] **Does this algorithm scale linearly?** (avoid O(n²) or worse)

---

## 8. Quick Wins for Current Codebase

Even before full refactor, make these changes:

### 8.1 Add Redis (1 hour)
```bash
npm install ioredis
```

```typescript
// server/src/index.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Replace Map with Redis
async function getGame(roomId: string): Promise<Chess | null> {
  const fen = await redis.get(`game:${roomId}:fen`);
  return fen ? new Chess(fen) : null;
}

async function saveGame(roomId: string, game: Chess): Promise<void> {
  await redis.set(`game:${roomId}:fen`, game.fen(), 'EX', 86400);
}
```

### 8.2 Add Socket.IO Redis Adapter (30 min)
```bash
npm install @socket.io/redis-adapter
```

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### 8.3 Add Health Check (10 min)
```typescript
app.get('/health', async (req, res) => {
  const redisOk = await redis.ping() === 'PONG';
  res.json({ 
    status: redisOk ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString()
  });
});
```

---

## 9. Monitoring for Scale

**Key metrics to track:**

| Metric | Warning | Critical |
|--------|---------|----------|
| Concurrent connections | >5,000 | >8,000 |
| Redis memory | >70% | >90% |
| API latency p99 | >200ms | >500ms |
| WebSocket latency p99 | >50ms | >100ms |
| Error rate | >1% | >5% |
| CPU per server | >70% | >90% |

---

## 10. Summary

**Werner Vogels' principles applied to KROG Chess:**

1. ✅ **Identified growth axes early** (games, users, positions, spectators)
2. ✅ **Designed for stateless servers** (Redis for state)
3. ✅ **Planned for redundancy** (multiple servers, database replicas)
4. ✅ **Handled heterogeneity** (CDN for global users, partitioned DBs)
5. ✅ **Avoided expensive algorithms** (hash indexes, pagination)

**Result:** Architecture that scales from 10 to 10,000,000 users without fundamental redesign.

---

> "Is achieving good scalability possible? Absolutely, but only if we architect and engineer our systems to take scalability into account."
> — Werner Vogels
