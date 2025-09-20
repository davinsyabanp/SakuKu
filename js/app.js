// FinanceTracker JavaScript Application
class Transaction {
    constructor(id, type, amount, category, description, date) {
        this.id = id || generateId();
        this.type = type;
        this.amount = parseFloat(amount);
        this.category = category;
        this.description = description;
        this.date = date;
        this.timestamp = new Date().getTime();
    }
}

// Storage Configuration
const STORAGE_KEYS = {
    transactions: "financeTrackerData",
    budget: "financeTrackerBudget"
};

// Storage Functions
const saveTransactions = (transactions) => {
    try {
        localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
        return true;
    } catch (error) {
        console.error("Error saving transactions:", error);
        showNotification("Error saving data", "error");
        return false;
    }
};

const loadTransactions = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.transactions);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error loading transactions:", error);
        return [];
    }
};

const saveBudget = (budget) => {
    try {
        localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(budget));
        return true;
    } catch (error) {
        console.error("Error saving budget:", error);
        showNotification("Error saving budget", "error");
        return false;
    }
};

const loadBudget = () => {
    try {
        const budgetData = localStorage.getItem(STORAGE_KEYS.budget);
        return budgetData ? JSON.parse(budgetData) : {};
    } catch (error) {
        console.error("Error loading budget:", error);
        return {};
    }
};

// CRUD Functions
const addTransaction = (transactionData) => {
    try {
        const transactions = loadTransactions();
        const newTransaction = new Transaction(
            null,
            transactionData.type,
            transactionData.amount,
            transactionData.category,
            transactionData.description,
            transactionData.date
        );
        
        transactions.push(newTransaction);
        
        if (saveTransactions(transactions)) {
            showNotification("Transaction added successfully", "success");
            refreshUI();
            return newTransaction;
        }
        return null;
    } catch (error) {
        console.error("Error adding transaction:", error);
        showNotification("Error adding transaction", "error");
        return null;
    }
};

const updateTransaction = (id, updates) => {
    try {
        const transactions = loadTransactions();
        const index = transactions.findIndex(t => t.id === id);
        
        if (index === -1) {
            throw new Error(`Transaction with id ${id} not found`);
        }
        
        transactions[index] = { ...transactions[index], ...updates };
        
        if (saveTransactions(transactions)) {
            showNotification("Transaction updated successfully", "success");
            refreshUI();
            return transactions[index];
        }
        return null;
    } catch (error) {
        console.error("Error updating transaction:", error);
        showNotification("Error updating transaction", "error");
        return null;
    }
};

const deleteTransaction = (id) => {
    try {
        const transactions = loadTransactions();
        const index = transactions.findIndex(t => t.id === id);
        
        if (index === -1) {
            throw new Error(`Transaction with id ${id} not found`);
        }
        
        if (confirm("Are you sure you want to delete this transaction?")) {
            transactions.splice(index, 1);
            
            if (saveTransactions(transactions)) {
                showNotification("Transaction deleted successfully", "success");
                refreshUI();
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Error deleting transaction:", error);
        showNotification("Error deleting transaction", "error");
        return false;
    }
};

const getTransactions = (filters = {}) => {
    try {
        let transactions = loadTransactions();
        
        // Apply filters
        if (filters.type) {
            transactions = transactions.filter(t => t.type === filters.type);
        }
        
        if (filters.category) {
            transactions = transactions.filter(t => t.category === filters.category);
        }
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            transactions = transactions.filter(t => 
                t.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return transactions;
    } catch (error) {
        console.error("Error getting transactions:", error);
        return [];
    }
};

// Calculation Functions
const calculateBalance = () => {
    const transactions = loadTransactions();
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
        }
    });
    
    return {
        balance: totalIncome - totalExpenses,
        totalIncome,
        totalExpenses
    };
};

const getTotalByCategory = (type = null) => {
    const transactions = loadTransactions();
    const categoryTotals = {};
    
    transactions.forEach(transaction => {
        if (type && transaction.type !== type) return;
        
        if (!categoryTotals[transaction.category]) {
            categoryTotals[transaction.category] = 0;
        }
        categoryTotals[transaction.category] += transaction.amount;
    });
    
    return categoryTotals;
};

const getMonthlyData = () => {
    const transactions = loadTransactions();
    const monthlyData = {};
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        
        if (transaction.type === 'income') {
            monthlyData[monthKey].income += transaction.amount;
        } else {
            monthlyData[monthKey].expenses += transaction.amount;
        }
    });
    
    return monthlyData;
};

// UI Functions
const renderTransactions = (transactions = null) => {
    const tbody = document.getElementById('transactionTableBody');
    if (!tbody) return;
    
    const transactionsToRender = transactions || getTransactions();
    
    // Remove sample rows
    const sampleRows = tbody.querySelectorAll('.transactions__tr--sample');
    sampleRows.forEach(row => row.remove());
    
    tbody.innerHTML = '';
    
    if (transactionsToRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 2rem; color: var(--text-muted);">
                    No transactions found. Add your first transaction to get started!
                </td>
            </tr>
        `;
        return;
    }
    
    transactionsToRender.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'transactions__tr';
        
        row.innerHTML = `
            <td class="transactions__td">${formatDate(transaction.date)}</td>
            <td class="transactions__td">${transaction.description}</td>
            <td class="transactions__td">${capitalizeFirst(transaction.category)}</td>
            <td class="transactions__td">
                <span class="badge badge--${transaction.type}">
                    ${capitalizeFirst(transaction.type)}
                </span>
            </td>
            <td class="transactions__td">${formatCurrency(transaction.amount)}</td>
            <td class="transactions__td">
                <button class="transactions__btn transactions__btn--edit" 
                        onclick="editTransaction('${transaction.id}')">Edit</button>
                <button class="transactions__btn transactions__btn--delete" 
                        onclick="deleteTransaction('${transaction.id}')">Delete</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
};

const updateBalanceCard = () => {
    const balanceData = calculateBalance();
    
    const balanceAmount = document.getElementById('currentBalance');
    const totalIncome = document.getElementById('totalIncome');
    const totalExpenses = document.getElementById('totalExpenses');
    
    if (balanceAmount) {
        balanceAmount.textContent = formatCurrency(balanceData.balance);
        balanceAmount.style.color = balanceData.balance >= 0 ? 'var(--success)' : 'var(--danger)';
    }
    
    if (totalIncome) {
        totalIncome.textContent = formatCurrency(balanceData.totalIncome);
    }
    
    if (totalExpenses) {
        totalExpenses.textContent = formatCurrency(balanceData.totalExpenses);
    }
};

const updateBudgetProgress = () => {
    const budget = loadBudget();
    const categoryTotals = getTotalByCategory('expense');
    
    Object.keys(budget).forEach(category => {
        const spent = categoryTotals[category] || 0;
        const budgetAmount = budget[category];
        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
        
        const progressBar = document.querySelector(`[data-category="${category}"]`);
        const statusSpan = document.querySelector(`.budget-form__status[data-category="${category}"]`);
        
        if (progressBar) {
            progressBar.style.width = `${Math.min(percentage, 100)}%`;
            if (percentage > 100) {
                progressBar.setAttribute('data-over-budget', 'true');
            } else {
                progressBar.removeAttribute('data-over-budget');
            }
        }
        
        if (statusSpan) {
            statusSpan.textContent = `${formatCurrency(spent)} / ${formatCurrency(budgetAmount)}`;
            statusSpan.style.color = percentage > 100 ? 'var(--danger)' : 'var(--text-muted)';
        }
    });
};

// Chart Functions
const updateCharts = () => {
    updateCategoryChart();
    updateTrendChart();
};

const updateCategoryChart = () => {
    const categoryTotals = getTotalByCategory('expense');
    const ctx = document.getElementById('categoryChart');
    
    if (!ctx || !window.Chart) return;
    
    const data = Object.entries(categoryTotals).map(([category, amount]) => ({
        label: capitalizeFirst(category),
        value: amount
    }));
    
    if (window.categoryChartInstance) {
        window.categoryChartInstance.destroy();
    }
    
    window.categoryChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                data: data.map(d => d.value),
                backgroundColor: [
                    '#2563eb', '#10b981', '#ef4444', '#f59e0b',
                    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
};

const updateTrendChart = () => {
    const monthlyData = getMonthlyData();
    const ctx = document.getElementById('trendChart');
    
    if (!ctx || !window.Chart) return;
    
    const months = Object.keys(monthlyData).sort();
    const incomeData = months.map(month => monthlyData[month].income);
    const expenseData = months.map(month => monthlyData[month].expenses);
    
    if (window.trendChartInstance) {
        window.trendChartInstance.destroy();
    }
    
    window.trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(month => {
                const [year, monthNum] = month.split('-');
                return new Date(year, monthNum - 1).toLocaleDateString('id-ID', { 
                    month: 'short', 
                    year: 'numeric' 
                });
            }),
            datasets: [{
                label: 'Income',
                data: incomeData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }, {
                label: 'Expenses',
                data: expenseData,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
};

// Form Handlers
const setupFormHandlers = () => {
    // Quick Add Form Handler
    const quickForm = document.querySelector('.quick-form');
    if (quickForm) {
        quickForm.addEventListener('submit', handleQuickFormSubmit);
    }
    
    // Transaction Form Handler
    const transactionForm = document.querySelector('.transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionFormSubmit);
    }
    
    // Budget Form Handler
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm) {
        budgetForm.addEventListener('submit', handleBudgetFormSubmit);
    }
    
    // Filter Handlers
    const filterCategory = document.getElementById('filterCategory');
    const filterType = document.getElementById('filterType');
    const searchInput = document.getElementById('searchTransactions');
    
    if (filterCategory) filterCategory.addEventListener('change', applyFilters);
    if (filterType) filterType.addEventListener('change', applyFilters);
    if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 300));
    
    // Cancel Edit Handler
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelEdit);
    }
};

const handleQuickFormSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (validateTransactionForm(formData)) {
        const transactionData = {
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            description: formData.get('description'),
            date: formData.get('date')
        };
        
        if (addTransaction(transactionData)) {
            e.target.reset();
        }
    }
};

const handleTransactionFormSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (validateTransactionForm(formData)) {
        const transactionData = {
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            description: formData.get('description'),
            date: formData.get('date')
        };
        
        const editingId = e.target.dataset.editingId;
        
        if (editingId) {
            // Update existing transaction
            if (updateTransaction(editingId, transactionData)) {
                cancelEdit();
            }
        } else {
            // Add new transaction
            if (addTransaction(transactionData)) {
                e.target.reset();
            }
        }
    }
};

const handleBudgetFormSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const budget = {};
    const categories = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'healthcare', 'education', 'other'];
    
    categories.forEach(category => {
        const value = parseFloat(formData.get(category)) || 0;
        if (value > 0) {
            budget[category] = value;
        }
    });
    
    if (saveBudget(budget)) {
        showNotification("Budget updated successfully", "success");
        updateBudgetProgress();
    }
};

// Navigation Handlers
const setupNavigationHandlers = () => {
    const navItems = document.querySelectorAll('.header__nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.target.getAttribute('href').substring(1);
            showSection(targetSection);
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('header__nav-item--active'));
            e.target.classList.add('header__nav-item--active');
        });
    });
};

const showSection = (sectionName) => {
    // Hide all sections first
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('section--active');
    });
    
    // Show target section with delay for smooth transition
    setTimeout(() => {
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('section--active');
            
            // Update charts if showing dashboard
            if (sectionName === 'dashboard') {
                setTimeout(updateCharts, 100);
            }
        }
    }, 50);
};

// Utility Functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(amount);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const validateTransactionForm = (formData) => {
    const amount = parseFloat(formData.get('amount'));
    const type = formData.get('type');
    const category = formData.get('category');
    const description = formData.get('description')?.trim();
    const date = formData.get('date');
    
    if (!amount || amount <= 0) {
        showNotification("Please enter a valid amount", "error");
        return false;
    }
    
    if (!type) {
        showNotification("Please select transaction type", "error");
        return false;
    }
    
    if (!category) {
        showNotification("Please select a category", "error");
        return false;
    }
    
    if (!description) {
        showNotification("Please enter a description", "error");
        return false;
    }
    
    if (!date) {
        showNotification("Please select a date", "error");
        return false;
    }
    
    return true;
};

const showNotification = (message, type = 'info') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background-color: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)'};
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const applyFilters = () => {
    const category = document.getElementById('filterCategory')?.value;
    const type = document.getElementById('filterType')?.value;
    const search = document.getElementById('searchTransactions')?.value;
    
    const filters = {};
    if (category) filters.category = category;
    if (type) filters.type = type;
    if (search) filters.search = search;
    
    const filteredTransactions = getTransactions(filters);
    renderTransactions(filteredTransactions);
};

const editTransaction = (id) => {
    const transactions = loadTransactions();
    const transaction = transactions.find(t => t.id === id);
    
    if (!transaction) {
        showNotification("Transaction not found", "error");
        return;
    }
    
    // Switch to transactions tab
    showSection('transactions');
    document.querySelector('[href="#transactions"]').classList.add('header__nav-item--active');
    document.querySelector('[href="#dashboard"]').classList.remove('header__nav-item--active');
    
    // Fill form with transaction data
    const form = document.querySelector('.transaction-form');
    if (form) {
        form.dataset.editingId = id;
        form.querySelector('#transactionAmount').value = transaction.amount;
        form.querySelector('#transactionType').value = transaction.type;
        form.querySelector('#transactionCategory').value = transaction.category;
        form.querySelector('#transactionDate').value = transaction.date;
        form.querySelector('#transactionDescription').value = transaction.description;
        
        // Show cancel button
        const cancelBtn = document.getElementById('cancelEdit');
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
        
        // Update form title
        const title = form.querySelector('.transaction-form__title');
        if (title) title.textContent = 'Edit Transaction';
    }
};

const cancelEdit = () => {
    const form = document.querySelector('.transaction-form');
    if (form) {
        delete form.dataset.editingId;
        form.reset();
        
        // Hide cancel button
        const cancelBtn = document.getElementById('cancelEdit');
        if (cancelBtn) cancelBtn.style.display = 'none';
        
        // Reset form title
        const title = form.querySelector('.transaction-form__title');
        if (title) title.textContent = 'Add New Transaction';
    }
};

const refreshUI = () => {
    updateBalanceCard();
    renderTransactions();
    updateBudgetProgress();
    updateCharts();
};

// Initialize Application
const initApp = () => {
    // Set default date to today
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        if (!input.value) input.value = today;
    });
    
    // Setup event handlers
    setupFormHandlers();
    setupNavigationHandlers();
    
    // Load initial data
    refreshUI();
    
    // Show dashboard by default
    showSection('dashboard');
    
    console.log('SakuKu App Initialized Successfully!');
};

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);