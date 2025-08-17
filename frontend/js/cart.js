// ✅ Render the cart content from localforage
const renderCart = async () => {
  // 🎯 Get DOM elements for cart UI
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyMsg = document.getElementById('empty-message');
  const totalDisplay = document.getElementById('cart-total');
  const clearBtn = document.getElementById('clear-cart');
  const toastEl = document.getElementById('toast-clear');
  const checkoutBtn = document.getElementById('checkout-btn');

  // 🛒 Load cart data from localForage (or initialize as empty array if not found)
  const cart = await localforage.getItem("cart") || [];
  cartItemsContainer.innerHTML = ''; // Clear previous cart items
  let total = 0;

  // 🕳️ If the cart is empty, show "empty" message and hide total/clear/checkout UI
  if (cart.length === 0) {
    emptyMsg.style.display = 'block';
    totalDisplay.textContent = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    return;
  }

  // ✅ Show cart UI (cart is not empty)
  emptyMsg.style.display = 'none';
  if (clearBtn) clearBtn.style.display = 'inline-block';
  if (checkoutBtn) checkoutBtn.style.display = 'inline-block';

  // 🧱 Loop through each product in the cart and render them
  for (const item of cart) {
    // Set default quantity to 1 if not already defined
    if (!item.quantity) item.quantity = 1;

    // Calculate running total
    total += item.price * item.quantity;

    // Create a Bootstrap card element for each cart item
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card h-100">
        <img src="${item.image}" class="card-img-top" alt="${item.name}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${item.name}</h5>
          <p class="card-text text-primary fw-bold">$${Number(item.price).toLocaleString()}</p>
          <div class="d-flex align-items-center gap-2 my-2">
            <button class="btn btn-sm btn-outline-secondary quantity-btn" data-id="${item.id}" data-action="decrease">−</button>
            <span id="quantity-${item.id}">${item.quantity}</span>
            <button class="btn btn-sm btn-outline-secondary quantity-btn" data-id="${item.id}" data-action="increase">+</button>
          </div>
          <button class="btn btn-sm btn-outline-danger remove-btn mt-auto" data-id="${item.id}">Remove</button>
        </div>
      </div>
    `;
    cartItemsContainer.appendChild(col); // Add item card to the cart container
  }

  // 💵 Show total cart value
  totalDisplay.textContent = `Total: $${total.toLocaleString()}`;
};

// ✅ Wait for the DOM to fully load before initializing event handlers
document.addEventListener('DOMContentLoaded', async () => {
  await renderCart(); // Initial cart rendering on page load

  const cartItemsContainer = document.getElementById('cart-items');
  const clearBtn = document.getElementById('clear-cart');
  const toastEl = document.getElementById('toast-clear');

  // 📦 Handle quantity changes and item removal inside the cart
  cartItemsContainer.addEventListener('click', async (e) => {
    const id = parseInt(e.target.getAttribute('data-id')); // Get clicked item's ID
    let cart = await localforage.getItem("cart") || [];

    // ➕➖ Handle increase/decrease button clicks
    if (e.target.classList.contains('quantity-btn')) {
      const action = e.target.getAttribute('data-action');
      const index = cart.findIndex(item => item.id === id);

      if (index !== -1) {
        if (action === 'increase') {
          cart[index].quantity++;
        }
        if (action === 'decrease' && cart[index].quantity > 1) {
          cart[index].quantity--;
        }

        // ✅ Save updated cart and re-render UI
        await localforage.setItem("cart", cart);
        await renderCart();
      }
    }

    // ❌ Handle remove button click
    if (e.target.classList.contains('remove-btn')) {
      // Filter out the item and update storage
      cart = cart.filter(item => item.id !== id);
      await localforage.setItem("cart", cart);
      await renderCart();
    }
  });

  // 🧹 Handle clear cart button click
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      await localforage.removeItem("cart"); // Remove cart from storage
      new bootstrap.Toast(toastEl).show();  // Show toast notification
      await renderCart();                  // Refresh UI
    });
  }

  // 🔁 Re-render cart every time the modal opens (to reflect latest updates)
  const cartModal = document.getElementById("cartModal");
  if (cartModal) {
    cartModal.addEventListener("show.bs.modal", async () => {
      await renderCart();
    });
  }
});
