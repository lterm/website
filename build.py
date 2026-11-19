#!/usr/bin/env python3
"""Génère toutes les pages du site, en français (racine) et en anglais (dossier en/).

Usage : python3 build.py

Le contenu des séries (titres, sous-titres, photos, légendes) est dans
content/series.json. Le texte de la page à propos et les libellés de
l'interface sont dans ce fichier, dans TEXT et ABOUT.
Ne modifiez pas les fichiers .html à la main : ils sont écrasés à chaque génération.
"""
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
INSTAGRAM = "https://www.instagram.com/lucie_tmgn/"
MAIL = "rf.egnaro@nongimreteicul"  # adresse e-mail écrite à l'envers, remise à l'endroit par script.js

LANGS = {
    "fr": {"dir": "", "prefix": ""},
    "en": {"dir": "en", "prefix": "../"},
}

TEXT = {
    "fr": {
        "tagline": "travaux argentiques",
        "index": "index",
        "about": "à propos",
        "sky": "constellation",
        "sky_title": "Constellation",
        "sky_desc": "Toutes les photographies de Lucie Termignon, disposées comme une carte du ciel.",
        "sky_noscript": "Cette vue a besoin de JavaScript. Retrouvez les séries sur la page",
        "sky_label": "Carte des photographies : chaque série est une constellation, chaque photo une étoile.",
        "series": "Séries",
        "image": "image",
        "images": "images",
        "photo": "photographie",
        "close": "fermer",
        "dark": "sombre",
        "light": "clair",
        "theme_label": "Changer de thème",
        "other_lang": "EN",
        "other_lang_label": "EN — English version",
        "rights": "tous droits réservés",
        "email": "e-mail",
        "nav_label": "Navigation principale",
        "home_desc": "Séries photographiques argentiques de Lucie Termignon : villes, portraits, montagne, mer, hiver.",
        "about_desc": "La démarche photographique de Lucie Termignon : noir et blanc, montagne, littoral, ville.",
        "series_desc": "{title} : {subtitle}. Série de Lucie Termignon.",
    },
    "en": {
        "tagline": "film photography",
        "index": "index",
        "about": "about",
        "sky": "constellation",
        "sky_title": "Constellation",
        "sky_desc": "All of Lucie Termignon’s photographs, laid out like a sky chart.",
        "sky_noscript": "This view needs JavaScript. Browse the series on the",
        "sky_label": "Map of the photographs: each series is a constellation, each photo a star.",
        "series": "Series",
        "image": "image",
        "images": "images",
        "photo": "photograph",
        "close": "close",
        "dark": "dark",
        "light": "light",
        "theme_label": "Switch theme",
        "other_lang": "FR",
        "other_lang_label": "FR — version française",
        "rights": "all rights reserved",
        "email": "e-mail",
        "nav_label": "Main navigation",
        "home_desc": "Film photography series by Lucie Termignon: cities, portraits, mountains, sea, winter.",
        "about_desc": "Lucie Termignon’s photographic practice: black and white, mountains, coastline, cities.",
        "series_desc": "{title}: {subtitle}. A series by Lucie Termignon.",
    },
}

# Noms de lieux traduits dans les légendes anglaises
PLACES_EN = {
    "Londres": "London",
    "Pyrénées": "Pyrenees",
    "Îles Éoliennes": "Aeolian Islands",
    "Projet Berio": "Berio Project",
}

ABOUT = {
    "fr": {
        "title": "À propos",
        "lead": "Je photographie à l’argentique, en 35mm et en moyen format, surtout en noir et blanc&nbsp;: "
                "<span class=\"muted\">des contrastes francs, des ombres marquées, des silhouettes et des architectures graphiques.</span>",
        "rows": [
            ("Montagne", "Du GR20 à Bessans, de Chamonix aux Pyrénées&nbsp;: des sentiers, des crêtes enneigées, l’hiver."),
            ("Littoral", "La Côte d’Opale, des côtes rocheuses et leur phare, des horizons de mer réduits à une ligne."),
            ("Ville", "New York, Boston, Londres, Paris. Une photographie de rue, de passage."),
            ("Présences", "Des corps qui dansent, éclairés sur fond noir. Des concerts, un piano. Des proches, des intérieurs, la lumière d’une fenêtre."),
            ("Dates", "Certaines images portent leur moment&nbsp;: le Paris vide et masqué du confinement, l’Arc de Triomphe empaqueté par Christo en 2021."),
            ("Couleur et essais", "La couleur arrive avec les appareils Lomo et l’Olympus XA4. Ailleurs, l’expérimentation prend le dessus&nbsp;: "
                                  "traitement croisé aux tons bleutés, fuites de lumière, ombres qui deviennent abstraites."),
        ],
        "contact": "Contact",
        "contact_text": "Pour en savoir plus ou commander un tirage&nbsp;:",
        "mail_link": "m’écrire un e-mail",
        "instagram": "sur Instagram",
    },
    "en": {
        "title": "About",
        "lead": "I shoot film, in 35mm and medium format, mostly in black and white: "
                "<span class=\"muted\">strong contrasts, deep shadows, silhouettes and graphic architecture.</span>",
        "rows": [
            ("Mountains", "From the GR20 to Bessans, from Chamonix to the Pyrenees: trails, snowy ridges, winter."),
            ("Coastline", "The Côte d’Opale, rocky shores and their lighthouse, sea horizons reduced to a single line."),
            ("Cities", "New York, Boston, London, Paris. Street photography, in passing."),
            ("Presences", "Dancing bodies lit against black. Concerts, a piano. Close ones, interiors, the light from a window."),
            ("Dates", "Some images carry their moment: Paris empty and masked during lockdown, the Arc de Triomphe wrapped by Christo in 2021."),
            ("Colour and experiments", "Colour comes with the Lomo cameras and the Olympus XA4. Elsewhere, experimentation takes over: "
                                       "bluish cross-processing, light leaks, shadows turning abstract."),
        ],
        "contact": "Contact",
        "contact_text": "To find out more or to order a print:",
        "mail_link": "send me an e-mail",
        "instagram": "on Instagram",
    },
}

# Appliqué avant l'affichage pour éviter un flash de la mauvaise couleur
HEAD_SCRIPT = (
    "<script>(function(){var d=document.documentElement;d.classList.add(\"js\");"
    "try{var t=localStorage.getItem(\"theme\");if(t===\"dark\"||t===\"light\")d.setAttribute(\"data-theme\",t);}catch(e){}})();</script>"
)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def translate_caption(caption, lang):
    if lang == "fr":
        return caption
    for fr, en in PLACES_EN.items():
        caption = caption.replace(fr, en)
    return caption


def head(lang, page, title, desc):
    p = LANGS[lang]["prefix"]
    fr_href = ("" if lang == "fr" else "../") + page
    en_href = ("en/" if lang == "fr" else "") + page
    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(title)}</title>
    <meta name="description" content="{esc(desc)}">
    <meta name="color-scheme" content="light dark">
    <link rel="alternate" hreflang="fr" href="{fr_href}">
    <link rel="alternate" hreflang="en" href="{en_href}">
    <link rel="stylesheet" href="{p}style.css">
    {HEAD_SCRIPT}
    <script src="{p}script.js" defer></script>
</head>
<body>
'''


def header(lang, page, current):
    t = TEXT[lang]
    other = ("en/" if lang == "fr" else "../") + page
    other_lang = "en" if lang == "fr" else "fr"
    cur = lambda name: ' aria-current="page"' if current == name else ""
    return f'''    <header class="site-header">
        <a class="site-title" href="index.html">
            <span>Lucie Termignon</span>
            <span class="muted">{t["tagline"]}</span>
        </a>
        <nav class="site-nav" aria-label="{t["nav_label"]}">
            <a href="index.html"{cur("index")}>{t["index"]}</a>
            <a href="constellation.html"{cur("sky")}>{t["sky"]}</a>
            <a href="a-propos.html"{cur("about")}>{t["about"]}</a>
            <a class="nav-end" href="{INSTAGRAM}" rel="me">instagram</a>
            <a href="{other}" hreflang="{other_lang}" lang="{other_lang}" aria-label="{t["other_lang_label"]}">{t["other_lang"]}</a>
            <button type="button" class="theme-toggle" hidden aria-label="{t["theme_label"]}" data-dark="{t["dark"]}" data-light="{t["light"]}"></button>
        </nav>
    </header>
'''


def footer(lang):
    t = TEXT[lang]
    return f'''    <footer class="site-footer">
        <span>&copy; 2026 Lucie Termignon — {t["rights"]}</span>
        <span class="footer-links">
            <a class="js-mail" href="a-propos.html" data-m="{MAIL}">{t["email"]}</a>
            <a href="{INSTAGRAM}" rel="me">instagram</a>
        </span>
    </footer>
</body>
</html>
'''


def build_index(lang, series):
    t = TEXT[lang]
    p = LANGS[lang]["prefix"]
    rows = []
    for s in series:
        n = len(s["images"])
        txt = s[lang]
        rows.append(f'''            <li>
                <a class="series" href="{s["slug"]}.html" data-preview="{p}images/{s["images"][0]["src"]}">
                    <span class="series-meta">{esc(s["cameras"])}</span>
                    <span class="series-meta series-meta--right">{n:02d} {t["image"] if n == 1 else t["images"]}</span>
                    <h2 class="series-title">{esc(txt["title"])}
                        <span class="muted">{esc(txt["subtitle"])}</span>
                    </h2>
                </a>
            </li>''')
    rows = "\n".join(rows)
    return (head(lang, "index.html", "Lucie Termignon — " + t["tagline"], t["home_desc"])
            + header(lang, "index.html", "index")
            + f'''    <main class="page">
        <p class="section-label">{t["series"]}</p>
        <ul class="series-list">
{rows}
        </ul>
    </main>
    <div class="preview" aria-hidden="true"><img src="" alt=""></div>
''' + footer(lang))


def build_series(lang, s):
    t = TEXT[lang]
    p = LANGS[lang]["prefix"]
    txt = s[lang]
    page = s["slug"] + ".html"
    figs = []
    for i, img in enumerate(s["images"]):
        alt = f'{txt["title"]}, {t["photo"]} {i + 1}'
        figs.append(f'''        <figure class="slide">
            <img src="{p}images/{img["src"]}" alt="{esc(alt)}" loading="{"eager" if i == 0 else "lazy"}" decoding="async">
            <figcaption>{esc(translate_caption(img["caption"], lang))}</figcaption>
        </figure>''')
    figs = "\n".join(figs)
    desc = t["series_desc"].format(title=txt["title"], subtitle=txt["subtitle"])
    return (head(lang, page, f'{txt["title"]} — Lucie Termignon', desc)
            + header(lang, page, None)
            + f'''    <main class="viewer" aria-label="{esc(txt["title"])}">
{figs}
    </main>
    <div class="bar">
        <h1>{esc(txt["title"])}</h1>
        <span class="bar-format">{esc(s["cameras"])}</span>
        <span class="bar-caption"></span>
        <span class="counter no-js-hide"></span>
        <button type="button" class="toggle-index no-js-hide" data-open="{t["index"]}" data-close="{t["close"]}">{t["index"]}</button>
    </div>
</body>
</html>
''')


def build_about(lang):
    t = TEXT[lang]
    a = ABOUT[lang]
    rows = "\n".join(f'''            <div class="about-row">
                <dt>{dt}</dt>
                <dd>{dd}</dd>
            </div>''' for dt, dd in a["rows"])
    return (head(lang, "a-propos.html", f'{a["title"]} — Lucie Termignon', t["about_desc"])
            + header(lang, "a-propos.html", "about")
            + f'''    <main class="page about">
        <h1 class="visually-hidden">{a["title"]}</h1>
        <div class="about-text">
            <p>{a["lead"]}</p>
        </div>

        <dl class="about-rows">
{rows}
            <div class="about-row about-row--contact">
                <dt>{a["contact"]}</dt>
                <dd>{a["contact_text"]}<br>
                    <a class="js-mail" href="#" data-m="{MAIL}">{a["mail_link"]}</a><br>
                    <a href="{INSTAGRAM}" rel="me">@lucie_tmgn</a> {a["instagram"]}</dd>
            </div>
        </dl>
    </main>
''' + footer(lang))


CAMERA_KEYS = [("Nikon", "nikon"), ("Leica", "leica"), ("Lomo", "lomo"), ("Yashica", "yashica")]


def camera_of(caption, series_cameras):
    for name, key in CAMERA_KEYS:
        if name in caption:
            return key
    for name, key in CAMERA_KEYS:  # pas d'appareil dans la légende : celui de la série
        if series_cameras.startswith(name):
            return key
    return "nikon"


def build_sky(lang, series):
    t = TEXT[lang]
    p = LANGS[lang]["prefix"]
    data = {"series": [], "photos": []}
    for i, s in enumerate(series):
        n = len(s["images"])
        data["series"].append({"title": s[lang]["title"], "href": s["slug"] + ".html",
                               "count": f'{n:02d} {t["image"] if n == 1 else t["images"]}'})
        for k, img in enumerate(s["images"]):
            data["photos"].append({"s": i, "n": k + 1, "src": p + "images/" + img["src"],
                                   "cap": translate_caption(img["caption"], lang),
                                   "cam": camera_of(img["caption"], s["cameras"])})
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    return (head(lang, "constellation.html", f'{t["sky_title"]} — Lucie Termignon', t["sky_desc"])
            + header(lang, "constellation.html", "sky")
            + f'''    <main>
        <h1 class="visually-hidden">{t["sky_title"]}</h1>
        <div class="sky">
            <svg role="img" aria-label="{esc(t["sky_label"])}"></svg>
            <noscript><p class="sky-noscript">{t["sky_noscript"]} <a href="index.html">{t["index"]}</a>.</p></noscript>
        </div>
    </main>
    <script type="application/json" id="sky-data">{payload}</script>
    <div class="preview" aria-hidden="true"><img src="" alt=""></div>
    <div class="bar">
        <span class="sky-coord">RA&nbsp;<span class="sky-ra">—</span></span>
        <span class="sky-coord">DE&nbsp;<span class="sky-de">—</span></span>
        <span class="sky-info" aria-live="polite"></span>
        <span>{len(data["photos"])} {t["images"]}</span>
    </div>
</body>
</html>
''')


def write(lang, name, content):
    folder = os.path.join(ROOT, LANGS[lang]["dir"])
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, name), "w", encoding="utf-8") as f:
        f.write(content)


def main():
    with open(os.path.join(ROOT, "content", "series.json"), encoding="utf-8") as f:
        series = json.load(f)
    for lang in LANGS:
        write(lang, "index.html", build_index(lang, series))
        write(lang, "a-propos.html", build_about(lang))
        write(lang, "constellation.html", build_sky(lang, series))
        for s in series:
            write(lang, s["slug"] + ".html", build_series(lang, s))
    print(f"{len(series)} séries, {2 * (len(series) + 3)} pages générées.")


if __name__ == "__main__":
    main()
