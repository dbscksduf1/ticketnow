import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'

export default function ReservationPaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing')
  const [reservation, setReservation] = useState(null)

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')
    const ctx = JSON.parse(sessionStorage.getItem('reservationContext') || '{}')

    if (!paymentKey || !ctx.queueToken) {
      navigate('/')
      return
    }

    api.post('/reservations', {
      queueToken: ctx.queueToken,
      concertId: ctx.concertId,
      seatId: ctx.seatId,
      paymentKey,
      orderId,
      amount: Number(amount),
    })
      .then(({ data }) => {
        sessionStorage.removeItem('reservationContext')
        setReservation(data)
        setStatus('done')
      })
      .catch((e) => {
        console.error(e)
        setStatus('error')
      })
  }, [])

  if (status === 'processing') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/60 text-sm">예매 확정 중...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-white text-xl font-bold mb-2">예매 확정에 실패했습니다</h1>
          <p className="text-white/40 text-sm mb-6">결제는 완료됐으나 예매 처리 중 오류가 발생했습니다.<br/>고객센터에 문의해주세요.</p>
          <button onClick={() => navigate('/')}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors">
            홈으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-white text-2xl font-black mb-2">예매 완료!</h1>
        <p className="text-white/40 text-sm mb-8">결제가 완료되었습니다</p>

        {reservation && (
          <div className="border border-white/10 rounded-2xl p-6 mb-8 text-left bg-white/5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">예매번호</span>
              <span className="text-white font-mono text-xs">{reservation.reservationNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">좌석</span>
              <span className="text-white font-bold">
                {reservation.seatRow}열 {reservation.seatNumber}번 ({reservation.seatGrade}석)
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/10 pt-3">
              <span className="text-white/40">결제금액</span>
              <span className="text-red-400 font-black">{reservation.price?.toLocaleString()}원</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => navigate('/mypage')}
            className="flex-1 border border-white/20 text-white/70 hover:text-white font-bold py-3 rounded-xl text-sm transition-colors">
            예매내역 보기
          </button>
          <button onClick={() => navigate('/')}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-sm transition-colors">
            홈으로
          </button>
        </div>
      </div>
    </div>
  )
}
