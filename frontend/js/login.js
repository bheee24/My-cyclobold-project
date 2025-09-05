document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:3456";

  // ===== DOM ELEMENTS =====
  const loginForm = document.querySelector("#signInForm");
  const otpForm = document.querySelector("#otpForm");
  const countdownEl = document.querySelector("#countdown-id");
  const otpInput = document.querySelector("#otpInput");
  const otpSubmitBtn = document.querySelector("#otpSubmitBtn");
  const resendOtpBtn = document.querySelector("#resendOtpBtn");

  const forgotBtn = document.getElementById("forgotPasswordBtn");
  const forgotFeedback = document.getElementById("forgotFeedback");
  const forgotSection = document.getElementById("forgotPasswordSection");

  const resetForm = document.getElementById("resetPasswordForm");
  const resetEmailInput = document.getElementById("resetEmail");
  const resetTokenInput = document.getElementById("resetToken");
  const resetFeedback = document.getElementById("resetFeedback");
  const resetModalEl = document.getElementById("resetPasswordModal");

  const spinnerEl = document.getElementById("spinner-id"); // optional spinner element

  let tempEmail = "";
  let timerInterval;

  // ===== SPINNER =====
  const startSpinner = () => {
    if (!spinnerEl) return;
    spinnerEl.style.display = "inline-flex";
    spinnerEl.innerHTML = `<span>Please wait... <span class="spinner-border spinner-border-sm"></span></span>`;
  };
  const stopSpinner = (msg = "") => {
    if (!spinnerEl) return;
    spinnerEl.innerHTML = msg;
    if (!msg) spinnerEl.style.display = "none";
  };

  // ===== OTP TIMER =====
  const startOtpTimer = (seconds = 60) => {
    clearInterval(timerInterval);
    let timeLeft = seconds;
    countdownEl.classList.remove("text-danger");
    otpSubmitBtn.removeAttribute("disabled");
    resendOtpBtn.style.display = "none";
    resendOtpBtn.disabled = true;
    countdownEl.textContent = `OTP expires in ${timeLeft} seconds`;

    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        countdownEl.classList.add("text-danger");
        countdownEl.textContent = "OTP expired. Request a new one.";
        otpSubmitBtn.disabled = true;
        resendOtpBtn.style.display = "inline";
        resendOtpBtn.disabled = false;
      } else {
        countdownEl.textContent = `OTP expires in ${timeLeft} seconds`;
      }
    }, 1000);
  };

  // ===== LOGIN =====
  // ===== LOGIN =====
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value.trim();
  if (!email || !password) return;

  startSpinner();
  try {
    const res = await axios.post(`${API_URL}/login-user`, { email, password });

    if (res.data.code === "otp-sent") {
      stopSpinner(`<div class='alert alert-success p-2'>OTP sent to your phone</div>`);
      loginForm.style.display = "none";
      otpForm.style.display = "block";
      tempEmail = res.data.data.email;
      otpInput.value = "";
      otpSubmitBtn.disabled = false;
      startOtpTimer(60);

    } else if (res.data.code === "success") {
      stopSpinner();
      await localforage.setItem("_Sparkles_user", res.data.data);
      location.href = "/user.html";

    } else {
      stopSpinner(`<div class='alert alert-danger p-2'>${res.data.message || "Unexpected error"}</div>`);
    }
  } catch (err) {
  console.log("Login error:", err.response?.data); // Debugging

  let msg = err.response?.data?.message || "Invalid email or password";

  // 🔴 Instead of spinner, attach error to form directly
  const oldAlert = loginForm.querySelector(".alert-danger");
  if (oldAlert) oldAlert.remove(); // remove old alert if exists

  loginForm.insertAdjacentHTML(
    "beforeend",
    `<div class='alert alert-danger p-2 mt-2 w-100'>${msg}</div>`
  );

  stopSpinner(); // just stop loading, don’t overwrite with hidden div
}

});


  // ===== VERIFY OTP =====
  otpForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const otp = otpInput.value.trim();
    if (!otp) return stopSpinner(`<div class='alert alert-danger p-2'>OTP is required</div>`);

    startSpinner();
    try {
      const res = await axios.post(`${API_URL}/verify-otp`, { email: tempEmail, otp });
      if (res.data.code === "otp-verified") {
        stopSpinner();
        await localforage.setItem("_Sparkles_user", res.data.data);
       window.location.href = "user.html";
;
;
      } else {
        stopSpinner(`<div class='alert alert-danger p-2'>${res.data.message}</div>`);
      }
    } catch (err) {
      stopSpinner(`<div class='alert alert-danger p-2'>${err.response?.data?.message || err.message}</div>`);
    }
  });

  // ===== RESEND OTP =====
  resendOtpBtn?.addEventListener("click", async () => {
    if (!tempEmail) return stopSpinner(`<div class='alert alert-danger p-2'>Email missing. Login again.</div>`);
    startSpinner();
    resendOtpBtn.disabled = true;
    try {
      const res = await axios.post(`${API_URL}/resend-otp`, { email: tempEmail });
      if (res.data.code === "otp-sent") {
        clearInterval(timerInterval);
        otpInput.value = "";
        otpSubmitBtn.disabled = false;
        resendOtpBtn.style.display = "none";
        stopSpinner(`<div class='alert alert-success p-2'>New OTP sent</div>`);
        startOtpTimer(60);
      } else {
        stopSpinner(`<div class='alert alert-danger p-2'>${res.data.message}</div>`);
        resendOtpBtn.disabled = false;
      }
    } catch (err) {
      stopSpinner(`<div class='alert alert-danger p-2'>${err.response?.data?.message || err.message}</div>`);
      resendOtpBtn.disabled = false;
    }
  });

  // ===== FORGOT PASSWORD =====
  forgotBtn?.addEventListener("click", async () => {
    const email = document.getElementById("forgotEmail").value.trim();
    if (!email) return (forgotFeedback.textContent = "⚠️ Enter your email");

    startSpinner();
    try {
      const res = await axios.post(`${API_URL}/forgot-password`, { email });
      stopSpinner(`<div class='alert alert-success p-2'>${res.data.message}</div>`);
      if (res.data.code === "success") {
        forgotFeedback.textContent = "✅ Check your email for the reset link!";
      }
    } catch (err) {
      stopSpinner(`<div class='alert alert-danger p-2'>${err.response?.data?.message || "Error connecting to server"}</div>`);
    }
  });

  // // ===== RESET PASSWORD MODAL SUBMISSION =====
  // resetForm?.addEventListener("submit", async (e) => {
  //   e.preventDefault();
  //   const newPassword = document.getElementById("newPassword").value.trim();
  //   const confirmPassword = document.getElementById("confirmPassword").value.trim();
  //   const email = resetEmailInput.value;
  //   const token = resetTokenInput.value;

  //   if (!newPassword || !confirmPassword) return (resetFeedback.textContent = "⚠️ Fill all fields");
  //   if (newPassword !== confirmPassword) return (resetFeedback.textContent = "⚠️ Passwords do not match");

  //   startSpinner();
  //   try {
  //     const res = await axios.post(`${API_URL}/reset-password`, { email, token, newPassword });
  //     stopSpinner(`<div class='alert alert-success p-2'>${res.data.message}</div>`);
  //     if (res.data.code === "success") {
  //       const resetModal = bootstrap.Modal.getInstance(resetModalEl);
  //       resetModal.hide();
  //       setTimeout(() => (window.location.href = "/"), 1500);
  //     }
  //   } catch (err) {
  //     stopSpinner(`<div class='alert alert-danger p-2'>${err.response?.data?.message || "Error connecting to server"}</div>`);
  //   }
  // });

  // // ===== AUTO-OPEN RESET MODAL FROM EMAIL LINK =====
  // if (resetModalEl && resetEmailInput && resetTokenInput) {
  //   const params = new URLSearchParams(window.location.search);
  //   if (params.get("reset") === "true") {
  //     const email = params.get("email");
  //     const token = params.get("token");
  //     if (email && token) {
  //       resetEmailInput.value = email;
  //       resetTokenInput.value = token;
  //       const resetModal = new bootstrap.Modal(resetModalEl);
  //       resetModal.show();
  //     } else {
  //       resetFeedback.textContent = "Invalid or expired reset link.";
  //     }
  //   }
  // }

  // ===== NAVIGATION =====
  document.getElementById("showForgotPassword")?.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    forgotSection.style.display = "block";
  });

  document.getElementById("backToLogin")?.addEventListener("click", (e) => {
  e.preventDefault();
  forgotSection.style.display = "none";
  loginForm.style.display = "block";
});
 
});
