(function () {
    "use strict";

    const surnames = Array.isArray(window.surnamesData) ? window.surnamesData : [];

    const form = document.getElementById("finderForm");
    const input = document.getElementById("finderInput");
    const list = document.getElementById("suggestions");
    const message = document.getElementById("finderMsg");
    let activeIndex = -1;

    function openMap(surname) {
        window.location.href = "index.html?q=" + encodeURIComponent(surname) + "#map";
    }

    function hideSuggestions() {
        list.hidden = true;
        list.innerHTML = "";
        activeIndex = -1;
    }

    function highlight() {
        Array.from(list.children).forEach((item, i) => item.classList.toggle("active", i === activeIndex));
    }

    function updateSuggestions() {
        message.textContent = "";
        const query = input.value.trim().toLowerCase();
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

        list.innerHTML = "";
        matches.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = item.surname;
            li.setAttribute("role", "option");
            li.addEventListener("mousedown", (event) => {
                event.preventDefault();
                openMap(item.surname);
            });
            list.appendChild(li);
        });
        list.hidden = false;
        activeIndex = -1;
    }

    input.addEventListener("input", updateSuggestions);
    input.addEventListener("focus", updateSuggestions);
    input.addEventListener("blur", hideSuggestions);

    input.addEventListener("keydown", (event) => {
        const count = list.children.length;
        if (event.key === "ArrowDown" && count) {
            event.preventDefault();
            activeIndex = (activeIndex + 1) % count;
            highlight();
        } else if (event.key === "ArrowUp" && count) {
            event.preventDefault();
            activeIndex = (activeIndex - 1 + count) % count;
            highlight();
        } else if (event.key === "Escape") {
            hideSuggestions();
        }
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (activeIndex >= 0 && list.children[activeIndex]) {
            openMap(list.children[activeIndex].textContent);
            return;
        }

        const typed = input.value.trim();
        if (!typed) {
            message.textContent = "Введіть прізвище.";
            return;
        }

        const exact = surnames.find((item) => item.surname.toLowerCase() === typed.toLowerCase());
        if (exact) {
            openMap(exact.surname);
        } else {
            hideSuggestions();
            message.textContent = "Прізвища «" + typed + "» поки немає в базі. Спробуйте інше.";
        }
    });

    input.focus();
})();
