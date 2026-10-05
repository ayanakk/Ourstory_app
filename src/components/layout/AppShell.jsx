import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home, BookOpen, Clock, MapPin, Image, Package,
  ListChecks, BarChart2, Search, Settings, Plus
} from 'lucide-react'
import { useSpace } from '../../hooks/useSpace'
import CreateMemoryWizard from '../memory/CreateMemoryWizard'
import Button from '../ui/Button'
import PageTransition from './PageTransition'

const NAV_ITEMS = [
  { to: '/',            label: 'Home',        Icon: Home },
  { to: '/story',       label: 'Our Story',   Icon: BookOpen },
  { to: '/time-machine',label: 'Time Machine',Icon: Clock },
  { to: '/places',      label: 'Places',      Icon: MapPin },
  { to: '/photo-wall',  label: 'Photo Wall',  Icon: Image },
  { to: '/capsules',    label: 'Capsules',    Icon: Package },
  { to: '/wishlist',    label: 'Bucket list', Icon: ListChecks },
  { to: '/numbers',     label: 'Numbers',     Icon: BarChart2 },
  { to: '/search',      label: 'Search',      Icon: Search },
  { to: '/settings',    label: 'Settings',    Icon: Settings },
]

const BOTTOM_NAV = [
  { to: '/',           label: 'Home',    Icon: Home },
  { to: '/story',      label: 'Story',   Icon: BookOpen },
  null, // center create button
  { to: '/photo-wall', label: 'Wall',    Icon: Image },
  { to: '/settings',   label: 'Settings',Icon: Settings },
]

/* ── Sidebar NavItem ────────────────────────────────────────── */
function SideNavItem({ to, label, Icon }) {
  const exactRoutes = ['/']
  const isExact = exactRoutes.includes(to)

  return (
    <NavLink
      to={to}
      end={isExact}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-4 py-2.5 rounded-[var(--r-xs)] text-sm font-medium',
          'transition-all relative group select-none',
          isActive
            ? 'bg-accent-soft text-accent'
            : 'text-ink-muted hover:text-ink hover:bg-surface-2',
        ].join(' ')
      }
      style={{ transitionDuration: 'var(--dur-fast)' }}
    >
      {({ isActive }) => (
        <>
          {/* Active indicator */}
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-accent"
              aria-hidden="true"
            />
          )}
          <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

/* ── Bottom Nav Item ────────────────────────────────────────── */
function BottomNavItem({ to, label, Icon }) {
  const exactRoutes = ['/']
  const isExact = exactRoutes.includes(to)

  return (
    <NavLink
      to={to}
      end={isExact}
      className={({ isActive }) =>
        [
          'flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1 flex-1',
          'transition-colors',
          isActive ? 'text-accent' : 'text-ink-muted',
        ].join(' ')
      }
      style={{ transitionDuration: 'var(--dur-fast)' }}
    >
      {({ isActive }) => (
        <>
          <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
          <span className="text-[10px] font-medium">{label}</span>
        </>
      )}
    </NavLink>
  )
}

/* ── AppShell ───────────────────────────────────────────────── */
export default function AppShell({ children }) {
  const { member, partner } = useSpace()
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const partnerLine = (() => {
    if (member && partner) return `${member.display_name} & ${partner.display_name}`
    if (member) return member.display_name
    return null
  })()

  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--bg)' }}>

      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-dvh z-30 border-r border-line"
        style={{ width: 'var(--sidebar-w)', background: 'var(--surface)' }}
      >
        {/* Wordmark */}
        <div className="px-6 pt-8 pb-6 flex-shrink-0">
          <span
            className="text-[22px] text-ink tracking-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Our Story
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 flex flex-col gap-0.5">
          {NAV_ITEMS.map(item => (
            <SideNavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-5 border-t border-line flex-shrink-0 space-y-4">
          <p className="text-xs text-ink-muted px-1 truncate">
            {partnerLine ?? (
              <span className="italic">Waiting for your person…</span>
            )}
          </p>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={15} strokeWidth={2.5} className="mr-1.5" />
            Create a Memory
          </Button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ───────────────────────────────────── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 h-14 border-b border-line backdrop-blur-xl"
        style={{ background: 'var(--glass)' }}
      >
        <span
          className="text-xl text-ink"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          Our Story
        </span>
        <NavLink
          to="/search"
          aria-label="Search"
          className="p-2 rounded-full text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
          style={{ transitionDuration: 'var(--dur-fast)' }}
        >
          <Search size={20} />
        </NavLink>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col min-w-0"
        style={{ paddingLeft: 'var(--sidebar-w)' }}
      >
        {/* Offset for desktop sidebar */}
        <style>{`
          @media (max-width: 1023px) {
            main { padding-left: 0 !important; padding-top: 56px; padding-bottom: 72px; }
          }
        `}</style>

        <div className="flex-1 w-full min-w-0 overflow-x-hidden max-w-[1100px] mx-auto px-6 lg:px-10 py-8 lg:py-10">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </div>
      </main>

      {/* ── Mobile Bottom Nav ────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-end border-t border-line backdrop-blur-xl"
        style={{
          background: 'var(--glass)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: '64px',
        }}
      >
        {BOTTOM_NAV.map((item, i) => {
          if (item === null) {
            return (
              <div key="create" className="flex-1 flex justify-center items-center -mt-6">
                <button
                  onClick={() => setCreateOpen(true)}
                  aria-label="Create a memory"
                  className="flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95"
                  style={{
                    width: 56,
                    height: 56,
                    background: 'var(--accent)',
                    color: 'var(--accent-ink)',
                    boxShadow: '0 4px 20px rgba(183,110,121,0.45)',
                    transitionDuration: 'var(--dur-fast)',
                  }}
                >
                  <Plus size={24} strokeWidth={2.2} />
                </button>
              </div>
            )
          }
          return <BottomNavItem key={item.to} {...item} />
        })}
      </nav>

      {/* ── Create Memory Wizard ──────────────────────────── */}
      <CreateMemoryWizard
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(memory) => {
          if (memory?.id) navigate(`/memory/${memory.id}`)
        }}
      />
    </div>
  )
}
