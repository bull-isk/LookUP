// renderer/src/pages/PersonDetail.jsx
import { useState, useEffect, useCallback, useRef } from "react";
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
	socialUpdate,
	socialDelete,
	mediaCreate,
	mediaLink,
	mediaUnlink,
} from "../api/bridge";
import SpecificsEditor from "../components/SpecificsEditor";
import TagInput from "../components/TagInput";
import PronounInput from "../components/PronounInput";
import CategoryInput from "../components/CategoryInput";
import SocialChip from "../components/SocialChip";
import QuickAdd from "../components/QuickAdd";
import MediaCard from "../components/MediaCard";

const api = window.electronAPI;

// ── Helpers ───────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);

// ── Shared styles ─────────────────────────────────────────────────
const iStyle = {
	padding: "4px 6px",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-sm)",
	background: "var(--color-surface-2)",
	color: "var(--color-text)",
	width: "100%",
};
const btnP = { padding: "4px 12px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" };
const btnD = { padding: "3px 8px", background: "var(--color-danger)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" };
const btnG = { padding: "3px 8px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)", cursor: "pointer" };
const divider = { borderTop: "1px solid var(--color-border)", margin: "14px 0" };
const secTitle = { fontSize: "var(--font-size-xs)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, color: "var(--color-accent)", marginBottom: 8 };
const lbl = { fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", marginBottom: 2, display: "block" };

// ── Overlay modal ─────────────────────────────────────────────────
function Modal({ children, onClose, width = 420 }) {
	return (
		<div
			onClick={onClose}
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.65)",
				zIndex: 500,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "var(--color-surface)", // solid, NOT transparent
					border: "1px solid var(--color-border-2)",
					borderRadius: "var(--radius-lg)",
					boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
					width,
					maxHeight: "85vh",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
				{children}
			</div>
		</div>
	);
}

// ── Hover-reveal edit/delete (for non-chip rows) ──────────────────
function HoverRow({ children, onEdit, onDelete }) {
	const [h, setH] = useState(false);
	return (
		<div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "3px 0" }}>
			<div style={{ flex: 1 }}>{children}</div>
			<div style={{ display: "flex", gap: 4, opacity: h ? 1 : 0, transition: "opacity 0.12s", flexShrink: 0 }}>
				{onEdit && (
					<button style={btnG} onClick={onEdit}>
						✏
					</button>
				)}
				{onDelete && (
					<button style={btnD} onClick={onDelete}>
						✕
					</button>
				)}
			</div>
		</div>
	);
}

// ── Click-to-edit inline field ────────────────────────────────────
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
		<div onClick={() => setEditing(true)} title="Click to edit" style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 5, cursor: "pointer" }}>
			<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90, paddingTop: 2 }}>{label}</span>
			<span style={{ flex: 1, color: value ? "var(--color-text)" : "var(--color-text-faint)", fontStyle: value ? "normal" : "italic" }}>{value || placeholder || `(click to add)`}</span>
			<span style={{ color: "var(--color-text-faint)", fontSize: 10, opacity: 0.4 }}>✏</span>
		</div>
	);
}

// ── Popup form (education, org, quotes, notes, wm, media) ─────────
function PopupForm({ title, fields, initial = {}, onSave, onClose }) {
	const [vals, setVals] = useState(initial);
	const set = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.value }));
	const setChecked = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.checked }));
	return (
		<Modal onClose={onClose} width={440}>
			<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", fontWeight: "bold", color: "var(--color-text)" }}>{title}</div>
			<div style={{ padding: 18, overflowY: "auto" }}>
				{fields.map((f) => {
					if (f.type === "checkbox")
						return (
							<label
								key={f.key}
								style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}
							>
								<input type="checkbox" checked={!!vals[f.key]} onChange={setChecked(f.key)} />
								{f.label}
							</label>
						);
					if (f.type === "select")
						return (
							<label key={f.key} style={{ display: "flex", flexDirection: "column", marginBottom: 10, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
								{f.label}
								<select style={{ ...iStyle, marginTop: 3 }} value={vals[f.key] || ""} onChange={set(f.key)}>
									<option value="">— select —</option>
									{f.options.map((o) => (
										<option key={o} value={o}>
											{o}
										</option>
									))}
								</select>
							</label>
						);
					return (
						<label key={f.key} style={{ display: "flex", flexDirection: "column", marginBottom: 10, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
							{f.label}
							{f.textarea ? (
								<textarea style={{ ...iStyle, marginTop: 3, height: 60, resize: "vertical" }} value={vals[f.key] || ""} onChange={set(f.key)} />
							) : (
								<input style={{ ...iStyle, marginTop: 3 }} type={f.inputType || "text"} value={vals[f.key] || ""} onChange={set(f.key)} />
							)}
						</label>
					);
				})}
			</div>
			<div style={{ padding: "10px 18px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
				<button style={btnG} onClick={onClose}>
					Cancel
				</button>
				<button
					style={btnP}
					onClick={() => {
						onSave(vals);
						onClose();
					}}
				>
					Save
				</button>
			</div>
		</Modal>
	);
}

// ADD before the PersonDetail export:
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

function EduPopup({ title, initial = {}, onSave, onClose, eduLevels = [], institutions = [] }) {
	const [vals, setVals] = useState({
		institutionName: "", // display name — resolved to InstID on save
		EduLevelID: "",
		Faculty: "",
		FieldOfStudy: "",
		StartYear: "",
		EndYear: "",
		IsPresent: false,
		...initial,
	});
	const [instSuggestions, setInstSuggestions] = useState([]);
	const [showInstSug, setShowInstSug] = useState(false);
	const set = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.value }));

	// Filter institution suggestions as user types
	const handleInstChange = (val) => {
		setVals((v) => ({ ...v, institutionName: val }));
		setInstSuggestions(institutions.filter((i) => i.InstitutionName.toLowerCase().includes(val.toLowerCase())).slice(0, 6));
		setShowInstSug(true);
	};

	const selectedLevel = eduLevels.find((l) => String(l.EduLevelID) === String(vals.EduLevelID));
	const levelName = selectedLevel?.LevelName || "";
	const showFieldOfStudy = levelName === "College" || levelName === "High School";
	const showFaculty = levelName === "College";
	const fieldLabel = levelName === "High School" ? "Subject Focus" : "Major";

	const handleSave = async () => {
		// Resolve InstID: find-or-create based on typed name
		let instId = null;
		const instName = vals.institutionName.trim();
		if (instName) {
			instId = await window.electronAPI.lookupFindOrCreateInstitution(instName);
		}
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
				{/* Institution — autocomplete from AcademicInst table */}
				<label style={{ display: "flex", flexDirection: "column", marginBottom: 10, position: "relative" }}>
					<span style={lbl}>Institution *</span>
					<input
						style={{ ...iStyle, marginTop: 2 }}
						value={vals.institutionName}
						onChange={(e) => handleInstChange(e.target.value)}
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

				{/* Education Level — from DB */}
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

function OrgPopup({ title, initial = {}, onSave, onClose, orgs = [] }) {
	const [vals, setVals] = useState({
		orgName: "", // display name — resolved to OrgID on save
		Role: "",
		StartYear: "",
		EndYear: "",
		IsPresent: false,
		...initial,
	});
	const [orgSuggestions, setOrgSuggestions] = useState([]);
	const [showOrgSug, setShowOrgSug] = useState(false);
	const set = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.value }));

	const handleOrgChange = (val) => {
		setVals((v) => ({ ...v, orgName: val }));
		setOrgSuggestions(orgs.filter((o) => o.OrgName.toLowerCase().includes(val.toLowerCase())).slice(0, 6));
		setShowOrgSug(true);
	};

	const handleSave = async () => {
		let orgId = null;
		const orgName = vals.orgName.trim();
		if (orgName) {
			orgId = await window.electronAPI.lookupFindOrCreateOrganization(orgName);
		}
		onSave({
			OrgID: orgId,
			Role: vals.Role,
			StartYear: vals.StartYear,
			EndYear: vals.EndYear,
			IsPresent: vals.IsPresent,
		});
		onClose();
	};

	return (
		<Modal onClose={onClose} width={400}>
			<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", fontWeight: "bold", color: "var(--color-text)" }}>{title}</div>
			<div style={{ padding: 18 }}>
				{/* Organization name — autocomplete */}
				<label style={{ display: "flex", flexDirection: "column", marginBottom: 10, position: "relative" }}>
					<span style={lbl}>Organization *</span>
					<input
						style={{ ...iStyle, marginTop: 2 }}
						value={vals.orgName}
						onChange={(e) => handleOrgChange(e.target.value)}
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

// ── Timezone field: static text → dropdown on click ───────────────
function TimezoneField({ value, timezones, onSave }) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState(value || "");
	const ref = useRef(null);

	useEffect(() => {
		setDraft(value || "");
	}, [value]);

	// Close on outside click
	useEffect(() => {
		if (!open) return;
		const h = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", h);
		return () => document.removeEventListener("mousedown", h);
	}, [open]);

	const currentTz = timezones.find((t) => t.TimezoneID === value);

	if (!open) {
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
	}

	return (
		<span ref={ref}>
			<select
				autoFocus
				style={{ ...iStyle, width: "auto" }}
				value={value || ""}
				onChange={(e) => {
					const v = e.target.value ? Number(e.target.value) : null;
					onSave(v);
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
		</span>
	);
}

// ── Platform dropdown with Add New ────────────────────────────────
function PlatformSelect({ platforms, value, onChange, onAddNew }) {
	const [addingNew, setAddingNew] = useState(false);
	const [newName, setNewName] = useState("");

	const handleSelect = (e) => {
		const v = e.target.value;
		if (v === "__new__") {
			setAddingNew(true);
			return;
		}
		onChange(v ? Number(v) : null);
	};

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
		<select style={{ ...iStyle, width: "auto", minWidth: 120 }} value={value || ""} onChange={handleSelect}>
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

// Profile picture strip — shown in header
// primary: large circle, secondary: two smaller circles
function ProfilePictures({ media, personId, onReload }) {
	const primary = media.find((m) => m.Role === "primary");
	const secondaries = media.filter((m) => m.Role === "secondary");

	const circle = (m, size, borderColor) => (
		<div
			key={m ? m.MediaID : "empty"}
			style={{
				width: size,
				height: size,
				borderRadius: "50%",
				border: `2px solid ${borderColor}`,
				overflow: "hidden",
				flexShrink: 0,
				background: "var(--color-surface-3)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{m?.Data ? <img src={m.Data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "var(--color-text-faint)", fontSize: size * 0.35 }}>?</span>}
		</div>
	);

	return (
		<div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginRight: 12 }}>
			{/* Primary — 64px */}
			{circle(primary, 64, "var(--color-primary)")}

			{/* Secondary — two 36px circles stacked */}
			<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
				{circle(secondaries[0] || null, 36, "var(--color-accent)")}
				{circle(secondaries[1] || null, 36, "var(--color-accent)")}
			</div>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════
export default function PersonDetail({ personId, onDeleted, onOpenTag }) {
	const [data, setData] = useState(null);
	const [lookups, setLookups] = useState(null);
	const [specifics, setSpecifics] = useState([]);
	const [specTree, setSpecTree] = useState([]);
	const [innerTab, setInnerTab] = useState("Details");
	const [adding, setAdding] = useState(null);
	const [editingId, setEditingId] = useState(null);
	const [quickAdd, setQuickAdd] = useState(false);

	const [specAddOpen, setSpecAddOpen] = useState(false);

	// Socials add state
	const [socialPlatformId, setSocialPlatformId] = useState(null);
	const [socialHandle, setSocialHandle] = useState("");

	// Settings
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [settingsPanel, setSettingsPanel] = useState(null);
	const [deleteInput, setDeleteInput] = useState("");
	const [headerDraft, setHeaderDraft] = useState({});
	const settingsRef = useRef(null);

	const reload = useCallback(async () => {
		const [d, sp] = await Promise.all([personFull(personId), api.specificsForPerson(personId)]);
		setData(d);
		setSpecifics(sp);
	}, [personId]);

	const reloadSpec = useCallback(() => api.specificsForPerson(personId).then(setSpecifics), [personId]);
	const refreshLookups = () => lookupAll().then(setLookups);

	useEffect(() => {
		reload();
		lookupAll().then(setLookups);
		api.specificsTree().then(setSpecTree);
	}, [reload]);

	// Ctrl+N
	useEffect(() => {
		const h = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "n") {
				e.preventDefault();
				setQuickAdd(true);
			}
			if (e.key === "Escape") {
				setQuickAdd(false);
				setSettingsOpen(false);
				setSettingsPanel(null);
			}
		};
		window.addEventListener("keydown", h);
		return () => window.removeEventListener("keydown", h);
	}, []);

	// Settings dropdown: close on outside click
	useEffect(() => {
		const h = (e) => {
			if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
		};
		document.addEventListener("mousedown", h);
		return () => document.removeEventListener("mousedown", h);
	}, []);

	if (!data || !lookups) return <div style={{ padding: 20, color: "var(--color-text-muted)" }}>Loading…</div>;

	const { person, pronouns, tags, socialAccounts, eduHistory, orgHistory, notes, quotes, wordMouths, media } = data;

	// ── Primary field saves ───────────────────────────────────────
	const saveField = async (field, value) => {
		await personUpdate(personId, { ...person, [field]: value || null });
		reload();
	};
	const saveTagsInline = async (tagNames) => {
		const ids = await Promise.all(tagNames.map((n) => api.lookupFindOrCreateTag(n)));
		await api.personSetTags(personId, ids);
		reload();
	};

	// ── Social: add new platform to DB ───────────────────────────
	const addNewPlatform = async (name) => {
		// Insert a new platform with no URL template — basic fallback
		const db = await api.lookupAll();
		// Use IPC to insert (reuse addCategory pattern)
		// We'll do it via a direct preload call
		const newPlatId = await window.electronAPI.lookupAddSocialPlatform(name);
		refreshLookups();
		return newPlatId;
	};

	// ── Social chip: edit handle ──────────────────────────────────
	const handleSocialEdit = async (socialId, newHandle) => {
		await socialUpdate(socialId, newHandle);
		reload();
	};

	// ── Settings ─────────────────────────────────────────────────
	const openEditHeader = () => {
		setHeaderDraft({ FullName: person.FullName || "", Nickname: person.Nickname || "", CategoryID: person.CategoryID || null, pronounIds: pronouns.map((p) => p.PronounsID) });
		setSettingsPanel("editHeader");
		setSettingsOpen(false);
	};
	const saveHeader = async () => {
		await personUpdate(personId, { ...person, FullName: headerDraft.FullName || person.FullName, Nickname: headerDraft.Nickname || null, CategoryID: headerDraft.CategoryID || null });
		await api.personSetPronouns(personId, headerDraft.pronounIds || []);
		await api.lookupPrunePronouns();
		await api.lookupPruneCategories();
		setSettingsPanel(null);
		reload();
		refreshLookups();
	};
	const handleDelete = async () => {
		if (deleteInput.trim() !== person.FullName) return;
		await personDelete(personId);
		onDeleted();
	};

	const isAdding = (k) => adding === k;
	const isEditing = (t, id) => editingId?.type === t && editingId?.id === id;
	const stopAdding = () => {
		setAdding(null);
		setSocialPlatformId(null);
		setSocialHandle("");
	};
	const stopEditing = () => setEditingId(null);
	const allTagNames = lookups.tags.map((t) => t.TagName);
	const sayerOpts = lookups.persons.filter((p) => p.PersonID !== personId);

	// ── DETAILS TAB ───────────────────────────────────────────────
	// ORDER: Primary → Specifics → Organization → Education → Socials
	const renderDetails = () => (
		<>
			{/* ── PRIMARY GROUP ── */}
			<div style={{ marginBottom: 16 }}>
				{/* Birthdate */}
				<div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90 }}>Birthdate</span>
					<BirthdateField value={person.Birthdate} onSave={(v) => saveField("Birthdate", v)} />
				</div>

				{/* Timezone — static text → dropdown on click */}
				<div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90 }}>Timezone</span>
					<TimezoneField value={person.TimezoneID} timezones={lookups.timezones} onSave={(v) => saveField("TimezoneID", v)} />
				</div>

				{/* Address */}
				<InlineField label="Address" value={person.Address} onSave={(v) => saveField("Address", v)} placeholder="(click to add address)" />

				{/* Impression Note */}
				<InlineField label="Note" value={person.ImpressionNote} onSave={(v) => saveField("ImpressionNote", v)} textarea placeholder="(click to add note)" />

				{/* Tags */}
				<div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 5 }}>
					<span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", minWidth: 90, paddingTop: 6 }}>Tags</span>
					<div style={{ flex: 1 }}>
						<TagInput value={tags.map((t) => t.TagName)} allTags={allTagNames} onChange={saveTagsInline} onTagClick={onOpenTag} />{" "}
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

			{/* ── ORGANIZATION / EMPLOYMENT ── */}
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
							reload();
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
										reload();
									}}
									onClose={stopEditing}
								/>
							) : (
								<HoverRow
									onEdit={() => setEditingId({ type: "org", id: o.OrgHistID })}
									onDelete={async () => {
										await orgDelete(o.OrgHistID);
										reload();
									}}
								>
									<div>
										<span>
											<strong style={{ color: "var(--color-text)" }}>{org}</strong>
											{role && <span style={{ color: "var(--color-text-muted)" }}> ({role})</span>}
										</span>
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
							reload();
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
										reload();
									}}
									onClose={stopEditing}
								/>
							) : (
								<HoverRow
									onEdit={() => setEditingId({ type: "edu", id: e.EduHistID })}
									onDelete={async () => {
										await eduDelete(e.EduHistID);
										reload();
									}}
								>
									<div>
										<span>
											<strong style={{ color: "var(--color-text)" }}>{inst}</strong>
										</span>
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

				{/* Add social: platform dropdown + handle input inline */}
				{isAdding("social") && (
					<div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10, flexWrap: "wrap" }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
							<span style={lbl}>Platform</span>
							<PlatformSelect
								platforms={lookups.platforms}
								value={socialPlatformId}
								onChange={setSocialPlatformId}
								onAddNew={async (name) => {
									const id = await window.electronAPI.lookupAddSocialPlatform(name);
									refreshLookups();
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
										reload();
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
									reload();
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

				{/* Social chips grouped by platform */}
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
							onEdit={handleSocialEdit}
							onDelete={async (id) => {
								await socialDelete(id);
								reload();
							}}
							onAdd={async (platId, handle) => {
								await socialCreate({ PersonID: personId, PlatformID: platId, AccountTag: handle });
								reload();
							}}
						/>
					));
				})()}
				{socialAccounts.length === 0 && !isAdding("social") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>
		</>
	);

	// ── TEXT TAB ─────────────────────────────────────────────────
	const renderText = () => (
		<>
			{/* QUOTES */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={secTitle}>Quotes</div>
					<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("quote")}>
						+ Add
					</button>
				</div>
				{isAdding("quote") && (
					<PopupForm
						title="Add Quote"
						fields={[
							{ key: "Quote", label: "Quote", textarea: true },
							{ key: "Date", label: "Date", inputType: "date" },
						]}
						initial={{ Date: today() }} // default to today
						onSave={async (v) => {
							await quoteCreate({ PersonID: personId, Quote: v.Quote, Date: v.Date || null });
							reload();
						}}
						onClose={stopAdding}
					/>
				)}
				{quotes.map((q) => (
					<div key={q.QuoteID}>
						{isEditing("quote", q.QuoteID) ? (
							<PopupForm
								title="Edit Quote"
								fields={[
									{ key: "Quote", label: "Quote", textarea: true },
									{ key: "Date", label: "Date", inputType: "date" },
								]}
								initial={{ Quote: q.Quote, Date: q.Date || today() }}
								onSave={async (v) => {
									await quoteUpdate(q.QuoteID, { Quote: v.Quote, Date: v.Date || null });
									reload();
								}}
								onClose={stopEditing}
							/>
						) : (
							<HoverRow
								onEdit={() => setEditingId({ type: "quote", id: q.QuoteID })}
								onDelete={async () => {
									await quoteDelete(q.QuoteID);
									reload();
								}}
							>
								<div>
									<em>"{q.Quote}"</em>
									{q.Date && <span style={{ color: "var(--color-text-faint)", marginLeft: 8, fontSize: "var(--font-size-xs)" }}>{q.Date}</span>}
								</div>
							</HoverRow>
						)}
					</div>
				))}
				{quotes.length === 0 && !isAdding("quote") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>

			<div style={divider} />

			{/* NOTES */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={secTitle}>Notes</div>
					<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("note")}>
						+ Add
					</button>
				</div>
				{isAdding("note") && (
					<PopupForm
						title="Add Note"
						fields={[{ key: "Note", label: "Note", textarea: true }]}
						onSave={async (v) => {
							await noteCreate({ PersonID: personId, Note: v.Note });
							reload();
						}}
						onClose={stopAdding}
					/>
				)}
				{notes.map((n) => (
					<div key={n.NotesID}>
						{isEditing("note", n.NotesID) ? (
							<PopupForm
								title="Edit Note"
								fields={[{ key: "Note", label: "Note", textarea: true }]}
								initial={{ Note: n.Note }}
								onSave={async (v) => {
									await noteUpdate(n.NotesID, { Note: v.Note });
									reload();
								}}
								onClose={stopEditing}
							/>
						) : (
							<HoverRow
								onEdit={() => setEditingId({ type: "note", id: n.NotesID })}
								onDelete={async () => {
									await noteDelete(n.NotesID);
									reload();
								}}
							>
								<div style={{ display: "flex", gap: 6 }}>
									<span style={{ color: "var(--color-text-muted)" }}>•</span>
									<span>{n.Note}</span>
								</div>
							</HoverRow>
						)}
					</div>
				))}
				{notes.length === 0 && !isAdding("note") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>

			<div style={divider} />

			{/* HE SAID / SHE SAID */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={secTitle}>He Said / She Said</div>
					<button style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }} onClick={() => setAdding("wm")}>
						+ Add
					</button>
				</div>
				{isAdding("wm") && (
					<PopupForm
						title="Add He Said / She Said"
						fields={[
							{ key: "Quote", label: "Quote", textarea: true },
							{ key: "Speaker", label: "Speaker (optional name)" },
							{ key: "Date", label: "Date", inputType: "date" },
						]}
						initial={{ Date: today() }} // default to today
						onSave={async (v) => {
							const match = sayerOpts.find((p) => p.FullName.toLowerCase() === (v.Speaker || "").trim().toLowerCase());
							await wmCreate({ PersonID: personId, SayerID: match?.PersonID || null, Quote: v.Quote, Date: v.Date || null });
							reload();
						}}
						onClose={stopAdding}
					/>
				)}
				{wordMouths.map((w) => (
					<div key={w.WordMouthID}>
						{isEditing("wm", w.WordMouthID) ? (
							<PopupForm
								title="Edit He Said / She Said"
								fields={[
									{ key: "Quote", label: "Quote", textarea: true },
									{ key: "Speaker", label: "Speaker" },
									{ key: "Date", label: "Date", inputType: "date" },
								]}
								initial={{ Quote: w.Quote, Speaker: w.SayerName || "", Date: w.Date || today() }}
								onSave={async (v) => {
									const match = sayerOpts.find((p) => p.FullName.toLowerCase() === (v.Speaker || "").trim().toLowerCase());
									await wmUpdate(w.WordMouthID, { SayerID: match?.PersonID || null, Quote: v.Quote, Date: v.Date || null });
									reload();
								}}
								onClose={stopEditing}
							/>
						) : (
							<HoverRow
								onEdit={() => setEditingId({ type: "wm", id: w.WordMouthID })}
								onDelete={async () => {
									await wmDelete(w.WordMouthID);
									reload();
								}}
							>
								<div>
									<em>"{w.Quote}"</em>
									<div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", marginTop: 2 }}>
										{w.SayerName || "anonymous"}
										{w.Date && <span style={{ marginLeft: 8, color: "var(--color-text-faint)" }}>{w.Date}</span>}
									</div>
								</div>
							</HoverRow>
						)}
					</div>
				))}
				{wordMouths.length === 0 && !isAdding("wm") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>None</div>}
			</div>
		</>
	);

	// ── MEDIA TAB ─────────────────────────────────────────────────
	const renderMedia = () => {
		const handlePick = async () => {
			const picked = await window.electronAPI.mediaPick();
			if (!picked?.length) return;
			const date = new Date().toISOString().slice(0, 10);
			for (const { filename, dataUri } of picked) {
				const mid = await mediaCreate({ FilePath: filename, Date: date, Data: dataUri });
				await mediaLink(personId, mid);
			}
			reload();
		};

		const primary = media.find((m) => m.Role === "primary");
		const secondaries = media.filter((m) => m.Role === "secondary");
		const rest = media.filter((m) => !m.Role);

		return (
			<div>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
					<div style={secTitle}>Media</div>
					<button onClick={handlePick} style={{ ...btnG, fontSize: "var(--font-size-xs)", padding: "2px 8px" }}>
						+ Add Images
					</button>
				</div>

				{media.length === 0 ? (
					<div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "var(--font-size-sm)" }}>No images yet. Click "+ Add Images" to pick from your files.</div>
				) : (
					<>
						{/* Profile pictures section */}
						{(primary || secondaries.length > 0) && (
							<div style={{ marginBottom: 16 }}>
								<div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Profile Pictures</div>
								<div style={{ display: "flex", gap: 10 }}>
									{/* Primary slot */}
									<div style={{ width: 100 }}>
										<div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-faint)", marginBottom: 4 }}>★ Main</div>
										{primary ? (
											<MediaCard m={primary} personId={personId} onReload={reload} />
										) : (
											<div
												style={{
													width: "100%",
													aspectRatio: "1",
													border: "1px dashed var(--color-border)",
													borderRadius: "var(--radius-md)",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													color: "var(--color-text-faint)",
													fontSize: "var(--font-size-xs)",
													textAlign: "center",
													padding: 8,
												}}
											>
												No main photo
											</div>
										)}
									</div>
									{/* Secondary slots */}
									<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
										<div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-faint)", marginBottom: 0 }}>◆ Secondary</div>
										{[0, 1].map((i) => (
											<div key={i} style={{ width: 80 }}>
												{secondaries[i] ? (
													<MediaCard m={secondaries[i]} personId={personId} onReload={reload} />
												) : (
													<div
														style={{
															width: "100%",
															aspectRatio: "1",
															border: "1px dashed var(--color-border)",
															borderRadius: "var(--radius-md)",
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															color: "var(--color-text-faint)",
															fontSize: "var(--font-size-xs)",
														}}
													>
														—
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							</div>
						)}

						{/* All images grid */}
						<div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
							All Images — hover to assign role
						</div>
						<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
							{media.map((m) => (
								<MediaCard key={m.MediaID} m={m} personId={personId} onReload={reload} />
							))}
						</div>
					</>
				)}
			</div>
		);
	};

	// ── MAIN RENDER ───────────────────────────────────────────────
	return (
		<div style={{ position: "relative", paddingBottom: 70 }}>
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

			{/* ── Modals ──────────────────────────────────────────── */}
			{settingsPanel === "editHeader" && (
				<Modal onClose={() => setSettingsPanel(null)} width={460}>
					<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", fontWeight: "bold", color: "var(--color-text)" }}>Edit Header Info</div>
					<div style={{ padding: 18, overflowY: "auto" }}>
						<label style={{ display: "block", marginBottom: 12, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
							Full Name *
							<input style={{ ...iStyle, marginTop: 3 }} value={headerDraft.FullName || ""} onChange={(e) => setHeaderDraft((d) => ({ ...d, FullName: e.target.value }))} />
						</label>
						<label style={{ display: "block", marginBottom: 12, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
							Nickname
							<input style={{ ...iStyle, marginTop: 3 }} value={headerDraft.Nickname || ""} onChange={(e) => setHeaderDraft((d) => ({ ...d, Nickname: e.target.value }))} />
						</label>
						<label style={{ display: "block", marginBottom: 12, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
							Category
							<div style={{ marginTop: 4 }}>
								<CategoryInput
									value={headerDraft.CategoryID}
									categories={lookups.categories}
									onChange={(id) => setHeaderDraft((d) => ({ ...d, CategoryID: id }))}
									onNewCategory={async (name) => {
										const id = await api.lookupFindOrCreateCategory(name);
										refreshLookups();
										return id;
									}}
								/>
							</div>
						</label>
						<div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", marginBottom: 6 }}>Pronouns</div>
						<PronounInput
							value={headerDraft.pronounIds || []}
							allPronouns={lookups.pronouns}
							onChange={(ids) => setHeaderDraft((d) => ({ ...d, pronounIds: ids }))}
							onNewPronoun={async (text) => {
								const id = await api.lookupFindOrCreatePronoun(text);
								refreshLookups();
								return id;
							}}
						/>
					</div>
					<div style={{ padding: "10px 18px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
						<button style={btnG} onClick={() => setSettingsPanel(null)}>
							Cancel
						</button>
						<button style={btnP} onClick={saveHeader}>
							Save
						</button>
					</div>
				</Modal>
			)}

			{settingsPanel === "viewJson" && (
				<Modal onClose={() => setSettingsPanel(null)} width={640}>
					<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
						<span style={{ fontWeight: "bold", color: "var(--color-text)" }}>Raw JSON — {person.FullName}</span>
						<button style={btnG} onClick={() => setSettingsPanel(null)}>
							✕
						</button>
					</div>
					<div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
						<pre
							style={{
								background: "var(--color-bg)",
								color: "var(--color-text)",
								padding: 12,
								borderRadius: "var(--radius-sm)",
								fontSize: 11,
								overflowX: "auto",
								whiteSpace: "pre-wrap",
								wordBreak: "break-word",
								margin: 0,
							}}
						>
							{JSON.stringify(data, null, 2)}
						</pre>
					</div>
				</Modal>
			)}

			{settingsPanel === "deleteConfirm" && (
				<Modal
					onClose={() => {
						setSettingsPanel(null);
						setDeleteInput("");
					}}
					width={380}
				>
					<div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", fontWeight: "bold", color: "var(--color-danger)" }}>Delete Person</div>
					<div style={{ padding: 18 }}>
						<p style={{ color: "var(--color-text)", marginTop: 0 }}>
							Permanently deletes <strong>{person.FullName}</strong> and all their data.
						</p>
						<p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
							Type <strong style={{ color: "var(--color-text)" }}>{person.FullName}</strong> to confirm:
						</p>
						<input
							autoFocus
							style={{ ...iStyle, marginTop: 4 }}
							value={deleteInput}
							onChange={(e) => setDeleteInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && deleteInput === person.FullName) handleDelete();
							}}
							placeholder={person.FullName}
						/>
					</div>
					<div style={{ padding: "10px 18px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
						<button
							style={btnG}
							onClick={() => {
								setSettingsPanel(null);
								setDeleteInput("");
							}}
						>
							Cancel
						</button>
						<button style={{ ...btnD, opacity: deleteInput === person.FullName ? 1 : 0.4 }} onClick={handleDelete}>
							Delete
						</button>
					</div>
				</Modal>
			)}

			{/* ── HEADER ─────────────────────────────────────────── */}
			<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
				{/* Left side: profile pictures + name */}
				<div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
					<ProfilePictures media={media} personId={personId} onReload={reload} />

					<div>
						<div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
							<h2 style={{ margin: 0, color: "var(--color-text)", fontSize: 20 }}>{person.FullName}</h2>
							{person.Nickname && <span style={{ color: "var(--color-text-muted)", fontSize: 14 }}>({person.Nickname})</span>}
							{person.CategoryName && (
								<span
									style={{
										fontSize: "var(--font-size-xs)",
										padding: "2px 8px",
										borderRadius: "var(--radius-sm)",
										background: "var(--color-active)",
										color: "var(--color-text-on-primary)",
										fontWeight: "bold",
									}}
								>
									{person.CategoryName}
								</span>
							)}
						</div>
						{pronouns.length > 0 && (
							<div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
								{pronouns.map((p) => (
									<span
										key={p.PronounsID}
										style={{
											fontSize: "var(--font-size-xs)",
											padding: "1px 6px",
											borderRadius: "var(--radius-sm)",
											background: "var(--color-surface-3)",
											color: "var(--color-text-muted)",
											border: "1px solid var(--color-border)",
										}}
									>
										{p.Pronouns}
									</span>
								))}
							</div>
						)}
					</div>
				</div>

				{/* ⚙ Settings */}
				<div ref={settingsRef} style={{ position: "relative", flexShrink: 0 }}>
					<button
						onClick={() => setSettingsOpen((o) => !o)}
						style={{
							padding: "5px 10px",
							background: "var(--color-surface-2)",
							color: "var(--color-text)",
							border: "1px solid var(--color-border)",
							borderRadius: "var(--radius-sm)",
							cursor: "pointer",
							fontSize: 14,
						}}
					>
						⚙
					</button>
					{settingsOpen && (
						<div
							style={{
								position: "absolute",
								right: 0,
								top: "100%",
								marginTop: 4,
								background: "var(--color-surface)",
								border: "1px solid var(--color-border)",
								borderRadius: "var(--radius-md)",
								width: 180,
								zIndex: 200,
								overflow: "hidden",
							}}
						>
							{[
								{ label: "✏ Edit Header Info", action: openEditHeader },
								{
									label: "{ } View JSON",
									action: () => {
										setSettingsPanel("viewJson");
										setSettingsOpen(false);
									},
								},
								{
									label: "🗑 Delete Person",
									action: () => {
										setSettingsPanel("deleteConfirm");
										setDeleteInput("");
										setSettingsOpen(false);
									},
									danger: true,
								},
								{
									label: "👁 Preview Profile UI",
									action: () => {
										window.open("./ProfilePreview.html", "_blank");
										setSettingsOpen(false);
									},
								},
							].map((item) => (
								<div
									key={item.label}
									onClick={item.action}
									style={{
										padding: "9px 14px",
										cursor: "pointer",
										fontSize: "var(--font-size-sm)",
										color: item.danger ? "var(--color-danger)" : "var(--color-text)",
										borderBottom: "1px solid var(--color-border)",
									}}
									onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
									onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
								>
									{item.label}
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Inner tabs */}
			<div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: 16 }}>
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

			<div style={{ display: innerTab === "Details" ? "block" : "none" }}>{renderDetails()}</div>
			<div style={{ display: innerTab === "Text" ? "block" : "none" }}>{renderText()}</div>
			<div style={{ display: innerTab === "Media" ? "block" : "none" }}>{renderMedia()}</div>

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
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		let age = now.getFullYear() - y;
		const hadBday = now.getMonth() > m - 1 || (now.getMonth() === m - 1 && now.getDate() >= d);
		if (!hadBday) age--;
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

function TimezoneTime({ gmt }) {
	const [time, setTime] = useState("");
	useEffect(() => {
		if (!gmt) return;
		const update = () => {
			const offset = parseFloat(gmt);
			const utc = new Date(Date.now() + new Date().getTimezoneOffset() * 60000);
			setTime(new Date(utc.getTime() + offset * 3600000).toTimeString().slice(0, 5));
		};
		update();
		const t = setInterval(update, 10000);
		return () => clearInterval(t);
	}, [gmt]);
	return <span style={{ marginLeft: 8, color: "var(--color-text-faint)", fontSize: "var(--font-size-sm)" }}>{time}</span>;
}
