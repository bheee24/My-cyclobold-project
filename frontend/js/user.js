window.addEventListener('DOMContentLoaded', async function (event) {
    let user_info_id = this.document.querySelector("#user-info");
    user_info_id.innerHTML = "<small>please wait...</small>";

    // ✅ Correct: get the saved user info
    let result = await localforage.getItem("_Sparkles_user");

    if (result) {
        // const firstname = result["firstname"]; // 👈 safer
        // console.log(result.firstname); // ✅ Corrected here
        // user_info_id.innerHTML = firstname;
          console.log("Full result from localForage:", result); // <--- ADD THIS
    const firstname = result["firstname"];
    console.log("Firstname:", firstname);
    user_info_id.innerHTML = firstname;
    } else {
        location.href = "index.html"; // Redirect if not logged in
    }
});



// ===== Responsive Menu (Mobile Navigation) =====

// Get the menu button and the nav links
const menuBtn = document.querySelector("#menu-btn");
const navLinks = document.querySelector("#nav-links");
const menuBtnIcon = menuBtn.querySelector("i");

// When the menu button is clicked, open or close the menu
menuBtn.addEventListener("click", (e) => {
    navLinks.classList.toggle("open"); // Toggle the class to show/hide menu

    // Change the menu icon depending on whether it's open or closed
    const isOpen = navLinks.classList.contains("open");
    menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
});

// When a link in the menu is clicked, close the menu again
navLinks.addEventListener("click", (e) => {
    navLinks.classList.remove("open");
    menuBtnIcon.setAttribute("class", "ri-menu-line");
});


// ===== Log Out Function =====

// This function runs when the user clicks "Log Out"
async function logOutUser(event) {
    event.preventDefault(); // Stop the link from going to another page

    await localforage.removeItem("_Sparkles_user"); // Remove the saved user info from storage
    location.href = "index.html"; // Go back to the homepage
}


// ===== Load and Show Products =====

async function loadProducts() {
  try {
    // Try to fetch (load) the product list from the file
    const response = await fetch("product.json");

    // If something went wrong with the fetch, throw an error
    if (!response.ok) throw new Error("Network response was not ok");

    // Convert the response to actual JavaScript object (array of products)
    const products = await response.json();
    console.log(products); // Show them in the browser console for testing

    // Get the part of the page where we want to display products
    const container = document.querySelector('#product-list');
    container.innerHTML = ''; // Make sure it's empty before adding products

    // Loop through each product and create a card for it
    products.forEach(product => {
      const col = document.createElement('div');
      col.className = 'col-md-4 col-sm-6 d-flex justify-content-center';

      const card = document.createElement('div');
      card.className = 'card m-2';
      card.style.width = '18rem';

      // Fill the card with product details
      card.innerHTML = `
        <img src="${product.image}" class="card-img-top" alt="${product.name}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${product.name}</h5>
          <p class="card-text text-primary fw-bold">$${Number(product.price).toLocaleString()}</p>
          <a href="#" class="btn btn-dark mt-auto add-to-cart" data-id="${product.id}">Add to Cart</a>
        </div>
      `;

      col.appendChild(card);
      container.appendChild(col);
    });

    // Handle the Add to Cart button clicks
    container.addEventListener('click', async function (e) {
      if (e.target.classList.contains('add-to-cart')) {
        e.preventDefault(); // Stop the link from refreshing the page

        // Get the product ID from the button
        const productId = parseInt(e.target.getAttribute('data-id'));

        // Find the full product info using the ID
        const selectedProduct = products.find(p => p.id === productId);

        // Get the cart from storage (or start a new one)
        let cart = await localforage.getItem("cart") || [];

        // Check if the item is already in the cart
        const alreadyInCart = cart.some(item => item.id === selectedProduct.id);

        // If it's not already there, add it
        if (!alreadyInCart) {
          cart.push(selectedProduct); // Add item
          await localforage.setItem('cart', cart); // Save updated cart
          alert(`${selectedProduct.name} added to cart!`);
        } else {
          alert(`${selectedProduct.name} is already in your cart.`);
        }
      }
    });

  } catch (error) {
    console.error("Error loading products:", error);

    // If something went wrong, show an error message to the user
    document.getElementById('product-list').innerHTML = `
      <div class="alert alert-danger">Unable to load products. Please try again later.</div>
    `;
  }
}

// After the page finishes loading, run the loadProducts function
document.addEventListener("DOMContentLoaded", loadProducts);
