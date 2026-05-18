// pages/PersonDetail/shared.js
// Shared style constants and primitive UI components used across
// PersonDetail sub-files. Import from here, not from PersonDetail.jsx.

import { useState, useEffect } from "react";

// ── Style constants ───────────────────────────────────────────────
// All colours use CSS variables from index.css — no hardcoded values.

export const iStyle = {
	padding: "6px 12px",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-inner)",
	background: "rgba(7, 8, 13, 0.6)",
	color: "var(--color-text)",
	width: "100%",
	transition: "var(--transition)",
};

export const btnP = {
	padding: "6px 14px",
	background: "var(--color-primary)",
	color: "#fff",
	border: "none",
	borderRadius: "var(--radius-inner)",
	cursor: "pointer",
	fontWeight: "600",
	fontSize: "12px",
	transition: "var(--transition)",
};

export const btnD = {
	padding: "6px 12px",
	background: "var(--color-danger)",
	color: "#fff",
	border: "none",
	borderRadius: "var(--radius-inner)",
	cursor: "pointer",
	transition: "var(--transition)",
};

export const btnG = {
	padding: "6px 12px",
	background: "rgba(99, 102, 241, 0.06)",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-inner)",
	color: "var(--color-text-muted)",
	cursor: "pointer",
	fontWeight: "500",
	fontSize: "12px",
	transition: "var(--transition)",
};

export const divider = {
	borderTop: "1px solid rgba(255, 255, 255, 0.05)",
	margin: "24px 0",
};

export const detailCardStyle = {
	background: "rgba(255, 255, 255, 0.01)",
	border: "1px solid rgba(255, 255, 255, 0.05)",
	borderRadius: "12px",
	padding: "16px 20px",
	marginBottom: "14px",
	display: "flex",
	flexDirection: "column",
	gap: "8px",
};

export const detailRowLabel = {
	fontFamily: "var(--font-mono)",
	fontSize: "13px",
	fontWeight: "600",
	color: "var(--color-text-muted)",
	minWidth: "120px",
	display: "inline-block",
};

export const detailRowValue = {
	fontSize: "13px",
	color: "var(--color-text)",
};

export const secTitle = {
	fontSize: "11px",
	fontWeight: "800",
	textTransform: "uppercase",
	letterSpacing: "0.06em",
	color: "var(--color-accent)",
	display: "flex",
	alignItems: "center",
	gap: "8px",
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
				background: "rgba(3, 4, 7, 0.75)", // Deep darkened backdrop curtain
				backdropFilter: "blur(4px)", // Blurs out background text confusion
				webkitBackdropFilter: "blur(4px)",
				zIndex: 500,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					// Solid dark background anchor so components inside don't bleed through
					background: "var(--color-surface, #11131c)",
					border: "1px solid var(--color-border-2, rgba(255, 255, 255, 0.08))",
					borderRadius: "var(--radius-lg, 12px)",
					boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)", // Deep shadow drop elevation
					width,
					maxHeight: "85vh",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					animation: "modalAppear 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
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
		<div
			onMouseEnter={() => setH(true)}
			onMouseLeave={() => setH(false)}
			style={{
				display: "flex",
				alignItems: "center",
				gap: 8,
				padding: "6px 10px",
				borderRadius: "var(--radius-inner)",
				background: h ? "var(--color-card-hover)" : "transparent",
				transition: "var(--transition)",
			}}
		>
			<div style={{ flex: 1 }}>{children}</div>
			<div style={{ display: "flex", gap: 4, opacity: h ? 1 : 0, transition: "opacity 0.15s", flexShrink: 0 }}>
				{onEdit && (
					<button style={btnG} onClick={onEdit} title="Edit Entry">
						<i className="fa-solid fa-pen-to-square" style={{ fontSize: "11px" }}></i>
					</button>
				)}
				{onDelete && (
					<button style={btnD} onClick={onDelete} title="Delete Entry">
						<i className="fa-solid fa-trash-can" style={{ fontSize: "11px" }}></i>
					</button>
				)}
			</div>
		</div>
	);
}

// Inside pages/PersonDetail/shared.js

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

	const getIconClass = (lbl) => {
		const lower = lbl.toLowerCase();
		if (lower.includes("address") || lower.includes("location")) return "fa-solid fa-location-dot";
		if (lower.includes("note") || lower.includes("bio")) return "fa-solid fa-comment-dots";
		return "fa-solid fa-pen";
	};

	// Shared row wrapper style to ensure perfect alignment in both edit and read states
	const rowStyle = {
		display: "flex",
		gap: 12,
		alignItems: textarea && editing ? "flex-start" : "center",
		minHeight: "24px",
	};

	if (editing)
		return (
			<div style={rowStyle}>
				<span
					style={{
						color: "var(--color-text-muted)",
						fontSize: "13px",
						fontWeight: "600",
						fontFamily: "var(--font-mono)",
						minWidth: "120px",
						display: "inline-block",
						flexShrink: 0,
						paddingTop: textarea ? "4px" : "0px",
					}}
				>
					<i className={getIconClass(label)} style={{ width: 16, marginRight: 8 }}></i>
					{label}
				</span>
				<div style={{ flex: 1 }}>
					{textarea ? (
						<textarea style={{ ...iStyle, height: 60, resize: "vertical" }} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
					) : (
						<input
							style={{ ...iStyle, padding: "2px 8px" }}
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
		<div
			onClick={() => setEditing(true)}
			title="Click to edit"
			style={{ ...rowStyle, cursor: "pointer", transition: "var(--transition)" }}
			onMouseEnter={(e) => {
				const pen = e.currentTarget.querySelector(".inline-edit-pen");
				if (pen) pen.style.opacity = "0.6";
			}}
			onMouseLeave={(e) => {
				const pen = e.currentTarget.querySelector(".inline-edit-pen");
				if (pen) pen.style.opacity = "0.15";
			}}
		>
			<span
				style={{
					color: "var(--color-text-muted)",
					fontSize: "13px",
					fontWeight: "600",
					fontFamily: "var(--font-mono)",
					minWidth: "120px",
					display: "inline-block",
					flexShrink: 0,
				}}
			>
				<i className={getIconClass(label)} style={{ width: 16, marginRight: 8 }}></i>
				{label}
			</span>
			<span style={{ flex: 1, color: value ? "var(--color-text)" : "var(--color-text-faint)", fontStyle: value ? "normal" : "italic", fontSize: "13px" }}>
				{value || placeholder || "(click to add detail)"}
			</span>
			<i className="fa-solid fa-pen inline-edit-pen" style={{ color: "var(--color-text-muted)", fontSize: "11px", opacity: 0.15, transition: "var(--transition)", marginRight: "4px" }}></i>
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
			<div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", fontWeight: "600", fontSize: "15px", color: "var(--color-text)" }}>{title}</div>

			<div style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
				{fields.map((f) => {
					if (f.type === "checkbox")
						return (
							<label key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "13px", color: "var(--color-text-muted)", userSelect: "none" }}>
								<input type="checkbox" checked={!!vals[f.key]} onChange={setChecked(f.key)} style={{ cursor: "pointer" }} />
								{f.label}
							</label>
						);

					if (f.type === "select")
						return (
							<label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "13px", color: "var(--color-text-muted)" }}>
								{f.label}
								<select style={{ ...iStyle, height: "34px", padding: "0 10px" }} value={vals[f.key] || ""} onChange={set(f.key)}>
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
						<label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "13px", color: "var(--color-text-muted)" }}>
							{f.label}
							{f.textarea ? (
								<textarea style={{ ...iStyle, height: 70, resize: "vertical", padding: "8px 12px" }} value={vals[f.key] || ""} onChange={set(f.key)} />
							) : (
								<input style={{ ...iStyle, height: "34px", padding: "0 12px" }} type={f.inputType || "text"} value={vals[f.key] || ""} onChange={set(f.key)} />
							)}
						</label>
					);
				})}
			</div>

			<div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "rgba(0, 0, 0, 0.1)" }}>
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
