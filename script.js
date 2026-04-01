document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(Flip);

    const state = { cart: {}, isCartOpen: false };
    
    const elements = {
        toggleBtn: document.getElementById('cart-toggle-btn'),
        dropdown: document.getElementById('cart-dropdown'),
        itemsList: document.getElementById('cart-items-list'),
        totalPrice: document.getElementById('cart-total-price'),
        badge: document.getElementById('cart-badge'),
        checkoutBtn: document.getElementById('checkout-btn')
    };
    
    // --- 1. THEME TOGGLE LOGIC ---
    function initThemeToggle() {
        const themeBtn = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');
        
        // 1. Check local storage, fallback to OS preference
        const savedTheme = localStorage.getItem('theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        // 2. Apply initial state
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

        // 3. Handle Clicks
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // GSAP spin animation for the icon swap
            gsap.to(themeIcon, { 
                rotation: "+=360", 
                duration: 0.5, 
                ease: "back.out(1.5)" 
            });
            
            setTimeout(() => {
                themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            }, 150);
        });
    }

    // --- 2. CART TOGGLE ---
    elements.toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.isCartOpen = !state.isCartOpen;
        elements.dropdown.classList.toggle('active', state.isCartOpen);
        elements.toggleBtn.setAttribute('aria-expanded', state.isCartOpen);
        if(state.isCartOpen) elements.checkoutBtn.focus();
    });

    document.addEventListener('click', (e) => {
        if (state.isCartOpen && !elements.toggleBtn.contains(e.target) && !elements.dropdown.contains(e.target)) {
            state.isCartOpen = false;
            elements.dropdown.classList.remove('active');
            elements.toggleBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // --- 3. DOM RENDERER ---
    function renderCart() {
        let totalItems = 0; let totalPrice = 0;
        const itemKeys = Object.keys(state.cart);

        if (itemKeys.length === 0) {
            elements.itemsList.innerHTML = '<div class="empty-cart-msg">Your cart is empty!</div>';
            elements.badge.style.display = 'none';
            elements.totalPrice.textContent = `$0.00`;
            return;
        }

        const emptyMsg = elements.itemsList.querySelector('.empty-cart-msg');
        if (emptyMsg) emptyMsg.remove();

        Array.from(elements.itemsList.children).forEach(node => {
            const title = node.dataset.id;
            if (!state.cart[title]) node.remove();
        });

        itemKeys.forEach(key => {
            const item = state.cart[key];
            totalItems += item.quantity;
            totalPrice += (item.price * item.quantity);

            let rowNode = elements.itemsList.querySelector(`[data-id="${key}"]`);
            if (rowNode) {
                rowNode.querySelector('.qty-number').textContent = item.quantity;
                rowNode.querySelector('.cart-item-price').textContent = `$${(item.price * item.quantity).toFixed(2)}`;
            } else {
                rowNode = document.createElement('div');
                rowNode.classList.add('cart-item');
                rowNode.dataset.id = key;
                rowNode.innerHTML = `
                    <div class="cart-item-icon">${item.icon}</div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${key}</h4>
                        <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                    <div class="qty-controls">
                        <button class="qty-btn minus-btn" aria-label="Decrease quantity">-</button>
                        <span class="qty-number">${item.quantity}</span>
                        <button class="qty-btn plus-btn" aria-label="Increase quantity">+</button>
                    </div>
                `;
                rowNode.querySelector('.plus-btn').addEventListener('click', () => updateQuantity(key, 1));
                rowNode.querySelector('.minus-btn').addEventListener('click', () => updateQuantity(key, -1));
                elements.itemsList.appendChild(rowNode);
            }
        });

        elements.totalPrice.textContent = `$${totalPrice.toFixed(2)}`;
        elements.badge.textContent = totalItems;
        elements.badge.style.display = 'flex';
    }

    function updateQuantity(title, change) {
        state.cart[title].quantity += change;
        if (state.cart[title].quantity <= 0) delete state.cart[title];
        triggerBadgeAnimation();
        renderCart();
    }

    function triggerBadgeAnimation() {
        elements.badge.classList.remove('bump');
        void elements.badge.offsetWidth; 
        elements.badge.classList.add('bump');
    }

    // --- 4. GSAP SPATIAL ANIMATION ---
    function animateToCart(productCardElement) {
        const productImage = productCardElement.querySelector('.mock-image');
        const flyingItem = productImage.cloneNode(true);
        
        flyingItem.style.position = 'fixed';
        flyingItem.style.zIndex = '9999';
        flyingItem.style.margin = '0';
        flyingItem.style.pointerEvents = 'none';
        
        const startRect = productImage.getBoundingClientRect();
        flyingItem.style.top = `${startRect.top}px`;
        flyingItem.style.left = `${startRect.left}px`;
        flyingItem.style.width = `${startRect.width}px`;
        flyingItem.style.height = `${startRect.height}px`;
        
        document.body.appendChild(flyingItem);
        const endRect = elements.toggleBtn.getBoundingClientRect();

        gsap.to(flyingItem, {
            top: endRect.top + (endRect.height / 2),
            left: endRect.left,
            scale: 0.3,
            opacity: 0.2,
            duration: 0.75,
            ease: "back.in(1.2)", 
            onComplete: () => {
                flyingItem.remove();
                triggerBadgeAnimation();
                renderCart();
            }
        });
    }

    // --- 5. MAGNETIC UI ---
    function initMagneticButtons() {
        const magneticElements = document.querySelectorAll('.magnetic');
        
        magneticElements.forEach(elem => {
            elem.addEventListener('mousemove', (e) => {
                const rect = elem.getBoundingClientRect();
                const h = rect.width / 2;
                const w = rect.height / 2;
                const x = e.clientX - rect.left - h;
                const y = e.clientY - rect.top - w;

                gsap.to(elem, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: "power2.out" });
            });

            elem.addEventListener('mouseleave', () => {
                gsap.to(elem, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
            });
        });
    }

    // --- 6. HOLOGRAPHIC GLASS REFLECTION ---
    function initHolographicGlass() {
        const cards = document.querySelectorAll('.product-card');
        
        cards.forEach(card => {
            const frame = card.querySelector('.window-frame');
            
            card.addEventListener('mousemove', (e) => {
                const rect = frame.getBoundingClientRect();
                const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
                const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
                
                frame.style.setProperty('--mouse-x', `${xPercent}%`);
                frame.style.setProperty('--mouse-y', `${yPercent}%`);
            });

            card.addEventListener('mouseleave', () => {
                frame.style.setProperty('--mouse-x', `50%`);
                frame.style.setProperty('--mouse-y', `50%`);
            });
        });
    }

    // --- 7. ADD TO CART BINDINGS ---
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const title = card.querySelector('.product-title').textContent;
            const price = parseFloat(card.dataset.price);
            const icon = card.querySelector('.mock-image').textContent;

            if (state.cart[title]) {
                state.cart[title].quantity += 1;
            } else {
                state.cart[title] = { price: price, icon: icon, quantity: 1 };
            }

            animateToCart(card);
            const originalText = btn.textContent;
            btn.textContent = 'ADDED! 💥';
            setTimeout(() => { btn.textContent = originalText; }, 800);
        });
    });

    // --- 8. SORTING LOGIC ---
    const sortSelect = document.getElementById('sort-select');
    const grid = document.getElementById('product-grid');
    
    if (sortSelect && grid) {
        sortSelect.addEventListener('change', (e) => {
            const cards = Array.from(grid.querySelectorAll('.product-card'));
            const sortType = e.target.value;

            cards.sort((a, b) => {
                if (sortType === 'price-low') return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
                if (sortType === 'price-high') return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
                if (sortType === 'bestselling') return parseInt(a.dataset.bestselling) - parseInt(b.dataset.bestselling);
                if (sortType === 'recommended') return parseInt(a.dataset.recommended) - parseInt(b.dataset.recommended);
                if (sortType === 'category') return a.dataset.category.localeCompare(b.dataset.category);
                return 0;
            });

            grid.innerHTML = '';
            cards.forEach(card => grid.appendChild(card));
        });
    }

    // Init All
    initThemeToggle();
    renderCart();
    initMagneticButtons();
    initHolographicGlass();
});
