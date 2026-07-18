/** Responsive package card grid — works for 1…N packages (not locked to 3). */
export function packageGridClass(count: number): string {
  if (count <= 1) return "grid gap-6 md:max-w-md md:mx-auto";
  if (count === 2) return "grid gap-6 md:grid-cols-2 md:max-w-4xl md:mx-auto";
  if (count === 3) return "grid gap-6 lg:grid-cols-3";
  if (count === 4) return "grid gap-6 md:grid-cols-2 xl:grid-cols-4";
  return "grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";
}
