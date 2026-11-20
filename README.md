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
3. Indiquez sa place dans la constellation de la page d'accueil :
   - `"branch"` : la branche de l'arbre, par exemple `"montagne/ecrins"` ou `"personnes/inconnus"` (ou `"paris-suspendu"` pour un thème sans branches, ou pour rattacher une photo au thème lui-même) ;
   - `"link"` (facultatif) : une autre branche reliée en pointillé, par exemple le lieu d'un portrait (`"villes/londres"`) ;
   - `"color"` (facultatif, photos en couleur) : la teinte dominante de la photo, en degrés de 0 à 360 (0 rouge, 30 orange, 60 jaune, 120 vert, 200 bleu ciel, 240 bleu, 300 violet). Son symbole prend cette teinte dans la constellation.

   Les thèmes et les branches, avec leurs noms en français et en anglais, sont dans `content/constellation.json`.
4. Lancez `python3 build.py`.

`images/sources.tsv` indique l'origine (dossier Google Drive) de chaque photo.
