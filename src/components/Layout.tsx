import { Link, NavLink, Outlet } from 'react-router-dom'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `font-serif italic tracking-tight pb-1 transition-opacity duration-100 ${
    isActive
      ? 'text-stone-900 dark:text-stone-50 border-b-2 border-stone-800 dark:border-stone-200'
      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 hover:opacity-80'
  }`

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <header className="fixed w-full top-0 left-0 z-50 flex justify-between items-center px-6 md:px-12 py-6 bg-cream dark:bg-stone-900 border-b border-stone-200/60 dark:border-stone-700">
        <Link
          to="/"
          className="text-xl md:text-2xl font-serif uppercase tracking-[0.2em] text-stone-900 dark:text-stone-50"
        >
          Moodify
        </Link>
        <nav className="flex flex-wrap gap-4 md:gap-10 items-center justify-end max-w-[min(100%,20rem)] md:max-w-none">
          <NavLink to="/dashboard" className={navClass}>
            Reports
          </NavLink>
          <NavLink to="/compare" className={navClass}>
            Compare
          </NavLink>
          <NavLink to="/share" className={navClass}>
            Share
          </NavLink>
        </nav>
        <span className="material-symbols-outlined text-stone-800 dark:text-stone-100" aria-hidden>
          person
        </span>
      </header>

      <div className="flex flex-1 pt-[4.5rem]">
        <aside className="hidden md:flex w-64 shrink-0 flex-col gap-8 py-12 bg-surface-dim dark:bg-stone-800 border-r border-outline/10">
          <div className="px-8 mb-4">
            <p className="font-label text-[0.75rem] font-medium tracking-widest text-stone-800 dark:text-stone-100 uppercase">
              Analysis
            </p>
            <p className="font-label text-[0.6rem] tracking-widest text-stone-500">v.1</p>
          </div>
          <nav className="flex flex-col gap-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-4 pl-8 py-3 font-label text-[0.75rem] font-medium tracking-widest transition-colors ${
                  isActive
                    ? 'border-l-2 border-stone-800 dark:border-stone-200 text-stone-900 dark:text-stone-50 bg-stone-200/40 dark:bg-stone-700/40'
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
                }`
              }
            >
              <span className="material-symbols-outlined text-sm">history</span>
              Chronology
            </NavLink>
            <NavLink
              to="/dashboard"
              className="flex items-center gap-4 pl-8 py-3 text-stone-500 dark:text-stone-400 font-label text-[0.75rem] font-medium tracking-widest hover:bg-stone-200/50 dark:hover:bg-stone-700/50"
            >
              <span className="material-symbols-outlined text-sm">psychology</span>
              Sentiment
            </NavLink>
            <NavLink
              to="/compare"
              className="flex items-center gap-4 pl-8 py-3 text-stone-500 dark:text-stone-400 font-label text-[0.75rem] font-medium tracking-widest hover:bg-stone-200/50 dark:hover:bg-stone-700/50"
            >
              <span className="material-symbols-outlined text-sm">bar_chart</span>
              Frequency
            </NavLink>
            <NavLink
              to="/dashboard"
              className="flex items-center gap-4 pl-8 py-3 text-stone-500 dark:text-stone-400 font-label text-[0.75rem] font-medium tracking-widest hover:bg-stone-200/50 dark:hover:bg-stone-700/50"
            >
              <span className="material-symbols-outlined text-sm">science</span>
              Cognition
            </NavLink>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 px-6 md:px-12 py-10 md:py-12">
          <Outlet />
        </main>
      </div>

      <footer className="flex flex-col items-center justify-center py-16 gap-6 w-full bg-cream dark:bg-stone-900 border-t border-stone-300 dark:border-stone-700">
        <div className="font-serif text-lg text-stone-900 dark:text-stone-50 tracking-[0.2em] uppercase">
          Moodify
        </div>
        <nav className="flex gap-8 font-label text-[10px] tracking-[0.3em] uppercase text-stone-800 dark:text-stone-100">
          <span className="opacity-60">Privacy</span>
          <span className="opacity-60">Terms</span>
          <span className="opacity-60">Feedback</span>
        </nav>
        <p className="font-label text-[10px] tracking-[0.3em] uppercase text-stone-500 dark:text-stone-400">
          Not medical advice — reflective analysis only
        </p>
      </footer>
    </div>
  )
}
