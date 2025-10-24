// --- CART SIDEBAR CONTROLS ---
const cartSidebar = document.getElementById('cartSidebar');
const cartOpen = document.getElementById('cartOpen');
const closeCart = document.getElementById('closeCart');
const checkoutBtn = document.getElementById('checkoutBtn');

if (cartOpen) {
  cartOpen.addEventListener('click', () => {
    loadCart();
    cartSidebar.classList.add('open');
  });
}

if (closeCart) {
  closeCart.addEventListener('click', () => {
    cartSidebar.classList.remove('open');
  });
}

// Load cart items
function loadCart() {
  const cartItemsContainer = document.getElementById('cartItems');
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cartItemsContainer.innerHTML = '';

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
    updateTotal();
    toggleCheckoutButton(false);
    return;
  }

  cart.forEach((item, index) => {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
      <button class="remove-btn" data-index="${index}">✕</button>
      <img src="${item.image}" alt="${item.title}">
      <div class="cart-item-info">
        <p>${item.title}</p>
        <p class="price">₹${item.price}</p>
      </div>
    `;
    cartItemsContainer.appendChild(div);
  });

  attachCartEvents();
  updateTotal();
  toggleCheckoutButton(true);
}

function attachCartEvents() {
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = e.target.dataset.index;
      removeItem(index);
    });
  });
}

function removeItem(index) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const removedItem = cart[index];
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();

  // Re-enable Add to Cart if user removed it
  const productTitle = document.querySelector('.product-title')?.innerText;
  if (removedItem && removedItem.title === productTitle) {
    enableAddToCartButton();
  }
}

function enableAddToCartButton() {
  const addCartBtn = document.querySelector('.add-cart');
  addCartBtn.disabled = false;
  addCartBtn.style.backgroundColor = '';
  addCartBtn.style.cursor = 'pointer';
  addCartBtn.innerText = 'Add to Cart';
}

function updateTotal() {
  const totalBox = document.getElementById('cartTotal');
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  totalBox.innerText = `Total: ₹${total}`;
}

// Show or hide checkout button
function toggleCheckoutButton(show) {
  if (checkoutBtn) {
    checkoutBtn.style.display = show ? 'block' : 'none';
  }
}

// Checkout
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    window.location.href = "/confirm.html";
  });
}

// Hide checkout initially if cart empty on load
document.addEventListener('DOMContentLoaded', () => {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  toggleCheckoutButton(cart.length > 0);
});

document.getElementById("cartIcon").addEventListener("click", () => {
      loadCart();
    cartSidebar.classList.add('open');
});
