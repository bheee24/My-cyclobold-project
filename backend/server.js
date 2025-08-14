// // Import required packages
// const express = require("express"); // Used to create the server and handle routes
// const multer = require("multer"); // Used to handle file uploads
// const cors = require("cors"); // Allows requests from different origins (cross-origin)
// require("dotenv").config(); // Loads environment variables from a .env file
// const bodyParser = require('body-parser');
// // Load environment variables
// APP_HOST = process.env.APP_HOST;
// APP_PORT = process.env.APP_PORT;
// PAYSTACK_SECRETKEY=process.env.PAYSTACK_SECRETKEY
// // Set up multer to save uploaded files to a folder called 'uploads'
// const upload = multer({ dest: 'uploads' });

// // Create an instance of an Express server
// const server = express();

// // Import the custom User class which contains registration, login, etc.
// const UserClass = require("./Classes/User");
// const User = require("./Classes/User");
// const user = new UserClass(); // Create an object from the User class

// // Enable CORS so frontend apps can connect
// server.use(cors());

// server.use(bodyParser.json());
// // Parse incoming JSON data
// server.use(express.json());

// // Define a POST endpoint for logging in a user
// server.post("/login-user", async (req, res) => {
//   let email = req.body.email; // Get email from request body
//   let password = req.body.password; // Get password from request body

//   const feedback = await user.loginUser(email, password); // Try to log in user
//   if (!feedback) {
//     // If no feedback is received, something went wrong
//     res.send({
//       message: "Internal server error: no feedback received",
//       code: "error",
//       data: null
//     });
//   }

//   // Send the login result (success or failure) to the frontend
//   res.send({
//     message: feedback.message,
//     code: feedback.code,
//     data: feedback.data
//   });
// });

// // Define a POST endpoint for uploading profile images
// server.post('/upload_profile', upload.single('upload_profile'), function (req, res) {
//   // Allowed image types
//   const allowed_types = ["image/png", "image/xpng", "image/jpeg", "image/jpg", "image/tiff"];

//   let mimetype = req.file.mimetype; // Get the uploaded file's MIME type

//   // Check if the uploaded file type is allowed
//   if (!allowed_types.includes(mimetype)) {
//     return res.send({
//       message: "This file type is not allowed. Allowed types are: " + String(allowed_types),
//       code: "image error",
//       data: null
//     });
//   }

//   // Check the file size in kilobytes
//   let image_size = req.file.size;
//   image_size = image_size / 1024; // Convert from bytes to KB
//   image_size = Math.floor(image_size); // Round it down

//   // If file size is too large
//   if (image_size > 500) {
//     res.send({
//       message: "Image is too large",
//       code: "image-error",
//       data: null
//     });
//   } else {
//     // If everything is fine, accept the upload
//     res.send({
//       message: "Image uploaded successfully",
//       code: "upload-success",
//       data: null
//     });
//   }
// });

// // Define a POST endpoint to register a new user
// server.post("/register", async (req, res) => {
//   try {
//     // Get all input fields from request body
//     let firstname = req.body.firstname;
//     let lastname = req.body.lastname;
//     let email = req.body.email;
//     let password = req.body.password;
//     let phonenumber = req.body.phonenumber;

//     // Check if all required fields are provided
//     const feedback = user.check_registration_params(firstname, lastname, email, password, phonenumber);

//     // If any field is missing or incorrect, send an error response
//     if (feedback && feedback.code === "error") {
//       res.send(feedback);
//     } else {
//       // If all fields are good, try to register the user
//       const feedback = await user.register(firstname, lastname, email, password, phonenumber);
//       res.send(feedback);
//     }
//   } catch (error) {
//     // Catch and log any error that happens during registration
//     console.error("Error during registration:", error);
//     res.status(500).send({
//       message: "Internal server error during registration",
//       code: "server-error",
//       error: error.message,
//       data: null
//     });
//   }
// });

// // Define a GET endpoint to verify user email
// server.get("/verify_registration_email", async (req, res) => {
//   let query = req.query;
//   let user_email = query.email;

//   // If email is provided, attempt to verify it
//   if (user_email.trim().length != 0) {
//     const feedback = await user.verify_email(user_email);
//     res.send(feedback);
//   }
// });


// server.post("/resend-otp", async (req, res) => {
//     const { email } = req.body;
//     const userInstance=new User()
//     if (!email) {
//         return res.status(400).send({
//             message: "Email is required",
//             code: "missing-email"
//         });
//     }

//     const result = await userInstance.resendOtp(email);
//     return res.send(result);
// });


// // Define a POST endpoint to verify OTP (one-time password)
// server.post("/verify-otp", (req, res) => {
//   console.log("📥 Incoming /verify-otp request body:", req.body);
//   user.verifyOtp(req, res);
// });




// server.post("/paystack", function (req, res) {
//   const https = require("https");

//   const params = JSON.stringify({
//     email: req.body.email,
//     amount: req.body.amount
//   });

//   const options = {
//     hostname: 'api.paystack.co',
//     port: 443,
//     path: '/transaction/initialize',
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${PAYSTACK_SECRETKEY}`,
//       'Content-Type': 'application/json'
//     }
//   };

//   const reqpaystack = https.request(options, paystackRes => {
//     let data = '';

//     paystackRes.on('data', chunk => {
//       data += chunk;
//     });

//     paystackRes.on('end', () => {
//       const response = JSON.parse(data);
//       console.log(response);

//       // ✅ Send the actual response back to frontend
//       res.send(response);
//     });
//   });

//   reqpaystack.on('error', error => {
//     console.error(error);
//     res.status(500).send({ message: "Paystack request failed", error });
//   });

//   reqpaystack.write(params);
//   reqpaystack.end();
// });


// // Start the server and listen on the specified port
// server.listen(APP_PORT, () => {
//   console.log(`Server is running on http://${APP_HOST}:${APP_PORT}`);
// });


// ✅ REQUIRE DEPENDENCIES
const express = require("express");
const cors = require("cors");
const https = require("https");
const dotenv = require("dotenv").config();

// ✅ CREATE EXPRESS SERVER INSTANCE
const Server = express();

// ✅ USE MIDDLEWARES
Server.use(express.json());  // Parses incoming JSON requests
Server.use(cors());          // Enables Cross-Origin Resource Sharing

// ✅ IMPORT CUSTOM USER CLASSuser
const UserClass = require("./Classes/User.js");
const user = new UserClass(); // Create instance of the class
const use =require("./Classes/otpStore.js")
// ✅ BRING IN ENVIRONMENT VARIABLES
const port = process.env.APP_PORT;
const host = process.env.APP_HOST;




// ===============================================================
// 🔐 REGISTER ENDPOINT
// ===============================================================
Server.post('/register', async (request, response) => {
    // Extract user details from request body
    let firstname = request.body.firstname;
    let lastname = request.body.lastname;
    let email = request.body.email;
    let password = request.body.password;
    let phone = request.body.phonenumber;

    // Validate registration inputs
    const feedback = user.check_registration_params(firstname, lastname, email, password);

    // If validation fails, return error feedback
    if (feedback.code === "error") {
        return response.send(feedback);
    }

    // If valid, attempt to register user and return feedback
    const result = await user.register(firstname, lastname, email, password, phone);
    response.send(result);
});




// ===============================================================
// 🔓 LOGIN ENDPOINT
// ===============================================================

Server.post('/login-user', async (request, response) => {
  try {
    // Get login credentials
    let email = request.body.email;
    let password = request.body.password;

    // Run login method from user class
    const feedback = await user.loginUser(email, password);

    // Send back login response
    response.status(200).send({
      message: feedback.message,
      code: feedback.code,
      data: feedback.data
    });

  } catch (error) {
    console.error("❌ Error in /login-user:", error.message);
    
    // Optional: send error details only in dev
    response.status(500).send({
      message: "Internal Server Error",
      error: error.message // remove in production
    });
  }
});

// Server.post('/login-user', async (request, response) => {
//     // Get login credentials
//     let email = request.body.email;
//     let password = request.body.password;

//     // Run login method from class
//     const feedback = await user.loginUser(email, password);

//     // Send back login response
//     response.send({
//         message: feedback.message,
//         code: feedback.code,
//         data: feedback.data
//     });
// });



// ===============================================================
// 📩 EMAIL VERIFICATION ENDPOINT
// ===============================================================
Server.get('/verify_registration_email', async (request, response) => {
    let query = request.query;
    let user_email = query.email;

    // Only process if email is provided
    if (user_email.trim().length !== 0) {
        const feedback = await user.verify_registration_email(user_email);
        response.send(feedback);
    }
});

// ✅ IMPORT OTP STORE OBJECT TO TRACK OTP STATE
const otpStore = require("./Classes/otpStore.js");
const { UserInstance } = require("twilio/lib/rest/conversations/v1/user.js");



// ===============================================================
// 📤 SEND OTP ENDPOINT
// ===============================================================
// Server.post('/send-otp', async (req, res) => {
//     console.log("✅ /send-otp route hit");

//     const phone = req.body.phonenumber;
//     console.log("📞 Phone received:", phone);

//     // Validate phone number
//     if (!phone || phone.trim().length === 0) {
//         console.log("❌ No phone number provided");
//         return res.send({
//             message: "Phone number is required",
//             code: "error",
//             data: null,
//         });
//     }

//     // Generate 6-digit OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     console.log("🔢 OTP generated:", otp);

//     // Store OTP with 5-minute expiration
//     otpStore[phone] = {
//         otp,
//         expiresAt: Date.now() + 5 * 60 * 1000,
//     };
//     console.log("📦 OTP stored:", otpStore[phone]);

//     // Send OTP using Twilio via user class method
//     const feedback = await user.sendOTP(phone.trim(), otp);
//     console.log("📤 Feedback from sendOTP:", feedback);

//     // Respond with feedback
//     res.send(feedback);
// });

Server.post("/send_otp", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ message: "Email and password are required", code: "missing-fields" });
  }

  try {
    const result = await user.loginUser(email, password);
     console.log("🔐 loginUser triggered with:", email);
    res.json(result);
  } catch (error) {
    console.error("Error in /send_otp:", error.message);
    res.status(500).json({ message: "Internal Server Error", code: "server-error" });
  }
});

// ===============================================================
// ✅ VERIFY OTP ENDPOINT
// ===============================================================
Server.post('/verify-otp', async (req, res) => {
    const email = req.body.email;
    const otp = req.body.otp;

    // Check for missing values
    if (!email || !otp) {
        return res.send({
            message: "email and OTP are required",
            code: "error",
            data: null,
        });
    }

    // Validate OTP using class method
    const feedback = await user.verifyOtp(email.trim(), otp.trim());

    res.send(feedback);
});
Server.post("/resend-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required", code: "error" });

  const response = await user.resendOtp(email); // ✅ use the already created `user` object
  console.log("🔁 resendOtp triggered with:", email);
  res.json(response);
});



// ===============================================================
// 💳 CREATE PAYMENT PAGE ENDPOINT
// ===============================================================
Server.post('/create-payment', async (request, response) => {
    // Extract payment details from request body
    const { name, description, amount, email, callback_url } = request.body;

    // Validate required fields
    if (!name || !amount || !email) {
        return response.send({
            message: "Name, amount, and email are required",
            code: "error",
            data: null
        });
    }

    // Prepare payment parameters for Paystack
    const params = JSON.stringify({
        name: name,
        description: description || "Payment for order",
        amount: amount * 100, // Convert to kobo (Paystack expects amount in kobo)
        callback_url: callback_url || `http://${host}:3000/payment-success`
    });
    

    // Paystack API options
    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/page',
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    };

    // Create HTTPS request to Paystack
    const req = https.request(options, res => {
        let data = '';
        

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const paystackResponse = JSON.parse(data);
                
                if (paystackResponse.status) {
                    // Payment page created successfully
                    // For payment pages, the URL is constructed using the slug
                    const slug = paystackResponse.data?.slug;
                    
                    if (!slug) {
                        return response.send({
                            message: "No slug received from Paystack",
                            code: "error",
                            data: { raw_response: paystackResponse.data }
                        });
                    }
                    
                    const paymentUrl = `https://paystack.com/pay/${slug}`;
                    const reference = paystackResponse.data?.id || paystackResponse.data?.reference;
                    
                    const responseData = {
                        message: "Payment page created successfully",
                        code: "success",
                        data: {
                            payment_url: paymentUrl,
                            reference: reference,
                            slug: slug,
                            page_id: paystackResponse.data?.id
                        }
                    };
                    
                    response.send(responseData);
                } else {
                    // Error from Paystack
                    response.send({
                        message: paystackResponse.message || "Failed to create payment page",
                        code: "error",
                        data: null
                    });
                }
            } catch (error) {
                console.error('Error parsing Paystack response:', error);
                
                // Return the raw response for debugging
                response.send({
                    message: "Error processing payment request",
                    code: "error",
                    data: {
                        raw_response: data,
                        status_code: res.statusCode,
                        error: error.message
                    }
                });
            }
        });
    }).on('error', error => {
        console.error('Payment request error:', error);
        response.send({
            message: "Payment service unavailable",
            code: "error", 
            data: null
        });
    });

    // Send the request
    req.write(params);
    req.end();
});



// ===============================================================
// 🚀 START SERVER
// ===============================================================
Server.listen(port, () => {
    console.log(`🚀 Server running on http://${host}:${port}`);
});

