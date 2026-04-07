// renderer/src/pages/PersonForm.jsx
// Simplified: Create only. 3 fields. No edit flow (handled inline in PersonDetail).
import { useState, useEffect } from "react";
import { personCreate, lookupAll } from "../api/bridge";

const I = {
	// shared input style key
	width: "100%",
	padding: "6px 8px",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-sm)",
	background: "var(--color-surface-2)",
	color: "var(--color-text)",
	marginTop: 4,
};

export default function PersonForm({ onSaved, onCancel }) {
	const [name, setName] = useState("");
	const [nick, setNick] = useState("");
	const [catId, setCatId] = useState("");
	const [cats, setCats] = useState([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		lookupAll().then((d) => setCats(d.categories));
	}, []);

	const handleSubmit = async () => {
		if (!name.trim()) {
			setError("Full name is required.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			const id = await personCreate({
				FullName: name.trim(),
				Nickname: nick.trim() || null,
				CategoryID: catId ? Number(catId) : null,
				Birthdate: null,
				Address: null,
				ImpressionNote: null,
				TimezoneID: null,
			});
			onSaved(id);
		} catch (e) {
			setError(e.message || "Failed to create.");
			setSaving(false);
		}
	};

	const handleKey = (e) => {
		if (e.key === "Enter") handleSubmit();
	};

	return (
		<div style={{ maxWidth: 400 }}>
			<h3 style={{ margin: "0 0 16px", color: "var(--color-text)" }}>New Person</h3>
			{error && <div style={{ color: "var(--color-danger)", marginBottom: 8 }}>{error}</div>}

			<label style={{ display: "block", marginBottom: 12, color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
				Full Name *
				<input autoFocus style={I} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKey} placeholder="Full name" />
			</label>

			<label style={{ display: "block", marginBottom: 12, color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
				Nickname
				<input style={I} value={nick} onChange={(e) => setNick(e.target.value)} onKeyDown={handleKey} placeholder="Nickname (optional)" />
			</label>

			<label style={{ display: "block", marginBottom: 20, color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
				Category
				<select style={I} value={catId} onChange={(e) => setCatId(e.target.value)}>
					<option value="">— none —</option>
					{cats.map((c) => (
						<option key={c.CategoryID} value={c.CategoryID}>
							{c.CategoryName}
						</option>
					))}
				</select>
			</label>

			<div style={{ display: "flex", gap: 8 }}>
				<button
					onClick={handleSubmit}
					disabled={saving}
					style={{ padding: "6px 18px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontWeight: "bold" }}
				>
					{saving ? "Creating…" : "Create"}
				</button>
				<button
					onClick={onCancel}
					style={{ padding: "6px 14px", background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
