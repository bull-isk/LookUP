// renderer/src/pages/PersonDetail.jsx
import { useState, useEffect, useCallback } from "react";
import {
	personFull,
	personDelete,
	personUpdate,
	personSetPronouns,
	personSetTags,
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
import SpecificsEditor from "../components/SpecificsEditor";
import TagInput from "../components/TagInput";
import QuickAdd from "../components/QuickAdd";

const api = window.electronAPI;

// ── Shared micro-styles (all use CSS vars) ────────────────────────
const iStyle = {
	padding: "4px 6px",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-sm)",
	background: "var(--color-surface-2)",
	color: "var(--color-text)",
	width: "100%",
};
const btnP = {
	padding: "3px 10px",
	background: "var(--color-primary)",
	color: "#fff",
	border: "none",
	borderRadius: "var(--radius-sm)",
	cursor: "pointer",
};
const btnD = {
	padding: "3px 8px",
	background: "var(--color-danger)",
	color: "#fff",
	border: "none",
	borderRadius: "var(--radius-sm)",
	cursor: "pointer",
};
const btnG = {
	padding: "3px 8px",
	background: "transparent",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-sm)",
	color: "var(--color-text-muted)",
	cursor: "pointer",
};
const divider = {
	borderTop: "1px solid var(--color-border)",
	margin: "14px 0",
};
const sectionTitle = {
	fontSize: "var(--font-size-xs)",
	fontWeight: "bold",
	textTransform: "uppercase",
	letterSpacing: 1,
	color: "var(--color-accent)",
	marginBottom: 8,
};

// ── Inline editable field ─────────────────────────────────────────
function InlineField({ label, value, onSave, textarea, placeholder }) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value || "");

	useEffect(() => {
		setDraft(value || "");
	}, [value]);

	const save = () => {
		onSave(draft.trim());
		setEditing(false);
	};
	const cancel = () => {
		setDraft(value || "");
		setEditing(false);
	};

	if (editing)
		return (
			<div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 6 }}>
				<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90, paddingTop: 5 }}>{label}</span>
				<div style={{ flex: 1 }}>
					{textarea ? (
						<textarea style={{ ...iStyle, height: 60, resize: "vertical" }} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
					) : (
						<input
							style={iStyle}
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Enter") save();
								if (e.key === "Escape") cancel();
							}}
						/>
					)}
					<div style={{ display: "flex", gap: 6, marginTop: 4 }}>
						<button style={btnP} onClick={save}>
							Save
						</button>
						<button style={btnG} onClick={cancel}>
							Cancel
						</button>
					</div>
				</div>
			</div>
		);

	return (
		<div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 5, cursor: "pointer", group: true }} onClick={() => setEditing(true)} title="Click to edit">
			<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90, paddingTop: 2 }}>{label}</span>
			<span style={{ flex: 1, color: value ? "var(--color-text)" : "var(--color-text-faint)", fontStyle: value ? "normal" : "italic" }}>
				{value || placeholder || `(click to add ${label.toLowerCase()})`}
			</span>
			<span style={{ color: "var(--color-text-faint)", fontSize: 10, opacity: 0.5 }}>✏</span>
		</div>
	);
}

// ── Simple inline row for child data ─────────────────────────────
function InlineForm({ fields, onSave, onCancel, initial = {} }) {
	const [vals, setVals] = useState(initial);
	const set = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.value }));

	return (
		<div style={{ background: "var(--color-surface-2)", padding: 10, borderRadius: "var(--radius-sm)", marginBottom: 8, border: "1px solid var(--color-border)" }}>
			{fields.map((f) => (
				<label key={f.key} style={{ display: "flex", flexDirection: "column", marginBottom: 6, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
					{f.label}
					{f.textarea ? (
						<textarea style={{ ...iStyle, marginTop: 2, height: 50, resize: "vertical" }} value={vals[f.key] || ""} onChange={set(f.key)} />
					) : (
						<input style={{ ...iStyle, marginTop: 2 }} type={f.type || "text"} value={vals[f.key] || ""} onChange={set(f.key)} />
					)}
				</label>
			))}
			<div style={{ display: "flex", gap: 6 }}>
				<button style={btnP} onClick={() => onSave(vals)}>
					Save
				</button>
				<button style={btnG} onClick={onCancel}>
					Cancel
				</button>
			</div>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════
export default function PersonDetail({ personId, onDeleted }) {
	const [data, setData] = useState(null);
	const [lookups, setLookups] = useState(null);
	const [specifics, setSpecifics] = useState([]);
	const [specTree, setSpecTree] = useState([]);
	const [innerTab, setInnerTab] = useState("Details");
	const [adding, setAdding] = useState(null);
	const [editing, setEditing] = useState(null);
	const [quickAdd, setQuickAdd] = useState(false);
	// Tag editing state (for inline tag editor in primary group)
	const [editingTags, setEditingTags] = useState(false);
	const [tagDraft, setTagDraft] = useState([]);

	const reload = useCallback(async () => {
		const [d, sp] = await Promise.all([personFull(personId), api.specificsForPerson(personId)]);
		setData(d);
		setSpecifics(sp);
	}, [personId]);

	const reloadSpec = useCallback(() => {
		api.specificsForPerson(personId).then(setSpecifics);
	}, [personId]);

	useEffect(() => {
		reload();
		lookupAll().then(setLookups);
		api.specificsTree().then(setSpecTree);
	}, [reload]);

	// Ctrl+N — QuickAdd, only while PersonDetail is mounted
	useEffect(() => {
		const h = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "n") {
				e.preventDefault();
				setQuickAdd(true);
			}
			if (e.key === "Escape") {
				setQuickAdd(false);
			}
		};
		window.addEventListener("keydown", h);
		return () => window.removeEventListener("keydown", h);
	}, []);

	if (!data || !lookups) return <div style={{ color: "var(--color-text-muted)", padding: 20 }}>Loading…</div>;

	const { person, pronouns, tags, socialAccounts, eduHistory, orgHistory, notes, quotes, wordMouths, media } = data;

	// ── Inline save helpers for primary group ─────────────────────
	const savePrimaryField = async (field, value) => {
		await personUpdate(personId, { ...person, [field]: value || null });
		reload();
	};

	// Save pronouns inline (toggle)
	const savePronoun = async (ids) => {
		await personSetPronouns(personId, ids);
		reload();
	};

	// Save tags inline
	const saveTagsInline = async (tagNames) => {
		// find-or-create each tag name, get IDs
		const ids = await Promise.all(tagNames.map((n) => api.lookupFindOrCreateTag(n)));
		await personSetTags(personId, ids);
		setEditingTags(false);
		reload();
	};

	// Save category inline
	const saveCategoryInline = async (catId) => {
		await personUpdate(personId, { ...person, CategoryID: catId ? Number(catId) : null });
		reload();
	};

	const handleDelete = async () => {
		if (!confirm(`Delete ${person.FullName}? This cannot be undone.`)) return;
		await personDelete(personId);
		onDeleted();
	};

	const isAdding = (k) => adding === k;
	const isEditing = (t, id) => editing?.type === t && editing?.id === id;
	const stopAdding = () => setAdding(null);
	const stopEditing = () => setEditing(null);

	const allTagNames = lookups.tags.map((t) => t.TagName);
	const sayerOpts = lookups.persons.filter((p) => p.PersonID !== personId);

	// ── DETAILS TAB ───────────────────────────────────────────────
	const renderDetails = () => (
		<>
			{/* ── PRIMARY GROUP — inline editable ── */}
			<div style={{ marginBottom: 16 }}>
				{/* Category */}
				<div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90 }}>Category</span>
					<select style={{ ...iStyle, width: "auto" }} value={person.CategoryID || ""} onChange={(e) => saveCategoryInline(e.target.value)}>
						<option value="">— none —</option>
						{lookups.categories.map((c) => (
							<option key={c.CategoryID} value={c.CategoryID}>
								{c.CategoryName}
							</option>
						))}
					</select>
				</div>

				{/* Full Name - (Nickname) */}
				<InlineField label="Full Name" value={person.FullName} onSave={(v) => savePrimaryField("FullName", v || person.FullName)} />
				<InlineField label="Nickname" value={person.Nickname} onSave={(v) => savePrimaryField("Nickname", v)} placeholder="(none)" />

				{/* Pronouns — multi-select checkboxes inline */}
				<div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 5 }}>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90, paddingTop: 2 }}>Pronouns</span>
					<div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 6 }}>
						{lookups.pronouns.map((p) => (
							<label key={p.PronounsID} style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer", fontSize: "var(--font-size-sm)" }}>
								<input
									type="checkbox"
									checked={pronouns.some((pr) => pr.PronounsID === p.PronounsID)}
									onChange={async (e) => {
										const current = pronouns.map((pr) => pr.PronounsID);
										const next = e.target.checked ? [...current, p.PronounsID] : current.filter((id) => id !== p.PronounsID);
										await savePronoun(next);
									}}
								/>
								{p.Pronouns}
							</label>
						))}
					</div>
				</div>

				{/* Birthdate + age + days */}
				<div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90 }}>Birthdate</span>
					<BirthdateField personId={personId} value={person.Birthdate} onSave={(v) => savePrimaryField("Birthdate", v)} />
				</div>

				{/* Timezone + current time */}
				<div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90 }}>Timezone</span>
					<select
						style={{ ...iStyle, width: "auto" }}
						value={person.TimezoneID || ""}
						onChange={async (e) => {
							await personUpdate(personId, { ...person, TimezoneID: e.target.value ? Number(e.target.value) : null });
							reload();
						}}
					>
						<option value="">— none —</option>
						{lookups.timezones.map((t) => (
							<option key={t.TimezoneID} value={t.TimezoneID}>
								{t.Name} (GMT{t.GMTDifference})
							</option>
						))}
					</select>
					{person.TimezoneID && <TimezoneTime gmt={lookups.timezones.find((t) => t.TimezoneID === person.TimezoneID)?.GMTDifference} />}
				</div>

				{/* Impression Note */}
				<InlineField label="Note" value={person.ImpressionNote} onSave={(v) => savePrimaryField("ImpressionNote", v)} textarea placeholder="(click to add note)" />

				{/* Tags — inline TagInput */}
				<div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 5 }}>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90, paddingTop: 6 }}>Tags</span>
					<div style={{ flex: 1 }}>
						<TagInput value={tags.map((t) => t.TagName)} allTags={allTagNames} onChange={saveTagsInline} />
					</div>
				</div>
			</div>

			<div style={divider} />

			{/* ── SOCIALS ── */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={sectionTitle}>Socials</div>
					<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("social")}>
						+ Add
					</button>
				</div>

				{isAdding("social") && (
					<InlineForm
						fields={[
							{ key: "PlatformName", label: "Platform (type freely)" },
							{ key: "AccountTag", label: "Handle / URL" },
						]}
						onSave={async (v) => {
							// Find platform by name or use first as fallback
							const plat = lookups.platforms.find((p) => p.PlatformName.toLowerCase() === (v.PlatformName || "").toLowerCase());
							const platId = plat ? plat.PlatformID : lookups.platforms[0]?.PlatformID || 1;
							await socialCreate({ PersonID: personId, PlatformID: platId, AccountTag: v.AccountTag });
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}

				{/* Platform : handle1, handle2 format */}
				{(() => {
					const byPlat = {};
					socialAccounts.forEach((s) => {
						if (!byPlat[s.PlatformName]) byPlat[s.PlatformName] = [];
						byPlat[s.PlatformName].push(s);
					});
					return Object.entries(byPlat).map(([plat, accs]) => (
						<div key={plat} style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "flex-start" }}>
							<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90, paddingTop: 2 }}>{plat}</span>
							<div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 4 }}>
								{accs.map((s) => (
									<span
										key={s.SocialID}
										style={{
											background: "var(--color-surface-3)",
											padding: "1px 7px",
											borderRadius: "var(--radius-sm)",
											fontSize: "var(--font-size-sm)",
											display: "inline-flex",
											alignItems: "center",
											gap: 4,
										}}
									>
										{s.AccountTag}
										<span
											onClick={async () => {
												await socialDelete(s.SocialID);
												reload();
											}}
											style={{ cursor: "pointer", color: "var(--color-danger)", fontSize: 10 }}
										>
											×
										</span>
									</span>
								))}
							</div>
						</div>
					));
				})()}
				{socialAccounts.length === 0 && !isAdding("social") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>

			<div style={divider} />

			{/* ── EDUCATION ── */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={sectionTitle}>Education</div>
					<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("edu")}>
						+ Add
					</button>
				</div>

				{isAdding("edu") && (
					<InlineForm
						fields={[
							{ key: "InstitutionText", label: "Institution" },
							{ key: "CityText", label: "City" },
							{ key: "StartYearText", label: "Year range (e.g. 2018–2022)" },
							{ key: "Faculty", label: "Faculty (optional)" },
							{ key: "Major", label: "Major (optional)" },
						]}
						onSave={async (v) => {
							await eduCreate({ PersonID: personId, ...v });
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}

				{eduHistory.map((e) => {
					const inst = e.InstitutionText || e.FieldOfStudy || "—";
					const city = e.CityText || "";
					const years = e.StartYearText || (e.StartYear ? `${e.StartYear}–${e.EndYear || "present"}` : "");
					const faculty = e.Faculty || "";
					const major = e.Major || "";
					return (
						<div key={e.EduHistID} style={{ marginBottom: 8 }}>
							{isEditing("edu", e.EduHistID) ? (
								<InlineForm
									fields={[
										{ key: "InstitutionText", label: "Institution" },
										{ key: "CityText", label: "City" },
										{ key: "StartYearText", label: "Year range" },
										{ key: "Faculty", label: "Faculty" },
										{ key: "Major", label: "Major" },
									]}
									initial={{
										InstitutionText: e.InstitutionText || "",
										CityText: e.CityText || "",
										StartYearText: e.StartYearText || years,
										Faculty: e.Faculty || "",
										Major: e.Major || "",
									}}
									onSave={async (v) => {
										await eduUpdate(e.EduHistID, v);
										stopEditing();
										reload();
									}}
									onCancel={stopEditing}
								/>
							) : (
								<div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
									<div style={{ flex: 1 }}>
										<div style={{ color: "var(--color-text)" }}>
											<strong>{inst}</strong>
											{city && <span style={{ color: "var(--color-text-muted)" }}>, {city}</span>}
										</div>
										{years && <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>{years}</div>}
										{(faculty || major) && <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>{[faculty, major].filter(Boolean).join(", ")}</div>}
									</div>
									<button style={btnG} onClick={() => setEditing({ type: "edu", id: e.EduHistID })}>
										✏
									</button>
									<button
										style={btnD}
										onClick={async () => {
											await eduDelete(e.EduHistID);
											reload();
										}}
									>
										✕
									</button>
								</div>
							)}
						</div>
					);
				})}
				{eduHistory.length === 0 && !isAdding("edu") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>

			<div style={divider} />

			{/* ── ORGANIZATION ── */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={sectionTitle}>Organizations / Employment</div>
					<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("org")}>
						+ Add
					</button>
				</div>

				{isAdding("org") && (
					<InlineForm
						fields={[
							{ key: "OrgNameText", label: "Organization" },
							{ key: "Role", label: "Role / Division" },
							{ key: "StartYearText", label: "Year range (e.g. 2020–now)" },
						]}
						onSave={async (v) => {
							await orgCreate({ PersonID: personId, ...v });
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}

				{orgHistory.map((o) => {
					const org = o.OrgNameText || o.OrgName || "—";
					const role = o.Role || o.Division || "";
					const years = o.StartYearText || (o.StartYear ? `${o.StartYear}–${o.EndYear || "present"}` : "");
					return (
						<div key={o.OrgHistID} style={{ marginBottom: 8 }}>
							{isEditing("org", o.OrgHistID) ? (
								<InlineForm
									fields={[
										{ key: "OrgNameText", label: "Organization" },
										{ key: "Role", label: "Role / Division" },
										{ key: "StartYearText", label: "Year range" },
									]}
									initial={{ OrgNameText: o.OrgNameText || "", Role: o.Role || "", StartYearText: o.StartYearText || years }}
									onSave={async (v) => {
										await orgUpdate(o.OrgHistID, v);
										stopEditing();
										reload();
									}}
									onCancel={stopEditing}
								/>
							) : (
								<div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
									<div style={{ flex: 1 }}>
										<span style={{ color: "var(--color-text)" }}>
											<strong>{org}</strong>
										</span>
										{role && <span style={{ color: "var(--color-text-muted)" }}> ({role})</span>}
										{years && <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>{years}</div>}
									</div>
									<button style={btnG} onClick={() => setEditing({ type: "org", id: o.OrgHistID })}>
										✏
									</button>
									<button
										style={btnD}
										onClick={async () => {
											await orgDelete(o.OrgHistID);
											reload();
										}}
									>
										✕
									</button>
								</div>
							)}
						</div>
					);
				})}
				{orgHistory.length === 0 && !isAdding("org") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>

			<div style={divider} />

			{/* ── SPECIFICS ── */}
			<div style={{ marginBottom: 16 }}>
				<div style={sectionTitle}>Specifics</div>
				<SpecificsEditor specifics={specifics} tree={specTree} personId={personId} onReload={reloadSpec} />
			</div>
		</>
	);

	// ── TEXT TAB ─────────────────────────────────────────────────
	const renderText = () => (
		<>
			{/* QUOTES */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={sectionTitle}>Quotes</div>
					<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("quote")}>
						+ Add
					</button>
				</div>
				{isAdding("quote") && (
					<InlineForm
						fields={[
							{ key: "Quote", label: "Quote", textarea: true },
							{ key: "Date", label: "Date", type: "date" },
						]}
						onSave={async (v) => {
							await quoteCreate({ PersonID: personId, Quote: v.Quote, Date: v.Date || null });
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}
				{quotes.map((q) => (
					<div key={q.QuoteID} style={{ marginBottom: 6 }}>
						{isEditing("quote", q.QuoteID) ? (
							<InlineForm
								fields={[
									{ key: "Quote", label: "Quote", textarea: true },
									{ key: "Date", label: "Date", type: "date" },
								]}
								initial={{ Quote: q.Quote, Date: q.Date }}
								onSave={async (v) => {
									await quoteUpdate(q.QuoteID, { Quote: v.Quote, Date: v.Date || null });
									stopEditing();
									reload();
								}}
								onCancel={stopEditing}
							/>
						) : (
							<div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
								<div style={{ flex: 1, color: "var(--color-text)" }}>
									<em>"{q.Quote}"</em>
									{q.Date && <span style={{ color: "var(--color-text-faint)", marginLeft: 8, fontSize: "var(--font-size-xs)" }}>{q.Date}</span>}
								</div>
								<button style={btnG} onClick={() => setEditing({ type: "quote", id: q.QuoteID })}>
									✏
								</button>
								<button
									style={btnD}
									onClick={async () => {
										await quoteDelete(q.QuoteID);
										reload();
									}}
								>
									✕
								</button>
							</div>
						)}
					</div>
				))}
				{quotes.length === 0 && !isAdding("quote") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>

			<div style={divider} />

			{/* NOTES */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={sectionTitle}>Notes</div>
					<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("note")}>
						+ Add
					</button>
				</div>
				{isAdding("note") && (
					<InlineForm
						fields={[{ key: "Note", label: "Note", textarea: true }]}
						onSave={async (v) => {
							await noteCreate({ PersonID: personId, Note: v.Note });
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}
				{notes.map((n) => (
					<div key={n.NotesID} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
						{isEditing("note", n.NotesID) ? (
							<InlineForm
								fields={[{ key: "Note", label: "Note", textarea: true }]}
								initial={{ Note: n.Note }}
								onSave={async (v) => {
									await noteUpdate(n.NotesID, { Note: v.Note });
									stopEditing();
									reload();
								}}
								onCancel={stopEditing}
							/>
						) : (
							<>
								<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", marginTop: 2 }}>•</span>
								<span style={{ flex: 1 }}>{n.Note}</span>
								<button style={btnG} onClick={() => setEditing({ type: "note", id: n.NotesID })}>
									✏
								</button>
								<button
									style={btnD}
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
				{notes.length === 0 && !isAdding("note") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>

			<div style={divider} />

			{/* HE SAID SHE SAID (WordMouth) */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={sectionTitle}>He Said / She Said</div>
					<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("wm")}>
						+ Add
					</button>
				</div>
				{isAdding("wm") && (
					<InlineForm
						fields={[
							{ key: "Quote", label: "Quote", textarea: true },
							{ key: "Speaker", label: "Speaker (name, optional)" },
							{ key: "Date", label: "Date", type: "date" },
						]}
						onSave={async (v) => {
							// Speaker is free-text: find matching person or leave SayerID null
							const match = sayerOpts.find((p) => p.FullName.toLowerCase() === (v.Speaker || "").trim().toLowerCase());
							await wmCreate({ PersonID: personId, SayerID: match?.PersonID || null, Quote: v.Quote, Date: v.Date || null });
							stopAdding();
							reload();
						}}
						onCancel={stopAdding}
					/>
				)}
				{wordMouths.map((w) => (
					<div key={w.WordMouthID} style={{ marginBottom: 8 }}>
						{isEditing("wm", w.WordMouthID) ? (
							<InlineForm
								fields={[
									{ key: "Quote", label: "Quote", textarea: true },
									{ key: "Speaker", label: "Speaker (name, optional)" },
									{ key: "Date", label: "Date", type: "date" },
								]}
								initial={{ Quote: w.Quote, Speaker: w.SayerName || "", Date: w.Date }}
								onSave={async (v) => {
									const match = sayerOpts.find((p) => p.FullName.toLowerCase() === (v.Speaker || "").trim().toLowerCase());
									await wmUpdate(w.WordMouthID, { SayerID: match?.PersonID || null, Quote: v.Quote, Date: v.Date || null });
									stopEditing();
									reload();
								}}
								onCancel={stopEditing}
							/>
						) : (
							<div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
								<div style={{ flex: 1 }}>
									<em style={{ color: "var(--color-text)" }}>"{w.Quote}"</em>
									<div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", marginTop: 2 }}>
										{w.SayerName || "anonymous"}
										{w.Date && <span style={{ marginLeft: 8, color: "var(--color-text-faint)" }}>{w.Date}</span>}
									</div>
								</div>
								<button style={btnG} onClick={() => setEditing({ type: "wm", id: w.WordMouthID })}>
									✏
								</button>
								<button
									style={btnD}
									onClick={async () => {
										await wmDelete(w.WordMouthID);
										reload();
									}}
								>
									✕
								</button>
							</div>
						)}
					</div>
				))}
				{wordMouths.length === 0 && !isAdding("wm") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>
		</>
	);

	// ── MEDIA TAB ─────────────────────────────────────────────────
	const renderMedia = () => (
		<div>
			<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
				<div style={sectionTitle}>Media</div>
				<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("media")}>
					+ Add
				</button>
			</div>

			{isAdding("media") && (
				<InlineForm
					fields={[
						{ key: "FilePath", label: "File Path" },
						{ key: "Date", label: "Date", type: "date" },
					]}
					onSave={async (v) => {
						const mid = await mediaCreate({ FilePath: v.FilePath, Date: v.Date || null });
						await mediaLink(personId, mid);
						stopAdding();
						reload();
					}}
					onCancel={stopAdding}
				/>
			)}

			{/* Simple grid */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
				{media.map((m) => (
					<div
						key={m.MediaID}
						style={{
							background: "var(--color-surface-2)",
							border: "1px solid var(--color-border)",
							borderRadius: "var(--radius-md)",
							padding: 8,
							position: "relative",
						}}
					>
						<div style={{ fontSize: "var(--font-size-xs)", wordBreak: "break-all", color: "var(--color-text-muted)", marginBottom: 4 }}>{m.FilePath.split("/").pop() || m.FilePath}</div>
						<div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-faint)" }}>{m.Date || ""}</div>
						<div style={{ fontSize: 9, color: "var(--color-text-faint)", wordBreak: "break-all", marginTop: 2 }}>{m.FilePath}</div>
						<button
							onClick={async () => {
								await mediaUnlink(personId, m.MediaID);
								reload();
							}}
							style={{ position: "absolute", top: 4, right: 4, background: "transparent", border: "none", color: "var(--color-danger)", fontSize: 12, cursor: "pointer" }}
						>
							×
						</button>
					</div>
				))}
			</div>
			{media.length === 0 && !isAdding("media") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>No media files.</div>}
		</div>
	);

	// ── RENDER ────────────────────────────────────────────────────
	return (
		<div style={{ position: "relative", paddingBottom: 70 }}>
			{/* QuickAdd popup */}
			{quickAdd && lookups && (
				<QuickAdd
					person={person}
					lookups={lookups}
					specificsTree={specTree}
					onSaved={() => {
						reload();
						api.specificsTree().then(setSpecTree);
					}}
					onClose={() => setQuickAdd(false)}
				/>
			)}

			{/* Header row */}
			<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
				<div>
					<h2 style={{ margin: 0, color: "var(--color-text)" }}>
						{person.FullName}
						{person.Nickname && <span style={{ color: "var(--color-text-muted)", fontWeight: "normal", marginLeft: 8, fontSize: 14 }}>({person.Nickname})</span>}
					</h2>
					{person.CategoryName && (
						<span
							style={{
								fontSize: "var(--font-size-xs)",
								padding: "1px 7px",
								borderRadius: "var(--radius-sm)",
								background: "var(--color-active)",
								color: "#fff",
								marginTop: 4,
								display: "inline-block",
							}}
						>
							{person.CategoryName}
						</span>
					)}
				</div>
				<button style={{ ...btnD, marginLeft: "auto" }} onClick={handleDelete}>
					🗑 Delete
				</button>
			</div>

			{/* Inner tabs */}
			<div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--color-border)", marginBottom: 16 }}>
				{["Details", "Text", "Media"].map((t) => (
					<button
						key={t}
						onClick={() => setInnerTab(t)}
						style={{
							padding: "6px 16px",
							border: "none",
							cursor: "pointer",
							background: "transparent",
							color: innerTab === t ? "var(--color-accent)" : "var(--color-text-muted)",
							fontWeight: innerTab === t ? "bold" : "normal",
							borderBottom: innerTab === t ? "2px solid var(--color-accent)" : "2px solid transparent",
							marginBottom: -1,
						}}
					>
						{t}
					</button>
				))}
			</div>

			{/* Tab content — display:none to preserve state */}
			<div style={{ display: innerTab === "Details" ? "block" : "none" }}>{renderDetails()}</div>
			<div style={{ display: innerTab === "Text" ? "block" : "none" }}>{renderText()}</div>
			<div style={{ display: innerTab === "Media" ? "block" : "none" }}>{renderMedia()}</div>

			{/* Floating Ctrl+N button */}
			<button
				onClick={() => setQuickAdd(true)}
				title="Quick Add (Ctrl+N)"
				style={{
					position: "fixed",
					bottom: 24,
					right: 24,
					background: "var(--color-primary)",
					color: "#fff",
					border: "none",
					borderRadius: "var(--radius-md)",
					padding: "8px 16px",
					cursor: "pointer",
					boxShadow: "0 2px 12px rgba(99,102,241,0.4)",
					zIndex: 100,
					fontSize: "var(--font-size-sm)",
				}}
			>
				Ctrl+N +
			</button>
		</div>
	);
}

// ── Sub-components ─────────────────────────────────────────────

function BirthdateField({ value, onSave }) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value || "");

	useEffect(() => {
		setDraft(value || "");
	}, [value]);

	let ageInfo = "";
	if (value) {
		const [y, m, d] = value.split("-").map(Number);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		let age = today.getFullYear() - y;
		const hadBday = today.getMonth() > m - 1 || (today.getMonth() === m - 1 && today.getDate() >= d);
		if (!hadBday) age--;
		const next = new Date(today.getFullYear(), m - 1, d);
		if (next < today) next.setFullYear(today.getFullYear() + 1);
		const days = Math.round((next - today) / 86400000);
		ageInfo = ` · ${age} y/o · ${days === 0 ? "🎂 today!" : `${days}d`}`;
	}

	if (editing)
		return (
			<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
				<input
					type="date"
					style={{ ...iStyle, width: "auto" }}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							onSave(draft);
							setEditing(false);
						}
						if (e.key === "Escape") setEditing(false);
					}}
					autoFocus
				/>
				<button
					style={btnP}
					onClick={() => {
						onSave(draft);
						setEditing(false);
					}}
				>
					Save
				</button>
				<button style={btnG} onClick={() => setEditing(false)}>
					Cancel
				</button>
			</div>
		);

	return (
		<span onClick={() => setEditing(true)} style={{ cursor: "pointer", color: value ? "var(--color-text)" : "var(--color-text-faint)", fontStyle: value ? "normal" : "italic" }}>
			{value || "(click to set)"}
			{ageInfo && <span style={{ color: "var(--color-text-muted)" }}>{ageInfo}</span>}
		</span>
	);
}

function TimezoneTime({ gmt }) {
	const [time, setTime] = useState("");
	useEffect(() => {
		if (!gmt) return;
		const update = () => {
			const offset = parseFloat(gmt);
			const utc = new Date(Date.now() + new Date().getTimezoneOffset() * 60000);
			const local = new Date(utc.getTime() + offset * 3600000);
			setTime(local.toTimeString().slice(0, 5));
		};
		update();
		const t = setInterval(update, 10000);
		return () => clearInterval(t);
	}, [gmt]);

	return <span style={{ color: "var(--color-text-faint)", fontSize: "var(--font-size-sm)" }}>{time}</span>;
}
