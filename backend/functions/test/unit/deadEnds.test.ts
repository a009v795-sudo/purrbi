// No dead ends (label reader 2.5.1, 2026-11-02): test A's can prints "…, Moisture (Max.)" at the end of one line and
// "78%, Taurine (Min.) 0.05%" at the start of the next. A faithful transcription lost the moisture guarantee, the newer
// reading's thinner analysis blocked the fuller one, and the scorer withheld the score for moisture while nothing was
// asked for: "complete" and "unscored" with no way forward (account accept, trace 36da991d-34a).
import { describe, expect, it } from 'vitest';
import { analysisRows, joinWrappedValues } from '../../src/domain/analysisText';
import { classifyScope } from '../../src/domain/scope';
import { assessGeneral } from '../../src/domain/score';
import type { GuaranteedAnalysisEntry, ProductFacts } from '../../src/domain/types';
import { fillMissing, hasUsableMoisture, missingInfo, requestsForWithheldScore } from '../../src/pipeline/facts';
import { facts, SRC } from '../helpers/fixtures';

const rows = (text: string) => analysisRows(text, false).map((r) => `${r.nutrient}:${r.value}${r.unit}:${r.qualifier}`);
const ga = (pairs: [string, number][]): GuaranteedAnalysisEntry[] =>
  pairs.map(([nutrient, value]) => ({ nutrient: nutrient as GuaranteedAnalysisEntry['nutrient'], label: nutrient, qualifier: nutrient === 'crude_fiber' || nutrient === 'moisture' ? 'max' : 'min', value, unit: '%' }));
const scopeOf = (f: ProductFacts) => classifyScope({ origin: 'opff', categoriesTags: f.classificationSignals.map((s) => s.text), texts: [f.productName?.value ?? ''], adequacy: f.adequacy?.value });

describe('an analysis value wrapped onto the next printed line', () => {
  it('is read with its row (test A’s can)', () => {
    const can = 'Crude Protein (Min.) 10%, Crude Fat (Min.) 6%, Crude Fiber (Max.) 1%, Moisture (Max.)\n78%, Taurine (Min.) 0.05%';
    expect(rows(can)).toEqual(['crude_protein:10%:min', 'crude_fat:6%:min', 'crude_fiber:1%:max', 'moisture:78%:max', 'taurine:0.05%:min']);
    expect(rows('Crude Protein (Min.) 10%\nCrude Fat (Min.) 6%\nCrude Fiber (Max.) 1%\nMoisture (Max.)\n78%')).toEqual(['crude_protein:10%:min', 'crude_fat:6%:min', 'crude_fiber:1%:max', 'moisture:78%:max']);
  });
  it('joins nothing else: a line that already ends with a value, a heading, or a value that is not a guarantee', () => {
    expect(joinWrappedValues('Crude Protein (min) 30%\n28% of the recipe is chicken')).toBe('Crude Protein (min) 30%\n28% of the recipe is chicken');
    expect(joinWrappedValues('GUARANTEED ANALYSIS\n30% protein')).toBe('GUARANTEED ANALYSIS\n30% protein');
    expect(joinWrappedValues('Made with chicken\n100% natural')).toBe('Made with chicken\n100% natural');
    expect(joinWrappedValues('Calories\n3,500 kcal/kg')).toBe('Calories\n3,500 kcal/kg'); // not a value this parser reads as a row ("3,500")
  });
});

describe('a fuller analysis of the same label', () => {
  const src = { ...SRC, sourceId: 'label:2', sourceType: 'user_label' as const, sourceName: 'Your label photo' };
  it('replaces one without a usable moisture guarantee when it agrees on protein, fat and fiber', () => {
    const base = facts({ guaranteedAnalysis: { value: ga([['crude_protein', 10], ['crude_fat', 6], ['crude_fiber', 1]]), source: SRC } });
    const full = ga([['crude_protein', 10], ['crude_fat', 6], ['crude_fiber', 1], ['moisture', 78], ['taurine', 0.05]]);
    const merged = fillMissing(base, { guaranteedAnalysis: { value: full, source: src } });
    expect(merged.filled).toEqual(['guaranteedAnalysis']);
    expect(hasUsableMoisture(merged.facts.guaranteedAnalysis!.value)).toBe(true);
    // Not when it disagrees on a core guarantee (another reading, another label), nor when the base already has moisture.
    const other = ga([['crude_protein', 12], ['crude_fat', 6], ['crude_fiber', 1], ['moisture', 78]]);
    expect(fillMissing(base, { guaranteedAnalysis: { value: other, source: src } }).filled).toEqual([]);
    const withMoisture = facts();
    expect(fillMissing(withMoisture, { guaranteedAnalysis: { value: full, source: src } }).filled).toEqual([]);
  });
});

describe('a withheld score always leaves something to add', () => {
  it('asks for the nutrition panel when a complete food lacks only the moisture guarantee', () => {
    const f = facts({ guaranteedAnalysis: { value: ga([['crude_protein', 10], ['crude_fat', 6], ['crude_fiber', 1]]), source: SRC } });
    const scope = scopeOf(f);
    const a = assessGeneral(f, scope);
    expect(a.score).toBeNull();
    expect(a.missingForScore).toEqual(['moisture guarantee (to compare protein and fat on a dry-matter basis)']);
    const req = missingInfo(f, scope, a.category);
    expect(req).toEqual([{ purpose: 'nutrition', title: 'Guaranteed analysis, with moisture', reason: 'The moisture guarantee wasn’t read. Needed to compare protein and fat as dry matter, and to score it.' }]);
  });
  it('for every mix of evidence a complete food or a treat can have, an unscored result asks for a photo', () => {
    const analyses: (GuaranteedAnalysisEntry[] | undefined)[] = [
      undefined,
      ga([['crude_protein', 30]]),
      ga([['crude_protein', 30], ['crude_fat', 15]]),
      ga([['crude_protein', 30], ['crude_fat', 15], ['crude_fiber', 4]]),
      ga([['crude_protein', 30], ['crude_fat', 15], ['crude_fiber', 4], ['moisture', 10]]),
      ga([['crude_protein', 30], ['crude_fat', 15], ['crude_fiber', 4], ['moisture', 99]]), // implausible moisture
    ];
    let unscored = 0;
    const guarded: string[] = [];
    for (const kind of ['en:cat-food', 'en:cat-treats'])
      for (const g of analyses)
        for (const adequacyText of [undefined, '', 'Complete and balanced', 'Intended for intermittent or supplemental feeding only.'])
          for (const ingredientsText of [undefined, ''])
            for (const calories of [true, false]) {
              const f = facts({
                classificationSignals: [{ text: kind, source: 'test' }],
                ...(adequacyText === undefined ? {} : { adequacyText }),
                ...(ingredientsText === undefined ? {} : { ingredientsText, ingredients: undefined }),
                guaranteedAnalysis: g ? { value: g, source: SRC } : undefined,
                calories: calories ? { value: [{ kcal: 3800, per: 'kg' }], source: SRC } : undefined,
              });
              const scope = scopeOf(f);
              if (scope.status !== 'supported') continue;
              const a = assessGeneral(f, scope);
              if (a.score !== null) continue;
              unscored++;
              const requests = missingInfo(f, scope, a.category);
              const all = [...requests, ...requestsForWithheldScore(a, scope, requests)];
              expect(all.length, `${kind} ${JSON.stringify(g)} ${adequacyText} ${ingredientsText} ${calories}: ${a.missingForScore.join('; ')}`).toBeGreaterThan(0);
              for (const r of all) expect(r.reason.length).toBeGreaterThan(10);
              // The backstop was needed (before 2.5.1 these were dead ends): a treat with protein, fat and fiber but
              // too little else to score, e.g. no calorie content and no feeding statement.
              if (requestsForWithheldScore(a, scope, requests).length) guarded.push(`${kind}: ${a.missingForScore.join('; ')}`);
            }
    expect(unscored).toBeGreaterThan(20);
    expect(guarded.length).toBeGreaterThan(0);
    expect(guarded.every((g) => g.startsWith('en:cat-treats'))).toBe(true);
  });
});
