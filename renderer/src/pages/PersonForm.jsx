import { useState, useEffect } from "react";
import { personCreate, personUpdate, personFull, personSetPronouns, personSetTags, lookupAll } from "../api/bridge";

const field = { display: "block", marginBottom: 8 };
const input = { width: "100%", padding: 4, boxSizing: "border-box" };
const section = { marginTop: 16, paddingTop: 8, borderTop: "1px solid #ddd" };

export default function PersonForm({ personId, onSaved, onCancel }) {
	const isEdit = !!personId;
	const [lookups, setLookups] = useState(null);
	const [form, setForm] = useState({
		FullName: "",
		Nickname: "",
		Birthdate: "",
		Address: "",
		ImpressionNote: "",
		TimezoneID: "",
	});
	const [selectedPronouns, setSelectedPronouns] = useState([]);
	const [selectedTags, setSelectedTags] = useState([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		lookupAll().then(setLookups);
		if (isEdit) {
			personFull(personId).then((data) => {
				if (!data) return;
				const p = data.person;
				setForm({
					FullName: p.FullName || "",
					Nickname: p.Nickname || "",
					Birthdate: p.Birthdate || "",
					Address: p.Address || "",
					ImpressionNote: p.ImpressionNote || "",
					TimezoneID: p.TimezoneID || "",
				});
				setSelectedPronouns(data.pronouns.map((x) => x.PronounsID));
				setSelectedTags(data.tags.map((x) => x.TagID));
			});
		}
	}, [personId]);

	const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

	const toggleMulti = (arr, setArr, id) => {
		setArr((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	};

	const handleSubmit = async () => {
		if (!form.FullName.trim()) {
			setError("Full name is required.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			const payload = {
				...form,
				TimezoneID: form.TimezoneID ? Number(form.TimezoneID) : null,
			};
			let id = personId;
			if (isEdit) {
				await personUpdate(personId, payload);
			} else {
				id = await personCreate(payload);
			}
			await personSetPronouns(id, selectedPronouns);
			await personSetTags(id, selectedTags);
			onSaved(id);
		} catch (e) {
			setError(e.message || "Save failed.");
		} finally {
			setSaving(false);
		}
	};

	if (!lookups) return <div>Loading form...</div>;

	return (
		<div>
			<h3>{isEdit ? "Edit Person" : "New Person"}</h3>
			{error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

			<label style={field}>
				Full Name *
				<input style={input} value={form.FullName} onChange={set("FullName")} />
			</label>
			<label style={field}>
				Nickname
				<input style={input} value={form.Nickname} onChange={set("Nickname")} />
			</label>
			<label style={field}>
				Birthdate
				<input style={input} type="date" value={form.Birthdate} onChange={set("Birthdate")} />
			</label>
			<label style={field}>
				Address
				<input style={input} value={form.Address} onChange={set("Address")} />
			</label>
			<label style={field}>
				Impression Note
				<textarea style={{ ...input, height: 60 }} value={form.ImpressionNote} onChange={set("ImpressionNote")} />
			</label>
			<label style={field}>
				Timezone
				<select style={input} value={form.TimezoneID} onChange={set("TimezoneID")}>
					<option value="">— none —</option>
					{lookups.timezones.map((t) => (
						<option key={t.TimezoneID} value={t.TimezoneID}>
							{t.Name} ({t.GMTDifference}) — {t.AssociatedCity}
						</option>
					))}
				</select>
			</label>

			<div style={section}>
				<strong>Pronouns</strong>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
					{lookups.pronouns.map((p) => (
						<label key={p.PronounsID} style={{ cursor: "pointer" }}>
							<input type="checkbox" checked={selectedPronouns.includes(p.PronounsID)} onChange={() => toggleMulti(selectedPronouns, setSelectedPronouns, p.PronounsID)} /> {p.Pronouns}
						</label>
					))}
				</div>
			</div>

			<div style={section}>
				<strong>Tags</strong>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
					{lookups.tags.map((t) => (
						<label key={t.TagID} style={{ cursor: "pointer" }}>
							<input type="checkbox" checked={selectedTags.includes(t.TagID)} onChange={() => toggleMulti(selectedTags, setSelectedTags, t.TagID)} /> {t.TagName}
						</label>
					))}
				</div>
			</div>

			<div style={{ marginTop: 16, display: "flex", gap: 8 }}>
				<button onClick={handleSubmit} disabled={saving}>
					{saving ? "Saving..." : isEdit ? "Update Person" : "Create Person"}
				</button>
				<button onClick={onCancel}>Cancel</button>
			</div>
		</div>
	);
}
