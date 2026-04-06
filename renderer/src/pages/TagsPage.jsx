// renderer/src/pages/TagsPage.jsx
import { useState, useEffect } from "react";

const api = window.electronAPI;

const S = {
	tagSection: {
		marginBottom: 24,
		paddingBottom: 12,
		borderBottom: "1px solid #2a2f4a",
	},

	tagHeader: {
		fontWeight: "bold",
		fontSize: 14,
		marginBottom: 8,
		display: "flex",
		alignItems: "center",
		gap: 8,
		color: "#e8ecff",
	},

	count: {
		fontSize: 11,
		color: "#7c84b6",
		fontWeight: "normal",
	},

	personRow: {
		display: "inline-flex",
		flexDirection: "column",
		margin: "0 8px 8px 0",
		padding: "5px 10px",
		border: "1px solid #3a3f63",
		borderRadius: 4,
		cursor: "pointer",
		background: "#1a1d2e", // indigo surface
		minWidth: 80,
		verticalAlign: "top",
	},

	name: {
		fontWeight: "bold",
		fontSize: 13,
		color: "#e8ecff",
	},

	nick: {
		fontSize: 11,
		color: "#8f97c9",
	},

	cat: (color) => ({
		fontSize: 10,
		padding: "1px 4px",
		borderRadius: 2,
		marginTop: 2,
		background: color ? color + "55" : "#2a2f4a",
		display: "inline-block",
		color: "#d6dcff",
	}),

	empty: {
		color: "#6b729c",
		fontStyle: "italic",
		fontSize: 12,
	},

	untagged: {
		marginTop: 20,
		paddingTop: 12,
		borderTop: "1px dashed #3a3f63",
		color: "#7c84b6",
		fontSize: 12,
	},
};

function PersonChip({ person, onOpenPerson }) {
	return (
		<div style={S.personRow} onClick={() => onOpenPerson(person.PersonID)}>
			<span style={S.name}>{person.FullName}</span>
			{person.Nickname && <span style={S.nick}>{person.Nickname}</span>}
			{person.CategoryName && <span style={S.cat(person.CategoryColor)}>{person.CategoryName}</span>}
		</div>
	);
}

export default function TagsPage({ onOpenPerson }) {
	const [tagGroups, setTagGroups] = useState(null);
	const [untaggedCount, setUntaggedCount] = useState(0);

	useEffect(() => {
		Promise.all([api.personByTag(), api.personList()]).then(([groups, allPersons]) => {
			setTagGroups(groups);

			// Compute untagged count
			const taggedIds = new Set(groups.flatMap((g) => g.people.map((p) => p.PersonID)));
			setUntaggedCount(allPersons.filter((p) => !taggedIds.has(p.PersonID)).length);
		});
	}, []);

	if (!tagGroups) return <div>Loading...</div>;

	return (
		<div>
			<h2 style={{ marginTop: 0 }}>Tags</h2>
			<div style={{ color: "#666", fontSize: 12, marginBottom: 16 }}>
				{tagGroups.length} tag{tagGroups.length !== 1 ? "s" : ""} in use.
				{untaggedCount > 0 && ` ${untaggedCount} person${untaggedCount !== 1 ? "s" : ""} have no tags.`}
			</div>

			{tagGroups.length === 0 && <div style={S.empty}>No tags assigned yet. Edit a person to add tags.</div>}

			{tagGroups.map((group) => (
				<div key={group.TagID} style={S.tagSection}>
					<div style={S.tagHeader}>
						🏷 {group.TagName}
						<span style={S.count}>
							{group.people.length} person{group.people.length !== 1 ? "s" : ""}
						</span>
					</div>
					<div>
						{group.people.map((p) => (
							<PersonChip key={p.PersonID} person={p} onOpenPerson={onOpenPerson} />
						))}
					</div>
				</div>
			))}

			{untaggedCount > 0 && (
				<div style={S.untagged}>
					{untaggedCount} person{untaggedCount !== 1 ? "s" : ""} not assigned to any tag. Use the Edit tab on each person to add tags.
				</div>
			)}
		</div>
	);
}
