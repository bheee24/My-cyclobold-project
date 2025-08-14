// Shows a spinner with a "Please wait" message during registration processing
function start_reg_spinner() {
    document.querySelector("#reg-spinner-id").innerHTML = `
        <span> Please wait ... 
            <span class="spinner-border spinner-border-sm" role="status">
                <span class="sr-only"></span>
            </span>
        </span>`;
}

// Hides the spinner and optionally displays a message (success, error, etc.)
function end_reg_spinner(with_message = null) {
    document.querySelector("#reg-spinner-id").innerHTML = with_message || '';
}

// Immediately-invoked function expression (IIFE) to encapsulate form handling logic
(function () {
    // Adds a submit event listener to the form with ID "registerForm"
    document.querySelector("#registerForm").addEventListener('submit', async function (event) {
        // Prevents the default form submission behavior (page reload)
        event.preventDefault();

        // Retrieves and trims values from the form input fields
        let firstname = this.firstname.value.trim();
        let lastname = this.lastname.value.trim();
        let email = this.email.value.trim();
        let password = this.password.value.trim();
        let phonenumber = this.phonenumber.value.trim();

        // Checks if all form fields are filled in
        if (
            firstname.length > 0 &&
            lastname.length > 0 &&
            email.length > 0 &&
            password.length > 0 &&
            phonenumber.length > 0
        ) {
            try {
                // Displays the loading spinner
                start_reg_spinner();

                // Sends the form data to the server using an HTTP POST request
                let feedback = await axios.post("http://localhost:3456/register", {
                    firstname,
                    lastname,
                    phonenumber,
                    email,
                    password
                });

                console.log("Registering user --> ", feedback);

                // Handles server response
                if (feedback.data.code === "success") {
                    // Shows success message
                    end_reg_spinner(`<div class='alert alert-success'>${feedback.data.message}</div>`);
                } else {
                    // Shows error message(s) from server
                    let errorList = '';
                    if (Array.isArray(feedback.data.error)) {
                        // Converts array of error messages to an unordered HTML list
                        errorList = `<ul>${feedback.data.error.map(err => `<li>${err}</li>`).join('')}</ul>`;
                    }

                    // Displays server error message and detailed list (if any)
                    end_reg_spinner(`
                        <div class='alert alert-danger'>
                            ${feedback.data.message}
                            ${errorList}
                        </div>
                    `);
                }

            } catch (error) {
                // Handles unexpected errors (e.g., network issues)
                console.error("Registration error:", error);
                end_reg_spinner(`<div class='alert alert-danger'>An unexpected error occurred. Please try again.</div>`);
            }
        } else {
            // Displays a warning if any required field is missing
            end_reg_spinner(`<div class='alert alert-warning'>All fields are required.</div>`);
        }
    });
})();
