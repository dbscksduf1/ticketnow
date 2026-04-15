# TicketNow 🎫

> **동시 접속자 폭증 환경에서 중복 예매 없이 공정한 순번을 보장하는 MSA 기반 티켓팅 플랫폼**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Redis](https://img.shields.io/badge/Redis-7.2-DC382D?logo=redis)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com)
[![AWS](https://img.shields.io/badge/AWS-EC2-FF9900?logo=amazonaws)](https://aws.amazon.com)

---

## 핵심 성과

| 지표 | 결과 |
|---|---|
| 동시접속 1,000명 중복 예매 | **0건** ✅ |
| HikariCP 튜닝 후 처리량 | **23 → 32 req/s (+39%)** |
| HikariCP 튜닝 후 예매 성공 | **354 → 427건 (+21%)** |
| reservation-service 수평 확장 | **3 인스턴스** |
| Redis 캐시 DB 쿼리 절감 | **100번 → 1번** |

---

## 아키텍처

```
[React + Nginx :3000]
        │
        ▼ /api 프록시
[API Gateway :8080]  ← JWT 인증 필터 (Spring Cloud Gateway)
        │
   ┌────┴──────────────────────────────┐
   │              │                     │
[User :8081]  [Concert :8082]  [Reservation :8083 × 3]
   │                │                     │
[MySQL]    [MySQL + Redis Cache]   [MySQL + Redis 대기열/분산락]
                                          │
                                    [Kafka] → [Notification :8084]
```

### 서비스별 역할

| 서비스 | 포트 | 역할 |
|---|---|---|
| api-gateway | 8080 | JWT 검증, 라우팅, CORS |
| user-service | 8081 | 회원가입/로그인/프리미엄 결제 |
| concert-service | 8082 | 공연 목록/상세/좌석 관리 + Redis 캐싱 |
| reservation-service | 8083 × 3 | 대기열/예매/Redis 분산락 |
| notification-service | 8084 | Kafka 소비 → 이메일 발송 |

---

## 기술적 도전과 해결

### 1. 좌석 중복 예매 → Redis 분산락

**문제** : 동시에 여러 사용자가 같은 좌석 예매 시 중복 예매 발생

**해결** : Redis `SETNX`(SET if Not eXists)로 락 획득, TTL 10초로 데드락 방지

```java
Boolean acquired = redisTemplate.opsForValue()
    .setIfAbsent(lockKey, "LOCKED", 10, TimeUnit.SECONDS);
if (!Boolean.TRUE.equals(acquired)) {
    throw new IllegalStateException("다른 사용자가 해당 좌석을 선택 중입니다.");
}
```

**결과** : k6 부하테스트 1,000명 동시접속 기준 **중복 예매 0건** 달성

---

### 2. 공연 조회 DB 과부하 → Redis 캐싱

**문제** : 공연 목록/상세/좌석 조회가 매번 DB 히트 → 트래픽 폭증 시 DB 과부하

**해결** : Redis Cache 적용 (TTL 5분), 예매/취소 시 해당 키만 evict

```java
@Cacheable(value = "concerts", key = "#category + '_' + #keyword")
public List<ConcertResponse> getConcerts(String category, String keyword) { ... }

@Caching(evict = {
    @CacheEvict(value = "concert", key = "#concertId"),
    @CacheEvict(value = "concerts", allEntries = true),
    @CacheEvict(value = "seats", key = "#concertId")
})
public SeatReserveResponse decreaseAvailableSeats(Long concertId, Long seatId) { ... }
```

**결과** : 동시 100명 조회 시 DB 쿼리 100번 → 1번으로 감소

---

### 3. SSE 멀티 인스턴스 누락 → Redis Pub/Sub

**문제** : reservation-service 3개 인스턴스 운영 시 SSE 이벤트 누락
- instance-1에 연결된 사용자가 instance-2에서 발생한 대기열 변동을 못 받음

**해결** : Redis Pub/Sub으로 전 인스턴스에 브로드캐스트

```
대기열 변동 발생
    │
    ▼
Redis Publish (queue:update:concert:{id})
    │
    ├── instance-1 리스너 수신 → 연결된 클라이언트에 SSE Push
    ├── instance-2 리스너 수신 → 연결된 클라이언트에 SSE Push
    └── instance-3 리스너 수신 → 연결된 클라이언트에 SSE Push
```

**결과** : `--scale reservation-service=3` 수평 확장 즉시 적용, SSE 누락 0건

---

### 4. HikariCP 커넥션 풀 튜닝

**문제** : 기본 커넥션 풀(10개)로 1,000명 동시 요청 시 DB 커넥션 부족

**해결** : HikariCP maximum-pool-size 10 → 30으로 확장

**결과** : 처리량 23 → 32 req/s (+39%), 예매 성공 354 → 427건 (+21%)

---

## 부하테스트 결과

> 환경: Windows 10, Docker Desktop, reservation-service 3 인스턴스, 8개 공연 분산

### 로컬 환경 (k6)

| 동시사용자 | 예매 성공 | 중복 예매 | p95 응답 | 결과 |
|---|---|---|---|---|
| 500명 | 170건 | **0건** ✅ | 11s | 안정 |
| 1,000명 | 1,185건 | **0건** ✅ | 20s | 안정 |
| 3,000명 | - | - | timeout | 로컬 한계 |

### HikariCP 튜닝 전후 비교 (AWS EC2 t3.large)

| 항목 | 튜닝 전 | 튜닝 후 | 개선율 |
|---|---|---|---|
| 처리량 | 23 req/s | 32 req/s | **+39%** |
| 예매 성공 | 354건 | 427건 | **+21%** |
| 중복 예매 | 0건 | 0건 | ✅ 유지 |

> p95 응답시간은 대기열 대기시간 포함한 end-to-end 시간 (대기열 특성상 정상)

---

## 기술 스택

### 백엔드
- **Spring Boot 3.2** — 마이크로서비스 5개
- **Spring Cloud Gateway** — API 게이트웨이, JWT 검증 필터
- **JWT (jjwt)** — 무상태 인증, `premium` claim 포함
- **JPA / Hibernate** — ORM
- **MySQL** — 서비스별 독립 DB (DB per Service 패턴)
- **Redis Sorted Set** — 대기열 구현
- **Redis Cache** — 공연 정보 캐싱 (TTL 5분)
- **Redis 분산락 (SETNX)** — 좌석 중복 예매 방지
- **Redis Pub/Sub** — SSE 수평 확장 (멀티 인스턴스 브로드캐스트)
- **SSE** — 대기열 실시간 순번 스트리밍
- **Kafka** — 예매 완료/취소 이벤트 비동기 발행
- **Toss Payments API** — 결제 연동
- **Docker / Docker Compose** — 전체 컨테이너화

### 프론트엔드
- **React 18 + Vite**
- **Tailwind CSS**
- **Zustand** — 전역 상태 관리
- **Canvas API** — 메인 페이지 네온 애니메이션
- **EventSource (SSE)** — 대기열 실시간 수신

---

## API 명세

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | /api/users/register | X | 회원가입 |
| POST | /api/users/login | X | 로그인 |
| POST | /api/users/premium/confirm | O | 프리미엄 결제 확인 |
| GET | /api/concerts | X | 공연 목록 |
| GET | /api/concerts/{id} | X | 공연 상세 |
| GET | /api/concerts/{id}/seats | X | 좌석 목록 |
| POST | /api/reservations/queue/enter | O | 대기열 진입 |
| GET | /api/reservations/queue/status | X | 대기열 SSE 스트리밍 |
| POST | /api/reservations | O | 예매 확정 |
| GET | /api/reservations/my | O | 내 예매 목록 |
| DELETE | /api/reservations/{id} | O | 예매 취소 |

---

## 로컬 실행 방법

```bash
# 1. 백엔드 JAR 빌드
cd backend
for svc in user-service concert-service reservation-service notification-service api-gateway; do
  cd $svc && ./gradlew bootJar --no-daemon -q && cd ..
done

# 2. 전체 서비스 실행 (reservation-service 3개)
docker compose up --scale reservation-service=3 -d

# 3. 프론트엔드 (개발모드)
cd ../frontend && npm install && npm run dev
```

### 필수 환경변수 (.env)
```
TOSS_SECRET_KEY=test_sk_...
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=앱비밀번호
```

---

## 이력서 한 줄 요약

> Redis Sorted Set 대기열·Pub/Sub SSE·분산락으로 동시 접속 1,000명 환경에서 중복 예매 0건을 달성, HikariCP 튜닝으로 처리량 39% 개선, 수평 확장 가능한 MSA 티켓팅 플랫폼 (Spring Boot 5서비스 + React)
