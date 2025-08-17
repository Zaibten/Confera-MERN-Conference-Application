"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function VotePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const title = searchParams.get("title");
  const time1 = searchParams.get("time1");
  const time2 = searchParams.get("time2");

  // Store selected time
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!email || !title || !selectedTime) return;

    await fetch("https://syncmeetserver.vercel.app/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, title, time: selectedTime }),
    });

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white bg-black">
      <h1 className="text-2xl font-bold mb-6">Vote for: {title}</h1>

      {submitted ? (
        <p className="text-green-400">✅ Thank you! Your vote has been recorded.</p>
      ) : (
        <div className="flex flex-col gap-4 w-full max-w-md">
          {/* Time 1 */}
          <label className="flex flex-col">
            <span className="mb-1 text-gray-300">Time Slot 1</span>
            <input
              type="text"
              readOnly
              value={time1 ?? ""}
              onClick={() => setSelectedTime(time1 ?? "")}
              className={`p-2 rounded border ${
                selectedTime === time1 ? "border-blue-500" : "border-gray-600"
              } bg-gray-800 cursor-pointer`}
            />
          </label>

          {/* Time 2 */}
          <label className="flex flex-col">
            <span className="mb-1 text-gray-300">Time Slot 2</span>
            <input
              type="text"
              readOnly
              value={time2 ?? ""}
              onClick={() => setSelectedTime(time2 ?? "")}
              className={`p-2 rounded border ${
                selectedTime === time2 ? "border-blue-500" : "border-gray-600"
              } bg-gray-800 cursor-pointer`}
            />
          </label>

          <button
            onClick={handleSubmit}
            disabled={!selectedTime}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Submit Vote
          </button>
        </div>
      )}
    </div>
  );
}
