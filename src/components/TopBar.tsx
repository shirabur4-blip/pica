import { Activity, BookOpen, CalendarCheck2, ShieldAlert } from 'lucide-react';

export type AppTab = 'today' | 'stages' | 'journal' | 'safety';

interface TopBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onQuickLogPain: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string; shortLabel: string; icon: typeof Activity }[] = [
  { id: 'today', label: 'התוכנית היום', shortLabel: 'היום', icon: CalendarCheck2 },
  { id: 'stages', label: 'שלבי השיקום', shortLabel: 'שלבים', icon: BookOpen },
  { id: 'journal', label: 'יומן כאב ותסמינים', shortLabel: 'יומן כאב', icon: Activity },
  { id: 'safety', label: 'בטיחות והתאמה', shortLabel: 'בטיחות', icon: ShieldAlert },
];

export function TopBar({ activeTab, onSelectTab, onQuickLogPain }: TopBarProps) {
  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 lg:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('today')}
            className="font-display text-lg lg:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-teal-700 transition-colors cursor-pointer"
          >
            צעד יציב
          </button>

          {/* Zone 2: 4 single-line navigation links */}
          <nav aria-label="ניווט ראשי" className="hidden lg:flex items-center gap-6">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`py-2 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-teal-700 text-teal-800'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary action button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onQuickLogPain}
              className="px-4 py-2 min-h-[40px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              רישום כאב יומי
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (under 15% sticky height cap combined with 56px top bar) */}
      <nav
        aria-label="ניווט תחתון"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 h-14">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={`flex flex-col items-center justify-center gap-0.5 px-1 min-h-[44px] transition-colors cursor-pointer ${
                  isActive ? 'text-teal-800 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[11px] leading-tight whitespace-nowrap truncate max-w-full">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
