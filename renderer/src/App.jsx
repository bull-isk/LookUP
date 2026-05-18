// renderer/src/App.jsx
import { useState, useEffect, useCallback } from "react";
import { personList } from "./api/bridge";
import PersonDetail from "./pages/PersonDetail";
import PersonForm from "./pages/PersonForm";
import HomePage from "./pages/HomePage";
import BirthdaysPage from "./pages/BirthdaysPage";
import TagsPage from "./pages/TagsPage";
import SearchPopup from "./components/SearchPopup";

const NAV_ITEMS = [
	{ id: "home", label: "Home", icon: "fa-solid fa-house" },
	{ id: "people", label: "People", icon: "fa-solid fa-user-group" },
	{ id: "birthdays", label: "Birthdays", icon: "fa-solid fa-cake-candles" },
	{ id: "tags", label: "Tags", icon: "fa-solid fa-tag" },
];

export default function App() {
	const [navView, setNavView] = useState("home");
	const [people, setPeople] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [creating, setCreating] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
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

	const openTag = useCallback((tagName) => {
		setInitialTagName(tagName);
		setNavView("tags");
	}, []);

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

			{/* Indigo Sidebar Controller */}
			<div style={{ width: "var(--nav-width)", borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", background: "#090a12", flexShrink: 0 }}>
				<div style={{ padding: "26px 24px", fontWeight: "900", fontSize: "18px", letterSpacing: "0.02em", color: "#fff", background: "linear-gradient(rgba(99,102,241,0.05), transparent)" }}>
					LookUP!
				</div>

				<div style={{ padding: "8px 12px" }}>
					{NAV_ITEMS.map((item) => {
						const isActive = navView === item.id;
						return (
							<div
								key={item.id}
								onClick={() => handleNavClick(item.id)}
								style={{
									padding: "10px 16px",
									marginBottom: "4px",
									cursor: "pointer",
									userSelect: "none",
									borderRadius: "var(--radius-inner)",
									fontSize: "13px",
									background: isActive ? "var(--color-active)" : "transparent",
									color: isActive ? "#fff" : "var(--color-text-muted)",
									fontWeight: isActive ? "700" : "500",
									borderLeft: isActive ? "3px solid var(--color-accent)" : "3px solid transparent",
									display: "flex" /* added for layout alignment */,
									alignItems: "center" /* added for layout alignment */,
									gap: "10px" /* added for layout alignment */,
									transition: "var(--transition)",
								}}
								onMouseEnter={(e) => {
									if (!isActive) e.currentTarget.style.background = "rgba(99,102,241,0.04)";
								}}
								onMouseLeave={(e) => {
									if (!isActive) e.currentTarget.style.background = "transparent";
								}}
							>
								<i className={item.icon} style={{ width: "16px", color: isActive ? "var(--color-cyan)" : "var(--color-text-muted)" }}></i>
								{item.label}
							</div>
						);
					})}
				</div>

				<div style={{ marginTop: "auto", padding: "20px 24px", fontSize: "11px", color: "rgba(129, 140, 248, 0.4)", borderTop: "1px solid var(--color-border)", fontFamily: "monospace" }}>
					<span style={{ background: "rgba(99,102,241,0.12)", padding: "2px 5px", borderRadius: "4px", color: "var(--color-accent)" }}>Ctrl+F</span> Quick Search
				</div>
			</div>

			{/* Inner Directory Sub-bar */}
			{navView === "people" && (
				<div
					style={{
						width: "var(--sidebar-width)",
						borderRight: "1px solid var(--color-border)",
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
						flexShrink: 0,
						background: "rgba(7,8,13,0.4)",
					}}
				>
					<div style={{ padding: "20px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center" }}>
						<span style={{ fontSize: "11px", fontWeight: "800", color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>People</span>
						<button
							onClick={() => {
								setSelectedId(null);
								setCreating(true);
								setNavView("people");
							}}
							style={{
								marginLeft: "auto",
								background: "var(--color-primary)",
								color: "#fff",
								border: "none",
								padding: "5px 12px",
								fontSize: "11px",
								fontWeight: "700",
								borderRadius: "var(--radius-pill)",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								gap: "6px",
								transition: "var(--transition)",
							}}
							onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-accent)")}
							onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-primary)")}
						>
							<i className="fa-solid fa-plus" style={{ fontSize: "10px" }}></i> Card
						</button>
					</div>

					<div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
						{/* ini loop people map */}
						<div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
							{people.map((p) => {
								const isSelected = p.PersonID === selectedId && !creating;

								// Setup the color strings dynamically per record mapping
								const listBadgeColor = isSelected ? "#fff" : p.CategoryColor || "rgba(255, 255, 255, 0.5)";
								const listBadgeBg = isSelected ? "rgba(255, 255, 255, 0.15)" : p.CategoryColor ? `${p.CategoryColor}12` : "rgba(255,255,255,0.03)";
								const listBadgeBorder = isSelected ? "rgba(255, 255, 255, 0.25)" : p.CategoryColor ? `${p.CategoryColor}35` : "var(--color-border)";

								return (
									<div
										key={p.PersonID}
										onClick={() => {
											setSelectedId(p.PersonID);
											setCreating(false);
										}}
										style={{
											padding: "10px 12px",
											borderRadius: "var(--radius-inner)",
											cursor: "pointer",
											background: isSelected ? "var(--color-card-hover)" : "transparent",
											color: isSelected ? "#fff" : "var(--color-text)",
											marginBottom: "4px",
											display: "flex",
											alignItems: "center",
											gap: 12,
											border: isSelected ? "1px solid rgba(99, 102, 241, 0.25)" : "1px solid transparent",
											transition: "var(--transition)",
										}}
										onMouseEnter={(e) => {
											if (!isSelected) e.currentTarget.style.background = "rgba(99,102,241,0.02)";
										}}
										onMouseLeave={(e) => {
											if (!isSelected) e.currentTarget.style.background = "transparent";
										}}
									>
										{/* Profile Picture Frame Container Block */}
										<div
											style={{
												width: 36,
												height: 36,
												borderRadius: "50%",
												background: "rgba(99,102,241,0.1)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												overflow: "hidden",
												border: isSelected ? "1px solid rgba(255,255,255,0.4)" : `1px solid ${p.CategoryColor ? `${p.CategoryColor}60` : "rgba(99,102,241,0.2)"}`,
												flexShrink: 0,
											}}
										>
											{p.PrimaryImage ? (
												<img src={p.PrimaryImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
											) : (
												<span
													style={{
														fontSize: "13px",
														fontWeight: "600",
														color: isSelected ? "#fff" : p.CategoryColor || "var(--color-accent)",
														fontFamily: "var(--font-mono)",
													}}
												>
													{p.FullName?.[0]?.toUpperCase()}
												</span>
											)}
										</div>

										{/* Text Content Column: Hard-locked to 36px to force a true vertical midpoint calculation */}
										<div
											style={{
												minWidth: 0,
												flex: 1,
												height: 36,
												display: "flex",
												flexDirection: "column",
												justifyContent: "center",
												gap: "1px",
											}}
										>
											{/* 1. Category Label Sub-Row */}
											{p.CategoryName && (
												<div style={{ display: "flex", lineHeight: 1 }}>
													<span
														style={{
															fontSize: "10px",
															fontWeight: "700",
															textTransform: "lowercase",
															fontFamily: "var(--font-mono)",
															padding: "1px 5px",
															borderRadius: "3px",
															background: listBadgeBg,
															color: listBadgeColor,
															border: `1px solid ${listBadgeBorder}`,
															lineHeight: "10px",
															display: "inline-block",
														}}
													>
														{p.CategoryName}
													</span>
												</div>
											)}

											{/* 2. Full Name + Nickname String */}
											<div
												style={{
													fontWeight: "600",
													fontSize: "13px",
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
													color: isSelected ? "#fff" : "var(--color-text)",
													lineHeight: "14px",
													display: "flex",
													alignItems: "baseline",
												}}
											>
												<span>{p.FullName}</span>
												{p.Nickname && (
													<span
														style={{
															fontWeight: "400",
															fontSize: "12px",
															color: isSelected ? "rgba(255,255,255,0.6)" : "rgba(255, 255, 255, 0.4)",
															marginLeft: "5px",
															fontFamily: "var(--font-mono)",
														}}
													>
														({p.Nickname.toLowerCase()})
													</span>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}

			{/* Frame Viewport */}
			<div style={{ flex: 1, overflowY: "auto", padding: "30px 36px" }}>
				{navView === "home" && <HomePage onOpenPerson={openPerson} />}
				{navView === "birthdays" && <BirthdaysPage onOpenPerson={openPerson} />}
				{navView === "tags" && <TagsPage onOpenPerson={openPerson} initialTagName={initialTagName} onTagOpened={() => setInitialTagName(null)} />}
				{navView === "people" && (
					<div style={{ maxWidth: "950px" }}>
						{creating && <PersonForm onSaved={handleSaved} onCancel={() => setCreating(false)} />}
						{!creating && selectedId && <PersonDetail personId={selectedId} onDeleted={handleDeleted} onOpenTag={openTag} />}
						{!creating && !selectedId && (
							<div style={{ color: "var(--color-text-muted)", marginTop: 160, textAlign: "center", fontSize: "14px" }}>
								Select an active deck link to view specialized personal profiles.
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
