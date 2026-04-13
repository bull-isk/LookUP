// renderer/src/components/SpecificsEditor.jsx
import { useState } from "react";
import Chip from "./Chip";

const api = window.electronAPI;

const DEFAULT_CATS = ["Preferences", "Interests", "Characteristics", "Habits"];

const inp = {
	padding: "4px 6px",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-sm)",
	background: "var(--color-surface-2)",
	color: "var(--color-text)",
	fontSize: "var(--font-size-sm)",
};

// ── Inline add form (shown below section header) ──────────────────
function InlineAddForm({ tree, personId, preselectedCat, onDone, onClose }) {
	const allCatNames = tree.map((s) => s.SubName);
	const ordered = [...DEFAULT_CATS.filter((d) => allCatNames.includes(d)), ...allCatNames.filter((n) => !DEFAULT_CATS.includes(n))];

	const [catInput, setCatInput] = useState(preselectedCat || "");
	const [catNew, setCatNew] = useState(false);
	const [subInput, setSubInput] = useState("");
	const [valInput, setValInput] = useState("");
	const [showSug, setShowSug] = useState(false);

	// Auto-fill category when sub-specific matches an existing point
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

	// Conflict check: if chosen sub exists under a different category, reject
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

		// Conflict: sub-specific belongs to a different category → revert to correct one
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
		<div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", padding: "8px 0", marginBottom: 8, borderBottom: "1px solid var(--color-border)" }}>
			{/* Category */}
			<div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 120 }}>
				<span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Category</span>
				{!catNew ? (
					<select
						style={{ ...inp, minWidth: 120 }}
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
					<div style={{ display: "flex", gap: 4 }}>
						<input
							autoFocus
							style={{ ...inp, width: 100 }}
							placeholder="Category name"
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
								padding: "2px 5px",
								background: "transparent",
								border: "1px solid var(--color-border)",
								borderRadius: "var(--radius-sm)",
								color: "var(--color-text-muted)",
								cursor: "pointer",
							}}
						>
							✕
						</button>
					</div>
				)}
			</div>

			{/* Sub-specific with suggestions */}
			<div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 130, position: "relative" }}>
				<span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
					Sub-specific
					{conflict && <span style={{ color: "var(--color-danger)", marginLeft: 4 }}>→ will use "{conflict}"</span>}
				</span>
				<input
					style={{ ...inp, width: 130 }}
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
							minWidth: 130,
							background: "var(--color-surface)",
							border: "1px solid var(--color-border)",
							borderRadius: "var(--radius-sm)",
							marginTop: 2,
							overflow: "hidden",
						}}
					>
						{pointSuggestions.slice(0, 5).map((s) => (
							<div
								key={s}
								onMouseDown={() => {
									setSubInput(s);
									setShowSug(false);
								}}
								style={{ padding: "4px 8px", cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}
								onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
								onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
							>
								{s}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Value */}
			<div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 100 }}>
				<span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Value</span>
				<input
					style={{ ...inp, width: "100%" }}
					placeholder="e.g. Mie Ayam…"
					value={valInput}
					onChange={(e) => setValInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleSave();
						if (e.key === "Escape") onClose();
					}}
				/>
			</div>

			<div style={{ display: "flex", gap: 6 }}>
				<button onClick={handleSave} style={{ padding: "4px 12px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
					Add
				</button>
				<button
					onClick={onClose}
					style={{
						padding: "4px 8px",
						background: "transparent",
						border: "1px solid var(--color-border)",
						borderRadius: "var(--radius-sm)",
						color: "var(--color-text-muted)",
						cursor: "pointer",
					}}
				>
					Cancel
				</button>
			</div>
		</div>
	);
}

// ── Point row: label + chips + hover "+ Add" ──────────────────────
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
		<div onMouseEnter={() => setRowHovered(true)} onMouseLeave={() => setRowHovered(false)} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4, paddingLeft: 8 }}>
			{/* Point label */}
			<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 80, paddingTop: 3, flexShrink: 0 }}>{pt.PointName}</span>

			{/* Values as chips */}
			<div style={{ flex: 1, display: "flex", flexWrap: "wrap", alignItems: "center" }}>
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

				{/* Inline add value */}
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
							style={{ ...inp, width: 90, padding: "2px 5px" }}
						/>
						<button
							onClick={commitAdd}
							style={{ padding: "1px 5px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 11 }}
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

// ── Main export ───────────────────────────────────────────────────
export default function SpecificsEditor({ specifics, tree, personId, onReload, addOpen = false, onAddClose }) {
	// No internal addOpen state — it's controlled by parent

	return (
		<div>
			{addOpen && <InlineAddForm tree={tree} personId={personId} onDone={onReload} onClose={onAddClose} />}

			{specifics.length === 0 && !addOpen && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>No specifics yet.</div>}

			{specifics.map((sub) => (
				<div key={sub.SubSpecificsID} style={{ marginBottom: 12 }}>
					<div
						style={{
							fontSize: "var(--font-size-xs)",
							fontWeight: "bold",
							textTransform: "uppercase",
							letterSpacing: 1,
							color: "var(--color-accent)",
							marginBottom: 4,
						}}
					>
						{sub.SubName}
					</div>
					{sub.points.map((pt) => (
						<PointRow key={pt.PointID} pt={pt} personId={personId} onReload={onReload} />
					))}
				</div>
			))}
		</div>
	);
}
