/* global SUPABASE_URL:true, SUPABASE_ANON_KEY:true, TABLE_NAME:true, isLiveMode:true, currentDataset:true, filteredDataset:true, selectedMonthFilter:true, USER_NAME_MAP, resolveRepName, getTeacherDemoData */

let dailyChartInstance = null;
let monthlyChartInstance = null;
window.selectedDashboardDate = null;
window.userSelectedDate = false;

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  startLiveClock();
  fetchDashboardData();
});

// Live Clock System
function startLiveClock() {
  const clockEl = document.getElementById("live-clock");
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    clockEl.innerText = now.toLocaleTimeString();
  };

  updateClock();
  setInterval(updateClock, 1000);
}

// Toast System
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease reverse forwards";
    setTimeout(() => {
      if (container.contains(toast)) container.removeChild(toast);
    }, 300);
  }, 3200);
}

// Event Listeners Wire-up
function setupEventListeners() {

  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const sidebar = document.getElementById("sidebar");
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener("click", () => {
      sidebar.classList.add("active");
    });
  }

  const mobileCloseBtn = document.getElementById("mobile-sidebar-close-btn");
  if (mobileCloseBtn && sidebar) {
    mobileCloseBtn.addEventListener("click", () => {
      sidebar.classList.remove("active");
    });
  }

  // Close sidebar on navigation item click (mobile convenience)
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove("active");
      }
    });
  });

  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      const icon = document.getElementById("refresh-icon");
      if (icon) icon.classList.add("spinning");
      fetchDashboardData().then(() => {
        showToast("Dashboard data re-synchronized successfully!", "success");
      }).finally(() => {
        setTimeout(() => {
          if (icon) icon.classList.remove("spinning");
        }, 600);
      });
    });
  }

  const modeBtn = document.getElementById("mode-toggle-btn");
  if (modeBtn) {
    modeBtn.addEventListener("click", () => {
      isLiveMode = !isLiveMode;
      const modeText = document.getElementById("mode-text");
      if (modeText) {
        modeText.innerText = isLiveMode ? "Live" : "Demo";
      }
      showToast(`Switched to ${isLiveMode ? 'Live Database' : 'Demo Mode'}!`, "info");
      fetchDashboardData();
    });
  }



  const fullscreenBtn = document.getElementById("fullscreen-btn");
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        fullscreenBtn.innerHTML = `<i class="fa-solid fa-compress"></i>`;
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
          fullscreenBtn.innerHTML = `<i class="fa-solid fa-expand"></i>`;
        }
      }
    });
  }

  const datePicker = document.getElementById("dashboard-date-picker");
  if (datePicker) {
    if (window.selectedDashboardDate) datePicker.value = window.selectedDashboardDate;
    datePicker.addEventListener("change", (e) => {
      if (e.target.value) {
        window.selectedDashboardDate = e.target.value;
        window.userSelectedDate = true;
        showToast(`Fetching new data for ${e.target.value}...`, "info");
        fetchDashboardData();
      }
    });
  }

  const downloadBtn = document.getElementById("download-csv-btn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      if (!currentDataset || currentDataset.length === 0 || !currentDataset[0].leaderboard_metrics) {
        showToast("No data available to download.", "error");
        return;
      }
      
      const data = currentDataset[0].leaderboard_metrics;
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Name,Day Sales,Day Revenue,MTD Sales,MTD Revenue\n";
      
      data.forEach(row => {
        const name = resolveRepName({ user_id: row.sales_representative }) || "Unknown";
        const dayCount = row.today_sales || 0;
        const dayRev = row.today_revenue || 0;
        const mtdCount = row.mtd_sales || 0;
        const mtdRev = row.mtd_revenue || 0;
        csvContent += `${name},${dayCount},${dayRev},${mtdCount},${mtdRev}\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "sales_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("CSV Downloaded successfully!", "success");
    });
  }

  const filterAllBtn = document.getElementById("filter-all");
  const topPerformerBtn = document.getElementById("filter-target");
  
  if (filterAllBtn && topPerformerBtn) {
    filterAllBtn.addEventListener("click", () => {
      filterAllBtn.classList.add("active");
      topPerformerBtn.classList.remove("active");
      showToast("Showing all performers...", "info");
      
      if (currentDataset && currentDataset.length > 0) {
        let metrics = currentDataset[0].leaderboard_metrics || [];
        renderLeaderboardTable(metrics);
      }
    });

    topPerformerBtn.addEventListener("click", () => {
      topPerformerBtn.classList.add("active");
      filterAllBtn.classList.remove("active");
      showToast("Filtering top performers...", "info");
      
      if (currentDataset && currentDataset.length > 0) {
        let metrics = currentDataset[0].leaderboard_metrics || [];
        metrics = [...metrics].sort((a, b) => (b.mtd_sales || 0) - (a.mtd_sales || 0)).slice(0, 3);
        renderLeaderboardTable(metrics);
      }
    });
  }


  // Helper to setup modals
  const setupModal = (openBtnId, modalId, closeBtnId, cancelBtnId, onOpen = null) => {
    const openBtn = document.getElementById(openBtnId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeBtnId);
    const cancelBtn = document.getElementById(cancelBtnId);

    if (openBtn && modal) {
      openBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (onOpen) onOpen();
        modal.classList.add("active");
      });
    }
    const hide = () => { if (modal) modal.classList.remove("active"); };
    if (closeBtn) closeBtn.addEventListener("click", hide);
    if (cancelBtn) cancelBtn.addEventListener("click", hide);
    return hide;
  };

  const hideNewSaleModal = setupModal("add-sale-btn", "new-sale-modal", "close-modal", "cancel-modal");
  const newSaleForm = document.getElementById("new-sale-form");

  if (newSaleForm) {
    newSaleForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const userVal = document.getElementById("input-user").value;
      const destVal = document.getElementById("input-destination").value;
      const amtVal = parseFloat(document.getElementById("input-amount").value);

      const newRecord = {
        order_no: Math.floor(Math.random() * 8000) + 2000,
        order_date_time: new Date().toISOString().slice(0, 10),
        user_id: Math.floor(Math.random() * 1000) + 1000,
        product_id: Math.floor(Math.random() * 1000) + 1000,
        amount: amtVal,
        discount_amount: 0,
        created_by: userVal
      };

      currentDataset.unshift(newRecord);
      filteredDataset = [...currentDataset];

      updateDashboardUI(filteredDataset, isLiveMode ? "Live Supabase + Simulated Record" : "Connected (Demo Mode)");

      newSaleForm.reset();
      hideNewSaleModal();
      showToast(`Sale simulated successfully! Order #${newRecord.order_no} created.`, "success");
    });
  }



  const hideLogoutModal = setupModal("logout-btn", "logout-modal", "close-logout-modal", "cancel-logout-btn");
  const confirmLogoutBtn = document.getElementById("confirm-logout-btn");

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener("click", () => {
      hideLogoutModal();
      showToast("Logged out successfully! Re-initializing session...", "info");
      setTimeout(() => {
        fetchDashboardData();
      }, 500);
    });
  }

  document.querySelectorAll(".chart-period-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".chart-period-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      const period = parseInt(e.target.getAttribute("data-period"));
      updateDailyChartPeriod(period);
    });
  });

  const btnLine = document.getElementById("btn-chart-line");
  const btnBar = document.getElementById("btn-chart-bar");
  if (btnLine && btnBar) {
    btnLine.addEventListener("click", () => {
      btnLine.classList.add("active");
      btnBar.classList.remove("active");
      updateMonthlyChartType("line");
    });
    btnBar.addEventListener("click", () => {
      btnBar.classList.add("active");
      btnLine.classList.remove("active");
      updateMonthlyChartType("bar");
    });
  }

  const collapseBtn = document.getElementById("sidebar-collapse-btn");
  const appLayout = document.querySelector(".app-layout");
  const sidebarEl = document.getElementById("sidebar");
  if (collapseBtn && appLayout && sidebarEl) {
    collapseBtn.addEventListener("click", () => {
      sidebarEl.classList.toggle("collapsed");
      appLayout.classList.toggle("sidebar-collapsed");
      const isCollapsed = sidebarEl.classList.contains("collapsed");
      collapseBtn.title = isCollapsed ? "Expand sidebar" : "Collapse sidebar";
    });
  }
} // end setupEventListeners

// Fetch dashboard data
async function fetchDashboardData() {
  const statusEl = document.getElementById("api-status");
  const pingEl = document.getElementById("ping-badge");
  const startTime = Date.now();

  if (statusEl) {
    statusEl.innerText = isLiveMode ? "Fetching from Supabase..." : "Loading Demo Mode...";
    statusEl.style.color = "#3b82f6";
  }

  if (!isLiveMode) {
    setTimeout(() => {
      const demoData = getTeacherDemoData();
      currentDataset = demoData;
      filteredDataset = [...demoData];
      if (pingEl) pingEl.innerText = `${Date.now() - startTime}ms`;
      updateDashboardUI(demoData, "Connected (Demo Mode)");
    }, 300);
    return;
  }

  const endpoint = POSTMAN_API_KEY;

  try {
    const reportDate = window.selectedDashboardDate || new Date().toISOString().slice(0, 10);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ report_date: reportDate })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    currentDataset = data;
    filteredDataset = [...data];
    if (pingEl) pingEl.innerText = `${Date.now() - startTime}ms`;
    updateDashboardUI(data, "Connected to Supabase (200 OK)");

  } catch (error) {
    console.error("Supabase Fetch Error:", error);
    if (pingEl) pingEl.innerText = "-- ms";
    updateDashboardUI(null, "Error Connecting - Check API Key & Network");
    if (statusEl) statusEl.style.color = "#ef4444";
  }
}



function updateDashboardUI(data, statusMessage) {
  const statusEl = document.getElementById("api-status");
  const totalCountEl = document.getElementById("total-count");

  if (statusEl) {
    statusEl.innerText = statusMessage;
    if (!statusMessage.includes("Error")) statusEl.style.color = "#10b981";
  }

  if (!data || data.length === 0) return;

  const metrics = data[0] || {};
  const kpi_cards = metrics.kpi_cards || {};
  const leaderboard_metrics = metrics.leaderboard_metrics || [];
  const daily_metrics = metrics.daily_metrics || [];
  const monthly_metrics = metrics.monthly_metrics || [];

  if (totalCountEl) totalCountEl.innerText = leaderboard_metrics.reduce((acc, curr) => acc + (curr.mtd_sales || 0), 0);

  calculateAndRenderKPIs(kpi_cards);
  renderLeaderboardTable(leaderboard_metrics);
  renderTopDestinations();
  renderDailyChart(daily_metrics);
  renderMonthlyChart(monthly_metrics);
  renderSparklines();

}

// Renders mini sparklines
function renderSparklines() {
  drawSparkline("sparkline-today", [10, 20, 15, 30, 25, 45, 35, 55], "#f95700");
  drawSparkline("sparkline-mtd", [20, 25, 23, 28, 22, 35, 42, 38], "#3b82f6");
  drawSparkline("sparkline-sameday", [35, 30, 32, 28, 30, 24, 21, 25], "#94a3b8");
  drawSparkline("sparkline-prevmonth", [15, 22, 18, 24, 30, 32, 38, 40], "#a855f7");
}

function drawSparkline(canvasId, values, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 35;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (values.length < 2) return;

  const dx = canvas.width / (values.length - 1);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, color + "22");
  grad.addColorStop(1, color + "00");

  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  for (let i = 0; i < values.length; i++) {
    const x = i * dx;
    const y = canvas.height - ((values[i] - minVal) / range) * (canvas.height - 6) - 3;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, canvas.height - ((values[0] - minVal) / range) * (canvas.height - 6) - 3);
  for (let i = 1; i < values.length; i++) {
    const x = i * dx;
    const y = canvas.height - ((values[i] - minVal) / range) * (canvas.height - 6) - 3;
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// Calculates metrics for top 4 cards
function calculateAndRenderKPIs(kpi_cards) {
  let todayOrders = kpi_cards.TODAY_SALES || 0;
  let todayRevVal = kpi_cards.TODAY_REVENUE || 0;
  let todayRev = todayRevVal > 0 ? (todayRevVal / 1000).toFixed(2) : "0.00";

  let mtdOrders = kpi_cards.mtd_sales || 0;
  let mtdRevVal = kpi_cards.MTD_REVENUE || 0;
  let mtdRev = mtdRevVal > 0 ? (mtdRevVal / 1000).toFixed(2) : "0.00";

  let prevSameDayOrders = kpi_cards.PMSD_SALES || 0;
  let prevSameDayRevVal = kpi_cards.PMSD_REVENUE || 0;
  let prevSameDayRev = prevSameDayRevVal > 0 ? (prevSameDayRevVal / 1000).toFixed(2) : "0.00";

  let prevMonthOrders = kpi_cards.PM_SALES || 0;
  let prevMonthRevVal = kpi_cards.PM_REVENUE || 0;
  let prevMonthRev = prevMonthRevVal > 0 ? (prevMonthRevVal / 1000).toFixed(2) : "0.00";

  document.getElementById("today-orders").innerText = todayOrders;
  document.getElementById("today-revenue").innerHTML = `₹${todayRev}K <span class="sub-label">Revenue</span>`;

  document.getElementById("mtd-orders").innerText = mtdOrders;
  document.getElementById("mtd-revenue").innerHTML = `₹${mtdRev}K <span class="sub-label">Revenue</span>`;

  document.getElementById("prev-sameday-orders").innerText = prevSameDayOrders;
  document.getElementById("prev-sameday-revenue").innerHTML = `₹${prevSameDayRev}K <span class="sub-label">Revenue</span>`;

  document.getElementById("prev-month-orders").innerText = prevMonthOrders;
  document.getElementById("prev-month-revenue").innerHTML = `₹${prevMonthRev}K <span class="sub-label">Revenue</span>`;
}

// Renders Daily Leaderboard table with proper human User Names
function renderLeaderboardTable(leaderboardData) {
  const tHead = document.getElementById("table-head");
  const tBody = document.getElementById("table-body");

  if (!tHead || !tBody) return;

  tHead.innerHTML = `
    <tr>
      <th>#</th>
      <th>SALES_R</th>
      <th>#DAY</th>
      <th>#MTD</th>
      <th>MTD REV</th>
      <th>ARPU</th>
      <th style="min-width: 140px;">TARGET</th>
      <th>#PV_MONTH</th>
    </tr>
  `;

  tBody.innerHTML = "";

  if (!leaderboardData || leaderboardData.length === 0) {
    tBody.innerHTML = "<tr><td colspan='8' style='text-align: center; color: var(--text-muted); padding: 20px;'>No matching database records found</td></tr>";
    return;
  }

  let counter = 1;
  leaderboardData.slice(0, 10).forEach(rep => {
    const row = document.createElement("tr");

    const dayCount = rep.today_sales || 0;
    const dayRev = rep.today_revenue || 0;
    const dayText = `${dayCount} (₹${(dayRev / 1000).toFixed(1)}K)`;

    const mtdCount = rep.mtd_sales || 0;
    const mtdRev = rep.mtd_revenue || 0;
    const mtdRevText = `₹${(mtdRev / 1000).toFixed(1)}K`;

    const avg = mtdCount > 0 ? (mtdRev / mtdCount).toFixed(0) : "0";
    const arpu = `₹${avg}`;

    // Target % calculated based on goal of 200 orders
    const targetPct = Math.min(Math.round((mtdCount / 200) * 100), 150);
    const fillWidth = Math.min(targetPct, 100);
    const pvMonth = Math.max(1, Math.floor(mtdCount * 0.02));

    const name = resolveRepName({ user_id: rep.sales_representative }) || "Unknown";
    const initials = name.slice(0, 2).toUpperCase();

    row.innerHTML = `
      <td><strong>${counter++}</strong></td>
      <td>
        <div class="rep-cell">
          <div class="avatar-circle">${initials}</div>
          <strong style="color: white;">${name}</strong>
        </div>
      </td>
      <td>${dayText}</td>
      <td style="color: #f95700; font-weight: 700;">${mtdCount}</td>
      <td>${mtdRevText}</td>
      <td>${arpu}</td>
      <td>
        <div class="target-progress-container">
          <span class="target-percent">${targetPct}%</span>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${fillWidth}%;"></div>
          </div>
        </div>
      </td>
      <td>${pvMonth}</td>
    `;
    tBody.appendChild(row);
  });
}

// Renders Top Destinations
function renderTopDestinations() {
  const container = document.getElementById("destinations-list");
  if (!container) return;

  const destinations = [
    { name: "Singapore, Malaysia", count: 53, icon: "fa-plane" },
    { name: "Vietnam", count: 52, icon: "fa-map-location-dot" },
    { name: "Singapore, Malaysia, Thailand", count: 22, icon: "fa-passport" },
    { name: "Singapore, Malaysia, Indonesia", count: 21, icon: "fa-suitcase-rolling" },
    { name: "Vietnamobile", count: 19, icon: "fa-sim-card" },
    { name: "Japan", count: 17, icon: "fa-torii-gate" },
    { name: "United Kingdom", count: 17, icon: "fa-landmark" }
  ];

  container.innerHTML = "";
  destinations.forEach(item => {
    const el = document.createElement("div");
    el.className = "destination-item";
    el.innerHTML = `
      <div class="dest-name-group">
        <i class="fa-solid ${item.icon} dest-icon"></i>
        <span class="destination-name">${item.name}</span>
      </div>
      <span class="destination-badge">${item.count}</span>
    `;
    container.appendChild(el);
  });
}

// Daily Summary Line Chart
function renderDailyChart(dailyData) {
  const canvasEl = document.getElementById("myChart");
  if (!canvasEl) return;
  const ctx = canvasEl.getContext("2d");

  if (dailyChartInstance) {
    dailyChartInstance.destroy();
  }

  const daysLabels = [];
  const values = [];

  if (dailyData && dailyData.length > 0) {
    dailyData.forEach(item => {
      // slice(5) turns "2026-06-01" to "06-01"
      daysLabels.push(item.order_date ? item.order_date.slice(5) : "");
      values.push(item.total_revenue || 0);
    });
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 250);
  gradient.addColorStop(0, 'rgba(249, 87, 0, 0.45)');
  gradient.addColorStop(1, 'rgba(249, 87, 0, 0.0)');

  dailyChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: daysLabels,
      datasets: [{
        label: "Daily Sales Volume",
        data: values,
        borderColor: "#f95700",
        backgroundColor: gradient,
        borderWidth: 2.5,
        pointBackgroundColor: "#f95700",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 1.5,
        pointRadius: 4,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { font: { family: 'Plus Jakarta Sans', size: 9 }, color: '#94a3b8' } },
        y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { font: { family: 'Plus Jakarta Sans', size: 10 }, color: '#94a3b8' } }
      }
    }
  });
}

function updateDailyChartPeriod(days) {
  // Now managed directly by backend RPC dataset timeframe
  showToast(`Period filtering is now handled natively by the backend RPC!`, "info");
}

// Monthly Summary Line Chart
function renderMonthlyChart(monthlyData) {
  const canvasEl = document.getElementById("monthlyChart");
  if (!canvasEl) return;
  
  window.currentMonthlyData = monthlyData || [];
  updateMonthlyChartType("line");
}

function updateMonthlyChartType(type) {
  const canvasEl = document.getElementById("monthlyChart");
  if (!canvasEl) return;
  const ctx = canvasEl.getContext("2d");

  if (monthlyChartInstance) {
    monthlyChartInstance.destroy();
  }

  const months = [];
  const monthlyValues = [];

  const data = window.currentMonthlyData || [];
  data.forEach(item => {
    months.push(`${item.year}-${item.month}`);
    monthlyValues.push(item.no_of_sales || 0);
  });

  const gradient = ctx.createLinearGradient(0, 0, 0, 250);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

  const datasetConfig = {
    label: "Monthly Sales",
    data: monthlyValues,
    borderWidth: 2.5,
    fill: type === "line"
  };

  if (type === "line") {
    datasetConfig.borderColor = "#3b82f6";
    datasetConfig.backgroundColor = gradient;
    datasetConfig.pointBackgroundColor = "#3b82f6";
    datasetConfig.pointBorderColor = "#ffffff";
    datasetConfig.pointRadius = 4;
    datasetConfig.tension = 0.4;
  } else {
    datasetConfig.borderColor = "#3b82f6";
    datasetConfig.backgroundColor = "rgba(59, 130, 246, 0.85)";
    datasetConfig.borderRadius = 8;
  }

  monthlyChartInstance = new Chart(ctx, {
    type: type,
    data: {
      labels: months,
      datasets: [datasetConfig]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { font: { family: 'Plus Jakarta Sans', size: 10 }, color: '#94a3b8' } },
        y: { beginAtZero: true, max: 1200, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { font: { family: 'Plus Jakarta Sans', size: 10 }, color: '#94a3b8' } }
      }
    }
  });
}

