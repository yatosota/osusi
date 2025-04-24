// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ReservationForm from './components/ReservationForm';
import ReservationHistory from './components/ReservationHistory';
import PaymentForm from './components/PaymentForm';
import ConfirmationPage from './components/ConfirmationPage';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import { useAuth } from './contexts/AuthContext';
import PaymentPage from './components/PaymentPage';
import ReservationList from './components/ReservationList';

// ナビゲーションコンポーネント
const Navigation = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-4">
            <Link to="/" className="text-gray-700 hover:text-gray-900">
              ホーム
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <span className="text-gray-600">ようこそ、{currentUser.name || currentUser.email}さん</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-gray-900"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-gray-900">
                  ログイン
                </Link>
                <Link to="/register" className="text-gray-700 hover:text-gray-900">
                  新規登録
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// ホームページコンポーネント
const Home = () => {
  return (
    <div className="max-w-4xl mx-auto mt-8 p-6">
      <h1 className="text-3xl font-bold mb-6">お寿司予約システム</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          to="/new-reservation"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">新規予約</h2>
          <p className="text-gray-600">新しい予約を作成します</p>
        </Link>
        <Link
          to="/reservation-history"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">予約履歴</h2>
          <p className="text-gray-600">予約履歴の確認ができます</p>
        </Link>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/new-reservation" element={<ReservationForm />} />
            <Route path="/reservation-history" element={<ReservationHistory />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/reservations" element={<ReservationList />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
