import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLayout from './common/PageLayout';
import Button from './common/Button';

const Home = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <PageLayout>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              お寿司予約システム
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              新鮮なネタと職人の技が織りなす至極の一品を、ご予約でお楽しみください。
            </p>
          </div>

          {currentUser ? (
            <div className="mt-10">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
                {/* 新規予約カード */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      新規予約
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                      <p>新しい予約を作成します。お好みの日時とメニューをお選びください。</p>
                    </div>
                    <div className="mt-5">
                      <Button
                        variant="primary"
                        onClick={() => navigate('/new-reservation')}
                      >
                        予約する
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 予約確認カード */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      予約確認
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                      <p>現在の予約状況を確認できます。予約の変更やキャンセルもこちらから。</p>
                    </div>
                    <div className="mt-5">
                      <Button
                        variant="success"
                        onClick={() => navigate('/current-reservations')}
                      >
                        予約を確認
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-10 text-center">
              <p className="text-lg text-gray-600 mb-6">
                予約をご利用いただくには、ログインまたは新規登録が必要です。
              </p>
              <div className="space-x-4">
                <Button
                  variant="primary"
                  onClick={() => navigate('/login')}
                >
                  ログイン
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/register')}
                >
                  新規登録
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Home; 