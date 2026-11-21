import type { CSSProperties } from "react";
/** Preserve visibility/layout controls while leaving the client visual design unset. */
export function uiClasses(value: string | undefined): string {
  return (value || "").split(/\s+/).filter(token => /^(?:(?:sm|md|lg|xl|2xl|print|hover|focus|focus-visible|disabled|group-hover):)*-?(?:hidden|block|inline|inline-block|flex|inline-flex|grid|sr-only|not-sr-only|visible|invisible|collapse|fixed|absolute|relative|sticky|static|transform|overlay|group|break-inside-avoid|ri-[a-z-]+|(?:inset|inset-x|inset-y|top|right|bottom|left|z|overflow|overflow-x|overflow-y|h|w|min-h|max-h|min-w|max-w|opacity|pointer-events|select|translate-x|translate-y|scale|rotate|flex|items|justify|gap|grid-cols|col-span)-.+)$/.test(token)).join(" ");
}
export function uiStyle(value: CSSProperties | undefined): CSSProperties | undefined {
  if (!value) return undefined;
  const keys = new Set(["display", "visibility", "position", "inset", "top", "right", "bottom", "left", "zIndex", "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight", "overflow", "overflowX", "overflowY", "flex", "flexDirection", "gridTemplateColumns"]);
  return Object.fromEntries(Object.entries(value).filter(([key]) => keys.has(key))) as CSSProperties;
}
export function iconLabel(value: string | undefined): string {
  const name = value?.match(/ri-([\w-]+)-(?:line|fill)/)?.[1] || "";
  return ({close:"×", "arrow-down-s":"▾", "arrow-up-s":"▴", "arrow-left":"←", "arrow-right":"→", add:"+", check:"✓", "checkbox-circle":"✓", "error-warning":"!"} as Record<string,string>)[name] ?? name.replaceAll("-", " ");
}
