/** Products per page on the category and search pages. */
export const PRODUCTS_PER_PAGE = 12;

/** The `?page=` value as a page number: anything but a positive integer is page 1. */
export function parsePage(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** Page numbers to show, with `null` for a gap: [1, null, 9, 10, 11, null, 20]. */
export function pageItems(current: number, last: number, around = 1): (number | null)[] {
  const wanted = new Set<number>([1, last]);
  for (let page = current - around; page <= current + around; page += 1) {
    if (page >= 1 && page <= last) wanted.add(page);
  }

  const items: (number | null)[] = [];
  let previous = 0;
  for (const page of [...wanted].sort((a, b) => a - b)) {
    if (page - previous === 2) items.push(previous + 1);
    else if (page - previous > 2) items.push(null);
    items.push(page);
    previous = page;
  }
  return items;
}

/** `/?category=x&page=2`; page 1 carries no `page` parameter. */
export function pageHref(params: { category?: string; search?: string }, page: number): string {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `/?${text}` : "/";
}
