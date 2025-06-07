import React, { useState } from 'react';
import { User, updateProfile, updateEmail, updatePassword, signOut } from 'firebase/auth';
import { firebaseAuth } from '../firebase/config';
import { Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface UserProfileProps {
  user: User;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateProfile = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }
      
      if (email !== user.email) {
        await updateEmail(user, email);
      }
      
      if (password) {
        await updatePassword(user, password);
      }
      
      setSuccess('프로필이 성공적으로 업데이트되었습니다.');
      setPassword(''); // 보안을 위해 비밀번호 필드 초기화
    } catch (err) {
      setError('프로필 업데이트 중 오류가 발생했습니다.');
      console.error('Error updating profile:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          {user.displayName || user.email}
        </span>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={handleLogout}
          className="p-1 hover:bg-gray-100 rounded-full"
          title="로그아웃"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {isSettingsOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 z-50">
          <h3 className="text-lg font-semibold mb-4">사용자 설정</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">이름</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">새 비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="변경하려면 입력하세요"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600">{success}</p>
            )}
            <button
              onClick={handleUpdateProfile}
              className="w-full bg-blue-600 text-white rounded-md py-2 px-4 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 