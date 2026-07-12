export function Button({ children, variant = "primary", href = "#" }) {
  return `<a class="zq-button zq-button-${variant}" href="${href}">${children}</a>`;
}
