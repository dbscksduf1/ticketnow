import { useNavigate, useSearchParams } from 'react-router-dom'

export default function PaymentFailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const message = searchParams.get('message') || '결제가 취소되었습니다.'

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-6">😕</div>
        <h1 className="text-white text-xl font-black mb-2">결제가 완료되지 않았어요</h1>
        <p className="text-white/40 text-sm mb-8">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/premium')}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded text-sm transition-colors"
          >
            다시 시도하기
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded text-sm transition-colors"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  )
}
