import { useState } from "react";
import Chip from "./Chip";

const api = window.electronAPI;

const DEFAULT_CATS = ["Preferences", "Interests", "Characteristics", "Habits"];

const inp = {
	padding: "6px 12px",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-inner)",
	background: "rgba(7, 8, 13, 0.6)",
	color: "var(--color-text)",
	fontSize: "13px",
	transition: "var(--transition)",
};

// ── Inline add form ────────────────────────────────────────────────
function InlineAddForm({ tree, personId, preselectedCat, onDone, onClose }) {
	const allCatNames = tree.map((s) => s.SubName);
	const ordered = [...DEFAULT_CATS.filter((d) => allCatNames.includes(d)), ...allCatNames.filter((n) => !DEFAULT_CATS.includes(n))];

	const [catInput, setCatInput] = useState(preselectedCat || "");
	const [catNew, setCatNew] = useState(false);
	const [subInput, setSubInput] = useState("");
	const [valInput, setValInput] = useState("");
	const [showSug, setShowSug] = useState(false);

	const handleSubChange = (val) => {
		setSubInput(val);
		setShowSug(true);
		if (!catInput) {
			const match = tree.find((s) => s.points.some((p) => p.PointName.toLowerCase() === val.trim().toLowerCase()));
			if (match) {
				setCatInput(match.SubName);
				setCatNew(false);
			}
		}
	};

	const getConflict = () => {
		if (!catInput || !subInput.trim()) return null;
		const matchingSub = tree.find((s) => s.points.some((p) => p.PointName.toLowerCase() === subInput.trim().toLowerCase()));
		if (matchingSub && matchingSub.SubName.toLowerCase() !== catInput.toLowerCase()) {
			return matchingSub.SubName;
		}
		return null;
	};

	const pointSuggestions = (() => {
		const currentCat = tree.find((s) => s.SubName.toLowerCase() === catInput.toLowerCase());
		if (!currentCat || !subInput) return [];
		return currentCat.points.map((p) => p.PointName).filter((n) => n.toLowerCase().includes(subInput.toLowerCase()) && n.toLowerCase() !== subInput.toLowerCase());
	})();

	const handleSave = async () => {
		const cat = catInput.trim();
		const sub = subInput.trim();
		const val = valInput.trim();
		if (!cat || !sub || !val) return;

		const conflict = getConflict();
		const resolvedCat = conflict || cat;

		const subId = await api.specificsFindOrCreateSub(resolvedCat);
		const ptId = await api.specificsFindOrCreatePoint(subId, sub);
		await api.specificsAddValue({ PersonID: personId, PointID: ptId, SpecificNote: val });
		onDone();
		onClose();
	};

	const conflict = getConflict();

	return (
		<div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", padding: "12px 0", marginBottom: 16, borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
			<div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
				<span style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>Category</span>
				{!catNew ? (
					<select
						style={{ ...inp, width: "100%", height: "32px", padding: "0 8px" }}
						value={catInput}
						onChange={(e) => {
							if (e.target.value === "__new__") {
								setCatNew(true);
								setCatInput("");
							} else setCatInput(e.target.value);
						}}
					>
						<option value="">— select —</option>
						{ordered.map((n) => (
							<option key={n} value={n}>
								{n}
							</option>
						))}
						<option value="__new__">+ New…</option>
					</select>
				) : (
					<div style={{ display: "flex", gap: 4, height: "32px" }}>
						<input
							autoFocus
							style={{ ...inp, flex: 1, padding: "0 8px" }}
							placeholder="New name..."
							value={catInput}
							onChange={(e) => setCatInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									setCatNew(false);
									setCatInput("");
								}
							}}
						/>
						<button
							onClick={() => {
								setCatNew(false);
								setCatInput("");
							}}
							style={{
								padding: "0 8px",
								background: "transparent",
								border: "1px solid var(--color-border)",
								borderRadius: "var(--radius-inner)",
								color: "var(--color-text-muted)",
								cursor: "pointer",
							}}
						>
							✕
						</button>
					</div>
				)}
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140, position: "relative" }}>
				<span style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
					Sub-specific
					{conflict && <span style={{ color: "var(--color-danger)", marginLeft: 4 }}>→ "{conflict}"</span>}
				</span>
				<input
					style={{ ...inp, width: "100%", height: "32px", padding: "0 8px" }}
					placeholder="e.g. Food, Hobby…"
					value={subInput}
					onChange={(e) => handleSubChange(e.target.value)}
					onFocus={() => setShowSug(true)}
					onBlur={() => setTimeout(() => setShowSug(false), 150)}
				/>
				{showSug && pointSuggestions.length > 0 && (
					<div
						style={{
							position: "absolute",
							top: "100%",
							left: 0,
							zIndex: 50,
							width: "100%",
							background: "var(--color-surface)",
							border: "1px solid var(--color-border)",
							borderRadius: "var(--radius-inner)",
							marginTop: 4,
							overflow: "hidden",
							boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
						}}
					>
						{pointSuggestions.slice(0, 5).map((s) => (
							<div
								key={s}
								onMouseDown={() => {
									setSubInput(s);
									setShowSug(false);
								}}
								style={{ padding: "6px 10px", cursor: "pointer", fontSize: "13px", color: "var(--color-text)" }}
								onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
								onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
							>
								{s}
							</div>
						))}
					</div>
				)}
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 120 }}>
				<span style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>Value</span>
				<input
					style={{ ...inp, width: "100%", height: "32px", padding: "0 8px" }}
					placeholder="e.g. Mie Ayam…"
					value={valInput}
					onChange={(e) => setValInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleSave();
						if (e.key === "Escape") onClose();
					}}
				/>
			</div>

			<div style={{ display: "flex", gap: 6, height: "32px" }}>
				<button
					onClick={handleSave}
					style={{
						padding: "0 14px",
						background: "var(--color-primary)",
						color: "#fff",
						border: "none",
						borderRadius: "var(--radius-inner)",
						cursor: "pointer",
						fontWeight: "600",
						fontSize: "12px",
					}}
				>
					Add
				</button>
				<button
					onClick={onClose}
					style={{
						padding: "0 12px",
						background: "rgba(255,255,255,0.03)",
						border: "1px solid var(--color-border)",
						borderRadius: "var(--radius-inner)",
						color: "var(--color-text-muted)",
						cursor: "pointer",
						fontSize: "12px",
					}}
				>
					Cancel
				</button>
			</div>
		</div>
	);
}

// ── Point row: label + chips ───────────────────────────────────────
function PointRow({ pt, personId, onReload }) {
	const [rowHovered, setRowHovered] = useState(false);
	const [addOpen, setAddOpen] = useState(false);
	const [addVal, setAddVal] = useState("");
	const [editingId, setEditingId] = useState(null);
	const [editDraft, setEditDraft] = useState("");

	const commitAdd = async () => {
		if (!addVal.trim()) {
			setAddOpen(false);
			return;
		}
		await api.specificsAddValue({ PersonID: personId, PointID: pt.PointID, SpecificNote: addVal.trim() });
		setAddVal("");
		setAddOpen(false);
		onReload();
	};

	const commitEdit = async (specificsId) => {
		const trimmed = editDraft.trim();
		if (trimmed) await api.specificsUpdateValue(specificsId, trimmed);
		setEditingId(null);
		onReload();
	};

	return (
		<div onMouseEnter={() => setRowHovered(true)} onMouseLeave={() => setRowHovered(false)} style={{ display: "flex", alignItems: "center", gap: 8, minHeight: "26px" }}>
			{/* Design Spec: Left Key label with nested colon alignment structure */}
			<span
				style={{
					color: "var(--color-text-muted)",
					fontSize: "13px",
					fontWeight: "500",
					fontFamily: "var(--font-mono)",
					width: "90px", // Snug spacing matching figma specs
					display: "inline-flex",
					justifyContent: "space-between",
					flexShrink: 0,
				}}
			>
				<span>{pt.PointName}</span>
				<span style={{ marginRight: "4px", opacity: 0.5 }}>:</span>
			</span>

			{/* Value items and chips */}
			<div style={{ flex: 1, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
				{pt.values.map((v) =>
					editingId === v.SpecificsID ? (
						<Chip key={v.SpecificsID} editing editValue={editDraft} onEditChange={setEditDraft} onEditCommit={() => commitEdit(v.SpecificsID)} onEditCancel={() => setEditingId(null)} />
					) : (
						<Chip
							key={v.SpecificsID}
							label={v.SpecificNote}
							onEdit={() => {
								setEditDraft(v.SpecificNote);
								setEditingId(v.SpecificsID);
							}}
							onDelete={async () => {
								await api.specificsDeleteValue(v.SpecificsID);
								onReload();
							}}
						/>
					),
				)}

				{addOpen ? (
					<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
						<input
							autoFocus
							value={addVal}
							onChange={(e) => setAddVal(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") commitAdd();
								if (e.key === "Escape") {
									setAddOpen(false);
									setAddVal("");
								}
							}}
							onBlur={() =>
								setTimeout(() => {
									setAddOpen(false);
									setAddVal("");
								}, 150)
							}
							placeholder="value…"
							style={{ ...inp, width: 90, padding: "2px 6px", height: "22px", fontSize: "12px" }}
						/>
						<button
							onClick={commitAdd}
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
								fontSize: 10,
							}}
						>
							✓
						</button>
					</span>
				) : (
					rowHovered && <Chip addChip onAdd={() => setAddOpen(true)} />
				)}
			</div>
		</div>
	);
}

// ── Main export ────────────────────────────────────────────────────
export default function SpecificsEditor({ specifics, tree, personId, onReload, addOpen = false, onAddClose }) {
	return (
		<div>
			{addOpen && <InlineAddForm tree={tree} personId={personId} onDone={onReload} onClose={onAddClose} />}

			{specifics.length === 0 && !addOpen && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "13px", paddingLeft: "16px" }}>No specifics yet.</div>}

			{specifics.map((sub) => (
				// Indented container section wrapping the category card group as an integrated block
				<div
					key={sub.SubSpecificsID}
					style={{
						marginLeft: "16px",
						marginBottom: 16,
						display: "flex",
						flexDirection: "column",
						gap: "4px",
					}}
				>
					{/* Category Header Title */}
					<div
						style={{
							fontSize: "12px",
							fontWeight: "700",
							textTransform: "capitalize", // Capitalize style format matching your spec profile cards
							color: "var(--color-text)",
							opacity: 0.9,
							marginTop: "4px",
							marginBottom: "4px",
						}}
					>
						{sub.SubName}
					</div>

					{/* Key-Value Attribute Rows container block */}
					<div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "4px" }}>
						{sub.points.map((pt) => (
							<PointRow key={pt.PointID} pt={pt} personId={personId} onReload={onReload} />
						))}
					</div>
				</div>
			))}
		</div>
	);
}
