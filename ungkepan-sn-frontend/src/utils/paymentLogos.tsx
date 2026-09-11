export function DANA({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#009688" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial">DANA</text>
    </svg>
  )
}

export function OVO({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#4A148C" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">OVO</text>
    </svg>
  )
}

export function GoPay({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#00AA6C" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial">GoPay</text>
    </svg>
  )
}

export function BNI({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#0B4A8A" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">BNI</text>
    </svg>
  )
}

export function BCA({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#1B5E7B" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">BCA</text>
    </svg>
  )
}

export function Mandiri({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#1B4B87" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">Mandiri</text>
    </svg>
  )
}

export function BRI({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#00529C" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">BRI</text>
    </svg>
  )
}

export function QRISIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#1A1A1A" />
      <rect x="9" y="9" width="10" height="10" rx="2" stroke="white" strokeWidth="2" fill="none" />
      <rect x="21" y="9" width="10" height="10" rx="2" stroke="white" strokeWidth="2" fill="none" />
      <rect x="9" y="21" width="10" height="10" rx="2" stroke="white" strokeWidth="2" fill="none" />
      <rect x="21" y="21" width="10" height="10" rx="2" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  )
}

export function COD({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#4CAF50" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">COD</text>
    </svg>
  )
}

const logoMap: Record<string, React.ElementType> = {
  dana: DANA,
  ovo: OVO,
  gopay: GoPay,
  bni: BNI,
  bca: BCA,
  mandiri: Mandiri,
  bri: BRI,
  qris: QRISIcon,
  cod: COD,
}

export function getPaymentLogo(label: string, logoField?: string): React.ElementType | null {
  if (logoField) return null

  const lower = label.toLowerCase()
  for (const [key, Component] of Object.entries(logoMap)) {
    if (lower.includes(key)) return Component
  }
  return null
}
export function hasLogoSvg(label: string): boolean {
  const lower = label.toLowerCase()
  return Object.keys(logoMap).some((key) => lower.includes(key))
}
