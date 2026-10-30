export function Card({ children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 ${className}`}>{children}</section>
}
