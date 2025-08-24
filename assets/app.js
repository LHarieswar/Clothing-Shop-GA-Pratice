// Utility functions
function getParamByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateNavCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const navCount = document.getElementById('nav-cart-count');
  if (navCount) navCount.textContent = count;
}

function renderRating(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '';
  for (let i = 0; i < full; i++) stars += '★';
  if (half) stars += '☆';
  while (stars.length < 5) stars += '☆';
  return stars;
}

// Fetch products from JSON
async function fetchProducts() {
  if (window._productsCache) return window._productsCache;
  const res = await fetch('assets/products.json');
  const data = await res.json();
  window._productsCache = data;
  return data;
}

// Index page: show featured products (first 6 items)
async function loadFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;
  const products = await fetchProducts();
  const featured = products.slice(0, 6);
  container.innerHTML = featured
    .map(p => createProductCardHTML(p))
    .join('');
  updateNavCartCount();
}

// Category page
async function loadCategoryPage() {
  const prodContainer = document.getElementById('category-products');
  if (!prodContainer) return;
  const products = await fetchProducts();
  const hash = window.location.hash.substring(1);
  const category = hash || 'men';
  document.getElementById('category-title').textContent =
    category.charAt(0).toUpperCase() + category.slice(1);
  let filtered = products.filter(p => p.category === category);
  const searchInput = document.getElementById('search-input');
  const sizeFilter = document.getElementById('size-filter');
  const colorFilter = document.getElementById('color-filter');
  const sortSelect = document.getElementById('sort-select');

  function render() {
    let list = filtered;
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
      list = list.filter(p => p.name.toLowerCase().includes(searchTerm));
    }
    const size = sizeFilter.value;
    if (size) {
      list = list.filter(p => p.sizes.includes(size));
    }
    const color = colorFilter.value;
    if (color) {
      list = list.filter(p => p.colors.includes(color));
    }
    const sort = sortSelect.value;
    if (sort === 'price-asc') {
      list = list.slice().sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (sort === 'price-desc') {
      list = list.slice().sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    } else if (sort === 'rating-desc') {
      list = list.slice().sort((a, b) => b.rating - a.rating);
    }
    prodContainer.innerHTML = list.map(p => createProductCardHTML(p)).join('');
  }

  searchInput.addEventListener('input', render);
  sizeFilter.addEventListener('change', render);
  colorFilter.addEventListener('change', render);
  sortSelect.addEventListener('change', render);

  render();
  updateNavCartCount();
}

// Offers page
async function loadOffersPage() {
  const container = document.getElementById('offer-products');
  if (!container) return;
  const products = await fetchProducts();
  const offer = getParamByName('offer');
  document.getElementById('offers-title').textContent = offer ? `${offer.replace(/_/g, ' ')} Offer` : 'Offers';
  const list = offer ? products.filter(p => p.offer === offer) : products;
  container.innerHTML = list.map(p => createProductCardHTML(p)).join('');
  updateNavCartCount();
}

// Create product card HTML
function createProductCardHTML(p) {
  const pricePart = p.salePrice
    ? `<span class="old-price">$${p.price}</span> <span class="sale-price">$${p.salePrice}</span>`
    : `$${p.price}`;
  return `<div class="product-card">
      <a href="product.html?id=${p.id}" class="product-link">
        <div style="position: relative;">
          ${p.offer ? `<span class="offer-badge">${p.offer.replace(/_/g, ' ')}</span>` : ''}
          <img src="${p.image}" alt="${p.name}" />
        </div>
        <div class="product-info">
          <h3>${p.name}</h3>
          <p>${pricePart}</p>
          <div class="rating-stars">${renderRating(p.rating)}</div>
        </div>
      </a>
    </div>`;
}

// Product page
async function loadProductPage() {
  const imageEl = document.getElementById('product-image');
  if (!imageEl) return;
  const id = getParamByName('id');
  const products = await fetchProducts();
  const product = products.find(p => p.id === id);
  if (!product) {
    document.querySelector('.product-detail').innerHTML = '<p>Product not found.</p>';
    return;
  }
  document.title = product.name + ' – FashionShop';
  imageEl.src = product.image;
  imageEl.alt = product.name;
  document.getElementById('product-name').textContent = product.name;
  const priceEl = document.getElementById('product-price');
  priceEl.innerHTML = product.salePrice
    ? `<span class="old-price">$${product.price}</span> <span class="sale-price">$${product.salePrice}</span>`
    : `$${product.price}`;
  document.getElementById('product-rating').innerHTML = renderRating(product.rating);
  // render size options
  const sizeContainer = document.getElementById('size-options');
  sizeContainer.innerHTML = '';
  product.sizes.forEach(size => {
    const btn = document.createElement('button');
    btn.textContent = size;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#size-options button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    sizeContainer.appendChild(btn);
  });
  // default select first size
  if (sizeContainer.firstElementChild) sizeContainer.firstElementChild.classList.add('active');
  // render color options
  const colorContainer = document.getElementById('color-options');
  colorContainer.innerHTML = '';
  product.colors.forEach(col => {
    const btn = document.createElement('button');
    btn.textContent = col;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#color-options button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    colorContainer.appendChild(btn);
  });
  if (colorContainer.firstElementChild) colorContainer.firstElementChild.classList.add('active');
  // Add to cart handler
  document.getElementById('add-to-cart').addEventListener('click', () => {
    const selectedSizeBtn = document.querySelector('#size-options button.active');
    const selectedColorBtn = document.querySelector('#color-options button.active');
    const size = selectedSizeBtn ? selectedSizeBtn.textContent : product.sizes[0];
    const color = selectedColorBtn ? selectedColorBtn.textContent : product.colors[0];
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id && item.size === size && item.color === color);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: product.id, size, color, qty: 1 });
    }
    saveCart(cart);
    updateNavCartCount();
    alert('Added to cart');
  });
  // Reviews drawer
  const drawer = document.getElementById('reviews-drawer');
  const reviewsList = document.getElementById('reviews-list');
  document.getElementById('see-reviews').addEventListener('click', () => {
    reviewsList.innerHTML = '';
    product.reviews.forEach(r => {
      const div = document.createElement('div');
      div.className = 'review';
      div.innerHTML = `<div class="rating-stars">${renderRating(r.rating)}</div><p>${r.text}</p>`;
      reviewsList.appendChild(div);
    });
    drawer.classList.add('open');
  });
  document.getElementById('close-reviews').addEventListener('click', () => {
    drawer.classList.remove('open');
  });
  updateNavCartCount();
}

// Cart page
async function loadCartPage() {
  const container = document.getElementById('cart-items');
  if (!container) return;
  const cart = getCart();
  const products = await fetchProducts();
  if (cart.length === 0) {
    document.getElementById('empty-cart').style.display = 'block';
    document.getElementById('cart-summary').style.display = 'none';
  } else {
    document.getElementById('empty-cart').style.display = 'none';
    document.getElementById('cart-summary').style.display = 'block';
  }
  function renderCart() {
    container.innerHTML = '';
    let total = 0;
    cart.forEach((item, index) => {
      const product = products.find(p => p.id === item.id);
      if (!product) return;
      const price = product.salePrice || product.price;
      total += price * item.qty;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${product.image}" alt="${product.name}" />
        <div class="cart-item-info">
          <h4>${product.name}</h4>
          <p>Size: ${item.size} | Color: ${item.color}</p>
          <p>$${price}</p>
        </div>
        <div class="quantity-controls">
          <button class="decrease">−</button>
          <span>${item.qty}</span>
          <button class="increase">+</button>
          <button class="remove" title="Remove">×</button>
        </div>`;
      // event listeners
      const [decreaseBtn, increaseBtn, removeBtn] = div.querySelectorAll('button');
      decreaseBtn.addEventListener('click', () => {
        if (item.qty > 1) {
          item.qty -= 1;
        } else {
          cart.splice(index, 1);
        }
        saveCart(cart);
        updateNavCartCount();
        renderCart();
      });
      increaseBtn.addEventListener('click', () => {
        item.qty += 1;
        saveCart(cart);
        updateNavCartCount();
        renderCart();
      });
      removeBtn.addEventListener('click', () => {
        cart.splice(index, 1);
        saveCart(cart);
        updateNavCartCount();
        renderCart();
      });
      container.appendChild(div);
    });
    document.getElementById('cart-total').textContent = total.toFixed(2);
    if (cart.length === 0) {
      document.getElementById('empty-cart').style.display = 'block';
      document.getElementById('cart-summary').style.display = 'none';
    }
  }
  renderCart();
  updateNavCartCount();
}

// Checkout page
async function loadCheckoutPage() {
  const summary = document.getElementById('order-summary');
  if (!summary) return;
  const cart = getCart();
  const products = await fetchProducts();
  if (cart.length === 0) {
    summary.innerHTML = '<p>Your cart is empty.</p>';
    document.getElementById('place-order').style.display = 'none';
    return;
  }
  let total = 0;
  summary.innerHTML = '<h2>Order Summary</h2>';
  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;
    const price = product.salePrice || product.price;
    total += price * item.qty;
    const p = document.createElement('p');
    p.textContent = `${product.name} (Size: ${item.size}, Color: ${item.color}) × ${item.qty} – $${(price * item.qty).toFixed(2)}`;
    summary.appendChild(p);
  });
  const totalEl = document.createElement('p');
  totalEl.innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
  summary.appendChild(totalEl);
  document.getElementById('place-order').addEventListener('click', () => {
    // Clear cart
    saveCart([]);
    updateNavCartCount();
    // Show order message
    const orderId = 'ORD' + Math.floor(Math.random() * 1000000);
    document.getElementById('order-message').textContent = `Thank you! Your order ${orderId} has been placed.`;
    document.getElementById('place-order').style.display = 'none';
  });
  updateNavCartCount();
}

// On page load decide which page to initialize
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  loadFeaturedProducts();
  loadCategoryPage();
  loadOffersPage();
  loadProductPage();
  loadCartPage();
  loadCheckoutPage();
});
