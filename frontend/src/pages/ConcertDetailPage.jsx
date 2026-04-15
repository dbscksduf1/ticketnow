import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function ConcertDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [concert, setConcert] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/concerts/${id}`)
      .then(({ data }) => setConcert(data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const handleBook = () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }
    navigate(`/concerts/${id}/seats`)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-80 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    )
  }

  if (!concert) return null

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* 포스터 */}
        <div className="rounded-2xl overflow-hidden h-80 bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center">
          {concert.posterUrl ? (
            <img src={concert.posterUrl} alt={concert.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-6xl">🎵</span>
          )}
        </div>

        {/* 정보 */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
              {concert.category}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-2">{concert.title}</h1>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📍 {concert.venue}</p>
              <p>📅 {new Date(concert.date).toLocaleString('ko-KR')}</p>
              <p>⏱ {concert.duration}분</p>
              <p>👥 {concert.availableSeats} / {concert.totalSeats}석 남음</p>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-700">
              {concert.description}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">티켓 가격</span>
              <span className="text-xl font-bold text-primary">
                {concert.price?.toLocaleString()}원~
              </span>
            </div>
            <button
              onClick={handleBook}
              disabled={concert.availableSeats === 0}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {concert.availableSeats === 0 ? '매진' : '예매하기'}
            </button>
          </div>
        </div>
      </div>

      {/* 공연 상세 설명 */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">공연 안내</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {[
            { label: '공연명', value: concert.title },
            { label: '공연장', value: concert.venue },
            { label: '공연일', value: new Date(concert.date).toLocaleDateString('ko-KR') },
            { label: '공연시간', value: `${concert.duration}분` },
            { label: '주최', value: concert.organizer || '-' },
            { label: '관람등급', value: concert.ageLimit || '전체관람가' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">{label}</p>
              <p className="text-gray-800 font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
