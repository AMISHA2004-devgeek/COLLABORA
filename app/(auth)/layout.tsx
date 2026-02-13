import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'COLLABORA',
  description: 'Sign in or sign up to your COLLABORA account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
