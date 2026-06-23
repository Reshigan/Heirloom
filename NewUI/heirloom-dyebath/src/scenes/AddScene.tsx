import { DYES } from '../data/family'

export default function AddScene({ onBack }: { onBack: () => void }) {
  return (
    <section className="scene ad">
      <div className="veil" />
      <div className="sb"><span>9:44</span><span className="i">&#8734;</span></div>
      <button className="back" onClick={onBack}>&lsaquo; the legacy</button>
      <div className="body">
        <div className="h">Leave an heirloom</div>
        <div className="hand">
          <i style={{ background: `radial-gradient(circle at 36% 30%, #f5d278, ${DYES.weld.hex})` }} />
          your colour &middot; {DYES.weld.label}
        </div>
        <div className="glass">
          <div className="ti">Name this memory&hellip;</div>
          <div className="bd">
            Maya climbed the orchard tree today, the same one in the photograph. She did not know. I did.
          </div>
        </div>
        <p className="hintline">It joins the legacy today &mdash; and settles into the colour as the years pass.</p>
        <div className="actions">
          <button className="place">Add it to the legacy</button>
          <button className="seal">Seal it until&hellip;</button>
        </div>
      </div>
    </section>
  )
}
