(function () {
    "use strict";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    const surnames = Array.isArray(window.surnamesData) ? window.surnamesData : [];
    const REGION_NAMES = window.REGION_NAMES || {};

    function toNumber(countText) {
        return parseInt(String(countText).replace(/\D/g, ""), 10) || 0;
    }

    function formatNumber(value) {
        return value.toLocaleString("uk-UA");
    }

    function formatPercent(fraction) {
        return (fraction * 100).toFixed(1).replace(".", ",");
    }

    /* Універсальні «вкладки»: ряд кнопок і панель, що змінюється при виборі. */
    function makeTabs(host, tabs, renderPanel) {
        host.innerHTML = '<div class="chips" role="tablist"></div><div class="tab-panel" aria-live="polite"></div>';
        const bar = host.firstElementChild;
        const panel = host.lastElementChild;

        bar.innerHTML = tabs
            .map((tab) => `<button type="button" role="tab" class="chip" data-tab="${tab.id}">${tab.label}</button>`)
            .join("");

        function select(id) {
            $$(".chip", bar).forEach((button) => {
                const active = button.dataset.tab === id;
                button.classList.toggle("active", active);
                button.setAttribute("aria-selected", String(active));
            });
            panel.style.animation = "none";
            void panel.offsetWidth;
            panel.style.animation = "";
            panel.innerHTML = renderPanel(id);
        }

        bar.addEventListener("click", (event) => {
            const button = event.target.closest(".chip");
            if (button) {
                select(button.dataset.tab);
            }
        });

        select(tabs[0].id);
    }

    /* ---------- 1. Імена слов’ян ---------- */

    const NAME_GROUPS = [
        {
            title: "Одноосновні",
            hint: "від звичайних слів",
            intro: "Імена творили з рідної мови, вкладаючи в них побажання.",
            items: [
                ["Добриня", "«добрий»: щоб людина була лагідною й прихильною до людей"],
                ["Зоряна", "від слова «зоря»: світло, новий початок"],
                ["Богдан", "«даний Богом»"],
                ["Милан", "«милий»: той, хто викликає любов"],
                ["Людмила", "«та, що мила людям»"]
            ]
        },
        {
            title: "Магічні",
            hint: "імена-обереги",
            intro: "Давні слов’яни вірили в силу слова й давали імена, що мали «захищати» дитину.",
            items: [
                ["Вовк, Ведмідь", "щоб дитина мала силу й витривалість цих тварин"],
                ["Заєць, Ворон", "надія на спритність або хитрість"],
                ["Мороз", "щоб злий дух холоду «не чіпав» новонародженого"]
            ]
        },
        {
            title: "Двочленні",
            hint: "з двох основ",
            intro: "Такі імена вважалися шляхетними та величними.",
            items: [
                ["Володимир", "«той, хто володіє світом»"],
                ["Святослав", "«свята слава»"],
                ["Ярослав", "«ярий (сильний, палкий) + слава»"],
                ["Богуслав", "«слава Божа»"],
                ["Любомир", "«той, хто любить мир»"],
                ["Всеволод", "«володіє всім»"]
            ]
        }
    ];

    function initNameCards() {
        const host = $("#nameCards");
        host.innerHTML = NAME_GROUPS.map((group) => `
            <div class="flip-card" role="button" tabindex="0" aria-pressed="false">
                <div class="flip-inner">
                    <div class="flip-face flip-front">
                        <span class="flip-tag">${group.hint}</span>
                        <strong class="flip-title">${group.title} імена</strong>
                        <span class="flip-sample">${group.items[0][0]}</span>
                        <span class="flip-cta">Торкніться, щоб перевернути</span>
                    </div>
                    <div class="flip-face flip-back">
                        <span class="flip-intro">${group.intro}</span>
                        <ul class="flip-list">
                            ${group.items.map(([name, meaning]) => `<li><b>${name}</b> — ${meaning}</li>`).join("")}
                        </ul>
                    </div>
                </div>
            </div>`).join("");

        function flip(card) {
            const flipped = card.classList.toggle("flipped");
            card.setAttribute("aria-pressed", String(flipped));
        }

        host.addEventListener("click", (event) => {
            const card = event.target.closest(".flip-card");
            if (card) {
                flip(card);
            }
        });

        host.addEventListener("keydown", (event) => {
            const card = event.target.closest(".flip-card");
            if (card && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                flip(card);
            }
        });
    }

    const CHRISTIAN_NAMES = {
        greek: {
            label: "З грецької",
            items: [["Петро", "камінь"], ["Андрій", "мужній"], ["Георгій", "хлібороб"]]
        },
        latin: {
            label: "З латини",
            items: [["Валентин", "сильний, здоровий"], ["Марія", "бажана дитина"]]
        },
        hebrew: {
            label: "З єврейської",
            items: [["Іван", "Бог милостивий"], ["Анна", "благодать"], ["Михайло", "подібний до Бога"]]
        }
    };

    function initChristianNames() {
        const tabs = Object.entries(CHRISTIAN_NAMES).map(([id, value]) => ({ id, label: value.label }));
        makeTabs($("#christianTabs"), tabs, (id) => `
            <div class="pill-list">
                ${CHRISTIAN_NAMES[id].items.map(([name, meaning]) => `<span class="pill">${name} <small>— ${meaning}</small></span>`).join("")}
            </div>`);
    }

    function initNameToSurname() {
        const pairs = [
            ["Іван", "Іваненко, Іванчук, Іванюк"],
            ["Петро", "Петренко, Петрук"],
            ["Андрій", "Андрієнко, Андрейчук"],
            ["Володимир", "Володимиров, Володимиренко"]
        ];
        $("#nameToSurname").innerHTML = pairs
            .map(([name, surnameList]) => `<span class="pill">${name} → <small>${surnameList}</small></span>`)
            .join("");
    }

    /* ---------- 2. Від імені до прізвища ---------- */

    const STAGES = [
        {
            tick: "до XV ст.",
            title: "Лише ім’я",
            text: "У селах людей розрізняли за іменем. Але в одному селі легко траплялося два Івани — і виникала плутанина.",
            tags: [["Іван"], ["Іван"], ["Котрий із них?", "muted"]]
        },
        {
            tick: "XV ст.",
            title: "Ім’я та «позначка»",
            text: "Щоб відрізнити тезок, до імені додавали позначку: по батькові, ремесло чи місце. Це ще не спадкове прізвище: Іван Мельник — бо працює мельником, а його син міг стати Іванчуком — бо він син Івана.",
            tags: [["Іван Мельник"], ["Іван Петренко"], ["→", "arrow"], ["син: Іванчук"]]
        },
        {
            tick: "XVI ст.",
            title: "Прізвище закріплюється за родом",
            text: "Якщо кілька поколінь у родині були Мельниками, ім’я залишалося за всіма нащадками — навіть якщо вони вже не займалися цим ремеслом.",
            tags: [["Іван Мельник"], ["→", "arrow"], ["Петро Мельник"], ["→", "arrow"], ["Олекса Мельник"], ["уже не мельник", "muted"]]
        },
        {
            tick: "XVI–XVII ст.",
            title: "Закон і документи",
            text: "Українські прізвища стають спадковими й переходять у юридичні документи. Церковні книги фіксують по батькові, заняття чи місцевість як спадкове прізвище.",
            tags: [["церковна книга", "muted"], ["юридичний документ", "muted"], ["→", "arrow"], ["Мельник"]]
        }
    ];

    function initStages() {
        const range = $("#stageRange");
        const ticks = $("#stageTicks");
        const body = $("#stageBody");

        ticks.innerHTML = STAGES
            .map((stage, index) => `<button type="button" class="tick" data-i="${index}" style="--pos:${(index / (STAGES.length - 1)) * 100}%">${stage.tick}</button>`)
            .join("");

        function show(index) {
            const stage = STAGES[index];
            range.value = index;
            $$(".tick", ticks).forEach((tick, i) => tick.classList.toggle("active", i === index));
            body.innerHTML = `
                <h3>${stage.title}</h3>
                <p>${stage.text}</p>
                <div class="name-tags">
                    ${stage.tags.map(([text, kind], i) => kind === "arrow"
                        ? `<span class="name-arrow">${text}</span>`
                        : `<span class="name-tag ${kind || ""}" style="animation-delay:${i * 0.08}s">${text}</span>`).join("")}
                </div>`;
        }

        range.addEventListener("input", () => show(Number(range.value)));
        ticks.addEventListener("click", (event) => {
            const tick = event.target.closest(".tick");
            if (tick) {
                show(Number(tick.dataset.i));
            }
        });

        show(0);
    }

    function initReasons() {
        const reasons = {
            handy: ["Зручність", "За прізвищем можна було відрізнити кількох людей з однаковим ім’ям, наприклад двох Іванів в одному селі."],
            docs: ["Документи", "Розвиток державних і церковних документів потребував точнішої ідентифікації людини."],
            nobles: ["Приклад шляхти", "Шляхта першою закріплювала родові назви на честь маєтків чи земель: Острозькі, Збаразькі."],
            church: ["Церковні книги", "Церковні книги сприяли тому, що по батькові, заняття або місцевість почали фіксуватися як спадкові прізвища."]
        };
        makeTabs(
            $("#reasonTabs"),
            Object.entries(reasons).map(([id, value]) => ({ id, label: value[0] })),
            (id) => `<p>${reasons[id][1]}</p>`
        );
    }

    function initFirstSurnames() {
        const groups = {
            patronym: ["Від імені батька", "патроніми", ["Іваненко", "Петренко", "Михайленко", "Іванчук", "Петрук", "Грицюк", "Андрійчук", "Федорук"]],
            craft: ["Від професій", "ремесла", ["Коваль", "Гончар", "Швець", "Бондар", "Мельник"]],
            place: ["Від місцевостей", "топонімічні", ["Полтавець (той, що з Полтави)", "Луцький", "Київський", "Галицький"]],
            nick: ["Від прізвиськ", "риси й образи", ["Білий", "Чорний", "Кривий", "Довгий", "Ведмідь", "Лис", "Сокіл"]],
            noble: ["Шляхетські роди", "князівські й панські", ["Острозькі", "Збаразькі", "Сангушки", "Вишневецькі"]]
        };
        makeTabs(
            $("#firstTabs"),
            Object.entries(groups).map(([id, value]) => ({ id, label: value[0] })),
            (id) => `
                <p><b>${groups[id][0]}</b> <small>(${groups[id][1]})</small></p>
                <div class="pill-list">${groups[id][2].map((name) => `<span class="pill">${name}</span>`).join("")}</div>`
        );
    }

    /* ---------- 3. Конструктор прізвища ---------- */

    const SUFFIX_DEFS = [
        { id: "enko", label: "-енко", info: "Один із найпоширеніших суфіксів. Спочатку мав зменшувальне, пестливе значення й позначав дітей від імен батьків: Іваненко — «син Івана». Згодом втратив відтінок і став загальним засобом творення прізвищ." },
        { id: "uk", label: "-ук / -юк / -чук", info: "Поширені на західноукраїнських землях. Теж означали «дитина», «нащадок»: Петрук — син Петра, Гаврилюк — син Гаврила." },
        { id: "ov", label: "-ов", info: "Вказує на належність до особи чи роду. У XIX–XX століттях суфікси -ов, -ев, -ін також поширювалися через русифікацію." },
        { id: "ovych", label: "-ович / -евич", info: "Давні суфікси, що вживалися ще в княжі часи для позначення по батькові: Данилович — «син Данила». Зберегли книжний, урочистий характер." },
        { id: "sky", label: "-ський / -цький", info: "Часто походять від назв населених пунктів: Полтавський — із Полтави, Бродський — з міста Броди. Також типові для шляхетських прізвищ: Острозький, Збаразький." },
        { id: "iv", label: "-ів / -їв", info: "Вказують на належність до особи чи роду: Тимків — із роду Тимка, Михайлів — син Михайла." }
    ];

    const ROOTS = [
        { id: "ivan", label: "Іван", kind: "ім’я", note: "Особове ім’я, з єврейського «Бог милостивий».", combos: {
            enko: ["Іван", "енко", "син Івана"],
            uk: ["Іван", "чук", "нащадок Івана (є й варіант Іванюк)"],
            ov: ["Іван", "ов", "належить Іванові"],
            ovych: ["Іван", "ович", "син Івана"],
            sky: null,
            iv: ["Іван", "ів", "із роду Івана"]
        } },
        { id: "petro", label: "Петро", kind: "ім’я", note: "Особове ім’я, з грецької «камінь, скеля».", combos: {
            enko: ["Петр", "енко", "син Петра — класичне патронімічне прізвище"],
            uk: ["Петр", "ук", "нащадок Петра"],
            ov: ["Петр", "ов", "належить Петрові"],
            ovych: ["Петр", "ович", "син Петра"],
            sky: ["Петров", "ський", "прикметникова, «шляхетніша» форма"],
            iv: ["Петр", "ів", "із роду Петра"]
        } },
        { id: "shvets", label: "Швець", kind: "професія", note: "Майстер із виготовлення та ремонту взуття.", combos: {
            enko: ["Шевч", "енко", "нащадок шевця — одне з найвідоміших українських прізвищ"],
            uk: ["Шевч", "ук", "нащадок шевця"],
            ov: ["Швец", "ов", "належить шевцеві (форма за російською моделлю)"],
            ovych: null,
            sky: null,
            iv: null
        } },
        { id: "koval", label: "Коваль", kind: "професія", note: "Той, хто працює з металом.", combos: {
            enko: ["Ковал", "енко", "нащадок коваля"],
            uk: ["Коваль", "чук", "нащадок коваля"],
            ov: ["Коваль", "ов", "належить ковалеві"],
            ovych: ["Ковал", "евич", "син коваля"],
            sky: ["Коваль", "ський", "форма з польським суфіксом"],
            iv: ["Ковал", "ів", "із роду коваля"]
        } },
        { id: "poltava", label: "Полтава", kind: "місто", note: "Назва міста, з якого походила людина.", combos: {
            enko: ["Полтав", "ченко", "нащадок вихідця з Полтави"],
            uk: null,
            ov: null,
            ovych: null,
            sky: ["Полтав", "ський", "той, хто з Полтави"],
            iv: null
        } },
        { id: "havrylo", label: "Гаврило", kind: "ім’я", note: "Особове ім’я.", combos: {
            enko: ["Гаврил", "енко", "син Гаврила"],
            uk: ["Гаврил", "юк", "син Гаврила"],
            ov: ["Гаврил", "ов", "належить Гаврилові"],
            ovych: ["Гаврил", "ович", "син Гаврила"],
            sky: null,
            iv: ["Гаврил", "ів", "із роду Гаврила"]
        } }
    ];

    function initBuilder() {
        const state = { root: ROOTS[0].id, suffix: SUFFIX_DEFS[0].id };
        const rootChips = $("#rootChips");
        const suffixChips = $("#suffixChips");
        const formula = $("#formula");
        const suffixInfo = $("#suffixInfo");

        rootChips.innerHTML = ROOTS
            .map((root) => `<button type="button" class="chip" data-id="${root.id}">${root.label} <small>(${root.kind})</small></button>`)
            .join("");
        suffixChips.innerHTML = SUFFIX_DEFS
            .map((suffix) => `<button type="button" class="chip" data-id="${suffix.id}">${suffix.label}</button>`)
            .join("");

        function render() {
            const root = ROOTS.find((item) => item.id === state.root);
            const suffix = SUFFIX_DEFS.find((item) => item.id === state.suffix);
            const combo = root.combos[suffix.id];

            $$(".chip", rootChips).forEach((chip) => chip.classList.toggle("active", chip.dataset.id === root.id));
            $$(".chip", suffixChips).forEach((chip) => chip.classList.toggle("active", chip.dataset.id === suffix.id));

            if (!combo) {
                const hint = root.kind === "місто"
                    ? "Назви міст зазвичай дають прізвища на -ський / -цький."
                    : "Не кожен корінь «дружить» з кожним суфіксом.";
                formula.innerHTML = `
                    <div class="formula-line"><span>${root.label}</span><span>+</span><span class="part-suffix">${suffix.label}</span><span>=</span></div>
                    <div class="formula-result">?</div>
                    <p class="formula-meaning">Таке поєднання майже не трапляється. ${hint}</p>`;
            } else {
                const [stem, tail, meaning] = combo;
                formula.innerHTML = `
                    <div class="formula-line"><span>${root.label} <small>(${root.kind})</small></span><span>+</span><span class="part-suffix">-${tail}</span><span>=</span></div>
                    <div class="formula-result"><span class="part-root">${stem}</span><span class="part-suffix">${tail}</span></div>
                    <p class="formula-meaning">${meaning}</p>
                    <p class="small-note">${root.note}</p>`;
            }

            suffixInfo.innerHTML = `<b>${suffix.label}.</b> ${suffix.info}`;
        }

        rootChips.addEventListener("click", (event) => {
            const chip = event.target.closest(".chip");
            if (chip) {
                state.root = chip.dataset.id;
                render();
            }
        });
        suffixChips.addEventListener("click", (event) => {
            const chip = event.target.closest(".chip");
            if (chip) {
                state.suffix = chip.dataset.id;
                render();
            }
        });

        render();
    }

    /* ---------- 4. Суфікси на карті ---------- */

    const SUFFIX_GROUPS = [
        { id: "enko", label: "-енко", suffixes: ["-енко"], info: "Типові для Лівобережжя та центру України: Тимошенко, Олійченко, Кривенко." },
        { id: "uk", label: "-ук / -чук / -юк", suffixes: ["-ук", "-чук", "-юк"], info: "Західні та правобережні закінчення: Івасюк, Грицюк, Павлючук. На Галичині та Буковині — ще й форми на -як, -юк: Добряк, Рудюк." },
        { id: "ov", label: "-ов / -ова", suffixes: ["-ов", "-ова"], info: "Модель, що поширилася в російську добу (-ов, -ев, -ін): Бондар → Бондарев. Після 1991 року багато хто повертає форми на -енко, -ук." },
        { id: "ko", label: "-ко", suffixes: ["-ко"], info: "Одне з традиційних українських закінчень, що переважають і сьогодні: Бойко, Приходько, Величко." },
        { id: "none", label: "Без суфікса", suffixes: ["Без суфікса"], info: "Короткі прізвища лише з основою: Коваль, Бондар, Вовк, Мороз. Вони найближчі до слова, від якого походять." }
    ];

    function computeShares(group) {
        const totals = {};
        const part = {};
        surnames.forEach((item) => {
            const inGroup = group.suffixes.includes(item.suffix);
            Object.entries(item.regions || {}).forEach(([regionId, value]) => {
                totals[regionId] = (totals[regionId] || 0) + value;
                if (inGroup) {
                    part[regionId] = (part[regionId] || 0) + value;
                }
            });
        });
        const shares = {};
        Object.keys(totals).forEach((regionId) => {
            shares[regionId] = (part[regionId] || 0) / totals[regionId];
        });
        return shares;
    }

    function currentTheme() {
        return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    function rampColors() {
        return currentTheme() === "dark"
            ? { from: [30, 45, 74], to: [96, 165, 250] }
            : { from: [232, 241, 255], to: [29, 78, 216] };
    }

    function ramp(t) {
        const { from, to } = rampColors();
        const rgb = from.map((channel, i) => Math.round(channel + (to[i] - channel) * t));
        return `rgb(${rgb.join(", ")})`;
    }

    function darken(color, amount) {
        const match = color.match(/rgba?\(([^)]+)\)/);
        if (!match) {
            return color;
        }
        const parts = match[1].split(",").map((part) => parseFloat(part));
        const rgb = parts.slice(0, 3).map((channel) => Math.max(0, Math.round(channel * (1 - amount))));
        return `rgb(${rgb.join(", ")})`;
    }

    function initSuffixMap() {
        const mapObject = $("#suffixMap");
        const chipsHost = $("#mapChips");
        const readout = $("#mapReadout");
        const legendBar = $("#legendBar");
        const infoBox = $("#mapSuffixInfo");
        let group = SUFFIX_GROUPS[0];
        let regions = [];
        let shares = {};

        if (surnames.length === 0) {
            readout.textContent = "Дані про прізвища не завантажились.";
            return;
        }

        chipsHost.innerHTML = SUFFIX_GROUPS
            .map((item) => `<button type="button" class="chip" data-id="${item.id}">${item.label}</button>`)
            .join("");

        function applyMapStyle() {
            const doc = mapObject.contentDocument;
            const style = doc && doc.getElementById("history-map-style");
            if (!style) {
                return;
            }
            const dark = currentTheme() === "dark";
            style.textContent = `
                path[id^="UA-"] {
                    fill: ${dark ? "#25344d" : "#e8edf5"};
                    stroke: ${dark ? "#5b7291" : "#6f7d8f"};
                    stroke-width: 1;
                    cursor: pointer;
                    transition: fill 0.2s ease;
                }`;
        }

        function describeDefault() {
            const best = Object.entries(shares).sort((a, b) => b[1] - a[1])[0];
            readout.textContent = best
                ? `Найбільша частка: ${REGION_NAMES[best[0]] || best[0]} — ${formatPercent(best[1])}%`
                : "Наведіть курсор на область";
        }

        function paint() {
            shares = computeShares(group);
            const values = Object.values(shares);
            const min = Math.min(...values);
            const max = Math.max(...values);

            regions.forEach((path) => {
                const value = shares[path.id] || 0;
                const t = max > min ? (value - min) / (max - min) : 0;
                path.dataset.fill = ramp(t);
                path.style.fill = path.dataset.fill;
            });

            const { from, to } = rampColors();
            legendBar.style.background = `linear-gradient(90deg, rgb(${from.join(",")}), rgb(${to.join(",")}))`;

            const inGroup = surnames.filter((item) => group.suffixes.includes(item.suffix)).length;
            infoBox.innerHTML = `<b>${group.label}.</b> ${group.info} У топ-100 таких прізвищ — ${inGroup} із ${surnames.length}.`;
            $$(".chip", chipsHost).forEach((chip) => chip.classList.toggle("active", chip.dataset.id === group.id));
            describeDefault();
        }

        function bindRegion(path) {
            path.addEventListener("mouseenter", () => {
                path.style.fill = darken(path.dataset.fill || path.style.fill, 0.18);
                const value = shares[path.id] || 0;
                readout.textContent = `${REGION_NAMES[path.id] || path.id}: ${formatPercent(value)}% носіїв топ-100 мають прізвища на ${group.label}`;
            });
            path.addEventListener("mouseleave", () => {
                path.style.fill = path.dataset.fill || "";
                describeDefault();
            });
        }

        function initialize() {
            if (regions.length > 0) {
                return;
            }
            const doc = mapObject.contentDocument;
            if (!doc) {
                readout.textContent = "Не вдалося завантажити карту.";
                return;
            }
            const svg = doc.querySelector("svg");
            regions = Array.from(doc.querySelectorAll("path[id^='UA-']"));
            if (svg) {
                const style = doc.createElementNS("http://www.w3.org/2000/svg", "style");
                style.id = "history-map-style";
                svg.prepend(style);
            }
            applyMapStyle();
            regions.forEach(bindRegion);
            paint();
        }

        chipsHost.addEventListener("click", (event) => {
            const chip = event.target.closest(".chip");
            if (chip) {
                group = SUFFIX_GROUPS.find((item) => item.id === chip.dataset.id);
                paint();
            }
        });

        document.addEventListener("themechange", () => {
            applyMapStyle();
            paint();
        });

        mapObject.addEventListener("load", initialize);
        if (mapObject.contentDocument && mapObject.contentDocument.querySelector("svg")) {
            initialize();
        }

        $$(".chip", chipsHost).forEach((chip) => chip.classList.toggle("active", chip.dataset.id === group.id));
    }

    /* ---------- 5. Епохи ---------- */

    const EPOCHS = {
        pl: {
            label: "Польська доба",
            years: "XIV–XVIII ст.",
            intro: "Значна частина Правобережної України перебувала під польським впливом. Прізвища наближали до польських мовних норм:",
            rules: [
                "додавали суфікси -ський, -цький, -овський, -євський",
                "змінювали написання за польською орфографією",
                "творили «шляхетніші» форми — адже закінчення -ський у Польщі вказувало на дворянство"
            ],
            changes: [
                ["Шевченко", "Шевчевський", "польський суфікс"],
                ["Сидор", "Сидоровський", "польський суфікс"],
                ["Іван", "Iwan", "польська орфографія"],
                ["Грицько", "Hryćko", "польська орфографія"],
                ["Шевченко", "Szewczenko", "у польських документах"]
            ],
            outro: "Так з’явилося багато прізвищ на кшталт Ковальський, Романівський, Луцький, Краковський — вони й сьогодні поширені не лише в Україні, а й у Польщі."
        },
        ru: {
            label: "Імперія та СРСР",
            years: "XIX–XX ст.",
            intro: "Коли більшість українських земель опинилася в Російській імперії, а потім у СРСР, прізвища підганяли під російські мовні стандарти:",
            rules: [
                "додавали суфікси -ов, -ев, -ін",
                "змінювали вимову й написання",
                "чиновники часто перекручували українські форми, бо записували їх на слух",
                "у радянських паспортах українські варіанти заміняли «спрощеними» чи зрусифікованими"
            ],
            changes: [
                ["Шевченко", "Шевченков", "суфікс -ов"],
                ["Петренко", "Петренков", "суфікс -ов"],
                ["Бондар", "Бондарев", "суфікс -ев"],
                ["Григорій", "Григорьев", "російське написання"],
                ["Олексій", "Алексеев", "російське написання"]
            ],
            outro: "Наслідком стала втрата частини національної специфіки прізвищ."
        },
        ua: {
            label: "Після 1991",
            years: "незалежність",
            intro: "Після відновлення незалежності почалося відродження автентичних форм прізвищ:",
            rules: [
                "люди повертають первісні варіанти, замінюючи -ов, -ев на -енко, -ук, -чук, -ишин",
                "дехто позбувається радянського чи «іноземного» звучання"
            ],
            changes: [
                ["Петров", "Петренко", "повернення українського суфікса"],
                ["Смирнов", "Мирний", "українізація звучання"]
            ],
            outro: "Сьогодні в Україні переважають традиційні суфікси -енко, -ук, -чук, -ко, -ишин."
        }
    };

    function initEpochs() {
        const enkoCount = surnames.filter((item) => item.suffix === "-енко").length;

        makeTabs(
            $("#epochTabs"),
            Object.entries(EPOCHS).map(([id, epoch]) => ({ id, label: `${epoch.label} <small>(${epoch.years})</small>` })),
            (id) => {
                const epoch = EPOCHS[id];
                const dataNote = id === "ua" && surnames.length
                    ? `<p class="note">У нашій базі топ-100 прізвищ на -енко — ${enkoCount} із ${surnames.length}.</p>`
                    : "";
                return `
                    <p>${epoch.intro}</p>
                    <ul>${epoch.rules.map((rule) => `<li>${rule}</li>`).join("")}</ul>
                    <div class="change-grid">
                        ${epoch.changes.map(([from, to, why], i) => `
                            <div class="change-card" style="animation-delay:${i * 0.07}s">
                                <span class="change-from">${from}</span>
                                <span class="change-arrow">↓</span>
                                <span class="change-to">${to}</span>
                                <span class="change-why">${why}</span>
                            </div>`).join("")}
                    </div>
                    <p style="margin-top:14px">${epoch.outro}</p>
                    ${dataNote}`;
            }
        );
    }

    /* ---------- 6. Прізвища-образи ---------- */

    const TILE_CATEGORIES = {
        animals: { label: "Тварини й птахи", fallback: "Прізвисько за назвою тварини чи птаха — порівняння людини з твариною за повадками або рисами." },
        plants: { label: "Рослини й природа", fallback: "Прізвисько за назвою рослини чи природного явища — часто поетичне, пов’язане з місцем проживання або символікою." },
        things: { label: "Предмети й дотепи", fallback: "Жартівливе або професійне прізвисько за назвою предмета побуту — наслідок веселого випадку чи іронічного порівняння." },
        folk: { label: "Фольклор і символи", fallback: "Прізвище, пов’язане з піснями, легендами чи духовними образами — типове для козацької доби та творчих людей." }
    };

    const TILES = [
        { word: "Вовк", cat: "animals", meaning: "сильний, відважний, незалежний" },
        { word: "Лис", cat: "animals", meaning: "хитрий, спритний" },
        { word: "Сокіл", cat: "animals", meaning: "гордий, красивий, з гострим зором" },
        { word: "Голуб", cat: "animals", meaning: "лагідний, миролюбний" },
        { word: "Борсук", cat: "animals", meaning: "часто жартівливе або родинне прізвисько" },
        { word: "Кіт", cat: "animals", meaning: "часто жартівливе або родинне прізвисько" },
        { word: "Заєць", cat: "animals", meaning: "часто жартівливе або родинне прізвисько" },
        { word: "Гуска", cat: "animals", meaning: "часто жартівливе або родинне прізвисько" },
        { word: "Калина", cat: "plants", meaning: "символ дівочої вроди" },
        { word: "Верба", cat: "plants" },
        { word: "Дуб", cat: "plants", meaning: "сила й міцність" },
        { word: "Береза", cat: "plants" },
        { word: "Горіх", cat: "plants" },
        { word: "Хміль", cat: "plants", meaning: "весела, рухлива натура" },
        { word: "Жито", cat: "plants" },
        { word: "Квітка", cat: "plants" },
        { word: "Мороз", cat: "plants", meaning: "витривалість, стриманість" },
        { word: "Горщик", cat: "things", meaning: "майстер, який робив глиняний посуд" },
        { word: "Ковбаса", cat: "things" },
        { word: "Діжка", cat: "things" },
        { word: "Паляниця", cat: "things" },
        { word: "Ложка", cat: "things" },
        { word: "Книга", cat: "things", meaning: "можливо, людина, що вміла читати або працювала з документами" },
        { word: "Сміх", cat: "things", meaning: "людина з веселим характером або гучним сміхом" },
        { word: "Байка", cat: "things" },
        { word: "Жарт", cat: "things" },
        { word: "Козак", cat: "folk", meaning: "символ волі, мужності та приналежності до козацького роду" },
        { word: "Бандура", cat: "folk" },
        { word: "Дума", cat: "folk" },
        { word: "Соловей", cat: "folk" },
        { word: "Зоря", cat: "folk" },
        { word: "Доля", cat: "folk" },
        { word: "Мрія", cat: "folk" },
        { word: "Пісня", cat: "folk" }
    ];

    function rankInTop(word) {
        const sorted = surnames
            .map((item) => ({ name: item.surname, count: toNumber(item.count) }))
            .sort((a, b) => b.count - a.count);
        const index = sorted.findIndex((item) => item.name.toLowerCase() === word.toLowerCase());
        return index === -1 ? null : { rank: index + 1, count: sorted[index].count };
    }

    function initTiles() {
        const catsHost = $("#tileCats");
        const grid = $("#tileGrid");
        const detail = $("#tileDetail");
        let activeCat = "all";
        let activeWord = null;

        catsHost.innerHTML = [`<button type="button" class="chip" data-cat="all">Усі</button>`]
            .concat(Object.entries(TILE_CATEGORIES).map(([id, cat]) => `<button type="button" class="chip" data-cat="${id}">${cat.label}</button>`))
            .join("");

        function renderGrid() {
            $$(".chip", catsHost).forEach((chip) => chip.classList.toggle("active", chip.dataset.cat === activeCat));
            grid.innerHTML = TILES
                .filter((tile) => activeCat === "all" || tile.cat === activeCat)
                .map((tile) => `<button type="button" class="tile${tile.word === activeWord ? " active" : ""}" data-word="${tile.word}">${tile.word}</button>`)
                .join("");
        }

        function renderDetail() {
            const tile = TILES.find((item) => item.word === activeWord);
            if (!tile) {
                detail.innerHTML = "<p>Клікніть на прізвище — і дізнаєтесь, що воно могло означати.</p>";
                return;
            }
            const category = TILE_CATEGORIES[tile.cat];
            const stat = rankInTop(tile.word);
            const statText = stat
                ? `У топ-100 «Рідні» це прізвище посідає ${stat.rank}-е місце: ${formatNumber(stat.count)} носіїв.`
                : "У топ-100 найпоширеніших прізвищ України його немає — воно трапляється рідше.";
            detail.innerHTML = `
                <h3>${tile.word}</h3>
                <p class="tile-cat">${category.label}</p>
                <p>${tile.meaning ? `Символізувало: <b>${tile.meaning}</b>.` : category.fallback}</p>
                ${surnames.length ? `<p class="tile-fact">${statText}</p>` : ""}`;
        }

        catsHost.addEventListener("click", (event) => {
            const chip = event.target.closest(".chip");
            if (chip) {
                activeCat = chip.dataset.cat;
                renderGrid();
            }
        });

        grid.addEventListener("click", (event) => {
            const tile = event.target.closest(".tile");
            if (tile) {
                activeWord = tile.dataset.word;
                renderGrid();
                renderDetail();
            }
        });

        renderGrid();
        renderDetail();
    }

    /* ---------- 7. Сучасність + вікторина ---------- */

    const MODERN_CARDS = [
        { ico: "1991", title: "Повернення автентичності", text: "Після 1991 року люди звертаються до органів реєстрації, щоб повернути історичну форму прізвища, замінюючи -ов, -ев на -енко, -ук, -чук." },
        { ico: "✎", title: "Зміна прізвища", text: "Позбутися радянського чи «іноземного» звучання (Смирнов → Мирний), уникнути комічного (Козел, Гусак, Бабій) або взяти подвійне прізвище: Шевченко-Литвин, Петренко-Савчук." },
        { ico: "=", title: "Рівність у формах", text: "Закон дозволяє жінці залишити чоловічу форму прізвища або мати власну жіночу: Шевченко чи Шевченкова. Дедалі частіше подружжя обирає одне спільне нове прізвище." },
        { ico: "Aa", title: "Латиниця", text: "Через глобалізацію й еміграцію прізвища адаптують до міжнародних норм: Шевченко → Shevchenko, Кравчук → Kravchuk. В Україні офіційно зберігається повна форма." },
        { ico: "♥", title: "Інтерес до роду", text: "Зростає інтерес до родоводу та походження власного прізвища. Дедалі більше родин передають дітям традиційне українське прізвище без змін, навіть коли один із батьків іноземець." }
    ];

    function initModern() {
        $("#modernGrid").innerHTML = MODERN_CARDS.map((card) => `
            <div class="modern-card">
                <span class="modern-ico">${card.ico}</span>
                <h3>${card.title}</h3>
                <p>${card.text}</p>
            </div>`).join("");
    }

    function buildQuestions() {
        const questions = [
            {
                q: "Що спочатку означав суфікс -енко?",
                options: ["Місце походження", "Син, нащадок", "Ремісник"],
                answer: 1,
                why: "Іваненко — «син Івана». Згодом суфікс утратив зменшувальний відтінок."
            },
            {
                q: "Коли почалося відродження автентичних форм прізвищ?",
                options: ["Після 1917 року", "Після 1945 року", "Після 1991 року"],
                answer: 2,
                why: "Після відновлення незалежності люди почали повертати первісні форми прізвищ."
            },
            {
                q: "Які суфікси типові для Заходу України?",
                options: ["-ов, -ев, -ін", "-ук, -чук, -юк", "-енко"],
                answer: 1,
                why: "На Заході й Правобережжі частіше зустрічаються -ук, -чук, -юк, а на Лівобережжі — -енко."
            }
        ];

        if (surnames.length) {
            const top = surnames
                .map((item) => ({ name: item.surname, count: toNumber(item.count) }))
                .sort((a, b) => b.count - a.count)[0];
            const pool = ["Шевченко", "Мельник", "Коваленко", "Бойко"];
            if (!pool.includes(top.name)) {
                pool[0] = top.name;
            }
            questions.push({
                q: "Яке прізвище найпоширеніше в Україні за даними «Рідні»?",
                options: pool,
                answer: pool.indexOf(top.name),
                why: `${top.name} — ${formatNumber(top.count)} носіїв.`
            });
        }

        return questions;
    }

    function initQuiz() {
        const host = $("#quiz");
        const questions = buildQuestions();
        let index = 0;
        let score = 0;

        function renderQuestion() {
            const item = questions[index];
            host.innerHTML = `
                <div class="quiz-progress"><span style="width:${(index / questions.length) * 100}%"></span></div>
                <p class="quiz-q">${index + 1}/${questions.length}. ${item.q}</p>
                <div class="opts">
                    ${item.options.map((option, i) => `<button type="button" class="opt" data-i="${i}">${option}</button>`).join("")}
                </div>
                <div class="quiz-feedback" aria-live="polite"></div>
                <div class="quiz-actions"></div>`;
        }

        function renderResult() {
            host.innerHTML = `
                <div class="quiz-progress"><span style="width:100%"></span></div>
                <p class="score">Ваш результат: ${score} із ${questions.length}</p>
                <p>${score === questions.length ? "Чудово — ви справжній знавець прізвищ!" : "Перегляньте блоки вище й спробуйте ще раз."}</p>
                <div class="quiz-actions"><button type="button" class="btn" data-action="restart">Пройти ще раз</button></div>`;
        }

        host.addEventListener("click", (event) => {
            const option = event.target.closest(".opt");
            const action = event.target.closest("[data-action]");

            if (action && action.dataset.action === "restart") {
                index = 0;
                score = 0;
                renderQuestion();
                return;
            }

            if (action && action.dataset.action === "next") {
                index += 1;
                if (index < questions.length) {
                    renderQuestion();
                } else {
                    renderResult();
                }
                return;
            }

            if (option && !option.disabled) {
                const item = questions[index];
                const picked = Number(option.dataset.i);
                const buttons = $$(".opt", host);
                buttons.forEach((button) => {
                    button.disabled = true;
                });
                buttons[item.answer].classList.add("correct");
                if (picked === item.answer) {
                    score += 1;
                } else {
                    option.classList.add("wrong");
                }
                $(".quiz-feedback", host).textContent = (picked === item.answer ? "Правильно! " : "Не зовсім. ") + item.why;
                $(".quiz-actions", host).innerHTML = `<button type="button" class="btn" data-action="next">${index + 1 < questions.length ? "Далі" : "Результат"}</button>`;
            }
        });

        renderQuestion();
    }

    /* ---------- поява блоків і підсвічування кроку ---------- */

    function initScrollEffects() {
        const reveals = $$(".reveal");
        const stepLinks = $$("#stepNav a");

        if (!("IntersectionObserver" in window)) {
            reveals.forEach((element) => element.classList.add("in"));
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

        const stepObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    stepLinks.forEach((link) => link.classList.toggle("active", link.dataset.step === entry.target.id));
                }
            });
        }, { rootMargin: "-35% 0px -60% 0px" });
        $$(".story-block[id]").forEach((block) => stepObserver.observe(block));
    }

    initNameCards();
    initChristianNames();
    initNameToSurname();
    initStages();
    initReasons();
    initFirstSurnames();
    initBuilder();
    initSuffixMap();
    initEpochs();
    initTiles();
    initModern();
    initQuiz();
    initScrollEffects();
})();
