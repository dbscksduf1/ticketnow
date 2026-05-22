# 🎫 TicketNow 1인개발

> 동시 접속 환경에서 Redis 대기열·분산락 기반으로 공정한 순번과 중복 예매 방지를 구현한 MSA 티켓팅 플랫폼

---

# 📑 목차

- [프로젝트 소개](#intro)
- [기술 스택](#stack)
- [주요 기능](#feature)
- [시스템 아키텍처](#arch)
- [핵심 구현 및 성능 최적화](#core)
- [서비스 화면](#ui)
- [포트폴리오 문제 해결](#problem)
- [트러블슈팅](#trouble)
- [회고](#review)

---

# 프로젝트 소개 <a name="intro"></a>

TicketNow는 인기 공연 오픈 시 수천 명이 동시에 접속하는 환경에서  
중복 예매 없이 공정한 순번을 보장하는 MSA 기반 티켓팅 플랫폼입니다.

Redis Sorted Set으로 대기열을 구현하고, SETNX 분산락으로 동시성을 제어하며,  
SSE + Redis Pub/Sub으로 멀티 인스턴스 환경에서도 실시간 순번을 누락 없이 스트리밍합니다.

k6 부하테스트 1,000명 동시 접속 기준 중복 예매 0건, HikariCP 튜닝으로 처리량 +104%를 달성했습니다.

**서비스 주소**: http://16.184.46.184:3000

---

# 기술 스택 <a name="stack"></a>

- **Backend**: Spring Boot 3.2, Spring Cloud Gateway, Spring Data JPA, Java 17
- **Frontend**: React 18, Vite, Tailwind CSS, Zustand
- **Database**: MySQL 8 (DB per Service), Redis 7.2
- **Messaging**: Kafka 3.x, SSE (Server-Sent Events)
- **Auth**: JWT (jjwt 0.12.5)
- **Infra**: AWS EC2 t3.large, Docker Compose, Nginx

---

# 주요 기능 <a name="feature"></a>

- 회원가입 / 로그인 / JWT 발급 (premium claim 포함)
- Toss Payments API 연동 프리미엄 회원권 결제
- 공연 목록·상세·좌석 조회 (Redis 캐싱, TTL 5분)
- Redis Sorted Set 기반 대기열 진입 (프리미엄 최대 2,000번 우선순위)
- SSE + Redis Pub/Sub 실시간 순번 스트리밍 (멀티 인스턴스 누락 없음)
- Redis SETNX 분산락 기반 예매 확정 (중복 예매 방지)
- 내 예매 목록 조회 / 예매 취소 (좌석 복구 + 캐시 무효화)
- Kafka 비동기 이벤트로 이메일 알림 발송

---

# 시스템 아키텍처 <a name="arch"></a>

<!-- <p align="center">
  <img src="images/architecture.png"/>
</p> -->

### 전체 요청 흐름

```
React 클라이언트 요청
↓
Nginx → API Gateway 전달
↓
JWT 인증 및 사용자 정보 헤더 전달
↓
MSA 서비스 처리 (user / concert / reservation)
↓
Redis 기반 실시간 대기열·분산락·캐싱 처리
↓
MySQL 데이터 저장
↓
Kafka 이벤트 발행
↓
notification-service 이메일 발송
```

### 서비스별 역할

| 서비스 | 포트 | 역할 |
|---|---|---|
| api-gateway | 8080 | JWT 검증, 라우팅, X-User-Id 헤더 전달 |
| user-service | 8081 | 회원가입/로그인/프리미엄 결제 확인 |
| concert-service | 8082 | 공연·좌석 관리 + Redis 캐싱 |
| reservation-service | 8083 × 3 | 대기열/예매/분산락 |
| notification-service | 8084 | Kafka 소비 → 이메일 발송 |

---

# 핵심 구현 및 성능 최적화 <a name="core"></a>

### 1. Redis Sorted Set 대기열 + 프리미엄 우선순위

- 대기열 진입 시 `ZADD`로 userId와 타임스탬프(score)를 저장
- score가 낮을수록 앞 순번 → 먼저 들어온 사용자가 앞에 위치
- 프리미엄 회원은 score에서 2,000,000을 차감해 최대 2,000번 앞 순위 보장
- 순번 조회는 `ZRANK`로 O(log N) 처리

### 2. HikariCP 커넥션 풀 튜닝

- 기본값 10개로 1,000명 동시 요청 시 커넥션 대기 타임아웃 급증
- maximum-pool-size 10 → 30으로 확장

**결과 (AWS EC2 t3.large, 1,000명 동시)**

| 항목 | 튜닝 전 | 튜닝 후 | 개선율 |
|---|---|---|---|
| 처리량 | 23 req/s | 47 req/s | **+104%** |
| 예매 성공 | 354건 | 579건 | **+64%** |
| 중복 예매 | 0건 | 0건 | ✅ 유지 |

### 3. Redis 캐싱으로 DB 쿼리 절감

- `@Cacheable`로 첫 조회 결과를 Redis에 저장 (TTL 5분)
- 예매/취소 시 `@CacheEvict`로 관련 캐시 즉시 무효화

**결과**: 동일 요청 100건 기준 DB 쿼리 100회 → 1회 감소

---

# 서비스 화면 <a name="ui"></a>

## 1. 메인 화면
<!-- <img src="images/main.png"/> -->

## 2. 공연 목록
<!-- <img src="images/concerts.png"/> -->

## 3. 좌석 선택
<!-- <img src="images/seats.png"/> -->

## 4. 대기열 순번 스트리밍
<!-- <img src="images/queue.png"/> -->

## 5. 예매 완료
<!-- <img src="images/reservation.png"/> -->

---

# 문제 해결 <a name="problem"></a>

## Redis Sorted Set 기반 대기열 + SSE + Redis Pub/Sub 실시간 순번 스트리밍

- **Redis Sorted Set** 기반 대기열과 **SSE + Redis Pub/Sub**을 연동하여 멀티 인스턴스 환경에서도 누락 없는 실시간 순번 스트리밍 구현

<!-- <img src="images/problem_queue.png"/> -->

## Spring Cloud Gateway JWT 검증 필터

- **Spring Cloud Gateway JWT 검증 필터**를 적용하여 서비스별 인증 로직 중복 제거

<!-- <img src="images/problem_jwt.png"/> -->

## Redis SETNX 분산락으로 중복 예매 방지

- **Redis SETNX 분산락**과 TTL 10초를 적용하여 멀티 인스턴스 환경의 좌석 중복 예매 문제를 해결하고, **1,000명 동시 접속 환경에서 중복 예매 0건 테스트 성공**

<!-- <img src="images/problem_lock.png"/> -->

## Redis 캐싱으로 DB 과부하 개선

- 인기 공연 조회 시 DB 과부하 문제를 **Redis 캐싱**(@Cacheable)으로 개선하여 동일 요청 100건 기준 **DB 쿼리 수 100회→1회로 최적화**

<!-- <img src="images/problem_cache.png"/> -->

## Kafka 비동기 이벤트로 서비스 결합도 분리

- 예매 완료·취소 이벤트를 **Kafka 기반 비동기 이벤트 구조로 분리**하여 **예매 서버와 이메일 서버 간 결합도를 낮추고**, 이메일 서버 장애 시에도 예매 응답에 영향 없도록 설계

<!-- <img src="images/problem_kafka.png"/> -->

---

# 트러블슈팅 <a name="trouble"></a>

### 1. 좌석 중복 예매 (Race Condition)

- **문제**: 동시에 여러 사용자가 같은 좌석 예매 시 둘 다 "available" 상태를 읽고 둘 다 예매 성공 처리
- **원인**: reservation-service가 3개 인스턴스로 실행되므로 JVM 레벨 `synchronized`는 효과 없음. 각 JVM이 독립적으로 동작하기 때문
- **해결**: 모든 인스턴스가 공유하는 Redis에 SETNX 분산락 적용. TTL 10초로 서버 장애 시 데드락 방지, `finally` 블록으로 예외 발생 시에도 락 반드시 해제
- **결과**: 1,000명 동시 접속 기준 중복 예매 0건 달성

서버가 여러 대인 환경에서는 JVM 락이 아닌 외부 공유 저장소를 활용한 분산락이 필요하다는 것을 직접 경험했다.

---

### 2. 멀티 인스턴스 환경 SSE 이벤트 누락

- **문제**: reservation-service 3개 인스턴스 운영 시 일부 사용자에게 순번 업데이트가 전달되지 않음
- **원인**: 사용자 A가 instance-1에 SSE 연결된 상태에서 instance-2에서 대기열 변동이 발생하면 instance-1은 그 변동을 알 수 없음
- **해결**: 대기열 변동 시 Redis Pub/Sub 채널에 발행 → 전체 인스턴스의 리스너가 수신 → 각자 연결된 클라이언트에 SSE Push
- **결과**: `--scale reservation-service=3` 수평 확장 즉시 적용, 이벤트 누락 0건

수평 확장 환경에서는 인스턴스 간 상태 공유 방법을 설계 단계에서 반드시 고려해야 한다는 것을 배웠다.

---

### 3. DB 커넥션 부족으로 타임아웃 급증

- **문제**: 1,000명 동시 요청 시 기본 커넥션 풀(10개)로 대부분의 요청이 커넥션을 기다리다 타임아웃 발생
- **원인**: DB 커넥션은 생성 비용이 크기 때문에 미리 만들어 풀에서 관리하는데, 기본값 10개로는 동시 트래픽을 처리하기 역부족
- **해결**: HikariCP maximum-pool-size를 10 → 30으로 조정. MySQL max_connections 한계와 서버 메모리를 고려해 적정값 설정
- **결과**: 처리량 23 → 47 req/s (+104%), 예매 성공건수 354 → 579건 (+64%)

성능 개선이 코드 수준만이 아닌 인프라 설정 전반에 걸친 문제임을 이해하게 되었다.

---

# 회고 <a name="review"></a>

단순 CRUD를 넘어 동시성 제어, 실시간 스트리밍, 수평 확장이라는 실제 서비스 환경의 문제들을 직접 경험했다.

특히 "서버가 하나일 때는 괜찮았는데 여러 대로 늘리면 왜 안 되지?"라는 질문에서 시작해  
JVM 락의 한계 → Redis 분산락, 단일 인스턴스 SSE → Redis Pub/Sub 브로드캐스트로 이어지는  
문제 → 원인 → 해결의 흐름을 직접 설계하고 구현했다.

k6로 1,000명 동시 접속 테스트를 돌리고 수치로 개선을 확인하는 과정에서  
성능 최적화가 단순한 코드 개선이 아닌 시스템 전체의 병목을 찾는 작업임을 배웠다.
