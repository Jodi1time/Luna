// Compress an image file to a JPEG dataURL bounded by maxDim and
// quality, preserving aspect ratio. The result is small enough to
// store inline on the diary entry (settings JSONB) without blowing
// up profile-row size — typically 30-150KB per photo at 800px.
//
// Resolves with { dataUrl, width, height } or rejects on read/decode
// errors. We avoid the createImageBitmap path so the helper works
// in Safari + Capacitor where support has historically been spotty.
export function compressImage(file, { maxDim = 800, quality = 0.78 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Not an image file'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error || new Error('Could not read file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not decode image'))
      img.onload = () => {
        let { width: w, height: h } = img
        // Scale down so the longest side is at most maxDim.
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * (maxDim / w)); w = maxDim }
          else       { w = Math.round(w * (maxDim / h)); h = maxDim }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        // Fill white so transparent PNGs become white-backed (Polaroid
        // photos historically have no transparency).
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve({ dataUrl, width: w, height: h })
        } catch (e) {
          reject(e)
        }
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
