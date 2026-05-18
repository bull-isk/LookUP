// renderer/src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import { computeBirthday, formatBirthdayLine } from "../utils/birthday";

const api = window.electronAPI;

const S = {
	container: {
		background: "var(--color-panel)",
		border: "1px solid var(--color-border)",
		borderRadius: "24px",
		padding: "36px",
		display: "flex",
		flexDirection: "column",
		gap: "44px",
		boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
	},
	sectionTitle: {
		fontSize: "22px",
		fontWeight: "800",
		margin: "0 0 24px 0",
		display: "flex",
		alignItems: "center",
		gap: "12px",
		color: "#fff",
		letterSpacing: "-0.01em",
	},
	arrowLink: {
		color: "var(--color-accent)",
		fontSize: "14px",
		cursor: "pointer",
		marginLeft: "4px",
		opacity: 0.7,
		transition: "var(--transition)",
	},

	/* Birthday Layout Elements */
	birthdayBlock: {
		display: "grid",
		gridTemplateColumns: "1.1fr 1.9fr",
		gap: "24px",
		alignItems: "stretch",
	},
	heroCard: {
		background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(30, 27, 75, 0.3) 100%)",
		border: "1px solid rgba(99, 102, 241, 0.3)",
		borderRadius: "var(--radius-card)",
		padding: "28px",
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-between",
		cursor: "pointer",
		position: "relative",
		boxShadow: "0 10px 30px rgba(99, 102, 241, 0.1)",
		transition: "var(--transition)",
	},
	heroProfile: {
		display: "flex",
		gap: "20px",
		alignItems: "center",
		marginBottom: "24px",
	},
	heroImg: {
		width: "84px",
		height: "84px",
		borderRadius: "var(--radius-inner)",
		objectFit: "cover",
		border: "2px solid rgba(255, 255, 255, 0.15)",
	},
	heroImgFallback: {
		width: "84px",
		height: "84px",
		borderRadius: "var(--radius-inner)",
		background: "rgba(99, 102, 241, 0.15)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontSize: "32px",
		fontWeight: "800",
		color: "var(--color-accent)",
		border: "1px solid rgba(99, 102, 241, 0.3)",
		fontFamily: "var(--font-mono)",
	},
	heroMeta: {
		borderTop: "1px solid rgba(99, 102, 241, 0.2)",
		paddingTop: "20px",
	},
	laterContainer: {
		background: "rgba(7, 8, 13, 0.5)",
		border: "1px solid var(--color-border)",
		borderRadius: "var(--radius-card)",
		padding: "24px",
		display: "flex",
		flexDirection: "column",
	},
	laterTitle: {
		fontSize: "14px",
		fontWeight: "700",
		color: "var(--color-text-muted)",
		marginBottom: "16px",
		textTransform: "uppercase",
		letterSpacing: "0.05em",
	},

	/* Card Item Tracks */
	profileCard: {
		minWidth: "270px",
		maxWidth: "270px",
		background: "var(--color-card)",
		border: "1px solid var(--color-border)",
		borderRadius: "var(--radius-card)",
		padding: "20px",
		cursor: "pointer",
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-between",
		position: "relative",
	},
	cardTop: {
		display: "flex",
		alignItems: "center",
		gap: "14px",
		marginBottom: "20px",
	},
	cardAvatar: {
		width: "48px",
		height: "48px",
		borderRadius: "50%",
		objectFit: "cover",
		border: "1px solid rgba(255, 255, 255, 0.15)",
	},
	cardAvatarFallback: {
		width: "48px",
		height: "48px",
		borderRadius: "50%",
		background: "rgba(99, 102, 241, 0.1)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontSize: "18px",
		fontWeight: "700",
		color: "var(--color-accent)",
		fontFamily: "var(--font-mono)",
	},
	badge: (color) => ({
		fontSize: "10px",
		fontWeight: "700",
		padding: "3px 10px",
		borderRadius: "var(--radius-pill)",
		background: color ? `${color}25` : "rgba(99, 102, 241, 0.15)",
		color: color || "var(--color-accent)",
		border: `1px solid ${color ? `${color}50` : "rgba(99, 102, 241, 0.3)"}`,
		display: "inline-block",
		marginBottom: "6px",
	}),
	cardBottom: {
		borderTop: "1px solid rgba(99, 102, 241, 0.08)",
		paddingTop: "14px",
		fontSize: "12px",
		color: "var(--color-text-muted)",
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
	},
	actionCircle: {
		width: "30px",
		height: "30px",
		borderRadius: "50%",
		background: "rgba(99, 102, 241, 0.1)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: "var(--color-accent)",
		fontWeight: "bold",
		fontSize: "14px",
		border: "1px solid rgba(99, 102, 241, 0.15)",
		transition: "var(--transition)",
	},
	empty: { color: "var(--color-text-muted)", fontStyle: "italic", fontSize: "13px", padding: "24px", textAlign: "center" },
};

export default function HomePage({ onOpenPerson }) {
	const [birthdays, setBirthdays] = useState([]);
	const [recent, setRecent] = useState([]);
	const [favorites, setFavorites] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([api.personBirthdays(), api.personRecentlyUpdated(5), api.personFavorites(5)]).then(([bdays, rec, favs]) => {
			const enriched = bdays
				.map((p) => ({ ...p, _bday: computeBirthday(p.Birthdate) }))
				.filter((p) => p._bday)
				.sort((a, b) => a._bday.daysUntilNext - b._bday.daysUntilNext);

			setBirthdays(enriched);
			setRecent(rec);
			setFavorites(favs);
			setLoading(false);
		});
	}, []);

	if (loading) return <div style={{ color: "var(--color-accent)", padding: "40px", fontWeight: "600" }}>Loading deck interface...</div>;

	const featuredBday = birthdays[0];
	const laterBdays = birthdays.slice(1, 4);

	return (
		<div style={S.container}>
			{/* ── SECTION 1: UPCOMING CELEBRATIONS ── */}
			<div>
				<h2 style={S.sectionTitle} onMouseEnter={() => (document.getElementById("arr1").style.opacity = 1)} onMouseLeave={() => (document.getElementById("arr1").style.opacity = 0.7)}>
					<i className="fa-solid fa-cake-candles" style={{ color: "var(--color-accent)" }}></i> Birthday Soon!
					<i id="arr1" className="fa-solid fa-chevron-right" style={S.arrowLink}></i>
				</h2>

				<div style={S.birthdayBlock}>
					{featuredBday ? (
						<div
							style={S.heroCard}
							className="deck-card"
							onClick={() => onOpenPerson(featuredBday.PersonID)}
							onMouseEnter={(e) => {
								e.currentTarget.style.borderColor = "var(--color-cyan)";
								e.currentTarget.querySelector(".hero-arrow").style.background = "var(--color-primary)";
								e.currentTarget.querySelector(".hero-arrow").style.color = "#fff";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
								e.currentTarget.querySelector(".hero-arrow").style.background = "rgba(99, 102, 241, 0.1)";
								e.currentTarget.querySelector(".hero-arrow").style.color = "var(--color-accent)";
							}}
						>
							<div style={S.heroProfile}>
								{featuredBday.PrimaryImage ? (
									<img src={featuredBday.PrimaryImage} style={S.heroImg} alt="" />
								) : (
									<div style={S.heroImgFallback}>{featuredBday.FullName?.[0]?.toUpperCase()}</div>
								)}
								<div style={{ minWidth: 0, flex: 1 }}>
									<span style={S.badge(featuredBday.CategoryColor)}>{featuredBday.CategoryName || "Crew"}</span>
									<div style={{ fontSize: "22px", fontWeight: "800", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff" }}>
										{featuredBday.FullName}
									</div>
									{featuredBday.Nickname && <div style={{ color: "var(--color-text-muted)", fontSize: "14px", fontWeight: "500" }}>({featuredBday.Nickname})</div>}
								</div>
								<div className="hero-arrow" style={{ ...S.actionCircle, width: "38px", height: "38px", position: "absolute", right: "24px", top: "40px" }}>
									<i className="fa-solid fa-arrow-right" style={{ fontSize: "12px" }}></i>
								</div>
							</div>
							<div style={S.heroMeta}>
								<div style={{ fontSize: "16px", fontWeight: "700", color: "var(--color-cyan)", marginBottom: "4px" }}>{formatBirthdayLine(featuredBday._bday)}</div>
								<div style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>Birthdate: {featuredBday.Birthdate}</div>
							</div>
						</div>
					) : (
						<div style={S.heroCard}>No chronological logs available.</div>
					)}

					{/* Horizontal Sub-List */}
					<div style={S.laterContainer}>
						<div style={S.laterTitle}>Later Birthdays :</div>
						<div style={{ display: "flex", gap: "14px", flex: 1, overflowX: "auto" }}>
							{laterBdays.map((p) => (
								<div
									key={p.PersonID}
									style={{ ...S.profileCard, minWidth: "210px", background: "rgba(99, 102, 241, 0.02)" }}
									className="deck-card"
									onClick={() => onOpenPerson(p.PersonID)}
									onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-border-hover)")}
									onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
								>
									<div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
										{p.PrimaryImage ? (
											<img src={p.PrimaryImage} style={{ ...S.cardAvatar, width: "36px", height: "36px" }} alt="" />
										) : (
											<div style={{ ...S.cardAvatarFallback, width: "36px", height: "36px" }}>{p.FullName?.[0]?.toUpperCase()}</div>
										)}
										<div style={{ minWidth: 0, flex: 1 }}>
											<div style={{ fontSize: "14px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff" }}>{p.FullName}</div>
											{p.Nickname && <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{p.Nickname}</span>}
										</div>
									</div>
									<div
										style={{
											fontSize: "12px",
											marginTop: "14px",
											borderTop: "1px solid rgba(99, 102, 241, 0.08)",
											paddingTop: "10px",
											color: "var(--color-accent)",
											fontWeight: "600",
										}}
									>
										Turns {p._bday.ageNext} in {p._bday.daysUntilNext} days
									</div>
								</div>
							))}
							{laterBdays.length === 0 && <div style={S.empty}>No secondary logs scheduled.</div>}
						</div>
					</div>
				</div>
			</div>

			{/* ── SECTION 2: RECENT UPDATES TRACK ── */}
			<div>
				<h2 style={S.sectionTitle} onMouseEnter={() => (document.getElementById("arr2").style.opacity = 1)} onMouseLeave={() => (document.getElementById("arr2").style.opacity = 0.7)}>
					<i className="fa-solid fa-clock-rotate-left" style={{ color: "var(--color-accent)" }}></i> Recently Updated
					<i id="arr2" className="fa-solid fa-chevron-right" style={S.arrowLink}></i>
				</h2>
				<div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "10px" }}>
					{recent.map((p) => (
						<div
							key={p.PersonID}
							style={S.profileCard}
							className="deck-card"
							onClick={() => onOpenPerson(p.PersonID)}
							onMouseEnter={(e) => {
								e.currentTarget.style.borderColor = "var(--color-border-hover)";
								e.currentTarget.querySelector(".act-arr").style.background = "var(--color-primary)";
								e.currentTarget.querySelector(".act-arr").style.color = "#fff";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.borderColor = "var(--color-border)";
								e.currentTarget.querySelector(".act-arr").style.background = "rgba(99, 102, 241, 0.1)";
								e.currentTarget.querySelector(".act-arr").style.color = "var(--color-accent)";
							}}
						>
							<div style={S.cardTop}>
								{p.PrimaryImage ? <img src={p.PrimaryImage} style={S.cardAvatar} alt="" /> : <div style={S.cardAvatarFallback}>{p.FullName?.[0]?.toUpperCase()}</div>}
								<div style={{ minWidth: 0, flex: 1 }}>
									<span style={S.badge(p.CategoryColor)}>{p.CategoryName || "Friend"}</span>
									<div style={{ fontWeight: "700", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff" }}>{p.FullName}</div>
									{p.Nickname && <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{p.Nickname}</div>}
								</div>
							</div>
							<div style={S.cardBottom}>
								<span style={{ fontWeight: "500" }}>Data entries saved</span>
								<div className="act-arr" style={S.actionCircle}>
									<i className="fa-solid fa-arrow-right" style={{ fontSize: "11px" }}></i>
								</div>
							</div>
						</div>
					))}
					{recent.length === 0 && <div style={S.empty}>No profiles altered yet.</div>}
				</div>
			</div>

			{/* ── SECTION 3: FAVORITES RECORD TRACK ── */}
			<div>
				<h2 style={S.sectionTitle} onMouseEnter={() => (document.getElementById("arr3").style.opacity = 1)} onMouseLeave={() => (document.getElementById("arr3").style.opacity = 0.7)}>
					<i className="fa-solid fa-star" style={{ color: "var(--color-warning)" }}></i> Your Favorites
					<i id="arr3" className="fa-solid fa-chevron-right" style={S.arrowLink}></i>
				</h2>
				<div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "10px" }}>
					{favorites.map((p) => (
						<div
							key={p.PersonID}
							style={S.profileCard}
							className="deck-card"
							onClick={() => onOpenPerson(p.PersonID)}
							onMouseEnter={(e) => {
								e.currentTarget.style.borderColor = "var(--color-border-hover)";
								e.currentTarget.querySelector(".fav-arr").style.background = "var(--color-primary)";
								e.currentTarget.querySelector(".fav-arr").style.color = "#fff";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.borderColor = "var(--color-border)";
								e.currentTarget.querySelector(".fav-arr").style.background = "rgba(99, 102, 241, 0.1)";
								e.currentTarget.querySelector(".fav-arr").style.color = "var(--color-accent)";
							}}
						>
							<div style={S.cardTop}>
								{p.PrimaryImage ? <img src={p.PrimaryImage} style={S.cardAvatar} alt="" /> : <div style={S.cardAvatarFallback}>{p.FullName?.[0]?.toUpperCase()}</div>}
								<div style={{ minWidth: 0, flex: 1 }}>
									<span style={S.badge(p.CategoryColor)}>{p.CategoryName || "Online"}</span>
									<div style={{ fontWeight: "700", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff" }}>{p.FullName}</div>
									{p.Nickname && <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{p.Nickname}</div>}
								</div>
							</div>
							<div style={S.cardBottom}>
								<span
									style={{
										fontFamily: "var(--font-mono)",
										color: "var(--color-cyan)",
										fontWeight: "600",
										fontSize: "11px",
										background: "rgba(56, 189, 248, 0.08)",
										padding: "2px 6px",
										borderRadius: "4px",
									}}
								>
									{p.score || 0} details logged
								</span>
								<div className="fav-arr" style={S.actionCircle}>
									<i className="fa-solid fa-arrow-right" style={{ fontSize: "11px" }}></i>
								</div>
							</div>
						</div>
					))}
					{favorites.length === 0 && <div style={S.empty}>No favorite logs compiled.</div>}
				</div>
			</div>
		</div>
	);
}
