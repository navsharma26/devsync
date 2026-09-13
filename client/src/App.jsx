import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoomPage from './pages/RoomPage';
import { Zap, Heart, Terminal } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Global Navbar */}
      <Navbar />

      {/* Global Auth Modal for instant Login/Register anywhere */}
      <AuthModal />

      {/* Main Content Area */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F19] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">DevSync</span>
            <span>— Production-ready MERN Foundation</span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <span>Port:</span>
              <code className="text-indigo-400">5000/5002</code>
            </span>
            <span className="flex items-center space-x-1">
              <span>Client:</span>
              <code className="text-cyan-400">5173</code>
            </span>
            <span>MongoDB + Socket.io + JWT</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
