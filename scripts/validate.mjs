// Checks profiles.json before it is merged or released. The app filters
// what it writes too, so this is the first of two gates, not the only one.
import fs from 'node:fs';

const FILE = new URL('../profiles.json', import.meta.url);
const SCHEMA_VERSION = 1;
const KINDS = ['grblhal', 'grbl', 'fluidnc'];
// The settings the Machine Setup wizard edits or carries over. Anything else
// (network, spindle, VFD, ...) has no place in a machine profile.
const ALLOWED = new Set([
  '3', '5', '6', '20', '21', '22', '23', '24', '25', '26', '27', '40', '44', '45', '46',
  '100', '101', '102', '103', '110', '111', '112', '113', '120', '121', '122', '123',
  '130', '131', '132', '744', '745',
]);
const MASKS = new Set(['3', '5', '6', '744', '745']);
const SWITCHES = new Set(['20', '21', '40']);
const POSITIVE = /^(10[0-3]|11[0-3]|12[0-3]|13[0-2])$/;

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

let data;
try {
  data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} catch (err) {
  console.error(`profiles.json is not valid JSON: ${err.message}`);
  process.exit(1);
}

if (data.schemaVersion !== SCHEMA_VERSION) fail('schemaVersion', `must be ${SCHEMA_VERSION}`);
if (!Array.isArray(data.profiles) || data.profiles.length === 0) fail('profiles', 'must be a non-empty list');

const ids = new Set();
for (const [i, p] of (data.profiles ?? []).entries()) {
  const where = p?.id ? `profile ${p.id}` : `profile #${i + 1}`;
  for (const key of ['id', 'brand', 'model', 'size']) {
    if (typeof p?.[key] !== 'string' || !p[key].trim()) fail(where, `${key} must be a non-empty string`);
  }
  if (typeof p?.id === 'string') {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) fail(where, 'id must be lowercase words joined by dashes');
    if (ids.has(p.id)) fail(where, 'duplicate id');
    ids.add(p.id);
  }
  if (p.boards !== undefined && (!Array.isArray(p.boards) || p.boards.some(b => typeof b !== 'string' || !b.trim()))) {
    fail(where, 'boards must be a list of board names');
  }
  if (p.newCore !== undefined) {
    if (!Number.isInteger(p.newCore?.minBuild) || String(p.newCore.minBuild).length !== 8) fail(where, 'newCore.minBuild must be a yyyymmdd build');
    for (const id of Object.keys(p.newCore?.values ?? {})) if (!ALLOWED.has(id)) fail(where, `newCore sets $${id}, which a profile may not set`);
  }
  const firmware = p?.firmware ?? {};
  if (typeof firmware !== 'object' || Object.keys(firmware).length === 0) fail(where, 'firmware needs settings for at least one firmware');
  for (const [kind, settings] of Object.entries(firmware)) {
    if (!KINDS.includes(kind)) { fail(where, `unknown firmware "${kind}" (use ${KINDS.join(', ')})`); continue; }
    for (const [id, value] of Object.entries(settings ?? {})) {
      const at = `${where} ${kind} $${id}`;
      if (!ALLOWED.has(id)) { fail(at, 'not a setting a profile may set'); continue; }
      if (typeof value !== 'string' || value.trim() === '' || !Number.isFinite(Number(value))) { fail(at, `"${value}" is not a number`); continue; }
      const n = Number(value);
      if (MASKS.has(id) && (!Number.isInteger(n) || n < 0 || n > 255)) fail(at, 'must be a bit mask from 0 to 255');
      if (SWITCHES.has(id) && n !== 0 && n !== 1) fail(at, 'must be 0 or 1');
      if (POSITIVE.test(id) && n <= 0) fail(at, 'must be above 0');
      if (/^13[0-2]$/.test(id) && n > 10000) fail(at, 'travel above 10 m looks wrong');
    }
  }
}

if (errors.length) {
  console.error(`profiles.json has ${errors.length} problem(s):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`profiles.json OK: ${data.profiles.length} profiles`);
