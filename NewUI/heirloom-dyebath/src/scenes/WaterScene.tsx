import { ENTRIES, FAMILY_NAME, SEALED, type Entry } from '../data/family'
import WaxSeal from '../components/WaxSeal'

// Horizontal placement per entry index, alternating sides over the water.
const LEFTS = ['11%', '56%', '10%', '52%', '12%', '50%']

export default function WaterScene({
  onOpenEntry,
  onAdd,
  onSealed,
}: {
  onOpenEntry: (e: Entry) => void
  onAdd: () => void
  onSealed: () => void
}) {
  return (
    <section className="scene wt">
      <div className="scrim-t" />
      <div className="scrim-b" />
      <div className="sb"><span>9:41</span><span className="i">&#8734;</span></div>

      <div className="mast">
        <h2>The {FAMILY_NAME} legacy</h2>
        <p>four generations, one inheritance</p>
      </div>
      <button className="surfbtn" onClick={onAdd}>
        today &middot; add to the legacy
      </button>

      {ENTRIES.map((e, i) => (
        <button
          key={e.id}
          className="chip"
          style={{ top: `${18 + e.depth * 66}%`, left: LEFTS[i] }}
          onClick={() => onOpenEntry(e)}
        >
          <span className="yr">{e.year}</span> &middot; <b>{e.author}</b>
        </button>
      ))}

      <button className="bead" style={{ top: '47%', left: '45%' }} onClick={onSealed} aria-label="Sealed heirloom, opens 2034">
        <span className="ring" />
        <span className="core" />
        <span className="bead-lab">sealed &middot; {SEALED.opens.slice(-4)}</span>
      </button>

      <div className="axis">older lives lie deeper &middot; tap to open an heirloom</div>
    </section>
  )
}
