import React from 'react';
import { Link } from 'react-router-dom';

const Thanks: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
      <p className="text-gray-700 mb-6">Your message has been sent. We'll get back to you soon.</p>
      <Link to="/" className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Back to Home
      </Link>
    </div>
  </div>
);

export default Thanks; 