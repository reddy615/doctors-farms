import { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Rooms", to: "/rooms" },
  { label: "About", to: "/about" },
  { label: "Activities", to: "/activities" },
  { label: "Dining", to: "/dining" },
  { label: "Gallery", to: "/gallery" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-500/90 flex items-center justify-center text-white font-semibold">
            DF
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight text-slate-900">Doctors Farms</div>
            <div className="text-xs text-slate-500">Resort & Wellness Retreat</div>
          </div>
        </div>

        <nav className="hidden gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/contact"
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-700"
          >
            Book now
          </a>
          <button
            type="button"
            className={`md:hidden rounded-full p-2 text-slate-600 hover:bg-slate-100 transition-colors ${
              isMenuOpen ? 'bg-slate-100' : ''
            }`}
            aria-label="Open menu"
            onClick={() => {
              console.log('Menu button clicked, toggling from', isMenuOpen, 'to', !isMenuOpen);
              setIsMenuOpen(!isMenuOpen);
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 7h16M4 12h16M4 17h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
          <nav className="flex flex-col gap-2 p-4 max-h-96 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
                onClick={() => {
                  console.log('Navigating to', item.to, 'and closing menu');
                  setIsMenuOpen(false);
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
