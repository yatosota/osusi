import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Home link */}
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate('/')}
              className="text-xl font-bold text-blue-600 hover:text-blue-700"
            >
              お寿司予約
            </button>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <button
                  onClick={() => navigate('/new-reservation')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  新規予約
                </button>
                <button
                  onClick={() => navigate('/current-reservations')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  予約確認
                </button>
                <button
                  onClick={() => navigate('/reservation-history')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  予約履歴
                </button>
                <span className="text-sm text-gray-700">
                  {currentUser.email || 'ゲスト'}様
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ログイン
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  新規登録
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 