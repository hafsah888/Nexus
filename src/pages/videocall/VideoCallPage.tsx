import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Phone,
  MonitorUp,
  User,
  Loader2,
  MonitorOff,
} from 'lucide-react';

type CallStatus = 'idle' | 'requesting' | 'connecting' | 'connected' | 'ended';

const PARTICIPANT_NAME = 'Alex Morgan';

function useCallTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

const statusConfig: Record<CallStatus, { label: string; color: string }> = {
  idle:       { label: 'Not Started',  color: 'bg-gray-200 text-gray-600' },
  requesting: { label: 'Requesting…',  color: 'bg-yellow-100 text-yellow-700' },
  connecting: { label: 'Connecting…',  color: 'bg-blue-100 text-blue-700' },
  connected:  { label: 'Connected',    color: 'bg-green-100 text-green-700' },
  ended:      { label: 'Call Ended',   color: 'bg-red-100 text-red-600' },
};

export const VideoCallPage: React.FC = () => {
  const [status, setStatus]               = useState<CallStatus>('idle');
  const [videoEnabled, setVideoEnabled]   = useState(true);
  const [audioEnabled, setAudioEnabled]   = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const localVideoRef   = useRef<HTMLVideoElement>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const callActive = status === 'connected';
  const timer = useCallTimer(callActive);

  /* ── cleanup on unmount ── */
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopTracks = (stream: MediaStream | null) =>
    stream?.getTracks().forEach((t) => t.stop());

  /* ── start call ── */
  const handleStartCall = async () => {
    setError(null);
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      setStatus('connecting');
      // Simulate network handshake
      await new Promise((r) => setTimeout(r, 1200));
      setStatus('connected');
      setVideoEnabled(true);
      setAudioEnabled(true);
    } catch {
      setStatus('idle');
      setError('Camera / microphone access denied. Allow permission in your browser and try again.');
    }
  };

  /* ── end call ── */
  const handleEndCall = useCallback(() => {
    stopTracks(streamRef.current);
    stopTracks(screenStreamRef.current);
    streamRef.current = null;
    screenStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setStatus('ended');
    setIsScreenSharing(false);
    setVideoEnabled(true);
    setAudioEnabled(true);
  }, []);

  /* ── toggle video ── */
  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideoEnabled(track.enabled);
  };

  /* ── toggle audio ── */
  const toggleAudio = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setAudioEnabled(track.enabled);
  };

  /* ── screen share ── */
  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screen;
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;
        setIsScreenSharing(true);

        screen.getVideoTracks()[0].onended = () => {
          if (localVideoRef.current && streamRef.current)
            localVideoRef.current.srcObject = streamRef.current;
          screenStreamRef.current = null;
          setIsScreenSharing(false);
        };
      } catch {
        // user cancelled — no error shown
      }
    } else {
      stopTracks(screenStreamRef.current);
      screenStreamRef.current = null;
      if (localVideoRef.current && streamRef.current)
        localVideoRef.current.srcObject = streamRef.current;
      setIsScreenSharing(false);
    }
  };

  const { label: statusLabel, color: statusColor } = statusConfig[status];

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Video className="text-primary-600" size={22} />
          <h1 className="text-xl font-semibold text-gray-900">Video Call</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
          {/* Timer */}
          {callActive && (
            <span className="text-sm font-mono text-gray-600 tabular-nums bg-gray-100 px-3 py-1 rounded-full">
              {timer}
            </span>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2 mb-4">
          {error}
        </div>
      )}

      {/* ── Call ended notice ── */}
      {status === 'ended' && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-md px-4 py-2 mb-4">
          Call ended. Start a new call anytime.
        </div>
      )}

      {/* ── Video area ── */}
      <div
        className="relative bg-gray-900 rounded-2xl overflow-hidden w-full"
        style={{ aspectRatio: '16/9' }}
      >

        {/* Remote participant */}
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-3 ring-2 ring-gray-600">
            <User size={40} className="text-gray-400" />
          </div>
          <p className="text-gray-300 font-medium text-sm">
            {callActive ? PARTICIPANT_NAME : status === 'ended' ? 'Call Ended' : 'Waiting to connect…'}
          </p>
          {callActive && (
            <p className="text-gray-500 text-xs mt-1">Camera not available on their end</p>
          )}
        </div>

        {/* Requesting / connecting overlay */}
        {(status === 'requesting' || status === 'connecting') && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="text-white animate-spin" />
            <p className="text-white text-sm font-medium">
              {status === 'requesting' ? 'Requesting camera & microphone…' : 'Connecting to call…'}
            </p>
          </div>
        )}

        {/* Local video — picture-in-picture */}
        {callActive && (
          <div className="absolute bottom-4 right-4 w-44 h-32 bg-black rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl group">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${
                isScreenSharing ? '' : 'scale-x-[-1]'   /* mirror only for camera */
              } ${videoEnabled || isScreenSharing ? '' : 'hidden'}`}
            />
            {!videoEnabled && !isScreenSharing && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700 text-gray-300 gap-1">
                <VideoOff size={18} />
                <span className="text-[10px]">Camera off</span>
              </div>
            )}
            {/* "You" label */}
            <div className="absolute bottom-1 left-0 right-0 text-center">
              <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
                {isScreenSharing ? 'Screen' : 'You'}
              </span>
            </div>
          </div>
        )}

        {/* Participant name tag — bottom left */}
        {callActive && (
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
            {PARTICIPANT_NAME}
          </div>
        )}
      </div>

      {/* ── Controls bar ── */}
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        {status === 'idle' || status === 'ended' ? (
          <button
            onClick={handleStartCall}
            className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full px-6 py-3 flex items-center gap-2 font-medium transition-colors shadow-sm"
          >
            <Phone size={18} />
            {status === 'ended' ? 'Call Again' : 'Start Call'}
          </button>
        ) : callActive ? (
          <>
            {/* Audio toggle */}
            <button
              onClick={toggleAudio}
              title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
              className={`rounded-full p-3 transition-colors ${
                audioEnabled
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            {/* Video toggle */}
            <button
              onClick={toggleVideo}
              title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
              className={`rounded-full p-3 transition-colors ${
                videoEnabled
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
            </button>

            {/* Screen share */}
            <button
              onClick={handleScreenShare}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
              className={`rounded-full p-3 transition-colors ${
                isScreenSharing
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {isScreenSharing ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* End call */}
            <button
              onClick={handleEndCall}
              title="End call"
              className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full px-6 py-3 flex items-center gap-2 font-medium transition-colors shadow-sm"
            >
              <PhoneOff size={18} /> End Call
            </button>
          </>
        ) : null /* requesting / connecting — controls hidden */ }
      </div>

      {/* ── Info row ── */}
      {callActive && (
        <p className="text-xs text-gray-400 mt-3">
          This is a frontend mock — no real connection is established.
        </p>
      )}
    </div>
  );
};