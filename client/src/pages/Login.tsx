import { useVaultAuth } from "@/contexts/VaultAuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Shield, Unlock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import ParticleBackground from "@/components/ParticleBackground";

export default function Login() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const { authenticate } = useVaultAuth();
  const [, navigate] = useLocation();

  // Blink cursor
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    const ok = authenticate(code);
    if (ok) {
      setSuccess(true);
      setTimeout(() => navigate("/vault"), 1800);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => { setShake(false); setError(false); setCode(""); }, 1200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <ParticleBackground />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(oklch(0.30 0.06 290 / 0.05) 1px, transparent 1px), linear-gradient(90deg, oklch(0.30 0.06 290 / 0.05) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          zIndex: 1,
        }}
      />

      {/* Radial glow center */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.65 0.22 290 / 0.08) 0%, transparent 70%)",
          zIndex: 1,
        }}
      />

      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 100 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: "radial-gradient(ellipse at center, oklch(0.65 0.22 290 / 0.3) 0%, oklch(0.08 0.02 270) 70%)" }}
              initial={{ scale: 0 }}
              animate={{ scale: 3 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <motion.div
              className="relative text-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <motion.div
                className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center glow-primary"
                style={{ background: "oklch(0.65 0.22 290)" }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <Unlock className="w-12 h-12 text-white" />
              </motion.div>
              <motion.p
                className="text-2xl font-orbitron font-bold gradient-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                ACCÈS AUTORISÉ
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main card */}
      <motion.div
        className="relative z-10 w-full max-w-md px-6"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo / Icon */}
        <motion.div
          className="flex flex-col items-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div
            className="relative w-20 h-20 mb-5"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 rounded-2xl animate-pulse-glow" style={{ background: "oklch(0.65 0.22 290 / 0.2)" }} />
            <div className="relative w-full h-full rounded-2xl glass-strong flex items-center justify-center glow-primary">
              <Shield className="w-10 h-10" style={{ color: "oklch(0.75 0.20 290)" }} />
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl font-orbitron font-bold gradient-text text-glow tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            VAULT
          </motion.h1>
          <motion.p
            className="text-sm font-mono-custom mt-2"
            style={{ color: "oklch(0.60 0.02 270)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            TokenWTS Secure Storage
          </motion.p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="glass-strong rounded-2xl p-8"
          style={{ boxShadow: "0 25px 60px oklch(0.08 0.02 270 / 0.8), 0 0 0 1px oklch(0.30 0.06 290 / 0.3)" }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.65 0.22 290 / 0.2)" }}>
              <Lock className="w-4 h-4" style={{ color: "oklch(0.75 0.20 290)" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "oklch(0.85 0.01 270)" }}>Authentification requise</p>
              <p className="text-xs font-mono-custom" style={{ color: "oklch(0.50 0.02 270)" }}>Entrez le code d'accès</p>
            </div>
          </div>

          {/* Code input */}
          <motion.div
            className="relative mb-6"
            animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <div
              className="relative rounded-xl overflow-hidden cursor-text"
              style={{
                background: "oklch(0.08 0.02 270)",
                border: `1px solid ${error ? "oklch(0.60 0.22 25)" : success ? "oklch(0.65 0.22 150)" : "oklch(0.25 0.05 290)"}`,
                boxShadow: error
                  ? "0 0 20px oklch(0.60 0.22 25 / 0.3)"
                  : success
                  ? "0 0 20px oklch(0.65 0.22 150 / 0.3)"
                  : "0 0 20px oklch(0.65 0.22 290 / 0.1)",
                transition: "all 0.3s ease",
              }}
              onClick={() => inputRef.current?.focus()}
            >
              <div className="px-4 py-4 flex items-center gap-2">
                <span className="font-mono-custom text-sm" style={{ color: "oklch(0.50 0.02 270)" }}>›</span>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="password"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent outline-none font-mono-custom text-base tracking-widest"
                    style={{ color: "oklch(0.90 0.01 270)", caretColor: "transparent" }}
                    placeholder=""
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {/* Custom cursor */}
                  {code.length === 0 && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                      style={{
                        background: "oklch(0.65 0.22 290)",
                        opacity: showCursor ? 1 : 0,
                        transition: "opacity 0.1s",
                      }}
                    />
                  )}
                </div>
                {/* Dots indicator */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(code.length, 16) }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: error ? "oklch(0.60 0.22 25)" : "oklch(0.65 0.22 290)" }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  className="absolute -bottom-6 left-0 text-xs font-mono-custom"
                  style={{ color: "oklch(0.60 0.22 25)" }}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  ✗ Code incorrect. Accès refusé.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit button */}
          <motion.button
            onClick={handleSubmit}
            className="relative w-full py-3.5 rounded-xl font-orbitron font-semibold text-sm tracking-widest overflow-hidden"
            style={{
              background: "linear-gradient(135deg, oklch(0.55 0.22 290), oklch(0.50 0.25 260))",
              color: "oklch(0.98 0.005 270)",
              boxShadow: "0 4px 20px oklch(0.65 0.22 290 / 0.4)",
            }}
            whileHover={{ scale: 1.02, boxShadow: "0 6px 30px oklch(0.65 0.22 290 / 0.6)" }}
            whileTap={{ scale: 0.98 }}
            disabled={success}
          >
            <span className="relative z-10">DÉVERROUILLER</span>
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0"
              style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.1), transparent)" }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-center text-xs font-mono-custom mt-6"
          style={{ color: "oklch(0.35 0.02 270)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          TOKENWTS VAULT v1.0 · ACCÈS RESTREINT
        </motion.p>
      </motion.div>
    </div>
  );
}
