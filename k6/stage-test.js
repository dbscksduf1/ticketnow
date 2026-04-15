/**
 * 단계별 부하테스트
 * 환경변수로 VU 수 조정: k6 run -e TARGET_VUS=500 stage-test.js
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'

const reservationSuccess = new Counter('reservation_success')
const reservationFail    = new Counter('reservation_fail')
const duplicateError     = new Counter('duplicate_error')
const p95Trend           = new Trend('queue_enter_time')
const successRate        = new Rate('success_rate')

const TARGET_VUS  = parseInt(__ENV.TARGET_VUS || '500')
const BASE_URL    = __ENV.BASE_URL || 'http://localhost:8080'
const CONCERT_IDS = [1, 2, 3, 4, 5, 6, 7, 8] // 8개 공연에 분산

export const options = {
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: TARGET_VUS },  // 램프업
        { duration: '1m',  target: TARGET_VUS },  // 유지
        { duration: '10s', target: 0 },           // 램프다운
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration:  ['p(95)<3000'],   // 95%가 3초 이내
    success_rate:       ['rate>0.5'],     // 성공률 50% 이상
    duplicate_error:    ['count==0'],     // 중복 예매 0건 필수
  },
}

function getUser(vu) {
  return { email: `loadtest${vu % 200 + 1}@test.com`, password: 'Test1234!' }
}

export function setup() {
  console.log(`[설정] 테스트 사용자 200명 등록 (TARGET_VUS=${TARGET_VUS})`)
  for (let i = 1; i <= 200; i++) {
    http.post(`${BASE_URL}/api/users/register`,
      JSON.stringify({ name: `부하테스터${i}`, email: `loadtest${i}@test.com`, password: 'Test1234!' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export default function () {
  const user = getUser(__VU)

  // 1. 로그인
  const loginRes = http.post(`${BASE_URL}/api/users/login`,
    JSON.stringify(user),
    { headers: { 'Content-Type': 'application/json' } }
  )
  const loginOk = check(loginRes, { '로그인 200': r => r.status === 200 })
  successRate.add(loginOk ? 1 : 0)
  if (!loginOk) return

  const token = loginRes.json('accessToken')
  const auth  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // VU마다 랜덤 공연 선택 → 8개 공연에 부하 분산
  const concertId = CONCERT_IDS[__VU % CONCERT_IDS.length]

  // 2. 공연 목록 (Redis 캐시 히트 확인)
  const concertsRes = http.get(`${BASE_URL}/api/concerts`)
  check(concertsRes, { '공연목록 200': r => r.status === 200 })

  // 3. 좌석 목록
  const seatsRes = http.get(`${BASE_URL}/api/concerts/${concertId}/seats`)
  check(seatsRes, { '좌석목록 200': r => r.status === 200 })

  const seats = seatsRes.json() || []
  const available = seats.filter(s => s.status === 'AVAILABLE')
  if (available.length === 0) { sleep(0.5); return }

  const seat = available[Math.floor(Math.random() * Math.min(available.length, 20))]

  // 4. 대기열 진입
  const t0 = Date.now()
  const qRes = http.post(`${BASE_URL}/api/reservations/queue/enter`,
    JSON.stringify({ concertId, seatId: seat.id }),
    { headers: auth }
  )
  p95Trend.add(Date.now() - t0)

  const qOk = check(qRes, { '대기열진입 200': r => r.status === 200 })
  if (!qOk) { sleep(0.5); return }

  const queueToken = qRes.json('queueToken')

  // 5. 예매 확정 (queueToken + concertId + seatId 만 필요)
  const resRes = http.post(`${BASE_URL}/api/reservations`,
    JSON.stringify({ queueToken, concertId, seatId: seat.id }),
    { headers: auth }
  )

  const ok  = resRes.status === 200
  const dup = resRes.status === 409 || (resRes.body || '').includes('이미 예약')

  if (ok) {
    reservationSuccess.add(1)
  } else {
    reservationFail.add(1)
    if (dup) {
      duplicateError.add(1)
      console.error(`[중복!] seatId=${seat.id} vu=${__VU}`)
    }
  }

  sleep(0.5)
}

export function handleSummary(data) {
  const ok  = data.metrics.reservation_success?.values?.count || 0
  const fail = data.metrics.reservation_fail?.values?.count || 0
  const dup  = data.metrics.duplicate_error?.values?.count || 0
  const p95  = Math.round(data.metrics.http_req_duration?.values?.['p(95)'] || 0)
  const rps  = Math.round(data.metrics.http_reqs?.values?.rate || 0)

  const border = '═'.repeat(44)
  return {
    stdout: `
╔${border}╗
║      티켓팅 부하테스트 결과 (VUs=${String(TARGET_VUS).padStart(5)})      ║
╠${border}╣
║  예매 성공:    ${String(ok).padStart(6)}건                           ║
║  예매 실패:    ${String(fail).padStart(6)}건 (좌석 마감 포함)        ║
║  중복 예매:    ${String(dup).padStart(6)}건  ← 반드시 0이어야 함     ║
║  p95 응답:     ${String(p95).padStart(6)}ms                          ║
║  처리량:       ${String(rps).padStart(6)} req/s                      ║
╚${border}╝
`,
    'k6-result.json': JSON.stringify(data, null, 2),
  }
}
