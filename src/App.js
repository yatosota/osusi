// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReservationHistory from './components/ReservationHistory';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Auth/Register';
import ReservationForm from './components/ReservationForm';
import Home from './components/Home';
import CurrentReservations from './components/CurrentReservations';
import Header from './components/Header';
import PaymentPage from './components/PaymentPage';
import ConfirmationPage from './components/ConfirmationPage';

// ローディング表示用コンポーネント
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

// ルートガードコンポーネント
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // ゲストユーザーまたは認証済みユーザーの場合はアクセスを許可
  if (currentUser || sessionStorage.getItem('guestUser')) {
    return (
      <>
        <Header />
        {children}
      </>
    );
  }

  // それ以外の場合はログインページにリダイレクト
  return <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route
              path="/current-reservations"
              element={
                <PrivateRoute>
                  <CurrentReservations />
                </PrivateRoute>
              }
            />
            <Route
              path="/reservation-history"
              element={
                <PrivateRoute>
                  <ReservationHistory />
                </PrivateRoute>
              }
            />
            <Route
              path="/new-reservation"
              element={
                <PrivateRoute>
                  <ReservationForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/payment"
              element={
                <PrivateRoute>
                  <PaymentPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/confirmation"
              element={
                <PrivateRoute>
                  <ConfirmationPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
