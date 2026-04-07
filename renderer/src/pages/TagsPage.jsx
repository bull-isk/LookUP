// renderer/src/pages/TagsPage.jsx
import { useState, useEffect } from "react";

const api = window.electronAPI;

export default function TagsPage({ onOpenPerson }) {
	const [tags, setTags] = useState([]); // [{ TagID, TagName, personCount }]
	const [selectedTag, setSelectedTag] = useState(null); // { TagID, TagName }
	const [persons, setPersons] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api.lookupTagsWithCounts().then((t) => {
			setTags(t);
			setLoading(false);
		});
	}, []);

	const openTag = (tag) => {
		setSelectedTag(tag);
		api.lookupPersonsByTag(tag.TagID).then(setPersons);
	};

	const back = () => {
		setSelectedTag(null);
		setPersons([]);
	};

	if (loading) return <div style={{ color: "var(--text-muted)" }}>Loading…</div>;

	// ── Tag list view ─────────────────────────────────────────────
	if (!selectedTag) {
		return (
			<div>
				<h2 style={{ marginTop: 0 }}>Tags</h2>
				<div style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", marginBottom: 16 }}>
					{tags.length} tag{tags.length !== 1 ? "s" : ""} in use. Click a tag to see its people.
				</div>

				{tags.length === 0 && <div style={{ color: "var(--text-faint)", fontStyle: "italic" }}>No tags assigned yet. Edit a person to add tags.</div>}

				{tags.map((tag) => (
					<div
						key={tag.TagID}
						onClick={() => openTag(tag)}
						style={{
							padding: "8px 12px",
							marginBottom: 4,
							cursor: "pointer",
							borderRadius: "var(--radius-md)",
							border: "1px solid var(--border-secondary)",
							background: "var(--bg-secondary)",
							display: "flex",
							alignItems: "center",
							gap: 10,
						}}
						onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
						onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
					>
						<span style={{ fontWeight: "bold" }}>🏷 {tag.TagName}</span>
						<span style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>
							{tag.personCount} person{tag.personCount !== 1 ? "s" : ""}
						</span>
						<span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: "var(--font-size-xs)" }}>→</span>
					</div>
				))}
			</div>
		);
	}

	// ── Single tag drill-down view ─────────────────────────────────
	return (
		<div>
			<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
				<button onClick={back} style={{ border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", padding: "3px 8px", borderRadius: "var(--radius-sm)" }}>
					← Back
				</button>
				<h2 style={{ margin: 0 }}>🏷 {selectedTag.TagName}</h2>
				<span style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>
					{persons.length} person{persons.length !== 1 ? "s" : ""} · sorted by recently updated
				</span>
			</div>

			{persons.length === 0 && <div style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No people with this tag.</div>}

			{persons.map((p) => (
				<div
					key={p.PersonID}
					onClick={() => onOpenPerson(p.PersonID)}
					style={{
						padding: "8px 12px",
						marginBottom: 4,
						cursor: "pointer",
						borderRadius: "var(--radius-md)",
						border: "1px solid var(--border-secondary)",
						background: "var(--bg-secondary)",
						display: "flex",
						alignItems: "baseline",
						gap: 8,
					}}
					onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
					onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
				>
					{p.CategoryColor && (
						<span style={{ fontSize: "var(--font-size-xs)", padding: "1px 5px", borderRadius: "var(--radius-sm)", background: p.CategoryColor + "33" }}>{p.CategoryName}</span>
					)}
					<span style={{ fontWeight: "bold" }}>{p.FullName}</span>
					{p.Nickname && <span style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>({p.Nickname})</span>}
					{p.LastUpdated && <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: "var(--font-size-xs)" }}>{p.LastUpdated.slice(0, 10)}</span>}
				</div>
			))}
		</div>
	);
}
