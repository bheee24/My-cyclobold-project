// 🟡 Wait for the whole page to finish loading before we start doing anything
document.addEventListener("DOMContentLoaded", function () {

    // 🔗 This is the address of our backend server
    const url = "http://localhost:3456";

    // 🔍 These are the things (forms and buttons) we are going to use on the page
    const sign_in_form = document.querySelector("#signInForm");       // The login form
    const otp_form = document.querySelector("#otpForm");             // The OTP form (we show this after login)
    const countdown_id = document.querySelector("#countdown-id");    // Where we show the OTP timer
    const otp_input = document.querySelector("#otpInput");           // Where the user types their OTP
    const otp_submit_btn = document.querySelector("#otpSubmitBtn");  // Button to submit the OTP
    const resendOtpBtn = document.querySelector("#resendOtpBtn");    // Button to resend a new OTP
    const spinnerDiv = document.querySelector("#spinner-id");        // Area to show loading spinner or messages

    let tempEmail = "";        // We'll use this to remember the user's email after login
    let timerInterval;         // This will be used to keep track of our countdown timer

    // ⏳ This shows a little spinner and "Please wait..." message while we do something
    function start_spinner() {
        spinnerDiv.innerHTML = `
            <span>Please wait... 
                <span class="spinner-border spinner-border-sm" role="status"></span>
            </span>`;
    }

    // ✅ This hides the spinner and shows a message instead (like "Success" or "Error")
    function end_spinner(msg = "") {
        spinnerDiv.innerHTML = msg;
    }

    // 🕒 This starts a countdown (like 60...59...58...) for how long the OTP will last
   function startTimer(seconds) {
    console.log("⏳ Timer started with:", seconds);

    // If the time is missing or wrong, make it 60 seconds
    if (!seconds || isNaN(seconds) || seconds <= 0) {
        seconds = 60;
        console.warn("⚠️ Invalid timer value, resetting to 60 seconds");
    }

    // 🛑 Stop any old timer that's still running
    clearInterval(timerInterval);

    let timeLeft = seconds;

    // ✅ Clean up UI before starting timer
    countdown_id.classList.remove("text-danger");
    countdown_id.innerHTML = `<strong>OTP expires in ${timeLeft} seconds</strong>`;
    otp_submit_btn.removeAttribute("disabled");     // Let user submit OTP
    resendOtpBtn.style.display = "none";            // Hide resend button again
    resendOtpBtn.disabled = true;                   // Also disable it just in case

    // ✅ Start the new countdown
    timerInterval = setInterval(() => {
        timeLeft--;

        if (timeLeft <= 0) {
            // ❌ Time is up!
            clearInterval(timerInterval);
            countdown_id.classList.add("text-danger");
            countdown_id.innerHTML = `OTP expired. Please request a new one.`;

            otp_submit_btn.setAttribute("disabled", "disabled"); // Stop submit
            resendOtpBtn.style.display = "inline";               // Show resend
            resendOtpBtn.disabled = false;                       // Allow click
        } else {
            // ⏳ Still counting down
            countdown_id.classList.remove("text-danger");
            countdown_id.innerHTML = `<strong>OTP expires in ${timeLeft} seconds</strong>`;
        }
    }, 1000); // 1 second = 1000 ms
}


    // 👤 This happens when someone tries to log in with email and password
    sign_in_form.addEventListener("submit", async function (e) {
        e.preventDefault(); // Don’t let the page reload

        const email = this.email.value.trim();     // Get the email they typed
        const password = this.password.value.trim(); // Get the password they typed

        if (!email || !password) return; // If one is missing, stop

        start_spinner(); // Show spinner while we wait

        try {
            // Send the email and password to the server
            const res = await axios.post(`${url}/login-user`, { email, password });

            // ✅ If the server says we need to send OTP
            if (res.data.code === "otp-sent") {
                end_spinner(`<div class='alert alert-success p-2'>OTP sent to your phone</div>`);
                sign_in_form.style.display = "none";  // Hide the login form
                otp_form.style.display = "block";     // Show the OTP form
                tempEmail = res.data.data.email;      // Save the email
                otp_submit_btn.disabled = false;      // Enable the submit button
                otp_input.value = "";                 // Clear any old input
                startTimer(60);                       // Start the timer
            } else if (res.data.code === "success") {
                // ✅ If login worked without OTP (maybe not required)
                end_spinner();
                const stored = await localforage.setItem("_Sparkles_user", res.data.data);
                if (stored) location.href = "/user.html"; // Go to the user page
            } else {
                // ❌ If something went wrong
                end_spinner(`<div class='alert alert-danger p-2'>${res.data.message}</div>`);
            }
        } catch (err) {
            // ❌ Catch any errors and show them
            if (err.response?.data) {
                end_spinner(`<div class='alert alert-danger p-2'>${err.response.data.message}</div>`);
            } else {
                end_spinner(`<div class='alert alert-danger p-2'>Login error: ${err.message}</div>`);
            }
        }
    });

    // 🔐 This happens when user submits the OTP
    otp_form.addEventListener("submit", async function (e) {
        e.preventDefault(); // Don’t reload the page

        const otp = otp_input.value.trim(); // Get what user typed in OTP box

        if (!otp) {
            return end_spinner(`<div class='alert alert-danger p-2'>OTP is required</div>`);
        }

        start_spinner(); // Show spinner while we wait

        try {
            // Send OTP and email to server for checking
            const res = await axios.post(`${url}/verify-otp`, {
                email: tempEmail,
                otp
            });

            if (res.data.code === "otp-verified") {
                // ✅ OTP was correct!
                end_spinner();
                const stored = await localforage.setItem("_Sparkles_user", {
                    ...res.data.data,
                    token: res.data.token
                });
                if (stored) location.href = "/user.html"; // Go to user page
            } else {
                // ❌ OTP was wrong
                end_spinner(`<div class='alert alert-danger p-2'>${res.data.message}</div>`);
            }
        } catch (err) {
            // ❌ Something failed
            if (err.response?.data) {
                end_spinner(`<div class='alert alert-danger p-2'>${err.response.data.message}</div>`);
            } else {
                end_spinner(`<div class='alert alert-danger p-2'>OTP verification error: ${err.message}</div>`);
            }
        }
    });

    // 🔁 This happens when user clicks “Resend OTP”
    resendOtpBtn.addEventListener("click", async function () {
        if (!tempEmail) {
            // If we don’t have the email saved, tell user to login again
            return end_spinner(`<div class='alert alert-danger p-2'>Email is missing. Please login again.</div>`);
        }

        start_spinner(); // Show spinner while we wait
        resendOtpBtn.disabled = true; // Don’t let them click it again yet

        try {
            const res = await axios.post(`${url}/resend-otp`, { email: tempEmail });

            if (res.data.code === "otp-sent") {
                // ✅ OTP was sent again!

                clearInterval(timerInterval); // Stop old timer
                countdown_id.innerHTML = ""; // Clear old message
                countdown_id.classList.remove("text-danger");

                otp_input.value = ""; // Clear OTP input
                otp_submit_btn.disabled = false; // Enable submit button
                resendOtpBtn.style.display = "none"; // Hide resend button
                // resendOtpBtn.disabled = true;

                end_spinner(`<div class='alert alert-success p-2'>New OTP sent successfully</div>`);

                startTimer(60); // Start new timer
            } else {
                // ❌ Show error from server
                end_spinner(`<div class='alert alert-danger p-2'>${res.data.message}</div>`);
                resendOtpBtn.disabled = false;
            }
        } catch (err) {
            // ❌ Show error message
            const msg = err.response?.data?.message || err.message || "Resend failed";
            end_spinner(`<div class='alert alert-danger p-2'>${msg}</div>`);
            resendOtpBtn.disabled = false;
        }
    });


    
}); // 🟢 Done! Everything above waits for the page to load before working
