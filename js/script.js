// === STATE APLIKASI ===
let state = {
    transactions: [],
    categories: [
        { name: 'Makanan', color: '#10b981', icon: 'fa-utensils' }, // Food
        { name: 'Transportasi', color: '#3b82f6', icon: 'fa-car' }, // Transport
        { name: 'Hiburan', color: '#f59e0b', icon: 'fa-gamepad' }    // Fun
    ],
    budget: 1000000, // Batas default Rp 1.000.000
    darkMode: false,
    selectedColor: '#ec4899', // Warna indikator default kategori baru
    chartInstance: null
};

// Palet Warna Kategori Baru
const availableColors = [
    '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', 
    '#ef4444', '#14b8a6', '#6366f1', '#a855f7', '#06b6d4',
    '#84cc16', '#64748b'
];

// === AKTIVASI AWAL JAVASCRIPT ===
window.onload = function() {
    loadFromLocalStorage();
    initializeTheme();
    setupEventListeners();
    renderCategoriesDropdown();
    renderColorPicker();
    updateDashboard();
};

// === PENYIMPANAN LOCAL STORAGE ===
function saveToLocalStorage() {
    localStorage.setItem('dompetku_transactions', JSON.stringify(state.transactions));
    localStorage.setItem('dompetku_categories', JSON.stringify(state.categories));
    localStorage.setItem('dompetku_budget', state.budget.toString());
    localStorage.setItem('dompetku_darkMode', state.darkMode.toString());
}

function loadFromLocalStorage() {
    const savedTransactions = localStorage.getItem('dompetku_transactions');
    const savedCategories = localStorage.getItem('dompetku_categories');
    const savedBudget = localStorage.getItem('dompetku_budget');
    const savedDarkMode = localStorage.getItem('dompetku_darkMode');

    if (savedTransactions) state.transactions = JSON.parse(savedTransactions);
    if (savedCategories) state.categories = JSON.parse(savedCategories);
    if (savedBudget) state.budget = parseFloat(savedBudget);
    if (savedDarkMode) state.darkMode = (savedDarkMode === 'true');
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    // Form Submit Pengeluaran
    document.getElementById('transactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewTransaction();
    });

    // Pengendali Sortir & Pencarian
    document.getElementById('sortControl').addEventListener('change', renderTransactions);
    document.getElementById('searchControl').addEventListener('input', renderTransactions);

    // Pengendali Ganti Tema
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
}

// === PENGENDALI TEMA (DARK/LIGHT MODE) ===
function initializeTheme() {
    const htmlElement = document.documentElement;
    const themeIcon = document.getElementById('themeToggleIcon');
    
    if (state.darkMode) {
        htmlElement.classList.add('dark');
        themeIcon.className = 'fa-solid fa-sun text-lg';
    } else {
        htmlElement.classList.remove('dark');
        themeIcon.className = 'fa-solid fa-moon text-lg';
    }
}

function toggleTheme() {
    state.darkMode = !state.darkMode;
    initializeTheme();
    saveToLocalStorage();
    updateChartTheme(); // Redraw label & warna garis border grafik
    showToast('Tema berhasil diubah!', 'success');
}

// === VALIDASI & OPERASI CRUD TRANSAKSI ===
function addNewTransaction() {
    const nameInput = document.getElementById('itemName');
    const amountInput = document.getElementById('itemAmount');
    const categorySelect = document.getElementById('itemCategory');

    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    // Validasi Input Form (Sesuai Ketentuan MVP)
    if (!name || isNaN(amount) || amount <= 0 || !category) {
        showToast('Mohon lengkapi semua data transaksi dengan benar.', 'error');
        return;
    }

    const newTx = {
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: name,
        amount: amount,
        category: category,
        date: new Date().toISOString()
    };

    state.transactions.unshift(newTx); // Letakkan di urutan paling atas
    saveToLocalStorage();
    updateDashboard();

    // Reset form input
    nameInput.value = '';
    amountInput.value = '';
    categorySelect.selectedIndex = 0;

    showToast('Pengeluaran berhasil ditambahkan!', 'success');
}

function deleteTransaction(id) {
    state.transactions = state.transactions.filter(tx => tx.id !== id);
    saveToLocalStorage();
    updateDashboard();
    showToast('Transaksi berhasil dihapus.', 'success');
}

// === ATUR TARGET ANGGARAN ===
function openBudgetModal() {
    document.getElementById('inputBudget').value = state.budget;
    document.getElementById('budgetModal').classList.remove('hidden');
}

function closeBudgetModal() {
    document.getElementById('budgetModal').classList.add('hidden');
}

function saveBudget() {
    const value = parseFloat(document.getElementById('inputBudget').value);
    if (isNaN(value) || value <= 0) {
        showToast('Masukkan nominal anggaran yang valid.', 'error');
        return;
    }

    state.budget = value;
    saveToLocalStorage();
    updateDashboard();
    closeBudgetModal();
    showToast('Anggaran berhasil diperbarui!', 'success');
}

// === TAMBAH KATEGORI KUSTOM ===
function openCategoryModal() {
    document.getElementById('inputCategoryName').value = '';
    // Reset pilihan warna ke warna default index 3
    state.selectedColor = availableColors[3]; 
    selectColorOption(state.selectedColor);
    document.getElementById('categoryModal').classList.remove('hidden');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.add('hidden');
}

function renderColorPicker() {
    const grid = document.getElementById('colorPickerGrid');
    grid.innerHTML = '';
    
    availableColors.forEach(color => {
        const colorBtn = document.createElement('button');
        colorBtn.type = 'button';
        colorBtn.className = 'w-8 h-8 rounded-full border-2 transition duration-150 transform hover:scale-110 flex items-center justify-center';
        colorBtn.style.backgroundColor = color;
        colorBtn.style.borderColor = 'transparent';
        colorBtn.dataset.color = color;
        
        colorBtn.addEventListener('click', function() {
            state.selectedColor = color;
            selectColorOption(color);
        });

        grid.appendChild(colorBtn);
    });
}

function selectColorOption(selectedColor) {
    const buttons = document.querySelectorAll('#colorPickerGrid button');
    buttons.forEach(btn => {
        if (btn.dataset.color === selectedColor) {
            btn.style.borderColor = state.darkMode ? '#fff' : '#1f2937';
            btn.innerHTML = '<i class="fa-solid fa-check text-white text-xs"></i>';
        } else {
            btn.style.borderColor = 'transparent';
            btn.innerHTML = '';
        }
    });
}

function saveCustomCategory() {
    const nameInput = document.getElementById('inputCategoryName');
    const name = nameInput.value.trim();

    if (!name) {
        showToast('Nama kategori tidak boleh kosong.', 'error');
        return;
    }

    // Hindari duplikasi kategori (case insensitive)
    const isExist = state.categories.some(cat => cat.name.toLowerCase() === name.toLowerCase());
    if (isExist) {
        showToast(`Kategori "${name}" sudah ada.`, 'error');
        return;
    }

    const newCategory = {
        name: name,
        color: state.selectedColor,
        icon: 'fa-tags'
    };

    state.categories.push(newCategory);
    saveToLocalStorage();
    renderCategoriesDropdown();
    closeCategoryModal();
    showToast('Kategori baru ditambahkan!', 'success');
}

// === RENDERING & FORMAT MATA UANG ===
function formatRupiah(value) {
    const formattedNumber = Number(value).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true
    });
    return `Rp ${formattedNumber}`;
}

function renderCategoriesDropdown() {
    const dropdown = document.getElementById('itemCategory');
    dropdown.innerHTML = '';

    state.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        dropdown.appendChild(option);
    });
}

function updateDashboard() {
    // Hitung Total Pengeluaran
    const totalExpense = state.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const remainingBalance = state.budget - totalExpense;

    // Render Teks Statistik Utama
    document.getElementById('displayBudget').textContent = formatRupiah(state.budget);
    document.getElementById('displayTotalExpense').textContent = formatRupiah(totalExpense);
    
    // Atur Sisa Saldo (MVP Total Balance)
    const balanceElement = document.getElementById('displayBalance');
    balanceElement.textContent = formatRupiah(remainingBalance);

    // Atur Persentase Batas Anggaran
    const percentUsed = state.budget > 0 ? (totalExpense / state.budget) * 100 : 0;
    document.getElementById('expensePercentageText').textContent = `${percentUsed.toFixed(1)}% dari total anggaran`;

    // Atur Indikator Status & Sorotan Batas Anggaran (Highlight Limit)
    const balanceIndicator = document.getElementById('balanceIndicator');
    const balanceCard = document.getElementById('balanceCard');
    const alertBox = document.getElementById('budgetWarningAlert');

    if (remainingBalance < 0) {
        // Skenario melebihi budget (Highlights)
        balanceElement.className = "text-2xl md:text-3xl font-extrabold text-red-600 dark:text-red-400 truncate";
        balanceIndicator.textContent = "Over Limit";
        balanceIndicator.className = "p-1 px-2 text-[10px] bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 font-bold rounded-full";
        
        // Beri Highlight Merah Menarik pada Kartu Sisa Saldo
        balanceCard.className = "bg-red-50 dark:bg-red-950/20 p-5 rounded-2xl border-2 border-red-500 shadow-sm transition-all duration-300 flex flex-col justify-between";
        
        // Tampilkan banner warning di bagian paling atas
        alertBox.classList.remove('hidden');
        alertBox.classList.add('scale-100');
    } else {
        // Skenario normal / di bawah budget
        balanceElement.className = "text-2xl md:text-3xl font-extrabold text-green-600 dark:text-green-400 truncate";
        balanceIndicator.textContent = "Aman";
        balanceIndicator.className = "p-1 px-2 text-[10px] bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300 font-bold rounded-full";
        
        balanceCard.className = "bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 flex flex-col justify-between";
        
        alertBox.classList.add('hidden');
        alertBox.classList.remove('scale-100');
    }

    // Render daftar item & gambar ulang pie chart
    renderTransactions();
    updateChart();
}

function dismissWarning() {
    document.getElementById('budgetWarningAlert').classList.add('hidden');
}

// === URUTKAN & TAMPILKAN TRANSAKSI (Scrollable List) ===
function renderTransactions() {
    const listContainer = document.getElementById('transactionList');
    const emptyState = document.getElementById('emptyTransactionsState');
    
    const sortBy = document.getElementById('sortControl').value;
    const searchKeyword = document.getElementById('searchControl').value.toLowerCase().trim();

    // Filter Pencarian
    let filteredTx = state.transactions.filter(tx => {
        return tx.name.toLowerCase().includes(searchKeyword) || tx.category.toLowerCase().includes(searchKeyword);
    });

    // Pengurutan (Sorting)
    filteredTx.sort((a, b) => {
        if (sortBy === 'date-desc') {
            return new Date(b.date) - new Date(a.date);
        } else if (sortBy === 'date-asc') {
            return new Date(a.date) - new Date(b.date);
        } else if (sortBy === 'amount-desc') {
            return b.amount - a.amount;
        } else if (sortBy === 'amount-asc') {
            return a.amount - b.amount;
        } else if (sortBy === 'category') {
            return a.category.localeCompare(b.category);
        }
        return 0;
    });

    // Tampilkan state kosong jika tidak ada data sama sekali
    if (filteredTx.length === 0) {
        listContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    // Render Item DompetKu
    listContainer.innerHTML = '';
    filteredTx.forEach(tx => {
        // Cari warna kategori pendukung
        const categoryObj = state.categories.find(c => c.name === tx.category) || { color: '#6b7280' };
        const formattedDate = new Date(tx.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        const itemDiv = document.createElement('div');
        itemDiv.className = "flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/60 dark:bg-gray-700/20 dark:hover:bg-gray-700/50 transition duration-150 border border-transparent hover:border-gray-100 dark:hover:border-gray-700/30";
        
        itemDiv.innerHTML = `
            <div class="flex items-center space-x-3 truncate">
                <!-- Indikator Warna Bulat Kategori -->
                <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${categoryObj.color}"></span>
                <div class="truncate">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">${tx.name}</h4>
                    <div class="flex items-center space-x-2 text-[10px] text-gray-400 mt-0.5">
                        <span class="font-medium text-gray-500 dark:text-gray-400">${tx.category}</span>
                        <span>&bull;</span>
                        <span>${formattedDate}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-3 flex-shrink-0">
                <span class="text-sm font-bold text-gray-800 dark:text-gray-200">${formatRupiah(tx.amount)}</span>
                <!-- Tombol Hapus Transaksi (MVP Delete Feature) -->
                <button onclick="deleteTransaction('${tx.id}')" class="p-1.5 bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 active:scale-90 transition duration-150 focus:outline-none" title="Hapus Transaksi">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;

        listContainer.appendChild(itemDiv);
    });
}

// === DIAGRAM ALOKASI KATEGORI (CHART.JS) ===
function updateChart() {
    const noDataOverlay = document.getElementById('noDataOverlay');
    
    if (state.transactions.length === 0) {
        noDataOverlay.classList.remove('hidden');
        if (state.chartInstance) {
            state.chartInstance.destroy();
            state.chartInstance = null;
        }
        return;
    }
    noDataOverlay.classList.add('hidden');

    // Hitung distribusi pengeluaran per kategori
    const categorySums = {};
    state.transactions.forEach(tx => {
        categorySums[tx.category] = (categorySums[tx.category] || 0) + tx.amount;
    });

    const labels = Object.keys(categorySums);
    const data = Object.values(categorySums);
    
    // Atur warna segmen grafik mengikuti warna kategori
    const backgroundColors = labels.map(label => {
        const catObj = state.categories.find(c => c.name === label);
        return catObj ? catObj.color : '#858585';
    });

    const textThemeColor = state.darkMode ? '#e5e7eb' : '#374151';
    const ctx = document.getElementById('categoryChart').getContext('2d');

    if (state.chartInstance) {
        // Perbarui data chart tanpa melakukan inisialisasi ulang
        state.chartInstance.data.labels = labels;
        state.chartInstance.data.datasets[0].data = data;
        state.chartInstance.data.datasets[0].backgroundColor = backgroundColors;
        state.chartInstance.options.plugins.legend.labels.color = textThemeColor;
        state.chartInstance.update();
    } else {
        // Buat instance Pie/Doughnut Chart baru
        state.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: state.darkMode ? 2 : 1,
                    borderColor: state.darkMode ? '#1f2937' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            color: textThemeColor,
                            font: {
                                family: 'Plus Jakarta Sans',
                                size: 11,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const rawValue = context.raw || 0;
                                return ` ${label}: ${formatRupiah(rawValue)}`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }
}

function updateChartTheme() {
    if (state.chartInstance) {
        const textThemeColor = state.darkMode ? '#e5e7eb' : '#374151';
        state.chartInstance.options.plugins.legend.labels.color = textThemeColor;
        state.chartInstance.data.datasets[0].borderColor = state.darkMode ? '#1f2937' : '#ffffff';
        state.chartInstance.data.datasets[0].borderWidth = state.darkMode ? 2 : 1;
        state.chartInstance.update();
    }
}

// === NOTIFIKASI TOAST KUSTOM ===
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl flex items-center space-x-3 shadow-lg transform transition duration-300 translate-y-2 opacity-0 max-w-sm w-full border ${
        type === 'success' 
        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900 text-emerald-800 dark:text-emerald-100' 
        : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900 text-red-800 dark:text-red-100'
    }`;

    const iconClass = type === 'success' ? 'fa-solid fa-circle-check text-emerald-500' : 'fa-solid fa-circle-exclamation text-red-500';

    toast.innerHTML = `
        <i class="${iconClass} text-lg flex-shrink-0"></i>
        <p class="text-xs font-semibold flex-grow">${message}</p>
        <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <i class="fa-solid fa-xmark text-xs"></i>
        </button>
    `;

    toast.querySelector('button').onclick = function() {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    };

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
        toast.classList.add('opacity-100', 'translate-y-0');
    }, 10);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}
