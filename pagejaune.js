const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapEntreprises(location, category, maxPages = 5) {
  console.log(`🔍 Recherche des entreprises "${category}" à/en "${location}"...`);


  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--window-size=1920x1080']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/111.0.0.0 Safari/537.36');


  let toutesEntreprises = [];

  try {

    let baseUrl = `https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(category)}&ou=${encodeURIComponent(location)}`;


    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const pageUrl = pageNum > 1 ? `${baseUrl}&page=${pageNum}` : baseUrl;
      console.log(`📄 Page ${pageNum}/${maxPages}`);


      await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 120000 });


      try {
        await page.waitForSelector('#didomi-notice-agree-button', { timeout: 10000 });
        console.log("🍪 Acceptation des cookies...");
        await page.click('#didomi-notice-agree-button');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        console.log("Pas de popup de cookies ou déjà accepté");
      }


      const detailLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.bi-denomination'))
          .map(el => {

            let link = null;
            if (el.tagName === 'A') {
              link = el.href;
            } else {

              const parent = el.closest('a');
              if (parent) link = parent.href;
            }


            const name = el.textContent.trim();

            return { link, name };
          })
          .filter(item => item.link && item.name);
      });

      console.log(`🔗 ${detailLinks.length} liens d'entreprises trouvés sur cette page`);


      for (let i = 0; i < detailLinks.length; i++) {
        const { link, name } = detailLinks[i];
        console.log(`🏢 Visite de ${name} (${i + 1}/${detailLinks.length})`);

        try {
          await page.goto(link, { waitUntil: 'networkidle2', timeout: 60000 });

          const detailsInfo = await page.evaluate(async () => {
            const cleanText = text => {
              if (!text) return '';
              return text.replace(/Contenu édité par le professionnel.*$/g, '')
                .replace(/Localisation|Y aller|En savoir plus|Ouvrir la tooltip/g, '')
                .replace(/Voir le plan/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            };

            const nameElement = document.querySelector('h1');
            const name = nameElement ? cleanText(nameElement.textContent) : '';

            const addressElement = document.querySelector('.address-container') ||
              document.querySelector('.address') ||
              document.querySelector('.bi-address');
            const address = addressElement ? cleanText(addressElement.textContent) : '';

            let phone = '';
            const phoneButton = document.querySelector('a[title="Afficher le N°"]');

            if (phoneButton) {
              phoneButton.click();
              await new Promise(resolve => setTimeout(resolve, 500));
              const phoneNumberElement = document.querySelector('.coord-numero');
              if (phoneNumberElement) {
                phone = cleanText(phoneNumberElement.textContent);
              }
            } else {
              const phoneElement = document.querySelector('.coord-numero');
              if (phoneElement) {
                phone = cleanText(phoneElement.textContent);
              }
            }

            const websiteLink = document.querySelector('a[title="Site internet du professionnel nouvelle fenêtre"]');
            let siteWeb = 'Non';
            let displayUrl = '';

            if (websiteLink) {
              siteWeb = websiteLink.href;

              const valueSpan = websiteLink.querySelector('.value');
              if (valueSpan) {
                displayUrl = valueSpan.textContent.trim();
              }
            }

            return {
              nom: name,
              adresse: address,
              telephone: phone,
              siteWeb: siteWeb,
              urlAffichee: displayUrl
            };
          });


          toutesEntreprises.push(detailsInfo);


          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (detailError) {
          console.log(`⚠️ Erreur lors de la visite de ${name}: ${detailError.message}`);
        }
      }


      const hasNextPage = await page.evaluate(() => {
        return !!document.querySelector('.pagination .next:not(.disabled)');
      });

      if (!hasNextPage) {
        console.log("🏁 Dernière page atteinte");
        break;
      }
    }


    if (toutesEntreprises.length === 0) {
      console.log("❌ Aucune entreprise trouvée.");
      await browser.close();
      return [];
    }


    const dateStr = new Date().toISOString().slice(0, 10);
    const filePrefix = `${category}_${location}_${dateStr}`;


    fs.writeFileSync(
      `toutes_entreprises_${filePrefix}.json`,
      JSON.stringify(toutesEntreprises, null, 2)
    );


    const entreprisesSansSite = toutesEntreprises.filter(e => e.siteWeb === 'Non');
    let txtContent = "ENTREPRISES SANS SITE WEB:\n\n";

    entreprisesSansSite.forEach((e, index) => {
      txtContent += `#${index + 1} - ${e.nom}\n`;
      if (e.adresse) txtContent += `Adresse: ${e.adresse}\n`;
      if (e.telephone) txtContent += `Téléphone: ${e.telephone}\n`;
      txtContent += `-----------------------------------\n\n`;
    });

    fs.writeFileSync(`entreprises_sans_site_${filePrefix}.txt`, txtContent);


    let allTxtContent = "TOUTES LES ENTREPRISES:\n\n";

    toutesEntreprises.forEach((e, index) => {
      allTxtContent += `#${index + 1} - ${e.nom}\n`;
      if (e.adresse) allTxtContent += `Adresse: ${e.adresse}\n`;
      if (e.telephone) allTxtContent += `Téléphone: ${e.telephone}\n`;


      if (e.siteWeb !== 'Non') {
        allTxtContent += `Site web: ${e.urlAffichee || e.siteWeb}\n`;
      }

      allTxtContent += `-----------------------------------\n\n`;
    });

    fs.writeFileSync(`liste_complete_${filePrefix}.txt`, allTxtContent);


    console.log(`\n📊 RÉSULTATS:`);
    console.log(`📋 Total des entreprises trouvées: ${toutesEntreprises.length}`);
    console.log(`🔍 Entreprises sans site web: ${entreprisesSansSite.length}`);
    console.log(`🌐 Entreprises avec site web: ${toutesEntreprises.length - entreprisesSansSite.length}`);

    console.log(`\n📁 Fichiers créés:`);
    console.log(`   1. toutes_entreprises_${filePrefix}.json`);
    console.log(`   2. entreprises_sans_site_${filePrefix}.txt`);
    console.log(`   3. liste_complete_${filePrefix}.txt`);

    await browser.close();
    return toutesEntreprises;
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    await browser.close();
  }

  return [];
}


scrapEntreprises('Paris', 'restaurants', 3); // Ville / enseigne / nombre de pages

module.exports = { scrapEntreprises };
