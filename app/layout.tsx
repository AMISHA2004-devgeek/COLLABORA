import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import NextTopLoader from "nextjs-toploader";


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'COLLABORA',
  description: 'AI-powered research notebook',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
         <NextTopLoader showSpinner={false} />

          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
