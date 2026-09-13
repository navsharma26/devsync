import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { socket } from '../services/socket';
import { authService, roomService } from '../services/api';
import {
  Zap,
  Shield,
  Radio,
  Database,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  LogIn,
  Copy,
  Check,
  Terminal,
  Code2,
  Layers,
  AlertCircle,
  Loader2,
  Share2,
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [serverHealth, setServerHealth] = useState(null);
  const [socketConnected, setSocketConnected] = useState(socket.connected);

  // Room Creation state
  const [creationMode, setCreationMode] = useState('custom'); // 'custom' (default) | 'preset'
  const [createTitle, setCreateTitle] = useState('');
  const [customLanguage, setCustomLanguage] = useState('javascript');
  const [customDescription, setCustomDescription] = useState('');
  const [customCode, setCustomCode] = useState(`// Write candidate starter code or leave empty
function solution() {
  // Your code here
}
`);
  const [customTestInput, setCustomTestInput] = useState('solution()');
  const [customTestOutput, setCustomTestOutput] = useState('true');
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join Room state
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [joinError, setJoinError] = useState('');

  // User's Active Rooms state
  const [myRooms, setMyRooms] = useState([]);
  const [loadingMyRooms, setLoadingMyRooms] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(null);

  useEffect(() => {
    // Check backend health
    const fetchHealth = async () => {
      try {
        const health = await authService.checkHealth();
        setServerHealth(health);
      } catch (err) {
        console.warn('Backend health check error:', err?.message);
        setServerHealth({ status: 'offline' });
      }
    };

    fetchHealth();

    // Socket status listeners
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // Fetch active rooms for logged-in user
  useEffect(() => {
    if (isAuthenticated) {
      const fetchMyRooms = async () => {
        try {
          setLoadingMyRooms(true);
          const data = await roomService.getMyRooms();
          if (data.success && data.rooms) {
            setMyRooms(data.rooms);
          }
        } catch (err) {
          console.warn('Error loading active rooms:', err?.message);
        } finally {
          setLoadingMyRooms(false);
        }
      };

      fetchMyRooms();
    } else {
      setMyRooms([]);
    }
  }, [isAuthenticated]);

  // Handle Instant Create Room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreateError('');
    setIsCreatingRoom(true);

    try {
      let roomPayload = {};

      if (creationMode === 'custom') {
        const testCases = [];
        if (customTestInput.trim() && customTestOutput.trim()) {
          testCases.push({
            input: customTestInput.trim(),
            expectedOutput: customTestOutput.trim(),
            isHidden: false,
          });
        }

        roomPayload = {
          title: createTitle.trim() || 'Custom Interview Challenge',
          problemDescription:
            customDescription.trim() ||
            `### Custom Problem Challenge\n\nWrite your solution according to the requirements and constraints discussed with the interviewer.`,
          code: customCode.trim() || '// Write your solution here...\n',
          language: customLanguage,
          preset: 'custom',
          testCases: testCases.length > 0 ? testCases : undefined,
        };
      } else {
        roomPayload = {
          title: createTitle.trim() || undefined,
          preset: selectedPreset,
        };
      }

      const data = await roomService.createRoom(roomPayload);

      if (data.success && data.roomId) {
        navigate(`/room/${data.roomId}`);
      } else {
        setCreateError(data.message || 'Failed to create room.');
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create room. Please try again.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Handle Join with Room ID
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setJoinError('');

    const cleanId = joinRoomId.trim().toUpperCase();
    if (!cleanId) {
      setJoinError('Please enter a valid 6-digit Room ID.');
      return;
    }

    setIsJoiningRoom(true);
    try {
      const data = await roomService.getRoom(cleanId);
      if (data.success && data.room) {
        navigate(`/room/${cleanId}`);
      } else {
        setJoinError(data.message || `Room "${cleanId}" not found or expired.`);
      }
    } catch (err) {
      setJoinError(err.response?.data?.message || `Room "${cleanId}" not found or expired.`);
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleCopyRoomId = (roomId, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(roomId);
    setCopiedRoomId(roomId);
    setTimeout(() => setCopiedRoomId(null), 2000);
  };

  const calculateHoursRemaining = (createdAt) => {
    if (!createdAt) return '24h';
    const createdTime = new Date(createdAt).getTime();
    const expireTime = createdTime + 24 * 60 * 60 * 1000;
    const diffHours = Math.max(0, Math.round((expireTime - Date.now()) / (1000 * 60 * 60)));
    return `${diffHours}h remaining`;
  };

  return (
    <div className="relative overflow-hidden pt-8 pb-20">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-12">
        {/* System Status Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center space-x-3 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-md">
            <span className="flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  serverHealth?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="font-medium text-slate-200">
                API: {serverHealth?.status === 'healthy' ? 'Online' : 'Checking...'}
              </span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center space-x-1.5">
              <Radio
                className={`w-3.5 h-3.5 ${
                  socketConnected ? 'text-indigo-400 animate-pulse' : 'text-slate-500'
                }`}
              />
              <span className="font-medium text-slate-200">
                Socket: {socketConnected ? 'Connected' : 'Syncing'}
              </span>
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Technical Mock Interview & Live Collaboration Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold font-['Outfit'] tracking-tight text-white leading-tight">
            Conduct Real-Time{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Technical Interviews
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            1-on-1 WebRTC video calling, custom problem authoring, Monaco editor sync, hidden test verification, anti-cheat detection, and automated PDF scorecard.
          </p>

          {/* Quick Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-300">
            <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center space-x-1.5">
              <span>📹</span>
              <span>1-on-1 Video & Audio</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center space-x-1.5">
              <span>✍️</span>
              <span>Custom Challenges</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center space-x-1.5">
              <span>🧪</span>
              <span>Hidden Test Engine</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center space-x-1.5">
              <span>🛡️</span>
              <span>Anti-Cheat Burst Guard</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center space-x-1.5">
              <span>📑</span>
              <span>PDF Scorecard</span>
            </span>
          </div>
        </div>

        {/* Core Room Management Dashboard Card */}
        <div id="interview-card" className="max-w-4xl mx-auto glass-card rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* Left: Host Mock Interview */}
            <div className="space-y-5 pb-6 md:pb-0 md:pr-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold font-['Outfit'] text-white">
                      Host Mock Interview
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Host Mode
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Author a custom coding problem or select a template with video & evaluation suite.
                </p>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateRoom} className="space-y-3.5">
                {/* Creation Mode Toggle: Custom Problem (Default) vs Preset */}
                <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setCreationMode('custom')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      creationMode === 'custom'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Write Custom Question
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('preset')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      creationMode === 'preset'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Use Template
                  </button>
                </div>

                {creationMode === 'custom' ? (
                  /* Custom Question Fields (User writes own question) */
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300 block">
                        Problem Title / Challenge Name
                      </label>
                      <input
                        id="create-room-title-input"
                        type="text"
                        placeholder="e.g. Find Longest Palindromic Substring"
                        value={createTitle}
                        onChange={(e) => setCreateTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300 block">
                        Default Language
                      </label>
                      <select
                        value={customLanguage}
                        onChange={(e) => setCustomLanguage(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                      >
                        <option value="javascript">JavaScript (Node 18)</option>
                        <option value="python">Python (3.10)</option>
                        <option value="cpp">C++ (GCC 10)</option>
                        <option value="java">Java (OpenJDK 15)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300 block">
                        Problem Description & Constraints
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Write your custom interview problem description, examples, and constraints here..."
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none font-sans leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300 block">
                        Starter Code (Candidate Initial Template)
                      </label>
                      <textarea
                        rows={3}
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  /* Preset Selection (Optional templates) */
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300 block">Workspace Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Frontend Live Interview"
                        value={createTitle}
                        onChange={(e) => setCreateTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300 block">Template Preset</label>
                      <select
                        id="create-room-preset-select"
                        value={selectedPreset}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                      >
                        <option value="custom">Blank Workspace</option>
                        <option value="two-sum">Two Sum (Array & Hash Map)</option>
                        <option value="valid-palindrome">Valid Palindrome (Two Pointers)</option>
                        <option value="reverse-linked-list">Reverse Linked List (Pointers)</option>
                        <option value="valid-parentheses">Valid Parentheses (Stack)</option>
                        <option value="best-time-to-buy-and-sell-stock">Best Time to Buy & Sell Stock</option>
                        <option value="binary-search">Binary Search (O(log n))</option>
                        <option value="maximum-subarray">Maximum Subarray (Kadane)</option>
                        <option value="container-with-most-water">Container With Most Water</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  id="create-room-submit-btn"
                  type="submit"
                  disabled={isCreatingRoom}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isCreatingRoom ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Allocating Room...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      <span>Launch Interview Session</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right: Join Interview as Candidate / Peer */}
            <div className="space-y-5 pt-6 md:pt-0 md:pl-8 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold font-['Outfit'] text-white">
                    Join Interview as Candidate
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Enter the 6-character room code provided by your interviewer.
                </p>
              </div>

              {joinError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{joinError}</span>
                </div>
              )}

              <form onSubmit={handleJoinRoom} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300 block">6-Digit Room ID</label>
                  <input
                    id="join-room-id-input"
                    type="text"
                    maxLength={10}
                    placeholder="e.g. 5P8ALS"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono uppercase tracking-widest text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>

                <button
                  id="join-room-submit-btn"
                  type="submit"
                  disabled={isJoiningRoom}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isJoiningRoom ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Interview Room</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>MongoDB TTL Persistence</span>
                </div>
                <p>Rooms automatically expire 24 hours after creation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Guide: How Live Interviews Work in DevSync */}
        <div className="max-w-4xl mx-auto glass-card rounded-2xl border border-slate-800/80 p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold font-['Outfit'] text-white uppercase tracking-wider">
              Where to find Interview Options inside a Room:
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
                <span className="text-base">📹</span>
                <span>Video & Audio Call</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Click the <strong className="text-white">"Video"</strong> button in the top right bar of the workspace to start 1-on-1 WebRTC video calling.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center space-x-2 text-purple-300 font-semibold">
                <span className="text-base">🧪</span>
                <span>Submit Solution</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Click <strong className="text-white">"Submit Solution"</strong> to run candidate code against public & hidden test suites.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center space-x-2 text-rose-300 font-semibold">
                <span className="text-base">🛡️</span>
                <span>Anti-Cheat Guard</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                The <strong className="text-white">"Integrity"</strong> button alerts host when a burst copy-paste (&gt;50 chars in &lt;50ms) is detected.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center space-x-2 text-amber-300 font-semibold">
                <span className="text-base">🏆</span>
                <span>End & Rate Scorecard</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Host can click the golden <strong className="text-white">"End & Rate"</strong> button to grade candidates & download PDF report.
              </p>
            </div>
          </div>
        </div>

        {/* User's Previously Created Active Rooms Section (if logged in) */}
        {isAuthenticated && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-['Outfit'] text-white flex items-center space-x-2">
                  <Code2 className="w-5 h-5 text-indigo-400" />
                  <span>Your Active Workspaces</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Persistent rooms you created that are currently active in the 24-hour TTL cycle.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                {myRooms.length} Active {myRooms.length === 1 ? 'Room' : 'Rooms'}
              </span>
            </div>

            {loadingMyRooms ? (
              <div className="p-8 glass-card rounded-2xl border border-slate-800 text-center">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Fetching your active rooms...</p>
              </div>
            ) : myRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myRooms.map((room) => (
                  <div
                    key={room.roomId}
                    onClick={() => navigate(`/room/${room.roomId}`)}
                    className="p-5 glass-card rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        #{room.roomId}
                      </span>
                      <span className="text-[11px] text-amber-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{calculateHoursRemaining(room.createdAt)}</span>
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white mt-3 group-hover:text-indigo-200 transition-colors truncate">
                      {room.title}
                    </h4>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {room.problemDescription}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 capitalize">{room.language}</span>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => handleCopyRoomId(room.roomId, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Copy Room ID"
                        >
                          {copiedRoomId === room.roomId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                          <span>Enter</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 glass-card rounded-2xl border border-slate-800 text-center space-y-2">
                <p className="text-sm text-slate-300 font-medium">No active workspaces found</p>
                <p className="text-xs text-slate-400">
                  Use the "Instant Create Room" tool above to launch your first session.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Core Architecture Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800/80 relative group hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white font-['Outfit']">
              Production JWT Auth
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Token signing, bcryptjs salted passwords, Bearer authentication headers, and automatic token persistence in localStorage.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-xs text-indigo-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>POST /login & /register</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800/80 relative group hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white font-['Outfit']">
              Socket.io Realtime Layer
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Low-latency WebSockets with fallback polling, live connection metrics, and real-time state synchronization primitives.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-xs text-cyan-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Full duplex event transport</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800/80 relative group hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white font-['Outfit']">
              Mongoose TTL Rooms
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              6-digit unique room IDs, 24-hour automatic TTL expiration index, problem preset templates, and live editing endpoints.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>POST /create, GET /:id, PUT /problem</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
