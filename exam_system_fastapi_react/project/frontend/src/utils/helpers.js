export function formatDateTime(value) {
  if (!value) return '-'
  try {
    const date = new Date(value.endsWith?.('Z') ? value : `${value}Z`)
    return date.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return value
  }
}

export function truncate(text, maxLength = 60) {
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
