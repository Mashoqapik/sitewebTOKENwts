import ContextMenu, { ContextMenuItem } from "@/components/ContextMenu";
import FileIcon, { formatFileSize } from "@/components/FileIcon";
import VaultDialog from "@/components/VaultDialog";
import { useVaultAuth } from "@/contexts/VaultAuthContext";
import { trpc } from "@/lib/trpc";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Clock,
  Download,
  Edit3,
  Eye,
  Files,
  FolderPlus,
  Grid3X3,
  Home,
  Info,
  List,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

type VaultItem = {
  id: number;
  name: string;
  type: "file" | "folder";
  parentId: number | null;
  s3Key: string | null;
  s3Url: string | null;
  mimeType: string | null;
  fileSize: number | null;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type ViewMode = "grid" | "list";
type SidebarTab = "recent" | "all";

export default function Vault() {
  const { logout } = useVaultAuth();
  const [, navigate] = useLocation();

  // Navigation
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null; name: string }[]>([{ id: null, name: "Vault" }]);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("recent");
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [infoItem, setInfoItem] = useState<VaultItem | null>(null);
  const [previewItem, setPreviewItem] = useState<VaultItem | null>(null);

  // Dialogs
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showRename, setShowRename] = useState<VaultItem | null>(null);
  const [showDelete, setShowDelete] = useState<VaultItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Forms
  const [newFolderName, setNewFolderName] = useState("");
  const [renameName, setRenameName] = useState("");

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; item: VaultItem } | null>(null);

  // Upload
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // tRPC queries
  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.vault.list.useQuery({ parentId: currentFolderId });
  const { data: recentItems = [] } = trpc.vault.recent.useQuery({ limit: 15 });
  const { data: allItems = [] } = trpc.vault.all.useQuery();

  // Mutations
  const createFolder = trpc.vault.createFolder.useMutation({
    onSuccess: () => { utils.vault.list.invalidate(); utils.vault.all.invalidate(); setShowNewFolder(false); setNewFolderName(""); },
  });
  const rename = trpc.vault.rename.useMutation({
    onSuccess: () => { utils.vault.list.invalidate(); utils.vault.all.invalidate(); utils.vault.recent.invalidate(); setShowRename(null); },
  });
  const deleteItem = trpc.vault.delete.useMutation({
    onSuccess: () => { utils.vault.list.invalidate(); utils.vault.all.invalidate(); utils.vault.recent.invalidate(); setShowDelete(null); },
  });
  const upload = trpc.vault.upload.useMutation({
    onSuccess: () => { utils.vault.list.invalidate(); utils.vault.all.invalidate(); utils.vault.recent.invalidate(); },
  });

  // Navigate into folder
  const openFolder = (item: VaultItem) => {
    setCurrentFolderId(item.id);
    setBreadcrumbs(prev => [...prev, { id: item.id, name: item.name }]);
    setSelectedItem(null);
  };

  const navigateTo = (crumb: { id: number | null; name: string }, index: number) => {
    setCurrentFolderId(crumb.id);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setSelectedItem(null);
  };

  // File upload handler
  const handleFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        try {
          await upload.mutateAsync({
            name: file.name,
            parentId: currentFolderId,
            mimeType: file.type || "application/octet-stream",
            fileSize: file.size,
            base64,
          });
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          setTimeout(() => setUploadProgress(prev => { const n = { ...prev }; delete n[file.name]; return n; }), 1500);
        } catch (err) {
          console.error("Upload failed:", err);
        }
      };
      reader.readAsDataURL(file);
    }
    setShowUpload(false);
    setUploadFiles([]);
  }, [currentFolderId, upload]);

  // Drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length) handleFiles(files);
    };
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleFiles]);

  const handleContextMenu = (e: React.MouseEvent, item: VaultItem) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, item });
  };

  const ctxItems: ContextMenuItem[] = ctxMenu ? [
    ...(ctxMenu.item.type === "file" && ctxMenu.item.s3Url ? [{
      label: "Aperçu",
      icon: <Eye size={14} />,
      onClick: () => setPreviewItem(ctxMenu.item),
    }] : []),
    ...(ctxMenu.item.type === "file" && ctxMenu.item.s3Url ? [{
      label: "Télécharger",
      icon: <Download size={14} />,
      onClick: () => { const a = document.createElement("a"); a.href = ctxMenu.item.s3Url!; a.download = ctxMenu.item.name; a.click(); },
    }] : []),
    {
      label: "Informations",
      icon: <Info size={14} />,
      onClick: () => { setInfoItem(ctxMenu.item); setShowInfo(true); },
    },
    { separator: true, label: "", onClick: () => {} },
    {
      label: "Renommer",
      icon: <Edit3 size={14} />,
      onClick: () => { setShowRename(ctxMenu.item); setRenameName(ctxMenu.item.name); },
    },
    {
      label: "Supprimer",
      icon: <Trash2 size={14} />,
      onClick: () => setShowDelete(ctxMenu.item),
      danger: true,
    },
  ] : [];

  const formatDate = (d: Date) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen flex" style={{ background: "oklch(0.08 0.02 270)" }}>
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 500, background: "oklch(0.65 0.22 290 / 0.1)", border: "2px dashed oklch(0.65 0.22 290 / 0.6)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <Upload size={48} style={{ color: "oklch(0.75 0.20 290)", margin: "0 auto 12px" }} />
              <p className="font-orbitron text-xl gradient-text">Déposer les fichiers ici</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Sidebar ─────────────────────────────────────────────────────────── */}
      <motion.aside
        className="w-64 flex-shrink-0 flex flex-col glass-strong"
        style={{ borderRight: "1px solid oklch(0.18 0.035 270)", minHeight: "100vh" }}
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid oklch(0.18 0.035 270)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center glow-primary" style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 290), oklch(0.50 0.25 260))" }}>
              <Files size={16} className="text-white" />
            </div>
            <div>
              <p className="font-orbitron font-bold text-sm gradient-text">VAULT</p>
              <p className="text-xs font-mono-custom" style={{ color: "oklch(0.45 0.02 270)" }}>TokenWTS</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-3 py-3 flex gap-2" style={{ borderBottom: "1px solid oklch(0.18 0.035 270)" }}>
          <motion.button
            onClick={() => setShowUpload(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 290), oklch(0.50 0.25 260))", color: "white" }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={14} />
            Déposer
          </motion.button>
          <motion.button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "oklch(0.15 0.03 270)", color: "oklch(0.75 0.20 290)", border: "1px solid oklch(0.25 0.05 290 / 0.4)" }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FolderPlus size={14} />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="px-3 pt-3">
          <div className="flex rounded-lg overflow-hidden" style={{ background: "oklch(0.12 0.025 270)" }}>
            {(["recent", "all"] as SidebarTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className="flex-1 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: sidebarTab === tab ? "oklch(0.65 0.22 290)" : "transparent",
                  color: sidebarTab === tab ? "white" : "oklch(0.55 0.02 270)",
                  borderRadius: "0.5rem",
                }}
              >
                {tab === "recent" ? "Récents" : "Tous"}
              </button>
            ))}
          </div>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {sidebarTab === "recent" ? (
            recentItems.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={24} style={{ color: "oklch(0.35 0.02 270)", margin: "0 auto 8px" }} />
                <p className="text-xs" style={{ color: "oklch(0.40 0.02 270)" }}>Aucun fichier récent</p>
              </div>
            ) : (
              recentItems.map((item: VaultItem) => (
                <motion.button
                  key={item.id}
                  onClick={() => { if (item.type === "folder") openFolder(item); else { setInfoItem(item); setShowInfo(true); } }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors group"
                  style={{ color: "oklch(0.80 0.01 270)" }}
                  whileHover={{ backgroundColor: "oklch(0.15 0.03 270 / 0.8)" }}
                >
                  <FileIcon type={item.type} mimeType={item.mimeType} name={item.name} size={14} />
                  <span className="text-xs truncate flex-1">{item.name}</span>
                </motion.button>
              ))
            )
          ) : (
            allItems.length === 0 ? (
              <div className="text-center py-8">
                <Files size={24} style={{ color: "oklch(0.35 0.02 270)", margin: "0 auto 8px" }} />
                <p className="text-xs" style={{ color: "oklch(0.40 0.02 270)" }}>Vault vide</p>
              </div>
            ) : (
              allItems.map((item: VaultItem) => (
                <motion.button
                  key={item.id}
                  onClick={() => { if (item.type === "folder") { setCurrentFolderId(item.id); setBreadcrumbs([{ id: null, name: "Vault" }, { id: item.id, name: item.name }]); } else { setInfoItem(item); setShowInfo(true); } }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left"
                  style={{ color: "oklch(0.80 0.01 270)" }}
                  whileHover={{ backgroundColor: "oklch(0.15 0.03 270 / 0.8)" }}
                >
                  <FileIcon type={item.type} mimeType={item.mimeType} name={item.name} size={14} />
                  <span className="text-xs truncate flex-1">{item.name}</span>
                  <span className="text-xs shrink-0" style={{ color: "oklch(0.40 0.02 270)" }}>
                    {item.type === "file" ? formatFileSize(item.fileSize) : ""}
                  </span>
                </motion.button>
              ))
            )
          )}
        </div>

        {/* Logout */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid oklch(0.18 0.035 270)" }}>
          <motion.button
            onClick={() => { logout(); navigate("/"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ color: "oklch(0.55 0.02 270)" }}
            whileHover={{ backgroundColor: "oklch(0.60 0.22 25 / 0.1)", color: "oklch(0.65 0.22 25)" }}
          >
            <LogOut size={14} />
            Déconnexion
          </motion.button>
        </div>
      </motion.aside>

      {/* ─── Main Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <motion.header
          className="flex items-center gap-4 px-6 py-4 glass-strong"
          style={{ borderBottom: "1px solid oklch(0.18 0.035 270)" }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {breadcrumbs.map((crumb, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={14} style={{ color: "oklch(0.40 0.02 270)" }} />}
                <motion.button
                  onClick={() => navigateTo(crumb, i)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors"
                  style={{
                    color: i === breadcrumbs.length - 1 ? "oklch(0.90 0.01 270)" : "oklch(0.55 0.02 270)",
                    fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                  }}
                  whileHover={{ backgroundColor: "oklch(0.15 0.03 270 / 0.8)" }}
                >
                  {i === 0 && <Home size={13} />}
                  {crumb.name}
                </motion.button>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => { utils.vault.list.invalidate(); utils.vault.recent.invalidate(); utils.vault.all.invalidate(); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ color: "oklch(0.55 0.02 270)" }}
              whileHover={{ backgroundColor: "oklch(0.15 0.03 270)", color: "oklch(0.80 0.01 270)" }}
              whileTap={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <RefreshCw size={14} />
            </motion.button>
            <div className="flex rounded-lg overflow-hidden" style={{ background: "oklch(0.12 0.025 270)" }}>
              {(["grid", "list"] as ViewMode[]).map(mode => (
                <motion.button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="p-2 transition-colors"
                  style={{
                    background: viewMode === mode ? "oklch(0.65 0.22 290)" : "transparent",
                    color: viewMode === mode ? "white" : "oklch(0.55 0.02 270)",
                    borderRadius: "0.5rem",
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  {mode === "grid" ? <Grid3X3 size={14} /> : <List size={14} />}
                </motion.button>
              ))}
            </div>
            <motion.button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 290), oklch(0.50 0.25 260))", color: "white" }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus size={14} />
              Déposer
            </motion.button>
          </div>
        </motion.header>

        {/* Upload progress */}
        <AnimatePresence>
          {Object.keys(uploadProgress).length > 0 && (
            <motion.div
              className="px-6 py-2"
              style={{ background: "oklch(0.10 0.025 270)", borderBottom: "1px solid oklch(0.18 0.035 270)" }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {Object.entries(uploadProgress).map(([name, progress]) => (
                <div key={name} className="flex items-center gap-3 py-1">
                  <span className="text-xs truncate flex-1" style={{ color: "oklch(0.70 0.01 270)" }}>{name}</span>
                  <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.20 0.04 270)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, oklch(0.65 0.22 290), oklch(0.55 0.25 260))" }}
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono-custom" style={{ color: "oklch(0.55 0.02 270)" }}>{progress}%</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* File explorer */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <motion.div
                className="w-8 h-8 rounded-full border-2"
                style={{ borderColor: "oklch(0.65 0.22 290)", borderTopColor: "transparent" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : items.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center h-64 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Files size={48} style={{ color: "oklch(0.30 0.04 270)", margin: "0 auto 16px" }} />
              </motion.div>
              <p className="font-semibold mb-2" style={{ color: "oklch(0.55 0.02 270)" }}>Ce dossier est vide</p>
              <p className="text-sm" style={{ color: "oklch(0.40 0.02 270)" }}>Glissez des fichiers ici ou cliquez sur "Déposer"</p>
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {items.map((item: VaultItem, i: number) => (
                <motion.div
                  key={item.id}
                  className="relative group rounded-xl p-3 cursor-pointer select-none"
                  style={{
                    background: selectedItem?.id === item.id ? "oklch(0.65 0.22 290 / 0.15)" : "oklch(0.11 0.025 270)",
                    border: `1px solid ${selectedItem?.id === item.id ? "oklch(0.65 0.22 290 / 0.5)" : "oklch(0.18 0.035 270)"}`,
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.03, borderColor: "oklch(0.40 0.10 290 / 0.6)", background: "oklch(0.13 0.03 270)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedItem(item)}
                  onDoubleClick={() => { if (item.type === "folder") openFolder(item); else { setInfoItem(item); setShowInfo(true); } }}
                  onContextMenu={e => handleContextMenu(e, item)}
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileIcon type={item.type} mimeType={item.mimeType} name={item.name} size={36} />
                    <span className="text-xs text-center leading-tight w-full truncate" style={{ color: "oklch(0.80 0.01 270)" }}>
                      {item.name}
                    </span>
                    {item.type === "file" && (
                      <span className="text-xs font-mono-custom" style={{ color: "oklch(0.45 0.02 270)" }}>
                        {formatFileSize(item.fileSize)}
                      </span>
                    )}
                  </div>
                  {/* Hover actions */}
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <motion.button
                      onClick={e => { e.stopPropagation(); setInfoItem(item); setShowInfo(true); }}
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ background: "oklch(0.20 0.04 270)" }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <Info size={10} style={{ color: "oklch(0.65 0.22 290)" }} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div className="flex flex-col gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold" style={{ color: "oklch(0.45 0.02 270)" }}>
                <div className="col-span-5">Nom</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Taille</div>
                <div className="col-span-3">Modifié</div>
              </div>
              {items.map((item: VaultItem, i: number) => (
                <motion.div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 px-3 py-2.5 rounded-lg cursor-pointer group"
                  style={{
                    background: selectedItem?.id === item.id ? "oklch(0.65 0.22 290 / 0.12)" : "transparent",
                    border: `1px solid ${selectedItem?.id === item.id ? "oklch(0.65 0.22 290 / 0.3)" : "transparent"}`,
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  whileHover={{ backgroundColor: "oklch(0.13 0.025 270 / 0.8)" }}
                  onClick={() => setSelectedItem(item)}
                  onDoubleClick={() => { if (item.type === "folder") openFolder(item); else { setInfoItem(item); setShowInfo(true); } }}
                  onContextMenu={e => handleContextMenu(e, item)}
                >
                  <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                    <FileIcon type={item.type} mimeType={item.mimeType} name={item.name} size={16} />
                    <span className="text-sm truncate" style={{ color: "oklch(0.85 0.01 270)" }}>{item.name}</span>
                  </div>
                  <div className="col-span-2 flex items-center text-xs" style={{ color: "oklch(0.50 0.02 270)" }}>
                    {item.type === "folder" ? "Dossier" : item.mimeType?.split("/")[1]?.toUpperCase() ?? "Fichier"}
                  </div>
                  <div className="col-span-2 flex items-center text-xs font-mono-custom" style={{ color: "oklch(0.50 0.02 270)" }}>
                    {item.type === "file" ? formatFileSize(item.fileSize) : "—"}
                  </div>
                  <div className="col-span-3 flex items-center justify-between">
                    <span className="text-xs" style={{ color: "oklch(0.50 0.02 270)" }}>
                      {new Date(item.updatedAt).toLocaleDateString("fr-FR")}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <motion.button onClick={e => { e.stopPropagation(); setInfoItem(item); setShowInfo(true); }} whileHover={{ scale: 1.1 }}>
                        <Info size={13} style={{ color: "oklch(0.55 0.02 270)" }} />
                      </motion.button>
                      <motion.button onClick={e => { e.stopPropagation(); setShowRename(item); setRenameName(item.name); }} whileHover={{ scale: 1.1 }}>
                        <Edit3 size={13} style={{ color: "oklch(0.55 0.02 270)" }} />
                      </motion.button>
                      <motion.button onClick={e => { e.stopPropagation(); setShowDelete(item); }} whileHover={{ scale: 1.1 }}>
                        <Trash2 size={13} style={{ color: "oklch(0.60 0.22 25)" }} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── Context Menu ─────────────────────────────────────────────────────── */}
      <ContextMenu
        open={!!ctxMenu}
        x={ctxMenu?.x ?? 0}
        y={ctxMenu?.y ?? 0}
        items={ctxItems}
        onClose={() => setCtxMenu(null)}
      />

      {/* ─── Dialog: Nouveau dossier ──────────────────────────────────────────── */}
      <VaultDialog open={showNewFolder} onClose={() => setShowNewFolder(false)} title="Nouveau dossier">
        <div className="flex flex-col gap-4">
          <input
            autoFocus
            type="text"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && newFolderName.trim()) createFolder.mutate({ name: newFolderName.trim(), parentId: currentFolderId }); }}
            placeholder="Nom du dossier"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "oklch(0.10 0.025 270)", border: "1px solid oklch(0.25 0.05 290 / 0.4)", color: "oklch(0.90 0.01 270)" }}
          />
          <div className="flex gap-3">
            <button onClick={() => setShowNewFolder(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: "oklch(0.15 0.03 270)", color: "oklch(0.70 0.01 270)" }}>
              Annuler
            </button>
            <motion.button
              onClick={() => { if (newFolderName.trim()) createFolder.mutate({ name: newFolderName.trim(), parentId: currentFolderId }); }}
              disabled={!newFolderName.trim() || createFolder.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 290), oklch(0.50 0.25 260))", color: "white" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {createFolder.isPending ? "Création..." : "Créer"}
            </motion.button>
          </div>
        </div>
      </VaultDialog>

      {/* ─── Dialog: Renommer ─────────────────────────────────────────────────── */}
      <VaultDialog open={!!showRename} onClose={() => setShowRename(null)} title="Renommer">
        <div className="flex flex-col gap-4">
          <input
            autoFocus
            type="text"
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && renameName.trim() && showRename) rename.mutate({ id: showRename.id, name: renameName.trim() }); }}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "oklch(0.10 0.025 270)", border: "1px solid oklch(0.25 0.05 290 / 0.4)", color: "oklch(0.90 0.01 270)" }}
          />
          <div className="flex gap-3">
            <button onClick={() => setShowRename(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: "oklch(0.15 0.03 270)", color: "oklch(0.70 0.01 270)" }}>
              Annuler
            </button>
            <motion.button
              onClick={() => { if (renameName.trim() && showRename) rename.mutate({ id: showRename.id, name: renameName.trim() }); }}
              disabled={!renameName.trim() || rename.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 290), oklch(0.50 0.25 260))", color: "white" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {rename.isPending ? "Renommage..." : "Renommer"}
            </motion.button>
          </div>
        </div>
      </VaultDialog>

      {/* ─── Dialog: Supprimer ────────────────────────────────────────────────── */}
      <VaultDialog open={!!showDelete} onClose={() => setShowDelete(null)} title="Confirmer la suppression">
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: "oklch(0.70 0.01 270)" }}>
            Supprimer <strong style={{ color: "oklch(0.90 0.01 270)" }}>"{showDelete?.name}"</strong> ?
            {showDelete?.type === "folder" && " Tout le contenu sera supprimé."}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: "oklch(0.15 0.03 270)", color: "oklch(0.70 0.01 270)" }}>
              Annuler
            </button>
            <motion.button
              onClick={() => { if (showDelete) deleteItem.mutate({ id: showDelete.id }); }}
              disabled={deleteItem.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "oklch(0.60 0.22 25)", color: "white" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {deleteItem.isPending ? "Suppression..." : "Supprimer"}
            </motion.button>
          </div>
        </div>
      </VaultDialog>

      {/* ─── Dialog: Informations ─────────────────────────────────────────────── */}
      <VaultDialog open={showInfo && !!infoItem} onClose={() => setShowInfo(false)} title="Informations">
        {infoItem && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid oklch(0.20 0.04 270)" }}>
              <FileIcon type={infoItem.type} mimeType={infoItem.mimeType} name={infoItem.name} size={32} />
              <div>
                <p className="font-semibold text-sm" style={{ color: "oklch(0.90 0.01 270)" }}>{infoItem.name}</p>
                <p className="text-xs" style={{ color: "oklch(0.50 0.02 270)" }}>{infoItem.type === "folder" ? "Dossier" : "Fichier"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Type", value: infoItem.type === "folder" ? "Dossier" : (infoItem.mimeType ?? "Inconnu") },
                { label: "Taille", value: infoItem.type === "file" ? formatFileSize(infoItem.fileSize) : "—" },
                { label: "Créé le", value: formatDate(infoItem.createdAt) },
                { label: "Modifié le", value: formatDate(infoItem.updatedAt) },
                { label: "Dernier accès", value: formatDate(infoItem.lastAccessedAt) },
                { label: "ID", value: `#${infoItem.id}` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg p-3" style={{ background: "oklch(0.10 0.025 270)" }}>
                  <p className="text-xs mb-1" style={{ color: "oklch(0.45 0.02 270)" }}>{label}</p>
                  <p className="text-xs font-mono-custom truncate" style={{ color: "oklch(0.80 0.01 270)" }}>{value}</p>
                </div>
              ))}
            </div>
            {infoItem.type === "file" && infoItem.s3Url && (
              <div className="flex gap-3 pt-2">
                <motion.button
                  onClick={() => setPreviewItem(infoItem)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: "oklch(0.15 0.03 270)", color: "oklch(0.75 0.20 290)", border: "1px solid oklch(0.25 0.05 290 / 0.4)" }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Eye size={14} /> Aperçu
                </motion.button>
                <motion.a
                  href={infoItem.s3Url}
                  download={infoItem.name}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 290), oklch(0.50 0.25 260))", color: "white" }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Download size={14} /> Télécharger
                </motion.a>
              </div>
            )}
          </div>
        )}
      </VaultDialog>

      {/* ─── Dialog: Upload ───────────────────────────────────────────────────── */}
      <VaultDialog open={showUpload} onClose={() => { setShowUpload(false); setUploadFiles([]); }} title="Déposer des fichiers" maxWidth="max-w-lg">
        <div className="flex flex-col gap-4">
          <div
            ref={dropZoneRef}
            className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
            style={{ borderColor: "oklch(0.30 0.06 290 / 0.5)", background: "oklch(0.10 0.025 270)" }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "oklch(0.65 0.22 290)"; }}
            onDragLeave={e => { e.currentTarget.style.borderColor = "oklch(0.30 0.06 290 / 0.5)"; }}
            onDrop={e => {
              e.preventDefault();
              e.currentTarget.style.borderColor = "oklch(0.30 0.06 290 / 0.5)";
              const files = Array.from(e.dataTransfer.files);
              setUploadFiles(prev => [...prev, ...files]);
            }}
          >
            <Upload size={32} style={{ color: "oklch(0.55 0.20 290)", margin: "0 auto 12px" }} />
            <p className="text-sm font-semibold" style={{ color: "oklch(0.75 0.01 270)" }}>Glissez vos fichiers ici</p>
            <p className="text-xs mt-1" style={{ color: "oklch(0.45 0.02 270)" }}>ou cliquez pour sélectionner</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => { const files = Array.from(e.target.files ?? []); setUploadFiles(prev => [...prev, ...files]); }}
            />
          </div>

          {uploadFiles.length > 0 && (
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {uploadFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "oklch(0.10 0.025 270)" }}>
                  <FileIcon type="file" mimeType={f.type} name={f.name} size={14} />
                  <span className="text-xs flex-1 truncate" style={{ color: "oklch(0.75 0.01 270)" }}>{f.name}</span>
                  <span className="text-xs font-mono-custom" style={{ color: "oklch(0.45 0.02 270)" }}>{formatFileSize(f.size)}</span>
                  <button onClick={() => setUploadFiles(prev => prev.filter((_, j) => j !== i))}>
                    <X size={12} style={{ color: "oklch(0.55 0.02 270)" }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setShowUpload(false); setUploadFiles([]); }} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: "oklch(0.15 0.03 270)", color: "oklch(0.70 0.01 270)" }}>
              Annuler
            </button>
            <motion.button
              onClick={() => handleFiles(uploadFiles)}
              disabled={uploadFiles.length === 0 || upload.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: uploadFiles.length === 0 ? "oklch(0.20 0.04 270)" : "linear-gradient(135deg, oklch(0.55 0.22 290), oklch(0.50 0.25 260))", color: "white" }}
              whileHover={uploadFiles.length > 0 ? { scale: 1.02 } : {}}
              whileTap={uploadFiles.length > 0 ? { scale: 0.98 } : {}}
            >
              {upload.isPending ? "Envoi..." : `Envoyer ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ""}`}
            </motion.button>
          </div>
        </div>
      </VaultDialog>

      {/* ─── Preview Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 400, background: "oklch(0.05 0.01 270 / 0.95)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewItem(null)}
          >
            <motion.div
              className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden glass-strong"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid oklch(0.20 0.04 270)" }}>
                <span className="text-sm font-semibold" style={{ color: "oklch(0.85 0.01 270)" }}>{previewItem.name}</span>
                <button onClick={() => setPreviewItem(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">
                  <X size={14} style={{ color: "oklch(0.60 0.02 270)" }} />
                </button>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-60px)] flex items-center justify-center p-4">
                {previewItem.mimeType?.startsWith("image/") ? (
                  <img src={previewItem.s3Url!} alt={previewItem.name} className="max-w-full max-h-full rounded-lg object-contain" />
                ) : previewItem.mimeType?.startsWith("video/") ? (
                  <video src={previewItem.s3Url!} controls className="max-w-full max-h-full rounded-lg" />
                ) : previewItem.mimeType?.startsWith("audio/") ? (
                  <audio src={previewItem.s3Url!} controls className="w-full" />
                ) : previewItem.mimeType === "application/pdf" ? (
                  <iframe src={previewItem.s3Url!} className="w-full h-96 rounded-lg" title={previewItem.name} />
                ) : (
                  <div className="text-center py-8">
                    <FileIcon type="file" mimeType={previewItem.mimeType} name={previewItem.name} size={48} />
                    <p className="mt-4 text-sm" style={{ color: "oklch(0.60 0.02 270)" }}>Aperçu non disponible</p>
                    <a href={previewItem.s3Url!} download={previewItem.name} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg text-sm font-semibold"
                      style={{ background: "oklch(0.65 0.22 290)", color: "white" }}>
                      <Download size={14} /> Télécharger
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
