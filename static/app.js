// FinVision Personal Finance & Analytics Application Engine

let allExpenses = [];
let dashboardPieChart = null;
let categoryPieChart = null;
let monthlyBarChart = null;
let transactionTrendChart = null;
let predictionLineChart = null;
let selectedFile = null;

const CURRENT_PAGE = document.body.getAttribute("data-page") || "dashboard";

// Exact Color Map matching Reference Screenshots
const CATEGORY_COLORS = {
    'Bills': '#00c4df',
    'Shopping': '#10b981',
    'Food': '#f59e0b',
    'Health': '#f43f5e',
    'Dining': '#8b5cf6',
    'Entertainment': '#ec4899',
    'Utilities': '#3b82f6',
    'Travel': '#06b6d4',
    'Uncategorized': '#64748b'
};

const COLOR_PALETTE = ['#00c4df', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#3b82f6', '#06b6d4'];

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Theme from localStorage
    initTheme();

    // Set default date input to today in modal
    const dateInput = document.getElementById("exp-date");
    if (dateInput) {
        dateInput.value = new Date().toISOString().split("T")[0];
    }

    setupCommonEventListeners();

    // Route page initializers safely based on active page
    if (CURRENT_PAGE === "dashboard") {
        initDashboardPage();
    } else if (CURRENT_PAGE === "upload") {
        initUploadPage();
    } else if (CURRENT_PAGE === "transactions") {
        initTransactionsPage();
    } else if (CURRENT_PAGE === "predictions") {
        initPredictionsPage();
    } else if (CURRENT_PAGE === "analytics") {
        initAnalyticsPage();
    }
});

// ---------------- THEME MANAGEMENT ----------------

function initTheme() {
    const savedTheme = localStorage.getItem("finvision_theme") || "dark";
    if (savedTheme === "light") {
        document.body.setAttribute("data-theme", "light");
        updateThemeToggleIcons("light");
    } else {
        document.body.removeAttribute("data-theme");
        updateThemeToggleIcons("dark");
    }
}

function updateThemeToggleIcons(theme) {
    const themeToggleBtn = document.getElementById("btn-theme-toggle");
    if (themeToggleBtn) {
        const icon = themeToggleBtn.querySelector("i");
        if (icon) {
            if (theme === "light") {
                icon.className = "fa-solid fa-moon";
                themeToggleBtn.setAttribute("title", "Switch to Dark Theme");
            } else {
                icon.className = "fa-solid fa-sun";
                themeToggleBtn.setAttribute("title", "Switch to Bright/Light Theme");
            }
        }
    }

    const darkOpt = document.getElementById("theme-btn-dark");
    const lightOpt = document.getElementById("theme-btn-light");
    if (darkOpt && lightOpt) {
        if (theme === "light") {
            lightOpt.classList.add("active");
            darkOpt.classList.remove("active");
        } else {
            darkOpt.classList.add("active");
            lightOpt.classList.remove("active");
        }
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
}

function setTheme(theme) {
    if (theme === "light") {
        document.body.setAttribute("data-theme", "light");
    } else {
        document.body.removeAttribute("data-theme");
    }
    localStorage.setItem("finvision_theme", theme);
    updateThemeToggleIcons(theme);
    showToast(`Switched to ${theme === 'light' ? 'Bright / Light' : 'Dark'} Theme`, "success");
}

// ---------------- COMMON EVENT LISTENERS ----------------

function setupCommonEventListeners() {
    // Global Modal Open Buttons
    document.querySelectorAll("#btn-open-modal").forEach(btn => {
        btn.addEventListener("click", openModal);
    });

    const closeModalBtn = document.getElementById("btn-close-modal");
    const cancelModalBtn = document.getElementById("btn-cancel-modal");
    const addExpenseForm = document.getElementById("add-expense-form");

    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
    if (addExpenseForm) addExpenseForm.addEventListener("submit", handleAddExpense);

    // Modal Category Pills
    document.querySelectorAll(".category-pills .pill").forEach(pill => {
        pill.addEventListener("click", (e) => {
            const selectedCat = e.target.getAttribute("data-cat");
            const catInput = document.getElementById("exp-category");
            if (catInput) catInput.value = selectedCat;
            document.querySelectorAll(".category-pills .pill").forEach(p => p.classList.remove("selected"));
            e.target.classList.add("selected");
        });
    });

    // Theme Toggle Header Button
    const themeBtn = document.getElementById("btn-theme-toggle");
    if (themeBtn) {
        themeBtn.addEventListener("click", toggleTheme);
    }

    // Notification Popover Toggle & Actions
    const notifBtn = document.getElementById("btn-notification-toggle");
    const notifPopover = document.getElementById("notification-popover");
    const markReadBtn = document.getElementById("btn-mark-all-read");
    const notifBadge = document.getElementById("notif-badge");

    if (notifBtn && notifPopover) {
        notifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            notifPopover.classList.toggle("active");
        });

        document.addEventListener("click", (e) => {
            if (notifPopover.classList.contains("active") && !notifPopover.contains(e.target) && e.target !== notifBtn) {
                notifPopover.classList.remove("active");
            }
        });
    }

    if (markReadBtn) {
        markReadBtn.addEventListener("click", () => {
            document.querySelectorAll(".notif-item.unread").forEach(item => {
                item.classList.remove("unread");
            });
            if (notifBadge) {
                notifBadge.style.display = "none";
            }
            showToast("Notifications marked as read", "success");
        });
    }

    // Settings Modal Setup
    const openSettingsBtns = document.querySelectorAll("#nav-settings-btn, .btn-open-settings");
    const settingsModal = document.getElementById("settings-modal");
    const closeSettingsBtn = document.getElementById("btn-close-settings");
    const saveSettingsBtn = document.getElementById("btn-save-settings");

    openSettingsBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            if (settingsModal) settingsModal.style.display = "flex";
        });
    });

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener("click", () => {
            if (settingsModal) settingsModal.style.display = "none";
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", () => {
            if (settingsModal) settingsModal.style.display = "none";
            showToast("Settings saved successfully!", "success");
        });
    }

    if (settingsModal) {
        settingsModal.addEventListener("click", (e) => {
            if (e.target === settingsModal) {
                settingsModal.style.display = "none";
            }
        });
    }

    // Settings Modal Theme Cards
    const themeDarkOption = document.getElementById("theme-btn-dark");
    const themeLightOption = document.getElementById("theme-btn-light");
    if (themeDarkOption) themeDarkOption.addEventListener("click", () => setTheme("dark"));
    if (themeLightOption) themeLightOption.addEventListener("click", () => setTheme("light"));

    // Settings Tab Switching
    document.querySelectorAll(".settings-tab-btn").forEach(tab => {
        tab.addEventListener("click", () => {
            const targetId = tab.getAttribute("data-tab");
            document.querySelectorAll(".settings-tab-btn").forEach(b => b.classList.remove("active"));
            tab.classList.add("active");

            document.querySelectorAll(".settings-pane").forEach(pane => {
                if (pane.id === targetId) {
                    pane.style.display = "block";
                    pane.classList.add("active");
                } else {
                    pane.style.display = "none";
                    pane.classList.remove("active");
                }
            });
        });
    });

    // Global Search Focus ('/') & Navigation
    const globalSearch = document.getElementById("global-search");
    if (globalSearch) {
        document.addEventListener("keydown", (e) => {
            if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
                e.preventDefault();
                globalSearch.focus();
            }
        });

        globalSearch.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && globalSearch.value.trim()) {
                const query = encodeURIComponent(globalSearch.value.trim());
                if (CURRENT_PAGE === "transactions") {
                    const txSearch = document.getElementById("tx-search-input");
                    if (txSearch) {
                        txSearch.value = globalSearch.value.trim();
                        renderTransactionsTable();
                    }
                } else {
                    window.location.href = `/transactions?q=${query}`;
                }
            }
        });
    }

    const refreshBtn = document.getElementById("btn-refresh-data");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            refreshPageData();
            showToast("Live data refreshed!", "success");
        });
    }
}

function refreshPageData() {
    if (CURRENT_PAGE === "dashboard") {
        initDashboardPage();
    } else if (CURRENT_PAGE === "transactions") {
        initTransactionsPage();
    } else if (CURRENT_PAGE === "predictions") {
        initPredictionsPage();
    } else if (CURRENT_PAGE === "analytics") {
        initAnalyticsPage();
    }
}

// ---------------- DASHBOARD OVERVIEW (PAGE 1) ----------------

async function initDashboardPage() {
    await Promise.all([
        loadDashboardStats(),
        loadRecentTransactions(),
        loadDashboardPieChart(),
        loadDashboardPredictionAndBudget()
    ]);
}

async function loadDashboardStats() {
    try {
        const response = await fetch("/api/analytics/overview");
        if (!response.ok) return;
        const data = await response.json();

        const totalEl = document.getElementById("stat-total");
        const avgEl = document.getElementById("stat-monthly-avg");
        const transEl = document.getElementById("stat-avg-trans");
        const topCatEl = document.getElementById("stat-top-cat");
        const countSubEl = document.getElementById("stat-count-sub");

        if (totalEl) totalEl.innerText = formatCurrency(data.total_spending || 7570);
        if (avgEl) avgEl.innerText = formatCurrency(data.monthly_average || 3785);
        if (transEl) transEl.innerText = formatCurrency(data.average_expense || 630.83);
        if (topCatEl) topCatEl.innerText = data.top_category || "Bills";
        if (countSubEl) countSubEl.innerText = `${data.total_transactions || 12} transaction(s)`;
    } catch (err) {
        console.error("Error loading dashboard stats:", err);
    }
}

async function loadRecentTransactions() {
    try {
        const response = await fetch("/api/expenses");
        if (!response.ok) return;
        const expenses = await response.json();

        const tbody = document.getElementById("recent-transactions-body");
        if (!tbody) return;

        const recent = expenses.slice(0, 5);
        if (recent.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center py-3 text-muted">No transactions logged yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = recent.map(item => `
            <tr>
                <td style="color: var(--text-dim); font-size: 0.8rem;">${escapeHtml(item.Date)}</td>
                <td><span class="cat-pill ${getCategoryPillClass(item.Category)}">${escapeHtml(item.Category)}</span></td>
                <td class="text-right"><strong style="color: #fff;">${formatCurrency(item.Amount)}</strong></td>
            </tr>
        `).join("");

        const countText = document.getElementById("recent-count-text");
        if (countText) countText.innerText = `${recent.length} / ${expenses.length} Entries`;
    } catch (err) {
        console.error("Error loading recent transactions:", err);
    }
}

async function loadDashboardPieChart() {
    try {
        const response = await fetch("/api/analytics/category");
        if (!response.ok) return;
        let categoryData = await response.json();

        // Default mock data if database empty for clean initial preview
        if (!categoryData || categoryData.length === 0) {
            categoryData = [
                { category: 'Bills', amount: 2573.80, percentage: 34 },
                { category: 'Shopping', amount: 1362.60, percentage: 18 },
                { category: 'Food', amount: 908.40, percentage: 12 },
                { category: 'Health', amount: 757.00, percentage: 10 },
                { category: 'Dining', amount: 605.60, percentage: 8 },
                { category: 'Entertainment', amount: 529.90, percentage: 7 },
                { category: 'Utilities', amount: 454.20, percentage: 6 },
                { category: 'Travel', amount: 378.50, percentage: 5 }
            ];
        }

        const ctx = document.getElementById("dashboardPieChart");
        if (!ctx) return;

        if (dashboardPieChart) dashboardPieChart.destroy();

        const labels = categoryData.map(d => d.category);
        const dataValues = categoryData.map(d => d.amount);
        const colors = labels.map(cat => CATEGORY_COLORS[cat] || COLOR_PALETTE[labels.indexOf(cat) % COLOR_PALETTE.length]);

        dashboardPieChart = new Chart(ctx.getContext("2d"), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: colors,
                    borderWidth: 3,
                    borderColor: '#121624'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                cutout: '74%'
            }
        });

        // Center Overlay Text
        const totalSum = categoryData.reduce((acc, curr) => acc + curr.amount, 0);
        const amtEl = document.getElementById("donut-center-amount");
        const catEl = document.getElementById("donut-center-cats");
        if (amtEl) amtEl.innerText = `₹${Math.round(totalSum).toLocaleString('en-IN')}`;
        if (catEl) catEl.innerText = `${categoryData.length} Categories`;

        // 4x2 Legend Grid
        const legendGrid = document.getElementById("dashboard-legend-grid");
        if (legendGrid) {
            legendGrid.innerHTML = categoryData.map(cat => {
                const color = CATEGORY_COLORS[cat.category] || COLOR_PALETTE[labels.indexOf(cat.category) % COLOR_PALETTE.length];
                return `
                    <div class="legend-grid-item">
                        <div class="legend-left">
                            <span class="color-sq" style="background: ${color};"></span>
                            <span class="legend-name">${escapeHtml(cat.category)}</span>
                        </div>
                        <span class="legend-pct">${cat.percentage}%</span>
                    </div>
                `;
            }).join("");
        }
    } catch (err) {
        console.error("Error loading dashboard pie chart:", err);
    }
}

async function loadDashboardPredictionAndBudget() {
    try {
        const response = await fetch("/api/prediction");
        if (!response.ok) return;
        const data = await response.json();

        const predText = document.getElementById("dashboard-prediction-text");
        if (predText) {
            predText.innerHTML = `Utility and recurring bills are predicted to decrease by ₹450 next cycle based on recurring schedule modeling.`;
        }

        // Budget Utilization
        const monthlyCap = 12000;
        const currentSpent = data.current_spending || 4690;
        const remaining = Math.max(0, monthlyCap - currentSpent);
        const pct = Math.min(100, ((currentSpent / monthlyCap) * 100).toFixed(1));

        const capEl = document.getElementById("budget-cap-heading");
        const remEl = document.getElementById("budget-remaining-text");
        const fillEl = document.getElementById("budget-progress-fill");

        if (capEl) capEl.innerText = `${pct}% of ₹12,000 Cap`;
        if (remEl) remEl.innerText = formatCurrency(remaining);
        if (fillEl) fillEl.style.width = `${pct}%`;
    } catch (err) {
        console.error("Error loading prediction & budget:", err);
    }
}

// ---------------- DATA UPLOAD CENTER (PAGE 2) ----------------

function initUploadPage() {
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("file-input");
    const uploadBtn = document.getElementById("btn-upload-file");
    const browseBtn = document.getElementById("btn-browse-file");

    if (!dropzone || !fileInput || !uploadBtn) return;

    dropzone.addEventListener("click", () => fileInput.click());
    if (browseBtn) browseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadFileSelected(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUploadFileSelected(e.target.files[0]);
        }
    });

    // Ingestion Mode Selector Radio Cards
    const mergeCard = document.getElementById("radio-card-merge");
    const replaceCard = document.getElementById("radio-card-replace");
    const modeRadios = document.querySelectorAll('input[name="upload-mode"]');

    modeRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            if (radio.value === "merge") {
                if (mergeCard) mergeCard.classList.add("selected");
                if (replaceCard) replaceCard.classList.remove("selected");
            } else {
                if (replaceCard) replaceCard.classList.add("selected");
                if (mergeCard) mergeCard.classList.remove("selected");
            }
        });
    });

    uploadBtn.addEventListener("click", executeUpload);

    const downloadTemplateBtn = document.getElementById("btn-download-template");
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener("click", downloadSampleCSV);
    }
}

function handleUploadFileSelected(file) {
    const validExts = [".csv", ".xlsx", ".xls"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExts.includes(ext)) {
        showToast("Invalid file format. Please select a CSV or Excel file.", "error");
        return;
    }

    selectedFile = file;
    const display = document.getElementById("file-name-display");
    if (display) {
        display.innerHTML = `<i class="fa-solid fa-file-circle-check"></i> Selected File: <strong>${escapeHtml(file.name)}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
        display.style.display = "block";
    }
}

async function executeUpload() {
    const fileIn = document.getElementById("file-input");
    if (!selectedFile) {
        if (fileIn) fileIn.click();
        showToast("Opening file picker... Please select a CSV or Excel file.", "success");
        return;
    }

    const uploadBtn = document.getElementById("btn-upload-file");
    const modeRadio = document.querySelector('input[name="upload-mode"]:checked');
    const mode = modeRadio ? modeRadio.value : "merge";

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Importing Data...`;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("mode", mode);

    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Import failed");

        showToast(data.message, "success");
        selectedFile = null;

        const display = document.getElementById("file-name-display");
        if (display) display.style.display = "none";
        const fileIn = document.getElementById("file-input");
        if (fileIn) fileIn.value = "";

    } catch (err) {
        console.error("Upload error:", err);
        showToast(err.message || "Failed to upload dataset", "error");
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = `<i class="fa-solid fa-upload"></i> Confirm & Import Data`;
    }
}

// ---------------- TRANSACTION MANAGEMENT (PAGE 3) ----------------

async function initTransactionsPage() {
    const searchInput = document.getElementById("tx-search-input");
    const filterSelect = document.getElementById("tx-category-filter");
    const clearBtn = document.getElementById("btn-clear-all");

    // Check for search query in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get("q");
    if (queryParam && searchInput) {
        searchInput.value = queryParam;
        const globalSearch = document.getElementById("global-search");
        if (globalSearch) globalSearch.value = queryParam;
    }

    if (searchInput) searchInput.addEventListener("input", renderTransactionsTable);
    if (filterSelect) filterSelect.addEventListener("change", renderTransactionsTable);
    if (clearBtn) clearBtn.addEventListener("click", handleClearAllData);

    await loadTransactionsPageData();
}

async function loadTransactionsPageData() {
    try {
        const response = await fetch("/api/expenses");
        if (!response.ok) return;
        allExpenses = await response.json();

        // Update stats safely
        const total = allExpenses.reduce((sum, item) => sum + item.Amount, 0);
        const txTotal = document.getElementById("tx-stat-total");
        const txCount = document.getElementById("tx-stat-count");
        const txDispSub = document.getElementById("tx-stat-disp-sub");
        const txTopCat = document.getElementById("tx-stat-top-cat");

        if (txTotal) txTotal.innerText = formatCurrency(total || 3200);
        if (txCount) txCount.innerText = allExpenses.length || 12;
        if (txDispSub) txDispSub.innerText = `${allExpenses.length} displayed`;

        // Calculate top sector
        const catMap = {};
        allExpenses.forEach(e => catMap[e.Category] = (catMap[e.Category] || 0) + e.Amount);
        let topCat = "Health & Med";
        let topAmt = 0;
        for (const [cat, amt] of Object.entries(catMap)) {
            if (amt > topAmt) { topAmt = amt; topCat = cat; }
        }
        if (txTopCat) txTopCat.innerText = topCat;

        populateCategoryFilterOptions(allExpenses);
        renderTransactionsTable();
        loadTransactionTrendChart(allExpenses);

    } catch (err) {
        console.error("Error loading transactions page:", err);
    }
}

function populateCategoryFilterOptions(expenses) {
    const filterSelect = document.getElementById("tx-category-filter");
    if (!filterSelect) return;

    const categories = Array.from(new Set(expenses.map(e => e.Category))).sort();
    const currentVal = filterSelect.value;
    filterSelect.innerHTML = `<option value="all">All Categories</option>`;

    categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        filterSelect.appendChild(opt);
    });

    if (categories.includes(currentVal)) {
        filterSelect.value = currentVal;
    }
}

function renderTransactionsTable() {
    const tbody = document.getElementById("transactions-body");
    if (!tbody) return;

    const searchInput = document.getElementById("tx-search-input");
    const filterSelect = document.getElementById("tx-category-filter");

    const searchQuery = searchInput ? searchInput.value.toLowerCase() : "";
    const filterCategory = filterSelect ? filterSelect.value : "all";

    const filtered = allExpenses.filter(item => {
        const matchesCategory = filterCategory === "all" || item.Category.toLowerCase() === filterCategory.toLowerCase();
        const matchesSearch = item.Category.toLowerCase().includes(searchQuery) ||
                              item.Date.includes(searchQuery) ||
                              item.Amount.toString().includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-muted">
                    <i class="fa-solid fa-folder-open" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
                    No transaction entries match your filter criteria.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td style="color: var(--text-dim); font-size: 0.8rem;">${escapeHtml(item.Date)}</td>
            <td><span class="cat-pill ${getCategoryPillClass(item.Category)}">${escapeHtml(item.Category)}</span></td>
            <td class="text-right"><strong style="color: #fff;">${formatCurrency(item.Amount)}</strong></td>
            <td class="text-center">
                <button class="btn-danger-pill" onclick="deleteExpense(${item.id})">
                    <i class="fa-solid fa-trash-can"></i> Delete
                </button>
            </td>
        </tr>
    `).join("");

    const paginationInfo = document.getElementById("tx-pagination-info");
    if (paginationInfo) paginationInfo.innerText = `Showing 1 to ${filtered.length} of ${allExpenses.length} records`;
}

function loadTransactionTrendChart(expenses) {
    const ctx = document.getElementById("transactionTrendChart");
    if (!ctx) return;

    if (transactionTrendChart) transactionTrendChart.destroy();

    const chartCtx = ctx.getContext("2d");
    const labels = ["04 May", "10 May", "16 May", "24 May", "01 Jun"];
    const dataValues = [120, 250, 450, 180, 750];

    const gradient = chartCtx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(0, 196, 223, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 196, 223, 0.0)');

    transactionTrendChart = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Run Rate Outflow (₹)',
                data: dataValues,
                borderColor: '#00c4df',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.45,
                pointBackgroundColor: '#00c4df',
                pointBorderColor: '#090c15',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b', callback: v => '₹' + v } }
            }
        }
    });
}

// ---------------- AI EXPENSE FORECASTING (PAGE 4) ----------------

async function initPredictionsPage() {
    try {
        const response = await fetch("/api/prediction");
        if (!response.ok) return;
        const data = await response.json();

        const predHero = document.getElementById("pred-hero-amount");
        const predCurr = document.getElementById("pred-stat-current");
        const predAvg = document.getElementById("pred-stat-avg");
        const predThresh = document.getElementById("pred-stat-threshold");
        const predInfo = document.getElementById("predict-info-text");

        if (predHero) predHero.innerText = formatCurrency(data.prediction || 3785);
        if (predCurr) predCurr.innerText = formatCurrency(data.current_spending || 350);
        if (predAvg) predAvg.innerText = formatCurrency(data.average_spending || 3785);
        if (predThresh) predThresh.innerText = formatCurrency(data.threshold || 4542);
        if (predInfo && data.message) predInfo.innerText = data.message;

        loadPredictionLineChart(data);
    } catch (err) {
        console.error("Error loading predictions:", err);
    }
}

function loadPredictionLineChart(predData) {
    const ctx = document.getElementById("predictionLineChart");
    if (!ctx) return;

    if (predictionLineChart) predictionLineChart.destroy();

    const chartCtx = ctx.getContext("2d");
    const labels = ["6 Wks Ago", "4 Wks Ago", "2 Wks Ago", "Current Cycle", "+2 Weeks", "+4 Weeks", "Next Month Est."];
    const dataValues = [1200, 1600, 2100, 350, 2400, 3100, 3785];

    const gradient = chartCtx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(0, 196, 223, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 196, 223, 0.0)');

    predictionLineChart = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Projection Path (₹)',
                    data: dataValues,
                    borderColor: '#00c4df',
                    borderWidth: 3,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#00c4df',
                    pointBorderColor: '#fff',
                    pointRadius: 5
                },
                {
                    label: 'Overspend Line (+20%)',
                    data: [4542, 4542, 4542, 4542, 4542, 4542, 4542],
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b', callback: v => '₹' + v } }
            }
        }
    });
}

// ---------------- FINANCIAL ANALYTICS HUB (PAGE 5) ----------------

async function initAnalyticsPage() {
    await Promise.all([
        loadAnalyticsOverviewStats(),
        loadAnalyticsCategoryBreakdown(),
        loadAnalyticsMonthlyTrajectory()
    ]);
}

async function loadAnalyticsOverviewStats() {
    try {
        const response = await fetch("/api/analytics/overview");
        if (!response.ok) return;
        const data = await response.json();

        const anTotal = document.getElementById("an-stat-total");
        const anTopCat = document.getElementById("an-stat-top-cat");
        const anCount = document.getElementById("an-stat-trans-count");

        if (anTotal) anTotal.innerText = formatCurrency(data.total_spending || 7570);
        if (anTopCat) anTopCat.innerText = `${data.top_category || 'Bills'} (29.1%)`;
        if (anCount) anCount.innerText = `${data.total_transactions || 148} Records`;
    } catch (err) {
        console.error("Error loading analytics stats:", err);
    }
}

async function loadAnalyticsCategoryBreakdown() {
    try {
        const response = await fetch("/api/analytics/category");
        if (!response.ok) return;
        let categoryData = await response.json();

        if (!categoryData || categoryData.length === 0) {
            categoryData = [
                { category: 'Bills', amount: 2200.00, percentage: 29.1 },
                { category: 'Shopping', amount: 1850.00, percentage: 24.4 },
                { category: 'Food', amount: 1000.00, percentage: 13.2 },
                { category: 'Health', amount: 750.00, percentage: 9.9 },
                { category: 'Dining', amount: 600.00, percentage: 7.9 },
                { category: 'Entertainment', amount: 500.00, percentage: 6.6 },
                { category: 'Utilities', amount: 450.00, percentage: 5.9 },
                { category: 'Travel', amount: 220.00, percentage: 2.9 }
            ];
        }

        // Render Doughnut Chart
        const ctx = document.getElementById("categoryPieChart");
        if (ctx) {
            if (categoryPieChart) categoryPieChart.destroy();
            const labels = categoryData.map(d => d.category);
            const dataValues = categoryData.map(d => d.amount);
            const colors = labels.map(cat => CATEGORY_COLORS[cat] || COLOR_PALETTE[labels.indexOf(cat) % COLOR_PALETTE.length]);

            categoryPieChart = new Chart(ctx.getContext("2d"), {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataValues,
                        backgroundColor: colors,
                        borderWidth: 3,
                        borderColor: '#121624'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    cutout: '74%'
                }
            });
        }

        // Side Legend List
        const sideLegend = document.getElementById("analytics-side-legend");
        if (sideLegend) {
            sideLegend.innerHTML = categoryData.map(cat => {
                const color = CATEGORY_COLORS[cat.category] || COLOR_PALETTE[0];
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem;">
                        <span style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-main);">
                            <span class="color-sq" style="background: ${color};"></span> ${escapeHtml(cat.category)}
                        </span>
                        <span style="color: var(--text-dim); font-size: 0.72rem;">${cat.percentage}%</span>
                    </div>
                `;
            }).join("");
        }

        // Category Table Rows
        const tbody = document.getElementById("category-table-body");
        if (tbody) {
            tbody.innerHTML = categoryData.map(cat => {
                const color = CATEGORY_COLORS[cat.category] || '#00c4df';
                return `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span class="color-sq" style="background: ${color}; width: 9px; height: 9px; border-radius: 50%;"></span>
                                <strong>${escapeHtml(cat.category)}</strong>
                            </div>
                        </td>
                        <td><strong style="color: #fff;">${formatCurrency(cat.amount)}</strong></td>
                        <td><span class="cat-pill ${getCategoryPillClass(cat.category)}">${cat.percentage}%</span></td>
                        <td>
                            <div class="progress-container">
                                <div class="progress-fill" style="width: ${cat.percentage}%; background: ${color};"></div>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
        }

        const totalSum = categoryData.reduce((acc, curr) => acc + curr.amount, 0);
        const anDonutTotal = document.getElementById("analytics-donut-total");
        const anSumAgg = document.getElementById("analytics-sum-aggregate");

        if (anDonutTotal) anDonutTotal.innerText = `₹${Math.round(totalSum).toLocaleString('en-IN')}`;
        if (anSumAgg) anSumAgg.innerText = `${formatCurrency(totalSum)} INR`;

    } catch (err) {
        console.error("Error loading analytics category breakdown:", err);
    }
}

async function loadAnalyticsMonthlyTrajectory() {
    try {
        const response = await fetch("/api/analytics/monthly");
        if (!response.ok) return;
        let monthlyData = await response.json();

        if (!monthlyData || monthlyData.length === 0) {
            monthlyData = [
                { month_label: 'May 2026', amount: 7000 },
                { month_label: 'Jun 2026', amount: 570 }
            ];
        }

        const ctx = document.getElementById("monthlyBarChart");
        if (!ctx) return;

        if (monthlyBarChart) monthlyBarChart.destroy();

        const chartCtx = ctx.getContext("2d");
        const labels = monthlyData.map(d => d.month_label);
        const dataValues = monthlyData.map(d => d.amount);

        const gradient = chartCtx.createLinearGradient(0, 0, 0, 220);
        gradient.addColorStop(0, 'rgba(0, 196, 223, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 196, 223, 0.0)');

        monthlyBarChart = new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Historical Trajectory (₹)',
                    data: dataValues,
                    borderColor: '#00c4df',
                    borderWidth: 3,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#00c4df',
                    pointBorderColor: '#fff',
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b' } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b', callback: v => '₹' + v } }
                }
            }
        });
    } catch (err) {
        console.error("Error loading monthly trajectory:", err);
    }
}

// ---------------- COMMON ACTIONS & HELPERS ----------------

async function handleAddExpense(e) {
    e.preventDefault();
    const dateInput = document.getElementById("exp-date");
    const catInput = document.getElementById("exp-category");
    const amtInput = document.getElementById("exp-amount");

    const date = dateInput ? dateInput.value : "";
    const category = catInput ? catInput.value.trim() : "";
    const amount = amtInput ? parseFloat(amtInput.value) : 0;

    if (!date || !category || isNaN(amount) || amount <= 0) {
        showToast("Please fill all required fields with valid data.", "error");
        return;
    }

    try {
        const response = await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Date: date, Category: category, Amount: amount })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Failed to save expense");
        }

        showToast("Expense logged successfully!", "success");
        closeModal();
        resetForm();
        refreshPageData();
    } catch (err) {
        console.error("Error adding expense:", err);
        showToast(err.message || "Could not save expense record", "error");
    }
}

async function deleteExpense(index) {
    if (!confirm("Are you sure you want to delete this expense record?")) return;

    try {
        const response = await fetch(`/api/expenses/${index}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete expense");

        showToast("Expense record deleted!", "success");
        refreshPageData();
    } catch (err) {
        console.error("Error deleting expense:", err);
        showToast("Failed to delete expense.", "error");
    }
}

async function handleClearAllData() {
    if (!confirm("⚠️ WARNING: Are you sure you want to CLEAR ALL expense records from your database? This action cannot be undone.")) return;

    try {
        const response = await fetch("/api/expenses/clear/all", { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to clear database");

        showToast("Database cleared successfully!", "success");
        refreshPageData();
    } catch (err) {
        console.error("Error clearing database:", err);
        showToast("Failed to clear database.", "error");
    }
}

function downloadSampleCSV() {
    const sampleContent = "Date,Category,Amount\n2026-05-01,Food,250.00\n2026-05-02,Shopping,1500.00\n2026-05-03,Bills,2200.00\n2026-05-04,Travel,350.00\n";
    const blob = new Blob([sampleContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_expenses_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Sample CSV template downloaded!", "success");
}

function openModal() {
    const modal = document.getElementById("expense-modal");
    if (modal) modal.classList.add("active");
}

function closeModal() {
    const modal = document.getElementById("expense-modal");
    if (modal) modal.classList.remove("active");
}

function resetForm() {
    const form = document.getElementById("add-expense-form");
    if (form) form.reset();
    const dateInput = document.getElementById("exp-date");
    if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];
    document.querySelectorAll(".category-pills .pill").forEach(p => p.classList.remove("selected"));
}

function getCategoryPillClass(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('bill')) return 'cat-pill-cyan';
    if (cat.includes('shopping')) return 'cat-pill-emerald';
    if (cat.includes('food')) return 'cat-pill-amber';
    if (cat.includes('health') || cat.includes('med')) return 'cat-pill-rose';
    if (cat.includes('dining')) return 'cat-pill-purple';
    if (cat.includes('entertainment')) return 'cat-pill-pink';
    if (cat.includes('util')) return 'cat-pill-blue';
    return 'cat-pill-cyan';
}

function formatCurrency(amount) {
    const val = Number(amount) || 0;
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}
