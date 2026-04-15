# TicketNow — 고성능 티켓팅 플랫폼 포트폴리오

> 동시 접속자 폭증 환경에서 중복 예매 없이 공정한 순번을 보장하는 MSA 기반 티켓팅 시스템

---

## 🚀 배포 진행 현황 (여기서 이어서 시작)

### 완료된 배포 작업
- [x] AWS EC2 서울 리전 t3.large 온디맨드 인스턴스 생성
- [x] 서버 IP: `16.184.46.184`
- [x] 키페어 파일: `C:\Users\USER\Downloads\ticketnow-key.pem`
- [x] Ubuntu 22.04 업데이트 완료
- [x] Docker 설치 완료

### 다음 할 작업 (여기서부터 이어서)
- [ ] **GitHub 레포 생성** (`ticketnow` 이름으로 Public)
- [ ] **로컬 코드 GitHub에 Push** (백엔드/프론트엔드 폴더 구조)
- [ ] **서버에서 git clone**
- [ ] **환경변수 파일 생성** (.env)
- [ ] **JAR 빌드 후 Docker Compose 실행**
- [ ] **도메인 + HTTPS 설정** (Toss 결제 필수)
- [ ] **클라우드 부하테스트**

### 서버 접속 명령어
```bash
ssh -i "C:\Users\USER\Downloads\ticketnow-key.pem" ubuntu@16.184.46.184
```

---

## 완료 / 미완료 현황

### 백엔드 ✅ 완료
- [x] MSA 5개 서비스 구현 (user / concert / reservation / notification / api-gateway)
- [x] JWT 인증 (premium claim 포함, Gateway 필터)
- [x] Redis Sorted Set 대기열 (프리미엄 우선순위 2,000번)
- [x] Redis 분산락 (SETNX) — 좌석 중복 예매 방지
- [x] Redis Cache — 공연 목록/상세/좌석 캐싱 (5분 TTL)
- [x] Redis Pub/Sub — SSE 멀티 인스턴스 수평 확장
- [x] SSE 실시간 대기열 스트리밍
- [x] Toss Payments 결제 연동 (프리미엄 + 좌석 예매)
- [x] Kafka 예매완료/취소 이벤트 발행
- [x] Docker Compose 전체 컨테이너화
- [x] 수평 확장 구조 (`--scale reservation-service=3`)
- [x] 코드 리팩토링 (N+1 제거, 캐시 최적화, 타임아웃 설정 등)
- [x] k6 부하테스트 (1,000명 동시접속, 중복 예매 0건 검증)

### 프론트엔드 ✅ 완료
- [x] 메인 페이지 (Canvas 네온 애니메이션)
- [x] 공연 목록 / 상세
- [x] 좌석 선택 (최대 4석, 등급별 색상, 예매완료 비활성화)
- [x] 대기열 페이지 (SSE 실시간 순번, READY 시 결제창 연동)
- [x] Toss 결제창 → 결제 성공 페이지 → 예매 확정
- [x] 프리미엄 결제 페이지
- [x] 마이페이지 (예매 목록 / 취소)
- [x] 회원가입 / 로그인

### 남은 작업 (배포 관련)
- [ ] **Oracle Cloud ARM 서버 신청** (무료, Tokyo/Singapore/Phoenix 리전)
- [ ] **도메인 구매 + HTTPS 설정** (Toss 결제 필수 조건, Let's Encrypt 무료)
- [ ] **환경변수 분리** (DB 비밀번호, JWT Secret, Toss Key → `.env` 파일)
- [ ] **Tomcat 스레드풀 + HikariCP 튜닝** (5,000명 목표 시)
- [ ] **Kafka 활성화** (`application.yml` kafka 주석 해제)
- [ ] **이메일 발송 설정** (Gmail SMTP App Password)
- [ ] **클라우드 부하테스트** (Oracle ARM에서 k6 재실행, 목표 3,000~5,000명)
- [ ] **(선택) Toss 라이브 키 교환** (실제 결제 받을 경우)
- [ ] **(선택) GitHub README 작성** (아키텍처 다이어그램, 시연 GIF)

---

## 배포 순서 (이어서 할 때 참고)

```
1. Oracle Cloud ARM 신청
   → https://cloud.oracle.com/compute/instances/create
   → Shape: VM.Standard.A1.Flex (Always Free)
   → 4 OCPU, 24GB RAM, Ubuntu 22.04

2. 서버 접속 후 Docker 설치
   sudo apt update && sudo apt install -y docker.io docker-compose-v2

3. 코드 올리기 (git clone 또는 scp)

4. 환경변수 파일 생성
   ticketing/.env 에 TOSS_SECRET_KEY, MAIL_USERNAME, MAIL_PASSWORD 입력

5. 스레드풀 튜닝 (application.yml 수정)
   server.tomcat.threads.max: 400
   spring.datasource.hikari.maximum-pool-size: 50

6. Kafka 활성화 (reservation-service application.yml 주석 해제)

7. 전체 빌드 및 실행
   cd ticketing
   docker-compose up --scale reservation-service=3 -d

8. 도메인 연결 + nginx HTTPS 설정 (Let's Encrypt)

9. k6 부하테스트 (목표: 3,000명 안정, 중복 0건)
```

---

## 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | TicketNow |
| 유형 | 개인 백엔드 포트폴리오 |
| 핵심 주제 | 대규모 동시접속 처리 / MSA / Redis 대기열 |
| 개발 기간 | 2026년 4월 |

---

## 아키텍처

```
[React Frontend]
       │
       ▼
[API Gateway :8080]  ← JWT 인증 필터 (Spring Cloud Gateway)
       │
  ┌────┴─────────────────────────┐
  │            │                  │
[User :8081] [Concert :8082] [Reservation :8083 × 3]
  │                                     │
[MySQL]      [MySQL + Redis Cache]  [MySQL + Redis 대기열/분산락]
                                         │
                                   [Kafka] → [Notification :8084]
```

### 서비스별 역할

| 서비스 | 포트 | DB | 역할 |
|---|---|---|---|
| api-gateway | 8080 | - | JWT 검증, 라우팅, CORS |
| user-service | 8081 | MySQL (user_db) | 회원가입/로그인/프리미엄 결제 |
| concert-service | 8082 | MySQL (concert_db) + Redis | 공연 목록/상세/좌석 관리 |
| reservation-service | 8083 × 3 | MySQL (reservation_db) + Redis | 대기열/예매/분산락 |
| notification-service | 8084 | - | Kafka 소비 → 이메일 발송 |

---

## 핵심 기술 스택

### 백엔드
- **Spring Boot 3.2** — 마이크로서비스 5개
- **Spring Cloud Gateway** — API 게이트웨이, JWT 검증 필터
- **Spring Security** — 인증/인가
- **JWT (jjwt)** — 무상태 인증, `premium` claim 포함
- **JPA / Hibernate** — ORM
- **MySQL** — 서비스별 독립 데이터베이스 (DB per Service 패턴)
- **Redis Sorted Set** — 대기열 구현
- **Redis Cache** — 공연 정보 캐싱 (5분 TTL)
- **Redis 분산락 (SETNX)** — 좌석 중복 예매 방지
- **Redis Pub/Sub** — SSE 수평 확장 지원 (멀티 인스턴스 브로드캐스트)
- **SSE (Server-Sent Events)** — 대기열 실시간 순번 스트리밍
- **Kafka** — 예매 완료/취소 이벤트 비동기 발행
- **Toss Payments API** — 실결제 연동
- **Docker / Docker Compose** — 전체 컨테이너화

### 프론트엔드
- **React 18 + Vite**
- **Tailwind CSS**
- **Zustand** — 전역 상태 관리 (인증/프리미엄)
- **React Router v6**
- **Canvas API** — 메인 페이지 네온 라인 애니메이션
- **EventSource (SSE)** — 대기열 실시간 수신

---

## 기술적 도전과 해결

### 동시성 문제 — Redis 분산락
- **문제**: 동시에 여러 사용자가 같은 좌석 예매 시 중복 예매 발생
- **해결**: `SETNX`(SET if Not eXists)로 락 획득, TTL 10초로 데드락 방지
- **결과**: 1,000명 동시접속 테스트에서 중복 예매 0건

### 대용량 트래픽 — Redis 대기열
- **문제**: 인기 공연 오픈 시 수천 명 동시 접속 → 서버 다운
- **해결**: Sorted Set으로 순번 관리, SSE로 실시간 안내
- **효과**: 사용자를 순서대로 처리, 서버 부하 분산

### 수평 확장 — Redis Pub/Sub 기반 SSE
- **문제**: SSE polling 방식은 멀티 인스턴스 환경에서 동작 불가
  - instance-1 연결 사용자가 instance-2에서 발생한 대기열 변동을 못 받음
- **해결**: Redis Pub/Sub 채널(`queue:update:concert:{id}`)으로 브로드캐스트
  - 대기열 변동 시 publish → 모든 인스턴스의 리스너가 수신 → 각자 클라이언트에 Push
- **결과**: `docker-compose up --scale reservation-service=3` 즉시 적용 가능

### 프리미엄 우선순위
- **구현**: JWT의 `premium` claim 확인 → 대기열 진입 시 score 2,000,000 차감
- **효과**: 프리미엄 회원은 일반 회원보다 최대 2,000번 앞 순번 보장

### MSA 서비스 간 통신
- **동기**: RestTemplate + 타임아웃 설정 (connect 3s, read 5s)
- **비동기**: Kafka (예매 완료/취소 알림)

---

## HikariCP 튜닝 전후 비교 (클라우드 AWS EC2 t3.large, 1,000명)

| 항목 | 튜닝 전 | 튜닝 후 | 개선 |
|---|---|---|---|
| 예매 성공 | 354건 | 579건 | **+64%** |
| 처리량 | 23 req/s | 47 req/s | **+104%** |
| 중복 예매 | 0건 | 0건 | ✅ 유지 |

> "HikariCP 커넥션 풀 튜닝(10→30개)으로 동시 처리량 23→47 req/s (+104%), 예매 성공 건수 354→579건 (+64%) 개선"

### 동시사용자별 한계 테스트 (AWS EC2 t3.large)

| 동시사용자 | 예매 성공 | 중복 예매 | 결과 |
|---|---|---|---|
| 1,000명 | 579건 | **0건** ✅ | 안정 |
| 2,000명 | 0건 | 0건 | 서버 한계 초과 |

---

## 포트폴리오 문제해결 항목 (이력서/면접용)

### 1. 좌석 중복 예매 → Redis 분산락
- **문제**: 1,000명 동시 요청 시 중복 예매 발생
- **해결**: Redis SETNX 분산락 적용, TTL 10초로 데드락 방지
- **결과**: k6 부하테스트 1,000명 동시접속 기준 **중복 예매 0건** 달성

### 2. 공연 조회 DB 과부하 → Redis 캐싱
- **문제**: 공연 목록/상세/좌석 조회가 매번 DB 히트 → 트래픽 폭증 시 DB 과부하
- **해결**: Redis Cache 적용 (TTL 5분), 예매/취소 시 해당 키만 evict (thundering herd 방지)
- **결과**: 캐시 Miss(DB 직접 조회) 10ms → 캐시 Hit(Redis) 5ms
  - 핵심 효과: 동시 100명이 같은 공연 조회 시 DB 쿼리 100번 → 1번으로 감소
  - 포트폴리오 설명: "공연 목록/상세/좌석 조회에 Redis 캐싱(TTL 5분) 적용, DB 부하 제거로 트래픽 폭증 시 DB 과부하 방지"

### 3. SSE 멀티 인스턴스 누락 문제 → Redis Pub/Sub
- **문제**: reservation-service 3개 인스턴스 운영 시 SSE 이벤트 누락
  - instance-1에 연결된 사용자가 instance-2에서 발생한 대기열 변동을 못 받음
- **해결**: Redis Pub/Sub으로 전 인스턴스에 브로드캐스트
- **결과**: `--scale reservation-service=3` 수평 확장 즉시 적용, SSE 누락 0건

---

## 부하테스트 결과 (k6, 로컬 환경)

> 환경: Windows 10, Docker Desktop, reservation-service 3 인스턴스, 8개 공연 분산

| 동시사용자 | 예매 성공 | 중복 예매 | p95 응답 | 결과 |
|-----------|---------|---------|---------|------|
| 500명 | 170건 | **0건** ✅ | 11s | 안정 |
| 1,000명 | 1,185건 | **0건** ✅ | 20s | 안정 |
| 3,000명 | - | - | timeout | 로컬 한계 |

- **로컬 안정 한계**: ~1,500명 (노트북 단일 환경)
- **클라우드 예상 한계**: Oracle ARM Free(4CPU/24GB) + 3 replicas → **5,000명+**
- **배포 후 재테스트 예정**

### 부하테스트 실행
```bash
cd ticketing/k6
k6 run -e TARGET_VUS=1000 stage-test.js
```

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
cd ticketing/user-service        && gradle bootJar --no-daemon -q
cd ticketing/concert-service     && gradle bootJar --no-daemon -q
cd ticketing/reservation-service && gradle bootJar --no-daemon -q
cd ticketing/notification-service && gradle bootJar --no-daemon -q
cd ticketing/api-gateway         && gradle bootJar --no-daemon -q

# 2. 전체 서비스 실행 (reservation-service 3개)
cd ticketing
docker-compose up --scale reservation-service=3 -d

# 3. 프론트엔드 (개발모드)
cd ticketing/frontend && npm run dev

# 접속
# 프론트엔드: http://localhost:3000
# API Gateway: http://localhost:8080
```

### 필수 환경변수
```bash
# ticketing/frontend/.env
VITE_TOSS_CLIENT_KEY=test_ck_...   # Toss 테스트 클라이언트 키

# docker-compose 실행 시 필요 (배포 환경)
TOSS_SECRET_KEY=test_sk_...
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=앱비밀번호
```

---

## 버그 수정 이력

| # | 버그 | 원인 | 수정 파일 |
|---|------|------|---------|
| 1 | `row` 컬럼 DDL 실패 | MySQL 예약어 `row` | `@Column(name="seat_row")` |
| 2 | Redis LocalDateTime 직렬화 오류 | JavaTimeModule 미등록 | `RedisConfig` ObjectMapper 수정 |
| 3 | SSE 연결 차단 | Gateway JWT 필터가 SSE 경로 차단 | 공개 라우트 추가 |
| 4 | 대기열 READY 안됨 | `rank <= 0` 체크 오류 (1-based) | `rank <= 1` 수정 |
| 5 | Toss 결제창 안 열림 | async/await 후 requestPayment 호출 | 동기 호출로 변경 |
| 6 | concert-service 호출 실패 | `CONCERT_SERVICE_URL` 환경변수 누락 | `docker-compose.yml` 추가 |
| 7 | 예매 NullPointerException | `reserveSeat`이 빈 응답 반환 | `SeatReserveResponse` DTO 추가 |

---

## 이력서/포트폴리오 한 줄 요약

> **Redis Sorted Set 대기열·Pub/Sub SSE·분산락으로 동시 접속 1,000명 환경에서 중복 예매 0건을 달성, 수평 확장 가능한 MSA 티켓팅 플랫폼 (Spring Boot 5서비스 + React)**
