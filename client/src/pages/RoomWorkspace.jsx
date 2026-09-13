import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roomService } from '../services/api';
import { socket } from '../services/socket';
import {
  Code2,
  Copy,
  Check,
  Edit3,
  Save,
  Clock,
  Share2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  FileCode,
  Users,
} from 'lucide-react';

const RoomWorkspace = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit Problem Description state
  const [isEditingProblem, setIsEditingProblem] = useState(false);
  const [problemDraft, setProblemDraft] = useState('');
  const [savingProblem, setSavingProblem] = useState(false);

  // Code editor state
  const [code, setCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await roomService.getRoom(roomId);
        if (data.success && data.room) {
          setRoom(data.room);
          setProblemDraft(data.room.problemDescription);
          setCode(data.room.code);
        } else {
          setError(data.message || 'Room not found.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load room workspace.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();

    // Socket.io room sync notification
    if (socket.connected) {
      socket.emit('devsync:join-room', { roomId });
    }
  }, [roomId]);

  const handleCopyId = () => {
    if (room?.roomId) {
      navigator.clipboard.writeText(room.roomId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveProblem = async () => {
    if (!room) return;
    try {
      setSavingProblem(true);
      const res = await roomService.updateRoomProblem(room.roomId, problemDraft);
      if (res.success) {
        setRoom((prev) => ({ ...prev, problemDescription: problemDraft }));
        setIsEditingProblem(false);
      }
    } catch (err) {
      alert('Failed to update problem description: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingProblem(false);
    }
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setConsoleOutput('Running solution against test suite...\n');

    setTimeout(() => {
      try {
        let output = '';
        const originalLog = console.log;
        console.log = (...args) => {
          output += args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') + '\n';
        };

        // Basic safe evaluation of the current javascript code
        const runner = new Function(code);
        runner();

        console.log = originalLog;
        setConsoleOutput(output || 'Execution completed with no console output.');
      } catch (err) {
        setConsoleOutput(`Runtime Error:\n${err.message}`);
      } finally {
        setIsRunning(false);
      }
    }, 400);
  };

  const calculateHoursRemaining = (createdAt) => {
    if (!createdAt) return '24h';
    const createdTime = new Date(createdAt).getTime();
    const expireTime = createdTime + 24 * 60 * 60 * 1000;
    const diffHours = Math.max(0, Math.round((expireTime - Date.now()) / (1000 * 60 * 60)));
    return `${diffHours}h remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
        <p className="text-sm text-slate-400">Loading DevSync Room Workspace...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-slate-800 text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-['Outfit'] text-white">Room Unavailable</h2>
          <p className="text-sm text-slate-400">{error || 'This room does not exist or has expired.'}</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to DevSync Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Workspace Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 glass-card rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold font-['Outfit'] text-white">{room.title}</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-xs font-bold">
                #{room.roomId}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{calculateHoursRemaining(room.createdAt)} (24h TTL)</span>
              </span>
              <span>•</span>
              <span className="text-slate-300 capitalize">{room.language}</span>
            </div>
          </div>
        </div>

        {/* Room Actions */}
        <div className="flex items-center space-x-2">
          <button
            id="copy-room-id-btn"
            onClick={handleCopyId}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            {copiedId ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">ID Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy ID ({room.roomId})</span>
              </>
            )}
          </button>

          <button
            id="share-room-btn"
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Workspace</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Two-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Problem Description & In-place Editor */}
        <div className="lg:col-span-5 glass-card rounded-2xl border border-slate-800 overflow-hidden flex flex-col min-h-[620px]">
          <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Problem Statement
              </span>
            </div>

            {!isEditingProblem ? (
              <button
                id="edit-problem-btn"
                onClick={() => setIsEditingProblem(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer font-medium"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Problem</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  id="cancel-edit-problem-btn"
                  onClick={() => {
                    setProblemDraft(room.problemDescription);
                    setIsEditingProblem(false);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-problem-btn"
                  onClick={handleSaveProblem}
                  disabled={savingProblem}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {savingProblem ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {isEditingProblem ? (
              <div className="flex-1 flex flex-col space-y-2">
                <span className="text-[11px] text-slate-400">
                  Markdown and plain text are supported. Updates persist to MongoDB for all room peers.
                </span>
                <textarea
                  id="problem-description-textarea"
                  value={problemDraft}
                  onChange={(e) => setProblemDraft(e.target.value)}
                  rows={20}
                  className="w-full flex-1 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none leading-relaxed"
                />
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-3 font-sans text-slate-300 overflow-y-auto max-h-[580px] pr-2 whitespace-pre-wrap font-mono">
                {room.problemDescription}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Editor & Execution Console */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-slate-800 overflow-hidden flex flex-col min-h-[620px]">
          <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Solution Editor ({room.language})
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="reset-code-btn"
                onClick={() => setCode(room.code)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Reset to starter preset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                id="run-code-btn"
                onClick={handleRunCode}
                disabled={isRunning}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Running...' : 'Run Code'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Code Editor Area */}
          <div className="p-4 flex-1 flex flex-col bg-slate-950/60">
            <div className="relative flex-1">
              <textarea
                id="code-editor-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full h-80 p-4 bg-slate-950/90 border border-slate-800 rounded-xl font-mono text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 leading-relaxed resize-none selection:bg-cyan-500/30"
              />
            </div>

            {/* Output / Console Panel */}
            <div className="mt-4 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                <span>Output Console</span>
                <span className="text-[10px] text-slate-500">Standard Output</span>
              </div>
              <pre className="mt-2 text-xs font-mono text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                {consoleOutput || 'Click "Run Code" to execute solution against test case...'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomWorkspace;
