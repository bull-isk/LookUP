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
					gap: "4px",
					padding: "2px 8px",
					borderRadius: "var(--radius-sm)",
					fontSize: "12px",
					cursor: "pointer",
					border: "1px dashed var(--color-border)",
					color: "var(--color-text-muted)",
					background: "rgba(255, 255, 255, 0.01)",
					marginRight: 4,
					marginBottom: 4,
					userSelect: "none",
					transition: "var(--transition)",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.borderColor = "var(--color-accent)";
					e.currentTarget.style.color = "var(--color-text)";
					e.currentTarget.style.background = "rgba(99, 102, 241, 0.05)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.borderColor = "var(--color-border)";
					e.currentTarget.style.color = "var(--color-text-muted)";
					e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)";
				}}
			>
				<i className="fa-solid fa-plus" style={{ fontSize: "10px", opacity: 0.7 }}></i> Add
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
						padding: "2px 8px",
						border: "1px solid var(--color-accent)",
						borderRadius: "var(--radius-sm)",
						background: "var(--color-surface-2)",
						color: "var(--color-text)",
						fontSize: "12px",
						width: 110,
						height: "22px",
					}}
				/>
				<button
					onClick={onEditCommit}
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						width: "22px",
						height: "22px",
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
					onClick={onEditCancel}
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						width: "22px",
						height: "22px",
						background: "transparent",
						border: "1px solid var(--color-border)",
						borderRadius: "var(--radius-sm)",
						color: "var(--color-text-muted)",
						cursor: "pointer",
					}}
				>
					<i className="fa-solid fa-xmark" style={{ fontSize: "10px" }}></i>
				</button>
			</span>
		);
	}

	// ── Normal chip with stable hover overlay ──────────────────────
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
					background: hovered ? "var(--color-surface-3)" : "rgba(255, 255, 255, 0.03)",
					color: "var(--color-text)",
					padding: "2px 8px",
					borderRadius: "var(--radius-sm)",
					fontSize: "12px",
					cursor: onClick ? "pointer" : "default",
					userSelect: "none",
					border: "1px solid var(--color-border)",
					transition: "var(--transition)",
					whiteSpace: "nowrap",
				}}
			>
				{label}
			</span>

			{/* Transparent bridge element layer */}
			{hovered && (
				<span
					style={{
						position: "absolute",
						left: "100%",
						top: 0,
						bottom: 0,
						width: 60,
						background: "transparent",
						zIndex: 19,
					}}
				/>
			)}

			{/* Hover Floating Actions Menu Overlay */}
			{hovered && (
				<span
					style={{
						position: "absolute",
						left: "calc(100% + 4px)",
						top: "50%",
						transform: "translateY(-50%)",
						display: "inline-flex",
						gap: 1,
						background: "var(--color-surface)",
						border: "1px solid var(--color-border-2)",
						borderRadius: "var(--radius-sm)",
						padding: "2px",
						boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
						zIndex: 20,
						whiteSpace: "nowrap",
					}}
				>
					<button
						onClick={(e) => {
							e.stopPropagation();
							onEdit?.();
						}}
						style={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							width: "20px",
							height: "20px",
							background: "transparent",
							border: "none",
							color: "var(--color-text-muted)",
							cursor: "pointer",
							borderRadius: "3px",
							transition: "var(--transition)",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = "var(--color-hover)";
							e.currentTarget.style.color = "var(--color-text)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "transparent";
							e.currentTarget.style.color = "var(--color-text-muted)";
						}}
						title="Edit Value"
					>
						<i className="fa-solid fa-pen" style={{ fontSize: "10px" }}></i>
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation();
							onDelete?.();
						}}
						style={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							width: "20px",
							height: "20px",
							background: "transparent",
							border: "none",
							color: "var(--color-danger)",
							cursor: "pointer",
							borderRadius: "3px",
							transition: "var(--transition)",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "transparent";
						}}
						title="Delete Value"
					>
						<i className="fa-solid fa-trash" style={{ fontSize: "10px" }}></i>
					</button>
				</span>
			)}
		</span>
	);
}
