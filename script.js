/* ============================================
   SUPPLIER MANAGEMENT SYSTEM — SCRIPT.JS
   All logic: CRUD, localStorage, Charts, etc.
   ============================================ */

// ============================================
// 1. DATA HELPERS
// ============================================

/** Save any data array to localStorage */
function saveData(key, data) {
  localStorage.setItem('sms_' + key, JSON.stringify(data));
}

/** Load data array from localStorage */
function getData(key) {
  const raw = localStorage.getItem('sms_' + key);
  return raw ? JSON.parse(raw) : [];
}

/** Auto-generate IDs like SUP001, PROD002, etc. */
function generateID(prefix, key) {
  const items = getData(key);
  if (items.length === 0) return prefix + '001';
  // Extract numbers from existing IDs and find max
  const nums = items.map(i => parseInt(i.id.replace(prefix, '')) || 0);
  const nextNum = Math.max(...nums) + 1;
  return prefix + String(nextNum).padStart(3, '0');
}

/** Format currency */
function formatCurrency(amount) {
  return '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format date nicely */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Today as YYYY-MM-DD */
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ============================================
// 2. SAMPLE / SEED DATA
// ============================================

function seedData() {
  if (getData('seeded').length > 0) return; // Already seeded

  const suppliers = [
    { id: 'SUP001', name: 'TechSource India', contact: '9876543210', email: 'techsource@example.com', address: '12 MG Road, Pune, MH', status: 'Active' },
    { id: 'SUP002', name: 'Global Electronics', contact: '8765432109', email: 'global@example.com', address: '45 Brigade Road, Bangalore, KA', status: 'Active' },
    { id: 'SUP003', name: 'Prime Supplies Co.', contact: '7654321098', email: 'prime@example.com', address: '7 Nehru Nagar, Nagpur, MH', status: 'Inactive' },
    { id: 'SUP004', name: 'Fast Parts Ltd.', contact: '9988776655', email: 'fastparts@example.com', address: '90 Anna Salai, Chennai, TN', status: 'Active' },
  ];

  const products = [
    { id: 'PROD001', name: 'USB-C Hub 7-in-1', category: 'Electronics', price: 1499, supplierId: 'SUP001', stock: 85 },
    { id: 'PROD002', name: 'Mechanical Keyboard', category: 'Peripherals', price: 3200, supplierId: 'SUP001', stock: 42 },
    { id: 'PROD003', name: 'HDMI 2.1 Cable 2m', category: 'Cables', price: 650, supplierId: 'SUP002', stock: 7 },
    { id: 'PROD004', name: 'Wireless Mouse Pro', category: 'Peripherals', price: 2100, supplierId: 'SUP002', stock: 30 },
    { id: 'PROD005', name: 'Thermal Paste 5g', category: 'Consumables', price: 299, supplierId: 'SUP003', stock: 5 },
    { id: 'PROD006', name: 'PCIe SSD 1TB', category: 'Storage', price: 6800, supplierId: 'SUP004', stock: 18 },
    { id: 'PROD007', name: 'LED Monitor 24"', category: 'Displays', price: 12500, supplierId: 'SUP004', stock: 9 },
  ];

  const orders = [
    { id: 'ORD001', supplierId: 'SUP001', productId: 'PROD001', quantity: 10, orderDate: '2025-11-05', status: 'Delivered' },
    { id: 'ORD002', supplierId: 'SUP001', productId: 'PROD002', quantity: 5,  orderDate: '2025-12-10', status: 'Delivered' },
    { id: 'ORD003', supplierId: 'SUP002', productId: 'PROD003', quantity: 20, orderDate: '2026-01-15', status: 'Delivered' },
    { id: 'ORD004', supplierId: 'SUP002', productId: 'PROD004', quantity: 8,  orderDate: '2026-02-01', status: 'Pending' },
    { id: 'ORD005', supplierId: 'SUP004', productId: 'PROD006', quantity: 3,  orderDate: '2026-02-18', status: 'Pending' },
    { id: 'ORD006', supplierId: 'SUP004', productId: 'PROD007', quantity: 2,  orderDate: '2026-03-05', status: 'Delivered' },
    { id: 'ORD007', supplierId: 'SUP001', productId: 'PROD001', quantity: 15, orderDate: '2026-03-10', status: 'Pending' },
  ];

  const payments = [
    { id: 'PAY001', orderId: 'ORD001', amount: 14990, paymentDate: '2025-11-08', status: 'Paid' },
    { id: 'PAY002', orderId: 'ORD002', amount: 16000, paymentDate: '2025-12-12', status: 'Paid' },
    { id: 'PAY003', orderId: 'ORD003', amount: 13000, paymentDate: '2026-01-20', status: 'Paid' },
    { id: 'PAY004', orderId: 'ORD004', amount: 16800, paymentDate: '2026-02-05', status: 'Unpaid' },
    { id: 'PAY005', orderId: 'ORD005', amount: 20400, paymentDate: '2026-02-20', status: 'Unpaid' },
    { id: 'PAY006', orderId: 'ORD006', amount: 25000, paymentDate: '2026-03-07', status: 'Paid' },
  ];

  saveData('suppliers', suppliers);
  saveData('products', products);
  saveData('orders', orders);
  saveData('payments', payments);
  saveData('activity', [
    { icon: '◉', text: 'TechSource India added as supplier', time: new Date().toLocaleTimeString() },
    { icon: '◎', text: 'Order ORD007 placed for USB-C Hub', time: new Date().toLocaleTimeString() },
    { icon: '◐', text: 'Payment PAY006 marked as Paid', time: new Date().toLocaleTimeString() },
    { icon: '⚠', text: 'Low stock alert: Thermal Paste 5g', time: new Date().toLocaleTimeString() },
  ]);
  saveData('seeded', [true]);
}

// ============================================
// 3. AUTH
// ============================================

const USERS = { Manish: 'manish123', Manager: 'manish456' };

function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const err  = document.getElementById('loginError');

  if (!user || !pass) { err.textContent = '⚠ Please fill in all fields.'; return; }

  if (USERS[user] && USERS[user] === pass) {
    localStorage.setItem('sms_auth', user);
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    initApp();
  } else {
    err.textContent = '✗ Invalid username or password.';
  }
}

function doLogout() {
  if (!confirm('Log out of the system?')) return;
  localStorage.removeItem('sms_auth');
  location.reload();
}

function checkAuth() {
  const user = localStorage.getItem('sms_auth');
  if (user) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    return true;
  }
  return false;
}

// Allow pressing Enter on login
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !document.getElementById('loginScreen').classList.contains('hidden')) {
    doLogin();
  }
});

// ============================================
// 4. NAVIGATION
// ============================================

function navigate(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target page
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  // Update nav highlight
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  // Update title
  const titles = {
    dashboard: 'Dashboard', suppliers: 'Suppliers', products: 'Products',
    orders: 'Orders', payments: 'Payments', inventory: 'Inventory',
    reports: 'Reports & Analytics', schema: 'DB Schema'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  // Refresh relevant page
  if (page === 'dashboard') refreshDashboard();
  if (page === 'suppliers') renderSuppliers();
  if (page === 'products')  renderProducts();
  if (page === 'orders')    renderOrders();
  if (page === 'payments')  renderPayments();
  if (page === 'inventory') renderInventory();
  if (page === 'reports')   renderReports();

  // Close sidebar on mobile
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ============================================
// 5. DASHBOARD
// ============================================

let revenueChartInst = null;
let ordersChartInst  = null;

function refreshDashboard() {
  const suppliers = getData('suppliers');
  const products  = getData('products');
  const orders    = getData('orders');
  const payments  = getData('payments');

  document.getElementById('stat-suppliers').textContent = suppliers.length;
  document.getElementById('stat-products').textContent  = products.length;
  document.getElementById('stat-pending').textContent   = orders.filter(o => o.status === 'Pending').length;
  document.getElementById('stat-completed').textContent = orders.filter(o => o.status === 'Delivered').length;

  const revenue = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  document.getElementById('stat-revenue').textContent = formatCurrency(revenue);

  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  // Activity list
  renderActivity();

  // Charts
  renderRevenueChart(payments);
  renderOrderStatusChart(orders);
}

function renderActivity() {
  const activities = getData('activity').slice(-8).reverse();
  const list = document.getElementById('activityList');
  if (!activities.length) {
    list.innerHTML = '<li><span class="activity-text">No activity yet.</span></li>';
    return;
  }
  list.innerHTML = activities.map(a => `
    <li>
      <div class="activity-icon">${a.icon}</div>
      <span class="activity-text">${a.text}</span>
      <span class="activity-time">${a.time}</span>
    </li>
  `).join('');
}

function addActivity(icon, text) {
  const activities = getData('activity');
  activities.push({ icon, text, time: new Date().toLocaleTimeString() });
  if (activities.length > 50) activities.shift();
  saveData('activity', activities);
}

function renderRevenueChart(payments) {
  const ctx = document.getElementById('revenueChart').getContext('2d');
  if (revenueChartInst) revenueChartInst.destroy();

  // Group payments by month
  const months = {};
  payments.filter(p => p.status === 'Paid').forEach(p => {
    const d = new Date(p.paymentDate);
    const key = d.toLocaleString('en-IN', { month:'short', year:'2-digit' });
    months[key] = (months[key] || 0) + parseFloat(p.amount || 0);
  });

  const labels = Object.keys(months).slice(-6);
  const data = labels.map(k => months[k]);

  revenueChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Revenue (₹)',
        data,
        backgroundColor: 'rgba(37,99,235,0.5)',
        borderColor: 'rgba(37,99,235,1)',
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#7a9cc7', font: { family: 'IBM Plex Mono', size: 11 } }, grid: { color: '#1e3054' } },
        y: { ticks: { color: '#7a9cc7', font: { family: 'IBM Plex Mono', size: 11 } }, grid: { color: '#1e3054' } }
      }
    }
  });
}

function renderOrderStatusChart(orders) {
  const ctx = document.getElementById('ordersChart').getContext('2d');
  if (ordersChartInst) ordersChartInst.destroy();

  const pending   = orders.filter(o => o.status === 'Pending').length;
  const delivered = orders.filter(o => o.status === 'Delivered').length;

  ordersChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Delivered'],
      datasets: [{
        data: [pending, delivered],
        backgroundColor: ['rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)'],
        borderColor: ['#f59e0b', '#10b981'],
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#7a9cc7', font: { family: 'Syne', size: 12 } } }
      }
    }
  });
}

// ============================================
// 6. SUPPLIERS MODULE
// ============================================

let supplierSortKey = 'id', supplierSortAsc = true;

function renderSuppliers() {
  const query     = (document.getElementById('searchSuppliers')?.value || '').toLowerCase();
  let   suppliers = getData('suppliers');

  // Filter
  if (query) {
    suppliers = suppliers.filter(s =>
      s.id.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query) ||
      s.contact.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      (s.address || '').toLowerCase().includes(query)
    );
  }

  // Sort
  suppliers.sort((a, b) => {
    const va = (a[supplierSortKey] || '').toString().toLowerCase();
    const vb = (b[supplierSortKey] || '').toString().toLowerCase();
    return supplierSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const tbody = document.getElementById('suppliersBody');
  if (!suppliers.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px">No suppliers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = suppliers.map(s => `
    <tr>
      <td class="mono">${s.id}</td>
      <td><strong>${s.name}</strong></td>
      <td class="mono">${s.contact}</td>
      <td>${s.email}</td>
      <td>${s.address || '—'}</td>
      <td>${statusBadge(s.status)}</td>
      <td class="td-actions">
        <button class="btn-icon" onclick="editSupplier('${s.id}')" title="Edit">✏</button>
        <button class="btn-icon del" onclick="confirmDelete('supplier','${s.id}','${s.name}')" title="Delete">🗑</button>
      </td>
    </tr>
  `).join('');
}

function openSupplierModal(isEdit = false) {
  document.getElementById('supplierModalTitle').textContent = isEdit ? 'Edit Supplier' : 'Add Supplier';
  if (!isEdit) {
    document.getElementById('supId').value        = '';
    document.getElementById('supDisplayId').value = generateID('SUP', 'suppliers');
    document.getElementById('supName').value      = '';
    document.getElementById('supContact').value   = '';
    document.getElementById('supEmail').value     = '';
    document.getElementById('supAddress').value   = '';
    document.getElementById('supStatus').value    = 'Active';
  }
  openModal('supplierModal');
}

function editSupplier(id) {
  const suppliers = getData('suppliers');
  const s = suppliers.find(x => x.id === id);
  if (!s) return;

  document.getElementById('supId').value        = s.id;
  document.getElementById('supDisplayId').value = s.id;
  document.getElementById('supName').value      = s.name;
  document.getElementById('supContact').value   = s.contact;
  document.getElementById('supEmail').value     = s.email;
  document.getElementById('supAddress').value   = s.address || '';
  document.getElementById('supStatus').value    = s.status;
  openSupplierModal(true);
}

function saveSupplier() {
  const id      = document.getElementById('supId').value.trim();
  const name    = document.getElementById('supName').value.trim();
  const contact = document.getElementById('supContact').value.trim();
  const email   = document.getElementById('supEmail').value.trim();
  const address = document.getElementById('supAddress').value.trim();
  const status  = document.getElementById('supStatus').value;

  // Validation
  if (!name) return showToast('Name is required.', 'error');
  if (!contact || !/^\d{10}$/.test(contact)) return showToast('Enter a valid 10-digit contact number.', 'error');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('Enter a valid email address.', 'error');

  let suppliers = getData('suppliers');

  if (id) {
    // Update existing
    const idx = suppliers.findIndex(s => s.id === id);
    if (idx >= 0) {
      suppliers[idx] = { ...suppliers[idx], name, contact, email, address, status };
      addActivity('◉', `Supplier ${name} updated`);
      showToast(`Supplier "${name}" updated successfully!`, 'success');
    }
  } else {
    // Add new
    const newId = document.getElementById('supDisplayId').value;
    suppliers.push({ id: newId, name, contact, email, address, status });
    addActivity('◉', `New supplier added: ${name}`);
    showToast(`Supplier "${name}" added successfully!`, 'success');
  }

  saveData('suppliers', suppliers);
  closeModal('supplierModal');
  renderSuppliers();
  refreshDashboard();
}

// ============================================
// 7. PRODUCTS MODULE
// ============================================

let productSortKey = 'id', productSortAsc = true;

function renderProducts() {
  const query    = (document.getElementById('searchProducts')?.value || '').toLowerCase();
  let   products = getData('products');
  const suppliers = getData('suppliers');

  if (query) {
    products = products.filter(p =>
      p.id.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }

  products.sort((a, b) => {
    let va = (a[productSortKey] || '').toString().toLowerCase();
    let vb = (b[productSortKey] || '').toString().toLowerCase();
    if (productSortKey === 'price' || productSortKey === 'stock') {
      va = parseFloat(a[productSortKey]) || 0;
      vb = parseFloat(b[productSortKey]) || 0;
      return productSortAsc ? va - vb : vb - va;
    }
    return productSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const tbody = document.getElementById('productsBody');
  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px">No products found.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const sup = suppliers.find(s => s.id === p.supplierId);
    const stockClass = p.stock < 10 ? 'stock-low' : 'stock-ok';
    return `
      <tr>
        <td class="mono">${p.id}</td>
        <td><strong>${p.name}</strong></td>
        <td>${p.category}</td>
        <td class="mono">${formatCurrency(p.price)}</td>
        <td>${sup ? sup.name : p.supplierId}</td>
        <td class="${stockClass} mono">${p.stock}${p.stock < 10 ? ' ⚠' : ''}</td>
        <td class="td-actions">
          <button class="btn-icon" onclick="editProduct('${p.id}')" title="Edit">✏</button>
          <button class="btn-icon del" onclick="confirmDelete('product','${p.id}','${p.name}')" title="Delete">🗑</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openProductModal(isEdit = false) {
  document.getElementById('productModalTitle').textContent = isEdit ? 'Edit Product' : 'Add Product';
  if (!isEdit) {
    document.getElementById('prodId').value        = '';
    document.getElementById('prodDisplayId').value = generateID('PROD', 'products');
    document.getElementById('prodName').value      = '';
    document.getElementById('prodCategory').value  = '';
    document.getElementById('prodPrice').value     = '';
    document.getElementById('prodStock').value     = '';
    populateSupplierDropdown('prodSupplier');
  }
  openModal('productModal');
}

function editProduct(id) {
  const products = getData('products');
  const p = products.find(x => x.id === id);
  if (!p) return;
  populateSupplierDropdown('prodSupplier', p.supplierId);
  document.getElementById('prodId').value        = p.id;
  document.getElementById('prodDisplayId').value = p.id;
  document.getElementById('prodName').value      = p.name;
  document.getElementById('prodCategory').value  = p.category;
  document.getElementById('prodPrice').value     = p.price;
  document.getElementById('prodStock').value     = p.stock;
  openProductModal(true);
}

function saveProduct() {
  const id         = document.getElementById('prodId').value.trim();
  const name       = document.getElementById('prodName').value.trim();
  const category   = document.getElementById('prodCategory').value.trim();
  const price      = parseFloat(document.getElementById('prodPrice').value);
  const supplierId = document.getElementById('prodSupplier').value;
  const stock      = parseInt(document.getElementById('prodStock').value);

  if (!name)          return showToast('Product name is required.', 'error');
  if (!category)      return showToast('Category is required.', 'error');
  if (isNaN(price) || price < 0) return showToast('Enter a valid price.', 'error');
  if (!supplierId)    return showToast('Please select a supplier.', 'error');
  if (isNaN(stock) || stock < 0) return showToast('Enter a valid stock quantity.', 'error');

  let products = getData('products');

  if (id) {
    const idx = products.findIndex(p => p.id === id);
    if (idx >= 0) {
      products[idx] = { ...products[idx], name, category, price, supplierId, stock };
      addActivity('◫', `Product ${name} updated`);
      showToast(`Product "${name}" updated!`, 'success');
    }
  } else {
    const newId = document.getElementById('prodDisplayId').value;
    products.push({ id: newId, name, category, price, supplierId, stock });
    addActivity('◫', `New product added: ${name}`);
    showToast(`Product "${name}" added!`, 'success');
  }

  saveData('products', products);
  closeModal('productModal');
  renderProducts();
  refreshDashboard();
}

// ============================================
// 8. ORDERS MODULE
// ============================================

function renderOrders() {
  const query  = (document.getElementById('searchOrders')?.value || '').toLowerCase();
  const filter = document.getElementById('filterOrderStatus')?.value || '';
  let   orders = getData('orders');
  const suppliers = getData('suppliers');
  const products  = getData('products');

  if (query) {
    orders = orders.filter(o =>
      o.id.toLowerCase().includes(query) ||
      o.supplierId.toLowerCase().includes(query) ||
      o.productId.toLowerCase().includes(query)
    );
  }
  if (filter) orders = orders.filter(o => o.status === filter);

  const tbody = document.getElementById('ordersBody');
  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px">No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const sup  = suppliers.find(s => s.id === o.supplierId);
    const prod = products.find(p => p.id === o.productId);
    return `
      <tr>
        <td class="mono">${o.id}</td>
        <td>${sup ? sup.name : o.supplierId}</td>
        <td>${prod ? prod.name : o.productId}</td>
        <td class="mono">${o.quantity}</td>
        <td class="mono">${formatDate(o.orderDate)}</td>
        <td>${statusBadge(o.status)}</td>
        <td class="td-actions">
          <button class="btn-icon" onclick="editOrder('${o.id}')" title="Edit">✏</button>
          <button class="btn-icon print" onclick="showInvoice('${o.id}')" title="Invoice">🧾</button>
          <button class="btn-icon del" onclick="confirmDelete('order','${o.id}','${o.id}')" title="Delete">🗑</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openOrderModal(isEdit = false) {
  document.getElementById('orderModalTitle').textContent = isEdit ? 'Edit Order' : 'New Order';
  if (!isEdit) {
    document.getElementById('ordId').value        = '';
    document.getElementById('ordDisplayId').value = generateID('ORD', 'orders');
    document.getElementById('ordDate').value      = todayStr();
    document.getElementById('ordQty').value       = '';
    document.getElementById('ordStatus').value    = 'Pending';
    document.getElementById('stockWarning').classList.add('hidden');
    populateSupplierDropdown('ordSupplier');
    filterProductsBySupplier();
  }
  openModal('orderModal');
}

function editOrder(id) {
  const orders = getData('orders');
  const o = orders.find(x => x.id === id);
  if (!o) return;

  populateSupplierDropdown('ordSupplier', o.supplierId);
  filterProductsBySupplier(o.supplierId);

  // Set product after supplier is populated
  setTimeout(() => {
    document.getElementById('ordProduct').value = o.productId;
    checkStockWarning();
  }, 50);

  document.getElementById('ordId').value        = o.id;
  document.getElementById('ordDisplayId').value = o.id;
  document.getElementById('ordQty').value       = o.quantity;
  document.getElementById('ordDate').value      = o.orderDate;
  document.getElementById('ordStatus').value    = o.status;
  openOrderModal(true);
}

function filterProductsBySupplier(supplierId) {
  const selSup  = document.getElementById('ordSupplier');
  const supId   = supplierId || selSup?.value;
  const products = getData('products').filter(p => p.supplierId === supId);
  const selProd  = document.getElementById('ordProduct');

  if (!selProd) return;
  selProd.innerHTML = products.length
    ? products.map(p => `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`).join('')
    : '<option value="">No products for this supplier</option>';

  checkStockWarning();
}

function checkStockWarning() {
  const productId = document.getElementById('ordProduct')?.value;
  const products  = getData('products');
  const prod      = products.find(p => p.id === productId);
  const warning   = document.getElementById('stockWarning');
  const stockSpan = document.getElementById('availableStock');

  if (prod && prod.stock < 10) {
    warning.classList.remove('hidden');
    stockSpan.textContent = prod.stock;
  } else {
    warning?.classList.add('hidden');
  }
}

function saveOrder() {
  const id         = document.getElementById('ordId').value.trim();
  const supplierId = document.getElementById('ordSupplier').value;
  const productId  = document.getElementById('ordProduct').value;
  const quantity   = parseInt(document.getElementById('ordQty').value);
  const orderDate  = document.getElementById('ordDate').value;
  const status     = document.getElementById('ordStatus').value;

  if (!supplierId)                return showToast('Please select a supplier.', 'error');
  if (!productId)                 return showToast('Please select a product.', 'error');
  if (isNaN(quantity) || quantity < 1) return showToast('Enter a valid quantity (min 1).', 'error');
  if (!orderDate)                 return showToast('Order date is required.', 'error');

  let orders   = getData('orders');
  let products = getData('products');
  const prodIdx = products.findIndex(p => p.id === productId);

  if (!id) {
    // New order: reduce stock
    if (prodIdx < 0) return showToast('Product not found.', 'error');
    if (products[prodIdx].stock < quantity) {
      return showToast(`Insufficient stock! Available: ${products[prodIdx].stock}`, 'error');
    }
    products[prodIdx].stock -= quantity;
    saveData('products', products);

    const newId = document.getElementById('ordDisplayId').value;
    orders.push({ id: newId, supplierId, productId, quantity, orderDate, status });
    addActivity('◎', `Order ${newId} placed for ${products[prodIdx].name}`);
    showToast(`Order ${newId} placed! Stock updated.`, 'success');
  } else {
    // Update existing
    const idx = orders.findIndex(o => o.id === id);
    if (idx >= 0) {
      const oldQty = orders[idx].quantity;
      const diff   = quantity - oldQty;
      if (diff > 0 && prodIdx >= 0) {
        if (products[prodIdx].stock < diff) {
          return showToast(`Insufficient stock for the increase! Available: ${products[prodIdx].stock}`, 'error');
        }
        products[prodIdx].stock -= diff;
        saveData('products', products);
      } else if (diff < 0 && prodIdx >= 0) {
        // Return stock
        products[prodIdx].stock += Math.abs(diff);
        saveData('products', products);
      }
      orders[idx] = { ...orders[idx], supplierId, productId, quantity, orderDate, status };
      addActivity('◎', `Order ${id} updated`);
      showToast(`Order ${id} updated!`, 'success');
    }
  }

  saveData('orders', orders);
  closeModal('orderModal');
  renderOrders();
  renderProducts();
  renderInventory();
  refreshDashboard();
}

// ============================================
// 9. PAYMENTS MODULE
// ============================================

function renderPayments() {
  const query  = (document.getElementById('searchPayments')?.value || '').toLowerCase();
  const filter = document.getElementById('filterPayStatus')?.value || '';
  let   payments = getData('payments');

  if (query) payments = payments.filter(p =>
    p.id.toLowerCase().includes(query) || p.orderId.toLowerCase().includes(query)
  );
  if (filter) payments = payments.filter(p => p.status === filter);

  const tbody = document.getElementById('paymentsBody');
  if (!payments.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px">No payments found.</td></tr>`;
    return;
  }

  tbody.innerHTML = payments.map(p => `
    <tr>
      <td class="mono">${p.id}</td>
      <td class="mono">${p.orderId}</td>
      <td class="mono">${formatCurrency(p.amount)}</td>
      <td class="mono">${formatDate(p.paymentDate)}</td>
      <td>${statusBadge(p.status)}</td>
      <td class="td-actions">
        <button class="btn-icon" onclick="editPayment('${p.id}')" title="Edit">✏</button>
        <button class="btn-icon del" onclick="confirmDelete('payment','${p.id}','${p.id}')" title="Delete">🗑</button>
      </td>
    </tr>
  `).join('');
}

function openPaymentModal(isEdit = false) {
  document.getElementById('paymentModalTitle').textContent = isEdit ? 'Edit Payment' : 'Add Payment';
  if (!isEdit) {
    document.getElementById('payId').value        = '';
    document.getElementById('payDisplayId').value = generateID('PAY', 'payments');
    document.getElementById('payDate').value      = todayStr();
    document.getElementById('payAmount').value    = '';
    document.getElementById('payStatus').value    = 'Paid';
    populateOrderDropdown('payOrderId');
  }
  openModal('paymentModal');
}

function editPayment(id) {
  const payments = getData('payments');
  const p = payments.find(x => x.id === id);
  if (!p) return;
  populateOrderDropdown('payOrderId', p.orderId);
  document.getElementById('payId').value        = p.id;
  document.getElementById('payDisplayId').value = p.id;
  document.getElementById('payAmount').value    = p.amount;
  document.getElementById('payDate').value      = p.paymentDate;
  document.getElementById('payStatus').value    = p.status;
  openPaymentModal(true);
}

function savePayment() {
  const id      = document.getElementById('payId').value.trim();
  const orderId = document.getElementById('payOrderId').value;
  const amount  = parseFloat(document.getElementById('payAmount').value);
  const date    = document.getElementById('payDate').value;
  const status  = document.getElementById('payStatus').value;

  if (!orderId)                  return showToast('Please select an order.', 'error');
  if (isNaN(amount) || amount <= 0) return showToast('Enter a valid amount.', 'error');
  if (!date)                     return showToast('Payment date is required.', 'error');

  let payments = getData('payments');

  if (id) {
    const idx = payments.findIndex(p => p.id === id);
    if (idx >= 0) {
      payments[idx] = { ...payments[idx], orderId, amount, paymentDate: date, status };
      addActivity('◐', `Payment ${id} updated to ${status}`);
      showToast(`Payment ${id} updated!`, 'success');
    }
  } else {
    const newId = document.getElementById('payDisplayId').value;
    payments.push({ id: newId, orderId, amount, paymentDate: date, status });
    addActivity('◐', `Payment ${newId} added — ${formatCurrency(amount)}`);
    showToast(`Payment ${newId} recorded!`, 'success');
  }

  saveData('payments', payments);
  closeModal('paymentModal');
  renderPayments();
  refreshDashboard();
}

// ============================================
// 10. INVENTORY MODULE
// ============================================

function renderInventory() {
  const query   = (document.getElementById('searchInventory')?.value || '').toLowerCase();
  const filter  = document.getElementById('filterInvStatus')?.value || '';
  let   products = getData('products');
  const suppliers = getData('suppliers');

  if (query) {
    products = products.filter(p =>
      p.id.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }
  if (filter === 'low')  products = products.filter(p => p.stock < 10);
  if (filter === 'ok')   products = products.filter(p => p.stock >= 10);

  const hasLow = getData('products').some(p => p.stock < 10);
  const alertEl = document.getElementById('lowStockAlert');
  if (alertEl) {
    if (hasLow) alertEl.classList.remove('hidden');
    else alertEl.classList.add('hidden');
  }

  const tbody = document.getElementById('inventoryBody');
  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px">No inventory records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const sup = suppliers.find(s => s.id === p.supplierId);
    const isLow = p.stock < 10;
    return `
      <tr>
        <td class="mono">${p.id}</td>
        <td><strong>${p.name}</strong></td>
        <td>${p.category}</td>
        <td>${sup ? sup.name : p.supplierId}</td>
        <td class="mono ${isLow ? 'stock-low' : 'stock-ok'}">${p.stock}${isLow ? ' ⚠' : ''}</td>
        <td>
          <span class="badge ${isLow ? 'badge-lowstock' : 'badge-normalstock'}">
            ${isLow ? 'LOW STOCK' : 'NORMAL'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================
// 11. REPORTS MODULE
// ============================================

let supplierOrdersChartInst = null;
let payBreakChartInst       = null;

function renderReports() {
  const payments  = getData('payments');
  const orders    = getData('orders');
  const suppliers = getData('suppliers');

  // Summary stats
  const revenue = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const unpaid  = payments.filter(p => p.status === 'Unpaid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  document.getElementById('rep-revenue').textContent     = formatCurrency(revenue);
  document.getElementById('rep-total-orders').textContent = orders.length;
  document.getElementById('rep-unpaid').textContent      = formatCurrency(unpaid);

  // Top supplier by orders
  const supOrderCount = {};
  orders.forEach(o => { supOrderCount[o.supplierId] = (supOrderCount[o.supplierId] || 0) + 1; });
  const topSupId  = Object.keys(supOrderCount).sort((a,b) => supOrderCount[b] - supOrderCount[a])[0];
  const topSup    = suppliers.find(s => s.id === topSupId);
  document.getElementById('rep-top-supplier').textContent = topSup ? topSup.name : '—';

  // Orders per supplier chart
  renderSupplierOrdersChart(orders, suppliers);

  // Payment breakdown chart
  renderPayBreakChart(payments);

  // Monthly summary table
  renderMonthlySummary(orders, payments);
}

function renderSupplierOrdersChart(orders, suppliers) {
  const ctx = document.getElementById('supplierOrdersChart').getContext('2d');
  if (supplierOrdersChartInst) supplierOrdersChartInst.destroy();

  const counts  = {};
  orders.forEach(o => { counts[o.supplierId] = (counts[o.supplierId] || 0) + 1; });

  const labels = Object.keys(counts).map(id => {
    const s = suppliers.find(x => x.id === id);
    return s ? s.name : id;
  });
  const data = Object.values(counts);

  supplierOrdersChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Orders',
        data,
        backgroundColor: ['rgba(37,99,235,0.6)', 'rgba(16,185,129,0.6)', 'rgba(245,158,11,0.6)', 'rgba(139,92,246,0.6)'],
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#7a9cc7', font: { family: 'IBM Plex Mono', size: 10 } }, grid: { color: '#1e3054' } },
        y: { ticks: { color: '#7a9cc7', font: { family: 'IBM Plex Mono', size: 10 }, stepSize: 1 }, grid: { color: '#1e3054' } }
      }
    }
  });
}

function renderPayBreakChart(payments) {
  const ctx = document.getElementById('paymentBreakChart').getContext('2d');
  if (payBreakChartInst) payBreakChartInst.destroy();

  const paid   = payments.filter(p => p.status === 'Paid').length;
  const unpaid = payments.filter(p => p.status === 'Unpaid').length;

  payBreakChartInst = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Paid', 'Unpaid'],
      datasets: [{
        data: [paid, unpaid],
        backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)'],
        borderColor: ['#10b981', '#ef4444'],
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#7a9cc7', font: { family: 'Syne', size: 12 } } } }
    }
  });
}

function renderMonthlySummary(orders, payments) {
  const monthly = {};

  orders.forEach(o => {
    const d = new Date(o.orderDate);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!monthly[key]) monthly[key] = { orders: 0, revenue: 0 };
    monthly[key].orders++;
  });

  payments.filter(p => p.status === 'Paid').forEach(p => {
    const d = new Date(p.paymentDate);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!monthly[key]) monthly[key] = { orders: 0, revenue: 0 };
    monthly[key].revenue += parseFloat(p.amount || 0);
  });

  const tbody = document.getElementById('monthlySummaryBody');
  const keys  = Object.keys(monthly).sort();

  if (!keys.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:24px">No data available.</td></tr>`;
    return;
  }

  tbody.innerHTML = keys.map(k => {
    const d = new Date(k + '-01');
    const label = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    return `
      <tr>
        <td>${label}</td>
        <td class="mono">${monthly[k].orders}</td>
        <td class="mono">${formatCurrency(monthly[k].revenue)}</td>
      </tr>
    `;
  }).join('');
}

// ============================================
// 12. MODALS
// ============================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

// Close modal when clicking overlay background
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// ============================================
// 13. DELETE
// ============================================

function confirmDelete(type, id, name) {
  const msg = document.getElementById('deleteMessage');
  msg.textContent = `Delete "${name}"? This action cannot be undone.`;
  document.getElementById('confirmDeleteBtn').onclick = () => deleteItem(type, id);
  openModal('deleteModal');
}

function deleteItem(type, id) {
  const keyMap = { supplier: 'suppliers', product: 'products', order: 'orders', payment: 'payments' };
  const key    = keyMap[type];
  if (!key) return;

  let items = getData(key);
  items = items.filter(i => i.id !== id);
  saveData(key, items);

  addActivity('🗑', `${type.charAt(0).toUpperCase() + type.slice(1)} ${id} deleted`);
  showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted.`, 'success');

  closeModal('deleteModal');

  // Re-render relevant page
  if (type === 'supplier') renderSuppliers();
  if (type === 'product')  renderProducts();
  if (type === 'order')    renderOrders();
  if (type === 'payment')  renderPayments();
  renderInventory();
  refreshDashboard();
}

// ============================================
// 14. INVOICE
// ============================================

function showInvoice(orderId) {
  const orders    = getData('orders');
  const suppliers = getData('suppliers');
  const products  = getData('products');
  const payments  = getData('payments');

  const order  = orders.find(o => o.id === orderId);
  if (!order) return showToast('Order not found.', 'error');

  const supplier = suppliers.find(s => s.id === order.supplierId);
  const product  = products.find(p => p.id === order.productId);
  const payment  = payments.find(p => p.orderId === orderId);
  const total    = product ? (product.price * order.quantity) : 0;

  const html = `
    <div class="invoice-doc">
      <div class="invoice-header">
        <div>
          <div class="invoice-company">⬡ SUPPLIERMS</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Supplier Management System</div>
        </div>
        <div class="invoice-meta">
          <div><strong>${order.id}</strong></div>
          <div style="margin-top:4px">Date: ${formatDate(order.orderDate)}</div>
          <div style="margin-top:2px">${statusBadge(order.status)}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
        <div class="invoice-section">
          <h4>Supplier</h4>
          <p><strong>${supplier ? supplier.name : order.supplierId}</strong></p>
          ${supplier ? `<p>${supplier.email}</p><p>${supplier.contact}</p><p>${supplier.address || ''}</p>` : ''}
        </div>
        <div class="invoice-section">
          <h4>Payment Info</h4>
          ${payment ? `
            <p>Payment ID: <strong>${payment.id}</strong></p>
            <p>Date: ${formatDate(payment.paymentDate)}</p>
            <p>Status: ${statusBadge(payment.status)}</p>
          ` : '<p style="color:var(--text-muted)">No payment recorded</p>'}
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr><th>Product</th><th>Category</th><th>Unit Price</th><th>Qty</th><th>Total</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>${product ? product.name : order.productId}</td>
            <td>${product ? product.category : '—'}</td>
            <td class="mono">${product ? formatCurrency(product.price) : '—'}</td>
            <td class="mono">${order.quantity}</td>
            <td class="mono">${formatCurrency(total)}</td>
          </tr>
        </tbody>
      </table>

      <div class="invoice-total">Total: ${formatCurrency(total)}</div>
    </div>
  `;

  document.getElementById('invoiceContent').innerHTML = html;
  openModal('invoiceModal');
}

function printInvoice() {
  window.print();
}

// ============================================
// 15. EXPORT CSV
// ============================================

function exportCSV(type) {
  const suppliers = getData('suppliers');
  const products  = getData('products');
  const orders    = getData('orders');
  const payments  = getData('payments');

  let headers = [], rows = [], filename = type + '.csv';

  if (type === 'suppliers') {
    headers = ['ID', 'Name', 'Contact', 'Email', 'Address', 'Status'];
    rows    = suppliers.map(s => [s.id, s.name, s.contact, s.email, s.address || '', s.status]);
  } else if (type === 'products') {
    headers = ['ID', 'Name', 'Category', 'Price', 'Supplier ID', 'Stock'];
    rows    = products.map(p => [p.id, p.name, p.category, p.price, p.supplierId, p.stock]);
  } else if (type === 'orders') {
    headers = ['Order ID', 'Supplier ID', 'Product ID', 'Quantity', 'Order Date', 'Status'];
    rows    = orders.map(o => [o.id, o.supplierId, o.productId, o.quantity, o.orderDate, o.status]);
  } else if (type === 'payments') {
    headers = ['Payment ID', 'Order ID', 'Amount', 'Payment Date', 'Status'];
    rows    = payments.map(p => [p.id, p.orderId, p.amount, p.paymentDate, p.status]);
  } else if (type === 'inventory') {
    headers = ['Product ID', 'Name', 'Category', 'Supplier ID', 'Stock', 'Stock Status'];
    rows    = products.map(p => [p.id, p.name, p.category, p.supplierId, p.stock, p.stock < 10 ? 'LOW' : 'NORMAL']);
  }

  const csv  = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${type} to CSV!`, 'info');
}

// ============================================
// 16. SORT
// ============================================

function sortTable(module, key) {
  if (module === 'suppliers') {
    if (supplierSortKey === key) supplierSortAsc = !supplierSortAsc;
    else { supplierSortKey = key; supplierSortAsc = true; }
    renderSuppliers();
  } else if (module === 'products') {
    if (productSortKey === key) productSortAsc = !productSortAsc;
    else { productSortKey = key; productSortAsc = true; }
    renderProducts();
  }
}

// ============================================
// 17. UI HELPERS
// ============================================

/** Return status badge HTML */
function statusBadge(status) {
  const classMap = {
    'Active':    'badge-active',
    'Inactive':  'badge-inactive',
    'Pending':   'badge-pending',
    'Delivered': 'badge-delivered',
    'Paid':      'badge-paid',
    'Unpaid':    'badge-unpaid',
  };
  const cls = classMap[status] || 'badge-inactive';
  return `<span class="badge ${cls}">${status}</span>`;
}

/** Show a toast notification */
let toastTimer = null;
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

/** Populate supplier dropdown */
function populateSupplierDropdown(selectId, selectedId = '') {
  const sel       = document.getElementById(selectId);
  if (!sel) return;
  const suppliers = getData('suppliers').filter(s => s.status === 'Active');
  sel.innerHTML   = suppliers.map(s =>
    `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.id} — ${s.name}</option>`
  ).join('');
  if (!sel.innerHTML) sel.innerHTML = '<option value="">No active suppliers</option>';
}

/** Populate order dropdown for payments */
function populateOrderDropdown(selectId, selectedId = '') {
  const sel    = document.getElementById(selectId);
  if (!sel) return;
  const orders = getData('orders');
  sel.innerHTML = orders.map(o =>
    `<option value="${o.id}" ${o.id === selectedId ? 'selected' : ''}>${o.id} (${o.status})</option>`
  ).join('');
  if (!sel.innerHTML) sel.innerHTML = '<option value="">No orders found</option>';
}

/** Toggle dark/light theme */
function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('sms_theme', isLight ? 'light' : 'dark');
}

// ============================================
// 18. MODAL OPEN WRAPPERS (called from HTML)
// ============================================

function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
  // Pre-fill dropdowns if needed
  if (id === 'productModal') populateSupplierDropdown('prodSupplier');
  if (id === 'orderModal') {
    populateSupplierDropdown('ordSupplier');
    filterProductsBySupplier();
  }
  if (id === 'paymentModal') populateOrderDropdown('payOrderId');
}

// ============================================
// 19. INIT
// ============================================

function initApp() {
  // Restore theme
  if (localStorage.getItem('sms_theme') === 'light') {
    document.body.classList.add('light');
  }

  // Seed if first run
  seedData();

  // Navigate to dashboard
  navigate('dashboard');
}

// Start on page load
window.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) {
    // Show login screen — already visible by default
  } else {
    initApp();
  }
});