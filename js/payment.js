import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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

document.addEventListener("DOMContentLoaded", () => {
  // ==========================
  // INITIAL DATA
  // ==========================
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const grandTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const totalElement = document.getElementById("grandTotal");
  if (totalElement) totalElement.textContent = `₹${grandTotal.toLocaleString("en-IN")}`;

  const upiBtn = document.getElementById("upiBtn");
  const qrBtn = document.getElementById("qrBtn");
  const qrModal = document.getElementById("qrModal");
  const qrContainer = qrModal ? qrModal.querySelector(".qr-img") : null;
  const closeBtn = qrModal ? qrModal.querySelector(".close") : null;
  const codButtons = document.querySelectorAll(".codBtn");

  // ==========================
  // MOBILE DETECTION
  // ==========================
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 900;
  if (!isMobile && upiBtn) upiBtn.style.display = "none";

  // ==========================
  // PAYMENT CODE GENERATION
  // ==========================

  function generatePaymentCode() {
    const length = Math.floor(Math.random() * 10) + 5; // 5–15 digits
    let code = "";
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  // 🔹 Always make a new one and save it
  function getPaymentCode() {
    const code = generatePaymentCode();
    localStorage.setItem("paymentCode", code); // replace old one
    return code;
  }

  // 🔄 Run automatically whenever site loads
  window.addEventListener("load", () => {
    const newCode = getPaymentCode();
    console.log(newCode);
  });

  // ==========================
  // 🧾 CREATE ORDER DATA
  // ==========================
  function createOrderData(paymentMethod, status) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const addressData = JSON.parse(localStorage.getItem("address")) || {};
    const grandTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const paymentCode = localStorage.getItem("paymentCode");

    const itemsList = cart.map(item => ({
      title: item.title,
      price: item.price,
      quantity: item.quantity || 1
    }));

    return {
      paymentCode,
      timestamp: new Date().toISOString(),
      paymentMethod,
      status,
      total: grandTotal,
      customer: {
        name: addressData.fullname || "N/A",
        phone: addressData.phone || "N/A",
        email: addressData.email || "N/A",
        address: addressData.address || "N/A",
        city: addressData.city || "N/A",
        state: addressData.state || "N/A",
        pincode: addressData.pincode || "N/A",
        country: addressData.country || "N/A"
      },
      items: itemsList
    };
  }

  // ==========================
  // 🔥 SAVE TO FIREBASE
  // ==========================
  async function saveOrderToFirebase(orderData) {
    try {
      const ordersRef = ref(db, "orders");
      const newOrderRef = push(ordersRef);
      await set(newOrderRef, orderData);
      console.log("✅ Order saved to Firebase:", orderData);
    } catch (error) {
      console.error("❌ Firebase Error:", error);
    }
  }

  // ==========================
  // UPI PAYMENT
  // ==========================
  const waitElement2 = document.getElementById("wait2");
  if (upiBtn) {
    upiBtn.addEventListener("click", async () => {
      const orderData = createOrderData("UPI Payment", "Payment Initiated");
      await saveOrderToFirebase(orderData);
      if (waitElement2) waitElement2.style.display = "flex";
      setTimeout(() => {
        window.location.href = "/pay.html";
      }, 2000);
    });
  }

  // ==========================
  // QR PAYMENT
  // ==========================
  if (qrBtn && qrModal && qrContainer) {
    qrBtn.addEventListener("click", async () => {
      qrModal.style.display = "flex";
      qrContainer.innerHTML = "";
      const paymentCode = localStorage.getItem("paymentCode");
      const upiId = "krisecogreens@oksbi";
      const name = "Slag";
      const note = `Order-${paymentCode}`;
      const amount = Number(grandTotal).toFixed(2);
      const qrData = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

      new QRCode(qrContainer, { text: qrData, width: 200, height: 200 });

      const orderData = createOrderData("QR Payment", "Awaiting Payment Confirmation");
      await saveOrderToFirebase(orderData);
    });
  }

  // ==========================
  // QR MODAL CLOSE LOGIC
  // ==========================
  if (closeBtn && qrModal) {
    closeBtn.addEventListener("click", () => (qrModal.style.display = "none"));
    window.addEventListener("click", (e) => {
      if (e.target === qrModal) qrModal.style.display = "none";
    });
  }

  // ==========================
  // CASH ON DELIVERY
  // ==========================
  codButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (document.getElementById("codPopup")) return;

      const popup = document.createElement("div");
      popup.id = "codPopup";
      popup.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      `;

      const box = document.createElement("div");
      box.style.cssText = `
        background: #fff;
        padding: 25px 30px;
        border-radius: 12px;
        text-align: center;
        max-width: 350px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      `;
      box.innerHTML = `
        <h3 style="margin-bottom: 10px; font-weight:600;">Confirm Your Order</h3>
        <p style="margin-bottom: 20px; color:#555;">You’ve selected <b>Cash on Delivery</b>. Please confirm to place your order.</p>
        <button id="confirmCOD" style="background:#111;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">Confirm Order</button>
        <button id="cancelCOD" style="margin-left:10px;background:#ccc;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">Cancel</button>
      `;
      popup.appendChild(box);
      document.body.appendChild(popup);
    });
  });

  const waitElement = document.getElementById("wait");

  // ==========================
  // COD POPUP LOGIC
  // ==========================
  document.body.addEventListener("click", async (e) => {
    if (e.target && e.target.id === "confirmCOD") {
      if (waitElement) waitElement.style.display = "flex";
      setTimeout(() => {
        window.location.href = "/codPayment.html";
      }, 1000);
      const popup = document.getElementById("codPopup");
      if (popup) popup.remove();
    }
    if (e.target && e.target.id === "cancelCOD") {
      const popup = document.getElementById("codPopup");
      if (popup) popup.remove();
    }
  });
});
