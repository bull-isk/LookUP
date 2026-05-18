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
		padding: "6px 20px",
		border: "none",
		cursor: "pointer",
		background: innerTab === t ? "rgba(255, 255, 255, 0.08)" : "transparent",
		color: innerTab === t ? "#fff" : "rgba(255, 255, 255, 0.3)",
		fontWeight: "600",
		fontSize: "13px",
		borderRadius: "var(--radius-pill)",
		transition: "var(--transition)",
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
			<div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
				<div style={{ display: "flex", background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "4px", borderRadius: "var(--radius-pill)" }}>
					{["Details", "Text", "Media"].map((t) => (
						<button key={t} onClick={() => setInnerTab(t)} style={tabStyle(t)}>
							{t}
						</button>
					))}
				</div>
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

			{/* Floating capsule block tool */}
			<button
				onClick={() => setQuickAdd(true)}
				title="Add Info Panel (Ctrl+N)"
				style={{
					position: "fixed",
					bottom: 28,
					right: 28,
					// Using your design system's primary color and theme tokens
					background: "var(--color-primary)",
					color: "#fff",
					border: "1px solid rgba(255, 255, 255, 0.05)",
					borderRadius: "var(--radius-pill)", // Changed to pill/capsule to match figma spec rounding
					padding: "10px 20px",
					cursor: "pointer",
					fontWeight: "600",
					fontSize: "13px",
					display: "flex",
					alignItems: "center",
					gap: "8px",
					boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)", // Darkened shadow for better elevation over dark panels
					zIndex: 100,
					transition: "var(--transition)",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.transform = "translateY(-2px)";
					e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.6)";
					e.currentTarget.style.filter = "brightness(1.1)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.transform = "translateY(0)";
					e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.5)";
					e.currentTarget.style.filter = "brightness(1)";
				}}
			>
				<i className="fa-solid fa-plus" style={{ fontSize: "12px" }}></i> Add Info
			</button>
		</div>
	);
}
