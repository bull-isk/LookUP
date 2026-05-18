// renderer/src/pages/TagsPage.jsx
import { useState, useEffect } from "react";

const api = window.electronAPI;

const S = {
	headerContainer: {
		display: "flex",
		alignItems: "center",
		gap: 12,
		marginBottom: 20,
		flexWrap: "wrap",
	},

	backBtn: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "6px",
		border: "1px solid var(--color-border)",
		background: "rgba(255, 255, 255, 0.02)",
		color: "var(--color-text-muted)",
		padding: "5px 12px",
		borderRadius: "var(--radius-inner, 6px)",
		cursor: "pointer",
		fontSize: "13px",
		fontWeight: "500",
		transition: "var(--transition)",
	},

	titleText: {
		margin: 0,
		color: "var(--color-text)",
		fontSize: "22px",
		fontWeight: "700",
		display: "flex",
		alignItems: "center",
		gap: "8px",
	},

	subLabel: {
		color: "var(--color-text-muted)",
		fontSize: "13px",
	},

	listWrapper: {
		display: "flex",
		flexDirection: "column",
		gap: "6px",
		background: "rgba(255, 255, 255, 0.01)",
		border: "1px solid var(--color-border)",
		borderRadius: "var(--radius-md, 8px)",
		overflow: "hidden",
		padding: "4px 0",
	},

	row: {
		display: "flex",
		alignItems: "center",
		gap: 12,
		padding: "12px 16px",
		cursor: "pointer",
		background: "transparent",
		transition: "var(--transition)",
	},

	nameText: {
		fontWeight: "600",
		color: "var(--color-text)",
		fontSize: "13px",
	},

	metaText: {
		color: "var(--color-text-muted)",
		fontSize: "13px",
		fontFamily: "var(--font-mono)",
	},

	stampText: {
		marginLeft: "auto",
		color: "var(--color-text-faint)",
		fontSize: "13px",
		fontFamily: "var(--font-mono)",
	},

	catBadge: (color) => ({
		fontSize: "11px",
		fontWeight: "600",
		padding: "2px 8px",
		borderRadius: "var(--radius-sm, 4px)",
		background: color ? `${color}15` : "var(--color-surface-3)",
		color: color || "var(--color-text-muted)",
		border: `1px solid ${color ? `${color}30` : "transparent"}`,
	}),

	emptyState: {
		color: "var(--color-text-faint)",
		fontStyle: "italic",
		fontSize: "13px",
		padding: "20px",
		textAlign: "center",
	},
};

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

	useEffect(() => {
		if (!initialTagName || loading || tags.length === 0) return;
		const match = tags.find((t) => t.TagName.toLowerCase() === initialTagName.toLowerCase());
		if (match) {
			setSelectedTag(match);
			api.lookupPersonsByTag(match.TagID).then(setPersons);
			onTagOpened?.();
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

	if (loading) return <div style={{ color: "var(--color-text-faint)", fontSize: "13px", padding: 20 }}>Loading tag registry...</div>;

	// ── Drill-down view ───────────────────────────────────────────
	if (selectedTag) {
		return (
			<div style={{ padding: "4px 8px" }}>
				<div style={S.headerContainer}>
					<button
						onClick={back}
						style={S.backBtn}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
							e.currentTarget.style.color = "var(--color-text)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
							e.currentTarget.style.color = "var(--color-text-muted)";
						}}
					>
						<i className="fa-solid fa-arrow-left" style={{ fontSize: "11px" }}></i> Back
					</button>
					<h2 style={S.titleText}>
						<i className="fa-solid fa-tag" style={{ color: "var(--color-accent)", fontSize: "16px" }}></i>
						{selectedTag.TagName}
					</h2>
					<span style={S.subLabel}>
						· {persons.length} profile{persons.length !== 1 ? "s" : ""} sorted by update activity
					</span>
				</div>

				<div style={S.listWrapper}>
					{persons.length === 0 ? (
						<div style={S.emptyState}>No people mapped to this tag.</div>
					) : (
						persons.map((p) => (
							<div
								key={p.PersonID}
								onClick={() => onOpenPerson(p.PersonID)}
								style={S.row}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = "var(--color-card-hover || rgba(255, 255, 255, 0.02))";
									e.currentTarget.style.paddingLeft = "22px";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = "transparent";
									e.currentTarget.style.paddingLeft = "16px";
								}}
							>
								{p.CategoryName && <span style={S.catBadge(p.CategoryColor)}>{p.CategoryName}</span>}
								<span style={S.nameText}>{p.FullName}</span>
								{p.Nickname && <span style={S.metaText}>({p.Nickname})</span>}
								{p.LastUpdated && (
									<span style={S.stampText}>
										<i className="fa-regular fa-clock" style={{ fontSize: "11px", marginRight: "4px", opacity: 0.6 }}></i>
										{p.LastUpdated.slice(0, 10)}
									</span>
								)}
							</div>
						))
					)}
				</div>
			</div>
		);
	}

	// ── Tag list view ─────────────────────────────────────────────
	return (
		<div style={{ padding: "4px 8px" }}>
			<h2 style={{ ...S.titleText, fontSize: "22px", marginBottom: 4 }}>Tags</h2>
			<div style={{ ...S.subLabel, marginBottom: 20 }}>Currently tracking {tags.length} active tag indices. Click to view assigned profiles.</div>

			<div style={S.listWrapper}>
				{tags.length === 0 ? (
					<div style={S.emptyState}>No tags initialized. Mapped tags will compile here automatically.</div>
				) : (
					tags.map((tag) => (
						<div
							key={tag.TagID}
							onClick={() => openTag(tag)}
							style={S.row}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = "var(--color-card-hover || rgba(255, 255, 255, 0.02))";
								e.currentTarget.style.paddingLeft = "22px";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = "transparent";
								e.currentTarget.style.paddingLeft = "16px";
							}}
						>
							<span style={{ ...S.nameText, display: "flex", alignItems: "center", gap: "8px" }}>
								<i className="fa-solid fa-tag" style={{ color: "var(--color-text-faint)", fontSize: "12px" }}></i>
								{tag.TagName}
							</span>
							<span style={S.metaText}>
								· {tag.personCount} profile{tag.personCount !== 1 ? "s" : ""}
							</span>
							<span style={S.stampText}>
								<i className="fa-solid fa-chevron-right" style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}></i>
							</span>
						</div>
					))
				)}
			</div>
		</div>
	);
}
