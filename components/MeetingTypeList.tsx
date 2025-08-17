/* eslint-disable camelcase */
'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import HomeCard from './HomeCard';
import MeetingModal from './MeetingModal';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';
import Loader from './Loader';
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { useToast } from './ui/use-toast';
import { Input } from './ui/input';

const initialValues = {
  title: '',
  description: '',
  dateTime: new Date(),
  link: '',
};

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined
  >(undefined);
  const [values, setValues] = useState(initialValues);
  const [callDetail, setCallDetail] = useState<Call>();
  const [hostName, setHostName] = useState('');
  const client = useStreamVideoClient();
  const { user } = useUser();
  const { toast } = useToast();

  const [createdAt, setCreatedAt] = useState<string>('');
  const [emails, setEmails] = useState('');

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\.com\s+/g, '.com, ');
    setEmails(value);
  };

  // Check on load if we should open Schedule Meeting modal after refresh
  useEffect(() => {
    const shouldOpen = localStorage.getItem('openScheduleAfterRefresh');
    if (shouldOpen === 'true') {
      setMeetingState('isScheduleMeeting');
      localStorage.removeItem('openScheduleAfterRefresh');
    }
  }, []);

  useEffect(() => {
    if (meetingState === 'isScheduleMeeting') {
      const now = new Date().toISOString();
      setCreatedAt(now);
    }
    if (user) {
      setHostName(user.fullName || '');
    }
  }, [meetingState, user]);

  const createMeeting = async () => {
    if (!client || !user) return;

    if (meetingState === 'isScheduleMeeting') {
      if (!values.title.trim()) {
        toast({ title: 'Please enter a meeting title' });
        return;
      }
      if (!values.dateTime) {
        toast({ title: 'Please select a date and time' });
        return;
      }
    }

    try {
      const id = crypto.randomUUID();
      const call = client.call('default', id);
      if (!call) throw new Error('Failed to create meeting');

      const startsAt = values.dateTime.toISOString();
      const title =
        values.title.trim() || (meetingState === 'isInstantMeeting' ? 'Instant Meeting' : '');
      const description = values.description || 'Instant Meeting';

      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            title,
            description,
            createdAt,
            duration: 60,
            host: hostName,
          },
        },
      });

      setCallDetail(call);

      if (meetingState === 'isScheduleMeeting') {
        try {
          const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${call.id}`;
          const response = await fetch('https://syncmeetserver.vercel.app//send-scheduleemail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              description,
              time: startsAt,
              emails,
              meetingLink,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to send schedule email');
          }
          toast({ title: 'Schedule email sent' });
        } catch (emailErr) {
          console.error(emailErr);
          toast({ title: 'Meeting created, but email failed to send' });
        }
      }

      if (meetingState === 'isInstantMeeting') {
        router.push(`/meeting/${call.id}`);
      }

      toast({ title: 'Meeting Created' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to create Meeting' });
    }
  };

  if (!client || !user) return <Loader />;

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetail?.id}`;

  return (
<section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-4 w-full">
  {[
    {
      img: '/icons/add-meeting.svg',
      title: 'Instant Meeting',
      description: 'Start an instant meeting',
      className: '',
      onClick: () => setMeetingState('isInstantMeeting'),
    },
    {
      img: '/icons/join-meeting.svg',
      title: 'Join Meeting',
      description: 'via invitation link',
      className: 'bg-blue-1',
      onClick: () => setMeetingState('isJoiningMeeting'),
    },
    {
      img: '/icons/join-meeting.svg',
      title: 'Meeting Poll',
      description: 'create poll for meetings',
      className: 'bg-yellow-1',
      onClick: () => router.push('/poll'),
    },
    {
      img: '/icons/schedule.svg',
      title: 'Schedule Meeting',
      description: 'Plan your meeting',
      className: 'bg-purple-1',
      onClick: () => {
        localStorage.setItem('openScheduleAfterRefresh', 'true');
        window.location.reload();
      },
    },
    // {
    //   img: '/icons/recordings.svg',
    //   title: 'View Recordings',
    //   description: 'Meeting Recordings',
    //   className: 'bg-red-500',
    //   onClick: () => router.push('/recordings'),
    // },
  ].map((card, idx) => (
    <div key={idx} className="w-full h-64"> {/* increased height */}
      <HomeCard
        img={card.img}
        title={card.title}
        description={card.description}
        className={`h-full ${card.className}`}
        handleClick={card.onClick}
      />
    </div>
  ))}


      {/* Schedule Modal */}
      {!callDetail ? (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Schedule Meeting"
          handleClick={createMeeting}
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-medium text-sky-2">Title</label>
            <Input
              placeholder="Meeting title"
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-medium text-sky-2">Host Name</label>
            <Input
              value={hostName}
              disabled
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal text-sky-2">Description (optional)</label>
            <Textarea
              placeholder="Add a description"
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          </div>
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
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal text-sky-2">Select Date and Time</label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date) => setValues({ ...values, dateTime: date! })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded bg-dark-3 p-2 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal text-sky-2">Created At</label>
            <Input
              value={createdAt}
              disabled
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal text-sky-2">Duration (minutes)</label>
            <Input
              value="60"
              disabled
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Meeting Created"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({ title: 'Link Copied' });
          }}
          image="/icons/checked.svg"
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Copy Meeting Link"
        />
      )}

      {/* Join Meeting Modal */}
      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Type the link here"
        className="text-center"
        buttonText="Join Meeting"
        handleClick={() => router.push(values.link)}
      >
        <Input
          placeholder="Meeting link"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
          className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </MeetingModal>

      {/* Instant Meeting Modal */}
      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Start an Instant Meeting"
        className="text-center"
        buttonText="Start Meeting"
        handleClick={createMeeting}
      />
    </section>
  );
};

export default MeetingTypeList;
