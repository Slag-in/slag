// Load cart items from localStorage
const cartItemsContainer = document.getElementById('cartItems');
const totalAmountEl = document.getElementById('totalAmount');
const cart = JSON.parse(localStorage.getItem('cart')) || [];

let total = 0;
cart.forEach(item => {
  const div = document.createElement('div');
  div.classList.add('item');
  div.innerHTML = `
    <img src="${item.image}" alt="${item.title}">
    <div>
      <p>${item.title}</p>
      <p>₹${item.price}</p>
    </div>
  `;
  cartItemsContainer.appendChild(div);
  total += parseFloat(item.price);
});
totalAmountEl.textContent = total;

// Form and submit button
const form = document.getElementById('addressForm');
const submitBtn = form.querySelector('button[type="submit"]'); // Proceed to Payment button
const requiredFields = [
  'phone',
  'fullname',
  'address',
  'state',
  'city',
  'pincode'
];
const checkbox = document.getElementById('termsCheckbox'); // Your terms checkbox

// Disable submit initially
submitBtn.disabled = true;
submitBtn.style.backgroundColor = '#ccc';
submitBtn.style.cursor = 'not-allowed';

// Function to check if all fields are filled
function validateForm() {
  let allFilled = requiredFields.every(id => {
    const field = document.getElementById(id);
    return field && field.value.trim() !== '';
  });

  // Validate phone number: exactly 10 digits
  const phone = document.getElementById('phone').value.trim();
  const validPhone = /^\d{10}$/.test(phone); // true if exactly 10 digits
  allFilled = allFilled && validPhone;

  // Check if checkbox is checked
  if (checkbox) {
    allFilled = allFilled && checkbox.checked;
  }

  // Enable or disable submit button
  submitBtn.disabled = !allFilled;
  submitBtn.style.backgroundColor = allFilled ? '' : '#ccc';
  submitBtn.style.cursor = allFilled ? 'pointer' : 'not-allowed';
}

// Attach input/change listeners to fields
requiredFields.forEach(id => {
  const field = document.getElementById(id);
  if (field) field.addEventListener('input', validateForm);
});

if (checkbox) checkbox.addEventListener('change', validateForm);

// Form submit
form.addEventListener('submit', e => {
  e.preventDefault();

  const addressData = {
    phone: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    country: document.getElementById('country').value,
    fullname: document.getElementById('fullname').value,
    address: document.getElementById('address').value,
    apartment: document.getElementById('apartment').value,
    state: document.getElementById('state').value,
    city: document.getElementById('city').value,
    pincode: document.getElementById('pincode').value
  };

  localStorage.setItem('address', JSON.stringify(addressData));
  window.location.href = 'payment.html';
});

// Run validation on page load
validateForm();
