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
		// Premium backdrop masking with layout blur filtering
		<div
			onClick={onClose}
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(3, 4, 7, 0.75)",
				backdropFilter: "blur(4px)",
				webkitBackdropFilter: "blur(4px)",
				zIndex: 1000,
				display: "flex",
				alignItems: "flex-start",
				justifyContent: "center",
				paddingTop: 100,
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "var(--color-surface, #11131c)",
					border: "1px solid var(--color-border-2, rgba(255, 255, 255, 0.08))",
					borderRadius: "var(--radius-lg, 12px)",
					boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
					width: 500, // Widened slightly to give multi-keyword queries breathing room
					maxHeight: "65vh",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					animation: "modalAppear 0.16s cubic-bezier(0.16, 1, 0.3, 1)",
				}}
			>
				{/* Search Master Input Header Box */}
				<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", display: "flex", gap: 12, alignItems: "center", background: "rgba(0, 0, 0, 0.1)" }}>
					<i className="fa-solid fa-magnifying-glass" style={{ color: "var(--color-text-muted)", fontSize: "14px" }}></i>
					<input
						ref={inputRef}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleKey}
						placeholder="Search profiles by name, nickname, or tag..."
						style={{
							flex: 1,
							border: "none",
							outline: "none",
							fontSize: "14px",
							background: "transparent",
							color: "var(--color-text)",
							fontWeight: "400",
						}}
					/>
					<span
						style={{
							fontSize: "11px",
							color: "var(--color-text-faint)",
							fontFamily: "var(--font-mono)",
							background: "rgba(255,255,255,0.03)",
							padding: "2px 6px",
							borderRadius: "3px",
							border: "1px solid var(--color-border)",
						}}
					>
						ESC
					</span>
				</div>

				{/* Dynamic Content Mapping Stream */}
				<div style={{ overflowY: "auto", background: "rgba(0, 0, 0, 0.05)", padding: results.length > 0 ? "6px 0" : 0 }}>
					{results.length === 0 && query.trim() && (
						<div style={{ padding: "18px", color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "13px", textAlign: "center", fontFamily: "var(--font-mono)" }}>
							no matching records for "{query}"
						</div>
					)}

					{results.map((p, i) => {
						const isActiveRow = i === active;
						return (
							<div
								key={p.PersonID}
								onClick={() => onSelect(p.PersonID)}
								onMouseEnter={() => setActive(i)}
								style={{
									padding: "10px 18px",
									cursor: "pointer",
									display: "flex",
									gap: 8,
									alignItems: "center",
									background: isActiveRow ? "var(--color-primary)" : "transparent",
									color: isActiveRow ? "#fff" : "var(--color-text)",
									transition: "background 0.05s, color 0.05s",
								}}
							>
								<i className="fa-solid fa-user" style={{ fontSize: "12px", marginRight: 2, opacity: isActiveRow ? 0.8 : 0.4, color: isActiveRow ? "#fff" : "var(--color-text)" }}></i>
								<span style={{ fontWeight: "600", fontSize: "14px" }}>{p.FullName}</span>

								{/* Fixed Nickname color: Shifts to soft light grey instead of white/blue when active */}
								{p.Nickname && (
									<span
										style={{
											fontSize: "13px",
											color: isActiveRow ? "rgba(255, 255, 255, 0.6)" : "var(--color-text-muted)",
										}}
									>
										({p.Nickname})
									</span>
								)}

								{/* Fixed Category Tag color: Clear, structured grey background with crisp muted labels */}
								{p.CategoryName && (
									<span
										style={{
											fontSize: "11px",
											fontWeight: "600",
											marginLeft: "auto",
											padding: "1px 6px",
											borderRadius: "var(--radius-sm, 4px)",
											// Using balanced opaque grey layers for the text/border lines when highlighted
											background: isActiveRow ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.03)",
											color: isActiveRow ? "rgba(255, 255, 255, 0.75)" : p.CategoryColor || "var(--color-text-muted)",
											border: `1px solid ${isActiveRow ? "rgba(255, 255, 255, 0.15)" : p.CategoryColor ? `${p.CategoryColor}33` : "var(--color-border)"}`,
										}}
									>
										{p.CategoryName}
									</span>
								)}
							</div>
						);
					})}
				</div>

				{/* Micro-Help System Navigation Footer */}
				{/* Micro-Help System Navigation Footer */}
				<div
					style={{
						padding: "10px 18px",
						borderTop: "1px solid var(--color-border)",
						fontSize: "11px",
						color: "rgba(255, 255, 255, 0.35)",
						display: "flex",
						gap: 16,
						background: "rgba(0, 0, 0, 0.1)",
						fontFamily: "var(--font-mono)",
						alignItems: "center",
					}}
				>
					{/* Navigation Hint */}
					<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
						<i className="fa-solid fa-arrows-up-down" style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "10px" }}></i>
						<span>navigate</span>
					</div>

					{/* Selection Hint */}
					<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
						<i className="fa-solid fa-arrow-turn-down" style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "10px", transform: "scaleX(-1) rotate(90deg)" }}></i>
						<span>select</span>
					</div>

					{/* Indexing Map Suffix */}
					<div style={{ marginLeft: "auto", color: "rgba(255, 255, 255, 0.3)" }}>indexing filters: name · nick · labels</div>
				</div>
			</div>
		</div>
	);
}
