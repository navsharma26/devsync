import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../services/socket';
import { roomService, executeService } from '../services/api';
import { generateCandidateReport } from '../utils/pdfReport';
import VideoCall from '../components/VideoCall';
import {
  Video,
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
  ChevronLeft,
  ChevronRight,
  Terminal,
  Maximize2,
  Minimize2,
  Trash2,
  CheckCircle2,
  XCircle,
  Download,
  MessageSquare,
  Send,
  X,
  Cloud,
  Award,
  Star,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Unlock,
  Activity,
  FileText,
  CheckCircle,
} from 'lucide-react';

// Language starter templates
const LANGUAGE_DEFAULTS = {
  javascript: `// JavaScript (Node.js 18+) Solution
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

console.log("Result:", twoSum([2, 7, 11, 15], 9));
`,
  python: `# Python 3.10+ Solution
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

print("Result:", two_sum([2, 7, 11, 15], 9))
`,
  cpp: `// C++ (GCC 10+) Solution
#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (map.find(complement) != map.end()) {
            return {map[complement], i};
        }
        map[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    vector<int> res = twoSum(nums, 9);
    cout << "Result: [" << res[0] << ", " << res[1] << "]" << endl;
    return 0;
}
`,
  java: `// Java (OpenJDK 15+) Solution
import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }

    public static void main(String[] args) {
        int[] result = twoSum(new int[] {2, 7, 11, 15}, 9);
        System.out.println("Result: " + Arrays.toString(result));
    }
}
`,
};

// Monaco language identifiers mapping
const MONACO_LANGUAGE_MAP = {
  javascript: 'javascript',
  python: 'python',
  cpp: 'cpp',
  java: 'java',
};

// File extension mapping for export
const FILE_EXTENSIONS = {
  javascript: '.js',
  python: '.py',
  cpp: '.cpp',
  java: '.java',
};

// Rating labels helper
const RATING_LABELS = {
  1: 'Needs Significant Improvement',
  2: 'Fair / Below Expectations',
  3: 'Proficient / Meets Bar',
  4: 'Strong / Exceeds Bar',
  5: 'Exceptional / Mastery',
};

const RoomPage = () => {
  const { roomId } = useParams();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editor states
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [activeUsers, setActiveUsers] = useState([]);
  const [usersDropdownOpen, setUsersDropdownOpen] = useState(false);

  // Layout states
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isEditingProblem, setIsEditingProblem] = useState(false);
  const [problemDraft, setProblemDraft] = useState('');
  const [savingProblem, setSavingProblem] = useState(false);

  // In-Room Chat Drawer states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatBottomRef = useRef(null);

  // WebRTC 1-on-1 Video/Audio Call state
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);

  // Auto-Save states (5-second debounce)
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const autoSaveTimerRef = useRef(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');

  // Execution & Terminal Console states
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState('terminal'); // 'terminal' | 'tests'

  // Feature 1: Hidden Test-Case Verification Engine states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testReport, setTestReport] = useState(null);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);
  const [isInterviewerMode, setIsInterviewerMode] = useState(true);

  // Feature 2: Interview Scorecard & Automated PDF Report states
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [problemSolvingRating, setProblemSolvingRating] = useState(4);
  const [codeQualityRating, setCodeQualityRating] = useState(4);
  const [communicationRating, setCommunicationRating] = useState(4);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  // Feature 3: Anti-Cheat & Integrity Timeline states
  const [integrityAlerts, setIntegrityAlerts] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [isTimelineDrawerOpen, setIsTimelineDrawerOpen] = useState(false);

  const hasStartedTyping = useRef(false);
  const lastChangeTimeRef = useRef(Date.now());
  const isPasteEventRef = useRef(false);

  // Flag to prevent infinite broadcast loops when receiving code from peers
  const isRemoteUpdate = useRef(false);
  const editorRef = useRef(null);

  // Trigger toast helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Host verification: User created room or creator is null (guest created)
  const isRoomHost = Boolean(
    !room?.createdBy ||
      (user && room?.createdBy && (user._id === room.createdBy._id || user._id === room.createdBy))
  );

  // Helper for timeline formatted timestamp: [HH:MM:SS]
  const formatTimelineTime = (isoString) => {
    if (!isoString) return new Date().toLocaleTimeString();
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (isChatOpen && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Clear unread count when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  // 1. Initial Room Fetch
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await roomService.getRoom(roomId);
        if (data.success && data.room) {
          setRoom(data.room);
          setCode(data.room.code || LANGUAGE_DEFAULTS.javascript);
          setLanguage(data.room.language || 'javascript');
          setProblemDraft(data.room.problemDescription);
          setSaveStatus('saved');

          // Initialize saved feedback if exists
          if (data.room.feedback) {
            setProblemSolvingRating(data.room.feedback.problemSolvingRating || 4);
            setCodeQualityRating(data.room.feedback.codeQualityRating || 4);
            setCommunicationRating(data.room.feedback.communicationRating || 4);
            setFeedbackNotes(data.room.feedback.feedbackNotes || '');
          }
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
  }, [roomId]);

  // 2. Real-Time Socket Lifecycle
  useEffect(() => {
    if (!roomId) return;

    const username = user?.name || `Dev-${Math.floor(1000 + Math.random() * 9000)}`;

    const emitJoin = () => {
      socket.emit('join-room', {
        roomId,
        username,
        isHost: isRoomHost,
      });

      // Register host channel if host
      if (isRoomHost || isInterviewerMode) {
        socket.emit('register-host', { roomId });
      }
    };

    if (socket.connected) {
      emitJoin();
    } else {
      socket.on('connect', emitJoin);
    }

    // Handle code update from peers
    const handleCodeUpdate = (newCode) => {
      isRemoteUpdate.current = true;
      setCode(newCode);
      setSaveStatus('saved');
    };

    // Handle language change from peers
    const handleLanguageUpdate = (newLang) => {
      if (MONACO_LANGUAGE_MAP[newLang]) {
        setLanguage(newLang);
        showToast(`Peer switched language to ${newLang.toUpperCase()}`);
      }
    };

    // Handle updated active user roster
    const handleRoomUsers = ({ users, actionUser, action }) => {
      setActiveUsers(users || []);
      if (actionUser && actionUser !== username) {
        showToast(`${actionUser} ${action} the session`);
      }
    };

    // Handle incoming chat message
    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!isChatOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    // Handle incoming integrity alert (Exclusive Host Broadcast)
    const handleIntegrityAlert = (alert) => {
      setIntegrityAlerts((prev) => [alert, ...prev]);
      setTimelineEvents((prev) => [
        {
          id: alert.id,
          text: alert.message || `⚠️ Alert: ${alert.charCount} characters pasted in a single keystroke.`,
          type: 'ALERT',
          charCount: alert.charCount,
          timestamp: alert.timestamp,
          user: alert.user,
          snippet: alert.snippet,
        },
        ...prev,
      ]);
      showToast(`⚠️ Integrity Alert: ${alert.charCount} chars pasted!`);
    };

    // Handle incoming general timeline event
    const handleTimelineEvent = (event) => {
      setTimelineEvents((prev) => {
        // Avoid duplicate events
        if (prev.some((e) => e.id === event.id)) return prev;
        return [event, ...prev];
      });
    };

    // Handle incoming live problem statement updates from host
    const handleProblemUpdate = ({ problemDescription, title, testCases }) => {
      setRoom((prev) => ({
        ...prev,
        ...(problemDescription !== undefined ? { problemDescription } : {}),
        ...(title ? { title } : {}),
        ...(Array.isArray(testCases) ? { testCases } : {}),
      }));
      if (problemDescription !== undefined) {
        setProblemDraft(problemDescription);
      }
      showToast('Interviewer updated problem statement');
    };

    socket.on('code-update', handleCodeUpdate);
    socket.on('language-update', handleLanguageUpdate);
    socket.on('room-users', handleRoomUsers);
    socket.on('receive-message', handleReceiveMessage);
    socket.on('integrity-alert', handleIntegrityAlert);
    socket.on('timeline-event', handleTimelineEvent);
    socket.on('problem-update', handleProblemUpdate);

    return () => {
      socket.off('connect', emitJoin);
      socket.off('code-update', handleCodeUpdate);
      socket.off('language-update', handleLanguageUpdate);
      socket.off('room-users', handleRoomUsers);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('integrity-alert', handleIntegrityAlert);
      socket.off('timeline-event', handleTimelineEvent);
      socket.off('problem-update', handleProblemUpdate);
    };
  }, [roomId, user?.name, isChatOpen, isRoomHost, isInterviewerMode]);

  // 3. Debounced Auto-Save to MongoDB (5 seconds after typing stops)
  const triggerAutoSave = useCallback(
    (newCode, currentLanguage) => {
      if (!roomId) return;

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      setSaveStatus('unsaved');

      autoSaveTimerRef.current = setTimeout(async () => {
        try {
          setSaveStatus('saving');
          await roomService.updateRoomCode(roomId, {
            code: newCode,
            language: currentLanguage,
          });
          setSaveStatus('saved');
        } catch (err) {
          console.error('[Auto-save error]:', err?.message);
          setSaveStatus('unsaved');
        }
      }, 5000);
    },
    [roomId]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // 4. Remote Code Execution Handler (Run Code)
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setActiveConsoleTab('terminal');
    setExecutionResult({
      status: 'running',
      stdout: '',
      stderr: '',
      executionTime: null,
      memoryUsage: null,
    });

    try {
      const result = await executeService.runCode({
        code,
        language,
      });

      setExecutionResult({
        status: result.success ? 'success' : 'error',
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        executionTime: result.executionTime,
        memoryUsage: result.memoryUsage,
        language: result.language,
        version: result.version,
        engine: result.engine,
      });

      if (result.success) {
        showToast(`Execution completed in ${result.executionTime}ms`);
      } else {
        showToast('Execution finished with errors');
      }
    } catch (err) {
      const isRateLimit = err.response?.status === 429;
      const errorMsg = isRateLimit
        ? 'Rate limit exceeded: Maximum 15 executions per minute allowed. Please wait a moment.'
        : err.response?.data?.message || err.message || 'Execution error occurred.';

      setExecutionResult({
        status: 'error',
        stdout: '',
        stderr: errorMsg,
        executionTime: null,
        memoryUsage: null,
        isRateLimit,
      });
      showToast(isRateLimit ? 'Rate limit reached (15/min)' : 'Execution failed');
    } finally {
      setIsRunning(false);
    }
  }, [code, language, isRunning]);

  // 5. Feature 1: Submit Solution Handler (Test Case Verification Engine)
  const handleSubmitSolution = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setActiveConsoleTab('tests');

    try {
      const report = await roomService.submitSolution(roomId, {
        code,
        language,
        isInterviewer: isInterviewerMode,
      });

      if (report.success) {
        setTestReport(report);
        setSelectedTestCaseIdx(0);

        // Emit timeline event
        const submitText = report.allPassed
          ? 'Solution submitted (All test cases passed).'
          : `Solution submitted (${report.passRatio} test cases passed).`;

        const timelinePayload = {
          id: `tl_sub_${Date.now()}`,
          roomId,
          text: submitText,
          type: 'SUBMISSION',
          timestamp: new Date().toISOString(),
          user: user?.name || 'Candidate',
        };

        socket.emit('timeline-event', timelinePayload);
        setTimelineEvents((prev) => [timelinePayload, ...prev]);

        if (report.allPassed) {
          showToast(`🎉 Verification Passed! All ${report.totalTests} tests passed!`);
        } else {
          showToast(`Verification complete: ${report.passRatio} passed`);
        }
      } else {
        showToast(report.message || 'Test case verification failed.');
      }
    } catch (err) {
      console.error('[Submit Solution Error]:', err);
      showToast(err.response?.data?.message || 'Error executing test suite verification.');
    } finally {
      setIsSubmitting(false);
    }
  }, [code, language, isInterviewerMode, roomId, isSubmitting, user?.name]);

  // 6. Keyboard Shortcut Listener (Cmd/Ctrl + Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunCode]);

  // Handle local code editing in Monaco
  const handleEditorChange = (newVal) => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const updatedCode = newVal ?? '';
    setCode(updatedCode);

    // Broadcast only on explicit local typing
    socket.emit('code-change', {
      roomId,
      code: updatedCode,
    });

    // Trigger 5-second debounced auto-save
    triggerAutoSave(updatedCode, language);
  };

  // Handle language switch
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);

    socket.emit('language-change', {
      roomId,
      language: newLang,
    });

    let currentCodeToSave = code;
    if (!code.trim() || Object.values(LANGUAGE_DEFAULTS).some((tmpl) => tmpl.trim() === code.trim())) {
      const template = LANGUAGE_DEFAULTS[newLang] || '// Write your solution here...';
      setCode(template);
      currentCodeToSave = template;
      socket.emit('code-change', {
        roomId,
        code: template,
      });
    }

    triggerAutoSave(currentCodeToSave, newLang);
    showToast(`Language switched to ${newLang.toUpperCase()}`);
  };

  // 7. Code Export: Download local file
  const handleDownloadCode = () => {
    if (!code) return;

    const extension = FILE_EXTENSIONS[language] || '.txt';
    const cleanTitle = (room?.title || 'solution')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    const filename = `${cleanTitle}${extension}`;

    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Downloaded ${filename}`);
  };

  // 8. Feature 2: Save Feedback Scorecard
  const handleSaveEvaluation = async () => {
    try {
      setIsSavingFeedback(true);
      const res = await roomService.saveFeedback(roomId, {
        problemSolvingRating,
        codeQualityRating,
        communicationRating,
        feedbackNotes,
      });

      if (res.success) {
        setRoom((prev) => ({ ...prev, feedback: res.feedback }));
        showToast('Evaluation scorecard saved successfully!');
      } else {
        showToast('Failed to save evaluation.');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving interview scorecard.');
    } finally {
      setIsSavingFeedback(false);
    }
  };

  // 9. Feature 2: Automated PDF Report Generator
  const handleDownloadPdfReport = () => {
    try {
      const candidatePeer = activeUsers.find((u) => u.username !== (user?.name || 'You (Host)'));
      const candidateName = candidatePeer?.username || 'Candidate Developer';
      const interviewerName = user?.name || 'DevSync Interviewer Host';

      const pdfFilename = generateCandidateReport({
        roomId: room?.roomId || roomId,
        problemTitle: room?.title || 'Algorithm Challenge',
        candidateName,
        interviewerName,
        sessionDate: new Date(room?.createdAt || Date.now()).toLocaleDateString(),
        problemSolvingRating,
        codeQualityRating,
        communicationRating,
        feedbackNotes,
        passRatio: testReport?.passRatio || (room?.feedback ? '3/3 Passed' : 'Verified'),
        testResults: testReport?.results || [],
        code,
        language,
      });

      showToast(`Exported ${pdfFilename}`);
    } catch (err) {
      console.error('[PDF Generation Error]:', err);
      showToast('Error generating PDF evaluation report.');
    }
  };

  // 10. In-Room Chat: Send Message
  const handleSendMessage = (e) => {
    e?.preventDefault();
    const text = chatDraft.trim();
    if (!text || !roomId) return;

    const sender = user?.name || `Dev-${socket.id?.substring(0, 4) || 'Guest'}`;

    socket.emit('send-message', {
      roomId,
      message: text,
      sender,
    });

    setChatDraft('');
  };

  // Share room ID with toast
  const handleShareRoom = () => {
    if (!room?.roomId) return;
    const shareText = `Join my DevSync live coding room #${room.roomId}: ${window.location.href}`;
    navigator.clipboard.writeText(shareText);
    showToast(`Room #${room.roomId} invite copied to clipboard!`);
  };

  const handleCopyIdOnly = () => {
    if (!room?.roomId) return;
    navigator.clipboard.writeText(room.roomId);
    showToast(`Room ID #${room.roomId} copied!`);
  };

  // Save updated problem description
  const handleSaveProblem = async () => {
    if (!room) return;
    try {
      setSavingProblem(true);
      const res = await roomService.updateRoomProblem(room.roomId, problemDraft);
      if (res.success) {
        setRoom((prev) => ({ ...prev, problemDescription: problemDraft }));
        setIsEditingProblem(false);
        // Live broadcast to all candidates and peers
        socket.emit('problem-change', {
          roomId,
          problemDescription: problemDraft,
          title: room.title,
        });
        showToast('Problem statement updated and synced live!');
      }
    } catch {
      showToast('Failed to update problem description');
    } finally {
      setSavingProblem(false);
    }
  };

  // Helper for 24h TTL
  const calculateHoursRemaining = (createdAt) => {
    if (!createdAt) return '24h';
    const createdTime = new Date(createdAt).getTime();
    const expireTime = createdTime + 24 * 60 * 60 * 1000;
    const diffHours = Math.max(0, Math.round((expireTime - Date.now()) / (1000 * 60 * 60)));
    return `${diffHours}h remaining`;
  };

  const formatMessageTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Star Rating Subcomponent
  const StarRatingInput = ({ value, onChange, label }) => {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200">{label}</span>
          <span className="text-amber-400 font-medium text-[11px]">
            {value}/5 • {RATING_LABELS[value] || ''}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="p-1 rounded-lg hover:bg-slate-800 transition-transform active:scale-95 cursor-pointer"
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  star <= value
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
        <p className="text-sm text-slate-400">Connecting to DevSync Real-Time Room...</p>
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

  const selectedTest =
    testReport?.results && testReport.results[selectedTestCaseIdx]
      ? testReport.results[selectedTestCaseIdx]
      : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-[#0B0F19] text-slate-100 relative overflow-hidden">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 border border-indigo-500/40 text-white text-xs shadow-2xl shadow-indigo-950/60 animate-in fade-in slide-in-from-top-3 duration-200 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800/80 bg-[#0F172A]/90 backdrop-blur-md px-4 flex items-center justify-between z-30 sticky top-16">
        {/* Left: Back & Room Metadata */}
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <button
            id="toggle-problem-panel-btn"
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            className={`p-1.5 rounded-lg border transition-colors flex items-center space-x-1.5 text-xs font-medium cursor-pointer ${
              isLeftPanelOpen
                ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={isLeftPanelOpen ? 'Collapse Problem Panel' : 'Expand Problem Panel'}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Problem</span>
            {isLeftPanelOpen ? (
              <ChevronLeft className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold font-['Outfit'] text-white truncate max-w-[130px] sm:max-w-[200px]">
              {room.title}
            </h1>
            <button
              onClick={handleCopyIdOnly}
              className="px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold tracking-wider transition-colors cursor-pointer"
              title="Click to copy Room ID"
            >
              #{room.roomId}
            </button>
          </div>

          {/* Auto-Save Cloud Status Pill */}
          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
            {saveStatus === 'saved' && (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Auto-saved</span>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-amber-400 font-medium">Saving...</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
                <span className="text-slate-500">Unsaved</span>
              </>
            )}
          </div>
        </div>

        {/* Center / Right: Language, Run Code, Submit Solution, Host Scorecard, Integrity Timeline, Chat, Share */}
        <div className="flex items-center space-x-2">
          {/* Language Selector Dropdown */}
          <div className="flex items-center space-x-1.5">
            <Code2 className="w-3.5 h-3.5 text-cyan-400 hidden sm:inline" />
            <select
              id="editor-language-select"
              value={language}
              onChange={handleLanguageChange}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer"
            >
              <option value="javascript">JavaScript (Node 18)</option>
              <option value="python">Python (3.10)</option>
              <option value="cpp">C++ (GCC 10)</option>
              <option value="java">Java (OpenJDK 15)</option>
            </select>
          </div>

          {/* Run Code Button */}
          <button
            id="run-code-primary-btn"
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-60 group"
            title="Execute code in console (Cmd/Ctrl + Enter)"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                <span>Run</span>
              </>
            )}
          </button>

          {/* Feature 1: Submit Solution Button (Distinct from Run Code) */}
          <button
            id="submit-solution-btn"
            onClick={handleSubmitSolution}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-60 group"
            title="Run complete verification against public and hidden test cases"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-indigo-200" />
                <span>Submit Solution</span>
              </>
            )}
          </button>

          {/* Feature 2: End Interview & Rate Button (Visible exclusively to host) */}
          {isRoomHost && (
            <button
              id="end-interview-rate-btn"
              onClick={() => setIsEvaluationModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              title="Open Interview Scorecard & Download PDF Report"
            >
              <Award className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">End & Rate</span>
              <span className="sm:hidden">Rate</span>
            </button>
          )}

          {/* Feature 3: Host Session Timeline & Integrity Log Button */}
          <button
            id="toggle-integrity-log-btn"
            onClick={() => setIsTimelineDrawerOpen(!isTimelineDrawerOpen)}
            className={`relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-colors flex items-center space-x-1.5 text-xs font-medium cursor-pointer ${
              integrityAlerts.length > 0
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                : isTimelineDrawerOpen
                ? 'bg-indigo-600/25 border-indigo-500/40 text-indigo-200'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title="Session Timeline & Anti-Cheat Keystroke Integrity Log"
          >
            {integrityAlerts.length > 0 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="hidden md:inline">Integrity</span>

            {/* Alert Counter Badge */}
            {integrityAlerts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold ring-2 ring-[#0B0F19]">
                {integrityAlerts.length}
              </span>
            )}
          </button>

          {/* Download Code Button */}
          <button
            id="download-code-btn"
            onClick={handleDownloadCode}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Download Code File"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* WebRTC Live Audio/Video Call Button */}
          <button
            id="toggle-video-call-btn"
            onClick={() => setIsVideoCallActive(!isVideoCallActive)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-colors flex items-center space-x-1.5 text-xs font-medium cursor-pointer ${
              isVideoCallActive
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title={isVideoCallActive ? 'Hide Video Call Window' : 'Start 1-on-1 Video/Audio Call'}
          >
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{isVideoCallActive ? 'In Call' : 'Video'}</span>
          </button>

          {/* In-Room Chat Drawer Toggle Button */}
          <button
            id="toggle-chat-drawer-btn"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-colors flex items-center space-x-1.5 text-xs font-medium cursor-pointer ${
              isChatOpen
                ? 'bg-indigo-600/25 border-indigo-500/40 text-indigo-200'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title={isChatOpen ? 'Close In-Room Chat' : 'Open In-Room Chat'}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Chat</span>

            {/* Unread Message Badge */}
            {unreadCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-[#0B0F19] animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Active Users Pill */}
          <div className="relative hidden md:block">
            <button
              id="active-users-btn"
              onClick={() => setUsersDropdownOpen(!usersDropdownOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-white">{activeUsers.length || 1}</span>
            </button>

            {usersDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in duration-150">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>Connected Peers</span>
                  <span className="text-emerald-400">{activeUsers.length || 1} Active</span>
                </div>
                <div className="py-2 space-y-1.5 max-h-48 overflow-y-auto">
                  {(activeUsers.length > 0
                    ? activeUsers
                    : [{ username: user?.name || 'You (Host)', socketId: 'self' }]
                  ).map((peer, idx) => (
                    <div
                      key={peer.socketId || idx}
                      className="flex items-center space-x-2 px-2 py-1.5 rounded-lg bg-slate-900/60 text-xs text-slate-200"
                    >
                      <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white font-bold text-[10px] flex items-center justify-center">
                        {peer.username?.[0]?.toUpperCase() || 'D'}
                      </div>
                      <span className="truncate flex-1">{peer.username}</span>
                      {peer.username === (user?.name || 'You (Host)') && (
                        <span className="text-[10px] text-indigo-400 font-semibold">(You)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Share Room Button */}
          <button
            id="share-room-id-btn"
            onClick={handleShareRoom}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Share</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Problem Statement / Instructions (Collapsible) */}
        {isLeftPanelOpen && (
          <aside className="w-full sm:w-80 lg:w-[380px] flex-shrink-0 border-r border-slate-800/80 bg-[#0F172A]/70 flex flex-col h-[calc(100vh-7.5rem)] transition-all duration-300">
            {/* Panel Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Problem Description
                </span>
              </div>

              {!isEditingProblem ? (
                <button
                  id="edit-problem-desc-btn"
                  onClick={() => setIsEditingProblem(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-medium cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setProblemDraft(room.problemDescription);
                      setIsEditingProblem(false);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-problem-desc-btn"
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

            {/* Panel Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {isEditingProblem ? (
                <div className="h-full flex flex-col space-y-2">
                  <span className="text-[11px] text-slate-400">
                    Edit problem statement (Markdown format). Changes update in real-time.
                  </span>
                  <textarea
                    id="edit-problem-textarea"
                    value={problemDraft}
                    onChange={(e) => setProblemDraft(e.target.value)}
                    rows={18}
                    className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                  />
                </div>
              ) : (
                <div className="space-y-4 text-xs font-sans text-slate-300 leading-relaxed pr-1">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{calculateHoursRemaining(room.createdAt)}</span>
                    </span>
                    <span className="text-emerald-400 font-medium">Session Active</span>
                  </div>

                  <div className="whitespace-pre-wrap font-mono text-xs text-slate-200 leading-relaxed">
                    {room.problemDescription}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center Panel: Monaco Editor & Output/Terminal/Test Console */}
        <main className="flex-1 flex flex-col h-[calc(100vh-7.5rem)] overflow-hidden bg-[#0B0F19] min-w-0">
          {/* Editor Header Sub-bar */}
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200 uppercase tracking-wider">
                Code Workspace
              </span>
              <span>•</span>
              <span className="text-cyan-400 font-mono capitalize">{language}</span>
              <span className="text-slate-600 hidden md:inline">•</span>
              <span className="text-slate-500 text-[11px] hidden md:inline">
                Press <kbd className="font-mono text-slate-400 bg-slate-800 px-1 py-0.5 rounded">Cmd+Enter</kbd> to run
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="reset-code-template-btn"
                onClick={() => {
                  const tmpl = LANGUAGE_DEFAULTS[language] || '// Write solution';
                  setCode(tmpl);
                  socket.emit('code-change', { roomId, code: tmpl });
                  triggerAutoSave(tmpl, language);
                  showToast('Code reset to starter template');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset code template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Monaco Editor Container with Anti-Cheat Event Listeners */}
          <div className="flex-1 relative min-h-0">
            <Editor
              height="100%"
              theme="vs-dark"
              language={MONACO_LANGUAGE_MAP[language] || 'javascript'}
              value={code}
              onChange={handleEditorChange}
              onMount={(editor, monaco) => {
                editorRef.current = editor;

                // Keyboard Shortcut: Cmd/Ctrl + Enter to Run
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                  handleRunCode();
                });

                // Feature 3: Keystroke & Paste Event Listeners for Monaco
                const domNode = editor.getDomNode();
                if (domNode) {
                  // Capture paste event directly on editor DOM
                  domNode.addEventListener('paste', () => {
                    isPasteEventRef.current = true;
                  });
                }

                editor.onDidChangeModelContent((event) => {
                  const now = Date.now();
                  const elapsed = now - lastChangeTimeRef.current;
                  lastChangeTimeRef.current = now;

                  // 1. Initial Keystroke Timeline Tag
                  if (!hasStartedTyping.current) {
                    hasStartedTyping.current = true;
                    const initialTypePayload = {
                      id: `tl_${Date.now()}`,
                      roomId,
                      text: 'Candidate started typing.',
                      type: 'TYPING_START',
                      timestamp: new Date().toISOString(),
                      user: user?.name || 'Candidate',
                    };
                    socket.emit('timeline-event', initialTypePayload);
                    setTimelineEvents((prev) => [initialTypePayload, ...prev]);
                  }

                  // 2. Burst Paste Detection (>50 chars in <50ms or via onPaste)
                  for (const change of event.changes) {
                    const insertedText = change.text || '';
                    if (
                      insertedText.length > 50 &&
                      (elapsed < 50 || isPasteEventRef.current)
                    ) {
                      const alertPayload = {
                        roomId,
                        type: 'BULK_PASTE',
                        charCount: insertedText.length,
                        timestamp: new Date().toISOString(),
                        snippet: insertedText.substring(0, 100),
                        user: user?.name || 'Candidate',
                      };

                      socket.emit('flag-integrity-event', alertPayload);
                      break;
                    }
                  }

                  isPasteEventRef.current = false;
                });
              }}
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                minimap: { enabled: true, scale: 0.75 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
                renderLineHighlight: 'all',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
              }}
              loading={
                <div className="h-full flex items-center justify-center space-y-2 bg-[#0B0F19]">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
              }
            />
          </div>

          {/* Bottom Console / Test Suite Drawer */}
          <div
            className={`border-t border-slate-800 bg-[#0A0F1D] flex flex-col transition-all duration-200 ${
              isTerminalExpanded ? 'h-80' : 'h-52'
            }`}
          >
            {/* Drawer Header Tabs */}
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                {/* Tab 1: Terminal Console */}
                <button
                  id="tab-terminal-btn"
                  onClick={() => setActiveConsoleTab('terminal')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeConsoleTab === 'terminal'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Terminal Console</span>
                  {executionResult && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        executionResult.status === 'success'
                          ? 'bg-emerald-400'
                          : executionResult.status === 'error'
                          ? 'bg-rose-400'
                          : 'bg-cyan-400 animate-pulse'
                      }`}
                    />
                  )}
                </button>

                {/* Tab 2: Feature 1 Test Suite */}
                <button
                  id="tab-test-suite-btn"
                  onClick={() => setActiveConsoleTab('tests')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeConsoleTab === 'tests'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Test Suite</span>
                  {testReport && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        testReport.allPassed
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {testReport.passRatio} Passed
                    </span>
                  )}
                </button>
              </div>

              {/* Right Controls: Interviewer Toggle, Clear, Expand */}
              <div className="flex items-center space-x-2.5">
                {/* Feature 1: Interviewer Toggle */}
                {activeConsoleTab === 'tests' && (
                  <button
                    id="interviewer-mode-toggle-btn"
                    onClick={() => {
                      const next = !isInterviewerMode;
                      setIsInterviewerMode(next);
                      showToast(
                        next
                          ? 'Host View: Hidden test details revealed'
                          : 'Candidate View: Hidden test inputs/outputs masked'
                      );
                    }}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                      isInterviewerMode
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Toggle Interviewer Mode (Reveal or mask hidden test cases)"
                  >
                    {isInterviewerMode ? (
                      <>
                        <Eye className="w-3 h-3 text-amber-400" />
                        <span>Host View (Revealed)</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-slate-400" />
                        <span>Candidate View (Masked)</span>
                      </>
                    )}
                  </button>
                )}

                {activeConsoleTab === 'terminal' && (
                  <button
                    onClick={() => setExecutionResult(null)}
                    className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Clear Output"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isTerminalExpanded ? 'Collapse Drawer' : 'Expand Drawer'}
                >
                  {isTerminalExpanded ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Console Drawer Body */}
            <div className="flex-1 p-3.5 overflow-y-auto font-mono text-xs leading-relaxed selection:bg-cyan-500/30">
              {activeConsoleTab === 'terminal' ? (
                /* Terminal Output Tab Content */
                isRunning ? (
                  <div className="flex items-center space-x-2 text-cyan-400/80 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing {language} code via sandbox service...</span>
                  </div>
                ) : executionResult ? (
                  <div className="space-y-2">
                    {/* Execution Meta Info */}
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 pb-1 border-b border-slate-800/60 font-sans">
                      <span className="font-semibold text-slate-300">
                        Status:{' '}
                        <span
                          className={
                            executionResult.status === 'success'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }
                        >
                          {executionResult.status.toUpperCase()}
                        </span>
                      </span>
                      {executionResult.executionTime !== null && (
                        <span>⏱️ {executionResult.executionTime}ms</span>
                      )}
                      {executionResult.memoryUsage && executionResult.memoryUsage !== 'N/A' && (
                        <span>💾 {executionResult.memoryUsage}</span>
                      )}
                    </div>

                    {/* Standard Output */}
                    {executionResult.stdout && (
                      <div className="text-emerald-300 whitespace-pre-wrap">
                        {executionResult.stdout}
                      </div>
                    )}

                    {/* Standard Error */}
                    {executionResult.stderr && (
                      <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl whitespace-pre-wrap">
                        <div className="flex items-center space-x-1.5 font-bold text-rose-300 pb-1 font-sans">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Error Output</span>
                        </div>
                        {executionResult.stderr}
                      </div>
                    )}

                    {!executionResult.stdout && !executionResult.stderr && (
                      <div className="text-slate-400 italic">
                        Program executed successfully with no console output.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs flex items-center space-x-2">
                    <Terminal className="w-3.5 h-3.5 text-slate-600" />
                    <span>
                      Ready. Click <span className="text-emerald-400 font-semibold">Run Code</span>{' '}
                      or press{' '}
                      <kbd className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded font-mono">
                        Cmd/Ctrl + Enter
                      </kbd>{' '}
                      to execute in console.
                    </span>
                  </div>
                )
              ) : (
                /* Feature 1: Test Suite Verification Engine Drawer Content */
                isSubmitting ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3 py-6">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-200">
                        Running Verification Engine Harness...
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Sequentially evaluating code against public & hidden test cases
                      </p>
                    </div>
                  </div>
                ) : testReport ? (
                  <div className="flex flex-col space-y-3">
                    {/* Test Case Chips Row */}
                    <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 border-b border-slate-800/80">
                      {testReport.results.map((tc, idx) => {
                        const isSelected = selectedTestCaseIdx === idx;
                        return (
                          <button
                            key={tc.testCaseId || idx}
                            onClick={() => setSelectedTestCaseIdx(idx)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex-shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600/30 border-indigo-500/50 text-white ring-1 ring-indigo-500/40'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            {tc.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                            )}
                            <span className="font-semibold">
                              {tc.isHidden ? `🔒 Hidden #${tc.testIndex}` : `Case #${tc.testIndex}`}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                tc.passed
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-400'
                              }`}
                            >
                              {tc.passed ? 'Passed' : 'Failed'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Test Case Inspection View */}
                    {selectedTest && (
                      <div className="space-y-3 font-sans">
                        {/* Test Status Header */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-100">
                              {selectedTest.isHidden
                                ? `Hidden Test Case #${selectedTest.testIndex}`
                                : `Test Case #${selectedTest.testIndex}`}
                            </span>
                            {selectedTest.isHidden && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold flex items-center space-x-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Protected Hidden Case</span>
                              </span>
                            )}
                            {selectedTest.passed ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                Passed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                                Failed
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-400 font-mono">
                            ⏱️ {selectedTest.executionTime ? `${selectedTest.executionTime}ms` : '<10ms'}
                          </span>
                        </div>

                        {/* Feature 1 Rule: For hidden test cases, display only "Hidden Test Case #N: Passed / Failed" without leaking input or expected output to candidate */}
                        {selectedTest.isHidden && !isInterviewerMode ? (
                          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                            <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-xs">
                              <Lock className="w-4 h-4 text-indigo-400" />
                              <span>Hidden Test Case #{selectedTest.testIndex}: {selectedTest.passed ? 'Passed' : 'Failed'}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              This test case contains protected boundary constraints. The input,
                              expected output, and stdout are masked from the candidate's view to
                              preserve evaluation integrity.
                            </p>
                          </div>
                        ) : (
                          /* Public Test Case (or Host Interviewer View of Hidden Case) */
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            {/* Input Column */}
                            <div className="space-y-1">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Input Assertion
                              </div>
                              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] overflow-x-auto">
                                {selectedTest.input}
                              </div>
                            </div>

                            {/* Expected Output Column */}
                            <div className="space-y-1">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Expected Output
                              </div>
                              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                                {selectedTest.expectedOutput}
                              </div>
                            </div>

                            {/* Actual Output Column */}
                            <div className="space-y-1">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Actual Output
                              </div>
                              <div
                                className={`p-2.5 rounded-xl border font-mono text-[11px] overflow-x-auto ${
                                  selectedTest.passed
                                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                                }`}
                              >
                                {selectedTest.actualOutput || '(No stdout)'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stderr if failed */}
                        {selectedTest.stderr && (!selectedTest.isHidden || isInterviewerMode) && (
                          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
                            {selectedTest.stderr}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty state for Test Suite */
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-200">
                        Hidden & Public Test-Case Verification Engine
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-md">
                        Execute candidate solution against rigorous test suites with masked
                        interview test cases and automated timing benchmarks.
                      </p>
                    </div>
                    <button
                      onClick={handleSubmitSolution}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/30 cursor-pointer"
                    >
                      Run Verification Test Suite
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </main>

        {/* Feature 3: Host Session Timeline & Anti-Cheat Keystroke Log Drawer */}
        {isTimelineDrawerOpen && (
          <aside className="w-full sm:w-80 lg:w-96 flex-shrink-0 border-l border-slate-800/80 bg-[#0F172A]/95 backdrop-blur-xl flex flex-col h-[calc(100vh-7.5rem)] z-20 shadow-2xl transition-all duration-300 animate-in slide-in-from-right-4">
            {/* Timeline Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Session Timeline & Integrity Log
                </span>
              </div>

              <button
                onClick={() => setIsTimelineDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Timeline Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Timeline Sub-header / Status */}
            <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Burst Paste Telemetry Active</span>
              </span>
              <span className="font-semibold text-rose-400">
                {integrityAlerts.length} Alert{integrityAlerts.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Chronological Tags List */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 font-mono text-xs">
              {timelineEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300 font-sans">
                    No timeline events yet
                  </p>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Candidate keystrokes, burst paste spikes, and submission milestones will log
                    here chronologically.
                  </p>
                </div>
              ) : (
                timelineEvents.map((evt) => {
                  const isAlert = evt.type === 'ALERT' || evt.type === 'BULK_PASTE';
                  const isSubmit = evt.type === 'SUBMISSION';
                  const isTyping = evt.type === 'TYPING_START';

                  return (
                    <div
                      key={evt.id}
                      className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                        isAlert
                          ? 'bg-rose-950/25 border-rose-500/40 text-rose-200'
                          : isSubmit
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1 text-[11px]">
                        <span className="font-bold text-slate-400">
                          [{formatTimelineTime(evt.timestamp)}]
                        </span>
                        {isAlert && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-sans font-bold text-[10px]">
                            Burst Paste Alert
                          </span>
                        )}
                        {isSubmit && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-sans font-bold text-[10px]">
                            Milestone
                          </span>
                        )}
                        {isTyping && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-sans font-bold text-[10px]">
                            Keystroke Telemetry
                          </span>
                        )}
                      </div>

                      {/* Display chronological tags strictly formatted:
                          [14:02:10] Candidate started typing.
                          [14:08:45] ⚠️ Alert: 180 characters pasted in a single keystroke.
                          [14:15:20] Solution submitted (All test cases passed).
                      */}
                      <div className="font-sans font-medium text-xs">
                        {evt.text}
                      </div>

                      {evt.snippet && (
                        <div className="mt-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono truncate">
                          Snippet: "{evt.snippet}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Right Collapsible In-Room Chat Drawer */}
        {isChatOpen && (
          <aside className="w-full sm:w-80 lg:w-88 flex-shrink-0 border-l border-slate-800/80 bg-[#0F172A]/95 backdrop-blur-xl flex flex-col h-[calc(100vh-7.5rem)] z-20 shadow-2xl transition-all duration-300 animate-in slide-in-from-right-4">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  In-Room Chat
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {messages.length}
                </span>
              </div>

              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Chat Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">No messages yet</p>
                  <p className="text-[11px] text-slate-500">
                    Say hello to your interview peers in this room.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === (user?.name || socket.data?.username);
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 px-1">
                        <span className="font-semibold text-slate-300">
                          {isMe ? 'You' : msg.sender}
                        </span>
                        <span>•</span>
                        <span>{formatMessageTime(msg.timestamp)}</span>
                      </div>

                      <div
                        className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                          isMe
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800/80 bg-slate-900/90">
              <div className="relative flex items-center">
                <input
                  id="chat-message-input"
                  type="text"
                  placeholder="Type a message... (Enter to send)"
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <button
                  type="submit"
                  disabled={!chatDraft.trim()}
                  className="absolute right-1.5 p-1.5 text-indigo-400 hover:text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>

      {/* Feature 2: Structured Evaluation & Scorecard Modal */}
      {isEvaluationModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="max-w-2xl w-full bg-[#0F172A] border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-['Outfit'] text-white">
                    Interview Evaluation Scorecard
                  </h2>
                  <p className="text-xs text-slate-400">
                    Grade candidate performance and generate an official PDF report
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEvaluationModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room & Verification Snapshot */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Room ID</span>
                <p className="font-mono font-bold text-indigo-400">#{room.roomId}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Problem</span>
                <p className="font-bold text-slate-200 truncate">{room.title}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">
                  Test Pass Ratio
                </span>
                <p className="font-bold text-emerald-400">
                  {testReport?.passRatio || (room.feedback ? 'Verified' : 'Pending')}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Evaluator</span>
                <p className="font-bold text-slate-200 truncate">
                  {user?.name || 'Interviewer Host'}
                </p>
              </div>
            </div>

            {/* 1-5 Star Ratings Criteria */}
            <div className="space-y-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80">
              {/* Metric 1 */}
              <StarRatingInput
                label="1. Problem Solving & Algorithmic Logic"
                value={problemSolvingRating}
                onChange={setProblemSolvingRating}
              />

              {/* Metric 2 */}
              <StarRatingInput
                label="2. Code Readability & Modularity"
                value={codeQualityRating}
                onChange={setCodeQualityRating}
              />

              {/* Metric 3 */}
              <StarRatingInput
                label="3. Communication & Articulation"
                value={communicationRating}
                onChange={setCommunicationRating}
              />
            </div>

            {/* General Notes & Action Items */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                General Notes & Action Items
              </label>
              <textarea
                rows={4}
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Detail algorithmic strengths, space/time complexity tradeoffs discussed, areas of improvement, and hire recommendation..."
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Actions: Save Scorecard & Download PDF Report */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSaveEvaluation}
                disabled={isSavingFeedback}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSavingFeedback ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 text-emerald-400" />
                )}
                <span>Save Evaluation Scorecard</span>
              </button>

              <button
                type="button"
                id="download-candidate-pdf-btn"
                onClick={handleDownloadPdfReport}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Download Candidate Report (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WebRTC Live Video/Audio Call Overlay */}
      {isVideoCallActive && (
        <VideoCall
          roomId={roomId}
          username={user?.name || 'Developer'}
          onClose={() => setIsVideoCallActive(false)}
        />
      )}
    </div>
  );
};

export default RoomPage;
