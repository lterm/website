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
        if (toggle) toggle.textContent = toggle.getAttribute(on ? "data-close" : "data-open");
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

/* ---------- Thème : sombre par défaut, clair si le visiteur le choisit ---------- */
(function () {
    var button = document.querySelector(".theme-toggle");
    if (!button) return;
    var root = document.documentElement;

    function current() {
        return root.getAttribute("data-theme") || "dark";
    }

    function render() {
        // le bouton affiche le thème vers lequel on bascule
        button.textContent = button.getAttribute(current() === "dark" ? "data-light" : "data-dark");
    }

    button.hidden = false;
    render();

    button.addEventListener("click", function () {
        var next = current() === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) {}
        render();
    });

})();

/* ---------- Constellation : chaque photo est une étoile, chaque série une constellation ---------- */
(function () {
    var sky = document.querySelector(".sky");
    if (!sky) return;

    var data = JSON.parse(document.getElementById("sky-data").textContent);
    var svg = sky.querySelector("svg");
    var preview = document.querySelector(".preview");
    var previewImg = preview && preview.querySelector("img");
    var ra = document.querySelector(".sky-ra");
    var de = document.querySelector(".sky-de");
    var info = document.querySelector(".sky-info");
    var NS = "http://www.w3.org/2000/svg";

    // positions des constellations (paysage), dans l'ordre de l'index
    var CENTERS = [[0.14, 0.22], [0.42, 0.14], [0.76, 0.24], [0.62, 0.52], [0.30, 0.46],
                   [0.12, 0.72], [0.40, 0.80], [0.68, 0.84], [0.88, 0.60]];

    function rng(seed) { // générateur pseudo-aléatoire reproductible
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function el(name, attrs, parent) {
        var e = document.createElementNS(NS, name);
        for (var k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }

    function symbol(g, cam) { // ○ Nikon, × Leica, ⊙ Lomo, ⊗ Yashica, □ Olympus
        var r = 5.5;
        if (cam === "olympus") el("rect", { x: -4.6, y: -4.6, width: 9.2, height: 9.2, "class": "sym" }, g);
        else if (cam !== "leica") el("circle", { r: r, "class": "sym" }, g);
        if (cam === "leica" || cam === "yashica") {
            var d = cam === "leica" ? 5.5 : 3.9;
            el("path", { d: "M" + -d + " " + -d + "L" + d + " " + d + "M" + d + " " + -d + "L" + -d + " " + d, "class": "sym" }, g);
        }
        if (cam === "lomo") el("circle", { r: 1.6, "class": "sym-fill" }, g);
        el("circle", { r: 13, "class": "hit" }, g);
    }

    function show(text) { if (info) info.textContent = text; }

    function render() {
        var W = sky.clientWidth, H = sky.clientHeight;
        var portrait = H > W;
        var unit = Math.min(W, H);
        svg.setAttribute("viewBox", "0 0 " + W + " " + H);
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        // fond : une grille d'étoiles, quelques-unes manquantes
        var rand = rng(3), d = "", step = 30;
        for (var y = step / 2; y < H; y += step)
            for (var x = step / 2; x < W; x += step)
                if (rand() > 0.38) d += "M" + x + " " + y + "h0";
        el("path", { d: d, "class": "grid" }, svg);

        var lines = el("g", { "class": "links" }, svg);
        var stars = el("g", {}, svg);
        var labels = el("g", {}, svg);
        var placed = [], centers = [];

        data.series.forEach(function (s, i) {
            var c = CENTERS[i % CENTERS.length];
            var cx = (portrait ? c[1] : c[0]) * W, cy = (portrait ? c[0] : c[1]) * H;
            centers.push([cx, cy]);
            placed.push([cx, cy]);
        });

        // lignes entre les constellations
        el("polyline", { points: centers.map(function (p) { return p.join(","); }).join(" "), "class": "link" }, lines);

        var r = rng(11);
        data.photos.forEach(function (p) {
            var c = centers[p.s], x, y, ok = false;
            for (var tries = 0; tries < 60 && !ok; tries++) {
                var a = r() * Math.PI * 2, dist = unit * (0.045 + r() * 0.12);
                x = c[0] + Math.cos(a) * dist; y = c[1] + Math.sin(a) * dist * 0.8;
                ok = x > 12 && x < W - 12 && y > 12 && y < H - 12 &&
                     placed.every(function (q) { return Math.hypot(q[0] - x, q[1] - y) > 20; });
            }
            placed.push([x, y]);
            var s = data.series[p.s];
            var a = el("a", { href: s.href + "#" + p.n, transform: "translate(" + x + " " + y + ")",
                              "class": "star", "data-s": p.s, "aria-label": s.title + ", " + p.n + (p.cap ? " — " + p.cap : "") }, stars);
            symbol(a, p.cam);
            var label = s.title + " — " + (p.n < 10 ? "0" : "") + p.n + (p.cap ? " — " + p.cap : "");
            function on() {
                svg.classList.add("is-focus"); svg.setAttribute("data-focus", p.s);
                focus(p.s);
                show(label);
                if (previewImg) { previewImg.src = p.src; preview.classList.add("is-visible"); }
            }
            function off() { focus(null); show(""); if (preview) preview.classList.remove("is-visible"); }
            a.addEventListener("mouseenter", on);
            a.addEventListener("focus", on);
            a.addEventListener("mouseleave", off);
            a.addEventListener("blur", off);
        });

        // une croix et le titre de chaque série
        var size = Math.max(15, Math.min(34, unit / 22));
        data.series.forEach(function (s, i) {
            var c = centers[i], right = c[0] > W * 0.6;
            var a = el("a", { href: s.href, "class": "anchor", "data-s": i }, labels);
            el("path", { d: "M" + (c[0] - 7) + " " + c[1] + "h14M" + c[0] + " " + (c[1] - 7) + "v14", "class": "cross" }, a);
            var below = portrait && right; // en portrait, évite que deux titres se chevauchent
            var t = el("text", { x: c[0] + (right ? -12 : 12), y: below ? c[1] + size + 4 : c[1] - 10, "text-anchor": right ? "end" : "start",
                                 "font-size": size, "class": "label" }, a);
            t.textContent = s.title;
            a.addEventListener("mouseenter", function () { focus(i); show(s.title + " — " + s.count); });
            a.addEventListener("focus", function () { focus(i); show(s.title + " — " + s.count); });
            a.addEventListener("mouseleave", function () { focus(null); show(""); });
            a.addEventListener("blur", function () { focus(null); show(""); });
        });
    }

    function focus(i) { // met une constellation en avant, estompe les autres
        svg.querySelectorAll("[data-s]").forEach(function (n) {
            n.classList.toggle("is-dim", i !== null && String(i) !== n.getAttribute("data-s"));
        });
    }

    sky.addEventListener("mousemove", function (e) {
        var rect = sky.getBoundingClientRect();
        var fx = (e.clientX - rect.left) / rect.width, fy = (e.clientY - rect.top) / rect.height;
        var h = fx * 24, m = Math.floor((h % 1) * 60);
        if (ra) ra.textContent = Math.floor(h) + "h " + (m < 10 ? "0" : "") + m + "m";
        if (de) de.textContent = (fy < 0.5 ? "+" : "−") + Math.abs(90 - fy * 180).toFixed(2) + "°";
        if (preview) {
            var w = preview.offsetWidth, ph = preview.offsetHeight;
            var x = e.clientX + 24 + w > window.innerWidth - 16 ? e.clientX - w - 24 : e.clientX + 24;
            var y = Math.min(Math.max(e.clientY - ph / 2, 16), window.innerHeight - ph - 16);
            preview.style.transform = "translate(" + x + "px," + y + "px)";
        }
    });

    render();
    var timer;
    window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(render, 150); });
})();
