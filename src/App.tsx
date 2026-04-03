import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import SavedLeadsPage from './pages/SavedLeadsPage';
import HistoryPage from './pages/HistoryPage';
import { Search, Bookmark, Clock, Crosshair, Flame } from 'lucide-react';

function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/', icon: Search, label: 'Search' },
    { to: '/saved', icon: Bookmark, label: 'CRM' },
    { to: '/history', icon: Clock, label: 'History' },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-hot/10 border border-accent/25">
                <Crosshair className="h-5 w-5 text-accent" />
                <Flame className="absolute -top-1 -right-1 h-3 w-3 text-hot" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary tracking-tight">LeadScope</h1>
                <p className="text-[10px] text-text-muted -mt-0.5 hidden sm:block font-medium uppercase tracking-widest">Smart Lead Intelligence</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 flex flex-col gap-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/saved" element={<SavedLeadsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
