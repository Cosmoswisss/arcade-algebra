import type { CabinetId } from '../engine/types';
import { PARAMS_VALIDATORS } from './paramsRegistry';
import { validateCabinet, validateRemedial } from './schema';
import type { CabinetContent, Remedial } from './types';

export interface LoadedContent {
  cabinets: Partial<Record<CabinetId, CabinetContent>>;
  remedial: Record<string, Remedial>;
  errors: string[];
}

/** Parses raw JSON text keyed by path (/content/...). Never throws: problems end up in `errors`. */
export function parseContentFiles(raw: Record<string, string>): LoadedContent {
  const out: LoadedContent = { cabinets: {}, remedial: {}, errors: [] };
  const folders: Record<string, Record<string, unknown>> = {};
  const broken = new Set<string>();
  for (const [path, text] of Object.entries(raw)) {
    const rel = path.replace(/^\/?content\//, '');
    let data: unknown;
    try { data = JSON.parse(text); } catch (e) {
      out.errors.push(`${rel}: invalid JSON (${(e as Error).message})`);
      const m = rel.match(/^cabinets\/([^/]+)\//); if (m) broken.add(m[1]);
      continue;
    }
    const cab = rel.match(/^cabinets\/([^/]+)\/([^/]+\.json)$/);
    if (cab) { (folders[cab[1]] ??= {})[cab[2]] = data; continue; }
    if (rel.startsWith('remedial/')) {
      const r = validateRemedial(rel, data);
      if (r.ok) out.remedial[r.content.errorKind] = r.content; else out.errors.push(...r.errors);
    }
  }
  for (const [folder, files] of Object.entries(folders)) {
    if (broken.has(folder)) continue;
    const id = folder.replace(/^\d+-/, '') as CabinetId;
    const validator = PARAMS_VALIDATORS[id];
    if (!validator) { out.errors.push(`cabinets/${folder}: unknown cabinet folder`); continue; }
    const r = validateCabinet(folder, files, validator);
    if (r.ok) out.cabinets[id] = r.content; else out.errors.push(...r.errors.map((e) => `cabinets/${e}`));
  }
  return out;
}

export function loadContent(): LoadedContent & { raw: Record<string, string> } {
  const raw = import.meta.glob('/content/**/*.json', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
  return { ...parseContentFiles(raw), raw };
}
