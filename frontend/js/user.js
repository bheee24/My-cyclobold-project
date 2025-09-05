// ===== When the page is fully ready =====
window.addEventListener("DOMContentLoaded", async () => {
  // Grab the spot where we show the user’s name
  let user_info_id = document.querySelector("#user-info");
  user_info_id.innerHTML = "<small>please wait...</small>";

  // 👉 Try to get the saved user info from localforage
  let result = await localforage.getItem("_Sparkles_user");

  if (result) {
    // If we found something, show the firstname
    console.log("Full result from localForage:", result);
    const firstname = result["firstname"];
    console.log("Firstname:", firstname);
    user_info_id.innerHTML = firstname;
  } else {
    // If not logged in, send them back to homepage
    location.href = "index.html";
  }
});

// ===== Mobile Menu Toggle =====
const menuBtn = document.querySelector("#menu-btn");
const navLinks = document.querySelector("#nav-links");
const menuBtnIcon = menuBtn.querySelector("i");

// When user taps menu button
menuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("open"); // open or close menu

  // change icon based on state
  const isOpen = navLinks.classList.contains("open");
  menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
});

// Close menu when user clicks a link
navLinks.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuBtnIcon.setAttribute("class", "ri-menu-line");
});

// ===== Log Out =====
async function logOutUser(event) {
  event.preventDefault(); // stop normal link action
  await localforage.removeItem("_Sparkles_user"); // clear saved user info
  location.href = "index.html"; // send back home
}

// ===== Load and Show Products =====
async function loadProducts() {
  try {
    // get product list file
    const response = await fetch("product.json");
    if (!response.ok) throw new Error("Network response was not ok");

    // turn the response into JS object
    const products = await response.json();
    console.log(products);

    // get container where products go
    const container = document.querySelector("#product-list");
    container.innerHTML = "";

    // loop each product and build a card
    products.forEach(product => {
      const col = document.createElement("div");
      col.className = "col-md-4 col-sm-6 d-flex justify-content-center";

      const card = document.createElement("div");
      card.className = "card m-2";
      card.style.width = "18rem";

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

    // Add-to-Cart handler
    container.addEventListener("click", async e => {
      if (e.target.classList.contains("add-to-cart")) {
        e.preventDefault();

        // grab the product id
        const productId = parseInt(e.target.getAttribute("data-id"));

        // find the full product info
        const selectedProduct = products.find(p => p.id === productId);

        // get current cart
        let cart = (await localforage.getItem("cart")) || [];

        // check if already exists
        const alreadyInCart = cart.some(item => item.id === selectedProduct.id);

        if (!alreadyInCart) {
          cart.push(selectedProduct);
          await localforage.setItem("cart", cart);
          alert(`${selectedProduct.name} added to cart!`);
        } else {
          alert(`${selectedProduct.name} is already in your cart.`);
        }
      }
    });

  } catch (error) {
    console.error("Error loading products:", error);
    document.getElementById("product-list").innerHTML = `
      <div class="alert alert-danger">Unable to load products. Please try again later.</div>
    `;
  }
}

// run product loader when page is ready
document.addEventListener("DOMContentLoaded", loadProducts);
