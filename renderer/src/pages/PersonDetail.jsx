// pages/PersonDetail.jsx
// Orchestrator: owns all shared state and data fetching.
// Rendering is delegated to PersonDetail/ sub-files.

import { useState, useEffect, useCallback, useRef } from "react";
import { personFull, lookupAll } from "../api/bridge";

import PersonHeader from "./PersonDetail/PersonHeader";
import DetailTab from "./PersonDetail/DetailTab";
import TextTab from "./PersonDetail/TextTab";
import MediaTab from "./PersonDetail/MediaTab";
import QuickAdd from "../components/QuickAdd";

const api = window.electronAPI;

export default function PersonDetail({ personId, onDeleted, onOpenTag }) {
	const [data, setData] = useState(null);
	const [lookups, setLookups] = useState(null);
	const [specifics, setSpecifics] = useState([]);
	const [specTree, setSpecTree] = useState([]);
	const [innerTab, setInnerTab] = useState("Details");
	const [specAddOpen, setSpecAddOpen] = useState(false);
	const [quickAdd, setQuickAdd] = useState(false);
	const settingsRef = useRef(null);

	// ── Data loading ─────────────────────────────────────────────
	const reload = useCallback(async () => {
		const [d, sp] = await Promise.all([personFull(personId), api.specificsForPerson(personId)]);
		setData(d);
		setSpecifics(sp);
	}, [personId]);

	const reloadSpec = useCallback(() => api.specificsForPerson(personId).then(setSpecifics), [personId]);
	const refreshLookups = useCallback(() => lookupAll().then(setLookups), []);

	useEffect(() => {
		reload();
		refreshLookups();
		api.specificsTree().then(setSpecTree);
	}, [reload, refreshLookups]);

	// ── Keyboard shortcuts ────────────────────────────────────────
	useEffect(() => {
		const h = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "n") {
				e.preventDefault();
				setQuickAdd(true);
			}
			if (e.key === "Escape") setQuickAdd(false);
		};
		window.addEventListener("keydown", h);
		return () => window.removeEventListener("keydown", h);
	}, []);

	// Close settings on outside click — ref passed to PersonHeader
	useEffect(() => {
		const h = (e) => {
			if (settingsRef.current && !settingsRef.current.contains(e.target)) {
				// PersonHeader manages its own open state; this ref is just passed for positioning
			}
		};
		document.addEventListener("mousedown", h);
		return () => document.removeEventListener("mousedown", h);
	}, []);

	if (!data || !lookups) return <div style={{ padding: 20, color: "var(--color-text-muted)" }}>Loading…</div>;

	const { person, pronouns, tags, socialAccounts, eduHistory, orgHistory, notes, quotes, wordMouths, media } = data;
	const sayerOpts = lookups.persons.filter((p) => p.PersonID !== personId);

	// Tab button style helper
	const tabStyle = (t) => ({
		padding: "6px 16px",
		border: "none",
		cursor: "pointer",
		background: "transparent",
		color: innerTab === t ? "var(--color-accent)" : "var(--color-text-muted)",
		fontWeight: innerTab === t ? "bold" : "normal",
		borderBottom: innerTab === t ? "2px solid var(--color-accent)" : "2px solid transparent",
		marginBottom: -1,
	});

	return (
		<div style={{ position: "relative", paddingBottom: 70 }}>
			{/* Quick Add popup */}
			{quickAdd && lookups && <QuickAdd person={person} lookups={lookups} specificsTree={specTree} onSaved={reload} onClose={() => setQuickAdd(false)} />}

			{/* Header: profile pictures, name, pronouns, settings gear + modals */}
			<PersonHeader
				person={person}
				pronouns={pronouns}
				media={media}
				lookups={lookups}
				personId={personId}
				data={data}
				onDeleted={onDeleted}
				onSaved={reload}
				refreshLookups={refreshLookups}
				settingsRef={settingsRef}
			/>

			{/* Inner tab bar */}
			<div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: 16 }}>
				{["Details", "Text", "Media"].map((t) => (
					<button key={t} onClick={() => setInnerTab(t)} style={tabStyle(t)}>
						{t}
					</button>
				))}
			</div>

			{/* Tab content — display:none keeps sub-component state alive */}
			<div style={{ display: innerTab === "Details" ? "block" : "none" }}>
				<DetailTab
					person={person}
					tags={tags}
					socialAccounts={socialAccounts}
					eduHistory={eduHistory}
					orgHistory={orgHistory}
					specifics={specifics}
					specTree={specTree}
					personId={personId}
					lookups={lookups}
					onReload={reload}
					reloadSpec={reloadSpec}
					onOpenTag={onOpenTag}
					specAddOpen={specAddOpen}
					setSpecAddOpen={setSpecAddOpen}
				/>
			</div>

			<div style={{ display: innerTab === "Text" ? "block" : "none" }}>
				<TextTab personId={personId} quotes={quotes} notes={notes} wordMouths={wordMouths} persons={sayerOpts} onReload={reload} />
			</div>

			<div style={{ display: innerTab === "Media" ? "block" : "none" }}>
				<MediaTab personId={personId} media={media} onReload={reload} />
			</div>

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
