// ✅ REQUIRE DEPENDENCIES
const express = require("express");
const cors = require("cors");
const https = require("https");
const dotenv = require("dotenv").config();
const path = require("path");
// ✅ CREATE EXPRESS SERVER INSTANCE
const Server = express();

// ✅ USE MIDDLEWARES
Server.use(express.json());
Server.use(cors());
Server.use(express.static(path.join(__dirname, "frontend")));
// ✅ IMPORT CLASSES
const UserClass = require("./Classes/User.js");
const user = new UserClass(); // User instance
const OtpModel = require("./Classes/otpStore.js"); // OTP MongoDB model

// ✅ ENV VARIABLES
const port = process.env.APP_PORT;
const host = process.env.APP_HOST;

// ===============================================================
// 🔐 REGISTER
// ===============================================================
Server.post('/register', async (req, res) => {
    const { firstname, lastname, email, password, phonenumber } = req.body;

    const feedback = user.check_registration_params(firstname, lastname, email, password);
    if (feedback.code === "error") return res.json(feedback);

    const result = await user.register(firstname, lastname, email, password, phonenumber);
    res.json(result);
});

// ===============================================================
// 🔓 LOGIN
// ===============================================================
// ✅ LOGIN USER
Server.post('/login-user', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Call your User.js class function
    const feedback = await user.loginUser(email, password);

    // 🔴 Wrong password OR user not found
    if (feedback.code === "error") {
      return res.status(401).json(feedback); // Unauthorized
    }

    // 🔴 OTP invalid (if you have that case)
    if (feedback.code === "otp-invalid") {
      return res.status(400).json(feedback); // Bad request
    }

    // 🟢 Successful login or OTP sent
    return res.status(200).json(feedback);

  } catch (err) {
    console.error("❌ /login-user error:", err.message);
    return res.status(500).json({
      message: "Internal Server Error",
      code: "error"
    });
  }
});


// ===============================================================
// 📩 EMAIL VERIFICATION
// ===============================================================
Server.get('/verify_registration_email', async (req, res) => {
    const user_email = req.query.email;
    if (!user_email) return res.json({ message: "Email required", code: "error" });
    
    const feedback = await user.verify_registration_email(user_email);
    res.json(feedback);
});

// ===============================================================
// 🔢 SEND OTP (after successful login)
// ===============================================================
Server.post("/send_otp", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.json({ message: "Email and password required", code: "error" });

        const loginFeedback = await user.loginUser(email, password);
        if (loginFeedback.code !== "success") return res.json(loginFeedback);

        const otpFeedback = await user.sendOtp(email); // method in your User class
        res.json(otpFeedback);
    } catch (err) {
        console.error("❌ /send_otp error:", err.message);
        res.status(500).json({ message: "Server Error", code: "error" });
    }
});

// ===============================================================
// ✅ VERIFY OTP
// ===============================================================
Server.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.json({ message: "Email and OTP required", code: "error" });

    const feedback = await user.verifyOtp(email.trim(), otp.trim());
    res.json(feedback);
});

// ===============================================================
// 🔁 RESEND OTP
// ===============================================================
Server.post("/resend-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required", code: "error" });

    const feedback = await user.resendOtp(email);
    res.json(feedback);
});

// ===============================================================
// 💳 CREATE PAYMENT PAGE (Paystack)
// ===============================================================
Server.post('/create-payment', async (req, res) => {
  const { amount, email, callback_url } = req.body;

  if (!amount || !email) {
    return res.json({ message: "Amount and email required", code: "error" });
  }

  // ✅ Prepare request payload
  const params = JSON.stringify({
    email,
    amount: amount * 100, // Convert to kobo here (no double conversion in frontend)
    callback_url: callback_url || `http://${process.env.HOST || 'localhost'}:3000/payment-success`
  });

  // ✅ Paystack initialize transaction request
  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  const payReq = https.request(options, payRes => {
    let data = '';
    payRes.on('data', chunk => data += chunk);
    payRes.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.status) {
          // ✅ Send Paystack authorization URL to frontend
          res.json({
            message: "Payment initialized",
            code: "success",
            data: {
              authorization_url: response.data.authorization_url,
              reference: response.data.reference
            }
          });
        } else {
          res.json({ message: response.message || "Payment init failed", code: "error" });
        }
      } catch (err) {
        console.error("❌ Paystack response parse error:", err);
        res.json({ message: "Invalid Paystack response", code: "error" });
      }
    });
  });

  payReq.on('error', err => {
    console.error("❌ Paystack request error:", err);
    res.json({ message: "Payment service unavailable", code: "error" });
  });

  payReq.write(params);
  payReq.end();
});

// ===============================================================
// 🔑 PASSWORD RESET FLOW
// ===============================================================

// 1️⃣ Request OTP
const crypto = require("crypto"); // make sure this is at the top

Server.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.json({ message: "Email required", code: "error" });

        // ✅ Generate secure random token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // ✅ Remove any previous tokens for this email
        await OtpModel.deleteMany({ email });

        // ✅ Save the new token with timestamp
        await OtpModel.create({
            email,
            otp: resetToken,
            createdAt: new Date()
        });

        // ✅ Construct the reset URL that opens the modal on the frontend
      ;
   ;
   const resetUrl = `http://127.0.0.1:5500/frontend/reset.html?token=${resetToken}&email=${email}`;

;

;

        // ✅ Send email with the reset link
        await user.transporter.sendMail({
            from: '"Sparkles" <no-reply@sparkles.com>',
            to: email,
            subject: "Password Reset Request",
            html: `
                <p>Hello,</p>
                <p>Click the link below to reset your password. This link expires in 5 minutes.</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>If you did not request this, you can safely ignore this email.</p>
            `
        });

        res.json({ message: "Password reset link sent to your email", code: "success" });
    } catch (err) {
        console.error("❌ forgot-password error:", err);
        res.status(500).json({ message: "Something went wrong", code: "error" });
    }
});



// 2️⃣ Reset Password
Server.post("/reset-password", async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword)
            return res.json({ message: "All fields required", code: "error" });

        // Find token in DB
        const tokenDoc = await OtpModel.findOne({ email, otp: token });
        if (!tokenDoc) return res.json({ message: "Invalid or expired link", code: "error" });

        // Reset user password
        const result = await user.resetPassword(email, newPassword);

        // Remove token after use
        await OtpModel.deleteMany({ email });

        res.json({ message: "Password reset successful", code: "success", data: result });

    } catch (err) {
        console.error("❌ /reset-password error:", err);
        res.status(500).json({ message: "Something went wrong", code: "error" });
    }
});


// ✅ Serve the frontend folder (static files)


// ✅ Route specifically for reset password page

Server.get("/reset-page", (req, res) => {
  const filePath = path.join(__dirname, "frontend", "reset.html");
  console.log("Serving reset page from:", filePath);
  res.sendFile(filePath, (err) => {
    if (err) console.error("Failed to send reset.html:", err);
  });
});





// ===============================================================
// 🚀 START SERVER
// ===============================================================
Server.listen(port, () => {
    console.log(`🚀 Server running on http://${host}:${port}`);
});
