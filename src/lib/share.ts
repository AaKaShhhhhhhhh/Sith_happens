/** Share a PNG data-URL via the Web Share API, or fall back to a download. */
export async function shareOrDownload(
  dataUrl: string,
  filename: string,
  text: string,
): Promise<'shared' | 'downloaded'> {
  try {
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], filename, { type: 'image/png' })
    const nav = navigator as Navigator & {
      canShare?: (d: { files: File[] }) => boolean
    }
    if (nav.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({ files: [file], text })
      return 'shared'
    }
  } catch {
    /* fall through to download */
  }
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
  return 'downloaded'
}
