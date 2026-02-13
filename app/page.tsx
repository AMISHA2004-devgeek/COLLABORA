'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BookOpen, Sparkles, Zap } from 'lucide-react'

export default function Page() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/dashboard')
    }
  }, [isLoaded, userId, router])

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="text-2xl font-bold text-slate-900">COLLABORA</div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/sign-in')}>
            Sign In
          </Button>
          <Button onClick={() => router.push('/sign-up')}>Get Started</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20">
        <div className="max-w-2xl text-center">
          <div className="mb-6 flex justify-center gap-2">
            <div className="rounded-full bg-blue-100 p-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div className="rounded-full bg-amber-100 p-3">
              <Zap className="h-6 w-6 text-amber-600" />
            </div>
          </div>

          <h1 className="mb-4 text-5xl font-bold tracking-tight text-slate-900">
            AI-Powered Research Notebook
          </h1>
          <p className="mb-8 text-lg text-slate-600">
            Organize your research, generate insights, and collaborate with AI. COLLABORA helps you
            make sense of your documents and extract actionable knowledge.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/sign-up')}
              className="gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Start Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/sign-in')}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <BookOpen className="mb-3 h-6 w-6 text-blue-600" />
            <h3 className="mb-2 font-semibold text-slate-900">Organize Sources</h3>
            <p className="text-sm text-slate-600">Upload and manage multiple documents and sources in one place</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <Sparkles className="mb-3 h-6 w-6 text-purple-600" />
            <h3 className="mb-2 font-semibold text-slate-900">AI Insights</h3>
            <p className="text-sm text-slate-600">Get instant summaries, analysis, and key takeaways powered by AI</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <Zap className="mb-3 h-6 w-6 text-amber-600" />
            <h3 className="mb-2 font-semibold text-slate-900">Fast & Smart</h3>
            <p className="text-sm text-slate-600">Quickly extract insights and create structured notes from research</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-600">
        <p>Built with Next.js, Clerk, and AI technology</p>
      </footer>
    </div>
  )
}
