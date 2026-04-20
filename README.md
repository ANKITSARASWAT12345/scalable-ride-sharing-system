# ⚡ RideApp — Production-Grade Ride-Hailing Platform

<div align="center">

![Java](https://img.shields.io/badge/Java_17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.2-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![Angular](https://img.shields.io/badge/Angular_17-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_15-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis_7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white)

**A full-stack ride-hailing platform built from scratch with real-world algorithms, real-time tracking, payments, and production-grade architecture — inspired by Uber and Rapido.**

[System Design](#-system-design) • [Algorithms](#-core-algorithms) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Reference](#-api-reference) • [Phases](#-project-phases)

</div>

---

## 📌 What is this project?

RideApp is a **production-grade ride-hailing backend + frontend** built entirely from scratch. It implements the core engineering challenges that companies like Uber, Rapido, and Ola solve at scale:

- **Real-time driver-rider matching** using a custom scoring algorithm
- **Live GPS tracking** over persistent WebSocket connections
- **Dynamic surge pricing** using Exponential Moving Averages
- **ETA calculation** accounting for road circuity and time-of-day traffic
- **Payment processing** with Razorpay, in-app wallet, and atomic transactions
- **Ride receipt generation** as PDF with email delivery

This is not a tutorial project. Every layer — from the Haversine SQL query to the JWT WebSocket handshake — is implemented the way it would be in a production codebase.

---

## 🏗️ System Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   ┌──────────────────────┐    ┌──────────────────────┐         │
│   │   Rider Angular App  │    │  Driver Angular App  │         │
│   │   localhost:4200     │    │  localhost:4200      │         │
│   │                      │    │                      │         │
│   │  • Book ride UI      │    │  • Online/offline    │         │
│   │  • Live map tracking │    │  • Accept rides      │         │
│   │  • Wallet + payment  │    │  • GPS broadcasting  │         │
│   │  • Post-ride rating  │    │  • Trip history      │         │
│   └──────────┬───────────┘    └──────────┬───────────┘         │
│              │ HTTP/REST + WebSocket      │                     │
└──────────────┼────────────────────────────┼─────────────────────┘
               │                            │
┌──────────────▼────────────────────────────▼─────────────────────┐
│                     SPRING BOOT BACKEND                         │
│                       localhost:8080                            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  JWT Filter │  │ STOMP/WS    │  │   REST Controllers      │ │
│  │  (every req)│  │ Hub         │  │   /api/auth/**          │ │
│  │             │  │             │  │   /api/rides/**         │ │
│  │  Validates  │  │  Real-time  │  │   /api/payments/**      │ │
│  │  token,     │  │  events     │  │   /api/driver/**        │ │
│  │  sets user  │  │  push       │  │   /api/ratings/**       │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         └────────────────▼─────────────────────┘               │
│                          │                                      │
│  ┌────────────┐  ┌────────────────┐  ┌──────────────────────┐  │
│  │AuthService │  │  RideService   │  │  PaymentService      │  │
│  │            │  │                │  │                      │  │
│  │• register  │  │• bookRide()    │  │• createOrder()       │  │
│  │• login     │  │• matching algo │  │• verifySignature()   │  │
│  │• JWT issue │  │• surge pricing │  │• walletDebit/Credit  │  │
│  │• BCrypt    │  │• ETA engine    │  │• atomicTransaction() │  │
│  └──────┬─────┘  └────────┬───────┘  └──────────┬───────────┘  │
│         └────────────────▼──────────────────────┘              │
│                          │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Spring Data JPA / Hibernate                │    │
│  └─────────────────────────┬───────────────────────────────┘    │
└────────────────────────────┼────────────────────────────────────┘
                             │ JDBC
┌────────────────────────────▼────────────────────────────────────┐
│                      PostgreSQL 15                              │
│                                                                 │
│   users  │  driver_profiles  │  rides  │  driver_locations     │
│   wallets  │  transactions  │  payments  │  ratings            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Request Lifecycle — What happens when a rider books a ride

```
Rider clicks "Book Ride"
        │
        ▼
Angular BookingComponent
  └─ RideService.bookRide(request)
  └─ HttpClient POST /api/rides/book
  └─ Auth Interceptor adds: Authorization: Bearer <jwt>
        │
        ▼
JwtAuthenticationFilter (Spring Security)
  └─ Extracts JWT from header
  └─ Validates signature with HMAC-SHA256
  └─ Sets SecurityContext with user email + role
  └─ Forwards request to controller
        │
        ▼
RideController.bookRide()
  └─ @PreAuthorize("hasRole('RIDER')") ← role guard
  └─ @Valid validates BookRideRequest fields
  └─ Calls RideService
        │
        ▼
RideService.bookRide()
  ├─ [1] DriverMatchingService.findBestDriver()
  │       └─ Expanding radius search: 3km → 5km → 8km
  │       └─ Score each driver: (dist×0.4)+(rating×0.3)+(acceptance×0.2)+(exp×0.1)
  │       └─ Returns highest-scoring driver
  │
  ├─ [2] SurgePricingService.getSurgeMultiplier()
  │       └─ Count pending rides in zone (demand)
  │       └─ Count available drivers in zone (supply)
  │       └─ demand/supply ratio → raw surge multiplier
  │       └─ EMA smoothing: newSurge = (0.3 × raw) + (0.7 × prev)
  │
  ├─ [3] EtaService.calculateEtaMinutes()
  │       └─ Haversine distance (driver → pickup)
  │       └─ × road circuity factor (1.3)
  │       └─ ÷ vehicle avg speed
  │       └─ × time-of-day traffic multiplier
  │
  ├─ [4] FareCalculatorService.calculate()
  │       └─ baseFare + (distanceKm × perKmRate)
  │       └─ apply surge multiplier
  │       └─ enforce minimum fare
  │
  └─ Save Ride to PostgreSQL
  └─ RealTimeService.sendPrivateNotification() → driver's WebSocket
        │
        ▼
RideResponse returned to Angular
  └─ Angular starts WebSocket subscriptions:
       /topic/ride/{id}/driver-location  ← live GPS
       /topic/ride/{id}/status           ← status changes
  └─ Google Maps renders driver pin
  └─ Pin animates with 60fps linear interpolation
```

---

### Database Schema

```
┌─────────────────────────────────┐       ┌───────────────────────────────┐
│            users                │       │       driver_profiles         │
├─────────────────────────────────┤       ├───────────────────────────────┤
│ id          UUID  PK            │◄──────│ user_id      UUID  FK         │
│ name        VARCHAR(100)        │       │ vehicle_type ENUM             │
│ email       VARCHAR(150) UNIQUE │       │ vehicle_number VARCHAR(20)    │
│ phone       VARCHAR(20)  UNIQUE │       │ license_number VARCHAR(50)    │
│ password    VARCHAR(255)        │       │ is_verified  BOOLEAN          │
│ role        ENUM(RIDER,DRIVER)  │       │ rating       DECIMAL(3,2)     │
│ is_active   BOOLEAN             │       │ acceptance_rate FLOAT         │
│ created_at  TIMESTAMP           │       │ total_ratings  INT            │
└──────────┬──────────────────────┘       └───────────────────────────────┘
           │
           │ 1:many (rider)              ┌───────────────────────────────┐
           │ 1:many (driver)             │       driver_locations        │
           ▼                             ├───────────────────────────────┤
┌──────────────────────────────────────┐ │ driver_id   UUID  FK (unique) │
│                rides                 │ │ latitude    DOUBLE            │
├──────────────────────────────────────┤ │ longitude   DOUBLE            │
│ id             UUID  PK              │ │ is_available BOOLEAN          │
│ rider_id       UUID  FK → users      │ │ updated_at  TIMESTAMP         │
│ driver_id      UUID  FK → users      │ └───────────────────────────────┘
│ pickup_address VARCHAR              │
│ pickup_lat     DOUBLE               │  ┌───────────────────────────────┐
│ pickup_lng     DOUBLE               │  │           ratings             │
│ drop_address   VARCHAR              │  ├───────────────────────────────┤
│ drop_lat       DOUBLE               │  │ id         UUID  PK           │
│ drop_lng       DOUBLE               │  │ ride_id    UUID  FK           │
│ status         ENUM                 │  │ rater_id   UUID  FK → users   │
│ fare           DECIMAL(10,2)        │  │ ratee_id   UUID  FK → users   │
│ distance_km    DECIMAL(6,2)         │  │ stars      INT (1-5)          │
│ vehicle_type   ENUM                 │  │ comment    VARCHAR(500)        │
│ surge_multiplier DECIMAL(4,2)       │  │ created_at TIMESTAMP          │
│ eta_minutes    INT                  │  │ UNIQUE(ride_id, rater_id)     │
│ requested_at   TIMESTAMP            │  └───────────────────────────────┘
│ accepted_at    TIMESTAMP            │
│ picked_up_at   TIMESTAMP            │  ┌───────────────────────────────┐
│ completed_at   TIMESTAMP            │  │           wallets             │
│ cancelled_at   TIMESTAMP            │  ├───────────────────────────────┤
└──────────────────────────────────────┘ │ id           UUID  PK         │
           │                             │ user_id      UUID  FK(unique) │
           │ 1:1                         │ balance      DECIMAL(12,2)    │
           ▼                             │ total_earned DECIMAL(12,2)    │
┌──────────────────────────────────────┐ │ total_spent  DECIMAL(12,2)    │
│              payments                │ └──────────┬────────────────────┘
├──────────────────────────────────────┤            │ 1:many
│ id                    UUID  PK       │            ▼
│ ride_id               UUID  FK(uniq) │ ┌──────────────────────────────┐
│ rider_id              UUID  FK       │ │         transactions          │
│ amount                DECIMAL(12,2)  │ ├──────────────────────────────┤
│ platform_commission   DECIMAL(12,2)  │ │ id            UUID  PK       │
│ driver_earning        DECIMAL(12,2)  │ │ wallet_id     UUID  FK       │
│ method  ENUM(WALLET,UPI,CARD,CASH)   │ │ ride_id       UUID  FK       │
│ status  ENUM(PENDING,COMPLETED,..)   │ │ type   ENUM(DEBIT,CREDIT,..) │
│ razorpay_order_id     VARCHAR        │ │ amount        DECIMAL(12,2)  │
│ razorpay_payment_id   VARCHAR        │ │ balance_after DECIMAL(12,2)  │
│ created_at            TIMESTAMP      │ │ description   VARCHAR        │
│ completed_at          TIMESTAMP      │ │ created_at    TIMESTAMP      │
└──────────────────────────────────────┘ └──────────────────────────────┘
```

---

### Real-time Architecture (WebSocket)

```
DRIVER APP                    SPRING BOOT                    RIDER APP
    │                              │                              │
    │  WS CONNECT                  │                              │
    │  Authorization: Bearer <jwt> │                              │
    ├─────────────────────────────►│                              │
    │                              │ WebSocketAuthInterceptor     │
    │                              │ validates JWT on CONNECT     │
    │  101 Switching Protocols     │                              │
    │◄─────────────────────────────┤                              │
    │                              │         WS CONNECT           │
    │                              │◄─────────────────────────────┤
    │                              │ 101 Switching Protocols      │
    │                              ├─────────────────────────────►│
    │                              │                              │
    │  every 3 seconds:            │  subscribe to:               │
    │  SEND /app/driver.location   │  /topic/ride/{id}/driver-loc │
    │  {lat, lng, rideId}          │  /topic/ride/{id}/status     │
    ├─────────────────────────────►│                              │
    │                              │ WebSocketController          │
    │                              │ .handleDriverLocation()      │
    │                              │ → saves to DB                │
    │                              │ → RealTimeService            │
    │                              │   .broadcastDriverLocation() │
    │                              │                              │
    │                              │  PUSH: driver-location event │
    │                              ├─────────────────────────────►│
    │                              │  {lat, lng, timestamp}       │
    │                              │                              │
    │  SEND /app/driver.location   │  Angular receives instantly  │
    │  {new lat, new lng}          │  → updates marker position   │
    ├─────────────────────────────►│  → 60fps smooth animation    │
    │                              ├─────────────────────────────►│
    │                              │                              │
    │  PATCH /rides/{id}/status    │                              │
    │  status=COMPLETED            │                              │
    ├──(REST)──────────────────────►│                              │
    │                              │ → processes payment          │
    │                              │ → generates PDF receipt      │
    │                              │ → sends receipt email        │
    │                              │ PUSH: status=COMPLETED       │
    │                              ├─────────────────────────────►│
    │                              │                              │
    │                              │  Angular shows post-ride     │
    │                              │  rating modal automatically  │
```

---

## 🧮 Core Algorithms

### 1. Driver Matching — Score-Based Selection

Unlike naive "nearest driver" matching, RideApp scores every available driver across 4 dimensions and selects the highest scorer. This ensures riders get reliable, high-quality drivers — not just whoever is geographically closest.

```
SCORE = (distanceScore × 0.40)
      + (ratingScore   × 0.30)
      + (acceptScore   × 0.20)
      + (expScore      × 0.10)

Where each factor is normalised to 0–100:

distanceScore  = max(0, 100 - (distKm / 8.0 × 100))
ratingScore    = 50 + ((rating - 3.5) / 1.5 × 50)  [for rating ≥ 3.5]
               = rating / 3.5 × 50                  [for rating < 3.5, heavy penalty]
acceptScore    = acceptanceRate × 100
expScore       = min(100, totalTrips / 500 × 100)
```

**Example — 3 drivers competing for the same ride:**

```
┌──────────┬──────────┬────────┬──────────────┬────────────┬───────────┐
│  Driver  │ Distance │ Rating │ Accept. Rate │ Total Trips│   SCORE   │
├──────────┼──────────┼────────┼──────────────┼────────────┼───────────┤
│    A     │  0.8 km  │  4.2★  │     60%      │     20     │   76.0    │
│  B ✓WIN  │  1.5 km  │  4.9★  │     95%      │    300     │   87.5    │
│    C     │  0.3 km  │  3.5★  │     40%      │      5     │   65.0    │
└──────────┴──────────┴────────┴──────────────┴────────────┴───────────┘

Driver B wins despite being 1.5km away vs C at 0.3km.
Why? Because 4.9★ rating + 95% acceptance rate matters more than proximity.
```

**Expanding Radius Search:** If no driver is found within 3km, the search automatically expands to 5km, then 8km. This is "iterative deepening" — the same technique used in chess engines.

---

### 2. Haversine Formula — Real-World Distance on a Curved Earth

The Earth is not flat. A naive coordinate subtraction can produce 20–30% errors for city-scale distances. The Haversine formula calculates the true great-circle distance between two GPS points.

```
a = sin²(Δlat/2) + cos(lat₁) × cos(lat₂) × sin²(Δlng/2)
c = 2 × atan2(√a, √(1−a))
d = R × c                          (R = 6371 km, Earth's radius)
```

**Implemented in PostgreSQL as a native query** so the filtering happens at the database level — not in Java, not in memory:

```sql
SELECT dl.* FROM driver_locations dl
JOIN driver_profiles dp ON dp.user_id = dl.driver_id
WHERE dl.is_available = true
  AND dp.vehicle_type = :vehicleType
  AND (
    6371 * acos(
      cos(radians(:lat)) * cos(radians(dl.latitude))
      * cos(radians(dl.longitude) - radians(:lng))
      + sin(radians(:lat)) * sin(radians(dl.latitude))
    )
  ) <= :radiusKm
ORDER BY distance_km ASC
LIMIT 10;
```

---

### 3. Surge Pricing — Supply vs Demand with EMA Smoothing

```
Step 1: Measure real-time supply and demand in a 3km geo-zone
        demandRatio = pendingRideRequests ÷ availableDrivers

Step 2: Map ratio to a raw surge multiplier
        ratio < 1.0  →  1.0×  (supply exceeds demand)
        ratio 1.0–1.5 → 1.2×  (slightly more demand)
        ratio 1.5–2.0 → 1.5×  (moderate surge)
        ratio 2.0–3.0 → 2.0×  (high demand — rush hour, rain)
        ratio > 3.0   → 3.0×  (extreme — hard capped)

Step 3: Apply Exponential Moving Average to smooth transitions
        newSurge = (α × rawSurge) + ((1-α) × prevSurge)    where α = 0.3

        This prevents sudden price jumps when demand spikes for 30 seconds.
        It also prevents the multiplier from dropping instantly when demand falls.

Step 4: Clamp between 1.0× and 3.0×

Real example — Connaught Place, Delhi at 6pm:
  18 pending rides, 7 available drivers
  ratio = 18/7 = 2.57 → rawSurge = 2.0×
  prevSurge = 1.5×
  newSurge = (0.3 × 2.0) + (0.7 × 1.5) = 0.6 + 1.05 = 1.65× ✓
```

---

### 4. ETA Calculation — Realistic Arrival Time

```
Step 1: Haversine distance between driver's current location and pickup

Step 2: Convert to road distance (roads are never straight)
        roadDistance = haversineDistance × 1.3
        (1.3 = road circuity factor, empirically calibrated for Indian cities)

Step 3: Apply vehicle speed
        BIKE: 25 km/h  (weaves through traffic)
        AUTO: 20 km/h  (smaller roads, slower)
        CAR:  22 km/h  (faster on main roads)

Step 4: Apply time-of-day traffic multiplier
        Night  (10pm–6am): 1.0× (free-flowing)
        Morning rush (8–11am): 1.6× (heavy traffic)
        Afternoon (11am–5pm): 1.2× (moderate)
        Evening rush (5–10pm): 1.6× (heaviest)

Step 5: etaMinutes = (roadDistance ÷ avgSpeed) × 60 × trafficMultiplier

Example: driver 2km away, evening rush, bike
  roadDist = 2 × 1.3 = 2.6km
  time = (2.6 / 25) × 60 = 6.24 minutes
  withTraffic = 6.24 × 1.6 = 9.98 ≈ 10 minutes ✓
```

---

### 5. Rating System — Weighted Rolling Average

Standard averages can be gamed — a driver with 1000 five-star rides from 2 years ago can coast on that score forever. RideApp uses a weighted rolling average where **recent ratings count 2×**:

```
newRating = ((currentRating × totalRatings) + (newStars × 2)) ÷ (totalRatings + 2)

Effect: A 4.8★ driver with 200 rides who starts getting 3★ reviews will see
their score drop noticeably within 10 rides — not buried under 200 old reviews.

The updated rating is immediately available to the matching algorithm.
Every new rating makes the next booking smarter.
```

---

### 6. Payment Flow — Atomic Wallet Transactions

```
Rider pays ₹100 for a ride
         │
         ▼ @Transactional (atomic — all or nothing)
┌─────────────────────────────────────────────────────────┐
│  1. Lock rider wallet row (PESSIMISTIC_WRITE)           │
│     → prevents concurrent double-deductions             │
│                                                         │
│  2. Validate balance ≥ fare                             │
│     → throw InsufficientBalanceException if not         │
│                                                         │
│  3. Deduct ₹100 from rider wallet                       │
│     → riderWallet.balance -= 100                        │
│     → riderWallet.totalSpent += 100                     │
│                                                         │
│  4. Credit ₹80 to driver wallet (80% of fare)           │
│     → driverWallet.balance += 80                        │
│     → driverWallet.totalEarned += 80                    │
│                                                         │
│  5. Platform retains ₹20 (20% commission)               │
│                                                         │
│  6. Create immutable Transaction records                │
│     → DEBIT  ₹100 on rider wallet  (audit log)         │
│     → CREDIT ₹80  on driver wallet (audit log)         │
│                                                         │
│  If ANY step fails → entire transaction rolls back      │
│  → No money lost, no partial states                     │
└─────────────────────────────────────────────────────────┘
         │
         ▼
  Generate PDF receipt → Email to rider (async background thread)
```

---

## 🚀 Ride Lifecycle State Machine

```
                  ┌──────────────┐
                  │   REQUESTED  │ ← rider books, no driver yet
                  └──────┬───────┘
                         │ driver accepts (auto or manual)
                         ▼
                  ┌──────────────┐
                  │   ACCEPTED   │ ← driver heading to pickup
                  └──────┬───────┘
                         │ driver marks arrived
                         ▼
                  ┌──────────────┐
                  │  PICKED_UP   │ ← driver at pickup location
                  └──────┬───────┘
                         │ driver starts trip
                         ▼
                  ┌──────────────┐
                  │ IN_PROGRESS  │ ← ride ongoing, GPS tracking active
                  └──────┬───────┘
                         │ driver completes ride
                         ▼
                  ┌──────────────┐
                  │  COMPLETED   │ ← fare finalised, payment processed,
                  └──────────────┘   receipt emailed, rating prompt shown

   At any point before IN_PROGRESS:
                  ┌──────────────┐
                  │  CANCELLED   │ ← by rider or driver, reason recorded
                  └──────────────┘
```

Invalid transitions (e.g. REQUESTED → COMPLETED) are rejected by the state machine — enforced in `RideService.validateStatusTransition()`.

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Java | 17 LTS | Core language |
| Spring Boot | 3.2.x | Application framework, auto-configuration |
| Spring Security | 6.x | Authentication, JWT filter chain, role-based access |
| Spring Data JPA | 3.2.x | ORM, repository pattern, Hibernate dialect |
| PostgreSQL | 15 | Primary relational database |
| JJWT | 0.12.3 | JWT token generation and validation |
| BCrypt | (Spring) | Password hashing (cost factor 10) |
| Spring WebSocket | 3.2.x | STOMP over WebSocket for real-time events |
| Razorpay Java SDK | 1.4.5 | Payment gateway integration |
| JavaMail | (Spring) | Transactional email delivery |
| iText PDF | 5.5.13 | Ride receipt PDF generation |
| Lombok | latest | Boilerplate elimination |
| Maven | 3.x | Build and dependency management |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Angular | 17 | SPA framework, standalone components |
| TypeScript | 5.x | Type safety throughout |
| RxJS | 7.x | Reactive streams, BehaviorSubject for auth state |
| @stomp/stompjs | latest | WebSocket client with STOMP protocol |
| SockJS | latest | WebSocket fallback for older browsers |
| Google Maps JS API | latest | Live map with animated driver tracking |
| jwt-decode | latest | Client-side JWT expiry checking |
| Angular Reactive Forms | 17 | Form validation and state management |
| SCSS | 3.x | Component-level styling |

### Infrastructure

| Technology | Purpose |
|---|---|
| Redis | Rate limiting (gateway), location caching, surge state |
| Docker | Containerisation |
| Docker Compose | Local development orchestration |

---

## 📁 Project Structure

### Backend

```
rideapp-backend/
└── src/main/java/com/rideapp/backend/
    ├── config/
    │   ├── ApplicationConfig.java       # BCrypt, AuthManager, UserDetailsService beans
    │   ├── SecurityConfig.java          # Filter chain, CORS, route permissions
    │   └── WebSocketConfig.java         # STOMP broker, endpoint registration
    │
    ├── controller/
    │   ├── AuthController.java          # POST /api/auth/register, /login
    │   ├── RideController.java          # POST /book, GET /my-rides, PATCH /{id}/status
    │   ├── PaymentController.java       # POST /create-order, /verify, GET /wallet
    │   ├── RatingController.java        # POST /api/ratings
    │   ├── DriverController.java        # PUT /api/driver/location
    │   └── WebSocketController.java     # @MessageMapping /driver.location
    │
    ├── service/
    │   ├── AuthService.java             # register, login business logic
    │   ├── RideService.java             # booking, status transitions, history
    │   ├── DriverMatchingService.java   # score-based matching algorithm
    │   ├── SurgePricingService.java     # demand ratio → EMA surge multiplier
    │   ├── EtaService.java              # road distance + traffic ETA
    │   ├── FareCalculatorService.java   # base fare + surge + Haversine distance
    │   ├── WalletService.java           # atomic debit/credit/topup/refund
    │   ├── PaymentService.java          # Razorpay order, webhook, signature verify
    │   ├── RatingService.java           # weighted rolling average update
    │   ├── RealTimeService.java         # WebSocket broadcast hub
    │   ├── DriverLocationService.java   # location upsert
    │   ├── NotificationService.java     # async email dispatch
    │   └── ReceiptService.java          # iText PDF generation
    │
    ├── model/
    │   ├── User.java                    # @Entity, implements UserDetails
    │   ├── DriverProfile.java           # rating, acceptance_rate, vehicle
    │   ├── Ride.java                    # full ride entity with all timestamps
    │   ├── DriverLocation.java          # current GPS coordinates
    │   ├── Wallet.java                  # balance, totalEarned, totalSpent
    │   ├── Transaction.java             # immutable audit log entry
    │   ├── Payment.java                 # payment record per ride
    │   ├── Rating.java                  # star rating with unique(ride, rater)
    │   ├── Role.java                    # RIDER, DRIVER, ADMIN enum
    │   ├── RideStatus.java              # state machine values enum
    │   ├── VehicleType.java             # BIKE, AUTO, CAR enum
    │   ├── PaymentMethod.java           # WALLET, UPI, CARD, CASH enum
    │   └── PaymentStatus.java           # PENDING, COMPLETED, FAILED enum
    │
    ├── repository/
    │   ├── UserRepository.java          # findByEmail, existsByEmail/Phone
    │   ├── RideRepository.java          # findByRider, findByStatus, countCompleted
    │   ├── DriverLocationRepository.java # findNearbyAvailableDrivers (Haversine SQL)
    │   ├── WalletRepository.java        # findByUserWithLock (pessimistic)
    │   ├── TransactionRepository.java   # paginated history
    │   ├── PaymentRepository.java       # findByRide, findByRazorpayOrderId
    │   └── RatingRepository.java        # findAverageRatingForUser
    │
    ├── dto/
    │   ├── request/
    │   │   ├── RegisterRequest.java     # name, email, phone, password, role
    │   │   ├── LoginRequest.java        # email, password
    │   │   ├── BookRideRequest.java     # pickup/drop coords + vehicleType
    │   │   ├── UpdateLocationRequest.java
    │   │   ├── SubmitRatingRequest.java # rideId, stars (1-5), comment
    │   │   └── CreatePaymentOrderRequest.java
    │   └── response/
    │       ├── AuthResponse.java        # accessToken, refreshToken, user info
    │       ├── RideResponse.java        # complete ride with driver/rider details
    │       ├── WalletResponse.java      # balance, totalEarned, totalSpent
    │       └── PaymentOrderResponse.java # orderId, amount, Razorpay keyId
    │
    ├── security/
    │   ├── JwtService.java              # generate, validate, extract claims
    │   ├── JwtAuthenticationFilter.java # HTTP request JWT filter
    │   └── WebSocketAuthInterceptor.java # STOMP CONNECT frame JWT validation
    │
    └── exception/
        ├── GlobalExceptionHandler.java  # @RestControllerAdvice, clean JSON errors
        ├── EmailAlreadyExistsException.java
        ├── PhoneAlreadyExistsException.java
        ├── RideNotFoundException.java
        ├── UnauthorizedActionException.java
        └── InsufficientBalanceException.java
```

### Frontend

```
rideapp-frontend/src/app/
├── core/
│   ├── models/
│   │   ├── user.model.ts               # User, AuthResponse, RegisterRequest interfaces
│   │   └── ride.model.ts               # RideResponse, BookRideRequest, VehicleType
│   ├── services/
│   │   ├── auth.service.ts             # BehaviorSubject, JWT storage, login/logout
│   │   ├── ride.service.ts             # all ride API calls
│   │   ├── driver.service.ts           # location update API
│   │   ├── payment.service.ts          # Razorpay flow, wallet balance
│   │   ├── rating.service.ts           # submit rating API
│   │   ├── websocket.service.ts        # STOMP client, subscribe/publish
│   │   └── location-tracking.service.ts # browser GPS → WebSocket broadcast
│   ├── interceptors/
│   │   └── auth.interceptor.ts         # attaches Bearer token to every request
│   └── guards/
│       ├── auth.guard.ts               # redirect to login if not authenticated
│       ├── role.guard.ts               # redirect if wrong role (RIDER vs DRIVER)
│       └── guest.guard.ts              # redirect logged-in users away from /auth
│
├── shared/
│   └── components/
│       ├── ride-map/                   # Google Maps, live driver pin, route line
│       └── post-ride-modal/            # star rating, quick tags, fare summary
│
└── features/
    ├── auth/
    │   ├── login/                      # reactive form, JWT storage on success
    │   └── register/                   # role selector, field-level validation
    ├── rider/
    │   └── dashboard/                  # booking form, live map, wallet, history
    └── driver/
        └── dashboard/                  # online toggle, ride requests, GPS tracking
```

---

## 🚦 Getting Started

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| Java (Temurin) | 17 LTS | [adoptium.net](https://adoptium.net) |
| Maven | 3.8+ | bundled with IntelliJ |
| PostgreSQL | 15+ | [postgresql.org](https://postgresql.org) |
| Node.js | 18 LTS | [nodejs.org](https://nodejs.org) |
| Angular CLI | 17+ | `npm install -g @angular/cli` |
| Git | latest | [git-scm.com](https://git-scm.com) |

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/rideapp.git
cd rideapp/rideapp-backend

# 2. Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE rideapp;"

# 3. Configure credentials
# Edit src/main/resources/application.yml:
#   spring.datasource.password: YOUR_POSTGRES_PASSWORD
#   razorpay.key-id: YOUR_RAZORPAY_TEST_KEY
#   razorpay.key-secret: YOUR_RAZORPAY_SECRET
#   spring.mail.username: YOUR_GMAIL
#   spring.mail.password: YOUR_APP_PASSWORD

# 4. Run the application
mvn spring-boot:run

# Backend starts at http://localhost:8080
# Hibernate auto-creates all tables on first run
# You'll see: "Started BackendApplication in X.X seconds"
```

### Frontend Setup

```bash
cd rideapp/rideapp-frontend

# 1. Install dependencies
npm install

# 2. Add Google Maps API key to index.html
# <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY"></script>

# 3. Start development server
ng serve

# Frontend starts at http://localhost:4200
```

### Quick Test Flow

```bash
# 1. Register a driver via Postman:
POST http://localhost:8080/api/auth/register
{
  "name": "Raju Driver",
  "email": "raju@test.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "DRIVER"
}

# 2. Set driver as verified in pgAdmin:
UPDATE driver_profiles SET is_verified = true WHERE user_id = '<driver_uuid>';

# 3. Set driver online with location:
PUT http://localhost:8080/api/driver/location
Authorization: Bearer <driver_token>
{ "latitude": 28.6139, "longitude": 77.2090, "isAvailable": true }

# 4. Register a rider and book a ride:
POST http://localhost:8080/api/auth/register
{ "name": "Priya Rider", "email": "priya@test.com", ... "role": "RIDER" }

POST http://localhost:8080/api/rides/book
Authorization: Bearer <rider_token>
{
  "pickupAddress": "Connaught Place, Delhi",
  "pickupLat": 28.6315, "pickupLng": 77.2167,
  "dropAddress": "Hauz Khas, Delhi",
  "dropLat": 28.5494, "dropLng": 77.2001,
  "vehicleType": "BIKE"
}
# → Driver auto-assigned, fare calculated with surge, ETA returned
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register rider or driver |
| POST | `/api/auth/login` | None | Login, receive JWT |

### Rides

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/rides/book` | RIDER | Book a ride with matching + surge |
| GET | `/api/rides/my-rides` | RIDER | Rider's ride history |
| GET | `/api/rides/{id}` | Any | Get single ride details |
| POST | `/api/rides/{id}/cancel` | Any | Cancel active ride |
| GET | `/api/rides/available` | DRIVER | View open ride requests |
| POST | `/api/rides/{id}/accept` | DRIVER | Accept a ride request |
| PATCH | `/api/rides/{id}/status` | DRIVER | Progress ride state |
| GET | `/api/rides/my-trips` | DRIVER | Driver's trip history |

### Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/payments/wallet` | Any | Get wallet balance |
| POST | `/api/payments/create-order` | Any | Create Razorpay order |
| POST | `/api/payments/verify` | Any | Verify and complete payment |
| POST | `/api/payments/webhook` | None | Razorpay async webhook |

### Driver

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PUT | `/api/driver/location` | DRIVER | Update GPS + online status |

### Ratings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ratings` | Any | Submit post-ride rating |

### WebSocket (STOMP)

| Direction | Destination | Description |
|---|---|---|
| Client → Server | `/app/driver.location` | Driver sends GPS update |
| Server → Client | `/topic/ride/{id}/driver-location` | Real-time driver position |
| Server → Client | `/topic/ride/{id}/status` | Ride status changes |
| Server → Client | `/user/queue/notifications` | Private driver notifications |

---

## 🗺️ Project Phases

### ✅ Phase 1 — Foundation
**Goal:** Working authentication system with role-based access.

- Spring Boot project with full dependency setup (Web, Security, JPA, JWT, Validation)
- PostgreSQL connected with Hibernate auto-DDL
- User entity with BCrypt password hashing
- JWT access + refresh tokens with configurable expiry
- Spring Security filter chain with public/protected route separation
- CORS configuration for Angular
- Angular 17 standalone project with industry-standard folder structure
- Reactive forms for login + register with field validation
- HTTP interceptor for automatic JWT attachment
- Route guards: `authGuard`, `roleGuard`, `guestGuard`
- Role-based routing: RIDER → `/rider/dashboard`, DRIVER → `/driver/dashboard`

### ✅ Phase 2 — Core Ride Flow
**Goal:** Complete ride booking lifecycle from request to completion.

- `Ride` entity with full state machine (REQUESTED → ACCEPTED → PICKED_UP → IN_PROGRESS → COMPLETED → CANCELLED)
- `DriverLocation` entity for real-time GPS storage
- Haversine formula implemented in native PostgreSQL query
- Fare calculator with vehicle-specific base fares and per-km rates (Rapido-style pricing)
- State transition validation — invalid transitions rejected at service layer
- Role-gated REST endpoints (riders book, drivers accept/update)
- Angular booking UI: vehicle selector, coordinate input, active ride tracker
- Driver dashboard: online/offline toggle, ride request list, status buttons
- Ride history for both riders and drivers

### ✅ Phase 3 — Real-Time + Algorithms
**Goal:** Live tracking, smart matching, and dynamic pricing.

- **Score-based driver matching** replacing naive "nearest driver" selection
- **Expanding radius search**: 3km → 5km → 8km iterative deepening
- **Surge pricing** with supply/demand ratio → EMA-smoothed multiplier
- **ETA engine** with road circuity factor (1.3) + time-of-day traffic multipliers
- **STOMP over WebSocket** with Spring Boot (bi-directional, persistent)
- JWT authentication on WebSocket CONNECT frame (`WebSocketAuthInterceptor`)
- Driver sends GPS every 3 seconds via WebSocket
- `RealTimeService` broadcasts location and status updates to subscribers
- Angular `WebSocketService` with typed subscriptions and auto-reconnect
- `LocationTrackingService` uses browser Geolocation API (GPS chip)
- Rider dashboard subscribes to driver location + ride status live

### ✅ Phase 4 — Payments, Maps, Ratings
**Goal:** Production payment system, live map, and rating feedback loop.

- **Razorpay integration**: order creation, HMAC-SHA256 signature verification, webhook handler
- **In-app wallet**: balance top-up, ride payment, refund on cancellation
- **Atomic wallet transactions** with pessimistic row locking (prevents double-deductions)
- Commission model: 80% driver / 20% platform, full audit trail via `Transaction` entities
- **Google Maps** with pickup/drop markers and route polyline
- **Live driver pin** with 60fps smooth linear interpolation as coordinates update
- Custom greyscale map style so the animated driver marker stands out
- **Post-ride rating modal** with star selector and quick-tag buttons
- **Weighted rolling average** rating: recent reviews count 2× (prevents gaming)
- Rating immediately updates `DriverProfile.rating` → Phase 3 matching algorithm uses it instantly
- PDF receipt generation (iText) with complete ride breakdown
- Async email delivery via JavaMail — receipt emailed after every completed ride

---

## 🔒 Security Architecture

```
Every request passes through:

1. JwtAuthenticationFilter (HTTP)
   └─ Reads Authorization: Bearer <token>
   └─ Validates HMAC-SHA256 signature
   └─ Checks expiry
   └─ Loads UserDetails from DB
   └─ Sets SecurityContextHolder

2. Spring Security Filter Chain
   └─ Public routes: /api/auth/**, /ws/**, /api/payments/webhook
   └─ Protected routes: require valid JWT
   └─ Role routes: @PreAuthorize("hasRole('RIDER')") etc.

3. WebSocketAuthInterceptor (WS)
   └─ Runs on STOMP CONNECT frame only
   └─ Validates JWT from Authorization header
   └─ Sets Principal on WebSocket session
   └─ All subsequent messages on this session are authenticated

Password storage:
   └─ BCryptPasswordEncoder (cost factor 10)
   └─ ~100ms per hash — impractical to brute force

JWT:
   └─ Access token: 24 hours
   └─ Refresh token: 7 days
   └─ Secret: 256-bit HMAC-SHA256 key (externalize in production)
```

---

## 🧑‍💻 Author

Built by **Ankit Saraswat** as a ground-up full-stack engineering project demonstrating production-grade backend architecture, real-world algorithm implementation, and modern frontend development.

- 📧 ankit1256saraswat@gmail.com
- 💼 [LinkedIn](https://www.linkedin.com/in/ankit-saraswat-57a9bb238/)
- 🐙 [GitHub](https://github.com/ANKITSARASWAT12345)

---

## 📄 License

MIT License — feel free to use this project as a reference, learning resource, or portfolio piece.

---

<div align="center">
  <i>Built with Java, Spring Boot, Angular, PostgreSQL, and a lot of algorithm thinking.</i>
</div>
