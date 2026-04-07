// renderer/src/components/SpecificsEditor.jsx
import { useState } from "react";

const api = window.electronAPI;

// Default categories shown first in dropdown (spec requirement)
const DEFAULT_CATS = ["Preferences", "Interests", "Characteristics", "Habits"];

// ── Tiny shared styles ────────────────────────────────────────────
const inp = {
	width: "100%",
	padding: "5px 8px",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-sm)",
	background: "var(--color-surface-2)",
	color: "var(--color-text)",
};
const btnPrimary = {
	padding: "4px 12px",
	background: "var(--color-primary)",
	color: "#fff",
	border: "none",
	borderRadius: "var(--radius-sm)",
	cursor: "pointer",
};
const btnGhost = {
	padding: "4px 10px",
	background: "transparent",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-sm)",
	color: "var(--color-text-muted)",
	cursor: "pointer",
};
const btnDanger = {
	padding: "2px 6px",
	background: "transparent",
	border: "none",
	color: "var(--color-danger)",
	cursor: "pointer",
	fontSize: 12,
};

// ── 3-part Add popup ──────────────────────────────────────────────
function AddPopup({ tree, onAdd, onClose }) {
	// tree: [{ SubSpecificsID, SubName, points: [{PointID, PointName}] }]

	const [catInput, setCatInput] = useState(""); // typed/selected category
	const [subInput, setSubInput] = useState(""); // typed sub-specific (= point name)
	const [valInput, setValInput] = useState(""); // value
	const [catNew, setCatNew] = useState(false); // creating a brand new category

	// Build ordered category list: defaults first, then others
	const allCatNames = tree.map((s) => s.SubName);
	const ordered = [...DEFAULT_CATS.filter((d) => allCatNames.includes(d)), ...allCatNames.filter((n) => !DEFAULT_CATS.includes(n))];

	// SMART FILL: when user types a sub-specific that exists, auto-fill its category
	const handleSubChange = (val) => {
		setSubInput(val);
		if (!catInput) {
			const match = tree.find((s) => s.points.some((p) => p.PointName.toLowerCase() === val.trim().toLowerCase()));
			if (match) {
				setCatInput(match.SubName);
				setCatNew(false);
			}
		}
	};

	// Points under current selected category (for suggestion)
	const currentCat = tree.find((s) => s.SubName.toLowerCase() === catInput.toLowerCase());
	const pointSuggestions = currentCat ? currentCat.points.map((p) => p.PointName).filter((n) => n.toLowerCase().includes(subInput.toLowerCase()) && n !== subInput) : [];

	const handleSave = async () => {
		const cat = catNew ? catInput.trim() : catInput.trim();
		const sub = subInput.trim();
		const val = valInput.trim();
		if (!cat || !sub || !val) return;

		const subId = await api.specificsFindOrCreateSub(cat);
		const ptId = await api.specificsFindOrCreatePoint(subId, sub);
		await api.specificsAddValue({ PersonID: onAdd.personId, PointID: ptId, SpecificNote: val });
		onAdd.onDone();
		onClose();
	};

	return (
		<div onClick={onClose} style={{ position: "fixed", inset: 0, background: "var(--overlay-bg)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", width: 380, padding: 20 }}
			>
				<div style={{ fontWeight: "bold", marginBottom: 14, color: "var(--color-text)" }}>Add Specific</div>

				{/* 1. Category */}
				<label style={{ display: "block", marginBottom: 10, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
					Category
					{!catNew ? (
						<select
							style={{ ...inp, marginTop: 4 }}
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
							<option value="__new__">+ New category…</option>
						</select>
					) : (
						<div style={{ display: "flex", gap: 6, marginTop: 4 }}>
							<input
								autoFocus
								style={{ ...inp, flex: 1 }}
								placeholder="New category name"
								value={catInput}
								onChange={(e) => setCatInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") document.getElementById("spec-sub-input")?.focus();
								}}
							/>
							<button
								style={btnGhost}
								onClick={() => {
									setCatNew(false);
									setCatInput("");
								}}
							>
								✕
							</button>
						</div>
					)}
				</label>

				{/* 2. Sub-specific (= point name) */}
				<label style={{ display: "block", marginBottom: 10, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", position: "relative" }}>
					Sub-specific
					<input
						id="spec-sub-input"
						style={{ ...inp, marginTop: 4 }}
						placeholder="e.g. Food, Hobbies, Strength…"
						value={subInput}
						onChange={(e) => handleSubChange(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") document.getElementById("spec-val-input")?.focus();
						}}
					/>
					{/* Suggestion dropdown for existing points */}
					{pointSuggestions.length > 0 && subInput && (
						<div
							style={{
								position: "absolute",
								top: "100%",
								left: 0,
								right: 0,
								zIndex: 10,
								background: "var(--color-surface)",
								border: "1px solid var(--color-border)",
								borderTop: "none",
								borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
							}}
						>
							{pointSuggestions.slice(0, 5).map((s) => (
								<div
									key={s}
									onMouseDown={() => setSubInput(s)}
									style={{ padding: "5px 10px", cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}
									onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
									onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
								>
									{s}
								</div>
							))}
						</div>
					)}
				</label>

				{/* 3. Value */}
				<label style={{ display: "block", marginBottom: 16, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
					Value
					<input
						id="spec-val-input"
						style={{ ...inp, marginTop: 4 }}
						placeholder="e.g. Mie Ayam, Jazz, Reading…"
						value={valInput}
						onChange={(e) => setValInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSave();
						}}
					/>
				</label>

				<div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
					<button style={btnGhost} onClick={onClose}>
						Cancel
					</button>
					<button style={btnPrimary} onClick={handleSave}>
						Add
					</button>
				</div>
			</div>
		</div>
	);
}

// ── Inline add-value row (inside existing point) ──────────────────
function InlineAdd({ pointId, personId, onAdded }) {
	const [open, setOpen] = useState(false);
	const [val, setVal] = useState("");

	const commit = async () => {
		if (!val.trim()) return;
		await api.specificsAddValue({ PersonID: personId, PointID: pointId, SpecificNote: val.trim() });
		setVal("");
		setOpen(false);
		onAdded();
	};

	if (!open)
		return (
			<button onClick={() => setOpen(true)} style={{ ...btnGhost, fontSize: "var(--font-size-xs)", padding: "1px 6px", marginTop: 2 }}>
				+ value
			</button>
		);

	return (
		<div style={{ display: "flex", gap: 4, marginTop: 4 }}>
			<input
				autoFocus
				style={{ ...inp, flex: 1, padding: "2px 6px" }}
				value={val}
				onChange={(e) => setVal(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") commit();
					if (e.key === "Escape") {
						setOpen(false);
						setVal("");
					}
				}}
				placeholder="new value…"
			/>
			<button style={btnPrimary} onClick={commit}>
				✓
			</button>
			<button
				style={btnGhost}
				onClick={() => {
					setOpen(false);
					setVal("");
				}}
			>
				✕
			</button>
		</div>
	);
}

// ── Single editable value ─────────────────────────────────────────
function ValueChip({ value, onUpdate, onDelete }) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value.SpecificNote);

	const save = async () => {
		const trimmed = draft.trim();
		if (trimmed && trimmed !== value.SpecificNote) {
			await api.specificsUpdateValue(value.SpecificsID, trimmed);
			onUpdate();
		}
		setEditing(false);
	};

	if (editing)
		return (
			<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
				<input
					autoFocus
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") save();
						if (e.key === "Escape") {
							setDraft(value.SpecificNote);
							setEditing(false);
						}
					}}
					style={{ ...inp, width: 120, padding: "1px 4px", display: "inline" }}
				/>
				<button style={{ ...btnPrimary, padding: "1px 5px" }} onClick={save}>
					✓
				</button>
				<button
					style={btnGhost}
					onClick={() => {
						setDraft(value.SpecificNote);
						setEditing(false);
					}}
				>
					✕
				</button>
			</span>
		);

	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 3,
				background: "var(--color-surface-3)",
				color: "var(--color-text)",
				borderRadius: "var(--radius-sm)",
				padding: "1px 7px",
				marginRight: 4,
				marginBottom: 2,
				fontSize: "var(--font-size-sm)",
			}}
		>
			<span onClick={() => setEditing(true)} style={{ cursor: "pointer" }}>
				{value.SpecificNote}
			</span>
			<span
				onClick={async () => {
					await api.specificsDeleteValue(value.SpecificsID);
					onDelete();
				}}
				style={{ cursor: "pointer", color: "var(--color-danger)", fontSize: 10, opacity: 0.7 }}
			>
				×
			</span>
		</span>
	);
}

// ── Main export ───────────────────────────────────────────────────
export default function SpecificsEditor({ specifics, tree, personId, onReload }) {
	const [showPopup, setShowPopup] = useState(false);

	return (
		<div>
			{/* Render existing specifics: Category → Point : Values */}
			{specifics.length === 0 && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)", marginBottom: 8 }}>No specifics yet.</div>}

			{specifics.map((sub) => (
				<div key={sub.SubSpecificsID} style={{ marginBottom: 12 }}>
					{/* Category label */}
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
						<div key={pt.PointID} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4, paddingLeft: 8 }}>
							{/* Point label */}
							<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 80, paddingTop: 2, flexShrink: 0 }}>{pt.PointName}</span>
							{/* Values */}
							<div style={{ flex: 1 }}>
								{pt.values.map((v) => (
									<ValueChip key={v.SpecificsID} value={v} onUpdate={onReload} onDelete={onReload} />
								))}
								<InlineAdd pointId={pt.PointID} personId={personId} onAdded={onReload} />
							</div>
						</div>
					))}
				</div>
			))}

			{/* Add button */}
			<button onClick={() => setShowPopup(true)} style={{ ...btnGhost, marginTop: 4, fontSize: "var(--font-size-sm)" }}>
				+ Add Specific
			</button>

			{showPopup && <AddPopup tree={tree} onAdd={{ personId, onDone: onReload }} onClose={() => setShowPopup(false)} />}
		</div>
	);
}
