// pages/PersonDetail/TextTab.jsx
// Text tab: Quotes, Notes, He Said / She Said.

import { useState } from "react";
import { HoverRow, PopupForm, divider, today } from "./shared";
import { quoteCreate, quoteUpdate, quoteDelete, wmCreate, wmUpdate, wmDelete, noteCreate, noteUpdate, noteDelete } from "../../api/bridge";

export default function TextTab({ personId, quotes, notes, wordMouths, persons, onReload }) {
	const [adding, setAdding] = useState(null);
	const [editingId, setEditingId] = useState(null);

	const isAdding = (k) => adding === k;
	const isEditing = (t, id) => editingId?.type === t && editingId?.id === id;
	const stopAdding = () => setAdding(null);
	const stopEditing = () => setEditingId(null);

	const sayerOpts = persons;

	// ── Unified Sub-section Header Component ──
	const SubsectionHeader = ({ title, iconClass, onAddClick }) => (
		<div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
			<div
				style={{
					fontSize: "11px",
					fontWeight: "800",
					textTransform: "uppercase",
					letterSpacing: "0.05em",
					color: "var(--color-accent)",
					display: "flex",
					alignItems: "center",
					gap: "6px",
				}}
			>
				<i className={iconClass} style={{ fontSize: "11px" }}></i>
				{title}
			</div>
			<button
				onClick={onAddClick}
				style={{
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "4px",
					padding: "3px 8px",
					background: "rgba(255, 255, 255, 0.03)",
					border: "1px solid var(--color-border)",
					borderRadius: "var(--radius-sm, 4px)",
					color: "var(--color-text-muted)",
					cursor: "pointer",
					fontSize: "11px",
					height: "22px",
					fontWeight: "600",
					transition: "var(--transition)",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.borderColor = "var(--color-border-hover)";
					e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
					e.currentTarget.style.color = "var(--color-text)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.borderColor = "var(--color-border)";
					e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
					e.currentTarget.style.color = "var(--color-text-muted)";
				}}
			>
				<i className="fa-solid fa-plus" style={{ fontSize: "9px" }}></i> Add
			</button>
		</div>
	);

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
			{/* ── QUOTES SUBSECTION ── */}
			<div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
				<SubsectionHeader title="Quotes" iconClass="fa-solid fa-quote-left" onAddClick={() => setAdding("quote")} />

				{isAdding("quote") && (
					<PopupForm
						title="Add Quote"
						fields={[
							{ key: "Quote", label: "Quote", textarea: true },
							{ key: "Date", label: "Date", inputType: "date" },
						]}
						initial={{ Date: today() }}
						onSave={async (v) => {
							await quoteCreate({ PersonID: personId, Quote: v.Quote, Date: v.Date || null });
							stopAdding();
							onReload?.();
						}}
						onClose={stopAdding}
					/>
				)}

				<div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
					{quotes.map((q) => (
						<div key={q.QuoteID} style={{ width: "100%" }}>
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
										stopEditing();
										onReload?.();
									}}
									onClose={stopEditing}
								/>
							) : (
								<HoverRow
									onEdit={() => setEditingId({ type: "quote", id: q.QuoteID })}
									onDelete={async () => {
										await quoteDelete(q.QuoteID);
										onReload?.();
									}}
								>
									<div style={{ fontSize: "13px", color: "var(--color-text)", lineHeight: "1.5" }}>
										<em style={{ fontStyle: "italic" }}>"{q.Quote}"</em>
										{q.Date && <span style={{ color: "var(--color-text-faint)", marginLeft: 8, fontSize: "11px", fontFamily: "var(--font-mono)" }}>{q.Date}</span>}
									</div>
								</HoverRow>
							)}
						</div>
					))}
					{quotes.length === 0 && !isAdding("quote") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "13px", paddingLeft: "4px" }}>None</div>}
				</div>
			</div>

			<div style={divider} />

			{/* ── NOTES SUBSECTION ── */}
			<div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
				<SubsectionHeader title="Notes" iconClass="fa-solid fa-note-sticky" onAddClick={() => setAdding("note")} />

				{isAdding("note") && (
					<PopupForm
						title="Add Note"
						fields={[{ key: "Note", label: "Note", textarea: true }]}
						onSave={async (v) => {
							await noteCreate({ PersonID: personId, Note: v.Note });
							stopAdding();
							onReload?.();
						}}
						onClose={stopAdding}
					/>
				)}

				<div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
					{notes.map((n) => (
						<div key={n.NotesID} style={{ width: "100%" }}>
							{isEditing("note", n.NotesID) ? (
								<PopupForm
									title="Edit Note"
									fields={[{ key: "Note", label: "Note", textarea: true }]}
									initial={{ Note: n.Note }}
									onSave={async (v) => {
										await noteUpdate(n.NotesID, { Note: v.Note });
										stopEditing();
										onReload?.();
									}}
									onClose={stopEditing}
								/>
							) : (
								<HoverRow
									onEdit={() => setEditingId({ type: "note", id: n.NotesID })}
									onDelete={async () => {
										await noteDelete(n.NotesID);
										onReload?.();
									}}
								>
									<div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: "13px", color: "var(--color-text)", lineHeight: "1.5" }}>
										<span style={{ color: "rgba(255, 255, 255, 0.15)", userSelect: "none" }}>•</span>
										<span>{n.Note}</span>
									</div>
								</HoverRow>
							)}
						</div>
					))}
					{notes.length === 0 && !isAdding("note") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "13px", paddingLeft: "4px" }}>None</div>}
				</div>
			</div>

			<div style={divider} />

			{/* ── HE SAID / SHE SAID SUBSECTION ── */}
			<div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
				<SubsectionHeader title="He Said / She Said" iconClass="fa-solid fa-comments" onAddClick={() => setAdding("wm")} />

				{isAdding("wm") && (
					<PopupForm
						title="Add He Said / She Said"
						fields={[
							{ key: "Quote", label: "Quote", textarea: true },
							{ key: "Speaker", label: "Speaker (optional name)" },
							{ key: "Date", label: "Date", inputType: "date" },
						]}
						initial={{ Date: today() }}
						onSave={async (v) => {
							const match = sayerOpts.find((p) => p.FullName.toLowerCase() === (v.Speaker || "").trim().toLowerCase());
							await wmCreate({ PersonID: personId, SayerID: match?.PersonID || null, Quote: v.Quote, Date: v.Date || null });
							stopAdding();
							onReload?.();
						}}
						onClose={stopAdding}
					/>
				)}

				<div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
					{wordMouths.map((w) => (
						<div key={w.WordMouthID} style={{ width: "100%" }}>
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
										stopEditing();
										onReload?.();
									}}
									onClose={stopEditing}
								/>
							) : (
								<HoverRow
									onEdit={() => setEditingId({ type: "wm", id: w.WordMouthID })}
									onDelete={async () => {
										await wmDelete(w.WordMouthID);
										onReload?.();
									}}
								>
									<div style={{ fontSize: "13px", lineHeight: "1.5" }}>
										<em style={{ fontStyle: "italic", color: "var(--color-text)" }}>"{w.Quote}"</em>
										<div style={{ color: "var(--color-text-muted)", fontSize: "12px", marginTop: 4, display: "flex", alignItems: "center", gap: "8px" }}>
											<span style={{ fontWeight: "500" }}>{w.SayerName || "anonymous"}</span>
											{w.Date && <span style={{ color: "var(--color-text-faint)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>{w.Date}</span>}
										</div>
									</div>
								</HoverRow>
							)}
						</div>
					))}
					{wordMouths.length === 0 && !isAdding("wm") && <div style={{ color: "var(--color-text-faint)", fontStyle: "italic", fontSize: "13px", paddingLeft: "4px" }}>None</div>}
				</div>
			</div>
		</div>
	);
}
