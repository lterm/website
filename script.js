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

/* ---------- Constellation à plusieurs niveaux ----------
   Niveau 0 : les thèmes. Niveau 1 (#theme) : ses branches. Niveau 2 (#theme/branche) : ses photos.
   Les étoiles gardent leur taille à l'écran : seul l'espace entre elles s'agrandit quand on zoome. */
(function () {
    var sky = document.querySelector(".sky");
    if (!sky) return;

    var data = JSON.parse(document.getElementById("sky-data").textContent);
    var svg = sky.querySelector("svg");
    var preview = document.querySelector(".preview");
    var previewImg = preview && preview.querySelector("img");
    var ra = document.querySelector(".sky-ra"), de = document.querySelector(".sky-de");
    var crumbs = document.querySelector(".sky-crumbs"), info = document.querySelector(".sky-info");
    var NS = "http://www.w3.org/2000/svg";
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // centres des thèmes (paysage), dans l'ordre de content/constellation.json
    var CENTERS = [[0.18, 0.28], [0.48, 0.2], [0.8, 0.26], [0.78, 0.7], [0.5, 0.8], [0.2, 0.72], [0.40, 0.56]];

    var W, H, vb, state = { t: -1, b: -1 }, floating = [], themeEls = [], branchEls = [], starEls = [], linkEls = [], rampEls = [];

    function rng(seed) {
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
        if (cam === "olympus") el("rect", { x: -4.6, y: -4.6, width: 9.2, height: 9.2, "class": "sym" }, g);
        else if (cam !== "leica") el("circle", { r: 5.5, "class": "sym" }, g);
        if (cam === "leica" || cam === "yashica") {
            var d = cam === "leica" ? 5.5 : 3.9;
            el("path", { d: "M" + -d + " " + -d + "L" + d + " " + d + "M" + d + " " + -d + "L" + -d + " " + d, "class": "sym" }, g);
        }
        if (cam === "lomo") el("circle", { r: 1.6, "class": "sym-fill" }, g);
        el("circle", { r: 13, "class": "hit" }, g);
    }

    function anchor(parent, x, y, href, text, size, right, cls) {
        var a = el("a", { href: href, "class": "anchor " + cls }, parent);
        var g = el("g", {}, a); // contenu à taille fixe à l'écran
        el("path", { d: "M-7 0h14M0 -7v14", "class": "cross" }, g);
        var label = el("text", { x: right ? -12 : 12, y: -10, "text-anchor": right ? "end" : "start", "font-size": size, "class": "label" }, g);
        label.textContent = text;
        floating.push({ node: g, x: x, y: y });
        return a;
    }

    function layout() {
        animId++;
        W = sky.clientWidth; H = sky.clientHeight;
        var portrait = H > W, unit = Math.min(W, H);
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        floating = []; themeEls = []; branchEls = []; starEls = []; linkEls = []; rampEls = [];

        var gLinks = el("g", {}, svg), gRamps = el("g", {}, svg), gStars = el("g", {}, svg), gBranches = el("g", {}, svg), gThemes = el("g", {}, svg);
        var rand = rng(5), placed = [];

        // positions des thèmes et des branches
        data.themes.forEach(function (th, i) {
            var c = CENTERS[i % CENTERS.length];
            th.x = (portrait ? c[1] : c[0]) * W; th.y = (portrait ? c[0] : c[1]) * H;
            var n = th.branches.length, start = rand() * Math.PI * 2;
            th.branches.forEach(function (br, k) {
                var a = start + k * Math.PI * 2 / n, r = unit * (0.1 + rand() * 0.03);
                br.x = th.x + Math.cos(a) * r; br.y = th.y + Math.sin(a) * r * 0.85;
                placed.push([br.x, br.y]);
            });
            placed.push([th.x, th.y]);
        });

        // lignes entre thèmes, et ramifications thème → branches
        el("polyline", { points: data.themes.map(function (t) { return t.x + "," + t.y; }).join(" "), "class": "link" }, gRamps);
        data.themes.forEach(function (th, i) {
            th.branches.forEach(function (br, k) {
                rampEls.push(el("line", { x1: th.x, y1: th.y, x2: br.x, y2: br.y, "class": "ramp", "data-t": i, "data-b": k }, gRamps));
            });
        });

        // étoiles
        var r = rng(11);
        data.photos.forEach(function (p, idx) {
            var th = data.themes[p.t], c = p.b >= 0 ? th.branches[p.b] : th;
            var spread = p.b >= 0 ? [0.018, 0.045] : [0.03, 0.11], x, y, ok = false;
            for (var tries = 0; tries < 80 && !ok; tries++) {
                var a = r() * Math.PI * 2, dist = unit * (spread[0] + r() * (spread[1] - spread[0]));
                x = c.x + Math.cos(a) * dist; y = c.y + Math.sin(a) * dist;
                ok = x > 10 && x < W - 10 && y > 10 && y < H - 10 &&
                     placed.every(function (q) { return Math.hypot(q[0] - x, q[1] - y) > 13; });
            }
            placed.push([x, y]);
            p.x = x; p.y = y;

            if (p.lt >= 0) { // ramification en pointillé vers une autre branche
                var to = p.lb >= 0 ? data.themes[p.lt].branches[p.lb] : data.themes[p.lt];
                linkEls.push(el("line", { x1: x, y1: y, x2: to.x, y2: to.y, "class": "xlink", "data-t": p.t, "data-lt": p.lt, "data-i": idx }, gLinks));
            }

            var a = el("a", { href: p.href, "class": p.col >= 0 ? "star is-color" : "star", "data-t": p.t, "data-b": p.b,
                              "aria-label": p.series + ", " + p.n + (p.cap ? " — " + p.cap : "") }, gStars);
            var g = el("g", {}, a);
            if (p.col >= 0) a.style.setProperty("--h", p.col); // teinte dominante de la photo
            symbol(g, p.cam);
            floating.push({ node: g, x: x, y: y, star: true });
            starEls.push(a);

            var label = p.series + " — " + (p.n < 10 ? "0" : "") + p.n + (p.cap ? " — " + p.cap : "");
            function on() {
                if (info) info.textContent = label;
                linkEls.forEach(function (l) { l.classList.toggle("is-hot", l.getAttribute("data-i") == idx); });
                if (previewImg) { previewImg.src = p.src; preview.classList.add("is-visible"); }
            }
            function off() {
                if (info) info.textContent = "";
                linkEls.forEach(function (l) { l.classList.remove("is-hot"); });
                if (preview) preview.classList.remove("is-visible");
            }
            a.addEventListener("mouseenter", on); a.addEventListener("focus", on);
            a.addEventListener("mouseleave", off); a.addEventListener("blur", off);
        });

        // libellés des branches puis des thèmes
        var big = Math.max(15, Math.min(34, unit / 22)), small = Math.max(13, Math.min(17, unit / 45));
        data.themes.forEach(function (th, i) {
            th.branches.forEach(function (br, k) {
                var a = anchor(gBranches, br.x, br.y, "#" + th.id + "/" + br.id, br.title, small, br.x > th.x, "branch");
                a.setAttribute("data-t", i); a.setAttribute("data-b", k);
                branchEls.push(a);
            });
            var a = anchor(gThemes, th.x, th.y, "#" + th.id, th.title, big, th.x > W * 0.6, "theme");
            a.setAttribute("data-t", i);
            themeEls.push(a);
        });

        apply(false);
    }

    // ---------- zoom ----------
    function target() {
        if (state.t < 0) return [0, 0, W, H];
        var th = data.themes[state.t], pts = [];
        data.photos.forEach(function (p) {
            if (p.t === state.t && (state.b < 0 || p.b === state.b)) pts.push([p.x, p.y]);
        });
        if (state.b < 0) { pts.push([th.x, th.y]); th.branches.forEach(function (b) { pts.push([b.x, b.y]); }); }
        else pts.push([th.branches[state.b].x, th.branches[state.b].y]);
        var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        pts.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
        // marge proportionnelle au groupe, plus de place à gauche et à droite pour les libellés
        var size = Math.max(x1 - x0, y1 - y0, Math.min(W, H) * 0.08);
        x0 -= size * 0.35; x1 += size * 0.35; y0 -= size * 0.25; y1 += size * 0.15;
        var w = Math.max(x1 - x0, W / 8), h = Math.max(y1 - y0, H / 8), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        if (w / h < W / H) w = h * W / H; else h = w * H / W; // garder les proportions de l'écran
        return [cx - w / 2, cy - h / 2, w, h];
    }

    function draw(box) {
        vb = box;
        svg.setAttribute("viewBox", box.join(" "));
        var k = box[2] / W; // 1 / facteur de zoom
        var ks = k * (state.b >= 0 ? 1.4 : 1); // étoiles un peu plus grandes au niveau le plus proche
        floating.forEach(function (f) {
            f.node.setAttribute("transform", "translate(" + f.x + " " + f.y + ") scale(" + (f.star ? ks : k) + ")");
        });
    }

    var animId = 0; // une nouvelle animation (ou mise en page) interrompt la précédente
    function animate(to) {
        var from = vb || [0, 0, W, H], id = ++animId;
        if (reduced) return draw(to);
        var t0 = performance.now(), dur = 520;
        (function step(now) {
            if (id !== animId) return;
            var u = Math.min(1, (now - t0) / dur), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
            draw(from.map(function (v, i) { return v + (to[i] - v) * e; }));
            if (u < 1) requestAnimationFrame(step);
        })(t0);
    }

    function apply(anim) {
        var t = state.t, b = state.b;
        sky.setAttribute("data-level", t < 0 ? 0 : b < 0 ? 1 : 2);
        function dim(n, keep) { n.classList.toggle("is-dim", !keep); }
        themeEls.forEach(function (n, i) { dim(n, t < 0 || i === t); });
        branchEls.forEach(function (n) {
            var on = t >= 0 && +n.getAttribute("data-t") === t;
            n.classList.toggle("is-hidden", !on);
            n.setAttribute("tabindex", on ? "0" : "-1");
            n.setAttribute("aria-hidden", on ? "false" : "true");
            dim(n, !on || b < 0 || +n.getAttribute("data-b") === b);
        });
        rampEls.forEach(function (n) { dim(n, t < 0 || +n.getAttribute("data-t") === t); });
        starEls.forEach(function (n) {
            dim(n, t < 0 || (+n.getAttribute("data-t") === t && (b < 0 || +n.getAttribute("data-b") === b)));
        });
        linkEls.forEach(function (n) {
            n.classList.toggle("is-on", t >= 0 && (+n.getAttribute("data-t") === t || +n.getAttribute("data-lt") === t));
        });

        if (crumbs) {
            crumbs.innerHTML = "";
            var parts = [[data.home, "#"]];
            if (t >= 0) parts.push([data.themes[t].title, "#" + data.themes[t].id]);
            if (b >= 0) parts.push([data.themes[t].branches[b].title, "#" + data.themes[t].id + "/" + data.themes[t].branches[b].id]);
            parts.forEach(function (p, i) {
                if (i) crumbs.appendChild(document.createTextNode(" › "));
                var a = document.createElement("a"); a.href = p[1]; a.textContent = p[0];
                if (i === parts.length - 1) a.setAttribute("aria-current", "location");
                crumbs.appendChild(a);
            });
        }
        if (info) info.textContent = t < 0 ? "" : (b < 0 ? data.themes[t].count : data.themes[t].branches[b].count);
        anim ? animate(target()) : draw(target());
    }

    function fromHash() {
        var parts = decodeURIComponent(location.hash.slice(1)).split("/"), t = -1, b = -1;
        data.themes.forEach(function (th, i) { if (th.id === parts[0]) t = i; });
        if (t >= 0 && parts[1]) data.themes[t].branches.forEach(function (br, k) { if (br.id === parts[1]) b = k; });
        state = { t: t, b: b };
    }

    function up() {
        if (state.t < 0) return;
        location.hash = state.b >= 0 ? data.themes[state.t].id : "";
    }

    window.addEventListener("hashchange", function () { fromHash(); apply(true); });
    svg.addEventListener("click", function (e) { if (!e.target.closest("a")) up(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") up(); });

    sky.addEventListener("mousemove", function (e) {
        var rect = sky.getBoundingClientRect();
        var fx = (vb[0] + (e.clientX - rect.left) / rect.width * vb[2]) / W;
        var fy = (vb[1] + (e.clientY - rect.top) / rect.height * vb[3]) / H;
        var h = Math.max(0, Math.min(23.999, fx * 24)), m = Math.floor((h % 1) * 60);
        if (ra) ra.textContent = Math.floor(h) + "h " + (m < 10 ? "0" : "") + m + "m";
        if (de) de.textContent = (fy < 0.5 ? "+" : "−") + Math.abs(90 - fy * 180).toFixed(2) + "°";
        if (preview) {
            var w = preview.offsetWidth, ph = preview.offsetHeight;
            var x = e.clientX + 24 + w > window.innerWidth - 16 ? e.clientX - w - 24 : e.clientX + 24;
            var y = Math.min(Math.max(e.clientY - ph / 2, 16), window.innerHeight - ph - 16);
            preview.style.transform = "translate(" + x + "px," + y + "px)";
        }
    });

    fromHash();
    layout();
    var timer;
    window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(layout, 150); });
})();
