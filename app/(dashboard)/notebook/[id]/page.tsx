'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { NotebookLayout } from '@/components/notebook-layout'
import { Button } from '@/components/ui/button'
import { FileText, MessageSquare, Settings } from 'lucide-react'

export default function NotebookPage() {
  const params = useParams()
  const notebookId = params.id as string
  const [noteContent, setNoteContent] = useState('')

  const LeftPanel = () => (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Sources</h2>
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs"
        >
          <FileText className="h-4 w-4" />
          Upload File
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs"
        >
          <MessageSquare className="h-4 w-4" />
          Add URL
        </Button>
      </div>
      <div className="mt-6 border-t border-slate-200 pt-4">
        <h3 className="text-xs font-semibold text-slate-600">No sources yet</h3>
        <p className="mt-1 text-xs text-slate-500">
          Upload files or add URLs to get started
        </p>
      </div>
    </div>
  )

  const CenterPanel = () => (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Untitled Notebook</h1>
        <p className="mt-1 text-sm text-slate-600">Start typing or upload sources to begin</p>
      </div>
      <textarea
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="Write your notes here... Your AI insights will appear as you add sources."
        className="flex-1 resize-none rounded-lg border border-slate-200 p-4 font-mono text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
      />
    </div>
  )

  const RightPanel = () => (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Properties</h2>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-700">Created</label>
          <p className="mt-1 text-xs text-slate-600">{new Date().toLocaleDateString()}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">Status</label>
          <p className="mt-1 inline-block rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700">
            Draft
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200 pt-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <NotebookLayout
        notebookId={notebookId}
        leftPanel={<LeftPanel />}
        centerPanel={<CenterPanel />}
        rightPanel={<RightPanel />}
      />
    </div>
  )
}
