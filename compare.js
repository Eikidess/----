(function () {
    "use strict";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    const lyceum = window.lyceumData;
    const ukraine = Array.isArray(window.surnamesData) ? window.surnamesData : [];

    if (!lyceum || ukraine.length === 0) {
        $("#compareRoot").innerHTML = '<section class="story-block"><p>Не вдалося завантажити дані для порівняння.</p></section>';
        return;
    }

    const CATEGORIES = [
        { id: "names", label: "Від особових імен", color: "var(--c-names)" },
        { id: "professions", label: "Від занять і професій", color: "var(--c-prof)" },
        { id: "nicknames", label: "Від прізвиськ і рис", color: "var(--c-nick)" },
        { id: "place", label: "Від місцевості та етносу", color: "var(--c-place)" }
    ];
    const FOREIGN = { id: "foreign", label: "Іншомовні", color: "var(--c-foreign)" };

    const TYPE_TO_CATEGORY = {
        "Патронімічне прізвище": "names",
        "Антропонімічне прізвище": "names",
        "Професійне прізвище": "professions",
        "Прізвище-характеристика": "nicknames",
        "Апелятивне прізвище": "nicknames",
        "Мікроетнонімічне прізвище": "place",
        "Етнонімічне прізвище": "place"
    };

    const SUFFIX_GROUPS = [
        { id: "enko", label: "-енко", color: "var(--c-names)" },
        { id: "uk", label: "-ук / -чук / -юк", color: "var(--c-prof)" },
        { id: "sky", label: "-ський / -цький", color: "var(--c-nick)" },
        { id: "other", label: "Інші та без суфікса", color: "var(--c-foreign)" }
    ];

    const LABEL_LYCEUM = "Ліцей";
    const LABEL_UA_COUNT = "Україна, за прізвищами";
    const LABEL_UA_WEIGHT = "Україна, за носіями";

    function toNumber(countText) {
        return parseInt(String(countText).replace(/\D/g, ""), 10) || 0;
    }

    function formatPercent(fraction) {
        return (fraction * 100).toFixed(1).replace(".", ",");
    }

    function formatNumber(value) {
        return value.toLocaleString("uk-UA");
    }

    /* ---------- обчислення ---------- */

    const classes = lyceum.classes;
    const lyceumByCategory = {};
    CATEGORIES.forEach((category) => {
        lyceumByCategory[category.id] = classes.reduce((sum, item) => sum + item.groups[category.id].length, 0);
    });
    const lyceumUkrainian = CATEGORIES.reduce((sum, category) => sum + lyceumByCategory[category.id], 0);
    const lyceumRows = classes.reduce((sum, item) => sum + item.rows, 0);
    const lyceumForeign = lyceumRows - lyceumUkrainian;

    const ukraineByCategory = {};
    const ukraineWeighted = {};
    CATEGORIES.forEach((category) => {
        ukraineByCategory[category.id] = 0;
        ukraineWeighted[category.id] = 0;
    });
    let ukraineCarriers = 0;
    ukraine.forEach((item) => {
        const categoryId = TYPE_TO_CATEGORY[item.type];
        if (!categoryId) {
            return;
        }
        const carriers = toNumber(item.count);
        ukraineByCategory[categoryId] += 1;
        ukraineWeighted[categoryId] += carriers;
        ukraineCarriers += carriers;
    });

    const ukraineIndex = new Map();
    ukraine
        .map((item) => ({ name: item.surname, count: toNumber(item.count) }))
        .sort((a, b) => b.count - a.count)
        .forEach((item, i) => ukraineIndex.set(item.name.toLowerCase(), { rank: i + 1, count: item.count }));

    const matches = [];
    classes.forEach((classItem) => {
        CATEGORIES.forEach((category) => {
            classItem.groups[category.id].forEach((name) => {
                const found = ukraineIndex.get(name.toLowerCase());
                if (found) {
                    matches.push({ name, className: classItem.id, category, rank: found.rank, count: found.count });
                }
            });
        });
    });
    matches.sort((a, b) => a.rank - b.rank);

    function suffixOfName(name) {
        const lower = name.toLowerCase();
        if (/[еє]нко$/.test(lower)) {
            return "enko";
        }
        if (/(чук|юк|ук)$/.test(lower)) {
            return "uk";
        }
        if (/(ський|цький|ська|цька)$/.test(lower)) {
            return "sky";
        }
        return "other";
    }

    function suffixOfUkraine(item) {
        if (item.suffix === "-енко") {
            return "enko";
        }
        if (["-ук", "-чук", "-юк"].includes(item.suffix)) {
            return "uk";
        }
        if (["-ський", "-цький"].includes(item.suffix)) {
            return "sky";
        }
        return "other";
    }

    const lyceumSuffix = { enko: 0, uk: 0, sky: 0, other: 0 };
    classes.forEach((classItem) => {
        CATEGORIES.forEach((category) => {
            classItem.groups[category.id].forEach((name) => {
                lyceumSuffix[suffixOfName(name)] += 1;
            });
        });
    });
    const ukraineSuffix = { enko: 0, uk: 0, sky: 0, other: 0 };
    const ukraineSuffixWeighted = { enko: 0, uk: 0, sky: 0, other: 0 };
    ukraine.forEach((item) => {
        const id = suffixOfUkraine(item);
        ukraineSuffix[id] += 1;
        ukraineSuffixWeighted[id] += toNumber(item.count);
    });

    /* ---------- спільні елементи ---------- */

    function renderBarRows(rows) {
        return rows.map((row) => `
            <div class="bar-row">
                <div class="bar-label">${row.label}</div>
                ${row.lines.map((line) => `
                    <div class="bar-line" title="${line.title}">
                        <span class="bar-tag">${line.tag}</span>
                        <div class="bar-track"><div class="bar" style="--w:${(line.fraction * 100).toFixed(2)}%;--bar-color:${line.color}"></div></div>
                        <span class="bar-val">${formatPercent(line.fraction)}%</span>
                    </div>`).join("")}
            </div>`).join("");
    }

    function renderStaticLegend(host, items) {
        host.innerHTML = items
            .map((item) => `<span class="legend-item" style="--swatch:${item.color}"><i></i>${item.label}</span>`)
            .join("");
    }

    /* ---------- KPI ---------- */

    function initKpis() {
        const items = [
            { value: lyceumRows, decimals: 0, label: "прізвищ ліцеїстів у таблицях (4 класи)" },
            { value: (lyceumUkrainian / lyceumRows) * 100, decimals: 1, suffix: "%", label: `мають українське походження (${lyceumUkrainian})` },
            { value: (lyceumForeign / lyceumRows) * 100, decimals: 1, suffix: "%", label: `іншомовні (${lyceumForeign})` },
            { value: matches.length, decimals: 0, label: "українських прізвищ ліцею входять до топ-100 України" }
        ];
        const host = $("#kpis");
        host.innerHTML = items.map((item, i) => `
            <div class="kpi">
                <div class="kpi-value" data-i="${i}">0</div>
                <div class="kpi-label">${item.label}</div>
            </div>`).join("");

        host.kpiItems = items;
    }

    function animateKpis() {
        const host = $("#kpis");
        host.kpiItems.forEach((item, i) => {
            const element = $(`.kpi-value[data-i="${i}"]`, host);
            const duration = 1100;
            const start = performance.now();
            function frame(now) {
                const progress = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = item.value * eased;
                element.textContent = current.toFixed(item.decimals).replace(".", ",") + (item.suffix || "");
                if (progress < 1) {
                    requestAnimationFrame(frame);
                }
            }
            requestAnimationFrame(frame);
        });
    }

    /* ---------- діаграма 1: за походженням ---------- */

    function initCategoryChart() {
        renderStaticLegend($("#catLegend"), [
            { label: LABEL_LYCEUM, color: "var(--c-ly)" },
            { label: LABEL_UA_COUNT, color: "var(--c-ua)" },
            { label: LABEL_UA_WEIGHT, color: "var(--c-ua2)" }
        ]);

        const rows = CATEGORIES.map((category) => ({
            label: category.label,
            lines: [
                {
                    tag: LABEL_LYCEUM,
                    color: "var(--c-ly)",
                    fraction: lyceumByCategory[category.id] / lyceumUkrainian,
                    title: `${lyceumByCategory[category.id]} із ${lyceumUkrainian} українських прізвищ ліцею`
                },
                {
                    tag: LABEL_UA_COUNT,
                    color: "var(--c-ua)",
                    fraction: ukraineByCategory[category.id] / ukraine.length,
                    title: `${ukraineByCategory[category.id]} із ${ukraine.length} прізвищ топ-100`
                },
                {
                    tag: LABEL_UA_WEIGHT,
                    color: "var(--c-ua2)",
                    fraction: ukraineWeighted[category.id] / ukraineCarriers,
                    title: `${formatNumber(ukraineWeighted[category.id])} із ${formatNumber(ukraineCarriers)} носіїв`
                }
            ]
        }));
        $("#catChart").innerHTML = renderBarRows(rows);
    }

    /* ---------- діаграма 2: клас за класом ---------- */

    function initStackChart() {
        const legendHost = $("#stackLegend");
        const chart = $("#stackChart");
        const panel = $("#namesPanel");
        const allCategories = CATEGORIES.concat([FOREIGN]);
        let dimmed = null;

        legendHost.innerHTML = allCategories
            .map((category) => `<button type="button" class="legend-item" data-cat="${category.id}" style="--swatch:${category.color}"><i></i>${category.label}</button>`)
            .join("");

        chart.innerHTML = classes.map((classItem) => {
            const ukrainianCount = CATEGORIES.reduce((sum, category) => sum + classItem.groups[category.id].length, 0);
            const foreignCount = classItem.rows - ukrainianCount;
            const segments = CATEGORIES
                .map((category) => ({ category, count: classItem.groups[category.id].length }))
                .concat([{ category: FOREIGN, count: foreignCount }])
                .filter((segment) => segment.count > 0);

            return `
                <div class="stack-row">
                    <span class="stack-name">${classItem.id}</span>
                    <div class="stack-bar">
                        ${segments.map((segment) => `
                            <button type="button" class="seg" data-class="${classItem.id}" data-cat="${segment.category.id}"
                                style="--w:${((segment.count / classItem.rows) * 100).toFixed(2)}%;--swatch:${segment.category.color}"
                                title="${segment.category.label}: ${segment.count}">${segment.count}</button>`).join("")}
                    </div>
                    <span class="stack-total">${classItem.rows}</span>
                </div>`;
        }).join("");

        function applyDim() {
            $$(".stack-bar", chart).forEach((bar) => {
                allCategories.forEach((category) => bar.classList.toggle(`dim-${category.id}`, dimmed === category.id));
            });
            $$(".legend-item", legendHost).forEach((item) => item.classList.toggle("off", dimmed !== null && item.dataset.cat !== dimmed));
        }

        legendHost.addEventListener("click", (event) => {
            const item = event.target.closest(".legend-item");
            if (item) {
                dimmed = dimmed === item.dataset.cat ? null : item.dataset.cat;
                applyDim();
            }
        });

        chart.addEventListener("click", (event) => {
            const segment = event.target.closest(".seg");
            if (!segment) {
                return;
            }
            const classItem = classes.find((item) => item.id === segment.dataset.class);
            const categoryId = segment.dataset.cat;

            if (categoryId === FOREIGN.id) {
                const ukrainianCount = CATEGORIES.reduce((sum, category) => sum + classItem.groups[category.id].length, 0);
                panel.innerHTML = `
                    <h3>${classItem.id} · ${FOREIGN.label}</h3>
                    <p>${classItem.rows - ukrainianCount} прізвищ мають неукраїнське походження. Приклади з таблиць курсової: ${lyceum.foreignExamples.join(", ")}.</p>`;
                return;
            }

            const category = CATEGORIES.find((item) => item.id === categoryId);
            const names = classItem.groups[categoryId];
            panel.innerHTML = `
                <h3>${classItem.id} · ${category.label} (${names.length})</h3>
                <div class="pill-list">
                    ${names.map((name) => {
                        const found = ukraineIndex.get(name.toLowerCase());
                        return `<span class="pill">${name}${found ? ` <small>· №${found.rank} в Україні</small>` : ""}</span>`;
                    }).join("")}
                </div>`;
        });
    }

    /* ---------- діаграма 3: українське чи іншомовне ---------- */

    function initDonut() {
        const share = lyceumUkrainian / lyceumRows;
        const ukrainianPercent = share * 100;
        const host = $("#donutWrap");

        host.innerHTML = `
            <svg class="donut" viewBox="-1 -1 38 38" role="img" aria-label="Українські й іншомовні прізвища ліцею">
                <circle class="donut-bg" cx="18" cy="18" r="15.9155"></circle>
                <circle id="donutForeign" cx="18" cy="18" r="15.9155" stroke="var(--c-foreign)" stroke-dasharray="0 100" transform="rotate(-90 18 18)"></circle>
                <circle id="donutUkr" cx="18" cy="18" r="15.9155" stroke="var(--c-ly)" stroke-dasharray="0 100" transform="rotate(-90 18 18)"></circle>
                <text class="donut-text" x="18" y="19.5">${ukrainianPercent.toFixed(0)}%</text>
                <text class="donut-sub" x="18" y="24">українських</text>
            </svg>
            <div>
                <div class="legend">
                    <span class="legend-item" style="--swatch:var(--c-ly)"><i></i>Українського походження: ${lyceumUkrainian}</span>
                    <span class="legend-item" style="--swatch:var(--c-foreign)"><i></i>Іншомовні: ${lyceumForeign}</span>
                </div>
                <div class="pill-list">
                    ${classes.map((item) => {
                        const ukrainianCount = CATEGORIES.reduce((sum, category) => sum + item.groups[category.id].length, 0);
                        return `<span class="pill">${item.id}: ${ukrainianCount} із ${item.rows} <small>(${formatPercent(ukrainianCount / item.rows)}%)</small></span>`;
                    }).join("")}
                </div>
            </div>`;

        host.donut = { ukrainianPercent };
    }

    function animateDonut() {
        const host = $("#donutWrap");
        const ukrainianPercent = host.donut.ukrainianPercent;
        const foreignPercent = 100 - ukrainianPercent;
        const ukr = $("#donutUkr");
        const foreign = $("#donutForeign");

        ukr.style.strokeDasharray = `${ukrainianPercent} ${100 - ukrainianPercent}`;
        foreign.style.strokeDasharray = `${foreignPercent} ${100 - foreignPercent}`;
        foreign.style.strokeDashoffset = `-${ukrainianPercent}`;
    }

    /* ---------- діаграма 4: суфікси ---------- */

    function initSuffixChart() {
        renderStaticLegend($("#sufLegend"), [
            { label: LABEL_LYCEUM, color: "var(--c-ly)" },
            { label: LABEL_UA_COUNT, color: "var(--c-ua)" },
            { label: LABEL_UA_WEIGHT, color: "var(--c-ua2)" }
        ]);

        const lyceumTotal = Object.values(lyceumSuffix).reduce((sum, value) => sum + value, 0);
        const ukraineTotal = Object.values(ukraineSuffix).reduce((sum, value) => sum + value, 0);
        const weightedTotal = Object.values(ukraineSuffixWeighted).reduce((sum, value) => sum + value, 0);

        const rows = SUFFIX_GROUPS.map((group) => ({
            label: group.label,
            lines: [
                { tag: LABEL_LYCEUM, color: "var(--c-ly)", fraction: lyceumSuffix[group.id] / lyceumTotal, title: `${lyceumSuffix[group.id]} із ${lyceumTotal}` },
                { tag: LABEL_UA_COUNT, color: "var(--c-ua)", fraction: ukraineSuffix[group.id] / ukraineTotal, title: `${ukraineSuffix[group.id]} із ${ukraineTotal}` },
                { tag: LABEL_UA_WEIGHT, color: "var(--c-ua2)", fraction: ukraineSuffixWeighted[group.id] / weightedTotal, title: `${formatNumber(ukraineSuffixWeighted[group.id])} із ${formatNumber(weightedTotal)} носіїв` }
            ]
        }));
        $("#sufChart").innerHTML = renderBarRows(rows);
    }

    /* ---------- збіги ---------- */

    function initMatches() {
        const share = matches.length / lyceumUkrainian;
        $("#matchLead").textContent =
            `${matches.length} із ${lyceumUkrainian} українських прізвищ ліцеїстів (${formatPercent(share)}%) входять до сотні найпоширеніших прізвищ України. Біля кожного — клас, місце в рейтингу та кількість носіїв.`;

        $("#matchCloud").innerHTML = matches.map((match, i) => `
            <div class="match" style="animation-delay:${i * 0.04}s">
                <b>${match.name}</b>
                <small>${match.className} · №${match.rank} · ${formatNumber(match.count)}</small>
            </div>`).join("");
    }

    /* ---------- поява та анімації ---------- */

    function initScrollEffects() {
        const reveals = $$(".reveal");
        const charts = $$(".chart");

        function trigger(element) {
            element.classList.add("in");
            if (element.id === "kpis") {
                animateKpis();
            }
            if (element.id === "donutWrap") {
                animateDonut();
            }
        }

        if (!("IntersectionObserver" in window)) {
            reveals.forEach((element) => element.classList.add("in"));
            charts.forEach(trigger);
            return;
        }

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in");
                }
            });
        }, { threshold: 0.06 });
        reveals.forEach((element) => revealObserver.observe(element));

        const chartObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    trigger(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.25 });
        charts.forEach((element) => chartObserver.observe(element));
    }

    initKpis();
    initCategoryChart();
    initStackChart();
    initDonut();
    initSuffixChart();
    initMatches();
    initScrollEffects();
})();
