import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { shouldRedirectToLogin } from '@/lib/auth-guard'
import { detectLocaleFromAcceptLanguage } from '@/lib/i18n/detect-locale'
import type { Locale } from '@/lib/i18n/dictionaries'

const PASSTHROUGH_PREFIXES = ['/admin', '/api']

function isPassthrough(pathname: string) {
  return PASSTHROUGH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

async function handleAdmin(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (shouldRedirectToLogin(request.nextUrl.pathname, Boolean(user))) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return response
}

function detectLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get('locale')?.value
  if (cookieLocale === 'pt' || cookieLocale === 'en') return cookieLocale
  return detectLocaleFromAcceptLanguage(request.headers.get('accept-language') ?? '')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPassthrough(pathname)) {
    return pathname.startsWith('/admin') ? handleAdmin(request) : NextResponse.next()
  }

  const [, first, ...rest] = pathname.split('/')

  if (first === 'pt' || first === 'en') {
    const url = request.nextUrl.clone()
    url.pathname = `/${rest.join('/')}`
    const response = NextResponse.rewrite(url)
    response.headers.set('x-locale', first)
    return response
  }

  const locale = detectLocale(request)
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url, 302)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|opengraph-image|.*\\..*).*)'],
}
