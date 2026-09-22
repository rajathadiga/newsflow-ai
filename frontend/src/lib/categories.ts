export type CategoryMeta = {
  label: string;
  emoji: string;
  chip: string; // tailwind bg/text classes for badges
  avatar: string; // tailwind bg class for the source avatar
};

export const CATEGORY_ORDER = ["World", "India", "Technology", "Internet"];

const BASE: Omit<CategoryMeta, "label"> = {
  emoji: "",
  chip: "bg-[#fbd509]/15 text-amber-700 dark:text-[#fbd509]",
  avatar: "bg-stone-800 dark:bg-stone-700",
};

export const CATEGORY_META: Record<string, CategoryMeta> = {
  World: { ...BASE, label: "World" },
  India: { ...BASE, label: "India" },
  Technology: { ...BASE, label: "Technology" },
  Internet: { ...BASE, label: "Internet" },
};

export function categoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? { ...BASE, label: category };
}
