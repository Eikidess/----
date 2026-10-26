const regionNameEl = document.getElementById("region-name");
const infoPanel = document.getElementById("infoContent");
const inputEl = document.getElementById("surnameInput");
const searchBtn = document.getElementById("searchBtn");
const suggestionsEl = document.getElementById("suggestions");
const mapObject = document.getElementById("ukraineMap");

const regionNames = {
    "UA-05": "Вінницька область",
    "UA-07": "Волинська область",
    "UA-09": "Луганська область",
    "UA-12": "Дніпропетровська область",
    "UA-14": "Донецька область",
    "UA-18": "Житомирська область",
    "UA-21": "Закарпатська область",
    "UA-23": "Запорізька область",
    "UA-26": "Івано-Франківська область",
    "UA-30": "Київ",
    "UA-32": "Київська область",
    "UA-35": "Кіровоградська область",
    "UA-40": "Севастополь",
    "UA-43": "Крим",
    "UA-46": "Львівська область",
    "UA-48": "Миколаївська область",
    "UA-51": "Одеська область",
    "UA-53": "Полтавська область",
    "UA-56": "Рівненська область",
    "UA-59": "Сумська область",
    "UA-61": "Тернопільська область",
    "UA-63": "Харківська область",
    "UA-65": "Херсонська область",
    "UA-68": "Хмельницька область",
    "UA-71": "Черкаська область",
    "UA-74": "Чернігівська область",
    "UA-77": "Чернівецька область"
};

let surnames = [];
let regions = [];
let currentResult = null;
let currentRegionView = null;
let regionInsightEl = null;

function getIdleHeading() {
    if (currentResult) {
        return `Розподіл для ${currentResult.surname}`;
    }
    if (currentRegionView) {
        return `Популярні прізвища: ${regionNames[currentRegionView] || currentRegionView}`;
    }
    return "Наведіть курсор на область або введіть прізвище";
}

const FUN_FACTS = [
    "Українські прізвища часто пов'язані з професіями. Наприклад, прізвища Мельник, Коваль, Бондар та Швець походять від назв ремесел і професій.",
    "Суфікс -енко є одним із найхарактерніших для українських прізвищ. Спочатку він часто вказував на походження людини від батька або предка: наприклад, Петренко — син Петра.",
    "Прізвище могло виникнути з прізвиська. Особливості зовнішності, характеру чи поведінки людини могли стати основою для майбутнього родового прізвища.",
    "Одне й те саме прізвище може мати кілька версій походження. Для точного визначення його етимології іноді потрібно враховувати історичні документи, місцевість та мовні особливості.",
    "Поширення прізвища може змінюватися з часом. Війни, переселення, міграції та зміни державних кордонів впливали на те, де сьогодні живуть носії певного прізвища.",
    "Деякі українські прізвища походять від назв населених пунктів або географічних об'єктів. Такі прізвища могли вказувати на місце, звідки походила людина або її родина.",
    "Прізвища від назв тварин і рослин також поширені в українській антропонімії. Вони могли виникнути від прізвиськ, пов'язаних із зовнішністю, поведінкою чи певними асоціаціями.",
    "Прізвище — це своєрідний історичний слід. У ньому можуть зберігатися відомості про заняття предків, місце їхнього проживання, особливості зовнішності або навіть давні особові імена.",
    "У різних регіонах України можуть переважати різні моделі творення прізвищ. На їхнє формування впливали місцеві мовні традиції, історія регіону та контакти з іншими мовами.",
    "Дослідження прізвищ поєднує кілька наук. Для вивчення їхнього походження використовують знання з мовознавства, історії, географії, генеалогії та антропоніміки."
];

function showPlaceholder() {
    const fact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
    infoPanel.innerHTML = `<p class="info-placeholder info-fact">${fact}</p>`;
}

const THEME_STORAGE_KEY = "site-theme";
const themeToggleBtn = document.getElementById("themeToggle");

function getCurrentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function applyMapTheme() {
    const mapDoc = mapObject.contentDocument;
    if (!mapDoc) {
        return;
    }

    const style = mapDoc.getElementById("map-base-style");
    if (!style) {
        return;
    }

    const isDark = getCurrentTheme() === "dark";
    style.textContent = `
        path[id^="UA-"] {
            fill: ${isDark ? "#25344d" : "#e8edf5"};
            stroke: ${isDark ? "#5b7291" : "#6f7d8f"};
            stroke-width: 1;
            cursor: pointer;
            transition: fill 0.2s ease;
        }
    `;
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyMapTheme();
}

function parseColor(colorStr) {
    if (!colorStr) {
        return null;
    }

    const rgbMatch = colorStr.match(/rgba?\(([^)]+)\)/);
    if (rgbMatch) {
        const parts = rgbMatch[1].split(",").map((n) => parseFloat(n.trim()));
        return { r: parts[0], g: parts[1], b: parts[2] };
    }

    const hexMatch = colorStr.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) {
            hex = hex.split("").map((c) => c + c).join("");
        }
        const num = parseInt(hex, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    return null;
}

function darkenColor(colorStr, amount) {
    const rgb = parseColor(colorStr);
    if (!rgb) {
        return colorStr;
    }

    const factor = 1 - amount;
    const r = Math.max(0, Math.round(rgb.r * factor));
    const g = Math.max(0, Math.round(rgb.g * factor));
    const b = Math.max(0, Math.round(rgb.b * factor));
    return `rgb(${r}, ${g}, ${b})`;
}

function getRegionFill(region) {
    if (region.style.fill) {
        return region.style.fill;
    }
    return region.ownerDocument.defaultView.getComputedStyle(region).fill;
}

const HEAT_PALETTES = {
    orange: [
        { stop: 0, color: [255, 248, 235] },
        { stop: 0.5, color: [255, 179, 71] },
        { stop: 1, color: [196, 58, 38] }
    ],
    blue: [
        { stop: 0, color: [235, 245, 255] },
        { stop: 0.5, color: [93, 156, 236] },
        { stop: 1, color: [21, 67, 138] }
    ],
    pink: [
        { stop: 0, color: [255, 240, 246] },
        { stop: 0.5, color: [244, 114, 182] },
        { stop: 1, color: [157, 23, 77] }
    ],
    green: [
        { stop: 0, color: [240, 250, 235] },
        { stop: 0.5, color: [110, 190, 90] },
        { stop: 1, color: [27, 94, 32] }
    ],
    yellow: [
        { stop: 0, color: [255, 253, 230] },
        { stop: 0.5, color: [250, 204, 21] },
        { stop: 1, color: [161, 98, 7] }
    ]
};

const HEAT_PALETTE_NAMES = Object.keys(HEAT_PALETTES);
let currentPaletteName = null;

function pickNextPalette() {
    const choices = HEAT_PALETTE_NAMES.filter((name) => name !== currentPaletteName);
    currentPaletteName = choices[Math.floor(Math.random() * choices.length)];
    return currentPaletteName;
}

function getRegionLabel(region) {
    return regionNames[region.id] || region.getAttribute("title") || region.id;
}

function getHeatColor(ratio, stops) {
    const clamped = Math.max(0, Math.min(1, ratio));
    let lower = stops[0];
    let upper = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
        if (clamped >= stops[i].stop && clamped <= stops[i + 1].stop) {
            lower = stops[i];
            upper = stops[i + 1];
            break;
        }
    }

    const localRatio = (clamped - lower.stop) / (upper.stop - lower.stop);
    const rgb = lower.color.map((channel, index) =>
        Math.round(channel + (upper.color[index] - channel) * localRatio)
    );

    return `rgb(${rgb.join(", ")})`;
}

function colorRegions(result) {
    if (!result || !result.regions) {
        regions.forEach((path) => {
            path.style.fill = "";
        });
        return;
    }

    const stops = HEAT_PALETTES[pickNextPalette()];
    const maxCount = Math.max(...Object.values(result.regions), 1);

    regions.forEach((path) => {
        const count = result.regions[path.id] || 0;
        path.style.fill = getHeatColor(count / maxCount, stops);
    });
}

function renderInfo(result) {
    if (!result) {
        infoPanel.innerHTML = `
            <h2>Прізвище не знайдено</h2>
            <p>Дані про це прізвище ще не додані до бази.</p>
            <p id="regionInsight" class="region-insight"></p>
        `;
        regionInsightEl = document.getElementById("regionInsight");
        regionNameEl.textContent = "Прізвище не знайдено";
        return;
    }

    infoPanel.innerHTML = `
        <h2>${result.surname}</h2>
        <p><b>Походження:</b> ${result.origin}</p>
        <p><b>Тип:</b> ${result.type}</p>
        <p><b>Суфікс:</b> ${result.suffix}</p>
        <p><b>Найбільше поширення:</b> ${result.region}</p>
        <p><b>Кількість носіїв:</b> ${result.count}</p>
        <p id="regionInsight" class="region-insight"></p>
    `;
    regionInsightEl = document.getElementById("regionInsight");
}

function getRegionRanking(regionId) {
    return surnames
        .map((item) => ({ surname: item.surname, count: (item.regions && item.regions[regionId]) || 0 }))
        .sort((a, b) => b.count - a.count);
}

function renderRegionInfo(region) {
    const regionId = region.id;
    const label = getRegionLabel(region);
    const ranking = getRegionRanking(regionId);

    if (ranking.length === 0 || ranking[0].count === 0) {
        infoPanel.innerHTML = `
            <h2>${label}</h2>
            <p>Дані про прізвища в цьому регіоні відсутні.</p>
        `;
        return;
    }

    const top = ranking[0];
    const others = ranking.slice(1, 6);
    const othersHtml = others
        .map((entry) => `<li>${entry.surname} — ${entry.count.toLocaleString("uk-UA")}</li>`)
        .join("");

    infoPanel.innerHTML = `
        <h2>${label}</h2>
        <p><b>Найпоширеніше прізвище:</b> ${top.surname}</p>
        <p><b>Кількість носіїв:</b> ${top.count.toLocaleString("uk-UA")}</p>
        <p><b>Також популярні прізвища в регіоні:</b></p>
        <ul class="region-surname-list">${othersHtml}</ul>
        <p id="regionInsight" class="region-insight"></p>
    `;
    regionInsightEl = document.getElementById("regionInsight");
}

function searchSurname() {
    hideSuggestions();

    const normalizedInput = inputEl.value.trim().toLowerCase();
    const result = surnames.find((item) => item.surname.toLowerCase() === normalizedInput);

    currentResult = result || null;
    renderInfo(result);
    colorRegions(result);

    regionNameEl.textContent = result
        ? `Розподіл для ${result.surname}`
        : "Прізвище не знайдено";
}

function hideSuggestions() {
    suggestionsEl.hidden = true;
    suggestionsEl.innerHTML = "";
}

function selectSuggestion(surname) {
    inputEl.value = surname;
    searchSurname();
}

function updateSuggestions() {
    const query = inputEl.value.trim().toLowerCase();
    if (!query) {
        hideSuggestions();
        return;
    }

    const matches = surnames
        .filter((item) => item.surname.toLowerCase().startsWith(query))
        .slice(0, 8);

    if (matches.length === 0) {
        hideSuggestions();
        return;
    }

    suggestionsEl.innerHTML = "";
    matches.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item.surname;
        li.setAttribute("role", "option");
        li.addEventListener("mousedown", (event) => {
            event.preventDefault();
            selectSuggestion(item.surname);
        });
        suggestionsEl.appendChild(li);
    });

    suggestionsEl.hidden = false;
}

function bindRegionEvents(region) {
    region.addEventListener("mouseenter", () => {
        region.dataset.baseFill = getRegionFill(region);
        region.style.fill = darkenColor(region.dataset.baseFill, 0.18);

        const regionLabel = getRegionLabel(region);
        regionNameEl.textContent = `Область: ${regionLabel}`;

        if (currentResult && currentResult.regions && regionInsightEl) {
            const count = currentResult.regions[region.id] || 0;
            regionInsightEl.textContent = `Носіїв у регіоні: ${count.toLocaleString("uk-UA")}`;
        } else if (regionInsightEl) {
            regionInsightEl.textContent = "";
        }
    });

    region.addEventListener("mouseleave", () => {
        region.style.fill = region.dataset.baseFill || "";
        delete region.dataset.baseFill;

        regionNameEl.textContent = getIdleHeading();

        if (regionInsightEl) {
            regionInsightEl.textContent = "";
        }
    });

    region.addEventListener("click", () => {
        currentRegionView = region.id;
        renderRegionInfo(region);
        regionNameEl.textContent = `Область: ${getRegionLabel(region)}`;
    });
}

function initializeMap() {
    if (regions.length > 0) {
        return;
    }

    const mapDoc = mapObject.contentDocument;
    if (!mapDoc) {
        regionNameEl.textContent = "Не вдалося завантажити карту";
        return;
    }

    const svg = mapDoc.querySelector("svg");
    regions = Array.from(mapDoc.querySelectorAll("path[id^='UA-']"));

    if (svg) {
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", "Карта України");

        const style = mapDoc.createElementNS("http://www.w3.org/2000/svg", "style");
        style.id = "map-base-style";
        svg.prepend(style);
    }

    regions.forEach(bindRegionEvents);
    applyMapTheme();
}

function initializeData() {
    if (window.surnamesData && Array.isArray(window.surnamesData)) {
        surnames = window.surnamesData;
        return;
    }

    infoPanel.innerHTML = `
        <h2>Не вдалося завантажити дані</h2>
        <p>Перевірте файл з базою прізвищ.</p>
        <p id="regionInsight" class="region-insight"></p>
    `;
    regionInsightEl = document.getElementById("regionInsight");
}

searchBtn.addEventListener("click", searchSurname);
inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        searchSurname();
    }
});
inputEl.addEventListener("input", updateSuggestions);
inputEl.addEventListener("focus", updateSuggestions);
inputEl.addEventListener("blur", hideSuggestions);

themeToggleBtn.addEventListener("click", () => {
    setTheme(getCurrentTheme() === "dark" ? "light" : "dark");
});

mapObject.addEventListener("load", initializeMap);
showPlaceholder();
initializeData();

if (mapObject.contentDocument) {
    initializeMap();
}
