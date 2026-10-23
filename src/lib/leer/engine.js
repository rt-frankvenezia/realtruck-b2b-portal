// @ts-nocheck
// LEER configurator rules engine. Pure functions, keyed by kit ID, shared by the browser and Node tests.
// Evaluation order follows the JDE guide notes: F3293-C (DERC) first, then F3292 (CSER), re-fired to a fixpoint.
// F3293-P / F3293-R and F3281/2/3 feed the BOM and Base estimate; they never write segments.

export const MAX_PASSES = 15;
export const MODES = ['stateless', 'sticky-attr', 'sticky-all'];

const ORDER_OPS = new Set(['GT', 'GE', 'LT', 'LE', 'NG', 'NL']);
const COND_AO = new Set(['I', 'A', 'O']);

export const segKey = (kit, pel) => `${kit}|${pel}`;

const isNoneLike = (v) => v === '' || v === '*NONE';

function compare(a, b) {
  const na = Number(a);
  const nb = Number(b);
  if (a !== '' && b !== '' && Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

// unanswered counts as *NONE for EQ/NE *NONE (reference db.js behaviour); ordering ops compare literally.
export function matchValue(actual, valr, ativ, values) {
  const a = actual ?? '';
  if (ativ === '*VALUES') {
    const hit = (values || []).includes(a);
    return valr === 'NE' ? !hit : hit;
  }
  if (ativ === '*ALL') return valr !== 'NE';
  if (ativ === '*BLANK') return valr === 'NE' ? a !== '' : a === '';
  if (ativ === '*NONE' && (valr === 'EQ' || valr === 'NE' || valr === 'CE')) {
    return valr === 'NE' ? !isNoneLike(a) : isNoneLike(a);
  }
  const c = compare(a, ativ);
  switch (valr) {
    case 'NE':
      return c !== 0;
    case 'GT':
    case 'NL':
      return valr === 'GT' ? c > 0 : c >= 0;
    case 'GE':
      return c >= 0;
    case 'LT':
    case 'NG':
      return valr === 'LT' ? c < 0 : c <= 0;
    case 'LE':
      return c <= 0;
    default:
      return c === 0;
  }
}

function compileRule(rule, table) {
  const target = (l) => segKey(l.psin || rule.kit, l.pel);
  const withKey = (l) => ({ ...l, key: target(l) });
  return {
    id: `${rule.kit} ATO ${rule.ato}`,
    table,
    kit: rule.kit,
    ato: rule.ato,
    conds: rule.lines.filter((l) => COND_AO.has(l.ao)).map(withKey),
    then: rule.lines.filter((l) => l.ao === '*' || l.ao === '').map(withKey),
    else: rule.lines.filter((l) => l.ao === 'E').map(withKey),
  };
}

// I and O open a new OR group, A joins the current one. No conditions means unconditional.
export function conditionsHold(conds, sel) {
  if (!conds.length) return true;
  const groups = conds.reduce((acc, c) => {
    if (c.ao !== 'A' || !acc.length) acc.push([]);
    acc[acc.length - 1].push(c);
    return acc;
  }, []);
  return groups.some((g) => g.every((c) => matchValue(sel[c.key] ?? '', c.valr, c.ativ, c.values)));
}

const DERC_FN = /^(SUBSTR|CONCAT)\((.*)\)$/i;
const DERC_REF = /^S(\d+)(?:=([^=]+)=)?$/i;

function splitArgs(body) {
  const out = [''];
  let depth = 0;
  let quote = '';
  for (const ch of body) {
    if (quote) quote = ch === quote ? '' : quote;
    else if (ch === "'" || ch === '"') quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && !depth) {
      out.push('');
      continue;
    }
    out[out.length - 1] += ch;
  }
  return out;
}

// F3293-C derived calculation (guide 01 §4.13.4). Returns { value } or { gap } when it cannot be computed here.
// ctx: { kit, litm, fgLitm, epgm, kitOfLitm: Map<litm, kit>, read(key) -> { value } | { gap } }
export function derive(expr, ctx) {
  const e = String(expr).trim();
  // B5532900 only copies the finished-good parent item number down to the level (confirmed by Lauren, 2026-09-29)
  if (/^EXTVAR$/i.test(e) && ctx.epgm === 'B5532900' && ctx.fgLitm) return { value: ctx.fgLitm };
  if (/^EXTVAR$/i.test(e)) return { gap: `EXTVAR ${ctx.epgm || '?'} is an external business function` };
  if (/^&IMLITM$/i.test(e)) return { value: ctx.litm };
  if (e.startsWith('&')) return { gap: `${e}: only &IMLITM is resolved` };
  const fn = e.match(DERC_FN);
  if (fn) {
    const args = splitArgs(fn[2]).map((a) => derive(a, ctx));
    const gap = args.find((a) => a.gap);
    if (gap) return gap;
    const vals = args.map((a) => String(a.value));
    if (fn[1].toUpperCase() === 'CONCAT') return { value: vals.join('') };
    return { value: vals[0].substr(Number(vals[1]) - 1, Number(vals[2])) };
  }
  const ref = e.match(DERC_REF);
  if (ref) {
    const kit = ref[2] ? ctx.kitOfLitm.get(ref[2]) : ctx.kit;
    if (!kit) return { gap: `${e}: item ${ref[2]} is not a level of this kit` };
    return ctx.read(segKey(kit, ref[1]));
  }
  const quoted = e.match(/^(['"])(.*)\1$/);
  if (quoted) return { value: quoted[2] };
  if (/^\*?[\w#.-]+$/.test(e)) return { value: e };
  return { gap: `unsupported expression ${e}` };
}

function deriveAction(a, ctx) {
  if (a.derc) return derive(a.derc, ctx);
  if (a.tblc) return { gap: `C table ${a.tblc} is not in the pack` };
  if (a.derp) return { gap: `smart part formula (DERP) ${a.derp} is not evaluated` };
  return a.ativ ? { value: a.ativ } : { gap: 'no DERC, DERP or table on the row' };
}

// F3293-C: fired rules write derived values into calculated segments; values carry across passes via `sel`.
function runCalculations(kit, sel, fired) {
  const calc = new Map();
  const read = (key) => {
    if (calc.has(key)) return calc.get(key).gap ? { gap: `needs ${key}: ${calc.get(key).gap}` } : { value: calc.get(key).value };
    const v = sel[key] ?? '';
    if (kit.byKey.get(key)?.calculated && v === '') return { gap: `needs ${key}, which has no derived value` };
    return { value: v };
  };
  for (const r of kit.airC) {
    const holds = conditionsHold(r.conds, sel);
    const actions = holds ? r.then : r.else;
    if (!actions.length) continue;
    fired.push({ rule: r.id, table: r.table, branch: holds ? 'then' : 'else' });
    for (const a of actions) {
      const ctx = { kit: r.kit, litm: kit.litmOf.get(r.kit), fgLitm: kit.litmOf.get(kit.model.id), epgm: a.epgm, kitOfLitm: kit.kitOfLitm, read };
      const expr = a.derc || (a.tblc && `table ${a.tblc}`) || a.derp || a.ativ;
      calc.set(a.key, { rule: r.id, expr, ...deriveAction(a, ctx) });
    }
  }
  return calc;
}

function selfExclusions(rules) {
  const out = new Map();
  for (const r of rules) {
    if (r.conds.length !== 1 || r.conds[0].valr !== 'EQ') continue;
    const { key, ativ } = r.conds[0];
    if (ativ.startsWith('*')) continue;
    if (!r.then.some((a) => a.key === key && a.valr === 'NE' && a.ativ === ativ)) continue;
    if (!out.has(key)) out.set(key, new Map());
    out.get(key).set(ativ, r.id);
  }
  return out;
}

export function compileKit(model) {
  const levelSeq = new Map(model.levels.map((l) => [l.kit, l.seq]));
  const byLevel = (a, b) => (levelSeq.get(a.kit) ?? 99) - (levelSeq.get(b.kit) ?? 99) || a.ato - b.ato;
  const segments = model.segments.map((s) => ({
    ...s,
    key: segKey(s.kit, s.pel),
    calculated: s.req === 'C',
    input: s.optionsSource === 'free' ? 'text' : 'choice',
    base: (s.options || []).map(([code]) => code),
    labels: new Map(s.options || []),
  }));
  const rules = [...model.rules].sort(byLevel).map((r) => compileRule(r, 'F3292'));
  return {
    model,
    segments,
    byKey: new Map(segments.map((s) => [s.key, s])),
    rules,
    airC: [...(model.airC || [])].sort(byLevel).map((r) => compileRule(r, 'F3293-C')),
    litmOf: new Map(model.levels.map((l) => [l.kit, l.litm])),
    kitOfLitm: new Map(model.levels.map((l) => [l.litm, l.kit])),
    selfExcluded: selfExclusions(rules),
  };
}

export function defaultSelections(kit) {
  return Object.fromEntries(kit.segments.filter((s) => !s.calculated).map((s) => [s.key, s.dval]));
}

const freshConstraint = () => ({ allowed: null, preds: [], required: undefined, blanked: false, forced: undefined, by: [] });

function carryConstraints(carried, mode) {
  const out = new Map();
  if (!carried || mode === 'stateless') return out;
  for (const [key, c] of carried) {
    const next = freshConstraint();
    next.required = c.required;
    if (mode === 'sticky-all') {
      next.allowed = c.allowed && new Set(c.allowed);
      next.preds = [...c.preds];
      next.blanked = c.blanked;
    }
    const kept = mode === 'sticky-all' ? c.by : c.by.filter((b) => b.action.endsWith('*REQ') || b.action.endsWith('*OPT'));
    next.by = kept.map((b) => ({ ...b, carried: true }));
    out.set(key, next);
  }
  return out;
}

function effectOf(a) {
  if (a.ativ === '*REQ' || a.ativ === '*OPT') return a.ativ;
  if (a.ativ === '*BLANK') return 'hide';
  if (a.ativ === '*ALL' || a.valr === 'CE') return 'show';
  if (a.ativ === '*VALUES' && a.valr === 'EQ') return 'show';
  if (a.valr === 'EQ') return `=${a.ativ}`;
  return null;
}

const CONFLICTING = (x, y) =>
  x !== y &&
  ((x === '*REQ' && y === '*OPT') ||
    (x === '*OPT' && y === '*REQ') ||
    (x === 'hide' && y !== '*REQ' && y !== '*OPT') ||
    (y === 'hide' && x !== '*REQ' && x !== '*OPT') ||
    (x.startsWith('=') && y.startsWith('=')));

function applyAction(c, a, ruleId, unmodeled) {
  const { ativ, valr } = a;
  c.by.push({ rule: ruleId, action: `${valr} ${ativ}`.trim() });
  if (ativ === '*BLANK') {
    Object.assign(c, { allowed: new Set(), preds: [], blanked: true, forced: '' });
  } else if (ativ === '*ALL') {
    Object.assign(c, { allowed: null, preds: [], blanked: false, forced: undefined });
  } else if (ativ === '*REQ') {
    c.required = true;
  } else if (ativ === '*OPT') {
    c.required = false;
  } else if (ativ === '*VALUES') {
    const list = a.values || [];
    if (!list.length) {
      unmodeled.push({ rule: ruleId, key: a.key, what: '*VALUES with no F32921 list in pack' });
    } else if (valr === 'NE') {
      c.preds.push({ valr: 'NE', ativ: '*VALUES', values: list });
    } else if (valr === 'CE') {
      if (c.allowed) list.forEach((v) => c.allowed.add(v));
      c.blanked = false;
    } else {
      Object.assign(c, { allowed: new Set(list), preds: [], blanked: false, forced: undefined });
    }
  } else if (ativ === '*ZERO' || ativ === '*RANGE') {
    unmodeled.push({ rule: ruleId, key: a.key, what: `${ativ} (F32922 ranges are out of scope)` });
  } else if (valr === 'EQ') {
    Object.assign(c, { allowed: new Set([ativ]), preds: [], blanked: false, forced: ativ });
  } else if (valr === 'CE') {
    if (c.allowed) c.allowed.add(ativ);
    c.preds = c.preds.filter((p) => matchValue(ativ, p.valr, p.ativ, p.values));
    c.blanked = false;
  } else if (valr === 'NE' || ORDER_OPS.has(valr)) {
    c.preds.push({ valr, ativ });
  } else {
    unmodeled.push({ rule: ruleId, key: a.key, what: `operator ${valr} ${ativ}` });
  }
}

function runRules(rules, sel, cons, trace, unmodeled) {
  const effects = new Map();
  for (const r of rules) {
    const holds = conditionsHold(r.conds, sel);
    const actions = holds ? r.then : r.else;
    if (!actions.length) continue;
    trace.push({ rule: r.id, table: r.table, branch: holds ? 'then' : 'else' });
    for (const a of actions) {
      if (!cons.has(a.key)) cons.set(a.key, freshConstraint());
      applyAction(cons.get(a.key), a, r.id, unmodeled);
      const effect = effectOf(a);
      if (!effect) continue;
      if (!effects.has(a.key)) effects.set(a.key, []);
      effects.get(a.key).push({ rule: r.id, effect });
    }
  }
  return effects;
}

function findConflicts(effects) {
  const out = [];
  for (const [key, list] of effects) {
    const clash = list.filter((x) => list.some((y) => y.rule !== x.rule && CONFLICTING(x.effect, y.effect)));
    if (clash.length) out.push({ key, winner: list[list.length - 1].rule, effects: clash });
  }
  return out;
}

export function optionsFor(kit, seg, c) {
  const skip = kit.selfExcluded.get(seg.key);
  let list = seg.base;
  if (c?.allowed) list = [...seg.base.filter((v) => c.allowed.has(v)), ...[...c.allowed].filter((v) => !seg.base.includes(v))];
  return list
    .filter((v) => !skip?.has(v))
    .filter((v) => (c?.preds || []).every((p) => matchValue(v, p.valr, p.ativ, p.values)));
}

function blankAllowed(c) {
  return (c?.preds || []).every((p) => matchValue('', p.valr, p.ativ, p.values));
}

function isRequired(seg, c) {
  const flag = c?.required ?? seg.req === 'R';
  return flag || !blankAllowed(c);
}

function reconcile(kit, seg, c, cur, userChoices) {
  const options = seg.input === 'choice' ? optionsFor(kit, seg, c) : null;
  const ok = (v) => v === '' || (options ? options.includes(v) : (c?.preds || []).every((p) => matchValue(v, p.valr, p.ativ, p.values)));
  if (c?.forced !== undefined) return { next: c.forced, why: c.blanked ? '*BLANK' : `limited to ${c.forced}` };
  if (!ok(cur)) {
    const fallback = ok(seg.dval) ? seg.dval : '';
    return { next: options?.length === 1 ? options[0] : fallback, why: `${cur} is no longer offered` };
  }
  if (cur === '' && userChoices[seg.key] !== '' && seg.dval && ok(seg.dval) && !c?.blanked) {
    return { next: seg.dval, why: 'F3291 default restored' };
  }
  if (cur === '' && options?.length === 1 && !c?.blanked && userChoices[seg.key] !== '') {
    return { next: options[0], why: 'only value left' };
  }
  return { next: cur };
}

// evaluate(kit, selections, { mode, carried, userChoices }) -> selections settled to a fixpoint + view model.
export function evaluate(kit, selections, { mode = 'stateless', carried = null, userChoices = {} } = {}) {
  const sel = { ...selections };
  const changes = [];
  let pass = 0;
  let converged = false;
  let cons;
  let fired;
  let conflicts;
  let unmodeled;
  let calculated;
  for (pass = 1; pass <= MAX_PASSES; pass++) {
    cons = carryConstraints(carried, mode);
    fired = [];
    unmodeled = [];
    calculated = runCalculations(kit, sel, fired);
    conflicts = findConflicts(runRules(kit.rules, sel, cons, fired, unmodeled));
    let changed = false;
    for (const seg of kit.segments) {
      const cur = sel[seg.key] ?? '';
      if (seg.calculated) {
        const next = calculated.get(seg.key)?.value ?? '';
        if (next === cur) continue;
        sel[seg.key] = next;
        changes.push({ key: seg.key, from: cur, to: next, why: `F3293-C ${calculated.get(seg.key)?.rule || 'no rule fired'}`, pass });
        changed = true;
        continue;
      }
      const { next, why } = reconcile(kit, seg, cons.get(seg.key), cur, userChoices);
      if (next === cur) continue;
      sel[seg.key] = next;
      changes.push({ key: seg.key, from: cur, to: next, why, pass });
      changed = true;
    }
    if (!changed) {
      converged = true;
      break;
    }
  }
  const segments = kit.segments.map((seg) => viewOf(kit, seg, cons.get(seg.key), sel[seg.key] ?? '', calculated.get(seg.key)));
  const missing = segments.filter((s) => s.visible && s.required && s.value === '').map((s) => s.key);
  const invalid = segments.filter((s) => s.visible && s.noOptions && s.required).map((s) => s.key);
  return {
    selections: sel,
    constraints: cons,
    segments,
    missing,
    complete: !missing.length && !invalid.length,
    trace: {
      mode,
      passes: Math.min(pass, MAX_PASSES),
      converged,
      fired,
      conflicts,
      unmodeled,
      changes,
      derived: [...calculated].map(([key, c]) => ({ key, ...c })),
    },
  };
}

function viewOf(kit, seg, c, value, calc) {
  const options = seg.input === 'choice' ? optionsFor(kit, seg, c) : [];
  const required = isRequired(seg, c);
  let hiddenReason = '';
  if (seg.calculated) hiddenReason = 'calculated (F3291 req=C)';
  else if (c?.blanked && !required) hiddenReason = `*BLANK by ${lastRule(c, '*BLANK')}`;
  else if (seg.input === 'choice' && !options.length && !required) hiddenReason = 'no valid values left';
  return {
    key: seg.key,
    kit: seg.kit,
    pel: seg.pel,
    label: seg.label,
    req: seg.req,
    required,
    visible: !hiddenReason,
    hiddenReason,
    input: seg.input,
    options: options.map((code) => ({ code, label: seg.labels.get(code) || code })),
    noOptions: seg.input === 'choice' && !options.length,
    value,
    valueLabel: value ? seg.labels.get(value) || value : '',
    by: c?.by || [],
    sticky: !!c?.by.length && c.by.every((b) => b.carried),
    calc: calc || null,
  };
}

function lastRule(c, action) {
  return [...c.by].reverse().find((b) => b.action.endsWith(action))?.rule || 'rule';
}

// F3293-P parts / composition, F3293-R routing and F3282/F3283 table lookups for the settled selections.
export function evaluateBom(kit, bom, sel) {
  const mapsFor = (tbl, ruleKit) => bom.maps.find((m) => m.tbl === tbl && (!m.kit || m.kit === ruleKit));
  const lookup = (map, ruleKit) => {
    const segKeys = map.pels.map((p) => segKey(ruleKit, p));
    const keys = segKeys.map((k) => sel[k] ?? '');
    const blankCalc = segKeys.filter((k) => kit.byKey.get(k)?.calculated && !sel[k]);
    const row = (bom.rows[map.tbl] || []).find((r) => keys.every((k, i) => r[i] === k));
    if (row) return { status: 'ok', segKeys, keys, itm: row[3], qty: row[4] };
    const reason = blankCalc.length
      ? `calculated key ${blankCalc.join(', ')} has no derived value (F3293-C gap)`
      : 'no F3283 row for these keys';
    return { status: 'unresolved', segKeys, keys, reason };
  };
  const blocked = [];
  const fire = (rules, table) =>
    rules.flatMap((raw) => {
      const r = compileRule(raw, table);
      const holds = conditionsHold(r.conds, sel);
      const calcConds = r.conds.filter((c) => kit.byKey.get(c.key)?.calculated && !sel[c.key]).map((c) => c.key);
      if (!holds && calcConds.length) {
        blocked.push({ rule: r.id, table, reason: `condition on calculated ${calcConds.join(', ')}, which has no derived value (F3293-C gap)` });
      }
      return (holds ? r.then : r.else).map((a) => ({ rule: r.id, kit: r.kit, ...a }));
    });
  const parts = fire(bom.airP, 'F3293-P').map((a) => {
    if (!a.tblc) return { rule: a.rule, kind: 'direct', itm: a.itm || '', dsc1: a.dsc1 || '', qty: a.qty, status: a.itm ? 'ok' : 'empty' };
    const map = mapsFor(a.tblc, a.kit);
    const res = map ? lookup(map, a.kit) : { status: 'unresolved', keys: [], reason: 'no F3282 map' };
    return { rule: a.rule, kind: 'table', tblc: a.tblc, ...res };
  });
  const tables = bom.airP.length
    ? []
    : bom.maps.map((m) => ({ rule: 'F3282', kind: 'table', tblc: m.tbl, ...lookup(m, m.kit) }));
  return {
    composition: fire(bom.composition, 'F3293-P').map((a) => ({ rule: a.rule, itm: a.itm, dsc1: a.dsc1 })),
    parts: [...parts, ...tables],
    routing: fire(bom.airR, 'F3293-R').filter((a) => a.itm).map((a) => ({ rule: a.rule, itm: a.itm, opsq: a.opsq, dsc1: a.dsc1 })),
    blocked,
  };
}

// Base/List (F4106) of the resolved explode lines. Never Absolute, dealer net or a discount: those are out of scope.
export function baseEstimate(kit, bom, sel) {
  const { parts, blocked } = evaluateBom(kit, bom, sel);
  const lines = parts
    .filter((p) => p.status === 'ok' && p.itm)
    .map((p) => {
      const list = bom.prices?.[p.itm] ?? null;
      const qty = p.qty ?? 1;
      return { ...p, qty, list, ext: list == null ? null : list * qty };
    });
  const priced = lines.filter((l) => l.ext != null);
  const parent = bom.prices?.[kit.model.id] ?? null;
  const known = [...priced.map((l) => l.ext), ...(parent == null ? [] : [parent])];
  return {
    lines,
    total: known.length ? known.reduce((sum, v) => sum + v, 0) : null,
    priced: priced.length,
    unpriced: lines.length - priced.length,
    unresolved: parts.filter((p) => p.status === 'unresolved').length,
    blocked: blocked.length,
    parent,
  };
}

// F4106 list of the explode lines keyed on `key` if it were set to `code`.
// undefined: the segment explodes to no table; null: unknown (unresolved row or no current list).
// Co-segment tables that also key blank sibling PELs (e.g. 1S-316-345) stay unresolved until
// those PELs are set; they must not blank the price chip for the segment the user is picking.
export function optionBase(kit, bom, sel, key, code) {
  const deps = evaluateBom(kit, bom, { ...sel, [key]: code }).parts.filter((p) => p.segKeys?.includes(key));
  if (!deps.length) return undefined;
  const ok = deps.filter((p) => p.status === 'ok' && p.itm);
  if (!ok.length) return null;
  if (ok.some((p) => bom.prices?.[p.itm] == null)) return null;
  return ok.reduce((sum, p) => sum + bom.prices[p.itm] * (p.qty ?? 1), 0);
}

// Plant configured-string shape per level. The F3209 delimiter is not in the pack; '/' is the JDE default.
export function configStrings(kit, sel) {
  return kit.model.levels
    .map((level) => ({
      kit: level.kit,
      name: level.name,
      value: kit.segments
        .filter((s) => s.kit === level.kit && !s.calculated)
        .map((s) => sel[s.key] ?? '')
        .join('/'),
    }))
    .filter((l) => kit.segments.some((s) => s.kit === l.kit && !s.calculated));
}
