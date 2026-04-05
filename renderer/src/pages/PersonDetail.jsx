import { useState, useEffect, useCallback } from "react";
import {
	personFull,
	personDelete,
	lookupAll,
	quoteCreate,
	quoteUpdate,
	quoteDelete,
	wmCreate,
	wmUpdate,
	wmDelete,
	noteCreate,
	noteUpdate,
	noteDelete,
	specificCreate,
	specificUpdate,
	specificDelete,
	eduCreate,
	eduUpdate,
	eduDelete,
	orgCreate,
	orgUpdate,
	orgDelete,
	socialCreate,
	socialDelete,
	mediaCreate,
	mediaLink,
	mediaUnlink,
} from "../api/bridge";

// ── tiny helpers ──────────────────────────────────────────────────
const s = { marginTop: 16, paddingTop: 8, borderTop: "1px solid #ddd" };
const row = { display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap" };
const inp = { padding: 4, flex: 1, minWidth: 80 };
const btn = (color = "#333") => ({ padding: "3px 8px", cursor: "pointer", background: color, color: "#fff", border: "none" });
const danger = btn("#cc0000");
const primary = btn("#0066cc");
const ghost = { padding: "3px 8px", cursor: "pointer" };

// ── inline add/edit form row ──────────────────────────────────────
function InlineForm({ fields, onSave, onCancel, initial = {} }) {
	const [vals, setVals] = useState(initial);
	const set = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.value }));
	return (
		<div style={{ ...row, background: "#f9f9f9", padding: 6 }}>
			{fields.map((f) => (
				<label key={f.key} style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 100 }}>
					<span style={{ fontSize: 11, color: "#666" }}>{f.label}</span>
					{f.options ? (
						<select style={inp} value={vals[f.key] || ""} onChange={set(f.key)}>
							<option value="">— select —</option>
							{f.options.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
					) : f.textarea ? (
						<textarea style={{ ...inp, height: 50 }} value={vals[f.key] || ""} onChange={set(f.key)} />
					) : (
						<input style={inp} type={f.type || "text"} value={vals[f.key] || ""} onChange={set(f.key)} />
					)}
				</label>
			))}
			<div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 16 }}>
				<button style={primary} onClick={() => onSave(vals)}>
					Save
				</button>
				<button style={ghost} onClick={onCancel}>
					Cancel
				</button>
			</div>
		</div>
	);
}

// ── Section wrapper ───────────────────────────────────────────────
function Section({ title, children, onAdd }) {
	return (
		<div style={s}>
			<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
				<strong>{title}</strong>
				{onAdd && (
					<button style={primary} onClick={onAdd}>
						+ Add
					</button>
				)}
			</div>
			{children}
		</div>
	);
}

// ── Main component ────────────────────────────────────────────────
export default function PersonDetail({ personId, onDeleted, onEdit }) {
	const [data, setData] = useState(null);
	const [lookups, setLookups] = useState(null);
	const [adding, setAdding] = useState(null); // which section is open for adding
	const [editing, setEditing] = useState(null); // { type, id }

	const reload = useCallback(() => {
		personFull(personId).then(setData);
	}, [personId]);

	useEffect(() => {
		reload();
		lookupAll().then(setLookups);
	}, [reload]);

	if (!data || !lookups) return <div>Loading...</div>;

	const { person, pronouns, tags, socialAccounts, eduHistory, orgHistory, notes, quotes, wordMouths, specifics, media } = data;

	const isAdding = (key) => adding === key;
	const isEditing = (type, id) => editing?.type === type && editing?.id === id;
	const stopAdding = () => setAdding(null);
	const stopEditing = () => setEditing(null);

	const handleDelete = async () => {
		if (!confirm(`Delete ${person.FullName}? This cannot be undone.`)) return;
		await personDelete(personId);
		onDeleted();
	};

	// ── SECTION: Quotes ───────────────────────────────────────────
	const quoteFields = [
		{ key: "Quote", label: "Quote", textarea: true },
		{ key: "Date", label: "Date", type: "date" },
	];

	// ── SECTION: WordMouth ────────────────────────────────────────
	const sayerOptions = lookups.persons.filter((p) => p.PersonID !== personId).map((p) => ({ value: p.PersonID, label: p.FullName }));

	const wmFields = [
		{ key: "Quote", label: "Quote", textarea: true },
		{ key: "Date", label: "Date", type: "date" },
		{ key: "SayerID", label: "Said by (optional)", options: sayerOptions },
	];

	// ── SECTION: Education ────────────────────────────────────────
	const eduFields = [
		{ key: "InstID", label: "Institution", options: lookups.institutions.map((i) => ({ value: i.InstID, label: i.InstitutionName })) },
		{ key: "EduLevelID", label: "Level", options: lookups.eduLevels.map((e) => ({ value: e.EduLevelID, label: e.LevelName })) },
		{ key: "FieldOfStudy", label: "Field of Study" },
		{ key: "StartYear", label: "Start Year", type: "number" },
		{ key: "EndYear", label: "End Year", type: "number" },
	];

	// ── SECTION: Org ──────────────────────────────────────────────
	const orgFields = [
		{ key: "OrgID", label: "Organization", options: lookups.orgs.map((o) => ({ value: o.OrgID, label: o.OrgName })) },
		{ key: "Division", label: "Division" },
		{ key: "StartYear", label: "Start Year", type: "number" },
		{ key: "EndYear", label: "End Year", type: "number" },
	];

	// ── SECTION: Social ───────────────────────────────────────────
	const socialFields = [
		{ key: "PlatformID", label: "Platform", options: lookups.platforms.map((p) => ({ value: p.PlatformID, label: p.PlatformName })) },
		{ key: "AccountTag", label: "Handle / URL" },
	];

	// ── SECTION: Specifics ────────────────────────────────────────
	const specificFields = [
		{ key: "PointID", label: "Point", options: lookups.specificsPts.map((p) => ({ value: p.PointID, label: `${p.SubName} → ${p.PointName}` })) },
		{ key: "SpecificNote", label: "Note", textarea: true },
	];

	// ── SECTION: Media ────────────────────────────────────────────
	const mediaFields = [
		{ key: "FilePath", label: "File Path" },
		{ key: "Date", label: "Date", type: "date" },
	];

	return (
		<div>
			{/* ── Header ─────────────────────────────────────────────── */}
			<div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
				<h2 style={{ margin: 0 }}>{person.FullName}</h2>
				{person.Nickname && <span style={{ color: "#666" }}>({person.Nickname})</span>}
				<button style={{ marginLeft: "auto", ...ghost }} onClick={onEdit}>
					✏ Edit
				</button>
				<button style={danger} onClick={handleDelete}>
					🗑 Delete
				</button>
			</div>

			{/* ── Core fields ────────────────────────────────────────── */}
			<table style={{ marginTop: 10, borderCollapse: "collapse", width: "100%" }}>
				<tbody>
					{[
						["Born", person.Birthdate],
						["Address", person.Address],
						["Timezone", person.TimezoneName],
						["Note", person.ImpressionNote],
					].map(([label, value]) =>
						value ? (
							<tr key={label}>
								<td style={{ padding: "3px 10px 3px 0", color: "#666", whiteSpace: "nowrap", verticalAlign: "top" }}>{label}</td>
								<td style={{ padding: "3px 0" }}>{value}</td>
							</tr>
						) : null,
					)}
				</tbody>
			</table>

			{/* Tags & Pronouns */}
			{pronouns.length > 0 && (
				<div style={{ marginTop: 6 }}>
					<strong>Pronouns:</strong> {pronouns.map((p) => p.Pronouns).join(", ")}
				</div>
			)}
			{tags.length > 0 && (
				<div style={{ marginTop: 4 }}>
					<strong>Tags:</strong> {tags.map((t) => t.TagName).join(", ")}
				</div>
			)}

			{/* ── Quotes ─────────────────────────────────────────────── */}
			<Section title="Quotes (by person)" onAdd={() => setAdding("quote")}>
				{isAdding("quote") && (
					<InlineForm
						fields={quoteFields}
						onSave={async (vals) => {
							await quoteCreate({ PersonID: personId, Quote: vals.Quote, Date: vals.Date || null });
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}
				{quotes.map((q) => (
					<div key={q.QuoteID} style={{ ...row, alignItems: "flex-start" }}>
						{isEditing("quote", q.QuoteID) ? (
							<InlineForm
								fields={quoteFields}
								initial={{ Quote: q.Quote, Date: q.Date }}
								onSave={async (vals) => {
									await quoteUpdate(q.QuoteID, { Quote: vals.Quote, Date: vals.Date || null });
									stopEditing();
									reload();
								}}
								onCancel={stopEditing}
							/>
						) : (
							<>
								<div style={{ flex: 1 }}>
									<em>"{q.Quote}"</em>
									{q.Date && <span style={{ color: "#999", marginLeft: 8, fontSize: 11 }}>{q.Date}</span>}
								</div>
								<button style={ghost} onClick={() => setEditing({ type: "quote", id: q.QuoteID })}>
									✏
								</button>
								<button
									style={danger}
									onClick={async () => {
										await quoteDelete(q.QuoteID);
										reload();
									}}
								>
									✕
								</button>
							</>
						)}
					</div>
				))}
				{quotes.length === 0 && !isAdding("quote") && <div style={{ color: "#999" }}>None</div>}
			</Section>

			{/* ── WordMouth ───────────────────────────────────────────── */}
			<Section title="WordMouth (about person)" onAdd={() => setAdding("wm")}>
				{isAdding("wm") && (
					<InlineForm
						fields={wmFields}
						onSave={async (vals) => {
							await wmCreate({ PersonID: personId, SayerID: vals.SayerID || null, Quote: vals.Quote, Date: vals.Date || null });
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}
				{wordMouths.map((w) => (
					<div key={w.WordMouthID} style={{ ...row, alignItems: "flex-start" }}>
						{isEditing("wm", w.WordMouthID) ? (
							<InlineForm
								fields={wmFields}
								initial={{ Quote: w.Quote, Date: w.Date, SayerID: w.SayerID }}
								onSave={async (vals) => {
									await wmUpdate(w.WordMouthID, { SayerID: vals.SayerID || null, Quote: vals.Quote, Date: vals.Date || null });
									stopEditing();
									reload();
								}}
								onCancel={stopEditing}
							/>
						) : (
							<>
								<div style={{ flex: 1 }}>
									<em>"{w.Quote}"</em>
									{w.SayerName && <span style={{ marginLeft: 8 }}>— {w.SayerName}</span>}
									{!w.SayerName && <span style={{ marginLeft: 8, color: "#999" }}>— anonymous</span>}
									{w.Date && <span style={{ color: "#999", marginLeft: 8, fontSize: 11 }}>{w.Date}</span>}
								</div>
								<button style={ghost} onClick={() => setEditing({ type: "wm", id: w.WordMouthID })}>
									✏
								</button>
								<button
									style={danger}
									onClick={async () => {
										await wmDelete(w.WordMouthID);
										reload();
									}}
								>
									✕
								</button>
							</>
						)}
					</div>
				))}
				{wordMouths.length === 0 && !isAdding("wm") && <div style={{ color: "#999" }}>None</div>}
			</Section>

			{/* ── Notes ──────────────────────────────────────────────── */}
			<Section title="Notes" onAdd={() => setAdding("note")}>
				{isAdding("note") && (
					<InlineForm
						fields={[{ key: "Note", label: "Note", textarea: true }]}
						onSave={async (vals) => {
							await noteCreate({ PersonID: personId, Note: vals.Note });
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}
				{notes.map((n) => (
					<div key={n.NotesID} style={{ ...row }}>
						{isEditing("note", n.NotesID) ? (
							<InlineForm
								fields={[{ key: "Note", label: "Note", textarea: true }]}
								initial={{ Note: n.Note }}
								onSave={async (vals) => {
									await noteUpdate(n.NotesID, { Note: vals.Note });
									stopEditing();
									reload();
								}}
								onCancel={stopEditing}
							/>
						) : (
							<>
								<div style={{ flex: 1 }}>{n.Note}</div>
								<button style={ghost} onClick={() => setEditing({ type: "note", id: n.NotesID })}>
									✏
								</button>
								<button
									style={danger}
									onClick={async () => {
										await noteDelete(n.NotesID);
										reload();
									}}
								>
									✕
								</button>
							</>
						)}
					</div>
				))}
				{notes.length === 0 && !isAdding("note") && <div style={{ color: "#999" }}>None</div>}
			</Section>

			{/* ── Specifics ──────────────────────────────────────────── */}
			<Section title="Specifics" onAdd={() => setAdding("specific")}>
				{isAdding("specific") && (
					<InlineForm
						fields={specificFields}
						onSave={async (vals) => {
							await specificCreate({ PersonID: personId, PointID: Number(vals.PointID), SpecificNote: vals.SpecificNote });
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}
				{(() => {
					// Group by SubName for display
					const groups = {};
					specifics.forEach((s) => {
						if (!groups[s.SubName]) groups[s.SubName] = [];
						groups[s.SubName].push(s);
					});
					return Object.entries(groups).map(([sub, items]) => (
						<div key={sub} style={{ marginBottom: 8 }}>
							<div style={{ fontWeight: "bold", color: "#666", fontSize: 11, marginBottom: 4 }}>{sub.toUpperCase()}</div>
							{items.map((s) => (
								<div key={s.SpecificsID} style={{ ...row, paddingLeft: 8 }}>
									{isEditing("specific", s.SpecificsID) ? (
										<InlineForm
											fields={specificFields}
											initial={{ PointID: s.PointID, SpecificNote: s.SpecificNote }}
											onSave={async (vals) => {
												await specificUpdate(s.SpecificsID, { PointID: Number(vals.PointID), SpecificNote: vals.SpecificNote });
												stopEditing();
												reload();
											}}
											onCancel={stopEditing}
										/>
									) : (
										<>
											<span style={{ color: "#555", minWidth: 140 }}>{s.PointName}:</span>
											<span style={{ flex: 1 }}>{s.SpecificNote}</span>
											<button style={ghost} onClick={() => setEditing({ type: "specific", id: s.SpecificsID })}>
												✏
											</button>
											<button
												style={danger}
												onClick={async () => {
													await specificDelete(s.SpecificsID);
													reload();
												}}
											>
												✕
											</button>
										</>
									)}
								</div>
							))}
						</div>
					));
				})()}
				{specifics.length === 0 && !isAdding("specific") && <div style={{ color: "#999" }}>None</div>}
			</Section>

			{/* ── Education ──────────────────────────────────────────── */}
			<Section title="Education History" onAdd={() => setAdding("edu")}>
				{isAdding("edu") && (
					<InlineForm
						fields={eduFields}
						onSave={async (vals) => {
							await eduCreate({
								PersonID: personId,
								InstID: Number(vals.InstID),
								EduLevelID: Number(vals.EduLevelID),
								FieldOfStudy: vals.FieldOfStudy,
								StartYear: vals.StartYear ? Number(vals.StartYear) : null,
								EndYear: vals.EndYear ? Number(vals.EndYear) : null,
							});
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}
				{eduHistory.map((e) => (
					<div key={e.EduHistID} style={{ ...row }}>
						{isEditing("edu", e.EduHistID) ? (
							<InlineForm
								fields={eduFields}
								initial={{ InstID: e.InstID, EduLevelID: e.EduLevelID, FieldOfStudy: e.FieldOfStudy, StartYear: e.StartYear, EndYear: e.EndYear }}
								onSave={async (vals) => {
									await eduUpdate(e.EduHistID, {
										InstID: Number(vals.InstID),
										EduLevelID: Number(vals.EduLevelID),
										FieldOfStudy: vals.FieldOfStudy,
										StartYear: vals.StartYear ? Number(vals.StartYear) : null,
										EndYear: vals.EndYear ? Number(vals.EndYear) : null,
									});
									stopEditing();
									reload();
								}}
								onCancel={stopEditing}
							/>
						) : (
							<>
								<div style={{ flex: 1 }}>
									<strong>{e.InstitutionName}</strong> — {e.LevelName}
									{e.FieldOfStudy && <span>, {e.FieldOfStudy}</span>}
									<span style={{ color: "#999", marginLeft: 8 }}>
										{e.StartYear}–{e.EndYear || "present"}
									</span>
								</div>
								<button style={ghost} onClick={() => setEditing({ type: "edu", id: e.EduHistID })}>
									✏
								</button>
								<button
									style={danger}
									onClick={async () => {
										await eduDelete(e.EduHistID);
										reload();
									}}
								>
									✕
								</button>
							</>
						)}
					</div>
				))}
				{eduHistory.length === 0 && !isAdding("edu") && <div style={{ color: "#999" }}>None</div>}
			</Section>

			{/* ── Org History ────────────────────────────────────────── */}
			<Section title="Organization History" onAdd={() => setAdding("org")}>
				{isAdding("org") && (
					<InlineForm
						fields={orgFields}
						onSave={async (vals) => {
							await orgCreate({
								PersonID: personId,
								OrgID: Number(vals.OrgID),
								Division: vals.Division,
								StartYear: vals.StartYear ? Number(vals.StartYear) : null,
								EndYear: vals.EndYear ? Number(vals.EndYear) : null,
							});
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}
				{orgHistory.map((o) => (
					<div key={o.OrgHistID} style={{ ...row }}>
						{isEditing("org", o.OrgHistID) ? (
							<InlineForm
								fields={orgFields}
								initial={{ OrgID: o.OrgID, Division: o.Division, StartYear: o.StartYear, EndYear: o.EndYear }}
								onSave={async (vals) => {
									await orgUpdate(o.OrgHistID, {
										OrgID: Number(vals.OrgID),
										Division: vals.Division,
										StartYear: vals.StartYear ? Number(vals.StartYear) : null,
										EndYear: vals.EndYear ? Number(vals.EndYear) : null,
									});
									stopEditing();
									reload();
								}}
								onCancel={stopEditing}
							/>
						) : (
							<>
								<div style={{ flex: 1 }}>
									<strong>{o.OrgName}</strong>
									{o.Division && <span> — {o.Division}</span>}
									<span style={{ color: "#999", marginLeft: 8 }}>
										{o.StartYear}–{o.EndYear || "present"}
									</span>
								</div>
								<button style={ghost} onClick={() => setEditing({ type: "org", id: o.OrgHistID })}>
									✏
								</button>
								<button
									style={danger}
									onClick={async () => {
										await orgDelete(o.OrgHistID);
										reload();
									}}
								>
									✕
								</button>
							</>
						)}
					</div>
				))}
				{orgHistory.length === 0 && !isAdding("org") && <div style={{ color: "#999" }}>None</div>}
			</Section>

			{/* ── Social Accounts ─────────────────────────────────────── */}
			<Section title="Social Accounts" onAdd={() => setAdding("social")}>
				{isAdding("social") && (
					<InlineForm
						fields={socialFields}
						onSave={async (vals) => {
							await socialCreate({ PersonID: personId, PlatformID: Number(vals.PlatformID), AccountTag: vals.AccountTag });
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}
				{socialAccounts.map((s) => (
					<div key={s.SocialID} style={{ ...row }}>
						<span style={{ flex: 1 }}>
							<strong>{s.PlatformName}</strong>: {s.AccountTag}
						</span>
						<button
							style={danger}
							onClick={async () => {
								await socialDelete(s.SocialID);
								reload();
							}}
						>
							✕
						</button>
					</div>
				))}
				{socialAccounts.length === 0 && !isAdding("social") && <div style={{ color: "#999" }}>None</div>}
			</Section>

			{/* ── Media ──────────────────────────────────────────────── */}
			<Section title="Media (file paths)" onAdd={() => setAdding("media")}>
				{isAdding("media") && (
					<InlineForm
						fields={mediaFields}
						onSave={async (vals) => {
							const mediaId = await mediaCreate({ FilePath: vals.FilePath, Date: vals.Date || null });
							await mediaLink(personId, mediaId);
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}
				{media.map((m) => (
					<div key={m.MediaID} style={{ ...row }}>
						<span style={{ flex: 1, wordBreak: "break-all" }}>{m.FilePath}</span>
						{m.Date && <span style={{ color: "#999", fontSize: 11 }}>{m.Date}</span>}
						<button
							style={danger}
							onClick={async () => {
								await mediaUnlink(personId, m.MediaID);
								reload();
							}}
						>
							✕
						</button>
					</div>
				))}
				{media.length === 0 && !isAdding("media") && <div style={{ color: "#999" }}>None</div>}
			</Section>

			<div style={{ height: 40 }} />
		</div>
	);
}
