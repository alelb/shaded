// Breakpoints in px, mobile first: styles target phones by default and are enhanced with `min-width` queries only.
// CSS custom properties cannot be used inside media queries, so these values are mirrored as literals in CSS.
export const breakpoints = {
  tablet: 640,
  desktop: 1024,
} as const;
