// renderer/src/components/PronounInput.jsx
import { useState } from "react";
import Chip from "./Chip";

const sel = {
	padding: "2px 6px",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-sm)",
	background: "var(--color-surface-2)",
	color: "var(--color-text)",
	fontSize: "var(--font-size-sm)",
	height: "22px",
	outline: "none",
};

export default function PronounInput({ value = [], allPronouns = [], onChange, onNewPronoun }) {
	const [adding, setAdding] = useState(false);
	const [newText, setNewText] = useState("");
	const [selVal, setSelVal] = useState("");
	const [editingId, setEditingId] = useState(null);
	const [editDraft, setEditDraft] = useState("");

	const selected = allPronouns.filter((p) => value.includes(p.PronounsID));
	const unselected = allPronouns.filter((p) => !value.includes(p.PronounsID));

	const add = (id) => {
		if (!value.includes(id)) onChange([...value, id]);
	};
	const remove = (id) => onChange(value.filter((x) => x !== id));

	const commitEdit = async (oldId) => {
		const trimmed = editDraft.trim();
		if (!trimmed) {
			setEditingId(null);
			return;
		}
		const existing = allPronouns.find((p) => p.Pronouns.toLowerCase() === trimmed.toLowerCase());
		const newId = existing ? existing.PronounsID : await onNewPronoun(trimmed);
		if (newId !== oldId) {
			onChange(value.map((id) => (id === oldId ? newId : id)).filter((v, i, arr) => arr.indexOf(v) === i));
		}
		setEditingId(null);
	};

	const handleSelect = async (e) => {
		const v = e.target.value;
		setSelVal("");
		if (!v) return;
		if (v === "__new__") {
			setAdding(true);
			return;
		}
		add(Number(v));
	};

	const commitNew = async () => {
		const trimmed = newText.trim();
		if (!trimmed) {
			setAdding(false);
			return;
		}
		const id = await onNewPronoun(trimmed);
		add(id);
		setNewText("");
		setAdding(false);
	};

	return (
		<div>
			<div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6, minHeight: 24, alignItems: "center" }}>
				{selected.length === 0 && <span style={{ color: "var(--color-text-faint)", fontSize: "13px", fontStyle: "italic" }}>None</span>}
				{selected.map((p) =>
					editingId === p.PronounsID ? (
						<Chip key={p.PronounsID} editing editValue={editDraft} onEditChange={setEditDraft} onEditCommit={() => commitEdit(p.PronounsID)} onEditCancel={() => setEditingId(null)} />
					) : (
						<Chip
							key={p.PronounsID}
							label={p.Pronouns}
							onEdit={() => {
								setEditDraft(p.Pronouns);
								setEditingId(p.PronounsID);
							}}
							onDelete={() => remove(p.PronounsID)}
						/>
					),
				)}
			</div>

			{!adding ? (
				<select value={selVal} onChange={handleSelect} style={sel}>
					<option value="">+ Add pronoun…</option>
					{unselected.map((p) => (
						<option key={p.PronounsID} value={p.PronounsID}>
							{p.Pronouns}
						</option>
					))}
					<option value="__new__">✏ Add new…</option>
				</select>
			) : (
				<div style={{ display: "flex", gap: 4, alignItems: "center" }}>
					<input
						autoFocus
						value={newText}
						onChange={(e) => setNewText(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") commitNew();
							if (e.key === "Escape") {
								setAdding(false);
								setNewText("");
							}
						}}
						placeholder="e.g. ze/zir"
						style={{ ...sel, width: 120 }}
					/>
					<button
						onClick={commitNew}
						style={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							padding: "0 8px",
							background: "var(--color-primary)",
							color: "#fff",
							border: "none",
							borderRadius: "var(--radius-sm)",
							cursor: "pointer",
							fontSize: "var(--font-size-sm)",
							height: "22px",
						}}
					>
						Add
					</button>
					<button
						onClick={() => {
							setAdding(false);
							setNewText("");
						}}
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
				</div>
			)}
		</div>
	);
}
