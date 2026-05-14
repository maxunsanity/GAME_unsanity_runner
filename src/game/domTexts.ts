/** `05_text_strings.csv` 표기 — `[data-text-id]` 가 있으면 채운다 (`textCopyIds.ts`·index.html 과 id 일치). */
export function bootstrapDomTexts(
  textById: Record<string, string>,
  root: ParentNode = document.body,
): void {
  root.querySelectorAll<HTMLElement>('[data-text-id]').forEach((el) => {
    const id = el.getAttribute('data-text-id');
    if (!id) return;
    const v = textById[id];
    if (v !== undefined) el.textContent = v;
  });
}
