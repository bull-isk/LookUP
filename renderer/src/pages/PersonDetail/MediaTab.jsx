// pages/PersonDetail/MediaTab.jsx
// Media tab: add-image form with drop zone, gallery grid.

import { useState, useRef } from "react";
import MediaCard from "../../components/MediaCard";
import { secTitle, btnG, btnP, iStyle, today } from "./shared";
import { mediaCreate, mediaLink } from "../../api/bridge";

const api = window.electronAPI;

// ── Add image form ────────────────────────────────────────────────
function MediaAddForm({ personId, onSaved, onCancel }) {
	const [preview, setPreview] = useState(null);
	const [filename, setFilename] = useState("");
	const [title, setTitle] = useState("");
	const [date, setDate] = useState(today());
	const [dragOver, setDragOver] = useState(false);
	const [saving, setSaving] = useState(false);
	const fileRef = useRef(null);

	const readFile = (file) => {
		if (!file || !file.type.startsWith("image/")) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			setPreview(e.target.result);
			setFilename(file.name);
		};
		reader.readAsDataURL(file);
	};

	const handleBrowse = async () => {
		const picked = await api.mediaPick();
		if (!picked?.length) return;
		setPreview(picked[0].dataUri);
		setFilename(picked[0].filename);
	};

	const handleSave = async () => {
		if (!preview) {
			alert("Please select an image first.");
			return;
		}
		setSaving(true);
		try {
			const mid = await mediaCreate({
				FilePath: title.trim() || filename,
				Date: date || today(),
				Data: preview,
			});
			await mediaLink(personId, mid);
			onSaved();
		} catch (e) {
			alert(e.message || "Failed to save image");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 16, background: "var(--color-surface-2)" }}>
			{/* Drop zone */}
			<div
				onDragOver={(e) => {
					e.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragOver(false);
					readFile(e.dataTransfer.files[0]);
				}}
				onClick={() => fileRef.current?.click()}
				style={{
					border: `2px dashed ${dragOver ? "var(--color-accent)" : "var(--color-border)"}`,
					borderRadius: "var(--radius-md)",
					background: dragOver ? "var(--color-hover)" : "var(--color-surface)",
					padding: 20,
					textAlign: "center",
					cursor: "pointer",
					minHeight: 130,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: 8,
					marginBottom: 12,
					transition: "border-color 0.15s, background 0.15s",
				}}
			>
				{preview ? (
					<img src={preview} alt="preview" style={{ maxHeight: 110, maxWidth: "100%", objectFit: "contain", borderRadius: "var(--radius-sm)" }} />
				) : (
					<>
						<div style={{ fontSize: 32, opacity: 0.4 }}>🖼</div>
						<div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>Drop image here, or click to browse</div>
					</>
				)}
			</div>
			<input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => readFile(e.target.files[0])} />

			<label style={{ display: "block", marginBottom: 10, color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
				Title
				<input style={{ ...iStyle, marginTop: 4 }} placeholder={filename || "Image title…"} value={title} onChange={(e) => setTitle(e.target.value)} />
			</label>
			<label style={{ display: "block", marginBottom: 12, color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
				Date
				<input type="date" style={{ ...iStyle, marginTop: 4 }} value={date} onChange={(e) => setDate(e.target.value)} />
			</label>

			<div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
				<button onClick={onCancel} style={btnG}>
					Cancel
				</button>
				<button onClick={handleSave} disabled={saving} style={btnP}>
					{saving ? "Saving…" : "Save Image"}
				</button>
			</div>
		</div>
	);
}

// ── Main export ───────────────────────────────────────────────────
export default function MediaTab({ personId, media, onReload }) {
	const [adding, setAdding] = useState(false);

	return (
		<div>
			<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
				<div style={secTitle}>Media</div>
				{!adding && (
					<button onClick={() => setAdding(true)} style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }}>
						+ Add Image
					</button>
				)}
			</div>

			{adding && (
				<MediaAddForm
					personId={personId}
					onSaved={() => {
						setAdding(false);
						onReload();
					}}
					onCancel={() => setAdding(false)}
				/>
			)}

			{media.length === 0 && !adding ? (
				<div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>No images yet. Click "+ Add Image" to get started.</div>
			) : (
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
					{media.map((m) => (
						<MediaCard key={m.MediaID} m={m} personId={personId} onReload={onReload} />
					))}
				</div>
			)}
		</div>
	);
}
