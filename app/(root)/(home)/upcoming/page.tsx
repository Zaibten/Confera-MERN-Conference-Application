'use client';

import React from 'react'; // ✅ Required for JSX
import { useState } from 'react';
import CallList from '@/components/CallList';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const UpcomingPage = () => {
  const [emails, setEmails] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const { toast } = useToast();

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\.com\s+/g, '.com, ');
    setEmails(value);
  };

  const handleSend = async () => {
    const cleanEmails =
      emails.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [];

    if (!meetingLink || cleanEmails.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a valid meeting link and at least one email.',
      });
      return;
    }

    try {
      await fetch('http://localhost:5000/send-scheduleemail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Meeting Invitation',
          description: `You have been invited to join a meeting. Please join from the link below.`,
          time: 'TBD',
          emails: cleanEmails,
          meetingLink,
        }),
      });

      toast({
        title: 'Invitations Sent',
        description: 'Emails were successfully sent!',
      });

      setEmails('');
      setMeetingLink('');
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to send emails.',
      });
    }
  };

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-3xl font-bold">Upcoming Meeting</h1>

      <div>
        <p className="mb-1 text-sm font-medium text-white">Invite Emails</p>
        <input
          type="text"
          placeholder="example1@gmail.com, example2@gmail.com"
          className="w-full rounded-md border border-gray-600 bg-dark-2 px-4 py-2 text-white placeholder:text-gray-400"
          value={emails}
          onChange={handleEmailInput}
        />
        <p className="mt-1 text-xs text-gray-400">
          Separate emails using comma or &quot;.com&quot; and space – auto-formats to &quot;.com,&quot;
        </p>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-white">Meeting Link</p>
        <input
          type="text"
          placeholder="https://yourdomain.com/meeting/abc123"
          className="w-full rounded-md border border-gray-600 bg-dark-2 px-4 py-2 text-white placeholder:text-gray-400"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
        />
      </div>

      <Button className="w-fit" onClick={handleSend}>
        Send Invitations
      </Button>

      <CallList type="upcoming" />
    </section>
  );
};

export default UpcomingPage;
