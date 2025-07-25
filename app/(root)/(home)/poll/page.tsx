"use client";

import React, { useState, useEffect } from "react";
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

  const [priorityEmails, setPriorityEmails] = useState<string[]>([]);
  const [savedPoll, setSavedPoll] = useState<any>(null);

  useEffect(() => {
    if (user?.publicMetadata?.lastPoll) {
      setSavedPoll(user.publicMetadata.lastPoll);
    }
  }, [user]);

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\.com\s+/g, ".com, ");
    setEmails(value);
    setPriorityEmails([]); // reset checkboxes when email list changes
  };

  const handleCheckboxChange = (email: string) => {
    setPriorityEmails((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const sendInvitationsOnly = async () => {
    if (!user) return;

    const cleanEmails =
      emails.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [];

    try {
      const response = await fetch("https://syncmeetserver.vercel.app/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          time,
          emails: cleanEmails,
          priorityEmails,
          userId: user.id,
        }),
      });

      if (!response.ok) throw new Error("Server failed");

      toast({
        title: "Invitations Sent",
        description: "Poll sent and data saved successfully.",
      });

      setTitle("");
      setDescription("");
      setTime("");
      setEmails("");
      setPriorityEmails([]);

      setSavedPoll({
        title,
        description,
        time,
        emails: cleanEmails,
        priorityEmails,
        sentAt: new Date().toISOString(),
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to send poll." });
    }
  };

  const emailList = emails.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [];

  const [pollVotes, setPollVotes] = useState<any[]>([]);

useEffect(() => {
  if (savedPoll?.title) {
    fetch(`https://syncmeetserver.vercel.app/votes?title=${encodeURIComponent(savedPoll.title)}`)
      .then((res) => res.json())
      .then((data) => setPollVotes(data))
      .catch((err) => console.error("Error fetching votes:", err));
  }
}, [savedPoll]);


  return (
    <section className="flex flex-col size-full text-white gap-10">
      <div className="flex gap-10">
        <div className="w-2/3 flex flex-col gap-4">
          <h1 className="text-xl font-bold lg:text-3xl">Create Poll For Meeting</h1>

          <input
            type="text"
            placeholder="Enter meeting title"
            className="w-full rounded-md px-4 py-2 bg-dark-2 border border-gray-600"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="text"
            placeholder="Enter meeting description"
            className="w-full rounded-md px-4 py-2 bg-dark-2 border border-gray-600"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
  type="datetime-local"
  className="w-full rounded-md px-4 py-2 bg-dark-2 border border-gray-600"
  value={time}
  onChange={(e) => setTime(e.target.value)}
/>


          <input
            type="text"
            placeholder="email1@gmail.com email2@gmail.com"
            className="w-full rounded-md px-4 py-2 bg-dark-2 border border-gray-600"
            value={emails}
            onChange={handleEmailInput}
          />

          <Button className="mt-4 w-fit" onClick={sendInvitationsOnly}>
            Send Poll
          </Button>
        </div>

        <div className="w-1/3 pl-4 border-l border-gray-600">
          <h2 className="text-lg font-semibold mb-4">Most Priority Users</h2>
          <div className="flex flex-wrap gap-2">
            {emailList.map((email, i) => (
              <label
                key={i}
                className="flex items-center gap-2 bg-dark-2 px-3 py-2 rounded-md border border-gray-500"
              >
                <input
                  type="checkbox"
                  checked={priorityEmails.includes(email)}
                  onChange={() => handleCheckboxChange(email)}
                  className="accent-blue-500"
                />
                <span className="text-sm">{email}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {savedPoll && (
        <div className="mt-10 p-6 bg-dark-2 border border-gray-600 rounded-lg w-full">
          <h2 className="text-lg font-bold mb-4">Your Last Created Poll</h2>
          <p><strong>Title:</strong> {savedPoll.title}</p>
          <p><strong>Description:</strong> {savedPoll.description}</p>
          <p><strong>Time:</strong> {savedPoll.time}</p>
          <p><strong>Sent At:</strong> {new Date(savedPoll.sentAt).toLocaleString()}</p>
          <p className="mt-2"><strong>All Emails:</strong></p>
          <ul className="list-disc list-inside">
            {savedPoll.emails?.map((e: string, i: number) => <li key={i}>{e}</li>)}
          </ul>
          {savedPoll.priorityEmails?.length > 0 && (
            <>
              <p className="mt-4"><strong>Priority Emails:</strong></p>
              <ul className="list-disc list-inside">
                {savedPoll.priorityEmails.map((e: string, i: number) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </>
          )}

          {pollVotes.length > 0 && (
  <div className="mt-6 bg-dark-2 p-6 border border-gray-600 rounded-lg">
    <h3 className="text-lg font-semibold mb-2">Current Votes</h3>
    <ul className="list-disc list-inside">
      {pollVotes.map((vote, i) => (
        <li key={i}>
          <strong>{vote.email}</strong> voted for <strong>{vote.time}</strong> ({vote.count}x)
        </li>
      ))}
    </ul>
  </div>
)}
{pollVotes.length > 0 && (() => {
  const timeCounts: Record<string, number> = {};
  const votesByTime: Record<string, string[]> = {};

  pollVotes.forEach(({ time, email }) => {
    timeCounts[time] = (timeCounts[time] || 0) + 1;
    votesByTime[time] = [...(votesByTime[time] || []), email];
  });

  const maxVotes = Math.max(...Object.values(timeCounts));
  const mostVotedTimes = Object.keys(timeCounts).filter(
    (time) => timeCounts[time] === maxVotes
  );

  // Tie-breaker logic
  let finalTime = mostVotedTimes[0];
  if (mostVotedTimes.length > 1 && savedPoll?.priorityEmails?.length > 0) {
    for (const time of mostVotedTimes) {
      const emails = votesByTime[time];
      if (emails.some((email) => savedPoll.priorityEmails.includes(email))) {
        finalTime = time;
        break;
      }
    }
  }

  return (
    <div className="mt-6 bg-dark-2 p-6 border border-gray-600 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🗓️ Summary of Votes</h3>
      <ul className="list-disc list-inside mb-4">
        {Object.entries(timeCounts).map(([time, count]) => (
          <li key={time}>
            <strong>{time}</strong>: {count} vote{count > 1 ? "s" : ""}
          </li>
        ))}
      </ul>

      <p className="text-green-400 font-semibold">
        ✅ Final Selected Time: <span className="underline">{finalTime}</span>
      </p>

      {mostVotedTimes.length > 1 && (
        <p className="text-sm text-yellow-300 mt-1 italic">
          (Tie resolved using priority email votes)
        </p>
      )}
    </div>
  );
})()}


        </div>
      )}
    </section>
  );
};

export default PersonalRoom;
