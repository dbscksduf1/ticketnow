/**
 * k6 부하테스트 — 티켓팅 동시 예매 시나리오
 *
 * 시나리오: 1,000명이 동시에 같은 공연 좌석을 예매 시도
 * 목표: 좌석 중복 예매 0건, p95 응답시간 < 2초
 *
 * 실행: k6 run ticketing-load-test.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'

// 커스텀 메트릭
const reservationSuccess = new Counter('reservation_success')
const reservationFail = new Counter('reservation_fail')
const duplicateError = new Counter('duplicate_error')
const queueWaitTime = new Trend('queue_wait_time')
const reservationRate = new Rate('reservation_success_rate')

export const options = {
  scenarios: {
    // 시나리오 1: 점진적 증가 (워밍업)
    warmup: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '30s', target: 100 },
      ],
      gracefulRampDown: '10s',
      tags: { scenario: 'warmup' },
    },
    // 시나리오 2: 티켓팅 오픈 순간 (1,000명 동시 접속)
    ticketing_open: {
      executor: 'ramping-vus',
      startTime: '1m',  // 워밍업 후 시작
      startVUs: 0,
      stages: [
        { duration: '5s', target: 1000 },   // 5초 안에 1,000명
        { duration: '2m', target: 1000 },   // 2분 유지
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
      tags: { scenario: 'ticketing_open' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],       // 95%가 2초 이내
    reservation_success_rate: ['rate>0.3'],  // 성공률 30% 이상 (좌석 한정)
    duplicate_error: ['count==0'],           // 중복 예매 0건
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const CONCERT_ID = __ENV.CONCERT_ID || '1'

// 테스트 사용자 풀
function getTestUser(vu) {
  return {
    email: `testuser${vu}@test.com`,
    password: 'Test1234!',
  }
}

export function setup() {
  // 테스트 사용자 100명 미리 등록
  console.log('테스트 사용자 등록 중...')
  for (let i = 1; i <= 100; i++) {
    const user = getTestUser(i)
    http.post(`${BASE_URL}/api/users/register`, JSON.stringify({
      name: `테스터${i}`,
      email: user.email,
      password: user.password,
    }), { headers: { 'Content-Type': 'application/json' } })
  }
  console.log('셋업 완료')
}

export default function () {
  const vuId = __VU % 100 + 1
  const user = getTestUser(vuId)

  // 1. 로그인
  const loginRes = http.post(`${BASE_URL}/api/users/login`,
    JSON.stringify(user),
    { headers: { 'Content-Type': 'application/json' } }
  )

  const loginOk = check(loginRes, {
    '로그인 성공': (r) => r.status === 200,
  })
  if (!loginOk) return

  const token = loginRes.json('accessToken')
  const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // 2. 공연 목록 조회 (캐시 히트 확인)
  const concertsRes = http.get(`${BASE_URL}/api/concerts`, { tags: { name: 'concerts_list' } })
  check(concertsRes, { '공연 목록 조회': (r) => r.status === 200 })

  // 3. 좌석 목록 조회
  const seatsRes = http.get(`${BASE_URL}/api/concerts/${CONCERT_ID}/seats`,
    { tags: { name: 'seats_list' } }
  )
  check(seatsRes, { '좌석 목록 조회': (r) => r.status === 200 })

  const seats = seatsRes.json()
  const availableSeats = seats?.filter(s => s.status === 'AVAILABLE') || []
  if (availableSeats.length === 0) return

  // 4. 랜덤 좌석 선택 후 대기열 진입
  const seat = availableSeats[Math.floor(Math.random() * Math.min(availableSeats.length, 10))]
  const queueStart = Date.now()

  const queueRes = http.post(`${BASE_URL}/api/reservations/queue/enter`,
    JSON.stringify({ concertId: parseInt(CONCERT_ID), seatId: seat.id }),
    { headers: authHeader, tags: { name: 'queue_enter' } }
  )

  const queueOk = check(queueRes, { '대기열 진입': (r) => r.status === 200 })
  if (!queueOk) return

  const queueToken = queueRes.json('queueToken')
  queueWaitTime.add(Date.now() - queueStart)

  sleep(1) // 대기 시뮬레이션

  // 5. 예매 확정
  const reserveRes = http.post(`${BASE_URL}/api/reservations`,
    JSON.stringify({ queueToken, concertId: parseInt(CONCERT_ID), seatId: seat.id }),
    { headers: authHeader, tags: { name: 'reservation' } }
  )

  const success = reserveRes.status === 200
  const isDuplicate = reserveRes.status === 409 ||
    reserveRes.body?.includes('이미 예약된 좌석')

  if (success) {
    reservationSuccess.add(1)
    reservationRate.add(1)
    check(reserveRes, {
      '예매 완료': (r) => r.json('reservationNumber') !== undefined,
    })
  } else {
    reservationFail.add(1)
    reservationRate.add(0)
    if (isDuplicate) {
      duplicateError.add(1)
      console.error(`[중복 예매 감지!] seatId: ${seat.id}, user: ${user.email}`)
    }
  }

  sleep(0.5)
}

export function handleSummary(data) {
  const successCount = data.metrics.reservation_success?.values?.count || 0
  const failCount = data.metrics.reservation_fail?.values?.count || 0
  const duplicates = data.metrics.duplicate_error?.values?.count || 0
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0

  return {
    stdout: `
╔════════════════════════════════════════╗
║         티켓팅 부하테스트 결과           ║
╠════════════════════════════════════════╣
║ 예매 성공:     ${String(successCount).padStart(6)}건                 ║
║ 예매 실패:     ${String(failCount).padStart(6)}건 (좌석 마감 포함)    ║
║ 중복 예매:     ${String(duplicates).padStart(6)}건 ← 반드시 0이어야 함 ║
║ p95 응답시간:  ${String(Math.round(p95)).padStart(6)}ms               ║
╚════════════════════════════════════════╝
    `,
    'k6-result.json': JSON.stringify(data, null, 2),
  }
}
