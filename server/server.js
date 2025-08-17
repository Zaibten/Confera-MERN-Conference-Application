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
  let { title, description, time, time2, emails, priorityEmails, userId } = req.body;

function formatDateTime(dateString) {
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  let hours = d.getHours();
  let minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  // ✅ If minutes are 0 → hide them
  const timePart = minutes === 0 ? `${hours}${ampm}` : `${hours}:${String(minutes).padStart(2, "0")} ${ampm}`;

  return `${year}-${month}-${day} ${timePart}`;
}


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

    for (const email of emails) {
      const mailOptions = {
        from: `"Sync Meet" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: `📊 Schedule Poll: ${title} - Sync Meet`,
html: `
  <div style="max-width: 650px; margin: auto; font-family: 'Segoe UI', sans-serif; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.07);">
    <div style="text-align: center;">
      <img src="https://res.cloudinary.com/dh7kv5dzy/image/upload/v1755405726/logo_oqjbro.png" alt="Sync Meet Logo" style="width: 85px; height: 85px; border-radius: 50%; border: 3px solid #0f62fe;" />
      <h1 style="color: #0f62fe; font-size: 24px; margin: 20px 0 10px;">Sync Meet</h1>
    </div>

    <h2 style="color: #333; font-size: 20px; text-align: center; margin-bottom: 10px;">📊 Poll Invitation: ${title}</h2>

    <div style="margin-top: 30px; text-align: center;">
      <p style="font-size: 15px; color: #444; line-height: 1.6;">
        <strong>Description:</strong> ${description}<br/>
        <strong>Suggested Times:</strong><br/>
        🕒 Time Slot 1: ${time}<br/>
        🕒 Time Slot 2: ${time2}<br/>
        <br/>
        Please vote for your preferred meeting time by clicking below.
      </p>
    </div>

    <div style="margin-top: 20px; text-align: center;">
  <a href="https://syncmeet-six.vercel.app/vote?email=${encodeURIComponent(email)}&title=${encodeURIComponent(title)}&time1=${encodeURIComponent(formatDateTime(time))}&time2=${encodeURIComponent(formatDateTime(time2))}" 
     target="_blank"
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

    // ✅ Save poll metadata
    if (userId) {
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          lastPoll: {
            title,
            description,
            time: formatDateTime(time),
            time2: formatDateTime(time2),
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


app.post("/send-meeting-invite", async (req, res) => {
  let { title, description, time, meetingLink, emails } = req.body;

  if (!emails || emails.length === 0) {
    return res.status(400).json({ error: "Email list is empty." });
  }

  try {
    // Configure transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send to each recipient
    for (const email of emails) {
      const mailOptions = {
        from: `"Sync Meet" <${process.env.SMTP_EMAIL}>`,
        to: email.trim(),
        subject: `📅 Meeting Invitation: ${title} - Sync Meet`,
        html: `
  <div style="max-width: 650px; margin: auto; font-family: 'Segoe UI', sans-serif; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.07);">
    <div style="text-align: center;">
      <img src="https://res.cloudinary.com/dh7kv5dzy/image/upload/v1755405726/logo_oqjbro.png" alt="Sync Meet Logo" style="width: 85px; height: 85px; border-radius: 50%; border: 3px solid #0f62fe;" />
      <h1 style="color: #0f62fe; font-size: 24px; margin: 20px 0 10px;">Sync Meet</h1>
    </div>

    <h2 style="color: #333; font-size: 20px; text-align: center; margin-bottom: 10px;">📅 Meeting Scheduled: ${title}</h2>

    <div style="margin-top: 30px; text-align: center;">
      <p style="font-size: 15px; color: #444; line-height: 1.6;">
        <strong>Description:</strong> ${description}<br/>
        <strong>Time:</strong> ${time}<br/>
      </p>
    </div>

    <div style="margin-top: 20px; text-align: center;">
      <a href="${meetingLink}" target="_blank"
        style="background-color: #0f62fe; color: white; padding: 12px 20px; border-radius: 30px; font-weight: bold; text-decoration: none; display: inline-block; animation: pulse 2s infinite;">
        🔗 Join Meeting
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />

    <footer style="text-align: center; font-size: 12px; color: #aaa;">
      <p>You received this meeting invitation from <strong>Sync Meet</strong>.</p>
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

    res.status(200).json({ message: "Meeting invites sent successfully." });
  } catch (err) {
    console.error("Email sending error:", err);
    res.status(500).json({ error: "Failed to send meeting invites." });
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

  // ✅ Ensure meetingLink starts with http:// or https://
  if (meetingLink && !/^https?:\/\//i.test(meetingLink)) {
    meetingLink = `http://${meetingLink}`;
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
            <img src="https://res.cloudinary.com/dh7kv5dzy/image/upload/v1755405726/logo_oqjbro.png" alt="Sync Meet Logo" style="width: 85px; height: 85px; border-radius: 50%; border: 3px solid #0f62fe;" />
            <h1 style="color: #0f62fe; font-size: 24px; margin: 20px 0 10px;">Sync Meet</h1>
          </div>

          <h2 style="color: #333; font-size: 20px; text-align: center; margin-bottom: 10px;">📅 Scheduled Meeting: ${title}</h2>

          <p style="font-size: 16px; color: #333; margin: 10px 0; line-height: 1.6;">
  <strong style="color: #0f62fe;">📄 Description:</strong> ${description}
</p>

<p style="font-size: 16px; color: #333; margin: 10px 0; line-height: 1.6;">
  <strong style="color: #0f62fe;">⏰ Time:</strong> ${time}
</p>

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
