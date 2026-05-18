// renderer/src/components/SocialChip.jsx
import { useState } from "react";

function buildURL(template, handle) {
	if (!template || !handle) return null;
	return template.replace("{value}", encodeURIComponent(handle.replace(/^@/, "")));
}

export default function SocialChip({ social, onEdit, onDelete }) {
	const [hovered, setHovered] = useState(false);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(social.AccountTag);

	const url = buildURL(social.URLTemplate, social.AccountTag);

	const handleClick = () => {
		if (editing || !url) return;
		window.electronAPI.openExternal(url);
	};

	const commitEdit = () => {
		const trimmed = draft.trim();
		if (trimmed && trimmed !== social.AccountTag) {
			onEdit(social.SocialID, trimmed);
		}
		setEditing(false);
	};

	const cancelEdit = () => {
		setDraft(social.AccountTag);
		setEditing(false);
	};

	const inpBase = {
		padding: "2px 8px",
		border: "1px solid var(--color-accent)",
		borderRadius: "var(--radius-sm)",
		background: "var(--color-surface-2)",
		color: "var(--color-text)",
		fontSize: "13px",
		width: 140,
		height: "24px",
		fontFamily: "var(--font-mono)",
	};

	// ── EDITING STATE (Clean Inline Input Row) ──────────────────────
	if (editing) {
		return (
			<div style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: "26px" }}>
				<input
					autoFocus
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") commitEdit();
						if (e.key === "Escape") cancelEdit();
					}}
					style={inpBase}
				/>
				<button
					onClick={commitEdit}
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						width: "24px",
						height: "24px",
						background: "var(--color-primary)",
						color: "#fff",
						border: "none",
						borderRadius: "var(--radius-sm)",
						cursor: "pointer",
					}}
				>
					<i className="fa-solid fa-check" style={{ fontSize: "10px" }}></i>
				</button>
				<button
					onClick={cancelEdit}
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						width: "24px",
						height: "24px",
						background: "transparent",
						border: "1px solid var(--color-border)",
						borderRadius: "var(--radius-sm)",
						color: "var(--color-text-muted)",
						cursor: "pointer",
					}}
				>
					<i className="fa-solid fa-xmark" style={{ fontSize: "10px" }}></i>
				</button>
			</div>
		);
	}

	// ── DISPLAY STATE (Clean Handle Row) ──────────────────────
	return (
		<div
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				display: "inline-flex",
				alignItems: "center",
				minHeight: "26px",
				position: "relative",
			}}
		>
			<span
				onClick={handleClick}
				style={{
					fontSize: "13px",
					color: url ? "var(--color-accent)" : "var(--color-text)",
					cursor: url ? "pointer" : "default",
					userSelect: "none",
					textDecoration: hovered && url ? "underline" : "none",
					transition: "color 0.1s",
					fontFamily: "var(--font-mono)",
				}}
			>
				{social.AccountTag.startsWith("@") ? social.AccountTag : `@${social.AccountTag}`}
			</span>

			{/* Transparent bridge element zone to block pointer jitter */}
			{hovered && <span style={{ position: "absolute", left: "100%", top: 0, bottom: 0, width: 60, background: "transparent", zIndex: 19 }} />}

			{/* Hover Floating Action Capsule with Solid Background Layer */}
			{hovered && (
				<span
					style={{
						position: "absolute",
						left: "calc(100% + 8px)",
						top: "50%",
						transform: "translateY(-50%)",
						display: "inline-flex",
						gap: 2,
						// Anchored solid dark layout surface grounding
						background: "var(--color-surface-2, #181a26)",
						border: "1px solid var(--color-border)",
						borderRadius: "var(--radius-sm, 4px)",
						padding: "3px",
						boxShadow: "0 4px 16px rgba(0, 0, 0, 0.6)",
						zIndex: 20,
						whiteSpace: "nowrap",
					}}
				>
					<button
						onClick={(e) => {
							e.stopPropagation();
							setDraft(social.AccountTag);
							setEditing(true);
						}}
						style={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							width: "22px",
							height: "22px",
							background: "transparent",
							border: "none",
							color: "var(--color-text-muted)",
							cursor: "pointer",
							borderRadius: "var(--radius-sm, 4px)",
							transition: "var(--transition)",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = "var(--color-surface-3, rgba(255,255,255,0.06))";
							e.currentTarget.style.color = "var(--color-text)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "transparent";
							e.currentTarget.style.color = "var(--color-text-muted)";
						}}
						title="Edit Handle"
					>
						<i className="fa-solid fa-pen" style={{ fontSize: "10px" }}></i>
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation();
							onDelete(social.SocialID);
						}}
						style={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							width: "22px",
							height: "22px",
							background: "transparent",
							border: "none",
							color: "var(--color-danger)",
							cursor: "pointer",
							borderRadius: "var(--radius-sm, 4px)",
							transition: "var(--transition)",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "transparent";
						}}
						title="Delete Row"
					>
						<i className="fa-solid fa-trash" style={{ fontSize: "10px" }}></i>
					</button>
				</span>
			)}
		</div>
	);
}
