// ==========================
// 🔥 FIREBASE CONFIGURATION
// ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// 🧠 Replace these with your Firebase credentials
const firebaseConfig = {
    apiKey: "AIzaSyCtt8sm0j6DhguOWHC7S6r0_8GUTQheGts",
    authDomain: "slagdatabase.firebaseapp.com",
    databaseURL: "https://slagdatabase-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "slagdatabase",
    storageBucket: "slagdatabase.firebasestorage.app",
    messagingSenderId: "161359818821",
    appId: "1:161359818821:web:58322ee107921f5ca1332c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================
// ⚙️ HELPER FUNCTIONS
// ==========================
function getPageName() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf("/") + 1);
    return file.replace(".html", "").toLowerCase();
}
// ==========================
// 💰 PAYMENT PAGE LOGIC
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    const currentPage = getPageName();
    const isPaymentPage = currentPage === "payment";

    // --------------------------
    // 🧾 When inside payment.html
    // --------------------------
    if (isPaymentPage) {
        const upiBtn = document.getElementById("upiBtn");
        const qrBtn = document.getElementById("qrBtn");
        const cart = JSON.parse(localStorage.getItem("cart")) || [];

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

        if (upiBtn) {
            upiBtn.addEventListener("click", async () => {
                await markProductsAsSold(cart);
                console.log("✅ All products marked as sold (UPI)");
            });
        }

        if (qrBtn) {
            qrBtn.addEventListener("click", async () => {
                await markProductsAsSold(cart);
                console.log("✅ All products marked as sold (QR)");
            });
        }
    }

    // --------------------------
    // 🛍️ PRODUCT PAGE LOGIC
    // --------------------------
    if (!isPaymentPage) {
        const productName = getPageName();
        const buyNowBtn = document.querySelector(".buy-now");
        const addCartBtn = document.querySelector(".add-cart");

        if (productName) {
            localStorage.setItem("productName", productName);
            const productRef = ref(db, `products/${productName}/status`);

            onValue(productRef, (snapshot) => {
                const status = snapshot.val();

                if (status === "sold") {
                    if (buyNowBtn) {
                        buyNowBtn.textContent = "Sold Out";
                        buyNowBtn.style.color = "red";
                        buyNowBtn.disabled = true;
                        buyNowBtn.style.cursor = "not-allowed";
                    }
                    if (addCartBtn) {
                        addCartBtn.style.backgroundColor = "#ccc";
                        addCartBtn.disabled = true;
                        addCartBtn.style.cursor = "not-allowed";
                    }
                }
            });
        }

        // --------------------------
        // 🏠 INDEX PAGE LOGIC
        // --------------------------
        // Automatically replace prices with "Sold Out"
        const productElements = document.querySelectorAll(".product");
        productElements.forEach(productEl => {
            const productId = productEl.id.toLowerCase(); // e.g., "rf1"
            const priceEl = productEl.querySelector(".price");
            const oldPriceEl = productEl.querySelector(".old");

            if (!priceEl) return;

            const statusRef = ref(db, `products/slag-${productId}/status`);

            onValue(statusRef, (snapshot) => {
                const status = snapshot.val();
                if (status === "sold") {
                    // Change price text
                    priceEl.textContent = "Sold Out";
                    priceEl.style.color = "red";
                    // Optionally hide old price
                    if (oldPriceEl) oldPriceEl.style.display = "none";
                }
            });
        });
    }
});
