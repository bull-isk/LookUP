// pages/PersonDetail/DetailTab.jsx
// Details tab: Primary group, Specifics, Organization, Education, Socials.

import { useState } from "react";
import SpecificsEditor from "../../components/SpecificsEditor";
import TagInput from "../../components/TagInput";
import SocialChip from "../../components/SocialChip";
import { HoverRow, InlineField, Modal, iStyle, btnP, btnG, btnD, secTitle, divider, lbl } from "./shared";
import { eduCreate, eduUpdate, eduDelete, orgCreate, orgUpdate, orgDelete, socialCreate, socialUpdate, socialDelete } from "../../api/bridge";

const api = window.electronAPI;

// ── Timezone: static text → dropdown on click ─────────────────────
function TimezoneField({ value, timezones, onSave }) {
	const [open, setOpen] = useState(false);
	const currentTz = timezones.find((t) => t.TimezoneID === value);

	if (!open)
		return (
			<span
				onClick={() => setOpen(true)}
				title="Click to change timezone"
				style={{ cursor: "pointer", color: currentTz ? "var(--color-text)" : "var(--color-text-faint)", fontStyle: currentTz ? "normal" : "italic" }}
			>
				{currentTz ? `${currentTz.Name} (GMT${currentTz.GMTDifference})` : "(click to set)"}
				{currentTz && <TimezoneTime gmt={currentTz.GMTDifference} />}
			</span>
		);

	return (
		<select
			autoFocus
			style={{ ...iStyle, width: "auto" }}
			value={value || ""}
			onChange={(e) => {
				onSave(e.target.value ? Number(e.target.value) : null);
				setOpen(false);
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape") setOpen(false);
			}}
			onBlur={() => setOpen(false)}
		>
			<option value="">— none —</option>
			{timezones.map((t) => (
				<option key={t.TimezoneID} value={t.TimezoneID}>
					{t.Name} (GMT{t.GMTDifference})
				</option>
			))}
		</select>
	);
}

function TimezoneTime({ gmt }) {
	const [time, setTime] = useState(() => {
		if (!gmt) return "";
		const offset = parseFloat(gmt);
		const utc = new Date(Date.now() + new Date().getTimezoneOffset() * 60000);
		return new Date(utc.getTime() + offset * 3600000).toTimeString().slice(0, 5);
	});
	return <span style={{ marginLeft: 8, color: "var(--color-text-faint)", fontSize: "var(--font-size-sm)" }}>{time}</span>;
}

// ── Birthdate field ───────────────────────────────────────────────
function BirthdateField({ value, onSave }) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value || "");

	let ageInfo = "";
	if (value) {
		const [y, m, d] = value.split("-").map(Number);
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		let age = now.getFullYear() - y;
		if (now.getMonth() < m - 1 || (now.getMonth() === m - 1 && now.getDate() < d)) age--;
		const next = new Date(now.getFullYear(), m - 1, d);
		if (next < now) next.setFullYear(now.getFullYear() + 1);
		const days = Math.round((next - now) / 86400000);
		ageInfo = ` · ${age} y/o · ${days === 0 ? "🎂 today!" : `${days}d`}`;
	}

	const is = { padding: "4px 6px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface-2)", color: "var(--color-text)" };

	if (editing)
		return (
			<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
				<input
					type="date"
					style={{ ...is, width: "auto" }}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					autoFocus
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							onSave(draft);
							setEditing(false);
						}
						if (e.key === "Escape") setEditing(false);
					}}
				/>
				<button
					style={{ padding: "3px 8px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
					onClick={() => {
						onSave(draft);
						setEditing(false);
					}}
				>
					Save
				</button>
				<button
					style={{
						padding: "3px 6px",
						background: "transparent",
						border: "1px solid var(--color-border)",
						borderRadius: "var(--radius-sm)",
						color: "var(--color-text-muted)",
						cursor: "pointer",
					}}
					onClick={() => setEditing(false)}
				>
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

// ── Education popup ───────────────────────────────────────────────
function EduPopup({ title, initial = {}, onSave, onClose, eduLevels = [], institutions = [] }) {
	const [vals, setVals] = useState({ institutionName: "", EduLevelID: "", Faculty: "", FieldOfStudy: "", StartYear: "", EndYear: "", IsPresent: false, ...initial });
	const [instSuggestions, setInstSuggestions] = useState([]);
	const [showInstSug, setShowInstSug] = useState(false);
	const set = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.value }));

	const selectedLevel = eduLevels.find((l) => String(l.EduLevelID) === String(vals.EduLevelID));
	const levelName = selectedLevel?.LevelName || "";
	const showFieldOfStudy = levelName === "College" || levelName === "High School";
	const showFaculty = levelName === "College";
	const fieldLabel = levelName === "High School" ? "Subject Focus" : "Major";

	const handleSave = async () => {
		let instId = null;
		const name = vals.institutionName.trim();
		if (name) instId = await api.lookupFindOrCreateInstitution(name);
		onSave({
			InstID: instId,
			EduLevelID: vals.EduLevelID ? Number(vals.EduLevelID) : null,
			Faculty: vals.Faculty,
			FieldOfStudy: vals.FieldOfStudy,
			StartYear: vals.StartYear,
			EndYear: vals.EndYear,
			IsPresent: vals.IsPresent,
		});
		onClose();
	};

	return (
		<Modal onClose={onClose} width={440}>
			<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", fontWeight: "bold", color: "var(--color-text)" }}>{title}</div>
			<div style={{ padding: 18, overflowY: "auto" }}>
				<label style={{ display: "flex", flexDirection: "column", marginBottom: 10, position: "relative" }}>
					<span style={lbl}>Institution *</span>
					<input
						style={{ ...iStyle, marginTop: 2 }}
						value={vals.institutionName}
						onChange={(e) => {
							setVals((v) => ({ ...v, institutionName: e.target.value }));
							setInstSuggestions(institutions.filter((i) => i.InstitutionName.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 6));
							setShowInstSug(true);
						}}
						onFocus={() => setShowInstSug(true)}
						onBlur={() => setTimeout(() => setShowInstSug(false), 150)}
						placeholder="e.g. University of Brawijaya"
					/>
					{showInstSug && instSuggestions.length > 0 && (
						<div
							style={{
								position: "absolute",
								top: "100%",
								left: 0,
								right: 0,
								zIndex: 50,
								background: "var(--color-surface)",
								border: "1px solid var(--color-border)",
								borderRadius: "var(--radius-sm)",
								marginTop: 2,
								overflow: "hidden",
							}}
						>
							{instSuggestions.map((i) => (
								<div
									key={i.InstID}
									onMouseDown={() => {
										setVals((v) => ({ ...v, institutionName: i.InstitutionName }));
										setShowInstSug(false);
									}}
									style={{ padding: "4px 8px", cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}
									onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
									onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
								>
									{i.InstitutionName}
								</div>
							))}
						</div>
					)}
				</label>
				<label style={{ display: "flex", flexDirection: "column", marginBottom: 10 }}>
					<span style={lbl}>Education Level</span>
					<select style={{ ...iStyle, marginTop: 2 }} value={vals.EduLevelID} onChange={set("EduLevelID")}>
						<option value="">— select —</option>
						{eduLevels.map((l) => (
							<option key={l.EduLevelID} value={l.EduLevelID}>
								{l.LevelName}
							</option>
						))}
					</select>
				</label>
				{showFaculty && (
					<label style={{ display: "flex", flexDirection: "column", marginBottom: 10 }}>
						<span style={lbl}>Faculty</span>
						<input style={{ ...iStyle, marginTop: 2 }} value={vals.Faculty} onChange={set("Faculty")} />
					</label>
				)}
				{showFieldOfStudy && (
					<label style={{ display: "flex", flexDirection: "column", marginBottom: 10 }}>
						<span style={lbl}>{fieldLabel}</span>
						<input style={{ ...iStyle, marginTop: 2 }} value={vals.FieldOfStudy} onChange={set("FieldOfStudy")} />
					</label>
				)}
				<label style={{ display: "flex", flexDirection: "column", marginBottom: 10 }}>
					<span style={lbl}>Start Year</span>
					<input style={{ ...iStyle, marginTop: 2 }} type="number" min="1900" max="2099" value={vals.StartYear} onChange={set("StartYear")} placeholder="e.g. 2018" />
				</label>
				{vals.StartYear && String(vals.StartYear).trim() && (
					<>
						{!vals.IsPresent && (
							<label style={{ display: "flex", flexDirection: "column", marginBottom: 10 }}>
								<span style={lbl}>End Year</span>
								<input style={{ ...iStyle, marginTop: 2 }} type="number" min="1900" max="2099" value={vals.EndYear} onChange={set("EndYear")} placeholder="e.g. 2022" />
							</label>
						)}
						<label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
							<input type="checkbox" checked={!!vals.IsPresent} onChange={(e) => setVals((v) => ({ ...v, IsPresent: e.target.checked, EndYear: e.target.checked ? "" : v.EndYear }))} />
							Currently enrolled
						</label>
					</>
				)}
			</div>
			<div style={{ padding: "10px 18px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
				<button style={btnG} onClick={onClose}>
					Cancel
				</button>
				<button style={btnP} onClick={handleSave}>
					Save
				</button>
			</div>
		</Modal>
	);
}

// ── Org popup ─────────────────────────────────────────────────────
function OrgPopup({ title, initial = {}, onSave, onClose, orgs = [] }) {
	const [vals, setVals] = useState({ orgName: "", Role: "", StartYear: "", EndYear: "", IsPresent: false, ...initial });
	const [orgSuggestions, setOrgSuggestions] = useState([]);
	const [showOrgSug, setShowOrgSug] = useState(false);
	const set = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.value }));

	const handleSave = async () => {
		let orgId = null;
		const name = vals.orgName.trim();
		if (name) orgId = await api.lookupFindOrCreateOrganization(name);
		onSave({ OrgID: orgId, Role: vals.Role, StartYear: vals.StartYear, EndYear: vals.EndYear, IsPresent: vals.IsPresent });
		onClose();
	};

	return (
		<Modal onClose={onClose} width={400}>
			<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", fontWeight: "bold", color: "var(--color-text)" }}>{title}</div>
			<div style={{ padding: 18 }}>
				<label style={{ display: "flex", flexDirection: "column", marginBottom: 10, position: "relative" }}>
					<span style={lbl}>Organization *</span>
					<input
						style={{ ...iStyle, marginTop: 2 }}
						value={vals.orgName}
						onChange={(e) => {
							setVals((v) => ({ ...v, orgName: e.target.value }));
							setOrgSuggestions(orgs.filter((o) => o.OrgName.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 6));
							setShowOrgSug(true);
						}}
						onFocus={() => setShowOrgSug(true)}
						onBlur={() => setTimeout(() => setShowOrgSug(false), 150)}
						placeholder="e.g. LPM Display"
					/>
					{showOrgSug && orgSuggestions.length > 0 && (
						<div
							style={{
								position: "absolute",
								top: "100%",
								left: 0,
								right: 0,
								zIndex: 50,
								background: "var(--color-surface)",
								border: "1px solid var(--color-border)",
								borderRadius: "var(--radius-sm)",
								marginTop: 2,
								overflow: "hidden",
							}}
						>
							{orgSuggestions.map((o) => (
								<div
									key={o.OrgID}
									onMouseDown={() => {
										setVals((v) => ({ ...v, orgName: o.OrgName }));
										setShowOrgSug(false);
									}}
									style={{ padding: "4px 8px", cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}
									onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
									onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
								>
									{o.OrgName}
								</div>
							))}
						</div>
					)}
				</label>
				<label style={{ display: "flex", flexDirection: "column", marginBottom: 10 }}>
					<span style={lbl}>Role / Division</span>
					<input style={{ ...iStyle, marginTop: 2 }} value={vals.Role} onChange={set("Role")} />
				</label>
				<label style={{ display: "flex", flexDirection: "column", marginBottom: 10 }}>
					<span style={lbl}>Start Year</span>
					<input style={{ ...iStyle, marginTop: 2 }} type="number" min="1900" max="2099" value={vals.StartYear} onChange={set("StartYear")} placeholder="e.g. 2020" />
				</label>
				{vals.StartYear && String(vals.StartYear).trim() && (
					<>
						{!vals.IsPresent && (
							<label style={{ display: "flex", flexDirection: "column", marginBottom: 10 }}>
								<span style={lbl}>End Year</span>
								<input style={{ ...iStyle, marginTop: 2 }} type="number" min="1900" max="2099" value={vals.EndYear} onChange={set("EndYear")} placeholder="e.g. 2024" />
							</label>
						)}
						<label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
							<input type="checkbox" checked={!!vals.IsPresent} onChange={(e) => setVals((v) => ({ ...v, IsPresent: e.target.checked, EndYear: e.target.checked ? "" : v.EndYear }))} />
							Currently working here
						</label>
					</>
				)}
			</div>
			<div style={{ padding: "10px 18px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
				<button style={btnG} onClick={onClose}>
					Cancel
				</button>
				<button style={btnP} onClick={handleSave}>
					Save
				</button>
			</div>
		</Modal>
	);
}

// ── Social row: platform label + chips + inline add ───────────────
function SocialRow({ plat, platformId, accs, onEdit, onDelete, onAdd }) {
	const [rowHovered, setRowHovered] = useState(false);
	const [addOpen, setAddOpen] = useState(false);
	const [addHandle, setAddHandle] = useState("");

	const commitAdd = async () => {
		if (!addHandle.trim()) {
			setAddOpen(false);
			return;
		}
		await onAdd(platformId, addHandle.trim());
		setAddHandle("");
		setAddOpen(false);
	};

	return (
		<div onMouseEnter={() => setRowHovered(true)} onMouseLeave={() => setRowHovered(false)} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "flex-start" }}>
			<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90, paddingTop: 4, flexShrink: 0 }}>{plat}</span>
			<div style={{ flex: 1, display: "flex", flexWrap: "wrap", alignItems: "center" }}>
				{accs.map((s) => (
					<SocialChip key={s.SocialID} social={s} onEdit={onEdit} onDelete={onDelete} />
				))}
				{addOpen ? (
					<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
						<input
							autoFocus
							value={addHandle}
							onChange={(e) => setAddHandle(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") commitAdd();
								if (e.key === "Escape") {
									setAddOpen(false);
									setAddHandle("");
								}
							}}
							onBlur={() =>
								setTimeout(() => {
									setAddOpen(false);
									setAddHandle("");
								}, 150)
							}
							placeholder="handle…"
							style={{
								padding: "2px 6px",
								border: "1px solid var(--color-accent)",
								borderRadius: "var(--radius-sm)",
								background: "var(--color-surface-2)",
								color: "var(--color-text)",
								fontSize: "var(--font-size-sm)",
								width: 110,
							}}
						/>
						<button
							onClick={commitAdd}
							style={{ padding: "1px 5px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 11 }}
						>
							✓
						</button>
					</span>
				) : (
					rowHovered && (
						<span
							onClick={() => setAddOpen(true)}
							style={{
								display: "inline-flex",
								alignItems: "center",
								padding: "2px 8px",
								borderRadius: "var(--radius-sm)",
								fontSize: "var(--font-size-sm)",
								cursor: "pointer",
								border: "1px dashed var(--color-border)",
								color: "var(--color-text-faint)",
								userSelect: "none",
							}}
						>
							+ Add
						</span>
					)
				)}
			</div>
		</div>
	);
}

// ── Platform select with Add New ──────────────────────────────────
function PlatformSelect({ platforms, value, onChange, onAddNew }) {
	const [addingNew, setAddingNew] = useState(false);
	const [newName, setNewName] = useState("");

	const commit = async () => {
		const name = newName.trim();
		if (!name) {
			setAddingNew(false);
			return;
		}
		const id = await onAddNew(name);
		onChange(id);
		setNewName("");
		setAddingNew(false);
	};

	if (addingNew)
		return (
			<div style={{ display: "flex", gap: 6 }}>
				<input
					autoFocus
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") commit();
						if (e.key === "Escape") {
							setAddingNew(false);
							setNewName("");
						}
					}}
					placeholder="Platform name"
					style={{ ...iStyle, flex: 1 }}
				/>
				<button onClick={commit} style={btnP}>
					Add
				</button>
				<button
					onClick={() => {
						setAddingNew(false);
						setNewName("");
					}}
					style={btnG}
				>
					✕
				</button>
			</div>
		);

	return (
		<select
			style={{ ...iStyle, width: "auto", minWidth: 120 }}
			value={value || ""}
			onChange={(e) => {
				if (e.target.value === "__new__") {
					setAddingNew(true);
					return;
				}
				onChange(e.target.value ? Number(e.target.value) : null);
			}}
		>
			<option value="">— platform —</option>
			{platforms.map((p) => (
				<option key={p.PlatformID} value={p.PlatformID}>
					{p.PlatformName}
				</option>
			))}
			<option value="__new__">+ Add new…</option>
		</select>
	);
}

// ── Main export ───────────────────────────────────────────────────
export default function DetailTab({ person, tags, socialAccounts, eduHistory, orgHistory, specifics, specTree, personId, lookups, onReload, reloadSpec, onOpenTag, specAddOpen, setSpecAddOpen }) {
	const [adding, setAdding] = useState(null);
	const [editingId, setEditingId] = useState(null);
	const [socialPlatformId, setSocialPlatformId] = useState(null);
	const [socialHandle, setSocialHandle] = useState("");

	const isAdding = (k) => adding === k;
	const isEditing = (t, id) => editingId?.type === t && editingId?.id === id;
	const stopAdding = () => {
		setAdding(null);
		setSocialPlatformId(null);
		setSocialHandle("");
	};
	const stopEditing = () => setEditingId(null);

	const allTagNames = lookups.tags.map((t) => t.TagName);
	const saveField = async (field, value) => {
		await api.personUpdate(personId, { ...person, [field]: value || null });
		onReload();
	};
	const saveTagsInline = async (tagNames) => {
		const ids = await Promise.all(tagNames.map((n) => api.lookupFindOrCreateTag(n)));
		await api.personSetTags(personId, ids);
		onReload();
	};

	return (
		<>
			{/* ── PRIMARY GROUP ── */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90 }}>Birthdate</span>
					<BirthdateField value={person.Birthdate} onSave={(v) => saveField("Birthdate", v)} />
				</div>
				<div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90 }}>Timezone</span>
					<TimezoneField value={person.TimezoneID} timezones={lookups.timezones} onSave={(v) => saveField("TimezoneID", v)} />
				</div>
				<InlineField label="Address" value={person.Address} onSave={(v) => saveField("Address", v)} placeholder="(click to add address)" />
				<InlineField label="Note" value={person.ImpressionNote} onSave={(v) => saveField("ImpressionNote", v)} textarea placeholder="(click to add note)" />
				<div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 5 }}>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90, paddingTop: 6 }}>Tags</span>
					<div style={{ flex: 1 }}>
						<TagInput value={tags.map((t) => t.TagName)} allTags={allTagNames} onChange={saveTagsInline} onTagClick={onOpenTag} />
					</div>
				</div>
			</div>

			<div style={divider} />

			{/* ── SPECIFICS ── */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={secTitle}>Specifics</div>
					{!specAddOpen && (
						<button onClick={() => setSpecAddOpen(true)} style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }}>
							+ Add
						</button>
					)}
				</div>
				<SpecificsEditor specifics={specifics} tree={specTree} personId={personId} onReload={reloadSpec} addOpen={specAddOpen} onAddClose={() => setSpecAddOpen(false)} />
			</div>

			<div style={divider} />

			{/* ── ORGANIZATION ── */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={secTitle}>Organizations / Employment</div>
					<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("org")}>
						+ Add
					</button>
				</div>
				{isAdding("org") && (
					<OrgPopup
						title="Add Organization"
						orgs={lookups.orgs}
						onSave={async (v) => {
							await orgCreate({ PersonID: personId, ...v });
							onReload();
						}}
						onClose={stopAdding}
					/>
				)}
				{orgHistory.map((o) => {
					const org = o.OrgName || "—";
					const role = o.Role || "";
					const startYr = o.StartYear ? String(o.StartYear) : "";
					const endYr = o.IsPresent ? "present" : o.EndYear ? String(o.EndYear) : "";
					const years = startYr ? (endYr ? `${startYr} – ${endYr}` : startYr) : "";
					return (
						<div key={o.OrgHistID}>
							{isEditing("org", o.OrgHistID) ? (
								<OrgPopup
									title="Edit Organization"
									orgs={lookups.orgs}
									initial={{
										orgName: o.OrgName || "",
										Role: o.Role || "",
										StartYear: o.StartYear ? String(o.StartYear) : "",
										EndYear: o.EndYear ? String(o.EndYear) : "",
										IsPresent: !!o.IsPresent,
									}}
									onSave={async (v) => {
										await orgUpdate(o.OrgHistID, v);
										onReload();
									}}
									onClose={stopEditing}
								/>
							) : (
								<HoverRow
									onEdit={() => setEditingId({ type: "org", id: o.OrgHistID })}
									onDelete={async () => {
										await orgDelete(o.OrgHistID);
										onReload();
									}}
								>
									<div>
										<strong style={{ color: "var(--color-text)" }}>{org}</strong>
										{role && <span style={{ color: "var(--color-text-muted)" }}> ({role})</span>}
										{years && <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>{years}</div>}
									</div>
								</HoverRow>
							)}
						</div>
					);
				})}
				{orgHistory.length === 0 && !isAdding("org") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>

			<div style={divider} />

			{/* ── EDUCATION ── */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={secTitle}>Education</div>
					<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("edu")}>
						+ Add
					</button>
				</div>
				{isAdding("edu") && (
					<EduPopup
						title="Add Education"
						eduLevels={lookups.eduLevels}
						institutions={lookups.institutions}
						onSave={async (v) => {
							await eduCreate({ PersonID: personId, ...v });
							onReload();
						}}
						onClose={stopAdding}
					/>
				)}
				{eduHistory.map((e) => {
					const inst = e.InstitutionName || "—";
					const level = e.EduLevelName || "";
					const startYr = e.StartYear ? String(e.StartYear) : "";
					const endYr = e.IsPresent ? "present" : e.EndYear ? String(e.EndYear) : "";
					const years = startYr ? (endYr ? `${startYr} – ${endYr}` : startYr) : "";
					const extra = [e.Faculty, e.FieldOfStudy].filter(Boolean).join(" · ");
					return (
						<div key={e.EduHistID}>
							{isEditing("edu", e.EduHistID) ? (
								<EduPopup
									title="Edit Education"
									eduLevels={lookups.eduLevels}
									institutions={lookups.institutions}
									initial={{
										institutionName: e.InstitutionName || "",
										EduLevelID: e.EduLevelID ? String(e.EduLevelID) : "",
										Faculty: e.Faculty || "",
										FieldOfStudy: e.FieldOfStudy || "",
										StartYear: e.StartYear ? String(e.StartYear) : "",
										EndYear: e.EndYear ? String(e.EndYear) : "",
										IsPresent: !!e.IsPresent,
									}}
									onSave={async (v) => {
										await eduUpdate(e.EduHistID, v);
										onReload();
									}}
									onClose={stopEditing}
								/>
							) : (
								<HoverRow
									onEdit={() => setEditingId({ type: "edu", id: e.EduHistID })}
									onDelete={async () => {
										await eduDelete(e.EduHistID);
										onReload();
									}}
								>
									<div>
										<strong style={{ color: "var(--color-text)" }}>{inst}</strong>
										{level && (
											<span
												style={{
													marginLeft: 6,
													fontSize: "var(--font-size-xs)",
													background: "var(--color-surface-3)",
													padding: "1px 5px",
													borderRadius: "var(--radius-sm)",
													color: "var(--color-text-muted)",
												}}
											>
												{level}
											</span>
										)}
										{years && <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>{years}</div>}
										{extra && <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>{extra}</div>}
									</div>
								</HoverRow>
							)}
						</div>
					);
				})}
				{eduHistory.length === 0 && !isAdding("edu") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>

			<div style={divider} />

			{/* ── SOCIALS ── */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={secTitle}>Socials</div>
					<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("social")}>
						+ Add
					</button>
				</div>
				{isAdding("social") && (
					<div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10, flexWrap: "wrap" }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
							<span style={lbl}>Platform</span>
							<PlatformSelect
								platforms={lookups.platforms}
								value={socialPlatformId}
								onChange={setSocialPlatformId}
								onAddNew={async (name) => {
									const id = await api.lookupAddSocialPlatform(name);
									return id;
								}}
							/>
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 120 }}>
							<span style={lbl}>Handle (without @)</span>
							<input
								style={iStyle}
								value={socialHandle}
								onChange={(e) => setSocialHandle(e.target.value)}
								placeholder="personguy2000"
								onKeyDown={async (e) => {
									if (e.key === "Enter" && socialPlatformId && socialHandle.trim()) {
										await socialCreate({ PersonID: personId, PlatformID: socialPlatformId, AccountTag: socialHandle.trim() });
										stopAdding();
										onReload();
									}
									if (e.key === "Escape") stopAdding();
								}}
							/>
						</div>
						<div style={{ display: "flex", gap: 6 }}>
							<button
								style={btnP}
								onClick={async () => {
									if (!socialPlatformId || !socialHandle.trim()) return;
									await socialCreate({ PersonID: personId, PlatformID: socialPlatformId, AccountTag: socialHandle.trim() });
									stopAdding();
									onReload();
								}}
							>
								Add
							</button>
							<button style={btnG} onClick={stopAdding}>
								Cancel
							</button>
						</div>
					</div>
				)}
				{(() => {
					const byPlat = {};
					socialAccounts.forEach((s) => {
						if (!byPlat[s.PlatformName]) byPlat[s.PlatformName] = [];
						byPlat[s.PlatformName].push(s);
					});
					return Object.entries(byPlat).map(([plat, accs]) => (
						<SocialRow
							key={plat}
							plat={plat}
							platformId={accs[0]?.PlatformID}
							accs={accs}
							onEdit={async (id, handle) => {
								await socialUpdate(id, handle);
								onReload();
							}}
							onDelete={async (id) => {
								await socialDelete(id);
								onReload();
							}}
							onAdd={async (platId, handle) => {
								await socialCreate({ PersonID: personId, PlatformID: platId, AccountTag: handle });
								onReload();
							}}
						/>
					));
				})()}
				{socialAccounts.length === 0 && !isAdding("social") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>
		</>
	);
}
