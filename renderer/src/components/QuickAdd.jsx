// renderer/src/components/QuickAdd.jsx
import { useState, useEffect } from "react";

const api = window.electronAPI;

const PAGES = ["Details", "Text", "Media"];

const SECTIONS = {
	Details: ["Specifics", "Education", "Organization", "Social Account"],
	Text: ["Quote", "WordMouth", "Note"],
	Media: ["Media File"],
};

const today = () => new Date().toISOString().slice(0, 10);

export default function QuickAdd({ person, lookups, specificsTree, onSaved, onClose }) {
	const [page, setPage] = useState("Details");
	const [section, setSection] = useState(SECTIONS["Details"][0]);
	const [form, setForm] = useState({});
	const [saving, setSaving] = useState(false);

	// Reset section when page changes
	useEffect(() => {
		setSection(SECTIONS[page][0]);
		setForm({});
	}, [page]);

	const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

	const handleSave = async () => {
		setSaving(true);
		try {
			const pid = person.PersonID;
			if (section === "Quote") {
				await api.quoteCreate({ PersonID: pid, Quote: form.Quote || "", Date: form.Date || null });
			} else if (section === "WordMouth") {
				await api.wmCreate({ PersonID: pid, SayerID: form.SayerID || null, Quote: form.Quote || "", Date: form.Date || null });
			} else if (section === "Note") {
				await api.noteCreate({ PersonID: pid, Note: form.Note || "" });
			} else if (section === "Education") {
				await api.eduCreate({
					PersonID: pid,
					InstID: Number(form.InstID),
					EduLevelID: Number(form.EduLevelID),
					FieldOfStudy: form.FieldOfStudy || "",
					StartYear: form.StartYear ? Number(form.StartYear) : null,
					EndYear: form.EndYear ? Number(form.EndYear) : null,
				});
			} else if (section === "Organization") {
				await api.orgCreate({
					PersonID: pid,
					OrgID: Number(form.OrgID),
					Division: form.Division || "",
					StartYear: form.StartYear ? Number(form.StartYear) : null,
					EndYear: form.EndYear ? Number(form.EndYear) : null,
				});
			} else if (section === "Social Account") {
				await api.socialCreate({ PersonID: pid, PlatformID: Number(form.PlatformID), AccountTag: form.AccountTag || "" });
			} else if (section === "Specifics") {
				// find-or-create sub + point, then add value
				const subId = await api.specificsFindOrCreateSub(form.SubName || "");
				const ptId = await api.specificsFindOrCreatePoint(subId, form.PointName || "");
				await api.specificsAddValue({ PersonID: pid, PointID: ptId, SpecificNote: form.SpecificNote || "" });
			} else if (section === "Media File") {
				const mid = await api.mediaCreate({ FilePath: form.FilePath || "", Date: form.Date || null });
				await api.mediaLink(pid, mid);
			}
			onSaved();
			onClose();
		} catch (e) {
			alert(e.message || "Save failed");
		} finally {
			setSaving(false);
		}
	};

	const inp = { width: "100%", padding: "4px 6px", border: "1px solid var(--border-primary)", marginTop: 4, color: "var(--text-primary)", background: "var(--bg-primary)" };
	const lbl = { display: "block", marginBottom: 8, color: "var(--text-secondary)", fontSize: "var(--font-size-sm)" };

	const renderForm = () => {
		const pid = person.PersonID;
		const persons = lookups.persons.filter((p) => p.PersonID !== pid);

		if (section === "Quote")
			return (
				<>
					<label style={lbl}>
						Quote
						<textarea style={{ ...inp, height: 60 }} onChange={set("Quote")} />
					</label>
					<label style={lbl}>
						Date
						<input type="date" style={inp} value={form.Date || today()} onChange={set("Date")} />
					</label>
				</>
			);
		if (section === "WordMouth")
			return (
				<>
					<label style={lbl}>
						Quote
						<textarea style={{ ...inp, height: 60 }} onChange={set("Quote")} />
					</label>
					<label style={lbl}>
						Said by (optional)
						<select style={inp} onChange={set("SayerID")}>
							<option value="">— anonymous —</option>
							{persons.map((p) => (
								<option key={p.PersonID} value={p.PersonID}>
									{p.FullName}
								</option>
							))}
						</select>
					</label>
					<label style={lbl}>
						Date
						<input type="date" style={inp} value={form.Date || today()} onChange={set("Date")} />
					</label>
				</>
			);
		if (section === "Note")
			return (
				<label style={lbl}>
					Note
					<textarea style={{ ...inp, height: 80 }} onChange={set("Note")} />
				</label>
			);
		if (section === "Education")
			return (
				<>
					<label style={lbl}>
						Institution
						<select style={inp} onChange={set("InstID")}>
							<option value="">—</option>
							{lookups.institutions.map((i) => (
								<option key={i.InstID} value={i.InstID}>
									{i.InstitutionName}
								</option>
							))}
						</select>
					</label>
					<label style={lbl}>
						Level
						<select style={inp} onChange={set("EduLevelID")}>
							<option value="">—</option>
							{lookups.eduLevels.map((e) => (
								<option key={e.EduLevelID} value={e.EduLevelID}>
									{e.LevelName}
								</option>
							))}
						</select>
					</label>
					<label style={lbl}>
						Field of Study
						<input style={inp} onChange={set("FieldOfStudy")} />
					</label>
					<div style={{ display: "flex", gap: 8 }}>
						<label style={{ ...lbl, flex: 1 }}>
							Start Year
							<input type="number" style={inp} onChange={set("StartYear")} />
						</label>
						<label style={{ ...lbl, flex: 1 }}>
							End Year
							<input type="number" style={inp} onChange={set("EndYear")} />
						</label>
					</div>
				</>
			);
		if (section === "Organization")
			return (
				<>
					<label style={lbl}>
						Organization
						<select style={inp} onChange={set("OrgID")}>
							<option value="">—</option>
							{lookups.orgs.map((o) => (
								<option key={o.OrgID} value={o.OrgID}>
									{o.OrgName}
								</option>
							))}
						</select>
					</label>
					<label style={lbl}>
						Division
						<input style={inp} onChange={set("Division")} />
					</label>
					<div style={{ display: "flex", gap: 8 }}>
						<label style={{ ...lbl, flex: 1 }}>
							Start Year
							<input type="number" style={inp} onChange={set("StartYear")} />
						</label>
						<label style={{ ...lbl, flex: 1 }}>
							End Year
							<input type="number" style={inp} onChange={set("EndYear")} />
						</label>
					</div>
				</>
			);
		if (section === "Social Account")
			return (
				<>
					<label style={lbl}>
						Platform
						<select style={inp} onChange={set("PlatformID")}>
							<option value="">—</option>
							{lookups.platforms.map((p) => (
								<option key={p.PlatformID} value={p.PlatformID}>
									{p.PlatformName}
								</option>
							))}
						</select>
					</label>
					<label style={lbl}>
						Handle / URL
						<input style={inp} onChange={set("AccountTag")} />
					</label>
				</>
			);
		if (section === "Specifics")
			return (
				<>
					<label style={lbl}>
						Category
						<select style={inp} onChange={(e) => setForm((f) => ({ ...f, SubName: e.target.value }))}>
							<option value="">—</option>
							{specificsTree.map((s) => (
								<option key={s.SubSpecificsID} value={s.SubName}>
									{s.SubName}
								</option>
							))}
							<option value="__new__">+ new category…</option>
						</select>
					</label>
					{form.SubName === "__new__" && (
						<label style={lbl}>
							New category name
							<input style={inp} onChange={(e) => setForm((f) => ({ ...f, SubName: e.target.value }))} />
						</label>
					)}
					<label style={lbl}>
						Point
						<input style={inp} placeholder="e.g. Food, Hobby…" onChange={set("PointName")} />
					</label>
					<label style={lbl}>
						Value
						<input style={inp} onChange={set("SpecificNote")} />
					</label>
				</>
			);
		if (section === "Media File")
			return (
				<>
					<label style={lbl}>
						File Path
						<input style={inp} onChange={set("FilePath")} />
					</label>
					<label style={lbl}>
						Date
						<input type="date" style={inp} onChange={set("Date")} />
					</label>
				</>
			);
		return null;
	};

	return (
		<div onClick={onClose} style={{ position: "fixed", inset: 0, background: "var(--overlay-bg)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "var(--color-surface)",
					border: "1px solid var(--color-border-2)",
					borderRadius: "var(--radius-lg)",
					boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
					width: 460,
					maxHeight: "80vh",
					display: "flex",
					flexDirection: "column",
				}}
			>
				{/* Header */}
				<div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<span style={{ fontWeight: "bold" }}>Quick Add — {person.FullName}</span>
					<button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 16, cursor: "pointer", color: "var(--text-muted)" }}>
						✕
					</button>
				</div>

				{/* Page tabs */}
				<div style={{ display: "flex", borderBottom: "1px solid var(--border-secondary)" }}>
					{PAGES.map((p) => (
						<button
							key={p}
							onClick={() => setPage(p)}
							style={{
								flex: 1,
								padding: "6px 0",
								border: "none",
								borderBottom: page === p ? "2px solid var(--bg-active)" : "2px solid transparent",
								background: "transparent",
								color: page === p ? "var(--text-accent)" : "var(--text-secondary)",
								fontWeight: page === p ? "bold" : "normal",
							}}
						>
							{p}
						</button>
					))}
				</div>

				{/* Section dropdown */}
				<div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border-faint)" }}>
					<select
						value={section}
						onChange={(e) => {
							setSection(e.target.value);
							setForm({});
						}}
						style={{ width: "100%", padding: "4px 6px", border: "1px solid var(--border-primary)", color: "var(--text-primary)", background: "var(--bg-primary)" }}
					>
						{SECTIONS[page].map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>

				{/* Dynamic form */}
				<div style={{ padding: "12px 14px", overflowY: "auto", flex: 1 }}>{renderForm()}</div>

				{/* Footer */}
				<div style={{ padding: "8px 14px", borderTop: "1px solid var(--border-secondary)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
					<button onClick={onClose} style={{ padding: "4px 12px", border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={saving}
						style={{ padding: "4px 12px", background: "var(--bg-active)", color: "var(--text-on-active)", border: "none", borderRadius: "var(--radius-sm)" }}
					>
						{saving ? "Saving…" : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}
