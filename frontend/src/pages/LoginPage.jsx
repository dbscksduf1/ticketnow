import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/users/login', form)
      login(data.accessToken, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || '이메일 또는 비밀번호를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm p-8">
          <h1 className="text-2xl font-black text-white mb-1 tracking-tight">로그인</h1>
          <p className="text-white/40 text-sm mb-8">공연 예매를 위해 로그인해주세요</p>

          {error && (
            <div className="bg-red-950/50 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-wide uppercase">이메일</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/40 transition-colors"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-wide uppercase">비밀번호</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/40 transition-colors"
                placeholder="비밀번호 입력"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold text-sm tracking-wide transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-6">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-white hover:text-red-400 font-medium transition-colors">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
