import { useState, useEffect, useCallback } from "react";
import { personList } from "./api/bridge";
import PersonDetail from "./pages/PersonDetail";
import PersonForm from "./pages/PersonForm";
import DebugView from "./pages/DebugView";

// Barebone inline styles — no polish, just structure
const styles = {
	root: { display: "flex", height: "100vh", fontFamily: "monospace", fontSize: 13 },
	sidebar: { width: 220, borderRight: "1px solid #ccc", display: "flex", flexDirection: "column", overflow: "hidden" },
	sideTop: { padding: "8px", borderBottom: "1px solid #ccc", display: "flex", gap: 4 },
	list: { flex: 1, overflowY: "auto" },
	item: (active) => ({
		padding: "6px 10px",
		cursor: "pointer",
		background: active ? "#0066cc" : "transparent",
		color: active ? "#fff" : "inherit",
	}),
	main: { flex: 1, overflowY: "auto", padding: 12 },
	tabs: { display: "flex", gap: 4, marginBottom: 12, borderBottom: "1px solid #ccc", paddingBottom: 4 },
	tab: (active) => ({
		padding: "4px 10px",
		cursor: "pointer",
		border: "1px solid #999",
		background: active ? "#333" : "#f0f0f0",
		color: active ? "#fff" : "inherit",
	}),
};

export default function App() {
	const [people, setPeople] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [view, setView] = useState("detail"); // 'detail' | 'edit' | 'create' | 'debug'

	const reload = useCallback(() => {
		personList().then(setPeople);
	}, []);

	useEffect(() => {
		reload();
	}, [reload]);

	const handleSelect = (id) => {
		setSelectedId(id);
		setView("detail");
	};
	const handleNew = () => {
		setSelectedId(null);
		setView("create");
	};
	const handleSaved = (id) => {
		reload();
		setSelectedId(id);
		setView("detail");
	};
	const handleDeleted = () => {
		reload();
		setSelectedId(null);
		setView("detail");
	};

	return (
		<div style={styles.root}>
			{/* Sidebar */}
			<div style={styles.sidebar}>
				<div style={styles.sideTop}>
					<strong>LookUP!</strong>
					<button onClick={handleNew} style={{ marginLeft: "auto" }}>
						+ New
					</button>
				</div>
				<div style={styles.list}>
					{people.map((p) => (
						<div key={p.PersonID} style={styles.item(p.PersonID === selectedId)} onClick={() => handleSelect(p.PersonID)}>
							{p.FullName}
							{p.Nickname ? ` (${p.Nickname})` : ""}
						</div>
					))}
					{people.length === 0 && (
						<div style={{ padding: 10, color: "#999" }}>
							No people yet.
							<br />
							Click + New.
						</div>
					)}
				</div>
			</div>

			{/* Main panel */}
			<div style={styles.main}>
				{view === "create" && <PersonForm onSaved={handleSaved} onCancel={() => setView("detail")} />}

				{view !== "create" && selectedId && (
					<>
						<div style={styles.tabs}>
							<button style={styles.tab(view === "detail")} onClick={() => setView("detail")}>
								Detail
							</button>
							<button style={styles.tab(view === "edit")} onClick={() => setView("edit")}>
								Edit
							</button>
							<button style={styles.tab(view === "debug")} onClick={() => setView("debug")}>
								Debug JSON
							</button>
						</div>

						{view === "detail" && <PersonDetail personId={selectedId} onDeleted={handleDeleted} onEdit={() => setView("edit")} />}
						{view === "edit" && <PersonForm personId={selectedId} onSaved={handleSaved} onCancel={() => setView("detail")} />}
						{view === "debug" && <DebugView personId={selectedId} />}
					</>
				)}

				{view === "detail" && !selectedId && <div style={{ color: "#999", marginTop: 40, textAlign: "center" }}>Select a person from the list, or click + New.</div>}
			</div>
		</div>
	);
}
