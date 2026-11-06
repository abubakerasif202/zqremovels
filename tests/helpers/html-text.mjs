// Extracts visible text from generated HTML with a small character scanner instead of regular
// expressions, so malformed end tags such as "</script >" or "</SCRIPT\n>" are handled the same way
// browsers handle them. Only used by tests on trusted, build-generated pages.

const RAW_TEXT_ELEMENTS = new Set(['script', 'style']);

function isWhitespace(char) {
  return char === ' ' || char === '\n' || char === '\t' || char === '\r' || char === '\f';
}

function isNameStart(char) {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
}

// Returns the index just after the '>' that closes the tag starting at `start`, honouring quoted attributes.
function findTagEnd(html, start) {
  let quote = '';
  for (let i = start; i < html.length; i += 1) {
    const char = html[i];
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '>') {
      return i + 1;
    }
  }
  return html.length;
}

function readTagName(html, start) {
  let end = start;
  while (end < html.length && !isWhitespace(html[end]) && html[end] !== '>' && html[end] !== '/') end += 1;
  return html.slice(start, end).toLowerCase();
}

// Finds the end of the closing tag for a raw-text element (script/style), tolerating whitespace before '>'.
function skipRawTextElement(html, from, name) {
  const lower = html.toLowerCase();
  let cursor = from;
  while (cursor < html.length) {
    const open = lower.indexOf(`</${name}`, cursor);
    if (open === -1) return html.length;
    const after = html[open + 2 + name.length];
    if (after === undefined || after === '>' || after === '/' || isWhitespace(after)) {
      return findTagEnd(html, open);
    }
    cursor = open + 2;
  }
  return html.length;
}

export function visibleText(html) {
  const source = String(html);
  let text = '';
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];
    if (char !== '<' || next === undefined) {
      text += char;
      i += 1;
    } else if (source.startsWith('<!--', i)) {
      const end = source.indexOf('-->', i + 4);
      i = end === -1 ? source.length : end + 3;
      text += ' ';
    } else if (next === '/' || next === '!' || next === '?' || isNameStart(next)) {
      const isClosing = next === '/';
      const name = readTagName(source, i + (isClosing ? 2 : 1));
      const tagEnd = findTagEnd(source, i + 1);
      i = !isClosing && RAW_TEXT_ELEMENTS.has(name) ? skipRawTextElement(source, tagEnd, name) : tagEnd;
      text += ' ';
    } else {
      text += char;
      i += 1;
    }
  }
  return text;
}
