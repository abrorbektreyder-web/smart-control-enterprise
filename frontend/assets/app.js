const API_URL = "http://127.0.0.1:8000";

// CURRENT USER STATE
let currentUser = {
    name: "Admin",
    role: "owner" // owner or cashier
};

// POS STATE
let cart = [];
let todaySalesCount = 0;
let todaySalesTotal = 0;

document.addEventListener("DOMContentLoaded", () => {
    initChart();
    fetchDashboardData();
    updateUIForRole();
});

// ROLE MANAGEMENT
function switchRole() {
    const selectedRole = document.getElementById('role-switcher').value;
    currentUser.role = selectedRole;

    if (selectedRole === 'owner') {
        currentUser.name = "Admin";
        document.getElementById('user-name').innerText = "Admin";
        document.getElementById('user-role').innerText = "Owner";
        document.getElementById('user-avatar').innerText = "AD";
    } else {
        currentUser.name = "Kassir";
        document.getElementById('user-name').innerText = "Kassir";
        document.getElementById('user-role').innerText = "Cashier";
        document.getElementById('user-avatar').innerText = "KS";
    }

    updateUIForRole();
    loadDashboard();
}

function updateUIForRole() {
    const menuItems = document.querySelectorAll('.menu a');

    if (currentUser.role === 'cashier') {
        menuItems[3].style.display = 'none'; // Qarzlar
        menuItems[4].style.display = 'none'; // Hisobotlar
    } else {
        menuItems.forEach(item => item.style.display = 'flex');
    }
}

// NAVIGATION FUNCTIONS
function loadDashboard() {
    setActiveMenu(0);
    document.getElementById('page-title').innerText = "Boshqaruv Paneli";

    const mainContent = document.querySelector('.view-container');

    if (currentUser.role === 'cashier') {
        mainContent.innerHTML = `
            <div class="card glass" style="padding: 30px; margin-bottom: 20px; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
                <h3 style="color: var(--accent-red); margin-bottom: 10px;">⚠️ Kassir Rejimi</h3>
                <p style="color: var(--text-secondary);">Siz kassir sifatida tizimga kirdingiz. Moliyaviy ma'lumotlar yashirilgan.</p>
            </div>
            
            <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="card stat-card glass">
                    <div class="stat-icon stock">📦</div>
                    <div class="stat-info">
                        <h3>Mahsulotlar Soni</h3>
                        <h2 id="product-count">0</h2>
                        <span class="sub-text">Jami mahsulotlar</span>
                    </div>
                </div>

                <div class="card stat-card glass">
                    <div class="stat-icon stock">⚠️</div>
                    <div class="stat-info">
                        <h3>Kam Qolgan</h3>
                        <h2 id="low-stock">0</h2>
                        <span class="sub-text">To'ldirish kerak</span>
                    </div>
                </div>
            </div>

            <div class="card glass" style="padding: 40px; text-align: center; margin-top: 20px;">
                <h2>🛒 Yangi Savdo Boshlash</h2>
                <p style="color: var(--text-secondary); margin-top: 15px;">
                    Yangi savdo boshlash uchun "Yangi savdo" bo'limiga o'ting.
                </p>
                <button onclick="loadSales()" style="margin-top: 20px; padding: 12px 30px; background: var(--accent-blue); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                    Savdo Boshlash
                </button>
            </div>
        `;

        document.getElementById('product-count').innerText = "45";
        document.getElementById('low-stock').innerText = "12";

    } else {
        mainContent.innerHTML = `
            <div class="stats-grid">
                <div class="card stat-card glass">
                    <div class="stat-icon sales">💰</div>
                    <div class="stat-info">
                        <h3>Bugungi Savdo</h3>
                        <h2 id="total-sales">0.00 UZS</h2>
                        <span class="trend up">▲ +12% kechaga nisbatan</span>
                    </div>
                </div>

                <div class="card stat-card glass">
                    <div class="stat-icon cash">💵</div>
                    <div class="stat-info">
                        <h3>Kassa</h3>
                        <h2 id="cash-flow">0.00 UZS</h2>
                        <span class="sub-text">Kassada</span>
                    </div>
                </div>

                <div class="card stat-card glass">
                    <div class="stat-icon debt">📒</div>
                    <div class="stat-info">
                        <h3>Faol Qarzlar</h3>
                        <h2 id="active-debts">0.00 UZS</h2>
                        <span class="sub-text">Jami Qarz</span>
                    </div>
                </div>

                <div class="card stat-card glass">
                    <div class="stat-icon stock">⚠️</div>
                    <div class="stat-info">
                        <h3>Kam Qolgan Mahsulotlar</h3>
                        <h2 id="low-stock">0</h2>
                        <span class="sub-text">To'ldirish kerak</span>
                    </div>
                </div>
            </div>

            <div class="content-grid">
                <div class="card chart-container glass">
                    <div class="card-header">
                        <h3>Savdo Grafigi</h3>
                        <select class="chart-filter">
                            <option>Oxirgi 7 kun</option>
                            <option>Oxirgi 30 kun</option>
                        </select>
                    </div>
                    <canvas id="salesChart"></canvas>
                </div>

                <div class="card table-container glass">
                    <div class="card-header">
                        <h3>So'nggi Savdolar</h3>
                        <button class="btn-text">Barchasini ko'rish</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Vaqt</th>
                                <th>Summa</th>
                                <th>To'lov</th>
                                <th>Holat</th>
                            </tr>
                        </thead>
                        <tbody id="transactions-body"></tbody>
                    </table>
                </div>
            </div>
        `;

        initChart();
        fetchDashboardData();
    }
}

function loadProducts() {
    setActiveMenu(1);
    document.getElementById('page-title').innerText = "Mahsulotlar";

    const mainContent = document.querySelector('.view-container');
    mainContent.innerHTML = `
        <div class="card glass" style="padding: 40px; text-align: center;">
            <h2>📦 Mahsulotlar Bo'limi</h2>
            <p style="color: var(--text-secondary); margin-top: 20px;">
                Bu yerda mahsulotlarni boshqarish funksiyalari bo'ladi.
            </p>
            <p style="color: var(--text-secondary); margin-top: 10px;">
                (Keyingi qadamda backend bilan ulanadi)
            </p>
        </div>
    `;
}

function loadSales() {
    setActiveMenu(2);
    document.getElementById('page-title').innerText = "Yangi Savdo";

    const mainContent = document.querySelector('.view-container');
    mainContent.innerHTML = `
        <style>
            .pos-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; height: calc(100vh - 150px); }
            .pos-input { flex: 1; padding: 12px; background: var(--bg-darker); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); font-size: 1rem; }
            .pos-input:focus { outline: none; border-color: var(--accent-blue); }
            .pos-select { width: 100%; padding: 12px; background: var(--bg-darker); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); font-size: 1rem; cursor: pointer; }
            .btn-primary { padding: 12px 24px; background: var(--accent-blue); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s; }
            .btn-primary:hover { background: #2563eb; transform: translateY(-2px); }
            .btn-checkout { width: 100%; padding: 18px; background: var(--accent-green); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.1rem; font-weight: 700; transition: all 0.3s; }
            .btn-checkout:hover:not(:disabled) { background: #059669; }
            .btn-checkout:disabled { background: var(--text-secondary); cursor: not-allowed; opacity: 0.5; }
            .btn-clear { width: 100%; padding: 12px; background: rgba(239, 68, 68, 0.2); color: var(--accent-red); border: 1px solid var(--accent-red); border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 10px; }
            .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 8px; margin-bottom: 10px; }
            .cart-item-info { flex: 1; }
            .cart-item-name { font-weight: 600; margin-bottom: 4px; }
            .cart-item-price { color: var(--text-secondary); font-size: 0.9rem; }
            .cart-item-actions { display: flex; align-items: center; gap: 10px; }
            .qty-btn { width: 30px; height: 30px; background: var(--accent-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
            .qty-display { min-width: 40px; text-align: center; font-weight: 600; }
            .remove-btn { padding: 6px 12px; background: rgba(239, 68, 68, 0.2); color: var(--accent-red); border: none; border-radius: 6px; cursor: pointer; }
        </style>

        <div class="pos-grid">
            <div style="display: flex; flex-direction: column;">
                <div class="card glass" style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 15px;">🔍 Mahsulot Qidirish</h3>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="barcode-input" placeholder="Shtrix-kod kiriting..." class="pos-input" onkeypress="if(event.key==='Enter') searchProduct()" />
                        <button onclick="searchProduct()" class="btn-primary">Qidirish</button>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 10px;">Enter tugmasini bosing</p>
                </div>

                <div class="card glass" style="flex: 1; display: flex; flex-direction: column;">
                    <h3 style="margin-bottom: 15px;">🛒 Savat</h3>
                    <div id="cart-items" style="flex: 1; overflow-y: auto; max-height: 400px;">
                        <p style="color: var(--text-secondary); text-align: center; padding: 40px 0;">Savat bo'sh</p>
                    </div>
                    
                    <div style="border-top: 1px solid var(--glass-border); padding-top: 15px; margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>Jami:</span>
                            <strong id="cart-count">0</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 1.3rem; color: var(--accent-blue);">
                            <strong>Summa:</strong>
                            <strong id="cart-total">0 UZS</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card glass">
                <h3 style="margin-bottom: 20px;">💳 To'lov</h3>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; color: var(--text-secondary);">To'lov turi:</label>
                    <select id="payment-method" class="pos-select" onchange="toggleCustomerInfo()">
                        <option value="CASH">💵 Naqd pul</option>
                        <option value="CARD">💳 Karta</option>
                        <option value="DEBT">📒 Nasiya</option>
                    </select>
                </div>

                <div id="customer-info" style="display: none; margin-bottom: 20px; padding: 15px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px;">
                    <h4 style="margin-bottom: 10px; color: var(--accent-red);">Mijoz</h4>
                    <input type="text" id="customer-name" placeholder="Ismi" class="pos-input" style="margin-bottom: 10px;" />
                    <input type="text" id="customer-phone" placeholder="+998..." class="pos-input" />
                </div>

                <button onclick="processCheckout()" class="btn-checkout" id="checkout-btn" disabled>
                    ✓ Sotish
                </button>

                <button onclick="clearCart()" class="btn-clear">🗑️ Tozalash</button>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--glass-border);">
                    <h4 style="margin-bottom: 15px; color: var(--text-secondary);">Bugun</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Savdolar:</span>
                        <strong id="today-count">0</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Jami:</span>
                        <strong id="today-total">0 UZS</strong>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => document.getElementById('barcode-input').focus(), 100);
}

function loadDebts() {
    if (currentUser.role === 'cashier') {
        alert('⚠️ Kassirlar qarzlarni ko\'ra olmaydi!');
        return;
    }

    setActiveMenu(3);
    document.getElementById('page-title').innerText = "Qarzlar";

    const mainContent = document.querySelector('.view-container');
    mainContent.innerHTML = `
        <div class="card glass" style="padding: 40px; text-align: center;">
            <h2>📒 Qarzlar</h2>
            <p style="color: var(--text-secondary); margin-top: 20px;">Keyingi qadamda ulanadi</p>
        </div>
    `;
}

function loadReports() {
    if (currentUser.role === 'cashier') {
        alert('⚠️ Kassirlar hisobotlarni ko\'ra olmaydi!');
        return;
    }

    setActiveMenu(4);
    document.getElementById('page-title').innerText = "Hisobotlar";

    const mainContent = document.querySelector('.view-container');
    mainContent.innerHTML = `
        <div class="card glass" style="padding: 40px; text-align: center;">
            <h2>📈 Hisobotlar</h2>
            <p style="color: var(--text-secondary); margin-top: 20px;">Keyingi qadamda ulanadi</p>
        </div>
    `;
}

function setActiveMenu(index) {
    const menuItems = document.querySelectorAll('.menu a');
    menuItems.forEach((item, i) => {
        if (item.style.display !== 'none' && i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// POS FUNCTIONS
function toggleCustomerInfo() {
    const method = document.getElementById('payment-method').value;
    const customerInfo = document.getElementById('customer-info');
    customerInfo.style.display = method === 'DEBT' ? 'block' : 'none';
}

async function searchProduct() {
    const barcode = document.getElementById('barcode-input').value.trim();

    if (!barcode) {
        alert('⚠️ Shtrix-kod kiriting!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products/barcode/${barcode}`);

        if (response.ok) {
            const product = await response.json();
            addToCart(product);
            document.getElementById('barcode-input').value = '';
            document.getElementById('barcode-input').focus();
        } else {
            alert(`❌ Mahsulot topilmadi: ${barcode}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Backend bilan bog\'lanishda xatolik!');
    }
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            barcode: product.barcode,
            quantity: 1
        });
    }

    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    const count = document.getElementById('cart-count');
    const total = document.getElementById('cart-total');
    const btn = document.getElementById('checkout-btn');

    if (cart.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px 0;">Savat bo\'sh</p>';
        btn.disabled = true;
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price.toLocaleString()} UZS</div>
                </div>
                <div class="cart-item-actions">
                    <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                    <button class="remove-btn" onclick="removeItem(${item.id})">🗑️</button>
                </div>
            </div>
        `).join('');
        btn.disabled = false;
    }

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    count.innerText = totalItems;
    total.innerText = totalAmount.toLocaleString() + ' UZS';
}

function updateQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeItem(id);
        } else {
            updateCartUI();
        }
    }
}

function removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm('Savatni tozalash?')) {
        cart = [];
        updateCartUI();
    }
}

async function processCheckout() {
    if (cart.length === 0) {
        alert('⚠️ Savat bo\'sh!');
        return;
    }

    const method = document.getElementById('payment-method').value;
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const saleData = {
        items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
        })),
        payment_method: method,
        total_amount: totalAmount
    };

    if (method === 'DEBT') {
        const name = document.getElementById('customer-name').value.trim();
        const phone = document.getElementById('customer-phone').value.trim();

        if (!name || !phone) {
            alert('⚠️ Mijoz ma\'lumotlarini kiriting!');
            return;
        }

        saleData.customer_name = name;
        saleData.customer_phone = phone;
    }

    try {
        const response = await fetch(`${API_URL}/sales/checkout?user_id=1`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });

        if (response.ok) {
            const result = await response.json();

            todaySalesCount++;
            todaySalesTotal += totalAmount;
            document.getElementById('today-count').innerText = todaySalesCount;
            document.getElementById('today-total').innerText = todaySalesTotal.toLocaleString() + ' UZS';

            alert(`✅ Savdo yakunlandi!\\n\\nID: #${result.id}\\nSumma: ${totalAmount.toLocaleString()} UZS\\nTo\'lov: ${method}`);

            cart = [];
            updateCartUI();

            if (method === 'DEBT') {
                document.getElementById('customer-name').value = '';
                document.getElementById('customer-phone').value = '';
            }

            document.getElementById('barcode-input').focus();
        } else {
            const error = await response.json();
            alert(`❌ Xatolik: ${error.detail || 'Savdo amalga oshmadi'}`);
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('❌ Backend bilan bog\'lanishda xatolik!');
    }
}

// DASHBOARD DATA
async function fetchDashboardData() {
    try {
        const totalSales = document.getElementById('total-sales');
        const cashFlow = document.getElementById('cash-flow');
        const activeDebts = document.getElementById('active-debts');
        const lowStock = document.getElementById('low-stock');

        if (totalSales) totalSales.innerText = "1,250,000 UZS";
        if (cashFlow) cashFlow.innerText = "850,000 UZS";
        if (activeDebts) activeDebts.innerText = "4,500,000 UZS";
        if (lowStock) lowStock.innerText = "12";

        const tbody = document.getElementById('transactions-body');
        if (tbody) {
            const txs = [
                { id: 1024, time: "10:45", total: "15,000", method: "NAQD", status: "completed" },
                { id: 1023, time: "10:30", total: "450,000", method: "QARZ", status: "debt" },
                { id: 1022, time: "09:15", total: "12,000", method: "KARTA", status: "completed" },
                { id: 1021, time: "09:00", total: "8,500", method: "NAQD", status: "completed" },
            ];

            tbody.innerHTML = txs.map(tx => `
                <tr>
                    <td>#${tx.id}</td>
                    <td>${tx.time}</td>
                    <td>${tx.total}</td>
                    <td>${tx.method}</td>
                    <td><span class="badge ${tx.status}">${tx.status === 'completed' ? 'YAKUNLANDI' : 'QARZ'}</span></td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error("Dashboard error:", error);
    }
}

// CHART
function initChart() {
    const el = document.getElementById('salesChart');
    if (!el) return;

    const ctx = el.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'],
            datasets: [{
                label: 'Savdo (UZS)',
                data: [1200000, 1900000, 300000, 500000, 200000, 3000000, 1500000],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}
