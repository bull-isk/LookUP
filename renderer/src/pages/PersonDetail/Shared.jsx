// pages/PersonDetail/shared.js
// Shared style constants and primitive UI components used across
// PersonDetail sub-files. Import from here, not from PersonDetail.jsx.

import { useState, useEffect } from "react";

// ── Style constants ───────────────────────────────────────────────
// All colours use CSS variables from index.css — no hardcoded values.

export const iStyle = {
	padding: "4px 6px",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-sm)",
	background: "var(--color-surface-2)",
	color: "var(--color-text)",
	width: "100%",
};

export const btnP = {
	padding: "4px 12px",
	background: "var(--color-primary)",
	color: "#fff",
	border: "none",
	borderRadius: "var(--radius-sm)",
	cursor: "pointer",
};

export const btnD = {
	padding: "3px 8px",
	background: "var(--color-danger)",
	color: "#fff",
	border: "none",
	borderRadius: "var(--radius-sm)",
	cursor: "pointer",
};

export const btnG = {
	padding: "3px 8px",
	background: "transparent",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-sm)",
	color: "var(--color-text-muted)",
	cursor: "pointer",
};

export const divider = {
	borderTop: "1px solid var(--color-border)",
	margin: "14px 0",
};

export const secTitle = {
	fontSize: "var(--font-size-xs)",
	fontWeight: "bold",
	textTransform: "uppercase",
	letterSpacing: 1,
	color: "var(--color-accent)",
	marginBottom: 8,
};

export const lbl = {
	fontSize: "var(--font-size-sm)",
	color: "var(--color-text-muted)",
	marginBottom: 2,
	display: "block",
};

export const today = () => new Date().toISOString().slice(0, 10);

// ── Modal overlay ─────────────────────────────────────────────────
export function Modal({ children, onClose, width = 420 }) {
	return (
		<div
			onClick={onClose}
			style={{
				position: "fixed",
				inset: 0,
				background: "var(--overlay-bg)",
				zIndex: 500,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "var(--color-surface)",
					border: "1px solid var(--color-border-2)",
					borderRadius: "var(--radius-lg)",
					boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
					width,
					maxHeight: "85vh",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
				{children}
			</div>
		</div>
	);
}

// ── Hover-reveal edit/delete row ──────────────────────────────────
export function HoverRow({ children, onEdit, onDelete }) {
	const [h, setH] = useState(false);
	return (
		<div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "3px 0" }}>
			<div style={{ flex: 1 }}>{children}</div>
			<div style={{ display: "flex", gap: 4, opacity: h ? 1 : 0, transition: "opacity 0.12s", flexShrink: 0 }}>
				{onEdit && (
					<button style={btnG} onClick={onEdit}>
						✏
					</button>
				)}
				{onDelete && (
					<button style={btnD} onClick={onDelete}>
						✕
					</button>
				)}
			</div>
		</div>
	);
}

// ── Click-to-edit inline field ────────────────────────────────────
export function InlineField({ label, value, onSave, textarea, placeholder }) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value || "");

	useEffect(() => {
		setDraft(value || "");
	}, [value]);

	const save = () => {
		onSave(draft.trim());
		setEditing(false);
	};
	const cancel = () => {
		setDraft(value || "");
		setEditing(false);
	};

	if (editing)
		return (
			<div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 6 }}>
				<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90, paddingTop: 5 }}>{label}</span>
				<div style={{ flex: 1 }}>
					{textarea ? (
						<textarea style={{ ...iStyle, height: 60, resize: "vertical" }} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
					) : (
						<input
							style={iStyle}
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Enter") save();
								if (e.key === "Escape") cancel();
							}}
						/>
					)}
					<div style={{ display: "flex", gap: 6, marginTop: 4 }}>
						<button style={btnP} onClick={save}>
							Save
						</button>
						<button style={btnG} onClick={cancel}>
							Cancel
						</button>
					</div>
				</div>
			</div>
		);

	return (
		<div onClick={() => setEditing(true)} title="Click to edit" style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 5, cursor: "pointer" }}>
			<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90, paddingTop: 2 }}>{label}</span>
			<span style={{ flex: 1, color: value ? "var(--color-text)" : "var(--color-text-faint)", fontStyle: value ? "normal" : "italic" }}>{value || placeholder || "(click to add)"}</span>
			<span style={{ color: "var(--color-text-faint)", fontSize: 10, opacity: 0.4 }}>✏</span>
		</div>
	);
}

// ── Generic popup form ────────────────────────────────────────────
export function PopupForm({ title, fields, initial = {}, onSave, onClose }) {
	const [vals, setVals] = useState(initial);
	const set = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.value }));
	const setChecked = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.checked }));

	return (
		<Modal onClose={onClose} width={440}>
			<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", fontWeight: "bold", color: "var(--color-text)" }}>{title}</div>
			<div style={{ padding: 18, overflowY: "auto" }}>
				{fields.map((f) => {
					if (f.type === "checkbox")
						return (
							<label
								key={f.key}
								style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}
							>
								<input type="checkbox" checked={!!vals[f.key]} onChange={setChecked(f.key)} />
								{f.label}
							</label>
						);
					if (f.type === "select")
						return (
							<label key={f.key} style={{ display: "flex", flexDirection: "column", marginBottom: 10, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
								{f.label}
								<select style={{ ...iStyle, marginTop: 3 }} value={vals[f.key] || ""} onChange={set(f.key)}>
									<option value="">— select —</option>
									{f.options.map((o) => (
										<option key={o} value={o}>
											{o}
										</option>
									))}
								</select>
							</label>
						);
					return (
						<label key={f.key} style={{ display: "flex", flexDirection: "column", marginBottom: 10, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
							{f.label}
							{f.textarea ? (
								<textarea style={{ ...iStyle, marginTop: 3, height: 60, resize: "vertical" }} value={vals[f.key] || ""} onChange={set(f.key)} />
							) : (
								<input style={{ ...iStyle, marginTop: 3 }} type={f.inputType || "text"} value={vals[f.key] || ""} onChange={set(f.key)} />
							)}
						</label>
					);
				})}
			</div>
			<div style={{ padding: "10px 18px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
				<button style={btnG} onClick={onClose}>
					Cancel
				</button>
				<button
					style={btnP}
					onClick={() => {
						onSave(vals);
						onClose();
					}}
				>
					Save
				</button>
			</div>
		</Modal>
	);
}
