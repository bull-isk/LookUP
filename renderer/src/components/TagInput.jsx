// renderer/src/components/TagInput.jsx
import { useState } from "react";
import Chip from "./Chip";

export default function TagInput({ value = [], onChange, allTags = [], onTagClick }) {
	const [rowHovered, setRowHovered] = useState(false);
	const [addingOpen, setAddingOpen] = useState(false);
	const [addInput, setAddInput] = useState("");
	const [editingTag, setEditingTag] = useState(null);
	const [editDraft, setEditDraft] = useState("");

	const suggestions = allTags.filter((t) => t.toLowerCase().includes(addInput.toLowerCase()) && !value.map((v) => v.toLowerCase()).includes(t.toLowerCase()) && addInput.trim().length > 0);

	const commitAdd = () => {
		const trimmed = addInput.trim();
		if (!trimmed) {
			setAddingOpen(false);
			return;
		}
		if (!value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
			onChange([...value, trimmed]);
		}
		setAddInput("");
		setAddingOpen(false);
	};

	const commitEdit = (oldName) => {
		const trimmed = editDraft.trim();
		if (!trimmed || trimmed.toLowerCase() === oldName.toLowerCase()) {
			setEditingTag(null);
			return;
		}
		onChange(value.map((v) => (v === oldName ? trimmed : v)));
		setEditingTag(null);
	};

	const deleteTag = (name) => onChange(value.filter((v) => v !== name));

	return (
		<div
			onMouseEnter={() => setRowHovered(true)}
			onMouseLeave={() => setRowHovered(false)}
			style={{ display: "flex", flexWrap: "wrap", alignItems: "center", minHeight: 28, position: "relative" }}
		>
			{value.length === 0 && !addingOpen && <span style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>No tags</span>}

			{value.map((tag) =>
				editingTag === tag ? (
					<Chip key={tag} editing editValue={editDraft} onEditChange={setEditDraft} onEditCommit={() => commitEdit(tag)} onEditCancel={() => setEditingTag(null)} />
				) : (
					<Chip
						key={tag}
						label={tag}
						// Tag chip click → navigate to tag drill-down page
						onClick={onTagClick ? () => onTagClick(tag) : undefined}
						onEdit={() => {
							setEditDraft(tag);
							setEditingTag(tag);
						}}
						onDelete={() => deleteTag(tag)}
					/>
				),
			)}

			{/* Inline add */}
			{addingOpen ? (
				<span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
					<input
						autoFocus
						value={addInput}
						onChange={(e) => setAddInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") commitAdd();
							if (e.key === "Escape") {
								setAddingOpen(false);
								setAddInput("");
							}
						}}
						onBlur={() =>
							setTimeout(() => {
								setAddingOpen(false);
								setAddInput("");
							}, 150)
						}
						placeholder="tag name…"
						style={{
							padding: "2px 6px",
							border: "1px solid var(--color-accent)",
							borderRadius: "var(--radius-sm)",
							background: "var(--color-surface-2)",
							color: "var(--color-text)",
							fontSize: "var(--font-size-sm)",
							width: 100,
						}}
					/>
					{suggestions.length > 0 && (
						<div
							style={{
								position: "absolute",
								top: "100%",
								left: 0,
								zIndex: 50,
								minWidth: 120,
								background: "var(--color-surface)",
								border: "1px solid var(--color-border)",
								borderRadius: "var(--radius-sm)",
								marginTop: 2,
								overflow: "hidden",
							}}
						>
							{suggestions.slice(0, 6).map((s) => (
								<div
									key={s}
									onMouseDown={() => {
										onChange([...value, s]);
										setAddInput("");
										setAddingOpen(false);
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
				</span>
			) : (
				rowHovered && <Chip addChip onAdd={() => setAddingOpen(true)} />
			)}
		</div>
	);
}
