'use client';

import { useEffect, useState, useRef } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  // useCall,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, LayoutList, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

import Loader from './Loader';
import EndCallButton from './EndCallButton';
import { cn } from '@/lib/utils';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);

  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  // const call = useCall();

  const [timer, setTimer] = useState(1);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ⏱ Timer
  useEffect(() => {
    if (callingState !== CallingState.JOINED) return;
    const interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [callingState]);

  // 🎤 OpenAI Whisper Integration
  useEffect(() => {
    if (callingState !== CallingState.JOINED) return;

    const startRecording = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'en'); // 👈 Force English only


        try {
          const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: formData,
          });

          const data = await res.json();
          if (data.text) {
            setTranscriptions((prev) => [...prev, `🗣️: ${data.text}`]);
          }
        } catch (err) {
          console.error('Transcription error:', err);
        }

        recorder.start();
        setTimeout(() => recorder.stop(), 5000); // loop every 5 seconds
      };

      recorder.start();
      setTimeout(() => recorder.stop(), 5000);
    };

    startRecording();

    return () => {
      mediaRecorderRef.current?.stop();
    };
  }, [callingState]);

  if (callingState !== CallingState.JOINED) return <Loader />;

  const renderLayout = () => {
    if (layout === 'grid') return <PaginatedGridLayout key="grid" />;
    if (layout === 'speaker-right') return <SpeakerLayout key="right" participantsBarPosition="left" />;
    return <SpeakerLayout key="left" participantsBarPosition="right" />;
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white flex">
      {/* Timer */}
{/* Timer */}
<div className="absolute bottom-2 left-5 z-50 rounded-2xl bg-[#1f2a36] px-5 py-3 shadow-lg backdrop-blur-md">
  <div className="text-xs uppercase tracking-wide text-gray-400">Session Time</div>
  <div
    className={cn(
      'mt-1 text-xl font-semibold transition-all duration-300',
      timer >= 3000 ? 'text-red-500 animate-bounce' : 'text-white'
    )}
  >
    {String(Math.floor(timer / 60)).padStart(2, '0')}:
    {String(timer % 60).padStart(2, '0')}
  </div>
</div>


      {/* Left: Video Layout */}
      <div
        className={cn('h-full transition-all duration-300', {
          'w-3/4': showWhiteboard,
          'w-full': !showWhiteboard,
        })}
      >
        {renderLayout()}
      </div>

      {/* Right Panel: Transcriptions */}
{/* Right Panel: Transcriptions (hidden from UI but still in DOM) */}
<div className="hidden">
        <h2 className="text-lg font-bold mb-2 text-center border-b pb-2">Live Transcription</h2>
        <div className="space-y-3 text-sm">
          {transcriptions.map((line, index) => (
            <p key={index} className="text-white bg-[#1f2a36] p-2 rounded-lg shadow-md">
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Participants */}
      {showParticipants && (
        <div className="h-[calc(100vh-86px)] ml-2">
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      )}

      {/* Whiteboard */}
      {showWhiteboard && (
        <div className="w-1/4 h-full bg-dark-2 border-l border-gray-700">
          <iframe
            src="https://excalidraw.com"
            title="Whiteboard"
            className="w-full h-full border-none"
          ></iframe>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5">
        <CallControls onLeave={() => router.push(`/`)} />

        {/* Layout Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <LayoutList size={20} className="text-white" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem onClick={() => setLayout(item.toLowerCase() as CallLayoutType)}>
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Toggle Whiteboard */}
        <button onClick={() => setShowWhiteboard((prev) => !prev)}>
          <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] flex items-center gap-2">
            <Pencil size={18} />
            <span className="hidden md:inline">{showWhiteboard ? 'Hide' : 'Whiteboard'}</span>
          </div>
        </button>

        <CallStatsButton />

        {/* Participants */}
        <button onClick={() => setShowParticipants((prev) => !prev)}>
          <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <Users size={20} className="text-white" />
          </div>
        </button>

{!isPersonalRoom && <EndCallButton transcriptions={transcriptions} />}
      </div>
    </section>
  );
};

export default MeetingRoom;
