document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const header = document.querySelector("header");
  const menuIcon = document.getElementById("menuIcon");
  const cartImg = document.getElementById("cartImg");

  let lastScrollY = window.scrollY;
  let menuOpen = false;

  // Toggle menu open/close
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle("open");
    menuOpen = mobileMenu.classList.contains("open");
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
      mobileMenu.classList.remove("open");
      menuOpen = false;
    }
  });

  // Scroll behavior
  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;

    // Hide/show only if menu is NOT open
    if (!menuOpen) {
      if (currentScroll > lastScrollY && currentScroll > 100) {
        header.classList.add("nav-hidden"); // scrolling down → hide
      } else {
        header.classList.remove("nav-hidden"); // scrolling up → show
      }
    } else {
      // Keep navbar visible when menu is open
      header.classList.remove("nav-hidden");
    }

    lastScrollY = currentScroll;
  });
});
