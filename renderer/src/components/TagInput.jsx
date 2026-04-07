// renderer/src/components/TagInput.jsx
// Props:
//   value: string[]   — current tag names
//   onChange: (names: string[]) => void
//   allTags: string[] — all existing tag names for suggestions

import { useState, useRef } from "react";

export default function TagInput({ value = [], onChange, allTags = [] }) {
	const [input, setInput] = useState("");
	const [showSug, setShowSug] = useState(false);
	const inputRef = useRef(null);

	const suggestions = allTags.filter((t) => t.toLowerCase().includes(input.toLowerCase()) && !value.map((v) => v.toLowerCase()).includes(t.toLowerCase()) && input.trim().length > 0);

	const addTag = (name) => {
		const trimmed = name.trim();
		if (!trimmed) return;
		// Case-insensitive dedup against current value
		if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
			setInput("");
			return;
		}
		onChange([...value, trimmed]);
		setInput("");
		setShowSug(false);
		inputRef.current?.focus();
	};

	const removeTag = (name) => onChange(value.filter((v) => v !== name));

	const handleKey = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (suggestions.length > 0 && input.trim()) {
				// If input matches a suggestion exactly (case-insensitive), use that
				const exact = suggestions.find((s) => s.toLowerCase() === input.trim().toLowerCase());
				addTag(exact || input);
			} else {
				addTag(input);
			}
		}
		if (e.key === "Backspace" && !input && value.length > 0) {
			onChange(value.slice(0, -1));
		}
	};

	return (
		<div style={{ position: "relative" }}>
			{/* Tag chips + input inline */}
			<div
				onClick={() => inputRef.current?.focus()}
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: 4,
					alignItems: "center",
					padding: "4px 6px",
					minHeight: 30,
					border: "1px solid var(--color-border)",
					borderRadius: "var(--radius-sm)",
					background: "var(--color-surface-2)",
					cursor: "text",
				}}
			>
				{value.map((tag) => (
					<span
						key={tag}
						style={{
							background: "var(--color-active)",
							color: "var(--color-text-on-primary)",
							padding: "1px 6px",
							borderRadius: "var(--radius-sm)",
							fontSize: "var(--font-size-sm)",
							display: "flex",
							alignItems: "center",
							gap: 3,
						}}
					>
						{tag}
						<span
							onClick={(e) => {
								e.stopPropagation();
								removeTag(tag);
							}}
							style={{ cursor: "pointer", opacity: 0.7, fontSize: 10, lineHeight: 1 }}
						>
							×
						</span>
					</span>
				))}
				<input
					ref={inputRef}
					value={input}
					onChange={(e) => {
						setInput(e.target.value);
						setShowSug(true);
					}}
					onKeyDown={handleKey}
					onFocus={() => setShowSug(true)}
					onBlur={() => setTimeout(() => setShowSug(false), 150)}
					placeholder={value.length === 0 ? "Add tag…" : ""}
					style={{
						border: "none",
						outline: "none",
						background: "transparent",
						color: "var(--color-text)",
						flex: 1,
						minWidth: 80,
						padding: 0,
					}}
				/>
			</div>

			{/* Suggestions dropdown */}
			{showSug && suggestions.length > 0 && (
				<div
					style={{
						position: "absolute",
						top: "100%",
						left: 0,
						right: 0,
						zIndex: 100,
						background: "var(--color-surface)",
						border: "1px solid var(--color-border)",
						borderTop: "none",
						borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
						maxHeight: 140,
						overflowY: "auto",
					}}
				>
					{suggestions.map((s) => (
						<div
							key={s}
							onMouseDown={() => addTag(s)}
							style={{
								padding: "5px 10px",
								cursor: "pointer",
								fontSize: "var(--font-size-sm)",
								color: "var(--color-text)",
							}}
							onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
							onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
						>
							{s}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
