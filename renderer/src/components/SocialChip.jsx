// renderer/src/components/SocialChip.jsx
// Platform-aware chip for social accounts.
// Click body → shell.openExternal(url). Hover → overlay Edit + Delete.
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
		// Use Electron shell.openExternal via IPC — NOT window.open
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

	// Editing mode
	if (editing) {
		return (
			<span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 4, marginBottom: 4 }}>
				<input
					autoFocus
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") commitEdit();
						if (e.key === "Escape") cancelEdit();
					}}
					style={{
						padding: "2px 6px",
						border: "1px solid var(--color-accent)",
						borderRadius: "var(--radius-sm)",
						background: "var(--color-surface-2)",
						color: "var(--color-text)",
						fontSize: "var(--font-size-sm)",
						width: 130,
					}}
				/>
				<button
					onClick={commitEdit}
					style={{ padding: "1px 6px", background: "var(--color-primary)", color: "var(--color-text-on-primary)", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 11 }}
				>
					✓
				</button>
				<button
					onClick={cancelEdit}
					style={{
						padding: "1px 5px",
						background: "transparent",
						border: "1px solid var(--color-border)",
						borderRadius: "var(--radius-sm)",
						color: "var(--color-text-muted)",
						cursor: "pointer",
						fontSize: 11,
					}}
				>
					✕
				</button>
			</span>
		);
	}

	return (
		// Outer container expands right on hover to encompass the overlay — fixes disappearing button bug
		<span
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				position: "relative",
				display: "inline-flex",
				alignItems: "center",
				marginRight: 4,
				marginBottom: 4,
				transition: "padding-right 0.05s",
			}}
		>
			{/* Chip body */}
			<span
				onClick={handleClick}
				style={{
					display: "inline-flex",
					alignItems: "center",
					background: "var(--color-surface-3)",
					color: "var(--color-text)",
					padding: "2px 8px",
					borderRadius: "var(--radius-sm)",
					fontSize: "var(--font-size-sm)",
					cursor: url ? "pointer" : "default",
					userSelect: "none",
					border: hovered && url ? "1px solid var(--color-accent)" : "1px solid transparent",
					transition: "border-color 0.1s",
					whiteSpace: "nowrap",
				}}
			>
				@{social.AccountTag}
			</span>

			{/* Overlay — position:absolute so it doesn't shift layout */}
			{hovered && (
				<span
					style={{
						position: "absolute",
						left: "100%",
						top: "50%",
						transform: "translateY(-50%)",
						marginLeft: 3,
						display: "inline-flex",
						gap: 2,
						background: "var(--color-surface)",
						border: "1px solid var(--color-border)",
						borderRadius: "var(--radius-sm)",
						padding: "2px 3px",
						boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
						zIndex: 20,
					}}
				>
					<button
						onClick={(e) => {
							e.stopPropagation();
							setDraft(social.AccountTag);
							setEditing(true);
						}}
						title="Edit handle"
						style={{ padding: "1px 5px", background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: 11 }}
					>
						✏
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation();
							onDelete(social.SocialID);
						}}
						title="Delete"
						style={{ padding: "1px 5px", background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 11 }}
					>
						✕
					</button>
				</span>
			)}
		</span>
	);
}
