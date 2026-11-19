/* Lucie Termignon — interactions légères, le site reste lisible sans JavaScript. */

/* ---------- Index : aperçu de l'image au survol d'une série ---------- */
(function () {
    var preview = document.querySelector(".preview");
    if (!preview) return;

    var img = preview.querySelector("img");

    document.querySelectorAll("[data-preview]").forEach(function (link) {
        link.addEventListener("mouseenter", function () {
            img.src = link.getAttribute("data-preview");
            preview.classList.add("is-visible");
        });
        link.addEventListener("mouseleave", function () {
            preview.classList.remove("is-visible");
        });
    });

    document.addEventListener("mousemove", function (e) {
        var w = preview.offsetWidth;
        var h = preview.offsetHeight;
        var x = Math.min(e.clientX + 24, window.innerWidth - w - 16);
        var y = Math.min(Math.max(e.clientY - h / 2, 16), window.innerHeight - h - 16);
        preview.style.transform = "translate(" + x + "px," + y + "px)";
    });
})();

/* ---------- Série : une image à la fois, clic / flèches / index ---------- */
(function () {
    var viewer = document.querySelector(".viewer");
    if (!viewer) return;

    var slides = Array.prototype.slice.call(viewer.querySelectorAll(".slide"));
    var counter = document.querySelector(".counter");
    var caption = document.querySelector(".bar-caption");
    var toggle = document.querySelector(".toggle-index");
    var current = 0;

    if (!slides.length) {
        if (toggle) toggle.remove();
        if (counter) counter.remove();
        return;
    }

    function pad(n) {
        return n < 10 ? "0" + n : String(n);
    }

    function show(i, updateHash) {
        current = (i + slides.length) % slides.length;
        slides.forEach(function (s, k) {
            s.classList.toggle("is-active", k === current);
        });
        var cap = slides[current].querySelector("figcaption");
        if (counter) counter.textContent = pad(current + 1) + " / " + pad(slides.length);
        if (caption) caption.textContent = cap ? cap.textContent : "";
        if (updateHash !== false) history.replaceState(null, "", "#" + (current + 1));

        // précharge l'image suivante
        var next = slides[(current + 1) % slides.length].querySelector("img");
        if (next && next.loading === "lazy") next.loading = "eager";
    }

    function setIndex(on) {
        viewer.classList.toggle("is-index", on);
        if (toggle) toggle.textContent = on ? "fermer" : "index";
        window.scrollTo(0, 0);
    }

    viewer.addEventListener("click", function (e) {
        if (viewer.classList.contains("is-index")) {
            var slide = e.target.closest(".slide");
            if (!slide) return;
            setIndex(false);
            show(slides.indexOf(slide));
            return;
        }
        var half = e.clientX < window.innerWidth / 2;
        show(current + (half ? -1 : 1));
    });

    viewer.addEventListener("mousemove", function (e) {
        viewer.classList.toggle("cursor-prev", e.clientX < window.innerWidth / 2);
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") show(current + 1);
        else if (e.key === "ArrowLeft") show(current - 1);
        else if (e.key === "Escape") setIndex(false);
    });

    if (toggle) {
        toggle.addEventListener("click", function () {
            setIndex(!viewer.classList.contains("is-index"));
        });
    }

    var start = parseInt(location.hash.slice(1), 10);
    show(start > 0 && start <= slides.length ? start - 1 : 0, false);
})();

/* ---------- E-mail : l'adresse n'apparaît jamais en clair dans le code ---------- */
document.addEventListener("click", function (e) {
    var link = e.target.closest(".js-mail");
    if (!link) return;
    e.preventDefault();
    window.location.href = "mailto:" + link.getAttribute("data-m").split("").reverse().join("");
});
