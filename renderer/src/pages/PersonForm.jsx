// renderer/src/pages/PersonForm.jsx
import { useState, useEffect } from "react";
import { personCreate, lookupAll } from "../api/bridge";
import PronounInput from "../components/PronounInput";
import CategoryInput from "../components/CategoryInput";

const api = window.electronAPI;

const I = {
	width: "100%",
	padding: "6px 8px",
	border: "1px solid var(--color-border)",
	borderRadius: "var(--radius-sm)",
	background: "var(--color-surface-2)",
	color: "var(--color-text)",
	marginTop: 4,
};
const lbl = { display: "block", marginBottom: 14, color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" };

export default function PersonForm({ onSaved, onCancel }) {
	const [name, setName] = useState("");
	const [nick, setNick] = useState("");
	const [catId, setCatId] = useState(null);
	const [pronounIds, setPronounIds] = useState([]);
	const [lookups, setLookups] = useState(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		lookupAll().then(setLookups);
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
				CategoryID: catId || null,
				Birthdate: null,
				Address: null,
				ImpressionNote: null,
				TimezoneID: null,
			});
			if (pronounIds.length > 0) await api.personSetPronouns(id, pronounIds);
			onSaved(id);
		} catch (e) {
			setError(e.message || "Failed to create.");
			setSaving(false);
		}
	};

	const refreshLookups = () => lookupAll().then(setLookups);

	if (!lookups) return <div style={{ color: "var(--color-text-muted)" }}>Loading…</div>;

	return (
		<div style={{ maxWidth: 420 }}>
			<h3 style={{ margin: "0 0 20px", color: "var(--color-text)" }}>New Person</h3>
			{error && <div style={{ color: "var(--color-danger)", marginBottom: 10 }}>{error}</div>}

			<label style={lbl}>
				Full Name *
				<input autoFocus style={I} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="Full name" />
			</label>

			<label style={lbl}>
				Nickname
				<input style={I} value={nick} onChange={(e) => setNick(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="Optional" />
			</label>

			<label style={lbl}>
				Category
				<div style={{ marginTop: 4 }}>
					<CategoryInput
						value={catId}
						categories={lookups.categories}
						onChange={setCatId}
						onNewCategory={async (name) => {
							const id = await api.lookupFindOrCreateCategory(name);
							refreshLookups();
							return id;
						}}
					/>
				</div>
			</label>

			<label style={lbl}>
				Pronouns
				<div style={{ marginTop: 6 }}>
					<PronounInput
						value={pronounIds}
						allPronouns={lookups.pronouns}
						onChange={setPronounIds}
						onNewPronoun={async (text) => {
							const id = await api.lookupFindOrCreatePronoun(text);
							refreshLookups();
							return id;
						}}
					/>
				</div>
			</label>

			<div style={{ display: "flex", gap: 8, marginTop: 8 }}>
				<button
					onClick={handleSubmit}
					disabled={saving}
					style={{ padding: "6px 18px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontWeight: "bold", cursor: "pointer" }}
				>
					{saving ? "Creating…" : "Create"}
				</button>
				<button
					onClick={onCancel}
					style={{
						padding: "6px 14px",
						background: "transparent",
						color: "var(--color-text-muted)",
						border: "1px solid var(--color-border)",
						borderRadius: "var(--radius-sm)",
						cursor: "pointer",
					}}
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
