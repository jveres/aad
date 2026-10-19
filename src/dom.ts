type Child = Node | string | null | undefined | false;
type Attrs = Record<string, string | number | boolean | EventListener | undefined>;

/** Creates an element. Strings become text nodes, so content is never parsed as HTML. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (typeof value === "function") el.addEventListener(key.replace(/^on/, ""), value);
    else el.setAttribute(key, value === true ? "" : String(value));
  }
  el.append(
    ...children.filter((c): c is Node | string => c !== null && c !== undefined && c !== false),
  );
  return el;
}

/** Renders `code` spans written with backticks. */
export function inline(text: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  text.split(/(`[^`]+`)/).forEach((part) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      frag.append(h("code", {}, part.slice(1, -1)));
    } else if (part) frag.append(part);
  });
  return frag;
}

export function $<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`missing element: ${selector}`);
  return el;
}

export const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage is a convenience; the page works without it.
    }
  },
};
