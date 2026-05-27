import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Aura Cafe | Premium Futuristic Dining',
  description: 'Experience luxury dining with our premium futuristic cafe ordering system.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-background text-white min-h-screen">
        <AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(20,20,20,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                backdropFilter: 'blur(20px)',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#fff', secondary: '#000' } },
            }}
          />
          {/* Ambient background */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/3 blur-[150px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/3 blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-white/2 blur-[100px]" />
          </div>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
