// 🛒 Function to show everything inside the shopping cart
const renderCart = async () => {
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyMsg = document.getElementById('empty-message');
  const totalDisplay = document.getElementById('cart-total');
  const clearBtn = document.getElementById('clear-cart');
  const toastEl = document.getElementById('toast-clear');
  const checkoutBtn = document.getElementById('checkout-btn');

  // Get cart from storage (or empty list if none)
  let cart = await localforage.getItem("cart") || [];
  cartItemsContainer.innerHTML = '';
  let total = 0;

  // If cart is empty, show message + hide buttons
  if (cart.length === 0) {
    emptyMsg.style.display = 'block';
    totalDisplay.textContent = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    return;
  }

  // Show buttons if we have items
  emptyMsg.style.display = 'none';
  if (clearBtn) clearBtn.style.display = 'inline-block';
  if (checkoutBtn) checkoutBtn.style.display = 'inline-block';

  // Show each item
  for (const item of cart) {
    if (!item.quantity) item.quantity = 1; // Default to 1 if missing
    total += item.price * item.quantity;

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
    cartItemsContainer.appendChild(col);
  }

  totalDisplay.textContent = `Total: $${total.toLocaleString()}`;
};

document.addEventListener('DOMContentLoaded', async () => {
  await renderCart();

  const cartItemsContainer = document.getElementById('cart-items');
  const clearBtn = document.getElementById('clear-cart');
  const toastEl = document.getElementById('toast-clear');

  // Listen for + / - / remove clicks
  cartItemsContainer.addEventListener('click', async (e) => {
    const id = e.target.getAttribute('data-id'); // <-- KEEP AS STRING
    let cart = await localforage.getItem("cart") || [];

    if (e.target.classList.contains('quantity-btn')) {
      const action = e.target.getAttribute('data-action');
      const index = cart.findIndex(item => String(item.id) === String(id));

      if (index !== -1) {
        if (action === 'increase') {
          cart[index].quantity = (cart[index].quantity || 1) + 1;
        }
        if (action === 'decrease' && cart[index].quantity > 1) {
          cart[index].quantity--;
        }
        await localforage.setItem("cart", cart);
        await renderCart();
      }
    }

    if (e.target.classList.contains('remove-btn')) {
      cart = cart.filter(item => String(item.id) !== String(id));
      await localforage.setItem("cart", cart);
      await renderCart();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      await localforage.removeItem("cart");
      new bootstrap.Toast(toastEl).show();
      await renderCart();
    });
  }

  const cartModal = document.getElementById("cartModal");
  if (cartModal) {
    cartModal.addEventListener("show.bs.modal", async () => {
      await renderCart();
    });
  }
});
