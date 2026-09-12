const editable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest("input, textarea, [contenteditable='true']"));

/** Prevent WebView long-press/context menus on game chrome while preserving fields. */
export function installInteractionLock(root: Document = document) {
  for (const type of [
    "contextmenu",
    "selectstart",
    "dragstart",
    "copy",
    "cut",
  ] as const) {
    root.addEventListener(
      type,
      (event) => {
        if (!editable(event.target)) event.preventDefault();
      },
      { capture: true },
    );
  }
}
