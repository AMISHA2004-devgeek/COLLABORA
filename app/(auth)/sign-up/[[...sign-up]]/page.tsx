import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
        <p className="mt-2 text-sm text-slate-600">Get started with COLLABORA</p>
      </div>
      <SignUp />
    </div>
  )
}
