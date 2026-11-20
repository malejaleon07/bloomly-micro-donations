import { Link } from 'react-router-dom'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-blush/60 bg-lavender/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <Logo size="sm" />
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            Small acts. Real impact. A warm place to care for neighbors — and
            grow a little yourself.
          </p>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-ink">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/explore" className="text-ink/70 no-underline hover:text-plum">
                Make an Impact
              </Link>
            </li>
            <li>
              <Link to="/request" className="text-ink/70 no-underline hover:text-plum">
                Start a request
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-ink/70 no-underline hover:text-plum">
                Login / Sign up
              </Link>
            </li>
            <li>
              <Link to="/reviewer" className="text-ink/70 no-underline hover:text-plum">
                Reviewer demo
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-ink">Demo notice</h4>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            Built for the UBC 2026 Blockchain Hackathon. Sample campaigns are
            clearly labeled. No real KYC, bank payouts, or card payments in this
            demo. Accounts are demo-only (no passwords stored).
          </p>
        </div>
      </div>
      <div className="border-t border-blush/50 py-4 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} Bloomly · Hackathon demo
      </div>
    </footer>
  )
}
