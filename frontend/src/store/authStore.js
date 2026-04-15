import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('accessToken') || null,

  login: (token, user) => {
    localStorage.setItem('accessToken', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ accessToken: token, user })
  },

  // 프리미엄 업그레이드 후 토큰/유저 정보 갱신
  updatePremium: (newToken, newUser) => {
    localStorage.setItem('accessToken', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    set({ accessToken: newToken, user: newUser })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    set({ accessToken: null, user: null })
  },

  isLoggedIn: () => !!localStorage.getItem('accessToken'),
}))

export default useAuthStore
