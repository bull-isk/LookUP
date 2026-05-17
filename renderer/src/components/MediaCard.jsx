// renderer/src/components/MediaCard.jsx
// Displays one stored image with title, date, role badge.
// Click image → lightbox. Hover → delete button overlay.
// Role assignment is handled in the Header Edit modal, not here.

import { useState } from "react";

const ROLE_LABELS = { primary: "★ Main", secondary: "◆ Secondary" };
const ROLE_COLORS = { primary: "#6366f1", secondary: "#818cf8" };

export default function MediaCard({ m, personId, onReload }) {
	const [hovered, setHovered] = useState(false);
	const [lightbox, setLightbox] = useState(false);

	const hasImage = m.Data && m.Data.startsWith("data:");
	const api = window.electronAPI;

	const remove = async () => {
		await api.mediaUnlink(personId, m.MediaID);
		onReload();
	};

	return (
		<>
			<div
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				style={{
					position: "relative",
					borderRadius: "var(--radius-md)",
					overflow: "hidden",
					border: `1px solid ${m.Role ? ROLE_COLORS[m.Role] : "var(--color-border)"}`,
					background: "var(--color-surface-2)",
				}}
			>
				{/* Image — click to open lightbox */}
				{hasImage ? (
					<img src={m.Data} alt={m.FilePath} onClick={() => setLightbox(true)} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", cursor: "zoom-in" }} />
				) : (
					<div
						style={{
							width: "100%",
							aspectRatio: "1",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							background: "var(--color-surface-3)",
							color: "var(--color-text-faint)",
							fontSize: "var(--font-size-xs)",
							padding: 8,
							textAlign: "center",
						}}
					>
						{m.FilePath || "No image"}
					</div>
				)}

				{/* Role badge */}
				{m.Role && (
					<div
						style={{
							position: "absolute",
							top: 5,
							left: 5,
							background: ROLE_COLORS[m.Role],
							color: "#fff",
							fontSize: 9,
							fontWeight: "bold",
							padding: "2px 5px",
							borderRadius: "var(--radius-sm)",
							letterSpacing: 0.5,
							pointerEvents: "none",
						}}
					>
						{ROLE_LABELS[m.Role]}
					</div>
				)}

				{/* Hover: delete button only */}
				{hovered && (
					<button
						onClick={remove}
						title="Remove image"
						style={{
							position: "absolute",
							top: 5,
							right: 5,
							background: "rgba(0,0,0,0.65)",
							color: "#fca5a5",
							border: "1px solid #ef4444",
							borderRadius: "var(--radius-sm)",
							padding: "2px 8px",
							cursor: "pointer",
							fontSize: 11,
							boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
						}}
					>
						✕
					</button>
				)}

				{/* Caption */}
				<div style={{ padding: "5px 7px" }}>
					<div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.FilePath || "—"}</div>
					{m.Date && <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-faint)", marginTop: 1 }}>{m.Date}</div>}
				</div>
			</div>

			{/* Lightbox */}
			{lightbox && (
				<div
					onClick={() => setLightbox(false)}
					style={{
						position: "fixed",
						inset: 0,
						background: "rgba(0,0,0,0.92)",
						zIndex: 2000,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<img
						src={m.Data}
						alt={m.FilePath}
						style={{
							maxWidth: "92vw",
							maxHeight: "92vh",
							objectFit: "contain",
							borderRadius: "var(--radius-md)",
							boxShadow: "0 8px 48px rgba(0,0,0,0.9)",
						}}
					/>
					<div
						style={{
							position: "absolute",
							bottom: 24,
							left: "50%",
							transform: "translateX(-50%)",
							color: "rgba(255,255,255,0.7)",
							fontSize: "var(--font-size-sm)",
							textAlign: "center",
							pointerEvents: "none",
						}}
					>
						{m.FilePath}
						{m.Date && ` · ${m.Date}`}
						<div style={{ fontSize: "var(--font-size-xs)", marginTop: 4, opacity: 0.5 }}>Click anywhere to close</div>
					</div>
				</div>
			)}
		</>
	);
}
