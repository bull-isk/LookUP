// pages/PersonDetail/PersonHeader.jsx
import { useState } from "react";
import PronounInput from "../../components/PronounInput";
import CategoryInput from "../../components/CategoryInput";
import { Modal, iStyle, btnP, btnG, btnD, lbl } from "./shared";

const api = window.electronAPI;

// ── Profile picture circles (Optimized for Figma overlapping stack) ──
function ProfilePictures({ media }) {
	const primary = media.find((m) => m.Role === "primary");
	const secondaries = media.filter((m) => m.Role === "secondary");

	const Circle = ({ m, size, borderColor, style }) => (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: "50%",
				border: `2px solid ${borderColor}`,
				overflow: "hidden",
				flexShrink: 0,
				background: "var(--color-surface-3)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
				...style,
			}}
		>
			{m?.Data ? (
				<img src={m.Data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
			) : (
				<span style={{ color: "var(--color-text-faint)", fontSize: size * 0.35, fontFamily: "var(--font-mono)" }}>?</span>
			)}
		</div>
	);

	return (
		<div style={{ display: "flex", alignItems: "center", marginRight: 16, position: "relative", height: "64px", width: "94px" }}>
			{/* Primary Large Avatar */}
			<Circle m={primary} size={64} borderColor="var(--color-primary)" style={{ position: "absolute", left: 0, zIndex: 3 }} />

			{/* Secondary Avatar 1 - Layered behind */}
			<Circle m={secondaries[0] || null} size={36} borderColor="var(--color-border-2)" style={{ position: "absolute", left: "44px", top: "2px", zIndex: 2 }} />

			{/* Secondary Avatar 2 - Layered furthest back */}
			<Circle m={secondaries[1] || null} size={36} borderColor="var(--color-border-2)" style={{ position: "absolute", left: "64px", bottom: "2px", zIndex: 1 }} />
		</div>
	);
}

// ── Edit Header modal ─────────────────────────────────────────────
function EditHeaderModal({ person, pronouns, media, lookups, personId, onClose, onSaved, refreshLookups }) {
	const [draft, setDraft] = useState({
		FullName: person.FullName || "",
		Nickname: person.Nickname || "",
		CategoryID: person.CategoryID || null,
		pronounIds: pronouns.map((p) => p.PronounsID),
	});

	const save = async () => {
		await api.personUpdate(personId, {
			...person,
			FullName: draft.FullName || person.FullName,
			Nickname: draft.Nickname || null,
			CategoryID: draft.CategoryID || null,
		});
		await api.personSetPronouns(personId, draft.pronounIds || []);
		await api.lookupPrunePronouns();
		await api.lookupPruneCategories();
		onSaved();
		onClose();
	};

	return (
		<Modal onClose={onClose} width={480}>
			<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", fontWeight: "bold", color: "var(--color-text)" }}>Edit Header Info</div>
			<div style={{ padding: 18, overflowY: "auto" }}>
				<label style={{ display: "block", marginBottom: 12, fontSize: "13px", color: "var(--color-text-muted)" }}>
					Full Name *
					<input style={{ ...iStyle, marginTop: 4 }} value={draft.FullName} onChange={(e) => setDraft((d) => ({ ...d, FullName: e.target.value }))} />
				</label>
				<label style={{ display: "block", marginBottom: 12, fontSize: "13px", color: "var(--color-text-muted)" }}>
					Nickname
					<input style={{ ...iStyle, marginTop: 4 }} value={draft.Nickname} onChange={(e) => setDraft((d) => ({ ...d, Nickname: e.target.value }))} />
				</label>
				<label style={{ display: "block", marginBottom: 12, fontSize: "13px", color: "var(--color-text-muted)" }}>
					Category
					<div style={{ marginTop: 4 }}>
						<CategoryInput
							value={draft.CategoryID}
							categories={lookups.categories}
							onChange={(id) => setDraft((d) => ({ ...d, CategoryID: id }))}
							onNewCategory={async (name) => {
								const id = await api.lookupFindOrCreateCategory(name);
								refreshLookups();
								return id;
							}}
						/>
					</div>
				</label>

				<div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: 6 }}>Pronouns</div>
				<PronounInput
					value={draft.pronounIds}
					allPronouns={lookups.pronouns}
					onChange={(ids) => setDraft((d) => ({ ...d, pronounIds: ids }))}
					onNewPronoun={async (text) => {
						const id = await api.lookupFindOrCreatePronoun(text);
						refreshLookups();
						return id;
					}}
				/>

				{media.length > 0 && (
					<div style={{ marginTop: 18 }}>
						<div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: 8 }}>Profile Pictures</div>
						<div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
							{media.map((m) => {
								const isMain = m.Role === "primary";
								const isSec = m.Role === "secondary";
								return (
									<div key={m.MediaID} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
										<div
											style={{
												width: 60,
												height: 60,
												borderRadius: "var(--radius-inner)",
												overflow: "hidden",
												border: `2px solid ${isMain ? "var(--color-primary)" : isSec ? "var(--color-accent)" : "var(--color-border)"}`,
											}}
										>
											{m.Data ? (
												<img src={m.Data} alt={m.FilePath} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
											) : (
												<div
													style={{
														width: "100%",
														height: "100%",
														background: "var(--color-surface-3)",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														color: "var(--color-text-faint)",
														fontSize: 10,
													}}
												>
													?
												</div>
											)}
										</div>
										<div style={{ display: "flex", gap: 3 }}>
											<button
												onClick={async () => {
													await api.mediaSetRole(personId, m.MediaID, isMain ? null : "primary");
													onSaved();
												}}
												title={isMain ? "Unset main" : "Set as main"}
												style={{
													padding: "1px 6px",
													fontSize: 9,
													cursor: "pointer",
													border: "1px solid var(--color-primary)",
													borderRadius: "var(--radius-sm)",
													background: isMain ? "var(--color-primary)" : "transparent",
													color: isMain ? "#fff" : "var(--color-accent)",
												}}
											>
												★
											</button>
											<button
												onClick={async () => {
													await api.mediaSetRole(personId, m.MediaID, isSec ? null : "secondary");
													onSaved();
												}}
												title={isSec ? "Unset secondary" : "Set as secondary"}
												style={{
													padding: "1px 6px",
													fontSize: 9,
													cursor: "pointer",
													border: "1px solid var(--color-accent)",
													borderRadius: "var(--radius-sm)",
													background: isSec ? "var(--color-accent)" : "transparent",
													color: isSec ? "#fff" : "var(--color-accent)",
												}}
											>
												◆
											</button>
										</div>
										<div
											style={{
												fontSize: 8,
												color: "var(--color-text-faint)",
												maxWidth: 60,
												textAlign: "center",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{m.FilePath || "—"}
										</div>
									</div>
								);
							})}
						</div>
						<div style={{ fontSize: "11px", color: "var(--color-text-faint)", marginTop: 6 }}>★ main · ◆ secondary · click to toggle</div>
					</div>
				)}
			</div>
			<div style={{ padding: "10px 18px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
				<button style={btnG} onClick={onClose}>
					Cancel
				</button>
				<button style={btnP} onClick={save}>
					Save
				</button>
			</div>
		</Modal>
	);
}

// ── Delete confirm modal ──────────────────────────────────────────
function DeleteModal({ person, personId, onClose, onDeleted }) {
	const [input, setInput] = useState("");
	const confirmed = input.trim() === person.FullName;

	const handleDelete = async () => {
		if (!confirmed) return;
		await api.personDelete(personId);
		onDeleted();
	};

	return (
		<Modal onClose={onClose} width={380}>
			<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", fontWeight: "bold", color: "var(--color-danger)" }}>Delete Person</div>
			<div style={{ padding: 18 }}>
				<p style={{ color: "var(--color-text)", marginTop: 0 }}>
					{" "}
					Permanently deletes <strong>{person.FullName}</strong> and all data.{" "}
				</p>
				<p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
					{" "}
					Type <strong style={{ color: "var(--color-text)" }}>{person.FullName}</strong> to confirm:{" "}
				</p>
				<input
					autoFocus
					style={{ ...iStyle, marginTop: 4 }}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && confirmed) handleDelete();
					}}
					placeholder={person.FullName}
				/>
			</div>
			<div style={{ padding: "10px 18px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
				<button style={btnG} onClick={onClose}>
					Cancel
				</button>
				<button style={{ ...btnD, opacity: confirmed ? 1 : 0.4 }} onClick={handleDelete}>
					Delete
				</button>
			</div>
		</Modal>
	);
}

function buildCleanJson(data) {
	if (!data) return data;
	return {
		...data,
		media: (data.media || []).map((m) => ({ MediaID: m.MediaID, FilePath: m.FilePath, Date: m.Date, Role: m.Role })),
	};
}

// ── Import JSON modal ─────────────────────────────────────────────
function ImportJsonModal({ onClose, onImported }) {
	const [text, setText] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	const handleImport = async () => {
		setError("");
		let parsed;
		try {
			parsed = JSON.parse(text.trim());
		} catch (e) {
			setError("Invalid JSON: " + e.message);
			return;
		}
		setSaving(true);
		try {
			await api.personImport(parsed);
			onImported();
			onClose();
		} catch (e) {
			setError(e.message || "Import failed");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal onClose={onClose} width={600}>
			<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", fontWeight: "bold", color: "var(--color-text)" }}>Import from JSON</div>
			<div style={{ padding: 18, overflowY: "auto", flex: 1 }}>
				<p style={{ color: "var(--color-text-muted)", fontSize: "13px", marginTop: 0 }}> Paste a person JSON. Creates a new entry. </p>
				{error && (
					<div
						style={{
							color: "var(--color-danger)",
							fontSize: "13px",
							marginBottom: 10,
							padding: "6px 10px",
							border: "1px solid var(--color-danger)",
							borderRadius: "var(--radius-inner)",
							background: "var(--color-surface-2)",
						}}
					>
						{error}
					</div>
				)}
				<textarea
					autoFocus
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Paste JSON here…"
					style={{
						width: "100%",
						height: 300,
						resize: "vertical",
						padding: "8px 10px",
						border: "1px solid var(--color-border)",
						borderRadius: "var(--radius-inner)",
						background: "var(--color-bg)",
						color: "var(--color-text)",
						fontSize: 11,
						fontFamily: "var(--font-mono)",
						lineHeight: 1.5,
					}}
				/>
			</div>
			<div style={{ padding: "10px 18px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
				<button style={btnG} onClick={onClose}>
					Cancel
				</button>
				<button style={btnP} onClick={handleImport} disabled={saving || !text.trim()}>
					{saving ? "Importing…" : "Import"}
				</button>
			</div>
		</Modal>
	);
}

// ── Main header export ────────────────────────────────────────────
export default function PersonHeader({ person, pronouns, media, lookups, personId, onDeleted, onSaved, refreshLookups, settingsRef, data }) {
	const [panel, setPanel] = useState(null);
	const [settingsOpen, setSettingsOpen] = useState(false);

	const badgeColor = person.CategoryColor || "var(--color-accent)";
	const badgeBg = person.CategoryColor ? `${person.CategoryColor}15` : "var(--color-primary-transparent || rgba(99, 102, 241, 0.15))";
	const badgeBorder = person.CategoryColor ? `${person.CategoryColor}35` : "rgba(99, 102, 241, 0.2)";

	const menuItems = [
		{
			label: "✏  Edit Header Info",
			action: () => {
				setPanel("editHeader");
				setSettingsOpen(false);
			},
		},
		{
			label: "{ }  View JSON",
			action: () => {
				setPanel("viewJson");
				setSettingsOpen(false);
			},
		},
		{
			label: "import  Import JSON",
			action: () => {
				setPanel("importJson");
				setSettingsOpen(false);
			},
		},
		{
			label: "delete  Delete Person",
			action: () => {
				setPanel("deleteConfirm");
				setSettingsOpen(false);
			},
			danger: true,
		},
	];

	return (
		<>
			{/* ── 1. MODAL LAYERS: Kept outside sticky stack context completely ── */}
			{panel === "editHeader" && (
				<EditHeaderModal
					person={person}
					pronouns={pronouns}
					media={media}
					lookups={lookups}
					personId={personId}
					onClose={() => setPanel(null)}
					onSaved={onSaved}
					refreshLookups={refreshLookups}
				/>
			)}

			{panel === "viewJson" && (
				<Modal onClose={() => setPanel(null)} width={660}>
					<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
						<span style={{ fontWeight: "bold", color: "var(--color-text)" }}>JSON — {person.FullName}</span>
						<div style={{ display: "flex", gap: 8 }}>
							<button onClick={() => navigator.clipboard.writeText(JSON.stringify(buildCleanJson(data), null, 2))} style={btnG}>
								Copy
							</button>
							<button style={btnG} onClick={() => setPanel(null)}>
								✕
							</button>
						</div>
					</div>
					<div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
						<pre
							style={{
								background: "var(--color-bg)",
								color: "var(--color-text)",
								padding: 12,
								borderRadius: "var(--radius-inner)",
								fontSize: 11,
								overflowX: "auto",
								whiteSpace: "pre-wrap",
								wordBreak: "break-word",
								margin: 0,
							}}
						>
							{JSON.stringify(buildCleanJson(data), null, 2)}
						</pre>
					</div>
				</Modal>
			)}

			{panel === "importJson" && <ImportJsonModal onClose={() => setPanel(null)} onImported={onSaved} />}
			{panel === "deleteConfirm" && <DeleteModal person={person} personId={personId} onClose={() => setPanel(null)} onDeleted={onDeleted} />}

			{/* ── 2. STICKY HEADER CONTAINER BLOCK (Visual Render Only) ── */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 20,
					position: "sticky",
					top: 0,
					zIndex: 10,
					background: "rgba(7, 8, 13, 0.2)",
					backdropFilter: "blur(4px)",
					WebkitBackdropFilter: "blur(4px)",
					paddingTop: "4px",
					paddingBottom: "12px",
					borderBottom: "1px solid var(--color-border)",
				}}
			>
				{/* Header row content wrapper */}
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
					<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
						{/* Avatars Overlap Stack Row — Horizontally aligned on the same center axis */}
						<div style={{ display: "flex", alignItems: "center", marginRight: 16, position: "relative", height: "84px", width: "134px" }}>
							{/* Primary Large Avatar */}
							<div
								style={{
									width: 84,
									height: 84,
									borderRadius: "50%",
									border: `4px solid ${person.CategoryColor || "var(--color-primary)"}`,
									overflow: "hidden",
									flexShrink: 0,
									background: "var(--color-surface-3)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: "0 6px 16px rgba(0,0,0,0.5)",
									position: "absolute",
									left: 0,
									top: "50%",
									transform: "translateY(-50%)",
									zIndex: 3,
								}}
							>
								{media.find((m) => m.Role === "primary")?.Data ? (
									<img src={media.find((m) => m.Role === "primary").Data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
								) : (
									<span style={{ color: "var(--color-text-faint)", fontSize: 28, fontFamily: "var(--font-mono)" }}>?</span>
								)}
							</div>

							{/* Secondary Avatar 1 */}
							<div
								style={{
									width: 52.5,
									height: 52.5,
									borderRadius: "50%",
									border: "4px solid var(--color-border-2)",
									overflow: "hidden",
									flexShrink: 0,
									background: "var(--color-surface-3)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
									position: "absolute",
									left: "62px",
									top: "50%",
									transform: "translateY(-50%)",
									zIndex: 2,
								}}
							>
								{media.filter((m) => m.Role === "secondary")[0]?.Data ? (
									<img src={media.filter((m) => m.Role === "secondary")[0].Data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
								) : (
									<span style={{ color: "var(--color-text-faint)", fontSize: 14, fontFamily: "var(--font-mono)" }}>?</span>
								)}
							</div>

							{/* Secondary Avatar 2 */}
							<div
								style={{
									width: 52.5,
									height: 52.5,
									borderRadius: "50%",
									border: "4px solid var(--color-border-2)",
									overflow: "hidden",
									flexShrink: 0,
									background: "var(--color-surface-3)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
									position: "absolute",
									left: "92px",
									top: "50%",
									transform: "translateY(-50%)",
									zIndex: 1,
								}}
							>
								{media.filter((m) => m.Role === "secondary")[1]?.Data ? (
									<img src={media.filter((m) => m.Role === "secondary")[1].Data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
								) : (
									<span style={{ color: "var(--color-text-faint)", fontSize: 14, fontFamily: "var(--font-mono)" }}>?</span>
								)}
							</div>
						</div>

						{/* Metadata column text fields */}
						<div>
							<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
								<h2 style={{ margin: 0, color: "var(--color-text)", fontSize: "22px", fontWeight: "700" }}>{person.FullName}</h2>
								{person.Nickname && <span style={{ color: "var(--color-text-muted)", fontSize: "14px", fontWeight: "400" }}>({person.Nickname})</span>}

								{person.CategoryName && (
									<span
										style={{
											fontSize: "11px",
											padding: "2px 8px",
											borderRadius: "var(--radius-sm)",
											background: badgeBg,
											color: badgeColor,
											border: `1px solid ${badgeBorder}`,
											fontWeight: "600",
											textTransform: "lowercase",
											fontFamily: "var(--font-mono)",
										}}
									>
										{person.CategoryName}
									</span>
								)}
							</div>
							{pronouns.length > 0 && (
								<div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
									{pronouns.map((p) => (
										<span
											key={p.PronounsID}
											style={{
												fontSize: "11px",
												padding: "1px 6px",
												borderRadius: "var(--radius-sm)",
												background: "rgba(255, 255, 255, 0.03)",
												color: "var(--color-text-muted)",
												border: "1px solid var(--color-border)",
												fontFamily: "var(--font-mono)",
											}}
										>
											{p.Pronouns}
										</span>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Settings dropdown trigger button layout */}
					<div ref={settingsRef} style={{ position: "relative", flexShrink: 0 }}>
						<button
							onClick={() => setSettingsOpen((o) => !o)}
							style={{
								width: "32px",
								height: "32px",
								background: "rgba(255,255,255,0.02)",
								color: "var(--color-text-muted)",
								border: "1px solid var(--color-border)",
								borderRadius: "var(--radius-inner)",
								cursor: "pointer",
								fontSize: "14px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								transition: "var(--transition)",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = "rgba(255,255,255,0.06)";
								e.currentTarget.style.color = "var(--color-text)";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = "rgba(255,255,255,0.02)";
								e.currentTarget.style.color = "var(--color-text-muted)";
							}}
						>
							<i className="fa-solid fa-gear"></i>
						</button>
						{settingsOpen && (
							<div
								style={{
									position: "absolute",
									right: 0,
									top: "100%",
									marginTop: 6,
									background: "var(--color-surface)",
									border: "1px solid var(--color-border-2)",
									borderRadius: "var(--radius-md)",
									width: 180,
									zIndex: 200,
									overflow: "hidden",
									boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
								}}
							>
								{menuItems.map((item) => (
									<div
										key={item.label}
										onClick={item.action}
										style={{
											padding: "10px 14px",
											cursor: "pointer",
											fontSize: "13px",
											color: item.danger ? "var(--color-danger)" : "var(--color-text)",
											borderBottom: "1px solid var(--color-border)",
											transition: "var(--transition)",
										}}
										onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-card-hover)")}
										onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
									>
										{item.label}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
