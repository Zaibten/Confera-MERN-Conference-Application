// server.js
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/send-email", async (req, res) => {
  let { title, description, time, emails } = req.body;

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
      from: `"Skill Sync" <${process.env.SMTP_EMAIL}>`,
      to: emails,
      subject: `📊 Schedule Poll: ${title} - Skill Sync`,
      html: `
        <div style="max-width: 650px; margin: auto; font-family: 'Segoe UI', sans-serif; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.07);">
          <div style="text-align: center;">
            <img src="https://img.freepik.com/premium-vector/round-zoom-logo-isolated-white-background_469489-904.jpg?semt=ais_hybrid&w=740" alt="Skill Sync Logo" style="width: 85px; height: 85px; border-radius: 50%; border: 3px solid #0f62fe;" />
            <h1 style="color: #0f62fe; font-size: 24px; margin: 20px 0 10px;">Skill Sync</h1>
          </div>

          <h2 style="color: #333; font-size: 20px; text-align: center; margin-bottom: 10px;">📅 Poll Invitation: ${title}</h2>
          <p style="font-size: 15px; color: #555; text-align: center;">Discription: ${description}</p>
          <p style="font-size: 14px; color: #888; text-align: center;"><strong>Suggested Time Slot:</strong> ${time}</p>

          <div style="margin-top: 30px; text-align: center;">
            <p style="font-size: 15px; color: #444; line-height: 1.6;">
              Please reply to this email with your <strong>preferred time slot</strong> or any suggestions.<br />
              We are collecting responses to finalize a meeting schedule that works best for everyone.
            </p>
          </div>

          <div style="margin: 40px 0; text-align: center;">
            <span style="display: inline-block; background: #0f62fe; color: white; padding: 12px 24px; border-radius: 30px; font-weight: 600; animation: pulse 2s infinite; text-decoration: none;">
              Reply With Your Time
            </span>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />

          <footer style="text-align: center; font-size: 12px; color: #aaa;">
            <p>This is a schedule poll email from <strong>Skill Sync</strong>.</p>
            <p style="margin-top: 4px;">&copy; ${new Date().getFullYear()} Skill Sync. All rights reserved.</p>
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
    res.status(200).json({ message: "Poll email sent successfully." });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ error: "Failed to send email." });
  }
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
      from: `"Skill Sync" <${process.env.SMTP_EMAIL}>`,
      to: emails,
      subject: `📅 Scheduled Meeting: ${title} - Skill Sync`,
      html: `
        <div style="max-width: 650px; margin: auto; font-family: 'Segoe UI', sans-serif; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.07);">
          <div style="text-align: center;">
            <img src="https://img.freepik.com/premium-vector/round-zoom-logo-isolated-white-background_469489-904.jpg?semt=ais_hybrid&w=740" alt="Skill Sync Logo" style="width: 85px; height: 85px; border-radius: 50%; border: 3px solid #0f62fe;" />
            <h1 style="color: #0f62fe; font-size: 24px; margin: 20px 0 10px;">Skill Sync</h1>
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
            <p>You received this email because you were invited to a meeting via <strong>Skill Sync</strong>.</p>
            <p style="margin-top: 4px;">&copy; ${new Date().getFullYear()} Skill Sync. All rights reserved.</p>
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
