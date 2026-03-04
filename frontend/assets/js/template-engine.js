/**
 * template-engine.js — vervangt {{var}} en {{#var}}...{{/var}} placeholders
 *
 * Ondersteunde syntaxis:
 *   {{veldnaam}}                    → verplichte substitutie
 *   {{#veldnaam}}...{{/veldnaam}}   → conditioneel blok (alleen als veld gevuld is)
 */

/**
 * Rendert document als HTML voor de live preview.
 * Ingevulde velden krijgen class="filled", lege velden class="placeholder".
 *
 * @param {string} content - Ruwe documenttekst met placeholders
 * @param {Object} values  - Sleutel-waarde paren { veldnaam: "waarde" }
 * @returns {string}       - HTML-string voor het preview-paneel
 */
export function renderHtml(content, values) {
  let text = _processConditionals(content, values);
  text = _substituteHtml(text, values);

  const lines = text.split('\n');
  const html = [];
  let firstContentLine = true;
  let lastWasEmpty = false;

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      if (!lastWasEmpty && html.length > 0) {
        html.push('<div class="doc-gap"></div>');
        lastWasEmpty = true;
      }
      continue;
    }
    lastWasEmpty = false;

    // Eerste niet-lege regel = documenttitel
    if (firstContentLine) {
      html.push(`<p class="doc-title">${line}</p><div class="doc-rule"></div>`);
      firstContentLine = false;
      continue;
    }

    // Artikel-headings: "ARTIKEL 1 – TITEL"
    if (/^ARTIKEL\s+\d+/i.test(line)) {
      html.push(`<p class="article-heading">${line}</p>`);
      continue;
    }

    // Sub-clausules: (a), (b), (c), ...
    if (/^\([a-e]\)/.test(line)) {
      html.push(`<p class="article-sub">${line}</p>`);
      continue;
    }

    html.push(`<p class="article-text">${line}</p>`);
  }

  return html.join('\n');
}

/**
 * Rendert document als platte tekst voor de .txt download.
 * Geen HTML, geen escaping — puur tekst.
 *
 * @param {string} content - Ruwe documenttekst met placeholders
 * @param {Object} values  - Sleutel-waarde paren
 * @returns {string}       - Platte tekst
 */
export function renderText(content, values) {
  let text = _processConditionals(content, values);
  return _substitutePlain(text, values);
}

// ── INTERNE FUNCTIES ────────────────────────────────────────────────────────

/**
 * Verwerkt conditionele blokken {{#veld}}...{{/veld}}.
 * Als het veld leeg is, wordt het hele blok verwijderd.
 */
function _processConditionals(text, values) {
  return text.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (match, fieldName, blockContent) => {
      const value = values[fieldName];
      const hasValue = value !== undefined && value !== null && value !== '' && value !== '0';
      return hasValue ? blockContent : '';
    }
  );
}

/**
 * Vervangt {{veldnaam}} door gekleurde HTML-spans (voor de preview).
 */
function _substituteHtml(text, values) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, fieldName) => {
    const value = values[fieldName];
    const hasValue = value !== undefined && value !== null && value !== '';
    if (hasValue) {
      return `<span class="filled">${_escapeHtml(String(value))}</span>`;
    }
    return `<span class="placeholder">${fieldName.replace(/_/g, '\u00A0')}</span>`;
  });
}

/**
 * Vervangt {{veldnaam}} door de waarde of "___" als leeg (voor .txt).
 */
function _substitutePlain(text, values) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, fieldName) => {
    const value = values[fieldName];
    const hasValue = value !== undefined && value !== null && value !== '';
    return hasValue ? String(value) : '___';
  });
}

/**
 * Voorkomt XSS: escapet <, >, &, " zodat gebruikersinvoer veilig in innerHTML belandt.
 */
function _escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
