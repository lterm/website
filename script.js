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
    // [x, y] en paysage. En portrait, les coordonnées sont transposées,
    // sauf si l'entrée donne une 3e et 4e valeur : la position [x, y] en portrait.
    var CENTERS = [[0.18, 0.28], [0.48, 0.2], [0.82, 0.38, 0.22, 0.85], [0.78, 0.7], [0.5, 0.8], [0.2, 0.72]];

    var W, H, vb, state = { t: -1, b: -1, p: -1 }, floating = [], themeEls = [], branchEls = [], starEls = [], linkEls = [], rampEls = [];

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
            var px = c.length > 2 ? c[2] : c[1], py = c.length > 2 ? c[3] : c[0]; // position en portrait
            th.x = (portrait ? px : c[0]) * W; th.y = (portrait ? py : c[1]) * H;
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
            a.addEventListener("click", function (e) {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; // nouvel onglet : page de la série
                e.preventDefault();
                openPhoto(idx); // un seul clic ou toucher ouvre la photo
            });
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
        // Les libellés et les étoiles gardent leur taille à l'écran : la marge qui leur est laissée
        // se compte donc en pixels d'écran, pas en proportion du groupe (sinon, sur téléphone,
        // le zoom reste faible et tout s'entasse au milieu).
        var mx = Math.min(40, W * 0.08), my = Math.min(48, H * 0.08); // les noms s'écrivent vers l'intérieur du groupe
        var z = Math.min((W - 2 * mx) / Math.max(x1 - x0, 1), (H - 2 * my) / Math.max(y1 - y0, 1), 6);
        z = Math.max(z, 1);
        var w = W / z, h = H / z, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
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

    // Adresses : #theme, #theme/branche, et #theme[/branche]/n pour la n-ième photo de ce groupe
    function fromHash() {
        var parts = decodeURIComponent(location.hash.slice(1)).split("/"), t = -1, b = -1, p = -1;
        if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) p = +parts.pop() - 1;
        data.themes.forEach(function (th, i) { if (th.id === parts[0]) t = i; });
        if (t >= 0 && parts[1]) data.themes[t].branches.forEach(function (br, k) { if (br.id === parts[1]) b = k; });
        if (t < 0 || p >= group(t, b).length) p = -1;
        state = { t: t, b: b, p: p };
    }

    function group(t, b) { // indices des photos d'un thème ou d'une branche, dans l'ordre
        var list = [];
        data.photos.forEach(function (q, i) { if (q.t === t && (b < 0 || q.b === b)) list.push(i); });
        return list;
    }

    function base(t, b) {
        return data.themes[t].id + (b >= 0 ? "/" + data.themes[t].branches[b].id : "");
    }

    function up() {
        if (state.p >= 0) { location.hash = base(state.t, state.b); return; } // ferme la photo
        if (state.t < 0) return;
        location.hash = state.b >= 0 ? data.themes[state.t].id : "";
    }

    // ---------- photo ouverte par-dessus la carte ----------
    var ui = data.ui, lastFocus = null, openedAt = 0;
    var box = document.createElement("div");
    box.className = "sky-photo";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.innerHTML = '<figure class="sky-photo-fig"><img alt=""></figure>' +
        '<div class="bar sky-photo-bar"><a class="sky-photo-series"></a><span class="bar-caption sky-photo-cap"></span>' +
        '<button type="button" class="sky-photo-prev">←</button><span class="counter sky-photo-count"></span>' +
        '<button type="button" class="sky-photo-next">→</button><button type="button" class="sky-photo-close"></button></div>';
    document.body.appendChild(box);
    var fig = box.querySelector("figure"), photo = box.querySelector("img");
    var seriesLink = box.querySelector(".sky-photo-series"), cap = box.querySelector(".sky-photo-cap");
    var count = box.querySelector(".sky-photo-count"), closeBtn = box.querySelector(".sky-photo-close");
    box.querySelector(".sky-photo-prev").setAttribute("aria-label", ui.prev);
    box.querySelector(".sky-photo-next").setAttribute("aria-label", ui.next);
    closeBtn.textContent = ui.close;
    function pad(n) { return (n < 10 ? "0" : "") + n; }

    function openPhoto(idx) {
        var p = data.photos[idx], t = state.t, b = state.b;
        // reste dans le thème ou la branche en cours si la photo en fait partie, sinon prend son thème
        if (t !== p.t || (b >= 0 && b !== p.b)) { t = p.t; b = -1; }
        lastFocus = document.activeElement;
        location.hash = base(t, b) + "/" + (group(t, b).indexOf(idx) + 1);
    }

    function step(d) {
        var n = group(state.t, state.b).length;
        location.hash = base(state.t, state.b) + "/" + ((state.p + d + n) % n + 1);
    }

    function showPhoto() {
        if (state.p < 0) {
            if (!box.hidden) {
                box.hidden = true;
                if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
            }
            return;
        }
        var list = group(state.t, state.b), p = data.photos[list[state.p]];
        photo.src = p.src;
        photo.alt = p.series + ", " + p.n + (p.cap ? " — " + p.cap : "");
        box.setAttribute("aria-label", photo.alt);
        seriesLink.href = p.href;
        seriesLink.textContent = ui.series + " " + p.series;
        cap.textContent = p.cap || "";
        count.textContent = pad(state.p + 1) + " / " + pad(list.length);
        var next = data.photos[list[(state.p + 1) % list.length]];
        if (next) new Image().src = next.src; // précharge la suivante
        if (box.hidden) { box.hidden = false; openedAt = Date.now(); closeBtn.focus(); }
        if (preview) preview.classList.remove("is-visible");
    }

    fig.addEventListener("click", function (e) {
        if (Date.now() - openedAt < 450) return; // le 2e clic d'un double clic ne fait pas défiler
        var r = fig.getBoundingClientRect();
        step(e.clientX < r.left + r.width / 2 ? -1 : 1);
    });
    fig.addEventListener("mousemove", function (e) {
        var r = fig.getBoundingClientRect();
        fig.classList.toggle("cursor-prev", e.clientX < r.left + r.width / 2);
    });
    box.querySelector(".sky-photo-prev").addEventListener("click", function () { step(-1); });
    box.querySelector(".sky-photo-next").addEventListener("click", function () { step(1); });
    closeBtn.addEventListener("click", up);

    window.addEventListener("hashchange", function () { fromHash(); apply(true); showPhoto(); });
    svg.addEventListener("click", function (e) { if (!e.target.closest("a")) up(); });
    // légende : ouverte par le bouton de la barre, fermée par Échap ou un clic à côté
    var legend = document.getElementById("sky-legend");
    var legendBtn = document.querySelector(".sky-legend-toggle");
    function setLegend(open) {
        if (!legend || !legendBtn) return;
        legend.hidden = !open;
        legendBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (legendBtn) legendBtn.addEventListener("click", function () { setLegend(legend.hidden); });
    document.addEventListener("click", function (e) {
        if (legend && !legend.hidden && !legend.contains(e.target) && e.target !== legendBtn) setLegend(false);
    }, true);

    document.addEventListener("keydown", function (e) {
        if (state.p >= 0 && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { step(e.key === "ArrowLeft" ? -1 : 1); return; }
        if (e.key !== "Escape") return;
        if (legend && !legend.hidden) { setLegend(false); legendBtn.focus(); return; }
        up();
    });

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
    showPhoto();
    var timer;
    window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(layout, 150); });
})();
