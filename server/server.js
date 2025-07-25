const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();
const { Clerk } = require("@clerk/clerk-sdk-node");


const app = express();

// ✅ CORS for local and production
// app.use(cors({
//   origin: [
//     "http://localhost:3000",
//     "https://syncmeet-six.vercel.app"
//   ],
//   methods: ["GET", "POST", "OPTIONS"],
//   allowedHeaders: ["Content-Type"],
//   credentials: true
// }));


// ✅ Allow all OPTIONS requests to respond with proper headers
app.options('*', (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// ✅ CORS middleware (keep only this one)
app.use(cors({
  origin: ["http://localhost:3000", "https://syncmeet-six.vercel.app"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
}));

app.use(express.json());

// Optional: fallback headers (but not required if cors() is configured right)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.get("/", (req, res) => {
  res.status(200).send("🟢 Sync Meet API is running.");
});


// Clerk Backend Setup
const clerk = new Clerk({ apiKey: process.env.CLERK_SECRET_KEY });

app.post("/send-email", async (req, res) => {
  let { title, description, time, emails, priorityEmails, userId } = req.body;

  if (!emails || emails.length === 0) {
    return res.status(400).json({ error: "Email list is empty." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email to each recipient individually with personalized link
    for (const email of emails) {
      const mailOptions = {
        from: `"Sync Meet" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: `📊 Schedule Poll: ${title} - Sync Meet`,
 html: `
  <div style="max-width: 650px; margin: auto; font-family: 'Segoe UI', sans-serif; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.07);">
    <div style="text-align: center;">
      <img src="https://img.freepik.com/premium-vector/round-zoom-logo-isolated-white-background_469489-904.jpg?semt=ais_hybrid&w=740" alt="Sync Meet Logo" style="width: 85px; height: 85px; border-radius: 50%; border: 3px solid #0f62fe;" />
      <h1 style="color: #0f62fe; font-size: 24px; margin: 20px 0 10px;">Sync Meet</h1>
    </div>

    <h2 style="color: #333; font-size: 20px; text-align: center; margin-bottom: 10px;">📊 Poll Invitation: ${title}</h2>

    <div style="margin-top: 30px; text-align: center;">
      <p style="font-size: 15px; color: #444; line-height: 1.6;">
        <strong>Description:</strong> ${description}<br/>
        <strong>Suggested Time:</strong> ${time}<br/>
        Please vote for your preferred meeting time by clicking below.
      </p>
    </div>

    <div style="margin-top: 20px; text-align: center;">
      <a href="http://localhost:3000/vote?email=${encodeURIComponent(email)}&title=${encodeURIComponent(title)}" target="_blank"
        style="background-color: #0f62fe; color: white; padding: 12px 20px; border-radius: 30px; font-weight: bold; text-decoration: none; display: inline-block; animation: pulse 2s infinite;">
        🗳️ Vote Now
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />

    <footer style="text-align: center; font-size: 12px; color: #aaa;">
      <p>You received this poll invitation from <strong>Sync Meet</strong>.</p>
      <p style="margin-top: 4px;">&copy; ${new Date().getFullYear()} Sync Meet. All rights reserved.</p>
    </footer>
  </div>

  <style>
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(15, 98, 254, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(15, 98, 254, 0); }
      100% { box-shadow: 0 0 0 0 rgba(15, 98, 254, 0); }
    }
  </style>
`,

      };

      await transporter.sendMail(mailOptions);
    }

    // Save poll metadata
    if (userId) {
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          lastPoll: {
            title,
            description,
            time,
            emails,
            priorityEmails,
            sentAt: new Date().toISOString(),
          },
        },
      });
    }

    res.status(200).json({ message: "Poll emails sent and saved successfully." });
  } catch (err) {
    console.error("Send/save error:", err);
    res.status(500).json({ error: "Failed to send email or save data." });
  }
});


const votes = {}; // In-memory storage; replace with DB in production

app.post("/vote", async (req, res) => {
  const { email, title, time } = req.body;

  if (!email || !title || !time) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const key = `${title}-${email}`;
  if (!votes[key]) {
    votes[key] = { email, title, time, count: 1 };
  } else {
    votes[key].time = time; // update time if changed
    votes[key].count += 1;
  }

  console.log("Votes:", votes);

  return res.status(200).json({ message: "Vote recorded" });
});

app.get("/votes", (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const pollVotes = Object.values(votes).filter((v) => v.title === title);
  res.status(200).json(pollVotes);
});



app.post("/send-scheduleemail", async (req, res) => {
  let { title, description, time, emails, meetingLink } = req.body;

  if (!emails || emails.length === 0) {
    return res.status(400).json({ error: "Email list is empty." });
  }

  if (typeof emails === "string") {
    emails = emails.replace(/\.com\s+/g, ".com,");
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Sync Meet" <${process.env.SMTP_EMAIL}>`,
      to: emails,
      subject: `📅 Scheduled Meeting: ${title} - Sync Meet`,
      html: `
        <div style="max-width: 650px; margin: auto; font-family: 'Segoe UI', sans-serif; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.07);">
          <div style="text-align: center;">
            <img src="https://img.freepik.com/premium-vector/round-zoom-logo-isolated-white-background_469489-904.jpg?semt=ais_hybrid&w=740" alt="Sync Meet Logo" style="width: 85px; height: 85px; border-radius: 50%; border: 3px solid #0f62fe;" />
            <h1 style="color: #0f62fe; font-size: 24px; margin: 20px 0 10px;">Sync Meet</h1>
          </div>

          <h2 style="color: #333; font-size: 20px; text-align: center; margin-bottom: 10px;">📅 Scheduled Meeting: ${title}</h2>

          <div style="margin-top: 30px; text-align: center;">
            <p style="font-size: 15px; color: #444; line-height: 1.6;">
              You are invited to attend the scheduled meeting.<br />
              Click the button below to join when the time comes.
            </p>
          </div>

          <div style="margin-top: 20px; text-align: center;">
            <a href="${meetingLink}" target="_blank" style="background-color: #0f62fe; color: white; padding: 12px 20px; border-radius: 30px; font-weight: bold; text-decoration: none; display: inline-block;">
              👉 Join Meeting
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />

          <footer style="text-align: center; font-size: 12px; color: #aaa;">
            <p>You received this email because you were invited to a meeting via <strong>Sync Meet</strong>.</p>
            <p style="margin-top: 4px;">&copy; ${new Date().getFullYear()} Sync Meet. All rights reserved.</p>
          </footer>
        </div>

        <style>
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(15, 98, 254, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(15, 98, 254, 0); }
            100% { box-shadow: 0 0 0 0 rgba(15, 98, 254, 0); }
          }
        </style>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Schedule email sent successfully." });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ error: "Failed to send email." });
  }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
