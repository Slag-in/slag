document.addEventListener("DOMContentLoaded", () => {
  const itemList = document.getElementById("itemList");
  const grandTotal = document.getElementById("grandTotal");

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  function updateCheckout() {
    itemList.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("item");
      div.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <div class="item-details">
          <p><strong>${item.title}</strong></p>
          <p>₹${item.price}</p>
        </div>
      `;
      itemList.appendChild(div);
      total += item.price * item.quantity;
    });

    grandTotal.textContent = total.toLocaleString("en-IN");
  }

  document.getElementById("proceedBtn").addEventListener("click", () => {
    window.location.href = "/address.html"; // we'll make this next
  });

  updateCheckout();
});
