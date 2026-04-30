let allPositions = [];
let watchlist = new Set();
let portfolioTotals = {};
const WATCHLIST_STORAGE_KEY = "hermes-portfolio-sentinel:watchlist";

function loadWatchlist() {
  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    const payload = raw ? JSON.parse(raw) : [];
    watchlist = new Set(Array.isArray(payload) ? payload.map((x) => String(x)) : []);
  } catch (err) {
    console.warn("加载本地关注失败", err);
    watchlist = new Set();
  }
}

function saveWatchlist() {
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(Array.from(watchlist)));
}

function text(v) {
  return (v || "").toString();
}

function num(v) {
  const value = Number(v);
  return Number.isFinite(value) ? value : 0;
}

function money(value, currency = "") {
  const prefix = currency ? `${currency} ` : "";
  return `${prefix}${num(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(value) {
  const n = num(value);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function plainPct(value) {
  return `${num(value).toFixed(2)}%`;
}

function signedClass(value) {
  const n = num(value);
  if (n > 0) return "positive";
  if (n < 0) return "negative";
  return "neutral";
}

function isWatched(symbol) {
  return watchlist.has(String(symbol));
}

function toggleWatch(symbol) {
  const key = String(symbol);
  if (watchlist.has(key)) {
    watchlist.delete(key);
  } else {
    watchlist.add(key);
  }
  saveWatchlist();
}

function matchesKeyword(position, keyword) {
  if (!keyword) return true;
  const target = [
    position.symbol,
    position.name,
    position.market,
    position.sector,
    position.risk_level,
    position.action_hint,
    position.notes,
  ].join(" ").toLowerCase();
  return target.includes(keyword.toLowerCase());
}

function renderOverview(positions) {
  const overview = document.getElementById("overview");
  const currency = positions[0]?.currency || "";
  overview.innerHTML = "";

  const items = [
    ["组合市值", money(portfolioTotals.total_market_value, currency), ""],
    ["今日盈亏", `${money(portfolioTotals.total_daily_profit_loss, currency)} (${pct(portfolioTotals.total_daily_profit_loss_pct)})`, signedClass(portfolioTotals.total_daily_profit_loss)],
    ["累计盈亏", `${money(portfolioTotals.total_profit_loss, currency)} (${pct(portfolioTotals.total_profit_loss_pct)})`, signedClass(portfolioTotals.total_profit_loss)],
    ["持仓数量", `${portfolioTotals.position_count || positions.length}`, ""],
  ];

  items.forEach(([label, value, cls]) => {
    const node = document.createElement("div");
    node.className = "metric";
    node.innerHTML = `<span>${label}</span><strong class="${cls}">${value}</strong>`;
    overview.appendChild(node);
  });
}

function renderCards(positions) {
  const container = document.getElementById("cards");
  container.innerHTML = "";

  if (!positions.length) {
    const div = document.createElement("div");
    div.className = "empty";
    div.textContent = "当前筛选条件下没有持仓。";
    container.appendChild(div);
    return;
  }

  const tpl = document.getElementById("positionTpl");
  positions.forEach((p) => {
    const node = tpl.content.cloneNode(true);
    const watched = isWatched(p.symbol);

    node.querySelector(".pill").textContent = p.symbol;
    const title = node.querySelector(".title");
    title.textContent = text(p.name) || p.symbol;
    title.href = `https://finance.yahoo.com/quote/${encodeURIComponent(p.symbol)}`;

    const watchBtn = node.querySelector(".watch-btn");
    watchBtn.classList.toggle("active", watched);
    watchBtn.textContent = watched ? "★ 已关注" : "☆ 关注";
    watchBtn.addEventListener("click", () => {
      toggleWatch(p.symbol);
      applyFilter();
    });

    node.querySelector(".meta").textContent =
      `${text(p.market) || "-"} | ${text(p.sector) || "-"} | ${text(p.currency) || "-"}\n` +
      `股数: ${num(p.shares).toLocaleString()} | 成本: ${money(p.cost_price, p.currency)} | 当前: ${money(p.current_price, p.currency)}`;

    const risk = node.querySelector(".risk");
    risk.textContent = text(p.risk_level) || "Low";
    risk.classList.add(`risk-${text(p.risk_level).toLowerCase() || "low"}`);

    const values = node.querySelector(".values");
    const metrics = [
      ["仓位", plainPct(p.weight_pct), ""],
      ["市值", money(p.market_value, p.currency), ""],
      ["今日", pct(p.daily_change_pct), signedClass(p.daily_change_pct)],
      ["累计", pct(p.profit_loss_pct), signedClass(p.profit_loss_pct)],
    ];
    metrics.forEach(([label, value, cls]) => {
      const item = document.createElement("div");
      item.className = "value-cell";
      item.innerHTML = `<span>${label}</span><strong class="${cls}">${value}</strong>`;
      values.appendChild(item);
    });

    node.querySelector(".action-hint").textContent = text(p.action_hint) || "暂无提醒";
    node.querySelector(".notes").textContent = text(p.notes) || "未提供";
    container.appendChild(node);
  });
}

function sortPositions(positions, sortBy) {
  const result = [...positions];
  const desc = ["market_value", "daily_change_pct", "profit_loss_pct", "weight_pct"].includes(sortBy);
  result.sort((a, b) => {
    const left = num(a[sortBy]);
    const right = num(b[sortBy]);
    return desc ? right - left : left - right;
  });
  return result;
}

function applyFilter() {
  const keyword = document.getElementById("keyword").value.trim();
  const market = document.getElementById("marketFilter").value;
  const risk = document.getElementById("riskFilter").value;
  const watchedOnly = document.getElementById("watchedOnly").checked;
  const sortBy = document.getElementById("sortBy").value;

  let positions = allPositions.filter((p) =>
    matchesKeyword(p, keyword) &&
    (!market || text(p.market) === market) &&
    (!risk || text(p.risk_level) === risk) &&
    (!watchedOnly || isWatched(p.symbol))
  );
  positions = sortPositions(positions, sortBy);

  renderOverview(allPositions);
  renderCards(positions);

  const summary = document.getElementById("summary");
  summary.textContent = `共 ${allPositions.length} 个持仓，关注 ${watchlist.size} 个，当前展示 ${positions.length} 个`;
}

function resetFilter() {
  document.getElementById("keyword").value = "";
  document.getElementById("marketFilter").value = "";
  document.getElementById("riskFilter").value = "";
  document.getElementById("watchedOnly").checked = false;
  document.getElementById("sortBy").value = "market_value";
  applyFilter();
}

function fillOptions(select, values) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

async function init() {
  const res = await fetch("portfolio_data.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`加载 portfolio_data.json 失败: HTTP ${res.status}`);
  }
  const payload = await res.json();
  allPositions = payload.positions || [];
  portfolioTotals = payload.totals || {};
  loadWatchlist();

  document.getElementById("metaText").textContent =
    `更新时间 ${payload.updated_at || "-"} | ${allPositions.length} 个持仓`;

  fillOptions(document.getElementById("marketFilter"), payload.markets || []);

  document.getElementById("applyBtn").addEventListener("click", applyFilter);
  document.getElementById("resetBtn").addEventListener("click", resetFilter);
  document.getElementById("watchedOnly").addEventListener("change", applyFilter);
  document.getElementById("keyword").addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyFilter();
  });
  document.getElementById("marketFilter").addEventListener("change", applyFilter);
  document.getElementById("riskFilter").addEventListener("change", applyFilter);
  document.getElementById("sortBy").addEventListener("change", applyFilter);

  applyFilter();
}

init().catch((err) => {
  document.getElementById("summary").textContent = err.message;
});
