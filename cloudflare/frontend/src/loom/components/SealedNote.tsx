/**
 * SealedNote — typographic time-locked entry stamp.
 *
 * Used in the Composer's right rail and as the centrepiece of every
 * "tied off" card. The single ∞ glyph is the only icon the product
 * uses; everything else is type.
 */
export function SealedNote({
  date,
  recipient,
  sublabel,
  italic = true,
}: {
  date: string;
  recipient: string;
  sublabel?: string;
  italic?: boolean;
}) {
  return (
    <div className="loom-sealed">
      <span className="infmark">∞</span>
      <div className="meta">{date}</div>
      <div className="for">{italic ? <em>{recipient}</em> : recipient}</div>
      {sublabel ? (
        <div
          className="meta loom-dim"
          style={{ marginTop: 6, fontSize: 10 }}
        >
          {sublabel}
        </div>
      ) : null}
    </div>
  );
}
