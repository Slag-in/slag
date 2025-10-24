// Get user's full name from localStorage
const usernameSpan = document.getElementById("username");
const fullName = localStorage.getItem("fullname");

if (fullName && fullName.trim() !== "") {
  usernameSpan.textContent = fullName;
} else {
  usernameSpan.textContent = "Customer";
}

// Countdown + redirect
let timeLeft = 5;
const countdownEl = document.getElementById("countdown");

const timer = setInterval(() => {
  timeLeft--;
  countdownEl.textContent = `Redirecting in ${timeLeft}...`;

  if (timeLeft <= 0) {
    clearInterval(timer);
    window.location.href = "/index.html";
  }
}, 1000);

const canvas = document.getElementById('tickCanvas');
const ctx = canvas.getContext('2d');
ctx.lineWidth = 5;
ctx.strokeStyle = '#4caf50';
ctx.lineCap = 'round';

let progress = 0;
function drawTick() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  if (progress < 0.5) {
    ctx.moveTo(25, 50);
    ctx.lineTo(25 + progress * 50, 50 + progress * 20);
  } else {
    ctx.moveTo(25, 50);
    ctx.lineTo(50, 75);
    ctx.lineTo(25 + (progress - 0.5) * 100, 75 - (progress - 0.5) * 100);
  }
  ctx.stroke();
  progress += 0.02;
  if (progress < 1) requestAnimationFrame(drawTick);
}
drawTick();
