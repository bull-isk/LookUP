// renderer/src/components/QuickAdd.jsx
import { useState, useEffect, useRef } from "react";

const api = window.electronAPI;

const PAGES = ["Details", "Text", "Media"];
const SECTIONS = {
	Details: ["Specifics", "Education", "Organization", "Social Account"],
	Text: ["Quote", "He Said / She Said", "Note"],
	Media: ["Image"],
};

const today = () => new Date().toISOString().slice(0, 10);

// ── Shared styles matching optimized design system rules ─────────────────────────
const iStyle = {
	width: "100%",
	padding: "6px 12px",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-inner)",
	background: "rgba(7, 8, 13, 0.6)",
	color: "var(--color-text)",
	marginTop: 6,
	fontFamily: "var(--font-mono)",
	fontSize: "13px",
	transition: "var(--transition)",
};
const lbl = {
	display: "block",
	marginBottom: 12,
	color: "var(--color-text-muted)",
	fontSize: "13px",
};
const btnP = {
	padding: "6px 16px",
	background: "var(--color-primary)",
	color: "#fff",
	border: "none",
	borderRadius: "var(--radius-inner)",
	cursor: "pointer",
	fontWeight: "600",
	fontSize: "13px",
	transition: "var(--transition)",
};
const btnG = {
	padding: "6px 14px",
	background: "transparent",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-inner)",
	color: "var(--color-text-muted)",
	cursor: "pointer",
	fontSize: "13px",
	transition: "var(--transition)",
};

export default function QuickAdd({ person, lookups, specificsTree, onSaved, onClose }) {
	const [page, setPage] = useState("Details");
	const [section, setSection] = useState(SECTIONS["Details"][0]);
	const [form, setForm] = useState({});
	const [saving, setSaving] = useState(false);

	// Image state for Media section
	const [imagePreview, setImagePreview] = useState(null);
	const [imageFilename, setImageFilename] = useState("");
	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef(null);

	useEffect(() => {
		setSection(SECTIONS[page][0]);
		setForm({});
		setImagePreview(null);
		setImageFilename("");
	}, [page]);

	const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

	// ── Image helpers ───────────────────────────────────────────
	const readImageFile = (file) => {
		if (!file || !file.type.startsWith("image/")) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			setImagePreview(e.target.result);
			setImageFilename(file.name);
		};
		reader.readAsDataURL(file);
	};

	const handleBrowse = async () => {
		const picked = await api.mediaPick();
		if (!picked?.length) return;
		setImagePreview(picked[0].dataUri);
		setImageFilename(picked[0].filename);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setDragOver(false);
		const file = e.dataTransfer.files[0];
		readImageFile(file);
	};

	const handleFileInput = (e) => {
		readImageFile(e.target.files[0]);
	};

	// ── Save action blocks ───────────────────────────────────────────
	const handleSave = async () => {
		setSaving(true);
		try {
			const pid = person.PersonID;
			if (section === "Quote") {
				await api.quoteCreate({ PersonID: pid, Quote: form.Quote || "", Date: form.Date || today() });
			} else if (section === "He Said / She Said") {
				await api.wmCreate({ PersonID: pid, SayerID: form.SayerID || null, Quote: form.Quote || "", Date: form.Date || today() });
			} else if (section === "Note") {
				await api.noteCreate({ PersonID: pid, Note: form.Note || "" });
			} else if (section === "Education") {
				const instId = form.institutionName?.trim() ? await api.lookupFindOrCreateInstitution(form.institutionName.trim()) : null;
				await api.eduCreate({
					PersonID: pid,
					InstID: instId,
					EduLevelID: form.EduLevelID ? Number(form.EduLevelID) : null,
					FieldOfStudy: form.FieldOfStudy || "",
					Faculty: form.Faculty || "",
					StartYear: form.StartYear ? Number(form.StartYear) : null,
					EndYear: form.EndYear ? Number(form.EndYear) : null,
					IsPresent: !!form.IsPresent,
				});
			} else if (section === "Organization") {
				const orgId = form.orgName?.trim() ? await api.lookupFindOrCreateOrganization(form.orgName.trim()) : null;
				await api.orgCreate({
					PersonID: pid,
					OrgID: orgId,
					Role: form.Role || "",
					StartYear: form.StartYear ? Number(form.StartYear) : null,
					EndYear: form.EndYear ? Number(form.EndYear) : null,
					IsPresent: !!form.IsPresent,
				});
			} else if (section === "Social Account") {
				await api.socialCreate({ PersonID: pid, PlatformID: Number(form.PlatformID), AccountTag: form.AccountTag || "" });
			} else if (section === "Specifics") {
				await api.specificsAddValue({ PersonID: pid, PointID: ptId, SpecificNote: form.SpecificNote || "" });
			} else if (section === "Image") {
				if (!imagePreview) {
					alert("Please select an image first.");
					setSaving(false);
					return;
				}
				const mid = await api.mediaCreate({
					FilePath: form.Title?.trim() || imageFilename,
					Date: form.Date || today(),
					Data: imagePreview,
				});
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

	// ── Form structural blocks ───────────────────────────────────────────
	const renderForm = () => {
		const pid = person.PersonID;
		const persons = (lookups.persons || []).filter((p) => p.PersonID !== pid);

		if (section === "Quote")
			return (
				<>
					<label style={lbl}>
						Quote
						<textarea style={{ ...iStyle, height: 74, resize: "vertical" }} onChange={set("Quote")} />
					</label>
					<label style={lbl}>
						Date
						<input type="date" style={iStyle} value={form.Date ?? today()} onChange={set("Date")} />
					</label>
				</>
			);

		if (section === "He Said / She Said")
			return (
				<>
					<label style={lbl}>
						Quote
						<textarea style={{ ...iStyle, height: 74, resize: "vertical" }} onChange={set("Quote")} />
					</label>
					<label style={lbl}>
						Said by (optional)
						<select style={{ ...iStyle, height: "34px", padding: "0 8px" }} onChange={set("SayerID")}>
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
						<input type="date" style={iStyle} value={form.Date ?? today()} onChange={set("Date")} />
					</label>
				</>
			);

		if (section === "Note")
			return (
				<label style={lbl}>
					Note
					<textarea style={{ ...iStyle, height: 110, resize: "vertical" }} onChange={set("Note")} />
				</label>
			);

		if (section === "Education")
			return (
				<>
					<label style={lbl}>
						Institution
						<input style={iStyle} placeholder="e.g. University of Brawijaya" onChange={(e) => setForm((f) => ({ ...f, institutionName: e.target.value }))} />
					</label>
					<label style={lbl}>
						Level
						<select style={{ ...iStyle, height: "34px", padding: "0 8px" }} onChange={set("EduLevelID")}>
							<option value="">—</option>
							{(lookups.eduLevels || []).map((e) => (
								<option key={e.EduLevelID} value={e.EduLevelID}>
									{e.LevelName}
								</option>
							))}
						</select>
					</label>
					<label style={lbl}>
						Field of Study
						<input style={iStyle} onChange={set("FieldOfStudy")} />
					</label>
					<label style={lbl}>
						Faculty
						<input style={iStyle} onChange={set("Faculty")} />
					</label>
					<div style={{ display: "flex", gap: 12 }}>
						<label style={{ ...lbl, flex: 1 }}>
							Start Year
							<input type="number" style={iStyle} onChange={set("StartYear")} />
						</label>
						<label style={{ ...lbl, flex: 1 }}>
							End Year
							<input type="number" style={iStyle} onChange={set("EndYear")} />
						</label>
					</div>
					<label style={{ ...lbl, display: "flex", alignItems: "center", gap: 8, marginTop: 4, cursor: "pointer", userSelect: "none" }}>
						<input type="checkbox" onChange={(e) => setForm((f) => ({ ...f, IsPresent: e.target.checked }))} style={{ cursor: "pointer" }} />
						Currently enrolled
					</label>
				</>
			);

		if (section === "Organization")
			return (
				<>
					<label style={lbl}>
						Organization
						<input style={iStyle} placeholder="e.g. LPM Display" onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))} />
					</label>
					<label style={lbl}>
						Role / Division
						<input style={iStyle} onChange={set("Role")} />
					</label>
					<div style={{ display: "flex", gap: 12 }}>
						<label style={{ ...lbl, flex: 1 }}>
							Start Year
							<input type="number" style={iStyle} onChange={set("StartYear")} />
						</label>
						<label style={{ ...lbl, flex: 1 }}>
							End Year
							<input type="number" style={iStyle} onChange={set("EndYear")} />
						</label>
					</div>
					<label style={{ ...lbl, display: "flex", alignItems: "center", gap: 8, marginTop: 4, cursor: "pointer", userSelect: "none" }}>
						<input type="checkbox" onChange={(e) => setForm((f) => ({ ...f, IsPresent: e.target.checked }))} style={{ cursor: "pointer" }} />
						Currently working here
					</label>
				</>
			);

		if (section === "Social Account")
			return (
				<>
					<label style={lbl}>
						Platform
						<select style={{ ...iStyle, height: "34px", padding: "0 8px" }} onChange={set("PlatformID")}>
							<option value="">—</option>
							{(lookups.platforms || []).map((p) => (
								<option key={p.PlatformID} value={p.PlatformID}>
									{p.PlatformName}
								</option>
							))}
						</select>
					</label>
					<label style={lbl}>
						Handle (without @)
						<input style={iStyle} placeholder="personguy2000" onChange={set("AccountTag")} />
					</label>
				</>
			);

		if (section === "Specifics")
			return (
				<>
					<label style={lbl}>
						Category
						<select style={{ ...iStyle, height: "34px", padding: "0 8px" }} onChange={(e) => setForm((f) => ({ ...f, SubName: e.target.value }))}>
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
							<input style={iStyle} autoFocus onChange={(e) => setForm((f) => ({ ...f, SubName: e.target.value }))} />
						</label>
					)}
					<label style={lbl}>
						Point
						<input style={iStyle} placeholder="e.g. Food, Hobby…" onChange={set("PointName")} />
					</label>
					<label style={lbl}>
						Value
						<input style={iStyle} onChange={set("SpecificNote")} />
					</label>
				</>
			);

		if (section === "Image")
			return (
				<>
					<div
						onDragOver={(e) => {
							e.preventDefault();
							setDragOver(true);
						}}
						onDragLeave={() => setDragOver(false)}
						onDrop={handleDrop}
						onClick={() => fileInputRef.current?.click()}
						style={{
							border: `2px dashed ${dragOver ? "var(--color-accent)" : "var(--color-border)"}`,
							borderRadius: "var(--radius-inner)",
							background: dragOver ? "rgba(99, 102, 241, 0.05)" : "rgba(255, 255, 255, 0.01)",
							padding: 24,
							textAlign: "center",
							cursor: "pointer",
							marginBottom: 14,
							minHeight: 140,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							gap: 8,
							transition: "var(--transition)",
						}}
					>
						{imagePreview ? (
							<img src={imagePreview} alt="preview" style={{ maxHeight: 110, maxWidth: "100%", objectFit: "contain", borderRadius: "var(--radius-sm)" }} />
						) : (
							<>
								<i className="fa-solid fa-images" style={{ fontSize: 26, color: "var(--color-text-muted)", opacity: 0.6 }}></i>
								<div style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>Drop image here, or click to browse</div>
							</>
						)}
					</div>
					<input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileInput} />

					<label style={lbl}>
						Title
						<input style={iStyle} placeholder={imageFilename || "Image title…"} value={form.Title ?? ""} onChange={set("Title")} />
					</label>
					<label style={lbl}>
						Date
						<input type="date" style={iStyle} value={form.Date ?? today()} onChange={set("Date")} />
					</label>
				</>
			);

		return null;
	};

	return (
		// Fixed backdrop curtain tracking variables
		<div
			onClick={onClose}
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(3, 4, 7, 0.75)",
				backdropFilter: "blur(4px)",
				webkitBackdropFilter: "blur(4px)",
				zIndex: 1000,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "var(--color-surface, #11131c)",
					border: "1px solid var(--color-border-2, rgba(255, 255, 255, 0.08))",
					borderRadius: "var(--radius-lg)",
					boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
					width: 480,
					maxHeight: "85vh",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					animation: "modalAppear 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
				}}
			>
				{/* Header */}
				<div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
					<span style={{ fontWeight: "600", color: "var(--color-text)", fontSize: "15px" }}>Quick Add — {person.FullName}</span>
					<button
						onClick={onClose}
						style={{ border: "none", background: "transparent", fontSize: 14, cursor: "pointer", color: "var(--color-text-faint)", display: "flex", alignItems: "center" }}
						onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
						onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-faint)")}
					>
						<i className="fa-solid fa-xmark"></i>
					</button>
				</div>

				{/* Page tabs */}
				<div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", flexShrink: 0, background: "rgba(0, 0, 0, 0.1)" }}>
					{PAGES.map((p) => (
						<button
							key={p}
							onClick={() => setPage(p)}
							style={{
								flex: 1,
								padding: "10px 0",
								border: "none",
								borderBottom: page === p ? "2px solid var(--color-accent)" : "2px solid transparent",
								background: "transparent",
								color: page === p ? "var(--color-accent)" : "var(--color-text-muted)",
								fontWeight: page === p ? "600" : "400",
								cursor: "pointer",
								fontSize: "13px",
								transition: "var(--transition)",
							}}
						>
							{p}
						</button>
					))}
				</div>

				{/* Section selection drop list */}
				<div style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
					<select
						value={section}
						onChange={(e) => {
							setSection(e.target.value);
							setForm({});
							setImagePreview(null);
							setImageFilename("");
						}}
						style={{ ...iStyle, marginTop: 0, height: "34px", padding: "0 8px" }}
					>
						{SECTIONS[page].map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>

				{/* Main scrollable form lane wrapper */}
				<div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>{renderForm()}</div>

				{/* Actions Footer */}
				<div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0, background: "rgba(0, 0, 0, 0.1)" }}>
					<button onClick={onClose} style={btnG}>
						Cancel
					</button>
					<button onClick={handleSave} disabled={saving} style={btnP}>
						{saving ? "Saving…" : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}
