import type { SceneId } from '../types'

const ITEMS: { id: SceneId; label: string }[] = [
  { id: 'water', label: 'The legacy' },
  { id: 'read', label: 'A memory' },
  { id: 'colour', label: 'The colour of us' },
  { id: 'add', label: 'Leave an heirloom' },
  { id: 'sealed', label: 'Sealed' },
  { id: 'volume', label: 'The volume' },
]

export default function SceneNav({
  active,
  onNavigate,
}: {
  active: SceneId
  onNavigate: (id: SceneId) => void
}) {
  return (
    <nav className="rail" aria-label="Sections">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          className={it.id === active ? 'active' : ''}
          aria-current={it.id === active ? 'page' : undefined}
          onClick={() => onNavigate(it.id)}
        >
          {it.label}
        </button>
      ))}
    </nav>
  )
}
