import { useEffect, useRef } from 'react'
import { FAMILY_NAME } from '../data/family'
import { captureWater } from '../water/capture'

export default function VolumeScene({ onBack }: { onBack: () => void }) {
  const cover = useRef<HTMLDivElement | null>(null)

  // Snapshot the living water the moment the volume opens — every printed
  // copy wears the colour the family was on its print day.
  useEffect(() => {
    const data = captureWater()
    if (data && cover.current) cover.current.style.backgroundImage = `url(${data})`
  }, [])

  return (
    <section className="scene dc">
      <div className="veil" />
      <div className="sb"><span>9:46</span><span className="i">&#8734;</span></div>
      <button className="back" onClick={onBack}>&lsaquo; the legacy</button>
      <div className="body">
        <div className="kick">for the ones who come after</div>
        <div className="book">
          <div className="cover" ref={cover} />
          <div className="spine" />
          <div className="frame" />
          <div className="plate">
            <div className="mk">&#8734;</div>
            <div className="t">The {FAMILY_NAME} Legacy</div>
            <div className="v">Volume One &middot; 1901&ndash;2024</div>
          </div>
        </div>
        <p className="blurb">
          Bound into a book &mdash; its cover the colour your family was the day it was printed.
          One copy for every name in it.
        </p>
        <button className="bind"><span className="i">&#8734;</span> Bind the legacy</button>
      </div>
    </section>
  )
}
