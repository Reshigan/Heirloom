import { CONTRIBUTIONS, DYES, TOTAL_DROPS } from '../data/family'

export default function ColourScene({ onBack }: { onBack: () => void }) {
  return (
    <section className="scene co">
      {/* veil with a circular hole punched out, revealing the sharp live water as the orb */}
      <div className="veil co-veil" />
      <div className="orb" aria-hidden="true"><span className="spec" /></div>
      <div className="sb"><span>9:43</span><span className="i">&#8734;</span></div>
      <button className="back" onClick={onBack}>&lsaquo; the legacy</button>
      <div className="body">
        <div className="h">The colour of us</div>
        <p className="sub">Every voice has added to the same legacy. This is the colour your family makes together.</p>
        <div className="spacer" />
        <div className="orbcap">{TOTAL_DROPS} lives, one colour &mdash; the family legacy itself</div>
        <div className="bar">
          {CONTRIBUTIONS.map((c) => (
            <span
              key={c.author}
              style={{ background: DYES[c.dye].hex, width: `${(c.count / TOTAL_DROPS) * 100}%` }}
            />
          ))}
        </div>
        <div className="leg">
          {CONTRIBUTIONS.map((c) => (
            <div className="lrow" key={c.author}>
              <i style={{ background: DYES[c.dye].hex }} />
              <span className="nm">{c.author} <em>{DYES[c.dye].label}</em></span>
              <span className="ct">{c.count} memories</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
