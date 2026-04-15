import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function ReservationCompletePage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const reservation = state?.reservation

  useEffect(() => {
    if (!reservation) navigate('/')
  }, [])

  if (!reservation) return null

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">예매 완료!</h1>
          <p className="text-gray-500 text-sm mb-8">티켓이 성공적으로 예매되었습니다</p>

          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-8">
            <h2 className="font-bold text-gray-900 text-sm border-b border-gray-200 pb-2 mb-3">예매 정보</h2>
            {[
              { label: '예매번호', value: reservation.reservationNumber },
              { label: '공연명', value: reservation.concertTitle },
              { label: '공연일시', value: new Date(reservation.concertDate).toLocaleString('ko-KR') },
              { label: '공연장', value: reservation.venue },
              { label: '좌석', value: `${reservation.seatRow}열 ${reservation.seatNumber}번 (${reservation.seatGrade}석)` },
              { label: '결제금액', value: `${reservation.price?.toLocaleString()}원` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link
              to="/mypage"
              className="flex-1 border border-primary text-primary py-2.5 rounded-xl text-sm font-medium hover:bg-primary/5 transition-colors"
            >
              예매 내역 보기
            </Link>
            <Link
              to="/"
              className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
