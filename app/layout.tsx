import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import LoginAwareLayout from '@/components/login-aware-layout'
import { IdleSessionGuard } from '@/components/idle-session-guard'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: 'MediCore HMS - Hospital Management System',
  description: 'Professional hospital management system for healthcare facilities',
  icons: {
    icon: [
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4B7BF5' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1f35' },
  ],
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LoginAwareLayout>{children}</LoginAwareLayout>
          <IdleSessionGuard />
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
