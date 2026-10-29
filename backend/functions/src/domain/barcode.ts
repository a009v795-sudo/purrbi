// Barcodes stay strings end to end; leading zeros are significant.

export type BarcodeKind = 'EAN-8' | 'UPC-E' | 'UPC-A' | 'EAN-13' | 'GTIN-14';

export interface NormalizedBarcode {
  ok: boolean;
  digits: string; // as scanned, digits only
  gtin14: string; // left-padded to 14 digits (product key)
  kind: BarcodeKind | null;
  /** UPC-E only: the same product's 12-digit UPC-A, which databases and web pages use. */
  expanded?: string;
  reason?: 'empty' | 'non_digit' | 'length' | 'check_digit';
}

const KIND_BY_LENGTH: Record<number, BarcodeKind> = { 8: 'EAN-8', 12: 'UPC-A', 13: 'EAN-13', 14: 'GTIN-14' };

/** GS1 mod-10 check digit over every digit but the last. */
export function gs1CheckDigit(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const digit = body.charCodeAt(body.length - 1 - i) - 48;
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

export function normalizeBarcode(raw: unknown): NormalizedBarcode {
  const text = typeof raw === 'string' ? raw.trim() : '';
  const fail = (reason: NormalizedBarcode['reason'], digits = ''): NormalizedBarcode => ({
    ok: false,
    digits,
    gtin14: '',
    kind: null,
    reason,
  });
  if (!text) return fail('empty');
  const compact = text.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(compact)) return fail('non_digit');
  const kind = KIND_BY_LENGTH[compact.length];
  if (!kind) return fail('length', compact);
  const expected = gs1CheckDigit(compact.slice(0, -1));
  if (expected !== Number(compact[compact.length - 1])) {
    // Eight digits that are not a valid EAN-8 may be a UPC-E (small US packages): zeros suppressed from a UPC-A.
    const upcA = compact.length === 8 ? expandUpcE(compact) : null;
    if (upcA) return { ok: true, digits: compact, gtin14: upcA.padStart(14, '0'), kind: 'UPC-E', expanded: upcA };
    return fail('check_digit', compact);
  }
  return { ok: true, digits: compact, gtin14: compact.padStart(14, '0'), kind };
}

/**
 * UPC-E (number system 0 or 1, six digits, check digit) to its UPC-A, or null when the code is not a
 * valid UPC-E. The UPC-E check digit is the UPC-A's, so it must match the expanded number.
 */
export function expandUpcE(code: string): string | null {
  if (!/^[01]\d{7}$/.test(code)) return null;
  const [ns, x, check] = [code[0], code.slice(1, 7), code[7]];
  const last = x[5];
  const body =
    last <= '2' ? `${x.slice(0, 2)}${last}0000${x.slice(2, 5)}` : last === '3' ? `${x.slice(0, 3)}00000${x.slice(3, 5)}` : last === '4' ? `${x.slice(0, 4)}00000${x[4]}` : `${x.slice(0, 5)}0000${last}`;
  const upcA = `${ns}${body}${check}`;
  return gs1CheckDigit(upcA.slice(0, -1)) === Number(check) ? upcA : null;
}

/**
 * Codes to try against product databases, most specific first. A 12-digit UPC-A
 * and the 13-digit EAN with a leading 0 are the same GTIN, so both are exact matches.
 */
export function lookupVariants(b: NormalizedBarcode): string[] {
  if (!b.ok) return [];
  if (b.kind === 'UPC-E' && b.expanded) return [b.expanded, '0' + b.expanded, b.digits];
  const out = [b.digits];
  if (b.digits.length === 12) out.push('0' + b.digits);
  if (b.digits.length === 13 && b.digits.startsWith('0')) out.push(b.digits.slice(1));
  if (b.digits.length === 14 && b.digits.startsWith('0')) out.push(b.digits.slice(1));
  return [...new Set(out)];
}

/** True when two codes denote the same GTIN (ignores left zero padding). */
export function sameGtin(a: string, b: string): boolean {
  const da = a.replace(/\D/g, '');
  const db = b.replace(/\D/g, '');
  if (!da || !db) return false;
  return da.padStart(14, '0') === db.padStart(14, '0');
}

/** Finds a GTIN inside free text such as "UPC 0 12345 67890 5" (spaces/dashes allowed). */
export function textContainsGtin(text: string, gtin14: string): boolean {
  const core = gtin14.replace(/^0+/, '');
  if (core.length < 7) return false;
  const runs = text.match(/\d[\d\s-]{6,20}\d/g) ?? [];
  return runs.some((run) => {
    const digits = run.replace(/[\s-]/g, '');
    return digits.replace(/^0+/, '') === core;
  });
}
