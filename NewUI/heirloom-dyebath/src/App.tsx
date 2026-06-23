import { useState } from 'react'
import WaterCanvas from './water/WaterCanvas'
import SceneNav from './components/SceneNav'
import WaterScene from './scenes/WaterScene'
import ReadScene from './scenes/ReadScene'
import ColourScene from './scenes/ColourScene'
import AddScene from './scenes/AddScene'
import SealedScene from './scenes/SealedScene'
import VolumeScene from './scenes/VolumeScene'
import { ENTRIES, type Entry } from './data/family'
import type { SceneId } from './types'

export default function App() {
  const [scene, setScene] = useState<SceneId>('water')
  const [entry, setEntry] = useState<Entry>(ENTRIES[1]) // Eleanor, 2003

  const go = (id: SceneId) => setScene(id)
  const back = () => setScene('water')

  return (
    <div id="app">
      <WaterCanvas />
      <div className="stage">
        {scene === 'water' && (
          <WaterScene
            onOpenEntry={(e) => { setEntry(e); setScene('read') }}
            onAdd={() => setScene('add')}
            onSealed={() => setScene('sealed')}
          />
        )}
        {scene === 'read' && <ReadScene entry={entry} onBack={back} />}
        {scene === 'colour' && <ColourScene onBack={back} />}
        {scene === 'add' && <AddScene onBack={back} />}
        {scene === 'sealed' && <SealedScene onBack={back} />}
        {scene === 'volume' && <VolumeScene onBack={back} />}
      </div>
      <SceneNav active={scene} onNavigate={go} />
    </div>
  )
}
