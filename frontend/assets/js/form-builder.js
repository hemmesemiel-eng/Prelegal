/**
 * form-builder.js — bouwt dynamisch formuliervelden op basis van template variables[]
 *
 * Gebruik:
 *   buildForm(container, variables, onChange)  → bouwt het formulier in de container
 *   getValues(variables)                       → leest alle waarden uit het formulier
 *   getProgress(variables)                     → berekent voortgang (verplichte velden)
 */

const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december'
];

/**
 * Bouwt het formulier en injecteert het in de container.
 *
 * @param {HTMLElement} container - Het element waar het formulier in komt
 * @param {Array}       variables - De variables[] array uit de template-JSON
 * @param {Function}    onChange  - Callback bij elke invoerwijziging
 */
export function buildForm(container, variables, onChange) {
  container.innerHTML = '';

  const groups = _groupVariables(variables);

  for (const [groupName, fields] of groups) {
    const section = document.createElement('div');
    section.className = 'form-section';

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = groupName;
    section.appendChild(label);

    for (const variable of fields) {
      section.appendChild(_buildField(variable, onChange));
    }

    container.appendChild(section);
  }
}

/**
 * Leest alle huidige veldwaarden uit het formulier.
 * Datumvelden worden omgezet naar Nederlands formaat (1 januari 2026).
 *
 * @param {Array} variables - De variables[] array
 * @returns {Object}        - { veldnaam: "waarde", ... }
 */
export function getValues(variables) {
  const values = {};
  for (const v of variables) {
    const el = document.getElementById(v.name);
    if (!el) continue;
    let value = el.value.trim();
    if (v.type === 'date' && value) {
      value = _formatDateNL(value);
    }
    values[v.name] = value;
  }
  return values;
}

/**
 * Berekent hoeveel verplichte velden zijn ingevuld.
 *
 * @param {Array} variables
 * @returns {{ filled: number, total: number, percentage: number }}
 */
export function getProgress(variables) {
  const required = variables.filter(v => v.required);
  const filled = required.filter(v => {
    const el = document.getElementById(v.name);
    return el && el.value.trim() !== '';
  }).length;

  return {
    filled,
    total: required.length,
    percentage: required.length > 0 ? Math.round((filled / required.length) * 100) : 100,
  };
}

// ── INTERNE FUNCTIES ────────────────────────────────────────────────────────

function _buildField(variable, onChange) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';

  const label = document.createElement('label');
  label.htmlFor = variable.name;
  if (variable.required) {
    label.textContent = variable.label;
  } else {
    label.innerHTML = `${variable.label} <span class="opt">(optioneel)</span>`;
  }

  let input;

  switch (variable.type) {
    case 'textarea':
      input = document.createElement('textarea');
      input.rows = 3;
      break;

    case 'select': {
      input = document.createElement('select');
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = '— Kies een optie —';
      input.appendChild(defaultOpt);
      for (const opt of (variable.options || [])) {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        input.appendChild(option);
      }
      break;
    }

    case 'date':
      input = document.createElement('input');
      input.type = 'date';
      if (variable.name === 'datum_ondertekening') {
        input.value = new Date().toISOString().split('T')[0];
      }
      break;

    case 'number':
      input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      break;

    default:
      input = document.createElement('input');
      input.type = 'text';
  }

  input.id = variable.name;
  input.name = variable.name;
  if (variable.required) input.required = true;

  input.addEventListener('input', onChange);
  input.addEventListener('change', onChange); // voor select en date

  wrapper.appendChild(label);
  wrapper.appendChild(input);
  return wrapper;
}

/**
 * Groepeert variabelen op basis van hun naamprefix.
 * Behoudt de volgorde zoals in de variables[] array.
 * @returns {Map<string, Array>}
 */
function _groupVariables(variables) {
  const groups = new Map();
  for (const variable of variables) {
    const groupName = _inferGroupName(variable.name);
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName).push(variable);
  }
  return groups;
}

function _inferGroupName(fieldName) {
  const prefixes = [
    ['partij_1',        'Partij 1'],
    ['partij_2',        'Partij 2'],
    ['werkgever',       'Werkgever'],
    ['werknemer',       'Werknemer'],
    ['verhuurder',      'Verhuurder'],
    ['huurder',         'Huurder'],
    ['verkoper',        'Verkoper'],
    ['koper',           'Koper'],
    ['opdrachtgever',   'Opdrachtgever'],
    ['opdrachtnemer',   'Opdrachtnemer'],
  ];

  for (const [prefix, label] of prefixes) {
    if (fieldName.startsWith(prefix)) return label;
  }

  return 'Overeenkomst';
}

/**
 * Zet ISO-datumstring (2026-03-04) om naar Nederlands formaat (4 maart 2026).
 */
function _formatDateNL(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${MAANDEN[month - 1]} ${year}`;
}
