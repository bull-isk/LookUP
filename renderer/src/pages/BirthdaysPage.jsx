// renderer/src/pages/BirthdaysPage.jsx
import { useState, useEffect } from "react";
import { computeBirthday, groupByProximity, formatBirthdayLine } from "../utils/birthday";

const api = window.electronAPI;

const S = {
	groupBlock: {
		marginBottom: 20,
		background: "rgba(255, 255, 255, 0.02)",
		border: "1px solid var(--color-border)",
		borderRadius: "var(--radius-md, 8px)",
		overflow: "hidden",
		boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
	},

	groupHeader: (color) => ({
		display: "flex",
		alignItems: "center",
		gap: 8,
		fontWeight: "600",
		fontSize: "13px",
		background: "rgba(255, 255, 255, 0.02)",
		color: "var(--color-text)",
		padding: "12px 16px",
		borderBottom: "1px solid var(--color-border)",
	}),

	iconIndicator: (color) => ({
		color: color || "var(--color-primary)",
		fontSize: "13px",
	}),

	rowContainer: {
		display: "flex",
		flexDirection: "column",
	},

	row: {
		display: "flex",
		alignItems: "center",
		gap: 12,
		padding: "12px 16px",
		borderBottom: "1px solid var(--color-border)",
		cursor: "pointer",
		transition: "var(--transition)",
	},

	name: {
		fontWeight: "600",
		color: "var(--color-text)",
		fontSize: "13px",
	},

	nick: {
		color: "var(--color-text-muted)",
		fontSize: "13px",
	},

	date: {
		color: "var(--color-text-faint)",
		fontSize: "13px",
		marginLeft: 2,
	},

	meta: {
		marginLeft: "auto",
		fontSize: "13px",
		color: "var(--color-text-muted)",
	},

	cat: (color) => ({
		fontSize: "11px",
		fontWeight: "600",
		padding: "2px 8px",
		borderRadius: "var(--radius-sm, 4px)",
		background: color ? `${color}15` : "var(--color-surface-3)",
		color: color || "var(--color-text-muted)",
		border: `1px solid ${color ? `${color}30` : "transparent"}`,
	}),

	empty: {
		color: "var(--color-text-faint)",
		fontStyle: "italic",
		fontSize: "13px",
		padding: "16px",
	},
};

function BirthdayRow({ person, onOpenPerson }) {
	const line = formatBirthdayLine(person._bday);

	// Formatting helper to show human-readable dates instead of a code line
	const formatLabelDate = (rawDate) => {
		if (!rawDate) return "";
		const parts = rawDate.split("-");
		if (parts.length !== 3) return rawDate;
		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		const monthIndex = parseInt(parts[1], 10) - 1;
		return `${parts[2]} ${months[monthIndex]}`;
	};

	return (
		<div
			style={S.row}
			onClick={() => onOpenPerson(person.PersonID)}
			onMouseEnter={(e) => {
				e.currentTarget.style.background = "var(--color-card-hover || rgba(255, 255, 255, 0.02))";
				e.currentTarget.style.paddingLeft = "20px";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.background = "transparent";
				e.currentTarget.style.paddingLeft = "16px";
			}}
		>
			{person.CategoryName && <span style={S.cat(person.CategoryColor)}>{person.CategoryName}</span>}
			<span style={S.name}>{person.FullName}</span>
			{person.Nickname && <span style={S.nick}>({person.Nickname})</span>}
			<span style={S.date}>· {formatLabelDate(person.Birthdate)}</span>
			<span style={S.meta}>{line}</span>
		</div>
	);
}

function Group({ label, iconClass, color, persons, onOpenPerson }) {
	return (
		<div style={S.groupBlock}>
			<div style={S.groupHeader(color)}>
				<i className={iconClass} style={S.iconIndicator(color)}></i>
				<span>{label}</span>
			</div>
			<div style={S.rowContainer}>
				{persons.length === 0 ? (
					<div style={S.empty}>No birthdays in this range.</div>
				) : (
					persons.map((p, idx, arr) => {
						// Dynamically drop the last row's border bottom to keep it neat inside the border-radius container
						const isLast = idx === arr.length - 1;
						return (
							<div key={p.PersonID} style={isLast ? { ...S.rowContainer, borderBottom: "none" } : null}>
								<BirthdayRow person={p} onOpenPerson={onOpenPerson} />
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}

export default function BirthdaysPage({ onOpenPerson }) {
	const [groups, setGroups] = useState(null);
	const [noBirthday, setNoBirthday] = useState(0);

	useEffect(() => {
		api.personBirthdays().then((persons) => {
			const withBday = persons.filter((p) => p.Birthdate);
			const without = persons.length - withBday.length;

			const enriched = withBday
				.map((p) => ({ ...p, _bday: computeBirthday(p.Birthdate) }))
				.filter((p) => p._bday)
				.sort((a, b) => a._bday.daysUntilNext - b._bday.daysUntilNext);

			setGroups(groupByProximity(enriched));
			setNoBirthday(without);
		});
	}, []);

	if (!groups) return <div style={{ color: "var(--color-text-muted)", fontSize: "13px", padding: 20 }}>Loading calendar records...</div>;

	const total = groups.today.length + groups.next7Days.length + groups.next14Days.length + Object.values(groups.months).flat().length;

	return (
		<div style={{ padding: "8px 4px" }}>
			<h2 style={{ marginTop: 0, marginBottom: 4, color: "var(--color-text)", fontSize: "22px", fontWeight: "700" }}>Birthdays</h2>
			<div style={{ color: "var(--color-text-muted)", fontSize: "13px", marginBottom: 24 }}>Track upcoming birthdays for {total} profiles.</div>

			<Group label="Today" iconClass="fa-solid fa-cake-candles" color="#ef4444" persons={groups.today} onOpenPerson={onOpenPerson} />

			<Group label="Next 7 Days" iconClass="fa-solid fa-calendar-day" color="var(--color-primary)" persons={groups.next7Days} onOpenPerson={onOpenPerson} />

			<Group label="In 2 Weeks" iconClass="fa-solid fa-calendar-week" color="var(--color-accent)" persons={groups.next14Days} onOpenPerson={onOpenPerson} />

			{Object.entries(groups.months).map(([month, persons]) => (
				<Group key={month} label={month} iconClass="fa-solid fa-calendar-days" color="var(--color-text-muted)" persons={persons} onOpenPerson={onOpenPerson} />
			))}
		</div>
	);
}
