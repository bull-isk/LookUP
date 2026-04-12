// renderer/src/components/Chip.jsx
import { useState } from "react";

export default function Chip({ label, onClick, onEdit, onDelete, editing = false, editValue = "", onEditChange, onEditCommit, onEditCancel, addChip = false, onAdd }) {
	const [hovered, setHovered] = useState(false);

	// ── Add-value chip variant ─────────────────────────────────────
	if (addChip) {
		return (
			<span
				onClick={onAdd}
				style={{
					display: "inline-flex",
					alignItems: "center",
					padding: "2px 8px",
					borderRadius: "var(--radius-sm)",
					fontSize: "var(--font-size-sm)",
					cursor: "pointer",
					border: "1px dashed var(--color-border)",
					color: "var(--color-text-faint)",
					background: "transparent",
					marginRight: 4,
					marginBottom: 4,
					userSelect: "none",
				}}
			>
				+ Add
			</span>
		);
	}

	// ── Editing variant ────────────────────────────────────────────
	if (editing) {
		return (
			<span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 4, marginBottom: 4 }}>
				<input
					autoFocus
					value={editValue}
					onChange={(e) => onEditChange?.(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") onEditCommit?.();
						if (e.key === "Escape") onEditCancel?.();
					}}
					style={{
						padding: "2px 6px",
						border: "1px solid var(--color-accent)",
						borderRadius: "var(--radius-sm)",
						background: "var(--color-surface-2)",
						color: "var(--color-text)",
						fontSize: "var(--font-size-sm)",
						width: 110,
					}}
				/>
				<button
					onClick={onEditCommit}
					style={{
						padding: "1px 5px",
						background: "var(--color-primary)",
						color: "#fff",
						border: "none",
						borderRadius: "var(--radius-sm)",
						cursor: "pointer",
						fontSize: "var(--font-size-xs)",
					}}
				>
					✓
				</button>
				<button
					onClick={onEditCancel}
					style={{
						padding: "1px 4px",
						background: "transparent",
						border: "1px solid var(--color-border)",
						borderRadius: "var(--radius-sm)",
						color: "var(--color-text-muted)",
						cursor: "pointer",
						fontSize: "var(--font-size-xs)",
					}}
				>
					✕
				</button>
			</span>
		);
	}

	// ── Normal chip with stable hover overlay ──────────────────────
	// Key fix: a transparent "bridge" div fills the gap between chip and overlay.
	// This keeps the outer container hovered even when the cursor is in the gap.
	return (
		<span
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{ position: "relative", display: "inline-flex", alignItems: "center", marginRight: 4, marginBottom: 4 }}
		>
			{/* Chip body */}
			<span
				onClick={onClick}
				style={{
					display: "inline-flex",
					alignItems: "center",
					background: "var(--color-surface-3)",
					color: "var(--color-text)",
					padding: "2px 8px",
					borderRadius: "var(--radius-sm)",
					fontSize: "var(--font-size-sm)",
					cursor: onClick ? "pointer" : "default",
					userSelect: "none",
					border: hovered && onClick ? "1px solid var(--color-accent)" : "1px solid transparent",
					transition: "border-color 0.1s",
					whiteSpace: "nowrap",
				}}
			>
				{label}
			</span>

			{/* Transparent bridge: fills gap between chip and overlay.
          Width = gap (4px) + overlay width (~52px). Zero height, invisible.
          Keeps the outer span "hovered" while cursor moves rightward. */}
			{hovered && (
				<span
					style={{
						position: "absolute",
						left: "100%",
						top: 0,
						bottom: 0,
						width: 60, // covers gap + overlay
						background: "transparent", // invisible
						zIndex: 19, // under overlay (zIndex:20)
					}}
				/>
			)}

			{/* Overlay: Edit + Delete buttons */}
			{hovered && (
				<span
					style={{
						position: "absolute",
						left: "calc(100% + 3px)",
						top: "50%",
						transform: "translateY(-50%)",
						display: "inline-flex",
						gap: 2,
						background: "var(--color-surface)",
						border: "1px solid var(--color-border)",
						borderRadius: "var(--radius-sm)",
						padding: "2px 3px",
						boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
						zIndex: 20,
						whiteSpace: "nowrap",
					}}
				>
					<button
						onClick={(e) => {
							e.stopPropagation();
							onEdit?.();
						}}
						style={{ padding: "1px 5px", background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: 11 }}
						title="Edit"
					>
						✏
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation();
							onDelete?.();
						}}
						style={{ padding: "1px 5px", background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 11 }}
						title="Delete"
					>
						✕
					</button>
				</span>
			)}
		</span>
	);
}
