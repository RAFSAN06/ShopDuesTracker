// Global variables
let shops = {};
let history = {};
let currentShop = null;
let currentTab = 'dues';
let sortMode = 'date-desc';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    // Set today's date as default
    document.getElementById('dueDate').valueAsDate = new Date();
    
    // Add event listeners
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Handle Enter key in shop name input
    document.getElementById('shopNameInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addShop();
        }
    });

    // Handle Enter key in amount input
    document.getElementById('dueAmount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTransaction();
        }
    });

    // Handle Enter key in note input
    document.getElementById('dueNote').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addTransaction();
        }
    });

    // Close modal when clicking outside
    document.getElementById('addShopModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideAddShopModal();
        }
    });

    document.getElementById('confirmModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideConfirmModal();
        }
    });
}

// Load data from localStorage
function loadData() {
    try {
        const savedData = JSON.parse(localStorage.getItem('shopDuesData')) || {};
        shops = savedData.shops || {};
        history = savedData.history || {};
        currentShop = savedData.currentShop;
        sortMode = savedData.sortMode || 'date-desc';

        // If no shops exist, create a default one
        if (Object.keys(shops).length === 0) {
            shops['Default Shop'] = [];
            history['Default Shop'] = [];
            currentShop = 'Default Shop';
        }

        // If currentShop doesn't exist in shops, set to first available
        if (!shops[currentShop]) {
            currentShop = Object.keys(shops)[0];
        }

        // Ensure history exists for all shops
        Object.keys(shops).forEach(shop => {
            if (!history[shop]) {
                history[shop] = [];
            }
        });

        renderShopTabs();
        renderTransactions();
        renderHistory();
    } catch (error) {
        console.error('Error loading data:', error);
        // Initialize with default data if loading fails
        shops = { 'Default Shop': [] };
        history = { 'Default Shop': [] };
        currentShop = 'Default Shop';
        renderShopTabs();
        renderTransactions();
        renderHistory();
    }
}

// Save data to localStorage
function saveData() {
    try {
        const dataToSave = {
            shops: shops,
            history: history,
            currentShop: currentShop,
            sortMode: sortMode
        };
        localStorage.setItem('shopDuesData', JSON.stringify(dataToSave));
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Unable to save data. Storage might be full.');
    }
}

// Switch tabs
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
    
    if (tab === 'history') {
        renderHistoryShopTabs();
        renderHistory();
    }
}

// Render shop tabs
function renderShopTabs() {
    const tabsContainer = document.getElementById('shopTabs');
    tabsContainer.innerHTML = '';

    Object.keys(shops).forEach(shopName => {
        const tab = document.createElement('div');
        tab.className = `shop-tab ${shopName === currentShop ? 'active' : ''}`;
        tab.innerHTML = `
            ${shopName}
            ${Object.keys(shops).length > 1 ? `<button class="delete-shop" onclick="confirmDeleteShop('${shopName}')" title="Delete Shop">×</button>` : ''}
        `;
        tab.onclick = (e) => {
            if (!e.target.classList.contains('delete-shop')) {
                switchShop(shopName);
            }
        };
        tabsContainer.appendChild(tab);
    });
}

// Render history shop tabs
function renderHistoryShopTabs() {
    const tabsContainer = document.getElementById('historyShopTabs');
    tabsContainer.innerHTML = '';

    Object.keys(shops).forEach(shopName => {
        const tab = document.createElement('div');
        tab.className = `shop-tab ${shopName === currentShop ? 'active' : ''}`;
        tab.textContent = shopName;
        tab.onclick = () => switchShop(shopName);
        tabsContainer.appendChild(tab);
    });
}

// Switch active shop
function switchShop(shopName) {
    currentShop = shopName;
    renderShopTabs();
    renderTransactions();
    if (currentTab === 'history') {
        renderHistoryShopTabs();
        renderHistory();
    }
    saveData();
}

// Confirm delete shop
function confirmDeleteShop(shopName) {
    showConfirmModal(
        'Delete Shop',
        `Are you sure you want to delete "${shopName}" and all its data?`,
        () => deleteShop(shopName)
    );
}

// Delete shop
function deleteShop(shopName) {
    delete shops[shopName];
    delete history[shopName];
    
    // Switch to another shop if current was deleted
    if (currentShop === shopName) {
        currentShop = Object.keys(shops)[0];
    }
    
    renderShopTabs();
    renderTransactions();
    if (currentTab === 'history') {
        renderHistoryShopTabs();
        renderHistory();
    }
    saveData();
    hideConfirmModal();
}

// Show add shop modal
function showAddShopModal() {
    document.getElementById('addShopModal').classList.add('show');
    document.getElementById('shopNameInput').value = '';
    document.getElementById('shopNameInput').focus();
}

// Hide add shop modal
function hideAddShopModal() {
    document.getElementById('addShopModal').classList.remove('show');
}

// Show confirm modal
function showConfirmModal(title, message, confirmCallback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmBtn').onclick = confirmCallback;
    document.getElementById('confirmModal').classList.add('show');
}

// Hide confirm modal
function hideConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
}

// Add new shop
function addShop() {
    const shopName = document.getElementById('shopNameInput').value.trim();
    
    if (!shopName) {
        alert('Please enter a shop name');
        return;
    }

    if (shops[shopName]) {
        alert('Shop already exists');
        return;
    }

    if (shopName.length > 20) {
        alert('Shop name must be 20 characters or less');
        return;
    }

    shops[shopName] = [];
    history[shopName] = [];
    currentShop = shopName;
    renderShopTabs();
    renderTransactions();
    hideAddShopModal();
    saveData();
}

// Add new transaction
function addTransaction() {
    const dateInput = document.getElementById('dueDate');
    const amountInput = document.getElementById('dueAmount');
    const noteInput = document.getElementById('dueNote');
    
    const date = dateInput.value;
    const amount = parseFloat(amountInput.value);
    const note = noteInput.value.trim();

    if (!date) {
        alert('Please select a date');
        return;
    }

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
    }

    if (amount > 999999.99) {
        alert('Amount cannot exceed $999,999.99');
        return;
    }

    const transaction = {
        id: Date.now(),
        date: date,
        amount: amount,
        note: note,
        dateAdded: new Date().toISOString()
    };

    shops[currentShop].push(transaction);
    
    // Clear inputs
    dateInput.value = '';
    amountInput.value = '';
    noteInput.value = '';
    
    // Set today's date as default for next entry
    dateInput.valueAsDate = new Date();
    
    renderTransactions();
    saveData();
}

// Mark as paid (move to history)
function markAsPaid(id) {
    const transaction = shops[currentShop].find(t => t.id === id);
    if (transaction) {
        // Add to history with payment date
        const historyItem = {
            ...transaction,
            paidDate: new Date().toISOString()
        };
        history[currentShop].push(historyItem);
        
        // Remove from outstanding dues
        shops[currentShop] = shops[currentShop].filter(t => t.id !== id);
        
        renderTransactions();
        saveData();
    }
}

// Delete transaction permanently
function deleteTransaction(id) {
    showConfirmModal(
        'Delete Transaction',
        'Are you sure you want to permanently delete this transaction?',
        () => {
            shops[currentShop] = shops[currentShop].filter(t => t.id !== id);
            renderTransactions();
            saveData();
            hideConfirmModal();
        }
    );
}

// Delete from history
function deleteFromHistory(id) {
    showConfirmModal(
        'Delete from History',
        'Are you sure you want to permanently delete this payment record?',
        () => {
            history[currentShop] = history[currentShop].filter(t => t.id !== id);
            renderHistory();
            saveData();
            hideConfirmModal();
        }
    );
}

// Set sort mode
function setSortMode(mode) {
    sortMode = mode;
    
    // Update sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="setSortMode('${mode}')"]`).classList.add('active');
    
    renderHistory();
    saveData();
}

// Sort transactions
function sortTransactions(transactions, mode) {
    const sorted = [...transactions];
    
    switch (mode) {
        case 'date-desc':
            return sorted.sort((a, b) => new Date(b.paidDate || b.date) - new Date(a.paidDate || a.date));
        case 'date-asc':
            return sorted.sort((a, b) => new Date(a.paidDate || a.date) - new Date(b.paidDate || b.date));
        case 'amount-desc':
            return sorted.sort((a, b) => b.amount - a.amount);
        case 'amount-asc':
            return sorted.sort((a, b) => a.amount - b.amount);
        default:
            return sorted;
    }
}

// Export data
function exportData() {
    try {
        const exportData = {
            shops: shops,
            history: history,
            exportDate: new Date().toISOString(),
            totalOutstanding: Object.values(shops).flat().reduce((sum, t) => sum + t.amount, 0),
            totalPaid: Object.values(history).flat().reduce((sum, t) => sum + t.amount, 0),
            summary: {
                totalShops: Object.keys(shops).length,
                totalTransactions: Object.values(shops).flat().length,
                totalHistoryRecords: Object.values(history).flat().length
            }
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `shop-dues-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('Data exported successfully!');
    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
    }
}

// Format currency
function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}

// Format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Format datetime
function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calculate total due
function calculateTotal() {
    return shops[currentShop].reduce((total, transaction) => total + transaction.amount, 0);
}

// Calculate total paid
function calculateTotalPaid() {
    return history[currentShop].reduce((total, transaction) => total + transaction.amount, 0);
}

// Render transactions
function renderTransactions() {
    const transactionsList = document.getElementById('transactionsList');
    const totalDue = document.getElementById('totalDue');
    
    const transactions = shops[currentShop] || [];
    const total = calculateTotal();
    
    totalDue.textContent = `Total: ${formatCurrency(total)}`;

    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <p>No outstanding dues for ${currentShop}</p>
                <p>Add your first due amount above!</p>
            </div>
        `;
        return;
    }

    // Sort transactions by date (newest first)
    const sortedTransactions = sortTransactions(transactions, 'date-desc');

    transactionsList.innerHTML = sortedTransactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-header">
                <div class="transaction-info">
                    <div class="transaction-date">${formatDate(transaction.date)}</div>
                    <div class="transaction-amount">${formatCurrency(transaction.amount)}</div>
                </div>
                <div>
                    <button class="paid-btn" onclick="markAsPaid(${transaction.id})">
                        Mark Paid ✓
                    </button>
                    <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">
                        Delete
                    </button>
                </div>
            </div>
            ${transaction.note ? `<div class="transaction-note">📝 ${transaction.note}</div>` : ''}
        </div>
    `).join('');
}

// Render history
function renderHistory() {
    const historyList = document.getElementById('historyList');
    const historyTotal = document.getElementById('historyTotal');
    
    const historyTransactions = history[currentShop] || [];
    const total = calculateTotalPaid();
    
    historyTotal.textContent = `Total Paid: ${formatCurrency(total)}`;

    if (historyTransactions.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <p>No payment history for ${currentShop}</p>
                <p>Payments will appear here when you mark dues as paid!</p>
            </div>
        `;
        return;
    }

    // Sort history based on current sort mode
    const sortedHistory = sortTransactions(historyTransactions, sortMode);

    historyList.innerHTML = sortedHistory.map(transaction => `
        <div class="transaction-item history-item">
            <div class="transaction-header">
                <div class="transaction-info">
                    <div class="transaction-date">Due: ${formatDate(transaction.date)}</div>
                    <div class="transaction-amount">${formatCurrency(transaction.amount)}</div>
                    <div class="paid-date">Paid: ${formatDateTime(transaction.paidDate)}</div>
                </div>
                <div>
                    <button class="delete-btn" onclick="deleteFromHistory(${transaction.id})">
                        Delete
                    </button>
                </div>
            </div>
            ${transaction.note ? `<div class="transaction-note">📝 ${transaction.note}</div>` : ''}
        </div>
    `).join('');
}

// Utility functions for data management
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        localStorage.removeItem('shopDuesData');
        shops = { 'Default Shop': [] };
        history = { 'Default Shop': [] };
        currentShop = 'Default Shop';
        renderShopTabs();
        renderTransactions();
        renderHistory();
        alert('All data has been cleared.');
    }
}

// Import data function (for future use)
function importData(jsonData) {
    try {
        const importedData = JSON.parse(jsonData);
        
        if (importedData.shops && importedData.history) {
            shops = importedData.shops;
            history = importedData.history;
            currentShop = Object.keys(shops)[0];
            
            saveData();
            renderShopTabs();
            renderTransactions();
            renderHistory();
            
            alert('Data imported successfully!');
        } else {
            throw new Error('Invalid data format');
        }
    } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed. Please check the file format.');
    }
}

// Search functionality (for future enhancement)
function searchTransactions(query) {
    const allTransactions = [...shops[currentShop], ...history[currentShop]];
    return allTransactions.filter(transaction => 
        transaction.note.toLowerCase().includes(query.toLowerCase()) ||
        transaction.amount.toString().includes(query) ||
        formatDate(transaction.date).toLowerCase().includes(query.toLowerCase())
    );
}

// Get statistics for current shop
function getShopStatistics() {
    const outstanding = shops[currentShop] || [];
    const paid = history[currentShop] || [];
    
    return {
        totalOutstanding: outstanding.reduce((sum, t) => sum + t.amount, 0),
        totalPaid: paid.reduce((sum, t) => sum + t.amount, 0),
        countOutstanding: outstanding.length,
        countPaid: paid.length,
        avgOutstanding: outstanding.length > 0 ? outstanding.reduce((sum, t) => sum + t.amount, 0) / outstanding.length : 0,
        avgPaid: paid.length > 0 ? paid.reduce((sum, t) => sum + t.amount, 0) / paid.length : 0
    };
}