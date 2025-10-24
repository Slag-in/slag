import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ==========================
// 🔥 FIREBASE CONFIG
// ==========================
const firebaseConfig = {
  apiKey: "AIzaSyCtt8sm0j6DhguOWHC7S6r0_8GUTQheGts",
  authDomain: "slagdatabase.firebaseapp.com",
  databaseURL: "https://slagdatabase-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "slagdatabase",
  storageBucket: "slagdatabase.firebasestorage.app",
  messagingSenderId: "161359818821",
  appId: "1:161359818821:web:58322ee107921f5ca1332c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================
// 🌟 HELPER FUNCTIONS
// ==========================
function getCurrentProductId() {
  const path = window.location.pathname;
  const file = path.substring(path.lastIndexOf("/") + 1); // slag-rf1.html
  return file.replace(".html", ""); // slag-rf1
}

function getCurrentProduct() {
  return {
    productId: getCurrentProductId(),
    title: document.querySelector('.product-title')?.innerText || '',
    price: parseInt(document.querySelector('.product-price')?.innerText.replace(/[^\d]/g, '')) || 0,
    image: document.querySelector('.thumbnails img.active')?.src || '',
    quantity: 1
  };
}

function disableAddToCartButton() {
  const btn = document.querySelector('.add-cart');
  if (!btn) return;
  btn.disabled = true;
  btn.style.backgroundColor = '#ccc';
  btn.style.cursor = 'not-allowed';
  btn.innerText = 'Added to cart';
}

function enableAddToCartButton() {
  const btn = document.querySelector('.add-cart');
  if (!btn) return;
  btn.disabled = false;
  btn.style.backgroundColor = '';
  btn.style.cursor = 'pointer';
  btn.innerText = 'Add to Cart';
}

// ==========================
// 🛒 CART SYSTEM
// ==========================
const cartSidebar = document.getElementById('cartSidebar');
const cartOpenBtn = document.getElementById('cartOpen');
const closeCartBtn = document.getElementById('closeCart');
const checkoutBtn = document.getElementById('checkoutBtn');

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

  const product = getCurrentProduct();
  if (removedItem && removedItem.productId === product.productId) enableAddToCartButton();
}

function updateTotal() {
  const totalBox = document.getElementById('cartTotal');
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  totalBox.innerText = `Total: ₹${total}`;
}

function toggleCheckoutButton(show) {
  if (checkoutBtn) checkoutBtn.style.display = show ? 'block' : 'none';
}

// Open/Close cart
cartOpenBtn?.addEventListener('click', () => { loadCart(); cartSidebar.classList.add('open'); });
closeCartBtn?.addEventListener('click', () => cartSidebar.classList.remove('open'));
document.getElementById("cartIcon")?.addEventListener("click", () => { loadCart(); cartSidebar.classList.add('open'); });

// Checkout
checkoutBtn?.addEventListener('click', () => { window.location.href = "/confirm.html"; });

// Initialize checkout button visibility
toggleCheckoutButton((JSON.parse(localStorage.getItem('cart')) || []).length > 0);

// ==========================
// 🛒 ADD TO CART / BUY NOW
// ==========================
const addCartBtn = document.querySelector('.add-cart');
const buyNowBtn = document.querySelector('.buy-now');

if (addCartBtn) {
  const product = getCurrentProduct();
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.some(item => item.productId === product.productId)) disableAddToCartButton();

  addCartBtn.addEventListener('click', () => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const product = getCurrentProduct();
    if (!cart.some(item => item.productId === product.productId)) {
      cart.push(product);
      localStorage.setItem('cart', JSON.stringify(cart));
      disableAddToCartButton();
      loadCart();
      cartSidebar.classList.add('open');
    }
  });
}

const addTocartBtn = document.querySelector(".add-cart")

if (buyNowBtn) {
  buyNowBtn.addEventListener('click', () => {
    const product = getCurrentProduct();
    localStorage.setItem('cart', JSON.stringify([product]));
    window.location.href = "/confirm.html";
  });
}

// ==========================
// ✅ CHECK IF PRODUCT IS SOLD
// ==========================
const productId = getCurrentProductId();
const productStatusRef = ref(db, `products/${productId}/status`);

onValue(productStatusRef, (snapshot) => {
  if (snapshot.val() === "sold") {
    disableAddToCartButton();
    if (buyNowBtn) {
      buyNowBtn.disabled = true;
      buyNowBtn.innerText = "Sold Out";
      buyNowBtn.style.backgroundColor = "#fff";
      buyNowBtn.style.cursor = "not-allowed";
      addTocartBtn.style.display = "none"
    }
  }
});

// ==========================
// 🌄 SLIDER & THUMBNAILS
// ==========================
const sliderTrack = document.getElementById("sliderTrack");
if (sliderTrack) {
  const sliderContainer = sliderTrack.parentElement;
  const slides = Array.from(sliderTrack.querySelectorAll("img"));
  const thumbnails = Array.from(document.querySelectorAll(".thumb"));
  let currentIndex = 0;

  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;

  function setWidths() {
    const vw = sliderContainer.clientWidth;
    slides.forEach(img => img.style.width = `${vw}px`);
    sliderTrack.style.width = `${vw * slides.length}px`;
    updateSlidePosition();
  }

  function goToSlide(index) {
    if (index < 0) index = 0;
    if (index >= slides.length) index = slides.length - 1;
    currentIndex = index;
    prevTranslate = -currentIndex * sliderContainer.clientWidth;
    currentTranslate = prevTranslate;
    sliderTrack.style.transition = "transform 0.4s ease";
    sliderTrack.style.transform = `translateX(${currentTranslate}px)`;

    thumbnails.forEach(t => t.classList.remove("active"));
    if (thumbnails[currentIndex]) thumbnails[currentIndex].classList.add("active");
  }

  function updateSlidePosition() {
    sliderTrack.style.transform = `translateX(-${currentIndex * sliderContainer.clientWidth}px)`;
    prevTranslate = -currentIndex * sliderContainer.clientWidth;
    currentTranslate = prevTranslate;
  }

  function getPositionX(event) {
    return event.type.includes("mouse") ? event.pageX : event.touches[0].clientX;
  }

  function touchStart(event) {
    isDragging = true;
    startX = getPositionX(event);
    sliderTrack.style.transition = "none";
  }

  function touchMove(event) {
    if (!isDragging) return;
    const currentPosition = getPositionX(event);
    currentTranslate = prevTranslate + currentPosition - startX;
    sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
  }

  function touchEnd() {
    if (!isDragging) return;
    isDragging = false;
    const movedBy = currentTranslate - prevTranslate;
    if (movedBy < -50) currentIndex++;
    else if (movedBy > 50) currentIndex--;
    goToSlide(currentIndex);
  }

  sliderTrack.addEventListener("touchstart", touchStart, { passive: true });
  sliderTrack.addEventListener("touchmove", touchMove, { passive: true });
  sliderTrack.addEventListener("touchend", touchEnd);
  sliderTrack.addEventListener("mousedown", touchStart);
  sliderTrack.addEventListener("mousemove", touchMove);
  sliderTrack.addEventListener("mouseup", touchEnd);
  sliderTrack.addEventListener("mouseleave", () => { if (isDragging) touchEnd(); });

  thumbnails.forEach((thumb, i) => {
    thumb.addEventListener("click", () => goToSlide(i));
  });

  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") goToSlide(currentIndex - 1);
    if (e.key === "ArrowRight") goToSlide(currentIndex + 1);
  });

  window.addEventListener("resize", setWidths);

  setWidths();
  goToSlide(0);

  window.changeImage = function(element) {
    const index = thumbnails.indexOf(element);
    if (index >= 0) goToSlide(index);
  };
}
