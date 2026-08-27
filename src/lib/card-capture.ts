import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"

/**
 * Captures a DOM node to a PNG in the app's cache and returns its file:// URI.
 *
 * html2canvas-pro, not html2canvas: this app's CSS tokens use oklch(), which
 * only the -pro fork's color parser understands — same reason the Web app uses it.
 *
 * Directory.Cache (not External/Documents) deliberately avoids Android's
 * scoped-storage runtime-permission dance entirely.
 */
async function captureToCache(node: HTMLElement, filename: string): Promise<string> {
  const html2canvas = (await import("html2canvas-pro")).default
  const canvas = await html2canvas(node, { scale: 4, useCORS: true, backgroundColor: "#ffffff" })
  const base64 = canvas.toDataURL("image/png").split(",")[1]

  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  })
  return uri
}

/**
 * Captures a DOM node to PNG and hands it to the native share sheet — the
 * standard pattern for "download" inside a Capacitor WebView, which has no
 * filesystem-visible Downloads folder of its own. Shared by the Student ID
 * card and Membership card, so this logic exists exactly once (unlike the
 * Web app, which has near-identical html2canvas-pro snippets duplicated
 * across the students and members pages).
 */
export async function downloadCardImage(node: HTMLElement, filename: string): Promise<void> {
  const uri = await captureToCache(node, filename)
  await Share.share({ title: filename, url: uri })
}

/**
 * Same, for several cards at once — one share sheet carrying every file, so a
 * membership card's front and back reach WhatsApp in a single send instead of
 * two.
 *
 * `files` (Share plugin >= 4.1) is what makes this possible; `url` is
 * single-file only. Captures run one after another rather than in parallel:
 * html2canvas rasterises at scale 4, and two of those at once is a lot to ask
 * of a mid-range phone.
 */
export async function downloadCardImages(
  cards: { node: HTMLElement; filename: string }[],
  title: string
): Promise<void> {
  const uris: string[] = []
  for (const card of cards) {
    uris.push(await captureToCache(card.node, card.filename))
  }
  await Share.share({ title, files: uris })
}
