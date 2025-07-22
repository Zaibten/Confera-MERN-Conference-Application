"use client";

import React, { useState } from 'react';
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const PersonalRoom = () => {
  const { user } = useUser();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [emails, setEmails] = useState("");

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\.com\s+/g, ".com, ");
    setEmails(value);
  };

  const sendInvitationsOnly = async () => {
    if (!user) return;

    const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${user.id}?personal=true`;
    const cleanEmails =
      emails.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [];

    try {
      await fetch("http://localhost:5000/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          time,
          emails: cleanEmails,
          meetingLink,
        }),
      });

      toast({
        title: "Invitations Sent",
        description: "Emails were successfully sent!",
      });

      setTitle("");
      setDescription("");
      setTime("");
      setEmails("");
    } catch (err) {
      toast({ title: "Error", description: "Failed to send emails." });
    }
  };

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-xl font-bold lg:text-3xl">Create Poll For Meeting</h1>
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-white">Meeting Title</p>
          <input
            type="text"
            placeholder="Enter meeting title"
            className="w-full rounded-md border border-gray-600 bg-dark-2 px-4 py-2 text-white placeholder:text-gray-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-white">Description</p>
          <input
            type="text"
            placeholder="Enter meeting description"
            className="w-full rounded-md border border-gray-600 bg-dark-2 px-4 py-2 text-white placeholder:text-gray-400"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-white">Time</p>
          <input
            type="time"
            className="w-full rounded-md border border-gray-600 bg-dark-2 px-4 py-2 text-white"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-white">Emails</p>
          <input
            type="text"
            placeholder="example1@gmail.com example2@gmail.com"
            className="w-full rounded-md border border-gray-600 bg-dark-2 px-4 py-2 text-white placeholder:text-gray-400"
            value={emails}
            onChange={handleEmailInput}
          />
          <p className="mt-1 text-xs text-gray-400">
            Separate emails using &quot;.com&quot; and a space – it will auto-format.
          </p>
        </div>

        <Button className="mt-4 w-fit" onClick={sendInvitationsOnly}>
          Sent Poll
        </Button>
      </div>
    </section>
  );
};

export default PersonalRoom;
