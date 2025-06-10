import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState<'privacy'|'terms'|'faq'|'contact'|null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Ref for drag constraints on sample board
  const sampleBoardRef = useRef<HTMLDivElement>(null);
  // Random rotations for sample notes (±10deg)
  const sampleRotations = useRef<number[]>(Array.from({ length: 5 }, () => Math.random() * 20 - 10));

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
          {/* About and Sample Board */}
          <div className="lg:w-1/2 w-full flex flex-col space-y-4">
            <h3 className="text-xl font-semibold">What is CorkNote?</h3>
            <p className="text-gray-700 text-sm">
              CorkNote provides a corkboard-style interface for managing ideas intuitively, just like sticky notes.
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>Completely free to use – no hidden costs!</li>
              <li>Arrange notes freely with drag and drop</li>
              <li>Organize notes by folder for quick navigation</li>
              <li>Save your favorite layouts manually and load them anytime</li>
            </ul>
            <p className="text-gray-700 text-sm mt-4 italic">Unleash creativity. Visualize your ideas. Make them stick!</p>
            <p className="text-gray-700 text-sm italic">The perfect tool for thinkers, dreamers, and doers.</p>
            <h3 className="text-xl font-semibold mt-4 flex items-baseline">
              Sample Board
              <span className="text-indigo-500 italic text-sm ml-2">Give it a try!</span>
            </h3>
            <div ref={sampleBoardRef} className="relative bg-cork bg-repeat w-full h-64 rounded-lg overflow-hidden shadow-inner">
              <motion.div
                drag
                dragConstraints={sampleBoardRef}
                dragMomentum={false}
                style={{ rotate: sampleRotations.current[0] }}
                className="absolute top-4 left-6 bg-note-yellow w-24 h-24 rounded shadow-lg p-2 text-xs cursor-grab"
              >
                <strong className="block mb-0 truncate whitespace-nowrap text-[10px]">Shopping List</strong>
                <ul className="list-disc list-inside text-[9px] leading-none">
                  <li>Milk</li>
                  <li>Bread</li>
                  <li>Eggs</li>
                  <li>Butter</li>
                  <li>Jam</li>
                </ul>
              </motion.div>
              <motion.div
                drag
                dragConstraints={sampleBoardRef}
                dragMomentum={false}
                style={{ rotate: sampleRotations.current[1] }}
                className="absolute top-16 left-32 bg-note-pink w-24 h-24 rounded shadow-lg p-2 text-xs cursor-grab"
              >
                <strong className="block mb-0 truncate whitespace-nowrap text-[10px]">Project Ideas</strong>
                <ul className="list-disc list-inside text-[9px] leading-none">
                  <li>Blog</li>
                  <li>App</li>
                  <li>UI</li>
                  <li>Demo</li>
                  <li>Test</li>
                </ul>
              </motion.div>
              <motion.div
                drag
                dragConstraints={sampleBoardRef}
                dragMomentum={false}
                style={{ rotate: sampleRotations.current[2] }}
                className="absolute top-32 left-12 bg-note-blue w-24 h-24 rounded shadow-lg p-2 text-xs cursor-grab"
              >
                <strong className="block mb-0 truncate whitespace-nowrap text-[10px]">Tasks</strong>
                <ul className="list-disc list-inside text-[9px] leading-none">
                  <li>Call</li>
                  <li>Email</li>
                  <li>Plan</li>
                  <li>Review</li>
                  <li>Send</li>
                </ul>
              </motion.div>
              <motion.div
                drag
                dragConstraints={sampleBoardRef}
                dragMomentum={false}
                style={{ rotate: sampleRotations.current[3] }}
                className="absolute top-8 left-48 bg-note-green w-24 h-24 rounded shadow-lg p-2 text-xs cursor-grab"
              >
                <strong className="block mb-0 truncate whitespace-nowrap text-[10px]">Notes Summary</strong>
                <ul className="list-disc list-inside text-[9px] leading-none">
                  <li>IdeaA</li>
                  <li>IdeaB</li>
                  <li>IdeaC</li>
                  <li>IdeaD</li>
                  <li>IdeaE</li>
                </ul>
              </motion.div>
              <motion.div
                drag
                dragConstraints={sampleBoardRef}
                dragMomentum={false}
                style={{ rotate: sampleRotations.current[4] }}
                className="absolute top-36 left-40 bg-purple-200 w-24 h-24 rounded shadow-lg p-2 text-xs cursor-grab"
              >
                <strong className="block mb-0 truncate whitespace-nowrap text-[10px]">Reminders</strong>
                <ul className="list-disc list-inside text-[9px] leading-none">
                  <li>Bills</li>
                  <li>Mom</li>
                  <li>Doctor</li>
                  <li>Lunch</li>
                  <li>Email</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-700">
            Corknote is a note-taking app that helps you organize your ideas quickly and neatly.
          </p>
          <div className="space-x-4">
            <button type="button" onClick={() => setOpenModal('privacy')} className="text-blue-500 hover:underline">Privacy Policy</button>
            <button type="button" onClick={() => setOpenModal('terms')} className="text-blue-500 hover:underline">Terms of Service</button>
            <button type="button" onClick={() => setOpenModal('faq')} className="text-blue-500 hover:underline">FAQ</button>
            <button type="button" onClick={() => setOpenModal('contact')} className="text-blue-500 hover:underline">Contact Us</button>
          </div>
        </div>
        <hr className="my-6 border-gray-300" />
        <p className="text-xs text-gray-500 text-center">© 2025 corknote.com. All rights reserved.</p>
      </motion.div>
      {/* Modals */}
      <Modal isOpen={openModal==='privacy'} onClose={() => setOpenModal(null)} title="Privacy Policy">
        <p className="mb-2">Your privacy is important to us. [Add your detailed privacy policy content here.]</p>
      </Modal>
      <Modal isOpen={openModal==='terms'} onClose={() => setOpenModal(null)} title="Terms of Service">
        <p className="mb-2">[Add your terms of service content here.]</p>
      </Modal>
      <Modal isOpen={openModal==='faq'} onClose={() => setOpenModal(null)} title="FAQ">
        <p className="mb-2">[Add your frequently asked questions and answers here.]</p>
      </Modal>
      <Modal isOpen={openModal==='contact'} onClose={() => setOpenModal(null)} title="Contact Us">
        <p className="mb-2">For inquiries, email <a href="mailto:support@corknote.com" className="text-blue-500 hover:underline">support@corknote.com</a>.</p>
      </Modal>
    </div>
  );
};

export default Login; 