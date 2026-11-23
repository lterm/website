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
        "sky_desc": "Photographies argentiques de Lucie Termignon, disposées comme une carte du ciel : villes, portraits, montagne, mer, essais.",
        "sky_noscript": "Cette vue a besoin de JavaScript. Retrouvez les séries sur la page",
        "sky_label": "Carte des photographies : chaque thème est une constellation, ses branches des lieux ou des catégories, chaque photo une étoile.",
        "sky_help": "Choisissez un thème puis une branche pour vous rapprocher. Échap revient en arrière.",
        "sky_crumbs": "Position dans la constellation",
        "legend": "légende",
        "legend_title": "Légende",
        "legend_items": [("nikon", "Nikon FM2"), ("leica", "Leica M3"), ("lomo", "Lomo"), ("yashica", "Yashica"),
                         ("olympus", "Olympus XA4"), ("color", "photo en couleur, dans sa teinte dominante"),
                         ("link", "lien vers un lieu"), ("node", "thème ou branche")],
        "series": "Séries",
        "image": "image",
        "images": "images",
        "photo": "photographie",
        "close": "fermer",
        "see_series": "voir la série",
        "prev_photo": "photo précédente",
        "next_photo": "photo suivante",
        "dark": "sombre",
        "light": "clair",
        "theme_label": "Changer de thème",
        "other_lang": "EN",
        "other_lang_label": "EN — English version",
        "rights": "tous droits réservés",
        "email": "e-mail",
        "nav_label": "Navigation principale",
        "home_desc": "Séries photographiques argentiques de Lucie Termignon : villes, portraits, montagne, mer, essais.",
        "about_desc": "La démarche photographique de Lucie Termignon : noir et blanc, montagne, littoral, ville.",
        "series_desc": "{title} : {subtitle}. Série de Lucie Termignon.",
    },
    "en": {
        "tagline": "film photography",
        "index": "index",
        "about": "about",
        "sky": "constellation",
        "sky_title": "Constellation",
        "sky_desc": "Film photographs by Lucie Termignon, laid out like a sky chart: cities, portraits, mountains, sea, experiments.",
        "sky_noscript": "This view needs JavaScript. Browse the series on the",
        "sky_label": "Map of the photographs: each theme is a constellation, its branches places or categories, each photo a star.",
        "sky_help": "Choose a theme, then a branch, to zoom in. Escape goes back.",
        "sky_crumbs": "Position in the constellation",
        "legend": "legend",
        "legend_title": "Legend",
        "legend_items": [("nikon", "Nikon FM2"), ("leica", "Leica M3"), ("lomo", "Lomo"), ("yashica", "Yashica"),
                         ("olympus", "Olympus XA4"), ("color", "colour photo, in its dominant hue"),
                         ("link", "link to a place"), ("node", "theme or branch")],
        "series": "Series",
        "image": "image",
        "images": "images",
        "photo": "photograph",
        "close": "close",
        "see_series": "see the series",
        "prev_photo": "previous photo",
        "next_photo": "next photo",
        "dark": "dark",
        "light": "light",
        "theme_label": "Switch theme",
        "other_lang": "FR",
        "other_lang_label": "FR — version française",
        "rights": "all rights reserved",
        "email": "e-mail",
        "nav_label": "Main navigation",
        "home_desc": "Film photography series by Lucie Termignon: cities, portraits, mountains, sea, experiments.",
        "about_desc": "Lucie Termignon’s photographic practice: black and white, mountains, coastline, cities.",
        "series_desc": "{title}: {subtitle}. A series by Lucie Termignon.",
    },
}

# Noms de lieux traduits dans les légendes anglaises
PLACES_EN = {
    "Londres": "London",
    "15 avril 2019": "15 April 2019",
    "Hambourg": "Hamburg",
    "Pyrénées": "Pyrenees",
    "Îles Éoliennes": "Aeolian Islands",
    "Projet Berio": "Berio Project",
    "La Muse endormie II": "Sleeping Muse II",
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
    <meta name="color-scheme" content="dark light">
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
            <a href="index.html"{cur("sky")}>{t["sky"]}</a>
            <a href="liste.html"{cur("index")}>{t["index"]}</a>
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
    """Index : le sommaire de la constellation (thèmes › branches), puis les séries."""
    t = TEXT[lang]
    p = LANGS[lang]["prefix"]
    with open(os.path.join(ROOT, "content", "constellation.json"), encoding="utf-8") as f:
        tree = json.load(f)["themes"]
    # photos de chaque thème et de chaque branche, dans l'ordre de la constellation
    groups = {}
    for s in series:
        for img in s["images"]:
            th = img["branch"].split("/")[0]
            groups.setdefault(th, []).append(img)
            if "/" in img["branch"]:
                groups.setdefault(img["branch"], []).append(img)

    def preview(key):
        imgs = groups.get(key)
        return f' data-preview="{p}images/{imgs[0]["src"]}"' if imgs else ""

    themes = []
    for i, th in enumerate(tree, 1):
        n = len(groups.get(th["id"], []))
        if not n:
            continue
        branches = []
        for br in th["branches"]:
            key = th["id"] + "/" + br["id"]
            m = len(groups.get(key, []))
            if m:
                branches.append(f'''                    <li><a href="index.html#{key}/1"{preview(key)}>{esc(br[lang])} <span class="toc-n">{m}</span></a></li>''')
        branches = ("\n                <ul class=\"toc-branches\">\n" + "\n".join(branches) + "\n                </ul>") if branches else ""
        themes.append(f'''            <li class="toc-theme">
                <a class="toc-theme-link" href="index.html#{th["id"]}/1"{preview(th["id"])}>
                    <span class="toc-num">{i:02d}</span>
                    <h2 class="toc-title">{esc(th[lang])}</h2>
                    <span class="toc-count">{count_label(n, t)}</span>
                </a>{branches}
            </li>''')
    rows = []
    for s in series:
        n = len(s["images"])
        if not n:
            continue
        txt = s[lang]
        rows.append(f'''            <li><a class="toc-serie" href="{s["slug"]}.html" data-preview="{p}images/{s["images"][0]["src"]}">
                <span class="toc-serie-title">{esc(txt["title"])} <span class="muted">{esc(txt["subtitle"])}</span></span>
                <span class="toc-n">{n}</span>
            </a></li>''')
    themes, rows = "\n".join(themes), "\n".join(rows)
    return (head(lang, "liste.html", "Index — Lucie Termignon", t["home_desc"])
            + header(lang, "liste.html", "index")
            + f'''    <main class="page">
        <p class="section-label">{t["sky_title"]}</p>
        <ol class="toc">
{themes}
        </ol>
        <p class="section-label section-label--spaced">{t["series"]}</p>
        <ul class="toc-series">
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


CAMERA_KEYS = [("Nikon", "nikon"), ("Leica", "leica"), ("Lomo", "lomo"), ("Yashica", "yashica"), ("Olympus", "olympus")]


def camera_of(caption, series_cameras):
    for name, key in CAMERA_KEYS:
        if name in caption:
            return key
    for name, key in CAMERA_KEYS:  # pas d'appareil dans la légende : celui de la série
        if series_cameras.startswith(name):
            return key
    return "nikon"


def count_label(n, t):
    return f'{n:02d} {t["image"] if n == 1 else t["images"]}'


LEGEND_SVG = {
    "nikon": '<circle r="5.5"/>',
    "leica": '<path d="M-5.5 -5.5L5.5 5.5M5.5 -5.5L-5.5 5.5"/>',
    "lomo": '<circle r="5.5"/><circle r="1.6" class="fill"/>',
    "yashica": '<circle r="5.5"/><path d="M-3.9 -3.9L3.9 3.9M3.9 -3.9L-3.9 3.9"/>',
    "olympus": '<rect x="-4.6" y="-4.6" width="9.2" height="9.2"/>',
    "color": '<circle r="5.5" style="--h:30" class="hue"/>',
    "link": '<path d="M-7 0H7" class="dash"/>',
    "node": '<path d="M-6 0H6M0 -6V6"/>',
}


def legend_html(t):
    """Encadré de légende de la constellation, fermé par défaut."""
    items = "\n".join(f'''            <li><svg class="legend-sym" viewBox="-8 -8 16 16" width="16" height="16" aria-hidden="true">{LEGEND_SVG[k]}</svg>{esc(label)}</li>'''
                      for k, label in t["legend_items"])
    return f'''    <div class="sky-legend" id="sky-legend" role="dialog" aria-label="{t["legend_title"]}" hidden>
        <p class="sky-legend-title">{t["legend_title"]}</p>
        <ul>
{items}
        </ul>
    </div>
'''


def build_sky(lang, series):
    """Page d'accueil : la constellation à plusieurs niveaux (thèmes > branches > photos)."""
    t = TEXT[lang]
    p = LANGS[lang]["prefix"]
    with open(os.path.join(ROOT, "content", "constellation.json"), encoding="utf-8") as f:
        tree = json.load(f)["themes"]
    index = {}  # "theme/branche" -> (indice du thème, indice de la branche ou -1)
    themes = []
    for i, th in enumerate(tree):
        index[th["id"]] = (i, -1)
        for k, br in enumerate(th["branches"]):
            index[th["id"] + "/" + br["id"]] = (i, k)
        themes.append({"id": th["id"], "title": th[lang], "count": 0,
                       "branches": [{"id": br["id"], "title": br[lang], "count": 0} for br in th["branches"]]})
    photos = []
    for s in series:
        for k, img in enumerate(s["images"]):
            ti, bi = index[img["branch"]]  # une branche inconnue fait échouer la génération
            lt, lb = index[img["link"]] if img.get("link") else (-1, -1)
            themes[ti]["count"] += 1
            if bi >= 0:
                themes[ti]["branches"][bi]["count"] += 1
            photos.append({"t": ti, "b": bi, "lt": lt, "lb": lb, "n": k + 1,
                           "series": s[lang]["title"], "href": s["slug"] + ".html#" + str(k + 1),
                           "src": p + "images/" + img["src"],
                           "cap": translate_caption(img["caption"], lang),
                           "cam": camera_of(img["caption"], s["cameras"]),
                           "col": img.get("color", -1)})  # teinte dominante, -1 = noir et blanc
    for th in themes:
        th["count"] = count_label(th["count"], t)
        for br in th["branches"]:
            br["count"] = count_label(br["count"], t)
    data = {"home": t["sky_title"], "themes": themes, "photos": photos,
            "ui": {"close": t["close"], "series": t["see_series"], "prev": t["prev_photo"], "next": t["next_photo"]}}
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    return (head(lang, "index.html", "Lucie Termignon — " + t["tagline"], t["sky_desc"])
            + header(lang, "index.html", "sky")
            + f'''    <main>
        <h1 class="visually-hidden">{t["sky_title"]}</h1>
        <p class="visually-hidden">{t["sky_help"]}</p>
        <div class="sky" data-level="0">
            <svg role="group" aria-label="{esc(t["sky_label"])}"></svg>
            <noscript><p class="sky-noscript">{t["sky_noscript"]} <a href="liste.html">{t["index"]}</a>.</p></noscript>
        </div>
    </main>
    <script type="application/json" id="sky-data">{payload}</script>
    <div class="preview" aria-hidden="true"><img src="" alt=""></div>
{legend_html(t)}    <div class="bar">
        <nav class="sky-crumbs" aria-label="{t["sky_crumbs"]}"></nav>
        <span class="sky-coord">RA&nbsp;<span class="sky-ra">—</span></span>
        <span class="sky-coord">DE&nbsp;<span class="sky-de">—</span></span>
        <span class="sky-info" aria-live="polite"></span>
        <button type="button" class="sky-legend-toggle no-js-hide" aria-expanded="false" aria-controls="sky-legend">{t["legend"]}</button>
        <span class="sky-total">{len(photos)} {t["images"]}</span>
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
        write(lang, "liste.html", build_index(lang, series))
        write(lang, "a-propos.html", build_about(lang))
        write(lang, "index.html", build_sky(lang, series))  # la constellation est la page d'accueil
        for s in series:
            write(lang, s["slug"] + ".html", build_series(lang, s))
    print(f"{len(series)} séries, {2 * (len(series) + 3)} pages générées.")


if __name__ == "__main__":
    main()
