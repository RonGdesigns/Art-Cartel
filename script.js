document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CART DATA LOGIC ---
    let cart = {}; 
    
    const cartToggleBtn = document.getElementById('cart-toggle-btn');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartBadge = document.getElementById('cart-badge');
    
    // Toggle dropdown visibility
    cartToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        cartDropdown.classList.toggle('active');
    });

    // Close dropdown if clicking outside of it
    document.addEventListener('click', (e) => {
        if (!cartToggleBtn.contains(e.target) && !cartDropdown.contains(e.target)) {
            cartDropdown.classList.remove('active');
        }
    });

    // Function to update the DOM based on the cart object
    function renderCart() {
        cartItemsList.innerHTML = ''; // Clear current list
        let totalItems = 0;
        let totalPrice = 0;

        const itemKeys = Object.keys(cart);

        if (itemKeys.length === 0) {
            cartItemsList.innerHTML = '<div class="empty-cart-msg">Your cart is empty!</div>';
        } else {
            itemKeys.forEach(key => {
                const item = cart[key];
                totalItems += item.quantity;
                totalPrice += (item.price * item.quantity);

                // Build the HTML for this specific cart item
                const itemEl = document.createElement('div');
                itemEl.classList.add('cart-item');
                itemEl.innerHTML = `
                    <div class="cart-item-icon">${item.icon}</div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${key}</h4>
                        <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                    <div class="qty-controls">
                        <button class="qty-btn minus-btn" data-title="${key}">-</button>
                        <span class="qty-number">${item.quantity}</span>
                        <button class="qty-btn plus-btn" data-title="${key}">+</button>
                    </div>
                `;
                cartItemsList.appendChild(itemEl);
            });
        }

        // Update Total Price text
        cartTotalPrice.textContent = `$${totalPrice.toFixed(2)}`;

        // Update the Badge Number
        cartBadge.textContent = totalItems;
        if (totalItems > 0) {
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
            cartDropdown.classList.remove('active'); // Close if emptied
        }
        
        // Attach event listeners to the newly created + and - buttons
        attachQuantityListeners();
    }

    // Listeners for the + and - inside the dropdown
    function attachQuantityListeners() {
        const plusBtns = document.querySelectorAll('.plus-btn');
        const minusBtns = document.querySelectorAll('.minus-btn');

        plusBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const title = e.target.dataset.title;
                cart[title].quantity += 1;
                triggerBadgeAnimation();
                renderCart();
            });
        });

        minusBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const title = e.target.dataset.title;
                cart[title].quantity -= 1;
                // Remove item completely if it hits 0
                if (cart[title].quantity <= 0) {
                    delete cart[title];
                }
                triggerBadgeAnimation();
                renderCart();
            });
        });
    }

    function triggerBadgeAnimation() {
        cartBadge.classList.remove('bump');
        void cartBadge.offsetWidth; // Trigger reflow
        cartBadge.classList.add('bump');
    }

    // --- 2. ADD TO CART BUTTONS ON MAIN PAGE ---
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');

    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Traverse up to find the product card elements
            const card = e.target.closest('.product-card');
            const title = card.querySelector('.product-title').textContent;
            const priceText = card.querySelector('.product-price').textContent;
            const price = parseFloat(priceText.replace('$', ''));
            const icon = card.querySelector('.mock-image').textContent;

            // Add to cart object or increment if it exists
            if (cart[title]) {
                cart[title].quantity += 1;
            } else {
                cart[title] = { price: price, icon: icon, quantity: 1 };
            }

            triggerBadgeAnimation();
            renderCart();

            // Visual feedback on the button itself
            const originalText = btn.textContent;
            btn.textContent = 'ADDED! 💥';
            setTimeout(() => { btn.textContent = originalText; }, 800);
        });
    });

    // Initialize empty cart view
    renderCart();

    // --- 3. SORTING LOGIC ---
    const sortSelect = document.getElementById('sort-select');
    const grid = document.getElementById('product-grid');
    
    // Check if the sort select exists (in case you reuse this script on pages without a product grid)
    if (sortSelect && grid) {
        sortSelect.addEventListener('change', (e) => {
            const cards = Array.from(grid.querySelectorAll('.product-card'));
            const sortType = e.target.value;

            cards.sort((a, b) => {
                if (sortType === 'price-low') {
                    return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
                } else if (sortType === 'price-high') {
                    return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
                } else if (sortType === 'bestselling') {
                    return parseInt(a.dataset.bestselling) - parseInt(b.dataset.bestselling);
                } else if (sortType === 'recommended') {
                    return parseInt(a.dataset.recommended) - parseInt(b.dataset.recommended);
                } else if (sortType === 'category') {
                    return a.dataset.category.localeCompare(b.dataset.category);
                }
                return 0;
            });

            grid.innerHTML = '';
            cards.forEach(card => grid.appendChild(card));
        });
    }

});
