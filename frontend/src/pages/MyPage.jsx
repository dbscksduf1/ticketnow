import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

const STATUS_LABEL = {
  CONFIRMED: { text: '예매완료', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { text: '취소됨', cls: 'bg-gray-100 text-gray-500' },
  PENDING: { text: '결제대기', cls: 'bg-yellow-100 text-yellow-700' },
}

export default function MyPage() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reservations/my')
      .then(({ data }) => setReservations(data))
      .catch(() => setReservations([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async (reservationId) => {
    if (!confirm('예매를 취소하시겠습니까?')) return
    try {
      await api.delete(`/reservations/${reservationId}`)
      setReservations((prev) =>
        prev.map((r) => r.id === reservationId ? { ...r, status: 'CANCELLED' } : r)
      )
    } catch (err) {
      alert(err.response?.data?.message || '취소에 실패했습니다.')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          로그아웃
        </button>
      </div>

      <h2 className="text-base font-semibold text-gray-700 mb-4">예매 내역</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-3">🎟️</p>
          <p className="text-sm">예매 내역이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const statusInfo = STATUS_LABEL[r.status] || STATUS_LABEL.PENDING
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.cls}`}>
                        {statusInfo.text}
                      </span>
                      <span className="text-xs text-gray-400">{r.reservationNumber}</span>
                    </div>
                    <p className="font-bold text-gray-900">{r.concertTitle}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(r.concertDate).toLocaleDateString('ko-KR')} · {r.venue}
                    </p>
                    <p className="text-sm text-gray-500">
                      {r.seatRow}열 {r.seatNumber}번 ({r.seatGrade}석) · {r.price?.toLocaleString()}원
                    </p>
                  </div>
                  {r.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancel(r.id)}
                      className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-3 py-1 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
