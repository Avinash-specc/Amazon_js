const cart = [];

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateCartUI() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartBtn = document.querySelector(".cart-btn");
  if (cartBtn) cartBtn.textContent = `🛒 Cart (${count})`;
}

// ── 2. ADD TO CART ────────────────────────────
function addToCart(name, priceStr) {
  // Parse price: grab last number from strings like "$799" or "$799 (20% off)"
  const match = priceStr.match(/\$?([\d.]+)/g);
  const price = match ? parseFloat(match[match.length - 1].replace("$", "")) : 0;

  const existing = cart.find((i) => i.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }

  updateCartUI();
  showToast(`✅ "${name}" added to cart!`);
}

// ── 3. TOAST NOTIFICATION ─────────────────────
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      background: "#232f3e",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "6px",
      fontSize: "14px",
      zIndex: "9999",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      transition: "opacity 0.3s",
      opacity: "0",
    });
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = "1";

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = "0";
  }, 2500);
}

// ── 4. CART MODAL ─────────────────────────────
function buildCartModal() {
  const modal = document.createElement("div");
  modal.id = "cart-modal";
  Object.assign(modal.style, {
    position: "fixed",
    top: "0",
    right: "0",
    width: "340px",
    height: "100%",
    background: "#fff",
    boxShadow: "-4px 0 16px rgba(0,0,0,0.2)",
    zIndex: "10000",
    overflowY: "auto",
    padding: "20px",
    boxSizing: "border-box",
    transition: "transform 0.3s ease",
    transform: "translateX(100%)",
  });

  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2 style="margin:0;font-size:20px">🛒 Your Cart</h2>
      <button id="close-cart" style="background:none;border:none;font-size:22px;cursor:pointer">✕</button>
    </div>
    <div id="cart-items"></div>
    <hr>
    <p id="cart-total" style="font-weight:bold;font-size:16px"></p>
    <button id="checkout-btn" style="width:100%;padding:12px;background:#ff9900;border:none;border-radius:4px;font-weight:bold;font-size:15px;cursor:pointer;margin-top:8px">
      Proceed to Checkout
    </button>
  `;

  document.body.appendChild(modal);

  document.getElementById("close-cart").addEventListener("click", closeCart);
  document.getElementById("checkout-btn").addEventListener("click", handleCheckout);

  return modal;
}

function openCart() {
  let modal = document.getElementById("cart-modal");
  if (!modal) modal = buildCartModal();
  renderCartItems();
  modal.style.transform = "translateX(0)";
}

function closeCart() {
  const modal = document.getElementById("cart-modal");
  if (modal) modal.style.transform = "translateX(100%)";
}

function renderCartItems() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "<p style='color:#888'>Your cart is empty.</p>";
    if (totalEl) totalEl.textContent = "";
    return;
  }

  container.innerHTML = cart
    .map(
      (item, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee">
      <div>
        <p style="margin:0;font-size:13px;font-weight:bold">${item.name}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#555">$${item.price.toFixed(2)} × ${item.qty}</p>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <button class="qty-btn" data-index="${i}" data-action="dec" style="width:24px;height:24px;cursor:pointer;font-size:14px;border:1px solid #ccc;background:#f3f3f3;border-radius:3px">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" data-index="${i}" data-action="inc" style="width:24px;height:24px;cursor:pointer;font-size:14px;border:1px solid #ccc;background:#f3f3f3;border-radius:3px">+</button>
        <button class="qty-btn" data-index="${i}" data-action="del" style="width:24px;height:24px;cursor:pointer;font-size:14px;border:none;background:#ff4444;color:#fff;border-radius:3px">🗑</button>
      </div>
    </div>
  `
    )
    .join("");

  if (totalEl) totalEl.textContent = `Total: $${getCartTotal().toFixed(2)}`;

  container.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index);
      const action = btn.dataset.action;
      if (action === "inc") cart[idx].qty++;
      if (action === "dec") {
        cart[idx].qty--;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
      }
      if (action === "del") cart.splice(idx, 1);
      updateCartUI();
      renderCartItems();
    });
  });
}

function handleCheckout() {
  if (cart.length === 0) {
    showToast("⚠️ Your cart is empty!");
    return;
  }
  showToast(`🎉 Order placed! Total: $${getCartTotal().toFixed(2)}`);
  cart.length = 0;
  updateCartUI();
  renderCartItems();
  setTimeout(closeCart, 1500);
}

// ── 5. SEARCH / FILTER ────────────────────────
function setupSearch() {
  const input = document.querySelector(".search-bar input");
  const btn = document.querySelector(".search-bar button");

  function doSearch() {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      document.querySelectorAll(".product").forEach((p) => (p.style.display = ""));
      return;
    }

    let found = 0;
    document.querySelectorAll(".product").forEach((card) => {
      const name = card.querySelector(".name")?.textContent.toLowerCase() || "";
      const visible = name.includes(query);
      card.style.display = visible ? "" : "none";
      if (visible) found++;
    });

    showToast(found ? `🔍 ${found} result(s) for "${query}"` : `😕 No results for "${query}"`);

    // Scroll to first visible product section
    if (found) {
      const first = document.querySelector(".product[style='']") || document.querySelector(".product:not([style*='none'])");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  if (btn) btn.addEventListener("click", doSearch);
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSearch();
    });
    // Clear filter when input is emptied
    input.addEventListener("input", () => {
      if (!input.value) document.querySelectorAll(".product").forEach((p) => (p.style.display = ""));
    });
  }
}

// ── 6. CATEGORY NAVIGATION ───────────────────
function setupCategoryCards() {
  document.querySelectorAll(".category").forEach((card) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const label = card.querySelector("p")?.textContent.toLowerCase() || "";
      const map = {
        electronics: "#electronics",
        books: "#books",
        fashion: "#fashion",
        "home & kitchen": "#home",
      };
      const target = Object.keys(map).find((k) => label.includes(k));
      if (target) {
        const el = document.querySelector(map[target]);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

// ── 7. STICKY HEADER SHADOW ──────────────────
function setupStickyHeader() {
  const header = document.querySelector("header");
  if (!header) return;
  window.addEventListener("scroll", () => {
    header.style.boxShadow = window.scrollY > 10 ? "0 2px 8px rgba(0,0,0,0.4)" : "none";
  });
}

// ── 8. BACK TO TOP ───────────────────────────
function buildBackToTop() {
  const btn = document.createElement("button");
  btn.id = "back-to-top";
  btn.textContent = "▲";
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "80px",
    right: "24px",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#ff9900",
    border: "none",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
    display: "none",
    zIndex: "9998",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  });
  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    btn.style.display = window.scrollY > 400 ? "block" : "none";
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ── 9. PRODUCT HOVER EFFECT ──────────────────
// Handled entirely in CSS via .product:hover { transform + box-shadow }
// No JS needed — CSS transitions are more performant and don't conflict
// with inline styles set elsewhere (e.g. wishlist button positioning).

// ── 10. WISHLIST ─────────────────────────────
const wishlist = new Set();

function setupWishlist() {
  document.querySelectorAll(".product").forEach((card) => {
    const name = card.querySelector(".name")?.textContent || "Item";

    const heartBtn = document.createElement("button");
    heartBtn.textContent = "🤍";
    heartBtn.title = "Add to Wishlist";
    Object.assign(heartBtn.style, {
      position: "absolute",
      top: "8px",
      right: "8px",
      background: "rgba(255,255,255,0.85)",
      border: "none",
      borderRadius: "50%",
      width: "30px",
      height: "30px",
      cursor: "pointer",
      fontSize: "15px",
      lineHeight: "30px",
      padding: "0",
    });

    card.style.position = "relative";
    card.appendChild(heartBtn);

    heartBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (wishlist.has(name)) {
        wishlist.delete(name);
        heartBtn.textContent = "🤍";
        showToast(`💔 "${name}" removed from wishlist`);
      } else {
        wishlist.add(name);
        heartBtn.textContent = "❤️";
        showToast(`❤️ "${name}" added to wishlist`);
      }
    });
  });
}

// ── 11. WIRE UP ADD-TO-CART BUTTONS ──────────
function setupAddToCartButtons() {
  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".product");
      const name = card.querySelector(".name")?.textContent || "Item";
      const priceEl = card.querySelector(".new-price") || card.querySelector(".price");
      const priceStr = priceEl?.textContent || "0";
      addToCart(name, priceStr);
    });
  });
}

// ── 12. INIT ─────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  setupCategoryCards();
  setupStickyHeader();
  buildBackToTop();
  setupWishlist();
  setupAddToCartButtons();

  // Open cart when cart button is clicked
  const cartBtn = document.querySelector(".cart-btn");
  if (cartBtn) {
    cartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openCart();
    });
  }
});