# Lucie Termignon — travaux argentiques

Portfolio photo statique, en français (racine) et en anglais (`en/`), publié avec GitHub Pages.

## Modifier le site

Les pages `.html` sont générées : ne les modifiez pas à la main.

- **Séries et photos** : `content/series.json` (titres et sous-titres en français et en anglais, appareils, liste des photos et légendes).
- **Page à propos et libellés** : `build.py` (`ABOUT` et `TEXT`).
- **Apparence** : `style.css`. **Interactions** : `script.js`.

Puis régénérez toutes les pages :

```bash
python3 build.py
```

## Ajouter une photo

1. Placez le fichier dans `images/<série>/` (environ 1800 px de large).
2. Ajoutez une ligne dans la liste `images` de la série, dans `content/series.json`.
3. Lancez `python3 build.py`.

`images/sources.tsv` indique l'origine (dossier Google Drive) de chaque photo.
