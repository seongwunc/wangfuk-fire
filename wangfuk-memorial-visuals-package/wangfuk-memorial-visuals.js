const SCRIPT_BASE_URL = new URL(".", document.currentScript?.src || window.location.href);
const MESSAGE_CSV = new URL("outputs/datasets/wangfuk_messages_soundwall.csv", SCRIPT_BASE_URL).href;
const SOUL_CSV = new URL("outputs/datasets/wangfuk_souls_lampwall.csv", SCRIPT_BASE_URL).href;

const vizPalette = {
  text: "#f7eee8",
  muted: "#cfb9ae",
  ember: "#ff5c38",
  emberSoft: "#ff8a5a",
  gold: "#f4ba79",
  dim: "rgba(247, 238, 232, 0.2)",
};

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatDateRange(messages) {
  const dates = messages.map((d) => d.date_iso).filter(Boolean).sort();
  return `${dates[0]} 至 ${dates.at(-1)}`;
}

function tooltipFor(container) {
  let tip = container.querySelector(".viz-tooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "viz-tooltip";
    container.append(tip);
  }
  return tip;
}

function placeTooltip(container, tip, event) {
  const box = container.getBoundingClientRect();
  const x = Math.min(event.clientX - box.left + 18, box.width - tip.offsetWidth - 14);
  const y = Math.min(event.clientY - box.top + 18, box.height - tip.offsetHeight - 14);
  tip.style.left = `${Math.max(14, x)}px`;
  tip.style.top = `${Math.max(14, y)}px`;
}

function clearTooltipMode(tip) {
  tip.classList.remove("viz-tooltip--full");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeWavePath(width, amplitude, density, seed) {
  const points = [];
  const step = 9;
  const mid = 0;
  for (let x = 0; x <= width; x += step) {
    const waveA = Math.sin((x / 18) + seed) * amplitude;
    const waveB = Math.sin((x / 7) + seed * 1.7) * amplitude * 0.28 * density;
    points.push([x, mid + waveA + waveB]);
  }
  return d3.line().curve(d3.curveCatmullRom.alpha(0.45))(points);
}

function displayTitle(d) {
  if (d.name_status === "known" && d.name_display) return d.name_display;
  if (d.location_label) return d.location_label;
  return d.block_group || d.block || "位置待补充";
}

function publicInfoLabel(d) {
  const bits = [];
  if (d.name_status === "known") bits.push("称谓");
  if (d.location_label) bits.push("位置");
  if (d.age_years) bits.push("年龄");
  if (d.gender) bits.push("性别");
  return bits.length ? `公开资料：${bits.join("、")}` : "公开资料：待补充";
}

function isResidentMessage(d) {
  const author = d.author || "";
  const text = d.message_text || "";
  const negativePatterns = ["我沒有朋友或家人住宏福苑", "我没有朋友或家人住宏福苑"];
  if (negativePatterns.some((pattern) => text.includes(pattern))) return false;
  const authorPatterns = [
    "宏福住戶",
    "宏福住户",
    "宏福苑住戶",
    "宏福苑住户",
    "宏福苑居民",
    "宏福居民",
  ];
  const firstPersonLossPatterns = [
    "失去親人",
    "失去家人",
    "失去屋企人",
    "逝去的親人",
    "逝去親人",
    "想念親人",
    "掛住親人",
    "我的親人",
    "我嘅親人",
    "我家人",
    "我屋企人",
    "死傷者嘅家屬",
    "死傷者的家屬",
    "遇難者家屬",
  ];
  return authorPatterns.some((pattern) => author.includes(pattern)) || firstPersonLossPatterns.some((pattern) => text.includes(pattern));
}

function splitSoulRecords(souls) {
  const pets = souls.filter((d) => d.record_type === "pet");
  const nonPets = souls.filter((d) => d.record_type !== "pet");
  return {
    memorialSouls: nonPets.slice(0, 168),
    excludedPlaceholders: nonPets.slice(168),
    pets,
  };
}

function detailRows(d) {
  const labels = [
    ["soul_id", "资料编号"],
    ["name_display", "姓名/称谓"],
    ["record_type", "记录类型"],
    ["block_group", "楼宇"],
    ["location_label", "位置"],
    ["age_years", "年龄"],
    ["gender", "性别"],
    ["detail_url", "原始卡片"],
  ];

  return labels
    .map(([key, label]) => {
      let value = d[key];
      if (value == null || value === "") return null;
      if (key === "age_years") value = `${value}岁`;
      if (key === "record_type") value = value === "pet" ? "宠物" : value === "person" ? "逝者" : "待确认";
      return { key, label, value };
    })
    .filter(Boolean);
}

function updateLampDetail(d) {
  const panel = document.querySelector("#lamp-detail-panel");
  if (!panel) return;
  const rows = detailRows(d);
  const link = d.detail_url
    ? `<a href="${escapeHtml(d.detail_url)}" target="_blank" rel="noreferrer">打开原始卡片</a>`
    : "";
  panel.innerHTML = `
    <h3>${escapeHtml(displayTitle(d))}</h3>
    <p class="lamp-detail-panel__notice">资料不完整或有誤：以下仅为公开页面中已有的重点信息。</p>
    <dl>
      ${rows.map((row) => `<dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd>`).join("")}
    </dl>
    ${link}
  `;
}

function updateSoundDetail(d) {
  const panel = document.querySelector("#sound-detail-panel");
  if (!panel) return;
  const residentLabel = isResidentMessage(d) ? " · 自述住户/家属" : "";
  panel.innerHTML = `
    <h3>${escapeHtml(d.author || "匿名留言")}</h3>
    <p>完整留言已在鼠标旁弹窗显示；移动到另一条声纹即可切换。</p>
    <small>${escapeHtml(d.date_iso)} · ${escapeHtml(d.char_count)}字 · 来源页 ${escapeHtml(d.source_page)}${residentLabel}</small>
  `;
}

function soundTooltipHtml(d) {
  const residentLabel = isResidentMessage(d) ? " · 自述住户/家属" : "";
  return `
    <h3>${escapeHtml(d.author || "匿名留言")}</h3>
    <p class="viz-tooltip__body">${escapeHtml(d.message_text || "")}</p>
    <small>${escapeHtml(d.date_iso)} · ${escapeHtml(d.char_count)}字 · 来源页 ${escapeHtml(d.source_page)}${residentLabel}</small>
  `;
}

function mountSoundwall(messages) {
  const container = document.querySelector("#soundwall-chart");
  if (!container) return;
  container.replaceChildren();
  const tip = tooltipFor(container);

  const sorted = [...messages].sort((a, b) => d3.descending(a.date_iso, b.date_iso));
  const width = 920;
  const height = 720;
  const margin = { top: 34, right: 28, bottom: 28, left: 96 };
  const rowHeight = (height - margin.top - margin.bottom) / sorted.length;
  const maxChars = d3.max(sorted, (d) => toNumber(d.char_count)) || 1;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img");

  const xScale = d3.scaleLinear().domain([0, maxChars]).range([90, width - margin.left - margin.right]);
  const color = d3
    .scaleLinear()
    .domain([0, maxChars * 0.55, maxChars])
    .range(["#6f2b1d", vizPalette.emberSoft, "#fff0df"]);

  const dateGroups = d3.groups(sorted, (d) => d.date_iso);
  const dateY = new Map();
  let cursor = margin.top;
  dateGroups.forEach(([date, group]) => {
    dateY.set(date, cursor + (group.length * rowHeight) / 2);
    cursor += group.length * rowHeight;
  });

  const dateLabels = dateGroups.filter(([, group], index) => group.length >= 4 || index % 5 === 0);

  svg
    .append("g")
    .selectAll("text")
    .data(dateLabels)
    .join("text")
    .attr("class", "sound-date-label")
    .attr("x", 18)
    .attr("y", ([date]) => dateY.get(date))
    .attr("dy", "0.35em")
    .text(([date]) => date.slice(5));

  const rows = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .selectAll("g")
    .data(sorted)
    .join("g")
    .attr("class", "sound-row")
    .attr("transform", (_, i) => `translate(0, ${i * rowHeight})`);

  rows
    .append("path")
    .attr("class", "sound-wave")
    .attr("d", (d, i) => {
      const length = xScale(toNumber(d.char_count));
      const amp = 0.5 + toNumber(d.waveform_amplitude_hint, 0.5) * 1.8;
      const density = 0.5 + toNumber(d.waveform_density_hint, 0.2) * 1.1;
      return makeWavePath(length, amp, density, i * 0.57);
    })
    .attr("stroke", (d) => (isResidentMessage(d) ? "#8cc8e8" : color(toNumber(d.char_count))))
    .attr("stroke-width", (d) => 0.45 + toNumber(d.waveform_amplitude_hint, 0.5) * 0.85)
    .attr("opacity", (d) => 0.32 + toNumber(d.waveform_amplitude_hint, 0.5) * 0.46);

  rows
    .append("line")
    .attr("x1", 0)
    .attr("x2", width - margin.left - margin.right)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", "rgba(247, 238, 232, 0.035)");

  let activeNode = null;
  rows
    .on("mouseenter", function onEnter(event, d) {
      d3.select(this).classed("is-active", true);
      updateSoundDetail(d);
      tip.classList.add("viz-tooltip--full");
      tip.innerHTML = soundTooltipHtml(d);
      tip.classList.add("is-visible");
      placeTooltip(container, tip, event);
    })
    .on("mousemove", (event) => placeTooltip(container, tip, event))
    .on("mouseleave", function onLeave() {
      if (this !== activeNode) d3.select(this).classed("is-active", false);
      if (!activeNode) {
        tip.classList.remove("is-visible");
        clearTooltipMode(tip);
      }
    })
    .on("click", function onClick(event, d) {
      if (activeNode && activeNode !== this) d3.select(activeNode).classed("is-active", false);
      activeNode = activeNode === this ? null : this;
      d3.select(this).classed("is-active", Boolean(activeNode));
      updateSoundDetail(d);
      tip.classList.add("viz-tooltip--full", "is-visible");
      tip.innerHTML = soundTooltipHtml(d);
      placeTooltip(container, tip, event);
    });
}

function lampFill(d) {
  const colors = {
    pet_warm: "#ffb56b",
    elder_soft: "#ffe0a8",
    warm_white: "#fff2df",
    amber_white: "#ffd0a0",
    neutral_white: "#f7eee8",
  };
  return colors[d.color_group] || "#f7eee8";
}

function mountLampwall(souls) {
  const container = document.querySelector("#lampwall-chart");
  if (!container) return;
  container.replaceChildren();
  const tip = tooltipFor(container);

  const { memorialSouls, excludedPlaceholders, pets } = splitSoulRecords(souls);
  const cols = 16;
  const cell = 42;
  const sectionGap = 36;
  const margin = { top: 68, right: 36, bottom: 42, left: 36 };
  const peopleRows = Math.ceil(memorialSouls.length / cols);
  const petRows = Math.max(1, Math.ceil(pets.length / cols));
  const width = margin.left + margin.right + cols * cell;
  const height = Math.max(620, margin.top + margin.bottom + peopleRows * cell + sectionGap + petRows * cell);

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img");

  const drawSection = (records, label, note, yOffset) => {
    svg
      .append("text")
      .attr("class", "lamp-section-label")
      .attr("x", margin.left)
      .attr("y", yOffset - 28)
      .text(label);

    svg
      .append("text")
      .attr("class", "lamp-section-note")
      .attr("x", margin.left + 94)
      .attr("y", yOffset - 28)
      .text(note);

    svg
      .append("line")
      .attr("class", "lamp-divider")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", yOffset - 14)
      .attr("y2", yOffset - 14);

    return svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${yOffset})`)
      .selectAll("g")
      .data(records)
      .join("g")
      .attr("class", "lamp")
      .attr("transform", (_, i) => `translate(${(i % cols) * cell}, ${Math.floor(i / cols) * cell})`);
  };

  const populateLamps = (selection) => {
    selection
      .append("circle")
      .attr("class", "lamp-hit-area")
      .attr("cx", 20.5)
      .attr("cy", 20.5)
      .attr("r", 17);

    selection
      .filter((d) => d.record_type !== "pet")
      .append("rect")
      .attr("class", "lamp-bg-window")
      .attr("x", 5)
      .attr("y", 5)
      .attr("width", 31)
      .attr("height", 31)
      .attr("rx", 5);

    selection
      .append("circle")
      .attr("cx", 20.5)
      .attr("cy", 20.5)
      .attr("r", (d) => (d.record_type === "pet" ? 7.8 : 4.8 + toNumber(d.brightness_score, 0.4) * 5.2))
      .attr("fill", lampFill)
      .attr("opacity", (d) => (d.record_type === "pet" ? 0.92 : 0.28 + toNumber(d.brightness_score, 0.4) * 0.62))
      .attr("filter", "url(#lampGlow)");

    selection
      .append("circle")
      .attr("class", "lamp-core")
      .attr("cx", 20.5)
      .attr("cy", 20.5)
      .attr("r", (d) => (d.record_type === "pet" ? 3 : 2.4))
      .attr("fill", "#fff9ea")
      .attr("opacity", (d) => (d.record_type === "pet" ? 0.82 : 0.44 + toNumber(d.brightness_score, 0.4) * 0.5));
  };

  const memorialGroups = drawSection(
    memorialSouls,
    "逝者",
    `${memorialSouls.length}盏灯 · 另有 ${excludedPlaceholders.length} 笔低资讯佔位未纳入`,
    margin.top,
  );
  const petGroups = drawSection(
    pets,
    "宠物",
    `${pets.length}盏灯 · 当前公开卡片记录，数量可能不完整`,
    margin.top + peopleRows * cell + sectionGap,
  ).classed("lamp--pet", true);
  const allGroups = d3.selectAll([...memorialGroups.nodes(), ...petGroups.nodes()]);

  const defs = svg.append("defs");
  const filter = defs
    .append("filter")
    .attr("id", "lampGlow")
    .attr("x", "-80%")
    .attr("y", "-80%")
    .attr("width", "260%")
    .attr("height", "260%");
  filter.append("feGaussianBlur").attr("stdDeviation", "3.2").attr("result", "blur");
  const merge = filter.append("feMerge");
  merge.append("feMergeNode").attr("in", "blur");
  merge.append("feMergeNode").attr("in", "SourceGraphic");

  populateLamps(memorialGroups);
  populateLamps(petGroups);

  let activeNode = null;
  allGroups
    .on("mouseenter", function onEnter(event, d) {
      d3.select(this).classed("is-active", true);
      clearTooltipMode(tip);
      tip.innerHTML = `<h3>${escapeHtml(displayTitle(d))}</h3><p>${escapeHtml(d.location_label || d.block_group || "位置待补充")}</p><small>${escapeHtml(d.soul_id)} · ${escapeHtml(publicInfoLabel(d))}</small>`;
      tip.classList.add("is-visible");
      placeTooltip(container, tip, event);
    })
    .on("mousemove", (event) => placeTooltip(container, tip, event))
    .on("mouseleave", function onLeave() {
      if (this !== activeNode) d3.select(this).classed("is-active", false);
      if (!activeNode) tip.classList.remove("is-visible");
    })
    .on("click", function onClick(event, d) {
      if (activeNode && activeNode !== this) d3.select(activeNode).classed("is-active", false);
      activeNode = this;
      d3.select(this).classed("is-active", true);
      clearTooltipMode(tip);
      tip.classList.remove("is-visible");
      updateLampDetail(d);
    });

  const legend = document.createElement("div");
  legend.className = "lamp-legend";
  legend.innerHTML = `
    <span><i style="color:#fff2df;background:#fff2df"></i>已知称谓</span>
    <span><i style="color:#ffd0a0;background:#ffd0a0"></i>资料较完整</span>
    <span><i style="color:#ffb56b;background:#ffb56b"></i>宠物卡片</span>
    <span><i style="color:#f7eee8;background:#f7eee8;opacity:.45"></i>待补充资料</span>
  `;
  container.parentElement.append(legend);
}

async function mountMemorialVisuals() {
  const [messages, souls] = await Promise.all([d3.csv(MESSAGE_CSV), d3.csv(SOUL_CSV)]);
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };

  setText("#hero-message-count", messages.length);
  setText("#hero-soul-count", souls.length);
  setText("#sound-total", messages.length);
  const { memorialSouls, pets } = splitSoulRecords(souls);
  setText("#lamp-total", memorialSouls.length);
  setText("#sound-date-range", formatDateRange(messages));
  setText("#sound-resident-count", messages.filter(isResidentMessage).length);
  setText("#lamp-known", memorialSouls.filter((d) => d.name_status === "known").length);
  setText("#pet-total", pets.length);

  mountSoundwall(messages);
  mountLampwall(souls);
}

mountMemorialVisuals().catch((error) => {
  console.error(error);
  document.querySelectorAll(".soundwall-chart, .lampwall-chart").forEach((el) => {
    el.innerHTML = '<p style="padding:24px;color:#f7eee8">数据读取失败，请确认本地服务器正在运行。</p>';
  });
});
