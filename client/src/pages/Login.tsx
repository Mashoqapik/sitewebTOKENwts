import { useVaultAuth } from "@/contexts/VaultAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Unlock, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const { authenticate } = useVaultAuth();
  const { theme, toggleTheme } = useTheme();
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

  const isDark = theme === "dark";

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden transition-colors duration-300"
      style={{
        background: isDark ? "#000000" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      }}
    >
      {/* Grid subtle */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          zIndex: 0,
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
              style={{
                background: isDark
                  ? "radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, rgba(0,0,0) 70%)"
                  : "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(255,255,255) 70%)",
              }}
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
                className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: isDark ? "#ffffff" : "#000000",
                  color: isDark ? "#000000" : "#ffffff",
                }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <Unlock className="w-12 h-12" />
              </motion.div>
              <motion.p
                className="text-2xl font-semibold"
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
        {/* Theme toggle button */}
        <motion.button
          onClick={toggleTheme}
          className="absolute -top-16 right-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
          style={{
            background: isDark ? "#1a1a1a" : "#f5f5f5",
            border: `1px solid ${isDark ? "#2a2a2a" : "#e5e5e5"}`,
            color: isDark ? "#ffffff" : "#000000",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </motion.button>

        {/* Logo / Icon */}
        <motion.div
          className="flex flex-col items-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div
            className="relative w-20 h-20 mb-5 rounded-2xl flex items-center justify-center"
            style={{
              background: isDark ? "#1a1a1a" : "#f5f5f5",
              border: `2px solid ${isDark ? "#2a2a2a" : "#e5e5e5"}`,
            }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Lock className="w-10 h-10" style={{ color: isDark ? "#ffffff" : "#000000" }} />
          </motion.div>

          <motion.h1
            className="text-4xl font-bold tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            VAULT
          </motion.h1>
          <motion.p
            className="text-sm mt-2 font-mono"
            style={{ color: isDark ? "#999999" : "#666666" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            TokenWTS Secure Storage
          </motion.p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="rounded-lg p-8 border"
          style={{
            background: isDark ? "#0a0a0a" : "#ffffff",
            border: `1px solid ${isDark ? "#2a2a2a" : "#e5e5e5"}`,
            boxShadow: isDark
              ? "0 10px 30px rgba(0,0,0,0.5)"
              : "0 10px 30px rgba(0,0,0,0.1)",
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: isDark ? "#1a1a1a" : "#f5f5f5" }}
            >
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Authentification requise</p>
              <p className="text-xs" style={{ color: isDark ? "#999999" : "#666666" }}>
                Entrez le code d'accès
              </p>
            </div>
          </div>

          {/* Code input */}
          <motion.div
            className="relative mb-6"
            animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <div
              className="relative rounded-lg overflow-hidden cursor-text px-4 py-4 flex items-center gap-2"
              style={{
                background: isDark ? "#1a1a1a" : "#f5f5f5",
                border: `1px solid ${
                  error
                    ? "#dc2626"
                    : success
                    ? "#16a34a"
                    : isDark
                    ? "#2a2a2a"
                    : "#e5e5e5"
                }`,
                boxShadow: error
                  ? `0 0 10px rgba(220,38,38,0.3)`
                  : success
                  ? `0 0 10px rgba(22,163,74,0.3)`
                  : "none",
                transition: "all 0.3s ease",
              }}
              onClick={() => inputRef.current?.focus()}
            >
              <span className="text-sm font-mono" style={{ color: isDark ? "#666666" : "#999999" }}>›</span>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="password"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent outline-none font-mono text-base tracking-widest"
                  style={{ color: isDark ? "#ffffff" : "#000000", caretColor: "transparent" }}
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
                      background: isDark ? "#ffffff" : "#000000",
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
                    style={{ background: error ? "#dc2626" : isDark ? "#ffffff" : "#000000" }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  />
                ))}
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  className="absolute -bottom-6 left-0 text-xs font-mono"
                  style={{ color: "#dc2626" }}
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
            className="relative w-full py-3 rounded-lg font-semibold text-sm tracking-wide overflow-hidden transition-colors"
            style={{
              background: isDark ? "#ffffff" : "#000000",
              color: isDark ? "#000000" : "#ffffff",
              border: `1px solid ${isDark ? "#ffffff" : "#000000"}`,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={success}
          >
            <span className="relative z-10">DÉVERROUILLER</span>
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-center text-xs mt-6 font-mono"
          style={{ color: isDark ? "#666666" : "#999999" }}
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
