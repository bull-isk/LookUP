// renderer/src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import { computeBirthday, formatBirthdayLine } from "../utils/birthday";

// bridge functions used on this page
const api = window.electronAPI;

const S = {
	h2: { marginTop: 0, marginBottom: 4, fontSize: 15 },
	section: { marginBottom: 28 },
	sub: { color: "#666", fontSize: 11, marginBottom: 8 },
	card: { display: "flex", alignItems: "baseline", gap: 8, padding: "5px 0", borderBottom: "1px solid #eee", cursor: "pointer" },
	name: { color: "#e8ecff", fontWeight: "bold" },
	nick: { color: "#777", fontSize: 11 },
	meta: { color: "#555", fontSize: 11, marginLeft: "auto" },
	cat: (color) => ({
		fontSize: 10,
		padding: "1px 5px",
		borderRadius: 3,
		background: color || "#ddd",
		color: "#d6dcff",
	}),
	empty: { color: "#aaa", fontStyle: "italic", fontSize: 12 },
};

function PersonRow({ person, meta, onOpenPerson }) {
	return (
		<div style={S.card} onClick={() => onOpenPerson(person.PersonID)}>
			{person.CategoryColor && <span style={S.cat(person.CategoryColor + "44")}>{person.CategoryName}</span>}
			<span style={S.name}>{person.FullName}</span>
			{person.Nickname && <span style={S.nick}>({person.Nickname})</span>}
			{meta && <span style={S.meta}>{meta}</span>}
		</div>
	);
}

export default function HomePage({ onOpenPerson }) {
	const [birthdays, setBirthdays] = useState([]);
	const [recent, setRecent] = useState([]);
	const [favorites, setFavorites] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([api.personBirthdays(), api.personRecentlyUpdated(5), api.personFavorites(5)]).then(([bdays, rec, favs]) => {
			// Enrich with computed birthday data, sort by proximity, take top 5
			const enriched = bdays
				.map((p) => ({ ...p, _bday: computeBirthday(p.Birthdate) }))
				.filter((p) => p._bday)
				.sort((a, b) => a._bday.daysUntilNext - b._bday.daysUntilNext)
				.slice(0, 5);

			setBirthdays(enriched);
			setRecent(rec);
			setFavorites(favs);
			setLoading(false);
		});
	}, []);

	if (loading) return <div>Loading...</div>;

	return (
		<div>
			<h2 style={{ marginTop: 0 }}>Home</h2>

			{/* ── Upcoming Birthdays ─────────────────────────────── */}
			<div style={S.section}>
				<h3 style={S.h2}>🎂 Upcoming Birthdays</h3>
				<div style={S.sub}>Next 5 closest birthdays</div>
				{birthdays.length === 0 && <div style={S.empty}>No birthdays recorded. Add a birthdate to a person.</div>}
				{birthdays.map((p) => (
					<PersonRow key={p.PersonID} person={p} meta={formatBirthdayLine(p._bday)} onOpenPerson={onOpenPerson} />
				))}
			</div>

			{/* ── Recently Updated ───────────────────────────────── */}
			<div style={S.section}>
				<h3 style={S.h2}>🕐 Recently Updated</h3>
				<div style={S.sub}>Last 5 modified</div>
				{recent.length === 0 && <div style={S.empty}>No data yet.</div>}
				{recent.map((p) => (
					<PersonRow key={p.PersonID} person={p} meta={p.LastUpdated ? p.LastUpdated.replace("T", " ").slice(0, 16) : ""} onOpenPerson={onOpenPerson} />
				))}
			</div>

			{/* ── Favorites ──────────────────────────────────────── */}
			<div style={S.section}>
				<h3 style={S.h2}>⭐ Your Favorites</h3>
				<div style={S.sub}>Most filled-in profiles (by field count)</div>
				{favorites.length === 0 && <div style={S.empty}>Add people to see favorites.</div>}
				{favorites.map((p) => (
					<PersonRow key={p.PersonID} person={p} meta={`score: ${p.score}`} onOpenPerson={onOpenPerson} />
				))}
			</div>
		</div>
	);
}
