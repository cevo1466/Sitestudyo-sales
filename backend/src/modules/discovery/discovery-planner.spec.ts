import { CITIES, TERMS, coverageProgress, planNextRun, type Target } from './discovery-planner';

const BASE = {
  remainingUsd: 5,
  costPerPlace: 0.005,
  maxPerSearch: 100,
  maxTermsPerRun: 10,
};

/** Bir sehrin TUM terimlerini kapsanmis say. */
function coverCity(city: string): Target[] {
  return TERMS.map((term) => ({ locationQuery: city, term }));
}

describe('planNextRun — butce', () => {
  it('bos kapsamada ilk sehirden baslar', () => {
    const p = planNextRun({ ...BASE, covered: [] })!;
    expect(p.locationQuery).toBe(CITIES[0]);
    expect(p.terms[0]).toBe(TERMS[0]);
  });

  it('butceye sigan terim sayisini asmaz', () => {
    // $5 - $0.25 pay = $4.75; terim basina 100 x $0.005 = $0.50
    // -> 9 terim sigar
    const p = planNextRun({ ...BASE, covered: [] })!;
    expect(p.terms).toHaveLength(9);
    expect(p.estimatedUsd).toBeLessThanOrEqual(4.75);
  });

  it('calisma basina terim ust sinirini asmaz', () => {
    const p = planNextRun({ ...BASE, remainingUsd: 100, covered: [], maxTermsPerRun: 6 })!;
    expect(p.terms).toHaveLength(6);
  });

  it('kredi bittiginde plan URETMEZ', () => {
    // Kotayi son kurusuna kadar harcamak, calismanin yarida kesilmesine
    // ve elde yarim veri kalmasina yol acardi.
    expect(planNextRun({ ...BASE, remainingUsd: 0, covered: [] })).toBeNull();
    expect(planNextRun({ ...BASE, remainingUsd: 0.2, covered: [] })).toBeNull();
  });

  it('tek terime yetmeyen krediyle plan uretmez', () => {
    // $0.60 - $0.25 = $0.35 < $0.50 (bir terimin maliyeti)
    expect(planNextRun({ ...BASE, remainingUsd: 0.6, covered: [] })).toBeNull();
  });

  it('tam bir terime yeten krediyle tek terimlik plan uretir', () => {
    const p = planNextRun({ ...BASE, remainingUsd: 0.8, covered: [] })!;
    expect(p.terms).toHaveLength(1);
  });
});

describe('planNextRun — kapsama', () => {
  it('TARANMIS bir terimi tekrar SECMEZ', () => {
    // Kredi geri gelmiyor; ayni isletmeyi ikinci kez taramak para yakmaktir.
    const covered: Target[] = [{ locationQuery: CITIES[0], term: TERMS[0] }];
    const p = planNextRun({ ...BASE, covered })!;
    expect(p.terms).not.toContain(TERMS[0]);
    expect(p.terms[0]).toBe(TERMS[1]);
  });

  it('bir sehir bitmeden digerine GECMEZ', () => {
    // Her sehirden biraz toplamak, hicbir sehri tam kapsamamak demek.
    const covered = TERMS.slice(0, 15).map((term) => ({ locationQuery: CITIES[0], term }));
    const p = planNextRun({ ...BASE, covered })!;
    expect(p.locationQuery).toBe(CITIES[0]);
  });

  it('sehir tamamlaninca SONRAKI sehre gecer', () => {
    const p = planNextRun({ ...BASE, covered: coverCity(CITIES[0]) })!;
    expect(p.locationQuery).toBe(CITIES[1]);
    expect(p.terms[0]).toBe(TERMS[0]);
  });

  it('iki sehir bitince ucuncuye gecer', () => {
    const covered = [...coverCity(CITIES[0]), ...coverCity(CITIES[1])];
    expect(planNextRun({ ...BASE, covered })!.locationQuery).toBe(CITIES[2]);
  });

  it('tum izgara taranmissa null doner', () => {
    const covered = CITIES.flatMap(coverCity);
    expect(planNextRun({ ...BASE, covered })).toBeNull();
  });

  it('kapsamada olmayan sehir/terim plani bozmaz', () => {
    const covered: Target[] = [{ locationQuery: 'Paris, Fransa', term: 'boulangerie' }];
    const p = planNextRun({ ...BASE, covered })!;
    expect(p.locationQuery).toBe(CITIES[0]);
    expect(p.terms).toHaveLength(9);
  });
});

describe('coverageProgress', () => {
  it('bos kapsamada %0', () => {
    expect(coverageProgress([])).toEqual({
      done: 0,
      total: CITIES.length * TERMS.length,
      percent: 0,
    });
  });

  it('bir sehir bitince oranini dogru hesaplar', () => {
    const p = coverageProgress(coverCity(CITIES[0]));
    expect(p.done).toBe(TERMS.length);
    expect(p.percent).toBe(Math.round((TERMS.length / (CITIES.length * TERMS.length)) * 100));
  });

  it('izgara disi kayitlari SAYMAZ', () => {
    // Elle yapilmis bir tarama izgarada yoksa ilerlemeyi sisirmemeli.
    const p = coverageProgress([{ locationQuery: 'Paris, Fransa', term: 'boulangerie' }]);
    expect(p.done).toBe(0);
  });

  it('tumu tarandiginda %100', () => {
    expect(coverageProgress(CITIES.flatMap(coverCity)).percent).toBe(100);
  });
});
