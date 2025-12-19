"use client"

import { WizardDialog } from "./wizard-dialog"

export function WizardDialogWrapper({ user, settings }: { user: any; settings: any }) {
  if (!user) return null
  if (!settings) return null
  if (!settings.firstLogin) return null
  return <WizardDialog user={user} settings={settings} />
}
