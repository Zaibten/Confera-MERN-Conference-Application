'use client';

import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

const EndCallButton = ({ transcriptions }: { transcriptions: string[] }) => {
  const call = useCall();
  const router = useRouter();

  if (!call)
    throw new Error('useStreamCall must be used within a StreamCall component.');

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOwner =
    localParticipant &&
    call.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOwner) return null;

  const summarizeTranscriptions = async (lines: string[]) => {
    const plainText = lines.map((line) => line.replace('🗣️: ', '')).join('\n');

    const prompt = `Summarize the following meeting transcript into key points or agenda items using bullet points:\n\n${plainText}`;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant that summarizes meeting transcripts clearly and concisely.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
        }),
      });

      const data = await res.json();
      return data.choices?.[0]?.message?.content || 'No summary generated.';
    } catch (err) {
      console.error('Summarization error:', err);
      return 'Failed to generate summary.';
    }
  };

  const downloadSummary = (summary: string) => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-summary-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const endCall = async () => {
    const summary = await summarizeTranscriptions(transcriptions);
    downloadSummary(summary);
    await call.endCall();
    router.push('/');
  };

  return (
    <Button onClick={endCall} className="bg-red-500">
      End call for everyone
    </Button>
  );
};

export default EndCallButton;
