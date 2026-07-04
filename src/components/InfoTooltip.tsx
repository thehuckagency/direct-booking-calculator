import { useId, useRef, useState } from "react";

/**
 * A "?" affordance that reveals a benchmark citation. Works on hover, focus and
 * tap; the panel uses position:fixed so it is never clipped by the card. Fully
 * keyboard-operable and announced via aria-describedby.
 */
export function InfoTooltip({ label, source }: { label: string; source: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  const place = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ x: r.left + r.width / 2, y: r.bottom + 8 });
  };

  const show = () => {
    place();
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={`Where this figure comes from: ${label}`}
        aria-describedby={open ? id : undefined}
        className="focus-ring inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-sage bg-surface text-[11px] font-semibold leading-none text-muted transition hover:border-muted hover:text-ink"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          e.preventDefault();
          open ? hide() : show();
        }}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          style={{
            position: "fixed",
            left: coords.x,
            top: coords.y,
            transform: "translateX(-50%)",
          }}
          className="pointer-events-none z-tooltip w-64 max-w-[80vw] rounded-xl border border-sage/80 bg-ink px-3.5 py-2.5 text-[12.5px] font-normal leading-snug text-paper shadow-lift"
        >
          {source}
        </span>
      )}
    </>
  );
}
