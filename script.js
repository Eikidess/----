const regionNameEl = document.getElementById("region-name");
const tooltip = document.getElementById("tooltip");
const infoPanel = document.getElementById("infoContent");
const inputEl = document.getElementById("surnameInput");
const searchBtn = document.getElementById("searchBtn");
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
let regionInsightEl = null;

function getRegionLabel(region) {
    return regionNames[region.id] || region.getAttribute("title") || region.id;
}

function clearHighlights() {
    regions.forEach((path) => {
        path.classList.remove("active-region", "hovered");
        path.style.fill = "";
        path.style.stroke = "";
        path.style.strokeWidth = "";
    });
}

function colorRegions(result) {
    clearHighlights();

    if (!result || !result.regions) {
        return;
    }

    Object.entries(result.regions).forEach(([regionId, count]) => {
        const mapPath = regions.find((path) => path.id === regionId);
        if (!mapPath) {
            return;
        }

        mapPath.classList.add("active-region");
        mapPath.style.stroke = "#10253f";
        mapPath.style.strokeWidth = "2.2";

        if (count >= 7000) {
            mapPath.style.fill = "#ff7f50";
        } else if (count >= 4000) {
            mapPath.style.fill = "#ffb347";
        } else {
            mapPath.style.fill = "#ffe8a3";
        }
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

function searchSurname() {
    const normalizedInput = inputEl.value.trim().toLowerCase();
    const result = surnames.find((item) => item.surname.toLowerCase() === normalizedInput);

    currentResult = result || null;
    renderInfo(result);
    colorRegions(result);

    regionNameEl.textContent = result
        ? `Розподіл для ${result.surname}`
        : "Прізвище не знайдено";
}

function positionTooltip(event) {
    const mapRect = mapObject.getBoundingClientRect();
    tooltip.style.left = `${event.clientX - mapRect.left + 15}px`;
    tooltip.style.top = `${event.clientY - mapRect.top + 15}px`;
}

function bindRegionEvents(region) {
    region.addEventListener("mouseenter", (event) => {
        region.classList.add("hovered");
        region.style.fill = "#3b82f6";
        tooltip.style.display = "block";

        const regionLabel = getRegionLabel(region);
        if (currentResult && currentResult.regions) {
            const count = currentResult.regions[region.id] || 0;
            tooltip.innerHTML = `<b>${regionLabel}</b><br>Носіїв у регіоні: ${count.toLocaleString("uk-UA")}`;
            regionNameEl.textContent = `Область: ${regionLabel}`;
            if (regionInsightEl) {
                regionInsightEl.textContent = `Носіїв у регіоні: ${count.toLocaleString("uk-UA")}`;
            }
        } else {
            tooltip.innerHTML = `<b>${regionLabel}</b>`;
            regionNameEl.textContent = `Область: ${regionLabel}`;
            if (regionInsightEl) {
                regionInsightEl.textContent = "";
            }
        }

        positionTooltip(event);
    });

    region.addEventListener("mousemove", positionTooltip);

    region.addEventListener("mouseleave", () => {
        region.classList.remove("hovered");
        tooltip.style.display = "none";

        if (currentResult) {
            regionNameEl.textContent = `Розподіл для ${currentResult.surname}`;
            colorRegions(currentResult);
        } else {
            region.style.fill = "";
            regionNameEl.textContent = "Наведіть курсор на область або введіть прізвище";
        }

        if (regionInsightEl) {
            regionInsightEl.textContent = "";
        }
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
        style.textContent = `
            path[id^="UA-"] {
                fill: #e8edf5;
                stroke: #6f7d8f;
                stroke-width: 1;
                cursor: pointer;
                transition: fill 0.2s ease, stroke-width 0.2s ease;
            }
            path[id^="UA-"]:hover {
                fill: #3b82f6;
            }
        `;
        svg.prepend(style);
    }

    regions.forEach(bindRegionEvents);
}

function initializeData() {
    if (window.surnamesData && Array.isArray(window.surnamesData)) {
        surnames = window.surnamesData;
        return;
    }

    fetch("data/surnames.json")
        .then((response) => response.json())
        .then((data) => {
            surnames = data;
        })
        .catch(() => {
            infoPanel.innerHTML = `
                <h2>Не вдалося завантажити дані</h2>
                <p>Перевірте файл з базою прізвищ.</p>
                <p id="regionInsight" class="region-insight"></p>
            `;
            regionInsightEl = document.getElementById("regionInsight");
        });
}

searchBtn.addEventListener("click", searchSurname);
inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        searchSurname();
    }
});

mapObject.addEventListener("load", initializeMap);
initializeData();

if (mapObject.contentDocument) {
    initializeMap();
}
