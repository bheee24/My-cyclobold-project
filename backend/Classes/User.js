// ✅ LOAD ENVIRONMENT VARIABLES
require("dotenv").config(); // Loads variables from .env file into process.env

// ✅ IMPORT DEPENDENCIES
const bcrypt = require("bcrypt"); // For hashing passwords
const nodemailer = require("nodemailer"); // For sending emails
const mongoose = require("mongoose"); // For MongoDB object modeling
const twilio = require("twilio"); // For sending SMS messages
const jwt = require("jsonwebtoken"); // (Unused here) For generating tokens, typically used in auth flows

// ✅ CONNECT TO MONGODB USING MONGOOSE
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fydznxg.mongodb.net/test?retryWrites=true&w=majority`;
mongoose.connect(uri)
  .then(() => console.log("✅ Connected"))
  .catch(err => console.error("❌ Connection error:", err.message));

// ✅ DEFINE MONGOOSE USER SCHEMA
const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: { type: String, unique: true }, // Unique email per user
  password: String,
  phone: String,
  otp: String,
  otpExpiresAt: Date,
  user_role: { type: Number, default: 0 }, // 0 = default user, others can be admin, etc.
  is_email_verified: { type: Boolean, default: false }, // Email verification flag
});

// ✅ CREATE USER MODEL
const UserModel = mongoose.model("BHEE", userSchema);

// ✅ IMPORT OTP MODEL FOR TEMP OTP STORAGE
const OtpModel = require("./otpStore"); // Ensure the file exists and exports a valid Mongoose model

// ✅ DEFINE USER CLASS TO HANDLE USER LOGIC
class User {
  constructor() {
    // Initialize email transporter (SMTP settings)
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    // Initialize Twilio client
    this.twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  // ✅ Register a new user
  async register(firstname, lastname, email, password, phone) {
    try {
      // Check if user already exists
      const exists = await UserModel.findOne({ email });
      if (exists) return { message: "User exists", code: "error", data: null };

      // Hash password before storing
      const hashed = await bcrypt.hash(password, 10);

      // Create new user document
      const user = new UserModel({
        firstname,
        lastname,
        email,
        password: hashed,
        phone,
        is_email_verified: false,
      });

      // Save user to database
      await user.save();

      // Send verification email
      const emailSent = await this.transporter.sendMail({
        from: '"Sparkles" <no-reply@Sparkles.com>',
        to: email,
        subject: `Thanks for registering, ${firstname}!`,
        html: `
          <h3>Hello ${firstname} ${lastname},</h3>
          <p>Welcome to Sparkles!</p>
          <a href="http://${process.env.APP_HOST}:${process.env.APP_PORT}/verify_registration_email?email=${email}">
            Verify Email
          </a>
        `,
      });

      // Return result based on email status
      return emailSent
        ? { message: "Check inbox for verification email", code: "success", data: null }
        : { message: "Could not send verification email", code: "error", data: null };

    } catch (error) {
      console.error("Register error:", error);
      return { message: "An error occurred", code: "error", error: error.message };
    }
  }

  // ✅ Check validity of registration parameters
  check_registration_params(firstname, lastname, email, password, phone) {
    let errors = [];
    if (!firstname) errors.push("Invalid firstname");
    if (!lastname) errors.push("Invalid lastname");
    if (!email) errors.push("Invalid email");
    if (!password) errors.push("Invalid password");
    // if (!phone) errors.push("invalid phone")

    return errors.length
      ? { message: "Form errors", error: errors, code: "error" }
      : { message: "All fields valid", code: "success" };
  }

  // ✅ Handle email verification link
  async verify_registration_email(email) {
    const user = await UserModel.findOne({ email });
    if (!user) return { message: "User not found", code: "error" };
    if (user.is_email_verified) return { message: "Email already verified", code: "invalid-details" };

    user.is_email_verified = true;
    await user.save();

    return { message: "Email verified successfully", code: "success" };
  }

  // ✅ Retrieve hashed password for a user (utility)
  async retrieveUserPassword(email) {
    const user = await UserModel.findOne({ email });
    return user ? user.password : null;
  }

  // ✅ Log in user
  async loginUser(email, password) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return { message: "User not found", code: "error", data: null };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { message: "Incorrect password", code: "error", data: null };
    }

    // OPTIONAL: If already verified, bypass OTP (currently disabled)
    // if (user.is_email_verified) {
    //   return {
    //     message: "Login successful",
    //     code: "success",
    //     data: {
    //       firstname: user.firstname,
    //       lastname: user.lastname,
    //       email: user.email,
    //       id: user._id
    //     }
    //   };
    // }

    // ✅ Generate and send OTP
    const otp = this.generateOTP();
    const phoneFormatted = this.formatPhone(user.phone);
    const otpSendResult = await this.sendOTP(phoneFormatted, otp);

    if (otpSendResult.code === "success") {
      // Save OTP to DB
      await OtpModel.create({ email: user.email, otp });

      console.log("Sending OTP to:", phoneFormatted);

      return {
        message: "OTP sent to phone",
        code: "otp-sent",
        data: {
          email: user.email,
          phone: phoneFormatted
        }
      };
    } else {
      return otpSendResult; // return Twilio error
    }
  }

  // ✅ Verify user-entered OTP
  async verifyOtp(email, otp) {
    const otpDoc = await OtpModel.findOne({ email, otp });
    if (!otpDoc) {
      return { message: "Invalid or expired OTP", code: "otp-invalid", data: null };
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return { message: "User not found", code: "error", data: null };
    }

    // Mark user as verified and clean up OTP
    user.is_email_verified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // Delete used OTP
    await OtpModel.deleteMany({ email });

    return {
      message: "OTP verified successfully",
      code: "otp-verified",
      data: {
        firstname: user.firstname,
      },
    };
  }

  // ✅ Send OTP via Twilio SMS
  async sendOTP(phone, otp) {
    try {
      await this.twilioClient.messages.create({
        body: `Your Sparkles code is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      return {
        message: "OTP sent successfully",
        code: "success",
        data: null,
      };
    } catch (err) {
      console.error("❌ Twilio error:", err.message);
      return {
        message: "Failed to send OTP",
        code: "twilio-error",
        data: null,
      };
    }
  }

  // ✅ Generate random 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Ensures 6-digit OTP
  }

  // ✅ Format phone number to international format
  formatPhone(phone) {
    if (phone.startsWith("0")) {
      return "+234" + phone.slice(1); // For Nigeria
    }
    return phone.startsWith("+") ? phone : "+1" + phone; // Default to US if no country code
  }

  // ✅ Resend new OTP to user
  async resendOtp(email) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return { message: "User not found", code: "error", data: null };
    }

    const otp = this.generateOTP();
    const phoneFormatted = this.formatPhone(user.phone);
    const otpSendResult = await this.sendOTP(phoneFormatted, otp);

    if (otpSendResult.code === "success") {
      await OtpModel.deleteMany({ email: user.email }); // 🧹 Clear old OTPs
      await OtpModel.create({ email: user.email, otp }); // 💾 Store new OTP

      return {
        message: "New OTP sent successfully",
        code: "otp-sent",
        data: {
          email: user.email,
          phone: phoneFormatted,
        },
      };
    } else {
      return otpSendResult;
    }
  }
}

// ✅ EXPORT USER CLASS FOR USE IN OTHER FILES
module.exports = User;
