// Autograder for "Lab 2-2: Simple Social Media Page" (structure-focused, flexible)
// Sections (75 pts auto): TODOs 25, Correctness 25, Code Quality 25
// Submission Time (0–25): on-time = 25, late = 12.5 (half credit)
//
// ENV VARS:
//   HTML_FILE (default: index.html)
//   SUBMISSION_POINTS (optional numeric 0..25; if late, capped at 12.5)
//   LATE_SUBMISSION ("1"/"true" => late) OR SUBMISSION_STATUS ("late"|"on-time")
//
// Notes:
// - Ignores inner text/keywords. Checks only presence of tags/attrs/structure.
// - "Flexible" means we accept common variants (e.g., <nav> OR <div class="nav">).

import { access, readFile, writeFile } from 'fs/promises';
import { constants as FS } from 'fs';
import { load } from 'cheerio';

const HTML_FILE = process.env.HTML_FILE || 'index.html';
const SUBMISSION_POINTS_ENV = process.env.SUBMISSION_POINTS;
const SUBMISSION_POINTS_NUM = Number.isFinite(Number(SUBMISSION_POINTS_ENV))
  ? Number(SUBMISSION_POINTS_ENV)
  : null;

const isLate =
  String(process.env.LATE_SUBMISSION || '').toLowerCase() === '1' ||
  String(process.env.LATE_SUBMISSION || '').toLowerCase() === 'true' ||
  String(process.env.SUBMISSION_STATUS || '').toLowerCase() === 'late';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

async function pathExists(p) {
  try { await access(p, FS.F_OK); return true; } catch { return false; }
}
async function writeJson(path, obj, opts = {}) {
  const spaces = typeof opts.spaces === 'number' ? opts.spaces : 0;
  await writeFile(path, JSON.stringify(obj, null, spaces));
}

function resultRow(id, desc, pass, pts) {
  return { id, desc, pass: !!pass, ptsEarned: pass ? pts : 0, ptsMax: pts };
}

function grade(html) {
  const $ = load(html, { decodeEntities: false });

  const $head = $('head');
  const $forms = $('form');
  const $firstForm = $forms.first();

  const hasMainContainer =
    $('#app').length > 0 ||
    $('.app').length > 0 ||
    $('[role="main"]').length > 0 ||
    $('main').length > 0;

  const hasHeader = $('header').length > 0 || $('.header').length > 0;

  const $navContainer = $('nav').first().length ? $('nav').first() : $('.nav').first();
  const hasNavContainer = $navContainer.length > 0;

  const internalAnchorsCount = $('a[href^="#"]').length;         // internal: #home, #create, #about
  const hasAnyExternalBlank = $('a[target="_blank"]').length > 0;

  // Posts: at least one ".post" wrapper with h4 + p inside (order not strict)
  const hasPostWrapper = $('.post').toArray().some(div => {
    const $d = $(div);
    const hasH4 = $d.find('h4').length > 0;
    const hasP  = $d.find('p').length > 0;
    return hasH4 && hasP;
  });

  // Form structural checks (action/method/labels/ids/names/placeholders/required/submit)
  const formHasActionPost =
    $firstForm.length > 0 &&
    String($firstForm.attr('action') || '').trim().length > 0 &&
    String($firstForm.attr('method') || '').toLowerCase() === 'post';

  // Node-safe label→control linkage (no CSS.escape)
  const labelForMatches =
    $('label[for]').toArray().some(lab => {
      const targetId = ($(lab).attr('for') || '').trim();
      if (!targetId) return false;
      return $('[id]').toArray().some(el => (($(el).attr('id') || '') === targetId));
    });

  // At least one text input and one textarea with name+placeholder (content ignored)
  const hasTextInputWithAttrs = $('input[type="text"]').toArray().some(inp => {
    const $i = $(inp);
    return ($i.attr('name') || '').trim() && ($i.attr('placeholder') || '').trim();
  });

  const hasTextareaWithAttrs = $('textarea').toArray().some(t => {
    const $t = $(t);
    return ($t.attr('name') || '').trim() && ($t.attr('placeholder') || '').trim();
  });

  // Required fields: at least two required controls
  const requiredControlsCount = $('input[required], textarea[required], select[required]').length;
  const hasTwoRequired = requiredControlsCount >= 2;

  const hasSubmitBtn = $firstForm.find('button[type="submit"], input[type="submit"]').length > 0;

  const hasFooter = $('footer').length > 0 || $('.footer').length > 0;

  const hasLinkedCSS = $head.find('link[rel="stylesheet"][href$="styles.css"]').length > 0;

  // ===== TODOs Completion (25) =====
  const todoChecks = [];
  todoChecks.push(resultRow('main_container', 'Main container wraps the page (e.g., #app, .app, <main>, [role=main])', hasMainContainer, 6));
  todoChecks.push(resultRow('header_wrap', 'Header section present (e.g., <header> or .header)', hasHeader, 4));
  todoChecks.push(resultRow('nav_present', 'Navigation container present (e.g., <nav> or .nav)', hasNavContainer, 4));
  todoChecks.push(resultRow('posts_wrapped', 'At least one post is wrapped (e.g., .post with <h4> + <p>)', hasPostWrapper, 5));
  todoChecks.push(resultRow('footer_present', 'Footer present (e.g., <footer> or .footer)', hasFooter, 3));
  // marker
  todoChecks.push(resultRow('form_present', 'A form is present', $firstForm.length > 0, 3));

  const todoScore = todoChecks.reduce((s, r) => s + r.ptsEarned, 0);
  const todoMax = todoChecks.reduce((s, r) => s + r.ptsMax, 0);
  const TODO_WEIGHT = 25;
  const todoScaled = Math.round((todoScore / todoMax) * TODO_WEIGHT * 100) / 100;

  // ===== Correctness of Output (25) – structure/attrs only =====
  const corrChecks = [];
  corrChecks.push(resultRow('nav_internal_links', 'Has ≥ 3 internal links (href="#...")', internalAnchorsCount >= 3, 6));
  corrChecks.push(resultRow('nav_external_blank', 'Has ≥ 1 external link opening in new tab (target="_blank")', hasAnyExternalBlank, 4));
  corrChecks.push(resultRow('form_action_method', 'Form uses action + method="post"', formHasActionPost, 5));
  corrChecks.push(resultRow('labels_linked', 'Labels linked to controls via for/id', labelForMatches, 4));
  corrChecks.push(resultRow('fields_named_placeholder', 'Has input[type=text] and textarea with name + placeholder', hasTextInputWithAttrs && hasTextareaWithAttrs, 4));
  corrChecks.push(resultRow('fields_required', 'At least two required fields', hasTwoRequired, 1.5));
  corrChecks.push(resultRow('submit_button', 'Submit button type="submit"', hasSubmitBtn, 0.5));

  const corrScore = corrChecks.reduce((s, r) => s + r.ptsEarned, 0);
  const corrMax = corrChecks.reduce((s, r) => s + r.ptsMax, 0);
  const CORR_WEIGHT = 25;
  const corrScaled = Math.round((corrScore / corrMax) * CORR_WEIGHT * 100) / 100;

  // ===== Code Quality (25) – general HTML hygiene =====
  const qualChecks = [];
  const hasDoctype = /^<!doctype html>/i.test(html.trim());
  qualChecks.push(resultRow('doctype', 'Uses <!DOCTYPE html> at top', hasDoctype, 6));
  const langAttr = ($('html').attr('lang') || '').trim();
  qualChecks.push(resultRow('lang', '<html> has lang attribute', langAttr.length > 0, 6));
  const hasCharset = $('meta[charset], meta[http-equiv="Content-Type"][content*="charset"]').length > 0;
  qualChecks.push(resultRow('charset', 'Has <meta charset> (or equivalent)', hasCharset, 6));
  const titleTxt = ($('head title').first().text() || '').trim();
  qualChecks.push(resultRow('title', '<title> present & non-empty', titleTxt.length > 0, 4));
  const hasLinkedCSSCheck = hasLinkedCSS; // optional but rewarded
  qualChecks.push(resultRow('css_linked', 'Linked external CSS (styles.css) in <head> (optional)', hasLinkedCSSCheck, 3));

  const qualScore = qualChecks.reduce((s, r) => s + r.ptsEarned, 0);
  const qualMax = qualChecks.reduce((s, r) => s + r.ptsMax, 0);
  const QUAL_WEIGHT = 25;
  const qualScaled = Math.round((qualScore / qualMax) * QUAL_WEIGHT * 100) / 100;

  // ===== Submission Time (25) =====
  let submissionPts;
  if (SUBMISSION_POINTS_NUM !== null) {
    submissionPts = clamp(SUBMISSION_POINTS_NUM, 0, 25);
    if (isLate) submissionPts = Math.min(submissionPts, 12.5);
  } else {
    submissionPts = isLate ? 12.5 : 25;
  }

  const autoScore75 = clamp(todoScaled + corrScaled + qualScaled, 0, 75);
  const finalScore100 = autoScore75 + submissionPts;

  const rowsMd = (arr) =>
    arr.map(r => `| ${r.pass ? '✅' : '❌'} | ${r.desc} | ${r.ptsEarned.toFixed(2)} / ${r.ptsMax} |`).join('\n');

  const md = `# Automated Grade: Lab 2-2 — Simple Social Media Page

**Automatic Score (out of 75):** **${autoScore75.toFixed(2)} / 75**

- TODOs Completion (25): **${todoScaled.toFixed(2)}**
- Correctness of Output (25): **${corrScaled.toFixed(2)}**
- Code Quality (25): **${qualScaled.toFixed(2)}**

**Submission Time (out of 25):** ${submissionPts} ${isLate ? '(late: half credit)' : '(on-time)'}

**Final Score (out of 100):** **${finalScore100.toFixed(2)} / 100**

---

## TODOs Completion (25)
| Result | Check | Points |
|---|---|---|
${rowsMd(todoChecks)}

## Correctness of Output (25)
| Result | Check | Points |
|---|---|---|
${rowsMd(corrChecks)}

## Code Quality (25)
| Result | Check | Points |
|---|---|---|
${rowsMd(qualChecks)}

**Notes:**
- Text/content is ignored; only structure, tags, and basic attributes matter.
- Flexible selectors accept common variants (e.g., <nav> or .nav).
- If your main file isn’t \`${HTML_FILE}\`, set \`HTML_FILE\` in CI.
`;

  const jsonReport = {
    auto_score_out_of_75: autoScore75,
    todo_scaled: todoScaled,
    correctness_scaled: corrScaled,
    quality_scaled: qualScaled,
    submission_points_out_of_25: submissionPts,
    final_score_out_of_100: finalScore100,
    is_late_submission: isLate,
    details: { todos: todoChecks, correctness: corrChecks, quality: qualChecks }
  };

  const csv = `repo,auto_score_75,submission_25,final_100
${process.env.GITHUB_REPOSITORY || 'repo'},${autoScore75.toFixed(2)},${submissionPts},${finalScore100.toFixed(2)}
`;

  return { md, jsonReport, csv };
}

async function main() {
  const exists = await pathExists(HTML_FILE);
  const fallback = isLate ? 12.5 : 25;

  if (!exists) {
    const subPts = SUBMISSION_POINTS_NUM !== null
      ? (isLate ? Math.min(clamp(SUBMISSION_POINTS_NUM, 0, 25), 12.5) : clamp(SUBMISSION_POINTS_NUM, 0, 25))
      : fallback;

    const md = `# Automated Grade: Lab 2-2 — Simple Social Media Page

**Status:** ❌ Could not find \`${HTML_FILE}\`.

**Automatic Score (out of 75):** 0.00 / 75  
**Submission Time (out of 25):** ${subPts} ${isLate ? '(late: half credit)' : '(on-time)'}  
**Final Score (out of 100):** ${subPts.toFixed(2)} / 100

> Ensure your main HTML file is named \`index.html\` at repo root (or set \`HTML_FILE\`).
`;
    await writeFile('GRADE.md', md);
    await writeJson('grade_report.json', { error: `Missing ${HTML_FILE}`, auto_score_out_of_75: 0, submission_points_out_of_25: subPts, final_score_out_of_100: subPts }, { spaces: 2 });
    await writeFile('grade_report.csv', `repo,auto_score_75,submission_25,final_100\n${process.env.GITHUB_REPOSITORY || 'repo'},0,${subPts},${subPts}\n`);
    return;
  }

  const html = await readFile(HTML_FILE, 'utf8');
  const { md, jsonReport, csv } = grade(html);

  await writeFile('GRADE.md', md);
  await writeJson('grade_report.json', jsonReport, { spaces: 2 });
  await writeFile('grade_report.csv', csv);
}

main().catch(async (e) => {
  const fallback = isLate ? 12.5 : 25;
  const subPts = SUBMISSION_POINTS_NUM !== null
    ? (isLate ? Math.min(clamp(SUBMISSION_POINTS_NUM, 0, 25), 12.5) : clamp(SUBMISSION_POINTS_NUM, 0, 25))
    : fallback;

  await writeFile('GRADE.md', `# Automated Grade: Lab 2-2 — Simple Social Media Page

**Status:** ❌ Autograder crashed.

\`\`\`
${e.stack || e.message}
\`\`\`

**Automatic Score (out of 75):** 0.00 / 75  
**Submission Time (out of 25):** ${subPts} ${isLate ? '(late: half credit)' : '(on-time)'}  
**Final Score (out of 100):** ${subPts.toFixed(2)} / 100
`);
  await writeJson('grade_report.json', { error: e.message, auto_score_out_of_75: 0, submission_points_out_of_25: subPts, final_score_out_of_100: subPts }, { spaces: 2 });
  await writeFile('grade_report.csv', `repo,auto_score_75,submission_25,final_100\n${process.env.GITHUB_REPOSITORY || 'repo'},0,${subPts},${subPts}\n`);
  process.exit(0);
});
