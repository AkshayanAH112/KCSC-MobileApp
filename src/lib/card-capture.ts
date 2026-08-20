import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"

/**
 * Captures a DOM node to PNG and hands it to the native share sheet — the
 * standard pattern for "download" inside a Capacitor WebView, which has no
 * filesystem-visible Downloads folder of its own. Shared by the Student ID
 * card and Membership card, so this logic exists exactly once (unlike the
 * Web app, which has near-identical html2canvas-pro snippets duplicated
 * across the students and members pages).
 */
export async function downloadCardImage(node: HTMLElement, filename: string): Promise<void> {
  // html2canvas-pro, not html2canvas: this app's CSS tokens use oklch(), which
  // only the -pro fork's color parser understands — same reason the Web app uses it.
  const html2canvas = (await import("html2canvas-pro")).default
  const canvas = await html2canvas(node, { scale: 4, useCORS: true, backgroundColor: "#ffffff" })
  const dataUrl = canvas.toDataURL("image/png")
  const base64 = dataUrl.split(",")[1]

  // Directory.Cache (not External/Documents) deliberately avoids Android's
  // scoped-storage runtime-permission dance entirely.
  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  })

  await Share.share({ title: filename, url: uri })
}
