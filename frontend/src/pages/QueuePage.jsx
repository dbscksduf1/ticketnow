import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eon'

export default function QueuePage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [queueInfo, setQueueInfo] = useState({ rank: null, total: null, status: 'WAITING' })
  const [paying, setPaying] = useState(false)
  const eventSourceRef = useRef(null)

  // Toss SDK 미리 로드
  useEffect(() => {
    if (window.TossPayments) return
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!state?.token) { navigate('/'); return }

    const url = `/api/reservations/queue/status?queueToken=${state.token}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setQueueInfo(data)
      if (data.status === 'READY') es.close()
    }
    es.onerror = () => {
      es.close()
      setQueueInfo((prev) => ({ ...prev, status: 'ERROR' }))
    }
    return () => es.close()
  }, [])

  const handlePayment = () => {
    if (!window.TossPayments) {
      alert('결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }
    setPaying(true)

    // 결제 완료 후 돌아올 때 쓸 정보를 세션 스토리지에 저장
    sessionStorage.setItem('reservationContext', JSON.stringify({
      queueToken: state.token,
      concertId: state.concertId,
      seatId: state.seat.id,
      seat: state.seat,
      counts: state.counts,
    }))

    const orderId = `rsv_${state.seat.id}_${Date.now()}`
    const tossPayments = window.TossPayments(TOSS_CLIENT_KEY)

    tossPayments.requestPayment('카드', {
      amount: state.totalPrice || state.seat.price,
      orderId,
      orderName: `${state.seat.row}열 ${state.seat.number}번석 예매`,
      customerName: user?.name || user?.email || '고객',
      successUrl: `${window.location.origin}/reservation/payment-success`,
      failUrl: `${window.location.origin}/reservation/payment-fail`,
    }).catch((e) => {
      if (e?.code !== 'USER_CANCEL') alert(`결제 오류: ${e?.message}`)
      setPaying(false)
    })
  }

  const handleCancel = () => {
    eventSourceRef.current?.close()
    api.post('/reservations/queue/leave', { queueToken: state.token }).catch(() => {})
    navigate(-1)
  }

  const progressPercent = queueInfo.rank && queueInfo.total
    ? Math.round(((queueInfo.total - queueInfo.rank) / queueInfo.total) * 100)
    : 0

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        {/* 대기 중 */}
        {queueInfo.status === 'WAITING' && (
          <>
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-red-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">🎫</span>
              </div>
            </div>

            <h1 className="text-xl font-bold text-white mb-2">대기 중입니다</h1>
            <p className="text-white/40 text-sm mb-8">잠시만 기다려주세요. 창을 닫지 마세요!</p>

            {queueInfo.rank !== null && (
              <div className="border border-white/10 rounded-2xl p-6 mb-6 bg-white/5">
                <div className="text-5xl font-black text-red-400 mb-1">{queueInfo.rank}번째</div>
                <div className="text-white/40 text-sm mb-4">전체 {queueInfo.total}명 대기 중</div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="text-xs text-white/30 mt-2">진행률 {progressPercent}%</p>
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs px-4 py-3 rounded-xl mb-6">
              ⚠️ 좌석 선점 시간은 5분입니다. 시간 내에 결제를 완료해주세요.
            </div>

            <button onClick={handleCancel} className="text-sm text-white/30 hover:text-white/60 underline transition-colors">
              대기 취소
            </button>
          </>
        )}

        {/* 입장 가능 */}
        {queueInfo.status === 'READY' && (
          <>
            <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">입장 가능합니다!</h1>
            <p className="text-white/40 text-sm mb-8">5분 안에 결제를 완료해주세요</p>

            <div className="border border-white/10 rounded-2xl p-5 mb-6 text-left bg-white/5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">좌석</span>
                <span className="text-white font-bold">
                  {state?.seat?.row}열 {state?.seat?.number}번 ({state?.seat?.grade}석)
                </span>
              </div>
              {state?.counts && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">인원</span>
                  <span className="text-white/80 text-xs">
                    {state.counts.adult > 0 && `성인 ${state.counts.adult}명`}
                    {state.counts.teen > 0 && ` 청소년 ${state.counts.teen}명`}
                    {state.counts.infant > 0 && ` 유아 ${state.counts.infant}명`}
                  </span>
                </div>
              )}
              {state?.totalPrice && (
                <div className="flex justify-between text-sm border-t border-white/10 pt-3">
                  <span className="text-white/40">결제금액</span>
                  <span className="text-red-400 font-black text-lg">
                    {state.totalPrice.toLocaleString()}원
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handlePayment}
              disabled={paying}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl text-sm tracking-wide transition-all disabled:opacity-50"
              style={{ boxShadow: '0 0 30px rgba(220,38,38,0.25)' }}
            >
              {paying ? '결제창 여는 중...' : '결제하기'}
            </button>
          </>
        )}

        {/* 오류 */}
        {queueInfo.status === 'ERROR' && (
          <>
            <div className="w-20 h-20 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">연결이 끊겼습니다</h1>
            <p className="text-white/40 text-sm mb-6">네트워크 상태를 확인하고 다시 시도해주세요</p>
            <button onClick={() => navigate('/')} className="text-red-400 font-medium text-sm hover:underline">
              홈으로 돌아가기
            </button>
          </>
        )}
      </div>
    </main>
  )
}
