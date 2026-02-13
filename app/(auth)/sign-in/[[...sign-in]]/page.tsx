import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
        <p className="mt-2 text-sm text-slate-600">Welcome back to COLLABORA</p>
      </div>
      <SignIn />
    </div>
  )
}
