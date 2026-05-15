// renderer/src/components/MediaCard.jsx
// Displays one stored image. Shows role badge. Hover reveals role controls + delete.
// Props:
//   m:         { MediaID, FilePath, Date, Data, Role }
//   personId:  number
//   onReload:  () => void

import { useState } from "react";

const ROLE_LABELS = { primary: "★ Main", secondary: "◆ Secondary" };
const ROLE_COLORS = { primary: "#6366f1", secondary: "#818cf8" };

export default function MediaCard({ m, personId, onReload }) {
	const [hovered, setHovered] = useState(false);
	const [lightbox, setLightbox] = useState(false);

	const hasImage = m.Data && m.Data.startsWith("data:");
	const api = window.electronAPI;

	const setRole = async (role) => {
		await api.mediaSetRole(personId, m.MediaID, role === m.Role ? null : role);
		onReload();
	};

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
				{/* Image */}
				{hasImage ? (
					<img src={m.Data} alt={m.FilePath} onClick={() => setLightbox(true)} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", cursor: "pointer" }} />
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
						}}
					>
						{ROLE_LABELS[m.Role]}
					</div>
				)}

				{/* Hover overlay: role buttons + delete */}
				{hovered && (
					<div
						style={{
							position: "absolute",
							inset: 0,
							background: "rgba(0,0,0,0.55)",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							gap: 6,
						}}
					>
						<button
							onClick={() => setRole("primary")}
							style={{
								width: "80%",
								padding: "4px 0",
								background: m.Role === "primary" ? "#6366f1" : "rgba(99,102,241,0.35)",
								color: "#fff",
								border: "1px solid #6366f1",
								borderRadius: "var(--radius-sm)",
								cursor: "pointer",
								fontSize: 11,
								fontWeight: "bold",
							}}
						>
							{m.Role === "primary" ? "★ Main (click to unset)" : "★ Set as Main"}
						</button>

						<button
							onClick={() => setRole("secondary")}
							style={{
								width: "80%",
								padding: "4px 0",
								background: m.Role === "secondary" ? "#818cf8" : "rgba(129,140,248,0.25)",
								color: "#fff",
								border: "1px solid #818cf8",
								borderRadius: "var(--radius-sm)",
								cursor: "pointer",
								fontSize: 11,
							}}
						>
							{m.Role === "secondary" ? "◆ Secondary (unset)" : "◆ Set as Secondary"}
						</button>

						<button
							onClick={remove}
							style={{
								width: "80%",
								padding: "4px 0",
								background: "rgba(239,68,68,0.25)",
								color: "#fca5a5",
								border: "1px solid #ef4444",
								borderRadius: "var(--radius-sm)",
								cursor: "pointer",
								fontSize: 11,
							}}
						>
							✕ Remove
						</button>
					</div>
				)}

				{/* Caption */}
				<div style={{ padding: "5px 7px" }}>
					<div
						style={{
							fontSize: "var(--font-size-xs)",
							color: "var(--color-text-muted)",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{m.FilePath}
					</div>
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
						background: "rgba(0,0,0,0.88)",
						zIndex: 1000,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<img
						src={m.Data}
						alt={m.FilePath}
						style={{
							maxWidth: "90vw",
							maxHeight: "90vh",
							objectFit: "contain",
							borderRadius: "var(--radius-md)",
							boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
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
