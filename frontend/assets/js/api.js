/**
 * api.js — alle communicatie met de Prelegal backend
 * Andere modules roepen alleen deze functies aan, nooit fetch() direct.
 */

/**
 * Haal metadata van alle templates op (zonder documenttekst).
 * @returns {Promise<Array>} - Array van { id, name, category, description, variable_count }
 */
export async function getAllTemplates() {
  const response = await fetch('/api/templates');
  if (!response.ok) throw new Error(`API fout: ${response.status}`);
  const data = await response.json();
  return data.templates;
}

/**
 * Haal één volledig template op, inclusief variables[] en content.
 * @param {string} id - bijv. "nda" of "arbeidsovereenkomst"
 * @returns {Promise<Object>} - Het volledige template-object
 */
export async function getTemplate(id) {
  const response = await fetch(`/api/templates/${id}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error(`Template '${id}' bestaat niet`);
    throw new Error(`API fout: ${response.status}`);
  }
  return response.json();
}

/**
 * Stuur een chatbericht naar de NDA AI assistent.
 * @param {Array}  messages      - Array van {role, content} objecten
 * @param {Object} currentValues - Huidige veldwaarden { veldnaam: waarde }
 * @returns {Promise<{reply: string, patches: Array}>}
 */
export async function sendNdaChat(messages, currentValues) {
  const response = await fetch('/api/nda-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, current_values: currentValues }),
  });
  if (!response.ok) throw new Error(`API fout: ${response.status}`);
  return response.json();
}
