// Перемикач світлої/темної теми для сторінок «Історія» та «Порівняння».
// Початкову тему виставляє inline-скрипт у <head>; ключ localStorage спільний з головною сторінкою.
(function () {
    var STORAGE_KEY = "site-theme";
    var toggle = document.getElementById("themeToggle");
    if (!toggle) {
        return;
    }

    toggle.addEventListener("click", function () {
        var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch (e) {
            // сховище недоступне — тема діє лише до перезавантаження
        }
        document.dispatchEvent(new CustomEvent("themechange", { detail: next }));
    });
})();
