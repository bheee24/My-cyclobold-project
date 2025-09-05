// ✅ LOAD ENVIRONMENT VARIABLES
require("dotenv").config(); // makes .env variables available

// ✅ IMPORT DEPENDENCIES
const bcrypt = require("bcrypt");          // password hashing
const nodemailer = require("nodemailer");  // send emails
const mongoose = require("mongoose");      // MongoDB modeling
const twilio = require("twilio");          // SMS OTP
const jwt = require("jsonwebtoken");       // token creation

// ✅ CONNECT TO MONGODB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fydznxg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
mongoose.connect(uri)
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ DB connection failed:", err.message));

// ✅ USER SCHEMA
const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: { type: String, unique: true }, // unique email only
  password: String,
  phone: String,
  user_role: { type: Number, default: 0 }, // 0 = normal user
  is_email_verified: { type: Boolean, default: false }, // email verify status
});

// ✅ USER MODEL
const UserModel = mongoose.model("BHEE", userSchema);

// ✅ OTP MODEL
const OtpModel = require("./otpStore"); // handles temp OTP store

// ✅ USER CLASS (all user-related logic lives here)
class User {
  constructor() {
    // email setup
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    // twilio setup
    this.twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  // ✅ 1. Validate registration input
  check_registration_params(firstname, lastname, email, password, phone) {
    let errors = [];
    if (!firstname) errors.push("Invalid firstname");
    if (!lastname) errors.push("Invalid lastname");
    if (!email) errors.push("Invalid email");
    if (!password) errors.push("Invalid password");
    // if (!phone) errors.push("Invalid phone");

    return errors.length
      ? { message: "Form errors", error: errors, code: "error" }
      : { message: "All fields valid", code: "success" };
  }

  // ✅ 2. Register new user
  async register(firstname, lastname, email, password, phone) {
    try {
      // check if user exists
      const exists = await UserModel.findOne({ email });
      if (exists) return { message: "User exists", code: "error" };

      // hash password
      const hashed = await bcrypt.hash(password, 10);

      // save new user
      const user = new UserModel({
        firstname,
        lastname,
        email,
        password: hashed,
        phone,
        is_email_verified: false,
      });
      await user.save();

      // send verification email
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

      return emailSent
        ? { message: "Check inbox for verification email", code: "success" }
        : { message: "Could not send verification email", code: "error" };

    } catch (error) {
      console.error("Register error:", error);
      return { message: "An error occurred", code: "error", error: error.message };
    }
  }

  // ✅ 3. Verify email from link
  async verify_registration_email(email) {
    const user = await UserModel.findOne({ email });
    if (!user) return { message: "User not found", code: "error" };
    if (user.is_email_verified) return { message: "Email already verified", code: "invalid-details" };

    user.is_email_verified = true;
    await user.save();
    return { message: "Email verified successfully", code: "success" };
  }

  // ✅ 4. User login
  async loginUser(email, password) {
    const user = await UserModel.findOne({ email });
    if (!user) return { message: "User not found", code: "error" };

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return { message: "Incorrect password", code: "error" };

    // generate OTP and send
    const otp = this.generateOTP();
    const phoneFormatted = this.formatPhone(user.phone);
    const otpSendResult = await this.sendOTP(phoneFormatted, otp);

    if (otpSendResult.code === "success") {
      await OtpModel.create({ email: user.email, otp }); // save otp
      return {
        message: "OTP sent to phone",
        code: "otp-sent",
        data: { email: user.email, phone: phoneFormatted },
      };
    } else {
      return otpSendResult;
    }
  }

  // ✅ 5. Verify OTP
  async verifyOtp(email, otp) {
    const otpDoc = await OtpModel.findOne({ email, otp });
    if (!otpDoc) return { message: "Invalid or expired OTP", code: "otp-invalid" };

    const user = await UserModel.findOne({ email });
    if (!user) return { message: "User not found", code: "error" };

    user.is_email_verified = true;
    await user.save();
    await OtpModel.deleteMany({ email }); // cleanup

    // issue JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.user_role },
      process.env.JWT_SECRET || "defaultSecretKey",
      { expiresIn: "1h" }
    );

    return {
      message: "OTP verified successfully",
      code: "otp-verified",
      data: { firstname: user.firstname, email: user.email, token },
    };
  }

  // ✅ 6. Resend OTP
  async resendOtp(email) {
    const user = await UserModel.findOne({ email });
    if (!user) return { message: "User not found", code: "error" };

    const otp = this.generateOTP();
    const phoneFormatted = this.formatPhone(user.phone);
    const otpSendResult = await this.sendOTP(phoneFormatted, otp);

    if (otpSendResult.code === "success") {
      await OtpModel.deleteMany({ email }); // clear old
      await OtpModel.create({ email, otp }); // save new
      return { message: "New OTP sent", code: "otp-sent", data: { email, phone: phoneFormatted } };
    } else {
      return otpSendResult;
    }
  }

  // ✅ 7. Reset password
  async resetPassword(email, newPassword) {
    const user = await UserModel.findOne({ email });
    if (!user) return { message: "User not found", code: "error" };

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { message: "Password updated", code: "success" };
  }

  // ========== HELPER METHODS ==========

  // send OTP SMS
  async sendOTP(phone, otp) {
    try {
      await this.twilioClient.messages.create({
        body: `Your Sparkles code is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      return { message: "OTP sent successfully", code: "success" };
    } catch (err) {
      console.error("❌ Twilio error:", err.message);
      return { message: "Failed to send OTP", code: "twilio-error" };
    }
  }

  // generate random 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // format phone numbers
  formatPhone(phone) {
    if (phone.startsWith("0")) return "+234" + phone.slice(1); // Nigeria
    return phone.startsWith("+") ? phone : "+1" + phone;       // fallback: US
  }

  // get password hash (utility)
  async retrieveUserPassword(email) {
    const user = await UserModel.findOne({ email });
    return user ? user.password : null;
  }
}

// ✅ EXPORT
module.exports = User;
