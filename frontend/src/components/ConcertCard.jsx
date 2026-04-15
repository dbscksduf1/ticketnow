import { Link } from 'react-router-dom'

export default function ConcertCard({ concert }) {
  const { id, title, venue, date, posterUrl, availableSeats, totalSeats } = concert
  const isSoldOut = availableSeats === 0
  const soldOutRate = Math.round(((totalSeats - availableSeats) / totalSeats) * 100)

  return (
    <Link to={`/concerts/${id}`} className="block group">
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all hover:-translate-y-0.5">
        <div className="relative h-52 bg-white/5 overflow-hidden">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 to-purple-900/40">
              <span className="text-5xl">🎵</span>
            </div>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <span className="text-white font-black text-lg tracking-widest">SOLD OUT</span>
            </div>
          )}
          {!isSoldOut && availableSeats < 50 && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              마감 임박
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-white text-sm truncate">{title}</h3>
          <p className="text-white/40 text-xs mt-1">{venue}</p>
          <p className="text-white/30 text-xs">{new Date(date).toLocaleDateString('ko-KR')}</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/30">잔여좌석</span>
              <span className={isSoldOut ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                {isSoldOut ? '매진' : `${availableSeats}석`}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-0.5">
              <div
                className={`h-0.5 rounded-full ${isSoldOut ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${soldOutRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
