// renderer/src/App.jsx
import { useState, useEffect, useCallback } from "react";
import { personList } from "./api/bridge";
import PersonDetail from "./pages/PersonDetail";
import PersonForm from "./pages/PersonForm";
import DebugView from "./pages/DebugView";
import HomePage from "./pages/HomePage";
import BirthdaysPage from "./pages/BirthdaysPage";
import TagsPage from "./pages/TagsPage";
import SearchPopup from "./components/SearchPopup";

const NAV_ITEMS = [
	{ id: "home", label: "🏠 Home" },
	{ id: "people", label: "👥 People" },
	{ id: "birthdays", label: "🎂 Birthdays" },
	{ id: "tags", label: "🏷 Tags" },
];

export default function App() {
	const [navView, setNavView] = useState("home");
	const [people, setPeople] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [detailTab, setDetailTab] = useState("detail");
	const [searchOpen, setSearchOpen] = useState(false);

	const reloadPeople = useCallback(() => personList().then(setPeople), []);
	useEffect(() => {
		reloadPeople();
	}, [reloadPeople]);

	// Ctrl+F — global search
	useEffect(() => {
		const handler = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "f") {
				e.preventDefault();
				setSearchOpen(true);
			}
			if (e.key === "Escape") setSearchOpen(false);
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, []);

	const openPerson = useCallback((personId) => {
		setSelectedId(personId);
		setDetailTab("detail");
		setNavView("people");
		setSearchOpen(false);
	}, []);

	const handleNew = () => {
		setSelectedId(null);
		setDetailTab("create");
		setNavView("people");
	};
	const handleSaved = (id) => {
		reloadPeople();
		setSelectedId(id);
		setDetailTab("detail");
	};
	const handleDeleted = () => {
		reloadPeople();
		setSelectedId(null);
		setDetailTab("detail");
	};

	return (
		<div style={{ display: "flex", height: "100vh", overflow: "hidden", color: "var(--text-primary)", background: "var(--bg-primary)" }}>
			{/* ── Search popup (Ctrl+F) ─────────────────────────────── */}
			{searchOpen && <SearchPopup onSelect={openPerson} onClose={() => setSearchOpen(false)} />}

			{/* ── Nav sidebar ──────────────────────────────────────── */}
			<div style={{ width: "var(--nav-width)", borderRight: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", background: "var(--bg-secondary)", flexShrink: 0 }}>
				<div style={{ padding: "10px 8px 6px", fontWeight: "bold", fontSize: 14, borderBottom: "1px solid var(--border-primary)" }}>LookUP!</div>
				{NAV_ITEMS.map((item) => (
					<div
						key={item.id}
						onClick={() => setNavView(item.id)}
						style={{
							padding: "9px 12px",
							cursor: "pointer",
							userSelect: "none",
							background: navView === item.id ? "var(--bg-active)" : "transparent",
							color: navView === item.id ? "var(--text-on-active)" : "var(--text-primary)",
							borderLeft: navView === item.id ? "3px solid var(--nav-accent)" : "3px solid transparent",
						}}
					>
						{item.label}
					</div>
				))}
				<div style={{ marginTop: "auto", padding: "8px", fontSize: "var(--font-size-xs)", color: "var(--text-muted)", borderTop: "1px solid var(--border-secondary)" }}>Ctrl+F search</div>
			</div>

			{/* ── People sidebar (people view only) ────────────────── */}
			{navView === "people" && (
				<div style={{ width: "var(--sidebar-width)", borderRight: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
					<div style={{ padding: 8, borderBottom: "1px solid var(--border-primary)", display: "flex", gap: 4, alignItems: "center" }}>
						<strong>People</strong>
						<button
							onClick={handleNew}
							style={{ marginLeft: "auto", background: "var(--bg-active)", color: "var(--text-on-active)", border: "none", padding: "2px 7px", borderRadius: "var(--radius-sm)" }}
						>
							+ New
						</button>
					</div>
					<div style={{ flex: 1, overflowY: "auto" }}>
						{people.map((p) => (
							<div
								key={p.PersonID}
								onClick={() => {
									setSelectedId(p.PersonID);
									setDetailTab("detail");
								}}
								style={{
									padding: "6px 10px",
									cursor: "pointer",
									background: p.PersonID === selectedId ? "var(--bg-active)" : "transparent",
									color: p.PersonID === selectedId ? "var(--text-on-active)" : "var(--text-primary)",
									borderBottom: "1px solid var(--border-faint)",
								}}
							>
								<div>{p.FullName}</div>
								{p.Nickname && <div style={{ fontSize: "var(--font-size-xs)", opacity: 0.75 }}>{p.Nickname}</div>}
								{p.CategoryName && <div style={{ fontSize: "var(--font-size-xs)", color: p.PersonID === selectedId ? "#cce" : "var(--text-muted)" }}>{p.CategoryName}</div>}
							</div>
						))}
						{people.length === 0 && <div style={{ padding: 10, color: "var(--text-muted)" }}>No people yet.</div>}
					</div>
				</div>
			)}

			{/* ── Main content ─────────────────────────────────────── */}
			<div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
				{navView === "home" && <HomePage onOpenPerson={openPerson} />}
				{navView === "birthdays" && <BirthdaysPage onOpenPerson={openPerson} />}
				{navView === "tags" && <TagsPage onOpenPerson={openPerson} />}

				{navView === "people" && (
					<>
						{detailTab === "create" && <PersonForm onSaved={handleSaved} onCancel={() => setDetailTab("detail")} />}
						{detailTab !== "create" && selectedId && (
							<>
								{/* Detail-level tab bar */}
								<div style={{ display: "flex", gap: 4, marginBottom: 12, borderBottom: "1px solid var(--border-primary)", paddingBottom: 4 }}>
									{["detail", "edit", "debug"].map((t) => (
										<button
											key={t}
											onClick={() => setDetailTab(t)}
											style={{
												padding: "4px 10px",
												border: "1px solid var(--border-primary)",
												background: detailTab === t ? "var(--text-primary)" : "var(--bg-tertiary)",
												color: detailTab === t ? "var(--text-on-active)" : "var(--text-primary)",
											}}
										>
											{t.charAt(0).toUpperCase() + t.slice(1)}
										</button>
									))}
								</div>
								{detailTab === "detail" && <PersonDetail personId={selectedId} onDeleted={handleDeleted} onEdit={() => setDetailTab("edit")} />}
								{detailTab === "edit" && <PersonForm personId={selectedId} onSaved={handleSaved} onCancel={() => setDetailTab("detail")} />}
								{detailTab === "debug" && <DebugView personId={selectedId} />}
							</>
						)}
						{detailTab !== "create" && !selectedId && <div style={{ color: "var(--text-muted)", marginTop: 40, textAlign: "center" }}>Select a person, or click + New.</div>}
					</>
				)}
			</div>
		</div>
	);
}
