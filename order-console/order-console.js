// app.js (ES module)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getDatabase, ref, onChildAdded, onValue, get, set, remove } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js';

// ---------- Firebase Config ----------
const firebaseConfig = {
    apiKey: "AIzaSyCtt8sm0j6DhguOWHC7S6r0_8GUTQheGts",
    authDomain: "slagdatabase.firebaseapp.com",
    databaseURL: "https://slagdatabase-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "slagdatabase",
    storageBucket: "slagdatabase.firebasestorage.app",
    messagingSenderId: "161359818821",
    appId: "1:161359818821:web:58322ee107921f5ca1332c"
};

// ---------- Initialize Firebase ----------
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------- Elements ----------
const el = id => document.getElementById(id);
const ordersContainer = el('orders');
const lastOrderEl = el('lastOrder');
const toastEl = el('toast');
const pwModal = el('pwModal');
const pwInput = el('pwInput');
const pwSubmit = el('pwSubmit');

// ---------- Track rendered orders to avoid duplicates ----------
const renderedKeys = new Set();

// ---------- Toast ----------
function showToast(msg, ms = 3000) {
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    setTimeout(() => toastEl.style.display = 'none', ms);
}

// ---------- Daily Password ----------
const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const pwDbRef = ref(db, `console/passwords/${todayKey}`);

async function ensureDailyPassword() {
    try {
        const snap = await get(pwDbRef);
        if (snap.exists()) {
            return snap.val();
        } else {
            const pw = generatePassword(10);
            await set(pwDbRef, pw);
            return pw;
        }
    } catch (e) {
        console.error('Password check error:', e);
        showToast('Unable to reach Firebase for password');
        return null;
    }
}

function generatePassword(len = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    return Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

let dailyPassword = null;

async function showPasswordPrompt() {
    dailyPassword = await ensureDailyPassword();
    pwModal.style.display = 'flex';
    pwInput.focus();
}

pwSubmit.addEventListener('click', () => {
    const val = pwInput.value.trim();
    if (!val) return;
    if (val === dailyPassword) {
        pwModal.style.display = 'none';
        showToast('Welcome — console unlocked');
        startOrdersListener();
    } else {
        showToast('Wrong password');
        pwInput.value = '';
        pwInput.focus();
    }
});

pwInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') pwSubmit.click();
});

// ---------- Helpers ----------
function formatCurrency(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
}

function formatTime(ts) {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleString('en-IN', { hour12: true });
}

function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"']/g, s => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]
    ));
}

// ---------- Firebase Product Control ----------
async function makeProductsAvailable(cart) {
    try {
        for (const item of cart) {
            if (!item.productId) continue;
            const productRef = ref(db, `products/${item.productId}/status`);
            await set(productRef, "available");
            console.log(`✅ Marked ${item.productId} as AVAILABLE`);
        }
        showToast("Selected products are now available");
    } catch (error) {
        console.error("❌ Error making available:", error);
        showToast("Error updating product status");
    }
}

// ---------- Details Modal ----------
const detailsModal = document.createElement('div');
detailsModal.className = 'modal';
detailsModal.style.display = 'none';
detailsModal.innerHTML = `
  <div class="modal-card">
    <h2>Order Details</h2>
    <div id="detailsContent" style="max-height:70vh;overflow:auto;margin-top:10px;"></div>
    <div class="modal-actions" style="text-align:right;margin-top:10px;">
      <button id="closeDetails" class="btn small ghost">Close</button>
    </div>
  </div>
`;
document.body.appendChild(detailsModal);
const detailsContent = detailsModal.querySelector('#detailsContent');
const closeDetails = detailsModal.querySelector('#closeDetails');
closeDetails.onclick = () => detailsModal.style.display = 'none';

// ---------- Orders ----------
function renderOrder(orderData, key) {
    // skip if already rendered
    if (renderedKeys.has(key)) return;

    const card = document.createElement('article');
    card.className = 'order-card';
    card.dataset.orderId = key;
    renderedKeys.add(key);

    if (/cash|cod|cash on delivery/i.test(orderData.paymentMethod || '')) {
        card.classList.add('cod');
    }

    // exact time
    const ts = orderData.timestamp || orderData.createdAt || orderData.time || Date.now();
    const timeString = formatTime(ts);

    const header = document.createElement('div');
    header.className = 'order-header';
    const left = document.createElement('div');
    left.innerHTML = `<strong>${escapeHtml(orderData.customer?.name || '—')}</strong>
    <div class="meta">ID: ${escapeHtml(orderData.paymentCode || key)}</div>`;
    const right = document.createElement('div');
    right.innerHTML = `<div class="meta">${escapeHtml(orderData.paymentMethod || '')}</div>
                     <div class="meta">${timeString}</div>`;
    header.append(left, right);

    const itemsWrap = document.createElement('div');
    itemsWrap.className = 'items';
    if (Array.isArray(orderData.items)) {
        orderData.items.forEach(it => {
            const item = document.createElement('div');
            item.className = 'item';
            item.innerHTML = `<div>${escapeHtml(it.title || '')} x${escapeHtml(it.quantity || 1)}</div>
        <div>${formatCurrency(it.price)}</div>`;
            itemsWrap.appendChild(item);
        });
    }

    const bottom = document.createElement('div');
    bottom.className = 'bottom';
    const totals = document.createElement('div');
    totals.className = 'meta';
    totals.textContent = `Total: ${formatCurrency(orderData.total || 0)}`;

    const actions = document.createElement('div');
    actions.className = 'actions';

    // View Details button
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'btn small ghost';
    detailsBtn.textContent = 'View Details';
    detailsBtn.onclick = () => openDetailsModal(orderData, key, timeString);

    // Generate Invoice button
    const invoiceLink = document.createElement('a');
    invoiceLink.className = 'btn small';
    invoiceLink.textContent = 'Generate Invoice';
    invoiceLink.href = `https://slag.in/generate-invoice.html?order=${encodeURIComponent(orderData.paymentCode || key)}`;
    invoiceLink.target = '_blank';

    // WhatsApp Confirmation
    const phone = "+91" + String(orderData.customer?.phone || '').replace(/\D/g, '');
    const waText = `Hoii ${orderData.customer?.name || ''}, your Slag order (ID: ${orderData.paymentCode || key}) of ₹${orderData.total || 0} has been confirmed!`;
    const waLink = document.createElement('a');
    waLink.className = 'btn ghost small';
    waLink.textContent = 'Send WhatsApp Confirmation';
    waLink.href = `https://wa.me/${phone}?text=${encodeURIComponent(waText)}`;
    waLink.target = '_blank';

    // WhatsApp Payment Failed
    const waFail = document.createElement('a');
    waFail.className = 'btn small warn';
    waFail.textContent = 'Send Payment Failed Msg';
    const failText = `Hello ${orderData.customer?.name || ''}, your Slag order (ID: ${orderData.paymentCode || key}) of ₹${orderData.total || 0} has failed. If you are sure that you paid the amount, please contact Slag customer support through slag.in/contact.html`;

    waFail.href = `https://wa.me/${phone}?text=${encodeURIComponent(failText)}`;
    waFail.target = '_blank';

    // Delete Order button
    const delBtn = document.createElement('button');
    delBtn.className = 'btn small danger';
    delBtn.textContent = 'Delete Order';
    delBtn.onclick = async () => {
        if (!confirm('Are you sure you want to delete this order?')) return;
        try {
            await remove(ref(db, `orders/${key}`));
            // remove from DOM & tracking set
            card.remove();
            renderedKeys.delete(key);
            showToast('Order deleted successfully');
        } catch (e) {
            console.error(e);
            showToast('Failed to delete order');
        }
    };

    // Make Available button
    const availBtn = document.createElement('button');
    availBtn.className = 'btn small success';
    availBtn.textContent = 'Make it Available';
    availBtn.onclick = async () => {
        if (!orderData.items) return showToast('No items found in order');
        await makeProductsAvailable(orderData.items);
    };

    actions.append(detailsBtn, invoiceLink, waLink, waFail, availBtn, delBtn);
    bottom.append(totals, actions);

    card.append(header, itemsWrap, bottom);

    // newest order on top
    ordersContainer.prepend(card);
}

function openDetailsModal(orderData, key, timeString) {
    const c = orderData.customer || {};
    const phone = String(c.phone || '').replace(/\D/g, '');

    const confirmMsg = encodeURIComponent(
        `Hello ${c.name || ''}, your Slag order (ID: ${orderData.paymentCode || key}) of ₹${orderData.total || 0} has been confirmed!`
    );
    const failedMsg = encodeURIComponent(
        `Hello ${c.name || ''}, your payment for Slag order (ID: ${orderData.paymentCode || key}) was not successful. Please complete the payment to confirm your order.`
    );

    detailsContent.innerHTML = `
    <div><strong>Order ID:</strong> ${escapeHtml(orderData.paymentCode || key)}</div>
    <div><strong>Time:</strong> ${timeString}</div>
    <div><strong>Name:</strong> ${escapeHtml(c.name || '')}</div>
    <div><strong>Phone:</strong> ${escapeHtml(c.phone || '')}</div>
    <div><strong>Email:</strong> ${escapeHtml(c.email || '—')}</div>
    <div><strong>Payment Method:</strong> ${escapeHtml(orderData.paymentMethod || '')}</div>
    <div><strong>Total:</strong> ${formatCurrency(orderData.total || 0)}</div>
    <hr />
    <div><strong>Address:</strong></div>
    <div>${escapeHtml(c.address || '')}</div>
    <div>${escapeHtml(c.city || '')}, ${escapeHtml(c.state || '')}</div>
    <div>${escapeHtml(c.pincode || '')}</div>
    <div>${escapeHtml(c.country || '')}</div>
    <hr />
    <div><strong>Items:</strong></div>
    <ul>
      ${(Array.isArray(orderData.items) ? orderData.items : [])
            .map(i => `<li>${escapeHtml(i.title || '')} x${i.quantity || 1} — ${formatCurrency(i.price || 0)}</li>`)
            .join('')}
    </ul>
    <hr />
    <div class="modal-actions">
      <a href="https://wa.me/${phone}?text=${confirmMsg}" target="_blank" class="btn small">Send WhatsApp Confirmation</a>
      <a href="https://wa.me/${phone}?text=${failedMsg}" target="_blank" class="btn ghost small">Payment Failed Message</a>
      <button id="deleteOrderBtn" class="btn danger small">Delete Order</button>
      <button id="makeAvailableBtn" class="btn success small">Make it Available</button>
    </div>
  `;
    detailsModal.style.display = 'flex';

    // delete in modal (also removes from set & DOM)
    const deleteBtn = document.getElementById('deleteOrderBtn');
    deleteBtn?.addEventListener('click', async () => {
        if (!confirm(`Are you sure you want to delete order ${orderData.paymentCode || key}?`)) return;
        try {
            await remove(ref(db, `orders/${key}`));
            detailsModal.style.display = 'none';
            // remove DOM card and tracking
            document.querySelector(`[data-order-id="${key}"]`)?.remove();
            renderedKeys.delete(key);
            showToast('Order deleted successfully');
        } catch (err) {
            console.error(err);
            showToast('Failed to delete order');
        }
    });

    // make available from modal
    const makeAvailBtn = document.getElementById('makeAvailableBtn');
    makeAvailBtn?.addEventListener('click', async () => {
        if (!orderData.items) return showToast('No items found in order');
        await makeProductsAvailable(orderData.items);
    });
}

// ---------- Listen for Orders ----------
let started = false;
function startOrdersListener() {
    if (started) return;
    started = true;

    const ordersRef = ref(db, 'orders');

    // clear container and set to empty before initial load
    ordersContainer.innerHTML = '';
    renderedKeys.clear();

    // initial load: get existing orders and render newest-first
    get(ordersRef).then(snapshot => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();
        const keys = Object.keys(data || {}).sort((a, b) => {
            const A = data[a].timestamp || data[a].createdAt || 0;
            const B = data[b].timestamp || data[b].createdAt || 0;
            return B - A; // newest first
        });

        keys.forEach(k => {
            renderOrder(data[k], k);
        });

        // show last order time (most recent)
        const lastKey = keys[0];
        if (lastKey) {
            const last = data[lastKey];
            const ts = last.timestamp || last.createdAt || Date.now();
            lastOrderEl.textContent = `Last order: ${formatTime(ts)}`;
        }
    });

    // realtime: onChildAdded will fire for each existing child AND new ones.
    // skip duplicates by checking renderedKeys.
    onChildAdded(ordersRef, snap => {
        const key = snap.key;
        const val = snap.val();
        if (renderedKeys.has(key)) return; // skip duplicate
        renderOrder(val, key);

        // update last order time
        const ts = val.timestamp || val.createdAt || Date.now();
        lastOrderEl.textContent = `Last order: ${formatTime(ts)}`;
        showToast('New order received');
    });

    // optional: if orders are removed elsewhere, update DOM and tracking set in realtime
    onValue(ordersRef, snap => {
        if (!snap.exists()) return;
        const currentKeys = new Set(Object.keys(snap.val() || {}));
        // remove DOM cards for keys that no longer exist
        for (const k of Array.from(renderedKeys)) {
            if (!currentKeys.has(k)) {
                document.querySelector(`[data-order-id="${k}"]`)?.remove();
                renderedKeys.delete(k);
            }
        }
    });
}

// ---------- Start ----------
window.addEventListener('load', showPasswordPrompt);

