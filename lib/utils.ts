import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { findNavChildByHref } from "@/lib/navigation";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function titleFromSlug(slug?: string[]) {
  if (!slug || slug.length === 0) return "Dashboard";

  const href = `/${slug.join("/")}`;
  const navMatch = findNavChildByHref(href);
  if (navMatch) return navMatch.title;

  return slug
    .map((part) => part.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .join(" / ");
}
