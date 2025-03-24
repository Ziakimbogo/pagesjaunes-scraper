# 🍽️ PagesJaunes Scraper

Un outil de scraping pour collecter les informations des enseignes sur PagesJaunes, en identifiant spécifiquement ceux qui n'ont pas de site web.

## 📋 Fonctionnalités

- Extrait les noms, adresses et numéros de téléphone des restaurants
- Détecte les restaurants avec et sans site web
- Génère des fichiers JSON et TXT pour une utilisation facile
- Extraction multi-pages pour des résultats complets

## 🛠️ Installation

```bash
# Cloner le dépôt
git clone https://github.com/Ziakimbogo/pagesjaunes-scraper.git
cd pagesjaunes-scraper

# Installer les dépendances
npm install puppeteer
```

## 🚀 Utilisation

```javascript
// Exemple d'utilisation
const { scrapEntreprises } = require('./pagesjaunes-scraper');

// Rechercher des restaurants dans l'Aisne (3 pages maximum)
scrapEntreprises('Aisne', 'restaurants', 3);

// Possible de mettre un departement, une région ou meme une ville
```

## 📊 Résultats

Le script génère trois fichiers de sortie :

### 1. JSON complet

Contient toutes les données structurées pour un traitement automatisé :

```json
[
  {
    "nom": "Le Rhiad II",
    "adresse": "231 rue Pont à Mousson 57950 Montigny lès Metz",
    "telephone": "03 87 50 26 50",
    "siteWeb": "http://www.lerhiadii.fr/",
    "urlAffichee": "www.lerhiadii.fr"
  },
  {
    "nom": "Auberge du Stock",
    "adresse": "ETNG du Stock 57400 Langatte",
    "telephone": "03 87 03 92 11",
    "siteWeb": "Non",
    "urlAffichee": ""
  }
]
```

### 2. Liste complète en texte

Un format facile à lire avec toutes les entreprises :

```
TOUTES LES ENTREPRISES:

#1 - Le Rhiad II
Adresse: 231 rue Pont à Mousson 57950 Montigny lès Metz
Téléphone: 03 87 50 26 50
Site web: www.lerhiadii.fr
-----------------------------------

#2 - Auberge du Stock
Adresse: ETNG du Stock 57400 Langatte
Téléphone: 03 87 03 92 11
-----------------------------------
```

### 3. Liste des entreprises sans site web

Focus sur votre cible principale - les restaurants sans présence web :

```
ENTREPRISES SANS SITE WEB:

#1 - Auberge du Stock
Adresse: ETNG du Stock 57400 Langatte
Téléphone: 03 87 03 92 11
-----------------------------------

#2 - La Table de Mathias
Adresse: 57 rue Clémenceau 57290 Fameck
Téléphone: 03 87 51 42 64
-----------------------------------
```

## ⚙️ Fonctionnement

Le script fonctionne en :

1. **Naviguant** sur les pages de résultats de PagesJaunes
2. **Visitant** la page de détail de chaque enseigne
3. **Extrayant** les informations pertinentes
4. **Identifiant** les sites web via l'attribut `title="Site internet du professionnel nouvelle fenêtre"`
5. **Générant** les fichiers de sortie avec les données structurées

## 🔍 Détection de site web

Le script détecte les sites web en recherchant exclusivement cet élément HTML :

```html
<a title="Site internet du professionnel nouvelle fenêtre" target="_blank" class="teaser-item black-icon pj-link" href="http://www.example.com">
  <span class="icon icon-lien"></span>
  <span class="value">www.example.com</span>
</a>
```

## ⚠️ Note éthique et légale

Ce script est fourni à titre éducatif uniquement. Veuillez :

- Respecter les conditions d'utilisation de PagesJaunes
- Utiliser le script de manière responsable (pauses entre les requêtes)
- Ne pas surcharger les serveurs

## 📜 Licence

MIT

---

*Ce projet n'est pas affilié à PagesJaunes ou à Solocal Group.*
