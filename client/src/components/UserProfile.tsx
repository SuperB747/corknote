import React, { useState, useRef } from 'react';
import { User, updateProfile, updateEmail, updatePassword, signOut } from 'firebase/auth';
import { firebaseAuth } from '../firebase/config';
import { Cog6ToothIcon, ArrowRightOnRectangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ReactDOM from 'react-dom';

interface UserProfileProps {
  user: User;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
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
      
      setSuccess('Profile updated successfully.');
      setPassword(''); // 보안을 위해 비밀번호 필드 초기화
    } catch (err) {
      setError('Error updating profile.');
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

  // toggle settings panel and compute position
  const toggleSettings = () => {
    if (!isSettingsOpen && settingsButtonRef.current) {
      const rect = settingsButtonRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
    setIsSettingsOpen(open => !open);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 flex-1">
          {user.displayName || user.email}
        </span>
        <div className="flex items-center gap-2">
          <button
            ref={settingsButtonRef}
            onClick={toggleSettings}
            className="p-1 hover:bg-gray-100 rounded-full"
            title="Settings"
          >
            <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleLogout}
            className="p-1 hover:bg-gray-100 rounded-full"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      {/* Settings panel */}
      {isSettingsOpen && panelPos && ReactDOM.createPortal(
        <div
          className="w-64 bg-white rounded-lg shadow-lg p-4 z-50"
          style={{ position: 'fixed', top: panelPos.top, left: panelPos.left }}
        >
          <h3 className="text-lg font-semibold mb-4">User Settings</h3>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
            title="Close"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
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
              Save
            </button>
          </div>
        </div>, document.body
      )}
    </>
  );
}; 