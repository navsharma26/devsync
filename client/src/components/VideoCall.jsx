import React, { useEffect, useRef, useState } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Users,
  Shield,
  Loader2,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { socket } from '../services/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const VideoCall = ({ roomId, username, onClose }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'waiting' | 'failed'
  const [remotePeerName, setRemotePeerName] = useState('Remote Peer');
  const [errorMessage, setErrorMessage] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const startCall = async () => {
      try {
        setConnectionStatus('connecting');

        // 1. Get user media (Audio + Video)
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: true,
          });
        } catch {
          // Fallback to audio-only if camera is unavailable or busy
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setIsVideoOff(true);
        }

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Initialize RTCPeerConnection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Remote stream listener
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setConnectionStatus('connected');
          }
        };

        // ICE Candidate handler
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc-ice-candidate', {
              roomId,
              candidate: event.candidate,
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setConnectionStatus('connected');
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setConnectionStatus('waiting');
          }
        };

        // 3. Socket signaling listeners
        // Peer joined: create and send offer
        socket.on('webrtc-peer-joined', async ({ callerName }) => {
          if (callerName) setRemotePeerName(callerName);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc-offer', { roomId, offer });
            setConnectionStatus('waiting');
          } catch (err) {
            console.error('[WebRTC createOffer Error]:', err);
          }
        });

        // Incoming offer: answer it
        socket.on('webrtc-offer', async ({ offer, callerName }) => {
          if (callerName) setRemotePeerName(callerName);
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc-answer', { roomId, answer });
            setConnectionStatus('connected');
          } catch (err) {
            console.error('[WebRTC handleOffer Error]:', err);
          }
        });

        // Incoming answer
        socket.on('webrtc-answer', async ({ answer }) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            setConnectionStatus('connected');
          } catch (err) {
            console.error('[WebRTC handleAnswer Error]:', err);
          }
        });

        // Incoming ICE candidate
        socket.on('webrtc-ice-candidate', async ({ candidate }) => {
          try {
            if (candidate && pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } catch (err) {
            console.error('[WebRTC addIceCandidate Error]:', err);
          }
        });

        // Remote peer ended call
        socket.on('webrtc-call-ended', () => {
          setConnectionStatus('waiting');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        });

        // Broadcast join-call event so existing peer knows to initiate offer
        socket.emit('webrtc-join-call', { roomId });
      } catch (err) {
        console.error('[WebRTC init error]:', err);
        setErrorMessage(
          err.name === 'NotAllowedError'
            ? 'Camera / Microphone permissions were denied.'
            : 'Could not access media devices.'
        );
        setConnectionStatus('failed');
      }
    };

    startCall();

    return () => {
      isMounted = false;
      // Stop media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Close RTCPeerConnection
      if (pcRef.current) {
        pcRef.current.close();
      }
      // Notify socket peers
      socket.emit('webrtc-end-call', { roomId });
      socket.off('webrtc-peer-joined');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('webrtc-call-ended');
    };
  }, [roomId]);

  // Toggle Microphone Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Camera Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // End Call
  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    socket.emit('webrtc-end-call', { roomId });
    onClose();
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A]/95 border border-indigo-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center space-x-3 text-xs animate-in fade-in">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </div>
        <span className="font-semibold text-slate-200">Video Call in Progress</span>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
          title="Expand Video Call"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleEndCall}
          className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-[#0F172A]/95 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
      {/* Video Call Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            WebRTC Live Interview Call
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Minimize to Floating Pill"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleEndCall}
            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Leave Video Call"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Feeds Area */}
      <div className="relative h-56 bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Remote Peer Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Remote Video Overlay / Status when waiting */}
        {connectionStatus !== 'connected' && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center space-y-2">
            {connectionStatus === 'connecting' && (
              <>
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                <p className="text-xs font-semibold text-slate-200">
                  Initializing WebRTC Media Stream...
                </p>
              </>
            )}
            {connectionStatus === 'waiting' && (
              <>
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Waiting for peer to connect...
                </p>
                <p className="text-[11px] text-slate-400 max-w-[200px]">
                  Share this room link with your interview candidate to start face-to-face video.
                </p>
              </>
            )}
            {connectionStatus === 'failed' && (
              <>
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-rose-300">{errorMessage || 'Media Access Error'}</p>
                <p className="text-[11px] text-slate-400">
                  Allow camera & mic permissions in your browser bar and retry.
                </p>
              </>
            )}
          </div>
        )}

        {/* Remote Peer Badge */}
        {connectionStatus === 'connected' && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-slate-200 border border-slate-700/60 flex items-center space-x-1">
            <Volume2 className="w-2.5 h-2.5 text-emerald-400" />
            <span>{remotePeerName}</span>
          </div>
        )}

        {/* Local Video Preview (PiP overlay in bottom right corner) */}
        <div className="absolute bottom-2 right-2 w-24 h-18 bg-slate-900 rounded-xl border border-slate-700/80 overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-[10px] text-slate-400 font-semibold">
              <VideoOff className="w-4 h-4 text-slate-500 mb-0.5" />
              <span>Cam Off</span>
            </div>
          )}
          <div className="absolute bottom-0.5 left-1 text-[9px] font-bold text-slate-300 bg-black/60 px-1 rounded">
            You
          </div>
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center space-x-3">
        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            isMuted
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            isVideoOff
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span>Hang Up</span>
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
