"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function VotePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const title = searchParams.get("title");

  const [time, setTime] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email || !title || !time) return;

    await fetch("https://syncmeetserver.vercel.app/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, title, time }),
    });

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white bg-black">
      <h1 className="text-2xl font-bold mb-4">Vote for: {title}</h1>
      {submitted ? (
        <p className="text-green-400">Thank you! Your vote has been recorded.</p>
      ) : (
        <>
          <input
  type="datetime-local"
  className="p-2 border border-gray-600 bg-dark-2 rounded mb-4"
  value={time}
  onChange={(e) => setTime(e.target.value)}
/>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Submit Vote
          </button>
        </>
      )}
    </div>
  );
}
