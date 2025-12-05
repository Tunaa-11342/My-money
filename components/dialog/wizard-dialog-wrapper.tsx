"use client"

import { WizardDialog } from "./wizard-dialog"

export function WizardDialogWrapper({
  user,
  settings,
}: {
  user: any
  settings: any
}) {
  if (!settings || settings.firstLogin) {
    return <WizardDialog user={user} settings={settings} />
  }

  return null
}
