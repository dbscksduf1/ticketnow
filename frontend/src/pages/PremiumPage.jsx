import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eon'
const AMOUNT = 9900

const BENEFITS = [
  { icon: '⚡', title: '대기 순번 2,000번 앞당기기', desc: '티켓 오픈 순간 일반 회원보다 2,000번 앞 순번으로 시작' },
  { icon: '🔔', title: '오픈 알림 우선 발송', desc: '공연 티켓 오픈 30분 전 이메일 알림' },
  { icon: '🎫', title: '예매 수수료 면제', desc: '건당 2,000원 수수료 없음 (월 3회 이상 예매 시 본전)' },
  { icon: '📋', title: '예매 내역 무제한 보관', desc: '일반 회원은 최근 3개월만 보관' },
]

export default function PremiumPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [, setSdkReady] = useState(false)
  const [loading, setLoading] = useState(false)

  // Toss JS SDK 미리 로드
  useEffect(() => {
    if (window.TossPayments) { setSdkReady(true); return }
    if (document.querySelector('script[src*="tosspayments"]')) return
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.onload = () => setSdkReady(true)
    script.onerror = () => console.error('Toss SDK 로드 실패')
    document.head.appendChild(script)
  }, [])

  // 이미 프리미엄
  if (user?.isPremium) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-6">👑</div>
          <h1 className="text-white text-2xl font-black mb-2">이미 프리미엄 회원이에요</h1>
          <p className="text-white/40 text-sm mb-8">대기 순번 우선 배정 혜택이 적용 중입니다</p>
          <button onClick={() => navigate('/')}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 rounded text-sm transition-colors">
            공연 예매하러 가기
          </button>
        </div>
      </div>
    )
  }

  const handlePayment = () => {
    if (!user) { navigate('/login'); return }
    if (!window.TossPayments) {
      alert('결제 모듈이 아직 로드되지 않았습니다. 잠시 후 다시 눌러주세요.')
      return
    }
    setLoading(true)

    const orderId = `premium_${user.id}_${Date.now()}`
    const tossPayments = window.TossPayments(TOSS_CLIENT_KEY)

    // 동기적으로 바로 호출 — async/await 없이 (팝업 차단 방지)
    tossPayments.requestPayment('카드', {
      amount: AMOUNT,
      orderId,
      orderName: 'TicketNow 프리미엄 멤버십 (30일)',
      customerName: user.name || user.email,
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    }).catch((e) => {
      console.error('결제 오류:', e)
      if (e?.code !== 'USER_CANCEL') {
        alert(`결제 오류: ${e?.message || '알 수 없는 오류'}`)
      }
      setLoading(false)
    })
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black text-white">
      {/* 히어로 */}
      <div className="relative overflow-hidden py-20 px-4 text-center"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.15) 0%, transparent 70%)' }}>
        <p className="text-red-500 text-xs tracking-[0.4em] uppercase mb-4 font-medium">Premium Membership</p>
        <h1 className="text-4xl md:text-6xl font-black mb-4" style={{ letterSpacing: '-0.02em' }}>
          티켓팅 전쟁에서<br />
          <span className="text-red-500">항상 앞서가세요</span>
        </h1>
        <p className="text-white/50 text-base max-w-md mx-auto mb-10 leading-relaxed">
          인기 공연 오픈 순간, 일반 회원보다 2,000번 앞 순번으로 시작합니다
        </p>

        {/* 가격 카드 */}
        <div className="inline-flex flex-col items-center border border-red-500/30 rounded-2xl px-12 py-8 mb-4"
          style={{ background: 'rgba(220,38,38,0.05)' }}>
          <span className="text-white/40 text-sm line-through mb-1">19,900원/월</span>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-white">9,900</span>
            <span className="text-white/60 text-lg mb-1">원/월</span>
          </div>
          <span className="text-red-400 text-xs font-bold mt-2 bg-red-500/10 px-3 py-1 rounded-full">
            첫 달 50% 할인
          </span>
        </div>
      </div>

      {/* 혜택 + 비교표 */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="grid gap-3 mb-10">
          {BENEFITS.map(({ icon, title, desc }) => (
            <div key={title}
              className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-colors">
              <span className="text-2xl mt-0.5">{icon}</span>
              <div>
                <p className="text-white font-bold text-sm">{title}</p>
                <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 비교표 */}
        <div className="border border-white/10 rounded-xl overflow-hidden mb-10">
          <div className="grid grid-cols-3 bg-white/5 text-center py-3 text-xs text-white/50 tracking-wide">
            <span>혜택</span><span>일반</span>
            <span className="text-red-400 font-bold">프리미엄</span>
          </div>
          {[
            ['대기 순번', '랜덤', '2,000번 우선'],
            ['수수료', '2,000원/건', '무료'],
            ['오픈 알림', '없음', '30분 전 알림'],
            ['예매 내역', '3개월', '무제한'],
          ].map(([label, normal, premium]) => (
            <div key={label}
              className="grid grid-cols-3 text-center py-3 border-t border-white/5 text-sm">
              <span className="text-white/50 text-xs">{label}</span>
              <span className="text-white/30 text-xs">{normal}</span>
              <span className="text-red-400 font-bold text-xs">{premium}</span>
            </div>
          ))}
        </div>

        {/* 결제 버튼 */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-xl text-base tracking-wide transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-50"
          style={{ boxShadow: '0 0 40px rgba(220,38,38,0.3)' }}
        >
          {loading ? '결제창 여는 중...' : '프리미엄 시작하기 — 9,900원/월'}
        </button>

        <div className="flex items-center justify-center gap-4 mt-4">
          <p className="text-white/20 text-xs">언제든 해지 가능 · 자동 갱신 없음</p>
          <span className="text-white/10">|</span>
          <p className="text-white/20 text-xs">Powered by Toss Payments</p>
        </div>

        {/* 테스트 카드 안내 */}
        <div className="mt-6 p-4 rounded-xl border border-white/5 bg-white/3">
          <p className="text-white/40 text-xs font-bold mb-2">🧪 테스트 결제 안내</p>
          <p className="text-white/25 text-xs leading-relaxed">
            카드번호: <span className="text-white/40 font-mono">4330-0000-0000-1234</span> · 유효기간: 임의 입력 · 비밀번호: 임의 입력
          </p>
        </div>
      </div>
    </div>
  )
}
