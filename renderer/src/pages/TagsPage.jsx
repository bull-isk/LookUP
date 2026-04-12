// renderer/src/pages/TagsPage.jsx
import { useState, useEffect } from "react";

const api = window.electronAPI;

export default function TagsPage({ onOpenPerson, initialTagName, onTagOpened }) {
	const [tags, setTags] = useState([]);
	const [selectedTag, setSelectedTag] = useState(null);
	const [persons, setPersons] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api.lookupTagsWithCounts().then((t) => {
			setTags(t);
			setLoading(false);
		});
	}, []);

	// When tags load and we have an initialTagName, open that tag immediately
	useEffect(() => {
		if (!initialTagName || loading || tags.length === 0) return;
		const match = tags.find((t) => t.TagName.toLowerCase() === initialTagName.toLowerCase());
		if (match) {
			setSelectedTag(match);
			api.lookupPersonsByTag(match.TagID).then(setPersons);
			onTagOpened?.(); // clear initialTagName in App so navigating back works
		}
	}, [initialTagName, loading, tags]);

	const openTag = (tag) => {
		setSelectedTag(tag);
		api.lookupPersonsByTag(tag.TagID).then(setPersons);
	};

	const back = () => {
		setSelectedTag(null);
		setPersons([]);
	};

	if (loading) return <div style={{ color: "var(--color-text-muted)", padding: 20 }}>Loading…</div>;

	// ── Drill-down view ───────────────────────────────────────────
	if (selectedTag) {
		return (
			<div>
				<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
					<button
						onClick={back}
						style={{
							border: "1px solid var(--color-border)",
							background: "var(--color-surface-2)",
							color: "var(--color-text)",
							padding: "3px 8px",
							borderRadius: "var(--radius-sm)",
							cursor: "pointer",
						}}
					>
						← Back
					</button>
					<h2 style={{ margin: 0, color: "var(--color-text)" }}>🏷 {selectedTag.TagName}</h2>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
						{persons.length} person{persons.length !== 1 ? "s" : ""} · sorted by recently updated
					</span>
				</div>

				{persons.length === 0 && <div style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>No people with this tag.</div>}

				{persons.map((p) => (
					<div
						key={p.PersonID}
						onClick={() => onOpenPerson(p.PersonID)}
						style={{
							padding: "8px 12px",
							marginBottom: 4,
							cursor: "pointer",
							borderRadius: "var(--radius-md)",
							border: "1px solid var(--color-border)",
							background: "var(--color-surface-2)",
							display: "flex",
							alignItems: "baseline",
							gap: 8,
						}}
						onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
						onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
					>
						{p.CategoryColor && (
							<span style={{ fontSize: "var(--font-size-xs)", padding: "1px 5px", borderRadius: "var(--radius-sm)", background: p.CategoryColor + "33", color: "var(--color-text)" }}>
								{p.CategoryName}
							</span>
						)}
						<span style={{ fontWeight: "bold", color: "var(--color-text)" }}>{p.FullName}</span>
						{p.Nickname && <span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>({p.Nickname})</span>}
						{p.LastUpdated && <span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>{p.LastUpdated.slice(0, 10)}</span>}
					</div>
				))}
			</div>
		);
	}

	// ── Tag list view ─────────────────────────────────────────────
	return (
		<div>
			<h2 style={{ marginTop: 0, color: "var(--color-text)" }}>Tags</h2>
			<div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", marginBottom: 16 }}>
				{tags.length} tag{tags.length !== 1 ? "s" : ""} in use. Click to see people.
			</div>

			{tags.length === 0 && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic" }}>No tags yet. Add tags to people first.</div>}

			{tags.map((tag) => (
				<div
					key={tag.TagID}
					onClick={() => openTag(tag)}
					style={{
						padding: "8px 12px",
						marginBottom: 4,
						cursor: "pointer",
						borderRadius: "var(--radius-md)",
						border: "1px solid var(--color-border)",
						background: "var(--color-surface-2)",
						display: "flex",
						alignItems: "center",
						gap: 10,
					}}
					onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
					onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
				>
					<span style={{ fontWeight: "bold", color: "var(--color-text)" }}>🏷 {tag.TagName}</span>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
						{tag.personCount} person{tag.personCount !== 1 ? "s" : ""}
					</span>
					<span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>→</span>
				</div>
			))}
		</div>
	);
}
