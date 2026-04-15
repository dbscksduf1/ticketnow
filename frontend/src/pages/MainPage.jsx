import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import ConcertCard from '../components/ConcertCard'

const CATEGORIES = ['전체', '콘서트', '뮤지컬', '스포츠', '전시']

// 네온 컬러 팔레트
const COLORS = [
  '#ff2244', '#ff4466',   // 빨강
  '#00ff88', '#44ffaa',   // 초록
  '#ffdd00', '#ffee44',   // 노랑
  '#00ccff', '#44ddff',   // 시안
  '#cc44ff', '#ee88ff',   // 보라
  '#ff8800', '#ffaa44',   // 주황
  '#ff44aa',              // 핑크
  '#ffffff',              // 흰색
]

function useLineAnimation(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const lines = []
    let animId

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const spawnLine = () => {
      // 클러스터 포인트 — 여러 선이 한 점에서 동시에 퍼져나가는 효과
      const cx = Math.random() * canvas.width
      const cy = Math.random() * canvas.height
      const count = 1 + Math.floor(Math.random() * 4)
      for (let i = 0; i < count; i++) {
        lines.push({
          x: cx,
          y: cy,
          angle: Math.random() * Math.PI * 2,
          speed: 4 + Math.random() * 10,
          length: 0,
          maxLength: 60 + Math.random() * 220,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 0,
          width: 0.4 + Math.random() * 1.8,
        })
      }
    }

    let frame = 0
    const animate = () => {
      // 잔상 효과 — 완전히 지우지 않고 희미하게 덮음
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      frame++
      // 3프레임마다 새 선 생성
      if (frame % 3 === 0) {
        spawnLine()
      }
      // 최대 200개 유지
      if (lines.length > 200) lines.splice(0, lines.length - 200)

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i]
        line.length += line.speed

        const progress = line.length / line.maxLength
        // 앞 20% 페이드인, 뒤 40% 페이드아웃
        if (progress < 0.2) {
          line.alpha = progress / 0.2
        } else if (progress > 0.6) {
          line.alpha = 1 - (progress - 0.6) / 0.4
        } else {
          line.alpha = 1
        }

        if (progress >= 1) {
          lines.splice(i, 1)
          continue
        }

        const x2 = line.x + Math.cos(line.angle) * line.length
        const y2 = line.y + Math.sin(line.angle) * line.length

        // 빛나는 효과 — 같은 선을 두 번 그림 (굵게 + 얇게)
        ctx.globalAlpha = Math.max(0, line.alpha * 0.3)
        ctx.beginPath()
        ctx.moveTo(line.x, line.y)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = line.color
        ctx.lineWidth = line.width * 4
        ctx.stroke()

        ctx.globalAlpha = Math.max(0, line.alpha)
        ctx.beginPath()
        ctx.moveTo(line.x, line.y)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = line.color
        ctx.lineWidth = line.width
        ctx.stroke()

        ctx.globalAlpha = 1
      }

      animId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [canvasRef])
}

export default function MainPage() {
  const canvasRef = useRef(null)
  const [concerts, setConcerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('전체')
  const [keyword, setKeyword] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useLineAnimation(canvasRef)

  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat) setCategory(cat)
  }, [searchParams])

  useEffect(() => {
    fetchConcerts()
  }, [category])

  const fetchConcerts = async () => {
    setLoading(true)
    try {
      const params = {}
      if (category !== '전체') params.category = category
      if (keyword) params.keyword = keyword
      const { data } = await api.get('/concerts', { params })
      setConcerts(data.content || data)
    } catch {
      setConcerts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchConcerts()
  }

  const scrollToConcerts = () => {
    document.getElementById('concerts-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="bg-black min-h-screen text-white">
      {/* ── 히어로 섹션 ── */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* 캔버스 배경 */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ background: '#000' }}
        />

        {/* 텍스트 오버레이 */}
        <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-20 max-w-5xl">
          {/* 소제목 */}
          <p className="text-white/40 text-xs tracking-[0.4em] uppercase mb-6 font-medium">
            Next-Gen Ticketing Platform
          </p>

          {/* 메인 헤드라인 */}
          <h1
            className="text-5xl md:text-7xl font-black leading-[1.05] mb-6"
            style={{
              color: '#fff',
              letterSpacing: '-0.02em',
              textShadow: '0 0 60px rgba(255,255,255,0.15)',
            }}
          >
            티켓팅, 이제<br />
            새로고침 전쟁 끝
          </h1>

          {/* 서브 카피 */}
          <p className="text-white/50 text-base md:text-lg mb-10 max-w-md leading-relaxed">
            대기열 시스템으로 공정한 예매.<br />
            프리미엄 회원은 순번 우선 배정.
          </p>

          {/* CTA 버튼들 */}
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={scrollToConcerts}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded text-sm tracking-wide transition-all hover:scale-105 active:scale-95"
              style={{ boxShadow: '0 0 30px rgba(220,38,38,0.5)' }}
            >
              지금 바로 예매하기
            </button>
            <button
              onClick={() => navigate('/register')}
              className="border border-white/30 hover:border-white/70 text-white/70 hover:text-white font-medium px-8 py-4 rounded text-sm tracking-wide transition-all"
            >
              무료 회원가입
            </button>
          </div>

          {/* 통계 */}
          <div className="flex gap-8 mt-14">
            {[
              { num: '1,000+', label: '동시 접속 처리' },
              { num: '0건', label: '중복 예매' },
              { num: '< 2초', label: 'p95 응답시간' },
            ].map(({ num, label }) => (
              <div key={label}>
                <p className="text-white font-bold text-xl">{num}</p>
                <p className="text-white/40 text-xs mt-1 tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 스크롤 유도 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
          <span className="text-white text-xs tracking-widest">SCROLL</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ── 공연 목록 섹션 ── */}
      <section id="concerts-section" className="bg-zinc-950 min-h-screen px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* 섹션 헤더 */}
          <div className="mb-8">
            <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-2">Live Events</p>
            <h2 className="text-white text-2xl font-bold">공연 목록</h2>
          </div>

          {/* 검색 + 카테고리 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="공연명, 아티스트 검색"
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-2.5 rounded text-sm focus:outline-none focus:border-white/30 transition-colors"
              />
              <button
                type="submit"
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded text-sm transition-colors"
              >
                검색
              </button>
            </form>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`whitespace-nowrap px-4 py-2 rounded text-sm font-medium transition-all ${
                    category === c
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 공연 그리드 */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          ) : concerts.length === 0 ? (
            <div className="text-center py-24 text-white/30">
              <p className="text-5xl mb-4">🎭</p>
              <p className="text-sm tracking-wide">공연이 없습니다</p>
              <p className="text-xs mt-2 text-white/20">백엔드 서버를 실행해주세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {concerts.map((concert) => (
                <ConcertCard key={concert.id} concert={concert} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
