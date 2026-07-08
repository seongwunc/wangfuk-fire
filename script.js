const fatalityData = [
  { label: "居民", value: 150, color: "#ff5c38" },
  { label: "外佣", value: 9, color: "#ff8751" },
  { label: "装修/建筑工人", value: 7, color: "#ffb078" },
  { label: "消防员", value: 1, color: "#ffd1a9" },
  { label: "访客", value: 1, color: "#fff0df" },
];

const ageData = [
  { label: "18岁以下", value: 7 },
  { label: "18–64岁", value: 47 },
  { label: "65岁以上", value: 114 },
];

const timelineData = [
  { time: "14:42-14:45", title: "工人发现起火", text: "聆讯材料显示，工人已在这一时段注意到低层外墙平台起火。", state: "spark" },
  { time: "14:50", title: "有人拨打999", text: "现场有人报警，但楼内住户并没有获得同步的系统预警。", state: "spark" },
  { time: "14:55", title: "宏昌阁楼梯与走廊进烟", text: "独立委员会指宏昌阁的内部条件在此时已开始急剧恶化。", state: "spread" },
  { time: "14:56", title: "火沿光井和外墙急速上窜", text: "起火点不再局限于低层，垂直外墙通道把火势迅速抬升。", state: "spread" },
  { time: "15:01", title: "首批消防车到场", text: "消防车约在14:56至15:01之间陆续抵达。", state: "response" },
  { time: "15:02", title: "升为三级火", text: "事态发展远超一般建筑火警。", state: "response" },
  { time: "15:14后", title: "宏泰阁楼梯与走廊进烟", text: "烟气已经扩散到相邻楼座的内部逃生通道。", state: "spread" },
  { time: "15:34", title: "升为四级火", text: "火势继续跨楼扩大，灭火与搜救同步承压。", state: "response" },
  { time: "16:04", title: "7座楼已起火", text: "8座楼中已有7座起火，单点事故已演变为群楼灾难。", state: "catastrophe" },
  { time: "18:22", title: "升为五级火", text: "这是香港自2008年以来首宗五级大火。", state: "catastrophe" },
  { time: "22:30", title: "现场投入989名消防员", text: "174辆消防车、47辆救护车已投入现场。", state: "catastrophe" },
];

const historyData = [
  { event: "2008 Cornwall Court", deaths: 4, note: "4" },
  { event: "1996 嘉利大厦大火", deaths: 41, note: "41" },
  { event: "1962 元州街大火", deaths: 44, note: "44" },
  { event: "2025 宏福苑大火 ★", deaths: 168, note: "168" },
  { event: "1948 永安仓大火", deaths: 176, note: "176" },
  { event: "1918 跑马地大火", deaths: 600, note: "600+" },
];

const palette = {
  background: "#070707",
  text: "#f7eee8",
  muted: "#cfb9ae",
  accent: "#ff5c38",
  accentSoft: "#ff8a5a",
  gold: "#f4ba79",
  bars: ["#ffb48c", "#ff8751", "#ff5c38"],
};

function mountStoryTimelineConnector() {
  const timeline = document.querySelector(".narrative-timeline--sketch");
  if (!timeline) return;

  timeline.querySelector(".timeline-connector-svg")?.remove();
  timeline.querySelector(".timeline-connector-layer")?.remove();

  const layer = document.createElement("div");
  layer.classList.add("timeline-connector-layer");
  layer.setAttribute("aria-hidden", "true");
  timeline.prepend(layer);

  const dots = [...timeline.querySelectorAll(".timeline-point__dot")];
  if (dots.length < 2) return;

  const draw = () => {
    layer.replaceChildren();
    const timelineBox = timeline.getBoundingClientRect();
    const points = dots.map((dot) => {
      const box = dot.getBoundingClientRect();
      return {
        x: box.left - timelineBox.left + box.width / 2,
        y: box.top - timelineBox.top + box.height / 2,
      };
    });
    const lastPoint = points.at(-1);
    if (lastPoint) {
      points.push({ x: lastPoint.x, y: lastPoint.y + 150 });
    }

    points.slice(0, -1).forEach((point, index) => {
      const next = points[index + 1];
      const dx = next.x - point.x;
      const dy = next.y - point.y;
      const length = Math.hypot(dx, dy);
      if (!length) return;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const segment = document.createElement("span");
      segment.className = "timeline-connector-segment";
      segment.style.left = `${point.x}px`;
      segment.style.top = `${point.y - 4}px`;
      segment.style.width = `${length}px`;
      segment.style.transform = `rotate(${angle}deg)`;
      layer.append(segment);
    });
  };

  requestAnimationFrame(draw);
  setTimeout(draw, 250);
  setTimeout(draw, 900);
  window.addEventListener("resize", draw);
  window.addEventListener("load", draw, { once: true });
}

function mountFatalityDonut() {
  const container = d3.select("#fatality-donut");
  const width = 520;
  const height = 360;
  const radius = Math.min(width, height) / 2 - 18;

  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const group = svg
    .append("g")
    .attr("transform", `translate(${width * 0.34}, ${height / 2})`);

  const pie = d3.pie().sort(null).value((d) => d.value);
  const arc = d3.arc().innerRadius(radius * 0.52).outerRadius(radius);
  const totalDeaths = d3.sum(fatalityData, (d) => d.value);
  const mutedFill = "#4b1d16";
  const defaultFill = (d) => d.data.color;

  const segments = group
    .selectAll("path")
    .data(pie(fatalityData))
    .join("path")
    .attr("fill", defaultFill)
    .attr("stroke", "#1b0908")
    .attr("stroke-width", 3)
    .attr("d", arc)
    .style("cursor", "pointer");

  group
    .append("text")
    .attr("class", "donut-value")
    .attr("text-anchor", "middle")
    .attr("fill", palette.text)
    .style("font-size", "34px")
    .style("font-weight", "900")
    .text("168");

  group
    .append("text")
    .attr("class", "donut-label")
    .attr("text-anchor", "middle")
    .attr("dy", 28)
    .attr("fill", palette.muted)
    .style("font-size", "13px")
    .text("最终确认死者");

  const legend = svg.append("g").attr("transform", "translate(330, 52)");

  const row = legend
    .selectAll("g")
    .data(fatalityData)
    .join("g")
    .attr("transform", (_, i) => `translate(0, ${i * 46})`);

  row
    .append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("rx", 4)
    .attr("fill", (d) => d.color);

  row
    .append("text")
    .attr("x", 20)
    .attr("y", 2)
    .attr("fill", palette.text)
    .style("font-size", "14px")
    .style("font-weight", "450")
    .text((d) => d.label);

  row
    .append("text")
    .attr("x", 20)
    .attr("y", 24)
    .attr("fill", palette.muted)
    .style("font-size", "12px")
    .text((d) => `${d.value}人 · ${((d.value / totalDeaths) * 100).toFixed(1)}%`);

  const centerValue = group.select(".donut-value");
  const centerLabel = group.select(".donut-label");
  let activeLabel = null;

  function setActive(label = null) {
    activeLabel = label;
    segments
      .interrupt()
      .transition()
      .duration(180)
      .attr("fill", (seg) => {
        if (!activeLabel) return seg.data.color;
        return seg.data.label === activeLabel ? seg.data.color : mutedFill;
      })
      .attr("opacity", (seg) => {
        if (!activeLabel) return 1;
        return seg.data.label === activeLabel ? 1 : 0.55;
      })
      .attr("transform", (seg) => {
        if (activeLabel && seg.data.label === activeLabel) {
          const [x, y] = arc.centroid(seg);
          return `translate(${x * 0.06}, ${y * 0.06})`;
        }
        return null;
      });
  }

  segments
    .on("mouseenter", function onMouseEnter(event, d) {
      const ratio = ((d.data.value / totalDeaths) * 100).toFixed(1);
      setActive(d.data.label);
      centerValue.text(`${ratio}%`);
      centerLabel.text(d.data.label);
    })
    .on("mouseleave", function onMouseLeave(event) {
      const nextTarget = event.relatedTarget;
      if (nextTarget && nextTarget.tagName === "path") return;
      setActive(null);
      centerValue.text("168");
      centerLabel.text("最终确认死者");
    });
}

function mountAgeBars() {
  const container = d3.select("#age-bars");
  const width = 480;
  const height = 360;
  const margin = { top: 30, right: 12, bottom: 54, left: 46 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
  const x = d3
    .scaleBand()
    .domain(ageData.map((d) => d.label))
    .range([0, innerWidth])
    .padding(0.36);
  const y = d3.scaleLinear().domain([0, 120]).range([innerHeight, 0]);

  g.append("g")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x))
    .call((axis) => axis.selectAll("text").attr("fill", palette.muted).style("font-size", "12px"))
    .call((axis) => axis.select(".domain").attr("stroke", "rgba(255,255,255,0.15)"));

  g.append("g")
    .call(d3.axisLeft(y).ticks(6))
    .call((axis) => axis.selectAll("text").attr("fill", palette.muted).style("font-size", "12px"))
    .call((axis) => axis.selectAll("line").attr("stroke", "rgba(255,255,255,0.08)"))
    .call((axis) => axis.select(".domain").remove());

  g.selectAll("rect")
    .data(ageData)
    .join("rect")
    .attr("x", (d) => x(d.label))
    .attr("y", (d) => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", (d) => innerHeight - y(d.value))
    .attr("rx", 16)
    .attr("fill", (_, i) => ["#ffb078", "#ff8751", "#ff5c38"][i]);

  g.selectAll(".age-label")
    .data(ageData)
    .join("text")
    .attr("class", "age-label")
    .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.value) - 10)
    .attr("text-anchor", "middle")
    .attr("fill", (_, i) => ["#ffb078", "#ff8751", "#ff5c38"][i])
    .style("font-size", "14px")
    .style("font-weight", "450")
    .text((d) => d.value);
}

function mountHistoryBars() {
  const container = d3.select("#history-bars");
  const width = 960;
  const height = 520;
  const margin = { top: 18, right: 42, bottom: 44, left: 230 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

  const x = d3.scaleLinear().domain([0, 620]).range([0, innerWidth]);
  const y = d3
    .scaleBand()
    .domain(historyData.map((d) => d.event))
    .range([0, innerHeight])
    .padding(0.5);

  g.append("g")
    .call(d3.axisLeft(y).tickSizeOuter(0))
    .call((axis) => axis.selectAll("text").attr("fill", "#fff4e7").style("font-size", "19px").style("font-weight", "450"))
    .call((axis) => axis.select(".domain").attr("stroke", "rgba(255,244,231,0.28)"))
    .call((axis) => axis.selectAll("line").remove());

  g.append("g")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x).ticks(5))
    .call((axis) => axis.selectAll("text").attr("fill", "rgba(255,244,231,0.82)").style("font-size", "18px"))
    .call((axis) => axis.selectAll("line").attr("stroke", "rgba(255,244,231,0.18)"))
    .call((axis) => axis.select(".domain").attr("stroke", "rgba(255,244,231,0.34)"));

  g.append("g")
    .call(d3.axisBottom(x).ticks(6).tickSize(innerHeight).tickFormat(""))
    .call((axis) => axis.selectAll("line").attr("stroke", "rgba(255,244,231,0.1)"))
    .call((axis) => axis.select(".domain").remove());

  g.selectAll("rect")
    .data(historyData)
    .join("rect")
    .attr("x", 0)
    .attr("y", (d) => y(d.event))
    .attr("width", (d) => x(d.deaths))
    .attr("height", y.bandwidth())
    .attr("rx", 0)
    .attr("fill", (d) => (d.event.includes("宏福苑") ? "#ff5c38" : "#d97758"));

  g.selectAll(".history-value")
    .data(historyData)
    .join("text")
    .attr("class", "history-value")
    .attr("x", (d) => x(d.deaths) + 10)
    .attr("y", (d) => y(d.event) + y.bandwidth() / 2 + 4)
    .attr("fill", palette.text)
    .attr("fill", (d) => (d.event.includes("宏福苑") ? "#ff5c38" : "#d97758"))
    .style("font-size", "13px")
    .style("font-weight", "450")
    .text((d) => d.note);
}

function initImpactTabs() {
  const tabs = Array.from(document.querySelectorAll(".impact-tabs__btn"));
  const panels = Array.from(document.querySelectorAll(".impact-panel"));

  tabs.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.target;
      tabs.forEach((tab) => tab.classList.toggle("is-active", tab === button));
      panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === target));
    });
  });
}

function initRevealOnScroll() {
  const selectors = [
    ".section",
    ".spread-factor-section",
    ".event-summary-section",
    ".spread-factor-card",
    ".timeline-panel__events",
    ".timeline-panel__image",
    ".metric-card",
    ".panel",
    ".damage-impact-module",
    ".story-photo",
    ".impact-layout",
    ".memorial-viz-card",
    ".history-panel",
    ".rarity-note-grid article",
    ".global-case",
    ".global-pattern-grid article",
    ".public-meaning-intro",
    ".meaning-track",
    ".closing-reflection",
    ".sources",
  ];
  const elements = Array.from(document.querySelectorAll(selectors.join(","))).filter(
    (element) => !element.closest(".hero") && !element.closest(".event-summary-section .event-photo-marquee"),
  );
  if (!elements.length) return;

  elements.forEach((element, index) => {
    element.classList.add("reveal-on-scroll");
    if (element.matches(".timeline-panel__events, .timeline-panel__image")) {
      element.classList.add("timeline-reveal");
    }
    element.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 70}ms`);
  });

  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((element) => element.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.12,
    },
  );

  elements.forEach((element) => observer.observe(element));
}

function init() {
  mountStoryTimelineConnector();
  mountFatalityDonut();
  mountAgeBars();
  mountHistoryBars();
  initImpactTabs();
  initRevealOnScroll();
}

init();
