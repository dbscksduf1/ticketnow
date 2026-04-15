import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function Navbar() {
  const { accessToken, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isHome = location.pathname === '/'

  return (
    <nav className={`sticky top-0 z-50 transition-colors ${
      isHome
        ? 'bg-black/70 backdrop-blur-md border-b border-white/10'
        : 'bg-black border-b border-white/10'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link to="/" className="text-white font-black tracking-[0.2em] uppercase text-base">
          TicketNow
        </Link>

        {/* 가운데 카테고리 */}
        <div className="hidden md:flex items-center gap-8">
          {['콘서트', '뮤지컬', '스포츠', '전시'].map((cat) => (
            <Link
              key={cat}
              to={`/?category=${cat}`}
              className="text-white/50 hover:text-white text-xs tracking-widest uppercase transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* 우측 인증 */}
        <div className="flex items-center gap-3">
          {accessToken ? (
            <>
              {user?.isPremium ? (
                <span className="text-xs bg-red-600/20 border border-red-500/40 text-red-400 px-2.5 py-1 rounded-full font-bold tracking-wide">
                  👑 PREMIUM
                </span>
              ) : (
                <Link
                  to="/premium"
                  className="text-xs border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white hover:border-transparent px-3 py-1.5 rounded transition-all font-medium"
                >
                  프리미엄
                </Link>
              )}
              <Link
                to="/mypage"
                className="text-white/50 hover:text-white text-xs tracking-wide transition-colors"
              >
                마이페이지
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs border border-white/20 text-white/60 hover:text-white hover:border-white/60 px-4 py-1.5 rounded transition-all"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                to="/premium"
                className="text-xs border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white hover:border-transparent px-3 py-1.5 rounded transition-all font-medium"
              >
                프리미엄
              </Link>
              <Link
                to="/login"
                className="text-white/50 hover:text-white text-xs tracking-wide transition-colors"
              >
                로그인
              </Link>
              <Link
                to="/register"
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded transition-colors font-medium"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
