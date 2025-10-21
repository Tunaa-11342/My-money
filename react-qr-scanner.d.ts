declare module "react-qr-scanner" {
  import * as React from "react"

  export interface QrScannerProps {
    delay?: number
    style?: React.CSSProperties
    onError?: (error: any) => void
    onScan?: (data: string | null) => void
    constraints?: MediaTrackConstraints
  }

  export default class QrScanner extends React.Component<QrScannerProps> {}
}
