import { SEALED } from '../data/family'
import WaxSeal from '../components/WaxSeal'

export default function SealedScene({ onBack }: { onBack: () => void }) {
  return (
    <section className="scene sl">
      <div className="veil" />
      <div className="sb"><span>9:45</span><span className="i">&#8734;</span></div>
      <button className="back" onClick={onBack}>&lsaquo; the legacy</button>
      <div className="card">
        <span className="hint h1c" />
        <span className="hint h2c" />
        <span className="frost" />
        <span className="wax"><WaxSeal size={66} /></span>
      </div>
      <div className="cap">
        <div className="l1">{SEALED.forWhom}</div>
        <div className="l2">&#8734; a sealed heirloom &middot; opens {SEALED.opens}</div>
        <div className="l3">until that day, the writing stays under the wax.</div>
      </div>
    </section>
  )
}
