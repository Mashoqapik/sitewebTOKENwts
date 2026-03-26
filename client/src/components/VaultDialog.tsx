import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface VaultDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function VaultDialog({ open, onClose, title, children, maxWidth = "max-w-md" }: VaultDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 200, background: "oklch(0.05 0.01 270 / 0.8)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => { if (e.target === overlayRef.current) onClose(); }}
        >
          <motion.div
            className={`glass-strong rounded-2xl w-full ${maxWidth} overflow-hidden`}
            style={{ boxShadow: "0 25px 60px oklch(0.05 0.01 270 / 0.8), 0 0 0 1px oklch(0.30 0.06 290 / 0.3)" }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid oklch(0.20 0.04 270)" }}>
              <h3 className="font-semibold text-sm" style={{ color: "oklch(0.90 0.01 270)" }}>{title}</h3>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              >
                <X size={14} style={{ color: "oklch(0.60 0.02 270)" }} />
              </button>
            </div>
            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
