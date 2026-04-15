import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

const GRADE_COLORS = {
  VIP: { bg: 'bg-yellow-400 hover:bg-yellow-300', selected: 'bg-yellow-200 ring-2 ring-white scale-110' },
  R:   { bg: 'bg-red-400 hover:bg-red-300',       selected: 'bg-red-200 ring-2 ring-white scale-110' },
  S:   { bg: 'bg-blue-400 hover:bg-blue-300',     selected: 'bg-blue-200 ring-2 ring-white scale-110' },
  A:   { bg: 'bg-green-400 hover:bg-green-300',   selected: 'bg-green-200 ring-2 ring-white scale-110' },
}

const MAX_SEATS = 4  // 1인 최대 4석

export default function SeatSelectionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [seats, setSeats] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState(false)

  useEffect(() => {
    api.get(`/concerts/${id}/seats`)
      .then(({ data }) => setSeats(data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleSeat = (seat) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(seat.id)) {
        next.delete(seat.id)
      } else {
        if (next.size >= MAX_SEATS) return prev  // 최대 4석
        next.add(seat.id)
      }
      return next
    })
  }

  const selectedSeats = seats.filter(s => selectedIds.has(s.id))
  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0)

  const handleReserve = async () => {
    if (selectedSeats.length === 0) return
    if (!user) { navigate('/login'); return }
    setReserving(true)
    try {
      // 대표 좌석(첫 번째)으로 대기열 진입
      const { data } = await api.post('/reservations/queue/enter', {
        concertId: Number(id),
        seatId: selectedSeats[0].id,
      })
      navigate('/queue', {
        state: {
          token: data.queueToken,
          concertId: id,
          seats: selectedSeats,
          seat: selectedSeats[0],   // QueuePage 호환용
          totalPrice,
        }
      })
    } catch (err) {
      alert(err.response?.data?.message || '예매 요청에 실패했습니다.')
    } finally {
      setReserving(false)
    }
  }

  const rows = [...new Set(seats.map(s => s.row))].sort()

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 text-white">
      <button onClick={() => navigate(-1)}
        className="text-sm text-white/50 hover:text-white mb-4 flex items-center gap-1 transition-colors">
        ← 뒤로가기
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">좌석 선택</h1>
        <span className="text-white/40 text-xs">최대 {MAX_SEATS}석 선택 가능</span>
      </div>

      {/* 무대 */}
      <div className="bg-white/10 border border-white/20 text-white text-center py-3 rounded-xl text-sm font-medium mb-8 tracking-widest">
        🎭 STAGE
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
        </div>
      ) : seats.length === 0 ? (
        <div className="text-center py-20 text-white/40">좌석 정보가 없습니다.</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {rows.map((row) => (
              <div key={row} className="flex items-center gap-2 mb-2 justify-center">
                <span className="text-xs text-white/40 w-4 text-right font-mono">{row}</span>
                <div className="flex gap-1.5">
                  {seats
                    .filter(s => s.row === row)
                    .sort((a, b) => a.number - b.number)
                    .map((seat) => {
                      const isSelected = selectedIds.has(seat.id)
                      const isUnavailable = seat.status === 'RESERVED' || seat.status === 'HELD'
                      const isMaxed = !isSelected && selectedIds.size >= MAX_SEATS

                      return (
                        <button
                          key={seat.id}
                          disabled={isUnavailable}
                          onClick={() => !isMaxed && toggleSeat(seat)}
                          title={`${row}열 ${seat.number}번 (${seat.grade}) ${seat.price.toLocaleString()}원`}
                          className={`w-8 h-8 rounded text-xs font-bold transition-all
                            ${isUnavailable
                              ? 'bg-white/10 text-white/20 cursor-not-allowed'
                              : isSelected
                              ? GRADE_COLORS[seat.grade]?.selected + ' text-black'
                              : isMaxed
                              ? GRADE_COLORS[seat.grade]?.bg.split(' ')[0] + ' text-black opacity-30 cursor-not-allowed'
                              : GRADE_COLORS[seat.grade]?.bg + ' text-black'
                            }`}
                        >
                          {seat.number}
                        </button>
                      )
                    })
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="flex flex-wrap gap-4 justify-center mt-8 text-xs">
        {Object.entries(GRADE_COLORS).map(([grade, cls]) => (
          <div key={grade} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded ${cls.bg.split(' ')[0]}`} />
            <span className="text-white/50">{grade}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-white/10" />
          <span className="text-white/50">예매완료</span>
        </div>
      </div>

      {/* 하단 패널 */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 p-4"
          style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)' }}>
          <div className="max-w-4xl mx-auto">
            {/* 선택 좌석 태그 목록 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedSeats.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleSeat(s)}
                  className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1 text-xs text-white transition-colors"
                >
                  {s.row}열 {s.number}번
                  <span className="text-white/40 ml-1">✕</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/40 text-xs">{selectedSeats.length}석 선택</p>
                <p className="text-red-400 font-black text-xl">{totalPrice.toLocaleString()}원</p>
              </div>
              <button
                onClick={handleReserve}
                disabled={reserving}
                className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-xl text-sm tracking-wide transition-all disabled:opacity-50"
                style={{ boxShadow: '0 0 30px rgba(220,38,38,0.25)' }}
              >
                {reserving ? '처리 중...' : `예매하기 — ${selectedSeats.length}석`}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSeats.length > 0 && <div className="h-32" />}
    </main>
  )
}
