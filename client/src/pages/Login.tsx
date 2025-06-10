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
  const [resetMessage, setResetMessage] = useState('');
  const { login, resetPassword } = useAuth();
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

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address above.');
      return;
    }
    try {
      setError('');
      await resetPassword(email);
      setResetMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError('Failed to send reset email.');
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
              {/* Password reset */}
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-blue-500 hover:underline text-sm"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
            {resetMessage && <div className="text-green-600 text-sm mt-2">{resetMessage}</div>}
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
        <div className="space-y-4 text-left text-sm text-gray-700">
          <p>Corknote ("we", "us", "our") values your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your information.</p>
          <h4 className="font-semibold">1. Information We Collect</h4>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Account Information:</strong> Email address and password when you register.</li>
            <li><strong>Usage Data:</strong> Actions you take within the app for analytics and improvements.</li>
          </ul>
          <h4 className="font-semibold">2. How We Use Your Information</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>To provide and maintain our service.</li>
            <li>To communicate updates, news, and support.</li>
          </ul>
          <h4 className="font-semibold">3. Cookies and Tracking</h4>
          <p>We use cookies and similar technologies to enhance your experience. You can disable cookies in your browser settings.</p>
          <h4 className="font-semibold">4. Data Security</h4>
          <p>We implement reasonable security measures, but no system can be 100% secure.</p>
          <h4 className="font-semibold">5. Changes to This Policy</h4>
          <p>We may update this policy and will notify you of significant changes.</p>
          <h4 className="font-semibold">6. Contact Us</h4>
          <p>For any questions, email us at <a href="mailto:support@corknote.com" className="text-blue-500 hover:underline">support@corknote.com</a>.</p>
        </div>
      </Modal>
      <Modal isOpen={openModal==='terms'} onClose={() => setOpenModal(null)} title="Terms of Service">
        <div className="space-y-4 text-left text-sm text-gray-700">
          <p><strong>Last updated:</strong> [Date]</p>
          <p>Welcome to Corknote. By accessing or using our service, you agree to these Terms of Service ("Terms"). Please read them carefully.</p>
          <h4 className="font-semibold">1. Use of Service</h4>
          <p>You agree to use the service only for lawful and authorized purposes.</p>
          <h4 className="font-semibold">2. Account Responsibilities</h4>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          <h4 className="font-semibold">3. Prohibited Conduct</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Violating any applicable laws or regulations.</li>
            <li>Uploading harmful, deceptive, or illegal content.</li>
            <li>Interfering with the operation of the service or its security.</li>
          </ul>
          <h4 className="font-semibold">4. Intellectual Property</h4>
          <p>All content, trademarks, and data on Corknote are the property of Corknote or its licensors and are protected by intellectual property laws.</p>
          <h4 className="font-semibold">5. Disclaimer of Warranties</h4>
          <p>The service is provided on an "as is" and "as available" basis without warranties of any kind, express or implied.</p>
          <h4 className="font-semibold">6. Limitation of Liability</h4>
          <p>To the maximum extent permitted by law, Corknote will not be liable for indirect, incidental, special, or consequential damages.</p>
          <h4 className="font-semibold">7. Changes to Terms</h4>
          <p>We may modify these Terms at any time. We will notify you of significant changes, and continued use constitutes acceptance.</p>
          <h4 className="font-semibold">8. Governing Law</h4>
          <p>These Terms are governed by the laws of [Your Jurisdiction].</p>
          <h4 className="font-semibold">9. Contact Us</h4>
          <p>For questions about these Terms, email us at <a href="mailto:support@corknote.com" className="text-blue-500 hover:underline">support@corknote.com</a>.</p>
        </div>
      </Modal>
      <Modal isOpen={openModal==='faq'} onClose={() => setOpenModal(null)} title="FAQ">
        <div className="space-y-4 text-left text-sm text-gray-700">
          <h4 className="font-semibold">How do I reset my password?</h4>
          <p>You can reset your password by clicking "Forgot password?" on the login screen and following the instructions sent to your email.</p>
          <h4 className="font-semibold">How do I create an account?</h4>
          <p>Click the "Sign up" link on the login page and fill out the registration form with a valid email and password.</p>
          <h4 className="font-semibold">Is Corknote free to use?</h4>
          <p>Yes, Corknote is completely free with no hidden costs or premium plans.</p>
          <h4 className="font-semibold">How do I save and organize my notes?</h4>
          <p>You can create folders to organize your notes, drag and drop sticky notes on the board, and save your layout manually.</p>
          <h4 className="font-semibold">Can I use Corknote offline?</h4>
          <p>Corknote currently requires an internet connection to sync your data securely. Offline support may be added in the future.</p>
        </div>
      </Modal>
      <Modal isOpen={openModal==='contact'} onClose={() => setOpenModal(null)} title="Contact Us">
        <form action="https://formspree.io/f/xvgrkneq" method="POST" className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" name="name" id="name" required className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" id="email" required className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
            <textarea name="message" id="message" rows={4} required className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors">Send Message</button>
        </form>
        {/* Replace YOUR_FORM_ID with your actual Formspree form ID */}
      </Modal>
    </div>
  );
};

export default Login; 