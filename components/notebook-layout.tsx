'use client'

import { ReactNode, useState } from 'react'
import {
  PanelGroup,
  Panel,
  PanelResizer,
} from 'react-resizable-panels'

interface NotebookLayoutProps {
  notebookId: string
  leftPanel: ReactNode
  centerPanel: ReactNode
  rightPanel: ReactNode
}

export function NotebookLayout({
  notebookId,
  leftPanel,
  centerPanel,
  rightPanel,
}: NotebookLayoutProps) {
  const [sizes, setSizes] = useState<number[]>([20, 60, 20])

  return (
    <div className="h-full w-full">
      <PanelGroup
        direction="horizontal"
        onLayout={(newSizes: number[]) => setSizes(newSizes)}
        className="h-full"
      >
        {/* Left Panel - Sidebar/Navigation */}
        <Panel defaultSize={sizes[0]} minSize={15} maxSize={30}>
          <div className="flex h-full flex-col border-r border-slate-200 bg-white">
            {leftPanel}
          </div>
        </Panel>

        {/* Left Resizer */}
        <PanelResizer className="w-1 bg-slate-200 transition-colors hover:bg-slate-300 active:bg-blue-500" />

        {/* Center Panel - Main Editor */}
        <Panel defaultSize={sizes[1]} minSize={40}>
          <div className="flex h-full flex-col bg-white p-6">
            {centerPanel}
          </div>
        </Panel>

        {/* Right Resizer */}
        <PanelResizer className="w-1 bg-slate-200 transition-colors hover:bg-slate-300 active:bg-blue-500" />

        {/* Right Panel - Properties/Notes */}
        <Panel defaultSize={sizes[2]} minSize={15} maxSize={30}>
          <div className="flex h-full flex-col border-l border-slate-200 bg-slate-50">
            {rightPanel}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
