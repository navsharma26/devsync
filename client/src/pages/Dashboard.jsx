import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../services/socket';
import { authService } from '../services/api';
import {
  User,
  Mail,
  Key,
  Calendar,
  Radio,
  Copy,
  Check,
  Zap,
  Activity,
  LogOut,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [pingLatency, setPingLatency] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const [socketId, setSocketId] = useState(socket.id || null);
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [serverStats, setServerStats] = useState(null);

  useEffect(() => {
    // Socket listener setup
    const onConnect = () => {
      setSocketConnected(true);
      setSocketId(socket.id);
    };

    const onDisconnect = () => {
      setSocketConnected(false);
      setSocketId(null);
    };

    const onPong = (data) => {
      if (data.clientData?.sendTime) {
        const rtt = Date.now() - data.clientData.sendTime;
        setPingLatency(rtt);
        setIsPinging(false);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('devsync:pong', onPong);

    // Initial server stats
    authService.checkHealth().then(setServerStats).catch(console.error);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('devsync:pong', onPong);
    };
  }, []);

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestPing = () => {
    if (!socket.connected) return;
    setIsPinging(true);
    socket.emit('devsync:ping', {
      sendTime: Date.now(),
      user: user?.name,
    });
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Just now';
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-3xl border border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            {user?.name?.[0]?.toUpperCase() || 'D'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold font-['Outfit'] text-white">
                Welcome, {user?.name || 'Developer'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Verified JWT</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Authenticated workspace session active in DevSync.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="dashboard-logout-btn"
            onClick={logout}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-sm font-medium border border-rose-500/20 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold font-['Outfit'] text-white flex items-center space-x-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span>User Profile Details</span>
            </h2>
          </div>

          <div className="space-y-4 text-sm">
            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Display Name</span>
              <p className="text-slate-200 font-semibold">{user?.name}</p>
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Email Address</span>
              <p className="text-slate-200 font-semibold truncate">{user?.email}</p>
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">MongoDB ID</span>
              <p className="text-slate-400 font-mono text-xs truncate">{user?._id || 'N/A'}</p>
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Member Since</span>
              <p className="text-slate-300 text-xs flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDate(user?.createdAt)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Socket.io Sync Diagnostic Card */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold font-['Outfit'] text-white flex items-center space-x-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Realtime Socket Engine</span>
            </h2>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                socketConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {socketConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Socket Identifier</span>
                <span className="font-mono text-cyan-400">{socketId || 'Pending...'}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Transport</span>
                <span className="text-slate-200">WebSocket / Polling</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Round-Trip Latency</span>
                <span className="font-semibold text-emerald-400">
                  {pingLatency !== null ? `${pingLatency} ms` : '--'}
                </span>
              </div>
            </div>

            <button
              id="ping-test-btn"
              onClick={handleTestPing}
              disabled={isPinging || !socketConnected}
              className="w-full py-3 px-4 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-sm font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Measuring Latency...' : 'Send Realtime Ping'}</span>
            </button>
          </div>
        </div>

        {/* Active JWT Token & Security Card */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold font-['Outfit'] text-white flex items-center space-x-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Session Bearer Token</span>
            </h2>
            <button
              id="copy-token-btn"
              onClick={handleCopyToken}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Token</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              This cryptographically signed JWT is stored in <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">localStorage</code> and attached to headers.
            </p>

            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-400 break-all max-h-32 overflow-y-auto">
              {token || 'No active token'}
            </div>

            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Algorithm</span>
                <span className="font-mono text-slate-300">HS256 (HMAC-SHA256)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Token Duration</span>
                <span className="text-slate-300">7 Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
