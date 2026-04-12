// renderer/src/components/CategoryInput.jsx
// Props:
//   value: number | null
//   categories: { CategoryID, CategoryName }[]
//   onChange: (id: number | null) => void
//   onNewCategory: (name: string) => Promise<number>
import { useState } from "react";

const sel = {
	padding: "4px 6px",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-sm)",
	background: "var(--color-surface-2)",
	color: "var(--color-text)",
	width: "100%",
};

export default function CategoryInput({ value, categories, onChange, onNewCategory }) {
	const [adding, setAdding] = useState(false);
	const [newName, setNewName] = useState("");

	const handleSelect = (e) => {
		const v = e.target.value;
		if (v === "__new__") {
			setAdding(true);
			return;
		}
		onChange(v ? Number(v) : null);
	};

	const commitNew = async () => {
		const trimmed = newName.trim();
		if (!trimmed) {
			setAdding(false);
			return;
		}
		const id = await onNewCategory(trimmed);
		onChange(id);
		setNewName("");
		setAdding(false);
	};

	if (adding)
		return (
			<div style={{ display: "flex", gap: 6 }}>
				<input
					autoFocus
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") commitNew();
						if (e.key === "Escape") {
							setAdding(false);
							setNewName("");
						}
					}}
					placeholder="New category name"
					style={{ ...sel, flex: 1 }}
				/>
				<button onClick={commitNew} style={{ padding: "3px 10px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
					Add
				</button>
				<button
					onClick={() => {
						setAdding(false);
						setNewName("");
					}}
					style={{
						padding: "3px 6px",
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
		);

	return (
		<select value={value || ""} onChange={handleSelect} style={sel}>
			<option value="">— none —</option>
			{categories.map((c) => (
				<option key={c.CategoryID} value={c.CategoryID}>
					{c.CategoryName}
				</option>
			))}
			<option value="__new__">+ Add new category…</option>
		</select>
	);
}
