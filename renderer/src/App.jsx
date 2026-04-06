// renderer/src/App.jsx
import { useState, useEffect, useCallback } from "react";
import { personList } from "./api/bridge";
import PersonDetail from "./pages/PersonDetail";
import PersonForm from "./pages/PersonForm";
import DebugView from "./pages/DebugView";
import HomePage from "./pages/HomePage";
import BirthdaysPage from "./pages/BirthdaysPage";
import TagsPage from "./pages/TagsPage";

// ── Styles ───────────────────────────────────────────────────────
const S = {
	root: {
		display: "flex",
		height: "100vh",
		fontFamily: "monospace",
		fontSize: 13,
		overflow: "hidden",
		background: "#0f111a", // deep indigo-black
		color: "#a5b0d6",
	},

	// Left nav
	nav: {
		width: 110,
		borderRight: "1px solid #2a2f4a",
		display: "flex",
		flexDirection: "column",
		background: "#161a2b",
		flexShrink: 0,
	},
	navTitle: {
		padding: "10px 8px 6px",
		fontWeight: "bold",
		fontSize: 14,
		borderBottom: "1px solid #2a2f4a",
		color: "#e8ecff",
	},
	navItem: (active) => ({
		padding: "9px 12px",
		cursor: "pointer",
		background: active ? "#4f46e5" : "transparent",
		color: active ? "#fff" : "#a5b0d6",
		borderLeft: active ? "3px solid #818cf8" : "3px solid transparent",
		userSelect: "none",
	}),

	// People sidebar
	sidebar: {
		width: 200,
		borderRight: "1px solid #2a2f4a",
		display: "flex",
		flexDirection: "column",
		overflow: "hidden",
		flexShrink: 0,
		background: "#121526",
	},
	sideTop: {
		padding: "8px",
		borderBottom: "1px solid #2a2f4a",
		display: "flex",
		gap: 4,
		alignItems: "center",
	},
	personList: { flex: 1, overflowY: "auto" },
	personItem: (active) => ({
		padding: "6px 10px",
		cursor: "pointer",
		background: active ? "#6366f1" : "transparent",
		color: active ? "#fff" : "#a5b0d6",
		borderBottom: "1px solid #1a1d2e",
	}),

	// Main content
	main: {
		flex: 1,
		overflowY: "auto",
		padding: 14,
		background: "#0f111a",
	},

	tabs: {
		display: "flex",
		gap: 4,
		marginBottom: 12,
		borderBottom: "1px solid #2a2f4a",
		paddingBottom: 4,
	},
	tab: (active) => ({
		padding: "4px 10px",
		cursor: "pointer",
		border: "1px solid #3a3f63",
		background: active ? "#4f46e5" : "#1a1d2e",
		color: active ? "#fff" : "#a5b0d6",
	}),
};

const NAV_ITEMS = [
	{ id: "home", label: "🏠 Home" },
	{ id: "people", label: "👥 People" },
	{ id: "birthdays", label: "🎂 Birthdays" },
	{ id: "tags", label: "🏷 Tags" },
];

export default function App() {
	const [navView, setNavView] = useState("home"); // current top-level page
	const [people, setPeople] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [detailTab, setDetailTab] = useState("detail"); // 'detail' | 'edit' | 'debug'

	const reloadPeople = useCallback(() => {
		personList().then(setPeople);
	}, []);

	useEffect(() => {
		reloadPeople();
	}, [reloadPeople]);

	// Called by any page when it wants to navigate to a person
	const openPerson = useCallback((personId) => {
		setSelectedId(personId);
		setDetailTab("detail");
		setNavView("people");
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

	// ── Render ────────────────────────────────────────────────────
	return (
		<div style={S.root}>
			{/* ── Nav sidebar ──────────────────────────────────────── */}
			<div style={S.nav}>
				<div style={S.navTitle}>LookUP!</div>
				{NAV_ITEMS.map((item) => (
					<div key={item.id} style={S.navItem(navView === item.id)} onClick={() => setNavView(item.id)}>
						{item.label}
					</div>
				))}
			</div>

			{/* ── People sidebar (only shown on 'people' view) ──────── */}
			{navView === "people" && (
				<div style={S.sidebar}>
					<div style={S.sideTop}>
						<strong>People</strong>
						<button onClick={handleNew} style={{ marginLeft: "auto" }}>
							+ New
						</button>
					</div>
					<div style={S.personList}>
						{people.map((p) => (
							<div
								key={p.PersonID}
								style={S.personItem(p.PersonID === selectedId)}
								onClick={() => {
									setSelectedId(p.PersonID);
									setDetailTab("detail");
								}}
							>
								<div>{p.FullName}</div>
								{p.Nickname && <div style={{ fontSize: 11, opacity: 0.75 }}>{p.Nickname}</div>}
								{p.CategoryName && <div style={{ fontSize: 10, color: p.PersonID === selectedId ? "#cce" : "#888" }}>{p.CategoryName}</div>}
							</div>
						))}
						{people.length === 0 && <div style={{ padding: 10, color: "#999" }}>No people yet.</div>}
					</div>
				</div>
			)}

			{/* ── Main panel ───────────────────────────────────────── */}
			<div style={S.main}>
				{navView === "home" && <HomePage onOpenPerson={openPerson} />}

				{navView === "birthdays" && <BirthdaysPage onOpenPerson={openPerson} />}

				{navView === "tags" && <TagsPage onOpenPerson={openPerson} />}

				{navView === "people" && (
					<>
						{/* Create flow */}
						{detailTab === "create" && <PersonForm onSaved={handleSaved} onCancel={() => setDetailTab("detail")} />}

						{/* Detail / Edit / Debug tabs */}
						{detailTab !== "create" && selectedId && (
							<>
								<div style={S.tabs}>
									<button style={S.tab(detailTab === "detail")} onClick={() => setDetailTab("detail")}>
										Detail
									</button>
									<button style={S.tab(detailTab === "edit")} onClick={() => setDetailTab("edit")}>
										Edit
									</button>
									<button style={S.tab(detailTab === "debug")} onClick={() => setDetailTab("debug")}>
										Debug JSON
									</button>
								</div>
								{detailTab === "detail" && <PersonDetail personId={selectedId} onDeleted={handleDeleted} onEdit={() => setDetailTab("edit")} />}
								{detailTab === "edit" && <PersonForm personId={selectedId} onSaved={handleSaved} onCancel={() => setDetailTab("detail")} />}
								{detailTab === "debug" && <DebugView personId={selectedId} />}
							</>
						)}

						{detailTab !== "create" && !selectedId && <div style={{ color: "#999", marginTop: 40, textAlign: "center" }}>Select a person from the list, or click + New.</div>}
					</>
				)}
			</div>
		</div>
	);
}
