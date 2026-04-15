import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import MainPage from './pages/MainPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ConcertDetailPage from './pages/ConcertDetailPage'
import SeatSelectionPage from './pages/SeatSelectionPage'
import QueuePage from './pages/QueuePage'
import ReservationCompletePage from './pages/ReservationCompletePage'
import MyPage from './pages/MyPage'
import PremiumPage from './pages/PremiumPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentFailPage from './pages/PaymentFailPage'
import ReservationPaymentSuccessPage from './pages/ReservationPaymentSuccessPage'

function App() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/fail" element={<PaymentFailPage />} />
        <Route path="/reservation/payment-success" element={<ReservationPaymentSuccessPage />} />
        <Route path="/concerts/:id" element={<ConcertDetailPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/concerts/:id/seats" element={<SeatSelectionPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/reservation/complete" element={<ReservationCompletePage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
