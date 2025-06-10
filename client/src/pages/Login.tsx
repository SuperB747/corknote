import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cork bg-repeat flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-cork-overlay"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg max-w-4xl w-full relative z-10"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 로그인 폼 */}
          <div className="lg:w-1/2 w-full">
            <h2 className="text-2xl font-bold text-center mb-6">Welcome to CorkNote</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {/* Password */}
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {/* Sign In button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-500 hover:text-blue-600">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
          {/* 소개 및 샘플 보드 */}
          <div className="lg:w-1/2 w-full flex flex-col space-y-4">
            <h3 className="text-xl font-semibold">CorkNote란?</h3>
            <p className="text-gray-700 text-sm">
              CorkNote는 코르크 보드 스타일의 인터페이스를 제공해 포스트잇처럼 아이디어를 쉽고 직관적으로 관리할 수 있는 노트 앱입니다.
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>드래그 앤 드롭으로 자유롭게 노트 배치</li>
              <li>폴더별 노트 관리 및 빠른 탐색</li>
              <li>자동 저장으로 깔끔한 레이아웃 유지</li>
            </ul>
            <h3 className="text-xl font-semibold mt-4">샘플 보드</h3>
            <div className="relative bg-cork bg-repeat w-full h-64 rounded-lg overflow-hidden shadow-inner">
              <div className="absolute top-4 left-6 bg-note-yellow w-24 h-24 rounded shadow-lg p-2 text-xs">
                Shopping List
              </div>
              <div className="absolute top-16 left-32 bg-note-pink w-24 h-24 rounded shadow-lg p-2 text-xs">
                Project Ideas
              </div>
              <div className="absolute top-32 left-12 bg-note-blue w-24 h-24 rounded shadow-lg p-2 text-xs">
                Tasks
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login; 