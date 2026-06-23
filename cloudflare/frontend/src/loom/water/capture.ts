// Lets any screen grab a still of the live water (used by the Volume / book
// cover: "the colour your family was the day it was printed"). The WaterCanvas
// registers its element here on mount.
export const waterRef: { canvas: HTMLCanvasElement | null } = { canvas: null };

export function captureWater(quality = 0.92): string {
  if (!waterRef.canvas) return '';
  try {
    return waterRef.canvas.toDataURL('image/jpeg', quality);
  } catch {
    return '';
  }
}
