import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ open, x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = () => onClose();
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 40 - 20);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          className="fixed glass-strong rounded-xl overflow-hidden py-1"
          style={{
            left: adjustedX,
            top: adjustedY,
            zIndex: 300,
            minWidth: 180,
            boxShadow: "0 10px 40px oklch(0.05 0.01 270 / 0.8), 0 0 0 1px oklch(0.25 0.05 290 / 0.4)",
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={e => e.stopPropagation()}
        >
          {items.map((item, i) => (
            item.separator ? (
              <div key={i} className="my-1 mx-2" style={{ height: 1, background: "oklch(0.20 0.04 270)" }} />
            ) : (
              <motion.button
                key={i}
                onClick={() => { if (!item.disabled) { item.onClick(); onClose(); } }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors"
                style={{
                  color: item.danger ? "oklch(0.65 0.22 25)" : item.disabled ? "oklch(0.40 0.02 270)" : "oklch(0.85 0.01 270)",
                  cursor: item.disabled ? "not-allowed" : "pointer",
                }}
                whileHover={!item.disabled ? { backgroundColor: "oklch(0.20 0.04 270 / 0.8)" } : {}}
              >
                {item.icon && <span style={{ opacity: item.disabled ? 0.5 : 1 }}>{item.icon}</span>}
                <span>{item.label}</span>
              </motion.button>
            )
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
