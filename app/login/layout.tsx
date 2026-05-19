export const metadata = {
  title: 'Sign in - Medicare Hospital',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {children}
    </div>
  )
}
