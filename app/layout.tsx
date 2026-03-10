import React from "react"
import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Neon AI - Your Smart Shopping Assistant',
  description: 'Analyze and compare clothing products from e-commerce websites with AI-powered recommendations',
  generator: 'v0.app',
  icons: {
    icon: '/placeholder-logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
