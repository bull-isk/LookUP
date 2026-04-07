// renderer/src/components/SearchPopup.jsx
import { useState, useEffect, useRef } from "react";

export default function SearchPopup({ onSelect, onClose }) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState([]);
	const [active, setActive] = useState(0);
	const inputRef = useRef(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			return;
		}
		const t = setTimeout(() => {
			window.electronAPI.personSearch(query).then((r) => {
				setResults(r);
				setActive(0);
			});
		}, 120);
		return () => clearTimeout(t);
	}, [query]);

	const handleKey = (e) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActive((a) => Math.min(a + 1, results.length - 1));
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			setActive((a) => Math.max(a - 1, 0));
		}
		if (e.key === "Enter" && results[active]) onSelect(results[active].PersonID);
		if (e.key === "Escape") onClose();
	};

	return (
		// Full-screen overlay — click backdrop to close
		<div
			onClick={onClose}
			style={{ position: "fixed", inset: 0, background: "var(--overlay-bg)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "var(--bg-primary)",
					border: "1px solid var(--border-primary)",
					width: 480,
					maxHeight: 400,
					display: "flex",
					flexDirection: "column",
					borderRadius: "var(--radius-md)",
				}}
			>
				{/* Search input */}
				<div style={{ padding: 10, borderBottom: "1px solid var(--border-secondary)", display: "flex", gap: 8, alignItems: "center" }}>
					<span style={{ color: "var(--text-muted)" }}>🔍</span>
					<input
						ref={inputRef}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleKey}
						placeholder="Search by name, nickname, or tag…"
						style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "var(--text-primary)" }}
					/>
					<span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>Esc to close</span>
				</div>

				{/* Results */}
				<div style={{ overflowY: "auto" }}>
					{results.length === 0 && query.trim() && <div style={{ padding: "12px 14px", color: "var(--text-muted)", fontStyle: "italic" }}>No results for "{query}"</div>}
					{results.map((p, i) => (
						<div
							key={p.PersonID}
							onClick={() => onSelect(p.PersonID)}
							style={{
								padding: "8px 14px",
								cursor: "pointer",
								display: "flex",
								gap: 8,
								alignItems: "baseline",
								background: i === active ? "var(--bg-active)" : "transparent",
								color: i === active ? "var(--text-on-active)" : "var(--text-primary)",
							}}
						>
							<span style={{ fontWeight: "bold" }}>{p.FullName}</span>
							{p.Nickname && <span style={{ fontSize: "var(--font-size-sm)", opacity: 0.75 }}>({p.Nickname})</span>}
							{p.CategoryName && (
								<span
									style={{
										fontSize: "var(--font-size-xs)",
										marginLeft: "auto",
										opacity: i === active ? 0.85 : 1,
										color: i === active ? "var(--text-on-active)" : "var(--text-muted)",
									}}
								>
									{p.CategoryName}
								</span>
							)}
						</div>
					))}
				</div>

				<div style={{ padding: "6px 14px", borderTop: "1px solid var(--border-faint)", fontSize: "var(--font-size-xs)", color: "var(--text-muted)", display: "flex", gap: 12 }}>
					<span>↑↓ navigate</span>
					<span>Enter select</span>
					<span>Searches name · nickname · tag</span>
				</div>
			</div>
		</div>
	);
}
