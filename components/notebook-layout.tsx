'use client'

import { ReactNode, useState } from 'react'
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";

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
        <Panel defaultSize={sizes[0]} minSize={15} maxSize={30}>
          <div className="flex h-full flex-col border-r border-slate-200 bg-white">
            {leftPanel}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-200 transition-colors hover:bg-slate-300 active:bg-blue-500" />

        <Panel defaultSize={sizes[1]} minSize={40}>
          <div className="flex h-full flex-col bg-white p-6">
            {centerPanel}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-200 transition-colors hover:bg-slate-300 active:bg-blue-500" />

        <Panel defaultSize={sizes[2]} minSize={15} maxSize={30}>
          <div className="flex h-full flex-col border-l border-slate-200 bg-slate-50">
            {rightPanel}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
