import { DYES, type Entry } from '../data/family'

const NOW = 2024

export default function ReadScene({ entry, onBack }: { entry: Entry; onBack: () => void }) {
  const kept = NOW - entry.year
  return (
    <section className="scene rd">
      <div className="veil" />
      <div className="sb"><span>9:42</span><span className="i">&#8734;</span></div>
      <button className="back" onClick={onBack}>&lsaquo; the legacy</button>
      <div className="body">
        <article className="card">
          <div className="glow" style={{ background: `radial-gradient(circle, ${DYES[entry.dye].hex}66, transparent 64%)` }} />
          <div className="kick">{entry.kind} &middot; {entry.author}</div>
          <h2>{entry.title}</h2>
          <div className="by">left in the legacy &middot; Anno {entry.year}</div>
          {entry.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <div className="foot">
            <span>by {entry.author} &middot; {DYES[entry.dye].label}</span>
            <span>{kept > 0 ? `kept ${kept} years` : 'added this year'}</span>
          </div>
        </article>
      </div>
    </section>
  )
}
