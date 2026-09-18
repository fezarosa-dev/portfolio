import { cookies } from 'next/headers'
import { getDictionary } from '@/lib/i18n'
import { CookieConsentBanner } from '@/components/cookie-consent-banner'

export async function CookieConsent() {
  const [cookieStore, { dict, locale }] = await Promise.all([cookies(), getDictionary()])
  const decided = cookieStore.get('cookie-consent')?.value !== undefined

  return (
    <CookieConsentBanner
      show={!decided}
      locale={locale}
      message={dict.consent.message}
      acceptLabel={dict.consent.accept}
      declineLabel={dict.consent.decline}
      policyLinkLabel={dict.consent.policyLink}
    />
  )
}
