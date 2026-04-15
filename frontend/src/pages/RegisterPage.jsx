import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    try {
      await api.post('/users/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm p-8">
          <h1 className="text-2xl font-black text-white mb-1 tracking-tight">회원가입</h1>
          <p className="text-white/40 text-sm mb-8">티켓나우에 오신 걸 환영해요</p>

          {error && (
            <div className="bg-red-950/50 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'name', label: '이름', type: 'text', placeholder: '홍길동' },
              { key: 'email', label: '이메일', type: 'email', placeholder: 'example@email.com' },
              { key: 'password', label: '비밀번호', type: 'password', placeholder: '8자 이상' },
              { key: 'confirmPassword', label: '비밀번호 확인', type: 'password', placeholder: '비밀번호 재입력' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-wide uppercase">{label}</label>
                <input
                  type={type}
                  required
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/40 transition-colors"
                  placeholder={placeholder}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold text-sm tracking-wide transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-6">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-white hover:text-red-400 font-medium transition-colors">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
