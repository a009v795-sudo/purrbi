// Real products for live tests, found with Open Pet Food Facts' own search (never invented): a cat
// food, a dog food, a treat, a supplement, and products whose database record lacks the label panels
// and selected panel images but has contributor photos of the package. Those exercise the evidence
// fallbacks: manufacturer research first, then the owner's photos (the contributor photos stand in).
export const UA = 'Purrbi/0.1 (live e2e; contact@valenciainnovations.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function search(host, params) {
  const fieldsList = 'code,product_name,brands,categories_tags,ingredients_text,image_ingredients_url,image_nutrition_url,images,nutriments';
  const urls = [
    `https://${host}/api/v2/search?${params}&fields=${fieldsList}&page_size=40&sort_by=unique_scans_n`,
    `https://${host}/cgi/search.pl?action=process&${params.replace('categories_tags_en=', 'tagtype_0=categories&tag_contains_0=contains&tag_0=')}&json=1&page_size=40&fields=${fieldsList}`,
  ];
  for (const url of urls) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
        if (res.status === 503 || res.status === 429) {
          await sleep(3000 * (attempt + 1));
          continue;
        }
        if (!res.ok) break;
        const products = ((await res.json()).products ?? []).filter((p) => /^\d{8,14}$/.test(p.code ?? ''));
        if (products.length) return products;
        break;
      } catch {
        await sleep(2000);
      }
    }
  }
  return [];
}

// Full-text search (the classic search endpoint), for products that have no shared category tag.
async function textSearch(host, terms) {
  const fieldsList = 'code,product_name,brands,categories_tags,ingredients_text,image_ingredients_url,image_nutrition_url,images,nutriments';
  const url = `https://${host}/cgi/search.pl?action=process&search_terms=${encodeURIComponent(terms)}&search_simple=1&json=1&page_size=40&fields=${fieldsList}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
      if (res.status === 503 || res.status === 429) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return [];
      return ((await res.json()).products ?? []).filter((p) => /^\d{8,14}$/.test(p.code ?? ''));
    } catch {
      await sleep(2000);
    }
  }
  return [];
}

const tags = (p) => (p.categories_tags ?? []).join(' ');
const isTreat = (p) => /treat|biscuit|snack|chew|friandise/.test(tags(p)) || /treat|biscuit|snack|chew|dentastix|dentalife|temptations|catisfactions/i.test(p.product_name ?? '');
const isSupplement = (p) => /supplement|vitamin/.test(tags(p)) || /supplement|vitamin|probiotic|omega|joint|multivitamin/i.test(p.product_name ?? '');

export function rawImageUrls(p) {
  const c = p.code;
  const dir = c.length > 8 ? `${c.slice(0, 3)}/${c.slice(3, 6)}/${c.slice(6, 9)}/${c.slice(9)}` : c;
  return Object.keys(p.images ?? {}).filter((k) => /^\d+$/.test(k)).map((k) => `https://images.openpetfoodfacts.org/images/products/${dir}/${k}.jpg`);
}

export async function discover({ incompleteCount = 1 } = {}) {
  // A complete food (not a treat or biscuit filed under food) with an ingredient list, if there is one.
  const pickFood = (list) => list.find((p) => p.ingredients_text && !isTreat(p)) ?? list.find((p) => !isTreat(p)) ?? list[0];
  const catFoods = await search('world.openpetfoodfacts.org', 'categories_tags_en=cat-food');
  const dogFoods = await search('world.openpetfoodfacts.org', 'categories_tags_en=dog-food');
  const treats = [...(await search('world.openpetfoodfacts.org', 'categories_tags_en=dog-treats')), ...(await search('world.openpetfoodfacts.org', 'categories_tags_en=cat-treats'))];
  let supplements = [];
  for (const cat of ['dog-supplements', 'cat-supplements', 'pet-supplements', 'dietary-supplements-for-dogs', 'dietary-supplements-for-cats', 'food-supplements-for-dogs', 'food-supplements-for-cats', 'pet-food-supplements']) {
    supplements = await search('world.openpetfoodfacts.org', `categories_tags_en=${cat}`);
    if (supplements.length) break;
  }
  for (const terms of ['dog supplement', 'cat supplement', 'pet vitamins', 'supplement']) {
    if (supplements.length) break;
    supplements = (await textSearch('world.openpetfoodfacts.org', terms)).filter(isSupplement);
  }
  const incomplete = [...catFoods, ...dogFoods]
    .filter((p) => !p.ingredients_text && !p.image_ingredients_url && !p.image_nutrition_url && rawImageUrls(p).length >= 2)
    .slice(0, incompleteCount)
    .map((p) => ({ code: p.code, name: p.product_name ?? '', species: catFoods.includes(p) ? 'cat' : 'dog', images: rawImageUrls(p).slice(0, 3) }));
  const usedCodes = new Set(incomplete.map((p) => p.code));
  const take = (p, label) => (p && !usedCodes.has(p.code) ? (usedCodes.add(p.code), { code: p.code, name: p.product_name ?? '', label }) : null);
  const human = (await search('world.openfoodfacts.org', 'categories_tags_en=breakfast-cereals'))[0];
  return {
    humanFood: human ? { code: human.code, name: human.product_name ?? '' } : null,
    items: [
      take(pickFood(catFoods), 'cat food'),
      take(pickFood(dogFoods.filter((p) => !usedCodes.has(p.code))), 'dog food'),
      take(treats.find((p) => !usedCodes.has(p.code)), 'treat'),
      take(supplements.find((p) => !usedCodes.has(p.code)), 'supplement'),
    ].filter(Boolean),
    photoCandidate: incomplete[0] ?? null,
    incomplete,
    counts: { catFoods: catFoods.length, dogFoods: dogFoods.length, treats: treats.length, supplements: supplements.length },
  };
}
