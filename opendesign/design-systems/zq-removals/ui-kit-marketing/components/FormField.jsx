export function FormField({ label, name, type = "text", placeholder = "" }) {
  return `<label class="zq-field"><span>${label}</span><input name="${name}" type="${type}" placeholder="${placeholder}" /></label>`;
}
