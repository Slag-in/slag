import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ==========================
// 🚀 INIT FIREBASE
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
// 🧠 HELPER: GET PRODUCT ID
// ==========================
function getProductIdFromPage() {
  const path = window.location.pathname; // "/slag-rf1.html"
  const file = path.substring(path.lastIndexOf("/") + 1); // "slag-rf1.html"
  return file.replace(".html", ""); // "slag-rf1"
}

document.addEventListener("DOMContentLoaded", () => {


  // ==========================
  // 🧾 CREATE ORDER DATA
  // ==========================
  function createOrderData() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const addressData = JSON.parse(localStorage.getItem("address")) || {};
    const grandTotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    const paymentCode = localStorage.getItem("paymentCode");
    const codCharge = 30;
    const codGrandTotal = grandTotal + codCharge;

    const itemsList = cart.map(item => ({
      productId: item.productId || item.title, // ensure productId exists
      title: item.title,
      price: item.price,
      quantity: item.quantity || 1
    }));

    return {
      paymentCode,
      timestamp: new Date().toISOString(),
      paymentMethod: "Cash on Delivery",
      status: "Order Confirmed & Awaiting Dispatch",
      total: codGrandTotal,
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
  // 🧠 SAVE ORDER TO FIREBASE
  // ==========================
  async function saveOrderToFirebase(orderData) {
    try {
      const ordersRef = ref(db, "orders");
      const newOrderRef = push(ordersRef);
      await set(newOrderRef, orderData);
      console.log("✅ Order saved to Firebase:", orderData);
      return true;
    } catch (error) {
      console.error("❌ Firebase Error:", error);
      return false;
    }
  }

  // ==========================
  // ❌ MARK PRODUCTS AS SOLD
  // ==========================
  async function markProductsAsSold(cart) {
    try {
      for (const item of cart) {
        const productRef = ref(db, `products/${item.productId}/status`);
        await set(productRef, "sold");
        console.log(`🛑 Marked ${item.productId} as SOLD`);
      }
    } catch (error) {
      console.error("❌ Error marking sold:", error);
    }
  }

  // ==========================
  // 💵 UPDATE PAGE INFO
  // ==========================
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const orderId = localStorage.getItem("paymentCode") || "—";
  const productTotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const codCharge = 30;
  const codGrandTotal = productTotal + codCharge;

  document.getElementById("productPrice").textContent = `₹${productTotal}`;
  document.getElementById("grandTotal").textContent = `₹${codGrandTotal}`;
  document.getElementById("orderId").textContent = orderId;

  // ==========================
  // ✅ CONFIRM BUTTON
  // ==========================
  const confirmBtn = document.getElementById("confirmBtn");
  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Confirming...";
    setTimeout(async () => {
      const orderData = createOrderData();
      const success = await saveOrderToFirebase(orderData);

      if (success) {
        await markProductsAsSold(orderData.items);
        confirmBtn.textContent = "Order Confirmed";
        confirmBtn.style.background = "#16a34a";
        localStorage.removeItem("cart");
      } else {
          confirmBtn.textContent = "Error! Try Again";
          confirmBtn.style.background = "#dc2626";
        }

    }, 1500);

    setTimeout(() => {
      window.location.href = "/success.html";
    }, 2500);
  });
});
