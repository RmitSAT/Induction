// QR Code generation utility
export function generateQRCode(elementId, text, size = 160) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = '';
  new QRCode(el, {
    text,
    width:      size,
    height:     size,
    colorDark:  '#03045E',
    colorLight: '#CAF0F8',
    correctLevel: QRCode.CorrectLevel.M,
  });
}

// QR Scanner wrapper using html5-qrcode
let scannerInstance = null;

export function startQRScanner(elementId, onResult, onError) {
  if (scannerInstance) stopQRScanner();
  scannerInstance = new Html5Qrcode(elementId);
  return scannerInstance.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 220, height: 220 } },
    (decodedText) => {
      const code = decodedText.trim().toUpperCase().slice(0, 6);
      onResult(code);
    },
    (err) => { /* silent scan errors */ }
  ).catch(err => {
    if (onError) onError(err);
  });
}

export async function stopQRScanner() {
  if (scannerInstance) {
    try { await scannerInstance.stop(); } catch {}
    try { scannerInstance.clear(); } catch {}
    scannerInstance = null;
  }
}
