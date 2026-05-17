// renderer/src/pages/BirthdaysPage.jsx
import { useState, useEffect } from "react";
import { computeBirthday, groupByProximity, formatBirthdayLine } from "../utils/birthday";

const api = window.electronAPI;

const S = {
	groupLabel: (color) => ({
		fontWeight: "bold",
		fontSize: 12,
		textTransform: "uppercase",
		letterSpacing: 1,
		background: color || "var(--color-active)", // was: color || "#4f46e5"
		color: "var(--color-text-on-primary)", // was: "#fff"
		padding: "3px 8px",
		marginTop: 16,
		marginBottom: 6,
		display: "inline-block",
		borderRadius: 3,
	}),

	row: {
		display: "flex",
		alignItems: "baseline",
		gap: 8,
		padding: "6px 0",
		borderBottom: "var(--divider)", // was: "1px solid #2a2f4a"
		cursor: "pointer",
	},

	name: {
		fontWeight: "bold",
		color: "var(--color-text)", // was: "#e8ecff"
	},

	nick: {
		color: "var(--color-text-muted)", // was: "#8f97c9"
		fontSize: 11,
	},

	date: {
		color: "var(--color-text-faint)", // was: "#7c84b6"
		fontSize: 11,
	},

	meta: {
		marginLeft: "auto",
		fontSize: 12,
		color: "var(--color-text-muted)", // was: "#a5b0d6"
	},

	cat: (color) => ({
		fontSize: 10,
		padding: "1px 5px",
		borderRadius: 3,
		background: color ? color + "33" : "var(--color-surface-3)", // was: color+"55" : "#2a2f4a"
		color: "var(--color-text)", // was: "#d6dcff"
	}),

	empty: {
		color: "#6b729c",
		fontStyle: "italic",
		fontSize: 12,
		padding: "4px 0",
	},
};

function BirthdayRow({ person, onOpenPerson }) {
	const line = formatBirthdayLine(person._bday);
	return (
		<div style={S.row} onClick={() => onOpenPerson(person.PersonID)}>
			{person.CategoryColor && <span style={S.cat(person.CategoryColor)}>{person.CategoryName}</span>}
			<span style={S.name}>{person.FullName}</span>
			{person.Nickname && <span style={S.nick}>({person.Nickname})</span>}
			<span style={S.date}>{person.Birthdate}</span>
			<span style={S.meta}>{line}</span>
		</div>
	);
}

function Group({ label, color, persons, onOpenPerson }) {
	return (
		<div>
			<div style={S.groupLabel(color)}>{label}</div>
			{persons.length === 0 ? <div style={S.empty}>None</div> : persons.map((p) => <BirthdayRow key={p.PersonID} person={p} onOpenPerson={onOpenPerson} />)}
		</div>
	);
}

export default function BirthdaysPage({ onOpenPerson }) {
	const [groups, setGroups] = useState(null);
	const [noBirthday, setNoBirthday] = useState(0);

	useEffect(() => {
		api.personBirthdays().then((persons) => {
			const withBday = persons.filter((p) => p.Birthdate);
			const without = persons.length - withBday.length; // shouldn't happen given SQL WHERE, but safety

			const enriched = withBday
				.map((p) => ({ ...p, _bday: computeBirthday(p.Birthdate) }))
				.filter((p) => p._bday)
				.sort((a, b) => a._bday.daysUntilNext - b._bday.daysUntilNext);

			setGroups(groupByProximity(enriched));
			setNoBirthday(without);
		});
	}, []);

	if (!groups) return <div>Loading...</div>;

	const total = groups.today.length + groups.next7Days.length + groups.next14Days.length + Object.values(groups.months).flat().length;

	return (
		<div>
			<h2 style={{ marginTop: 0 }}>Birthdays</h2>
			<div style={{ color: "var(--color-text-faint)", fontSize: 12, marginBottom: 16 }}>
				{total} people with a recorded birthdate.
				{noBirthday > 0 && ` ${noBirthday} have no birthdate.`}
			</div>

			<Group label="🎂 Today" color="#ef4444" persons={groups.today} onOpenPerson={onOpenPerson} />

			<Group label="📅 Next 7 Days" color="#4f46e5" persons={groups.next7Days} onOpenPerson={onOpenPerson} />

			<Group label="🗓 In 2 Weeks" color="#6366f1" persons={groups.next14Days} onOpenPerson={onOpenPerson} />

			{Object.entries(groups.months).map(([month, persons]) => (
				<Group key={month} label={month} color="#2a2f4a" persons={persons} onOpenPerson={onOpenPerson} />
			))}
		</div>
	);
}
