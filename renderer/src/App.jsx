// renderer/src/App.jsx — REPLACE ENTIRELY
import { useState, useEffect, useCallback } from "react";
import { personList } from "./api/bridge";
import PersonDetail from "./pages/PersonDetail";
import PersonForm from "./pages/PersonForm";
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
	const [creating, setCreating] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	// Phase C fix: tag name to open drill-down immediately in TagsPage
	const [initialTagName, setInitialTagName] = useState(null);

	const reloadPeople = useCallback(() => personList().then(setPeople), []);
	useEffect(() => {
		reloadPeople();
	}, [reloadPeople]);

	useEffect(() => {
		const h = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "f") {
				e.preventDefault();
				setSearchOpen(true);
			}
			if (e.key === "Escape") setSearchOpen(false);
		};
		window.addEventListener("keydown", h);
		return () => window.removeEventListener("keydown", h);
	}, []);

	const openPerson = useCallback((id) => {
		setSelectedId(id);
		setCreating(false);
		setNavView("people");
		setSearchOpen(false);
	}, []);

	// Called from TagInput chip click — navigate directly to tag drill-down
	const openTag = useCallback((tagName) => {
		setInitialTagName(tagName);
		setNavView("tags");
	}, []);

	// When manually clicking the Tags nav item, clear any preselected tag
	const handleNavClick = (itemId) => {
		if (itemId === "tags") setInitialTagName(null);
		setNavView(itemId);
	};

	const handleSaved = (id) => {
		reloadPeople();
		setSelectedId(id);
		setCreating(false);
	};
	const handleDeleted = () => {
		reloadPeople();
		setSelectedId(null);
		setCreating(false);
	};

	return (
		<div style={{ display: "flex", height: "100vh", overflow: "hidden", color: "var(--color-text)", background: "var(--color-bg)" }}>
			{searchOpen && <SearchPopup onSelect={openPerson} onClose={() => setSearchOpen(false)} />}

			{/* Nav sidebar */}
			<div style={{ width: "var(--nav-width)", borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", background: "var(--color-surface)", flexShrink: 0 }}>
				<div style={{ padding: "10px 8px 6px", fontWeight: "bold", fontSize: 14, borderBottom: "1px solid var(--color-border)" }}>LookUP!</div>
				{NAV_ITEMS.map((item) => (
					<div
						key={item.id}
						onClick={() => handleNavClick(item.id)}
						style={{
							padding: "9px 12px",
							cursor: "pointer",
							userSelect: "none",
							background: navView === item.id ? "var(--color-active)" : "transparent",
							color: navView === item.id ? "var(--color-text-on-primary)" : "var(--color-text)",
							borderLeft: navView === item.id ? "3px solid var(--color-accent)" : "3px solid transparent",
						}}
					>
						{item.label}
					</div>
				))}
				<div style={{ marginTop: "auto", padding: "8px", fontSize: "var(--font-size-xs)", color: "var(--color-text-faint)", borderTop: "1px solid var(--color-border)" }}>Ctrl+F search</div>
			</div>

			{/* People sidebar */}
			{navView === "people" && (
				<div style={{ width: "var(--sidebar-width)", borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
					<div style={{ padding: 8, borderBottom: "1px solid var(--color-border)", display: "flex", gap: 4, alignItems: "center" }}>
						<strong>People</strong>
						<button
							onClick={() => {
								setSelectedId(null);
								setCreating(true);
								setNavView("people");
							}}
							style={{ marginLeft: "auto", background: "var(--color-primary)", color: "#fff", border: "none", padding: "2px 7px", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
						>
							+ New
						</button>
					</div>
					<div style={{ flex: 1, overflowY: "auto" }}>
						{people.map((p) => {
							const isSelected = p.PersonID === selectedId && !creating;
							return (
								<div
									key={p.PersonID}
									onClick={() => {
										setSelectedId(p.PersonID);
										setCreating(false);
									}}
									style={{
										padding: "6px 10px",
										cursor: "pointer",
										background: isSelected ? "var(--color-active)" : "transparent",
										color: isSelected ? "var(--color-text-on-primary)" : "var(--color-text)",
										borderBottom: "1px solid var(--color-border)",
										display: "flex",
										alignItems: "center",
										gap: 8,
									}}
								>
									{/* Mini profile picture or initial */}
									<div
										style={{
											width: 32,
											height: 32,
											borderRadius: "50%",
											flexShrink: 0,
											overflow: "hidden",
											border: "1px solid var(--color-border)",
											background: "var(--color-surface-3)",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										{p.PrimaryImage ? (
											<img src={p.PrimaryImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
										) : (
											<span style={{ fontSize: 13, color: "var(--color-text-faint)" }}>{p.FullName?.[0]?.toUpperCase() || "?"}</span>
										)}
									</div>
									{/* Text info */}
									<div style={{ minWidth: 0 }}>
										<div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.FullName}</div>
										{p.Nickname && (
											<div style={{ fontSize: "var(--font-size-xs)", opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.Nickname}</div>
										)}
										{p.CategoryName && (
											<div
												style={{
													fontSize: "var(--font-size-xs)",
													color: isSelected ? "var(--color-text-on-primary)" : "var(--color-text-faint)",
													opacity: isSelected ? 0.8 : 1,
												}}
											>
												{p.CategoryName}
											</div>
										)}
									</div>
								</div>
							);
						})}
						{people.length === 0 && <div style={{ padding: 10, color: "var(--color-text-faint)" }}>No people yet.</div>}
					</div>
				</div>
			)}

			{/* Main panel */}
			<div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
				{navView === "home" && <HomePage onOpenPerson={openPerson} />}
				{navView === "birthdays" && <BirthdaysPage onOpenPerson={openPerson} />}
				{navView === "tags" && <TagsPage onOpenPerson={openPerson} initialTagName={initialTagName} onTagOpened={() => setInitialTagName(null)} />}
				{navView === "people" && (
					<>
						{creating && <PersonForm onSaved={handleSaved} onCancel={() => setCreating(false)} />}
						{!creating && selectedId && <PersonDetail personId={selectedId} onDeleted={handleDeleted} onOpenTag={openTag} />}
						{!creating && !selectedId && <div style={{ color: "var(--color-text-faint)", marginTop: 40, textAlign: "center" }}>Select a person, or click + New.</div>}
					</>
				)}
			</div>
		</div>
	);
}
