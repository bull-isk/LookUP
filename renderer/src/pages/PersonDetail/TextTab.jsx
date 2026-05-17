// pages/PersonDetail/TextTab.jsx
// Text tab: Quotes, Notes, He Said / She Said.

import { useState } from "react";
import { HoverRow, PopupForm, secTitle, divider, btnG, today } from "./shared";
import { quoteCreate, quoteUpdate, quoteDelete, wmCreate, wmUpdate, wmDelete, noteCreate, noteUpdate, noteDelete } from "../../api/bridge";

export default function TextTab({ personId, quotes, notes, wordMouths, persons, onReload }) {
	const [adding, setAdding] = useState(null);
	const [editingId, setEditingId] = useState(null);

	const isAdding = (k) => adding === k;
	const isEditing = (t, id) => editingId?.type === t && editingId?.id === id;
	const stopAdding = () => setAdding(null);
	const stopEditing = () => setEditingId(null);

	// People who can be "sayer" — passed in from parent (already filtered)
	const sayerOpts = persons;

	return (
		<>
			{/* ── QUOTES ── */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={secTitle}>Quotes</div>
					<button
						style={{
							padding: "2px 8px",
							background: "transparent",
							border: "1px solid var(--color-border)",
							borderRadius: "var(--radius-sm)",
							color: "var(--color-text-muted)",
							cursor: "pointer",
							fontSize: "var(--font-size-xs)",
						}}
						onClick={() => setAdding("quote")}
					>
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
						initial={{ Date: today() }}
						onSave={async (v) => {
							await quoteCreate({ PersonID: personId, Quote: v.Quote, Date: v.Date || null });
							stopAdding();
							onReload?.();
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

			{/* ── NOTES ── */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={secTitle}>Notes</div>
					<button
						style={{
							padding: "2px 8px",
							background: "transparent",
							border: "1px solid var(--color-border)",
							borderRadius: "var(--radius-sm)",
							color: "var(--color-text-muted)",
							cursor: "pointer",
							fontSize: "var(--font-size-xs)",
						}}
						onClick={() => setAdding("note")}
					>
						+ Add
					</button>
				</div>
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
				{notes.map((n) => (
					<div key={n.NotesID}>
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

			{/* ── HE SAID / SHE SAID ── */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<div style={secTitle}>He Said / She Said</div>
					<button
						style={{
							padding: "2px 8px",
							background: "transparent",
							border: "1px solid var(--color-border)",
							borderRadius: "var(--radius-sm)",
							color: "var(--color-text-muted)",
							cursor: "pointer",
							fontSize: "var(--font-size-xs)",
						}}
						onClick={() => setAdding("wm")}
					>
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
						initial={{ Date: today() }}
						onSave={async (v) => {
							const match = sayerOpts.find((p) => p.FullName.toLowerCase() === (v.Speaker || "").trim().toLowerCase());
							await wmCreate({ PersonID: personId, SayerID: match?.PersonID || null, Quote: v.Quote, Date: v.Date || null });
							stopAdding();
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
									stopEditing();
								}}
								onClose={stopEditing}
							/>
						) : (
							<HoverRow
								onEdit={() => setEditingId({ type: "wm", id: w.WordMouthID })}
								onDelete={async () => {
									await wmDelete(w.WordMouthID);
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
}
