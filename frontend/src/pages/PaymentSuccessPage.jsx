import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updatePremium } = useAuthStore()
  const [status, setStatus] = useState('processing') // processing | done | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = Number(searchParams.get('amount'))

    if (!paymentKey || !orderId || !amount) {
      setStatus('error')
      setErrorMsg('결제 정보가 올바르지 않습니다.')
      return
    }

    api.post('/users/premium/confirm', { paymentKey, orderId, amount })
      .then(({ data }) => {
        updatePremium(data.accessToken, data.user)
        setStatus('done')
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || '결제 검증에 실패했습니다.')
        setStatus('error')
      })
  }, [])

  if (status === 'processing') {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white font-bold text-lg mb-2">결제 확인 중...</p>
          <p className="text-white/40 text-sm">잠시만 기다려주세요</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-white text-xl font-black mb-2">결제 처리 실패</h1>
          <p className="text-white/40 text-sm mb-8">{errorMsg}</p>
          <button onClick={() => navigate('/premium')}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded text-sm transition-colors">
            다시 시도하기
          </button>
        </div>
      </div>
    )
  }

  // done
  return (
    <div className="min-h-[calc(100vh-64px)] bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <div className="relative inline-block mb-8">
          <div className="text-8xl">👑</div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-black">✓</span>
          </div>
        </div>
        <h1 className="text-white text-3xl font-black mb-3">프리미엄 전환 완료!</h1>
        <p className="text-white/50 text-sm mb-2">대기 순번 2,000번 우선 배정 혜택이 활성화됐어요</p>
        <p className="text-white/30 text-xs mb-10">30일 후 자동으로 일반 회원으로 전환됩니다</p>
        <button
          onClick={() => navigate('/')}
          className="bg-red-600 hover:bg-red-500 text-white font-black px-10 py-4 rounded text-sm tracking-wide transition-all hover:scale-105"
          style={{ boxShadow: '0 0 30px rgba(220,38,38,0.4)' }}
        >
          지금 바로 예매하기 →
        </button>
      </div>
    </div>
  )
}
