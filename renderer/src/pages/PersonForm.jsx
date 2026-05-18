// renderer/src/pages/PersonForm.jsx
import { useState, useEffect } from "react";
import { personCreate, lookupAll } from "../api/bridge";
import PronounInput from "../components/PronounInput";
import CategoryInput from "../components/CategoryInput";

const api = window.electronAPI;

const S = {
    formContainer: {
        maxWidth: 420,
        padding: "4px 8px",
    },
    titleText: {
        margin: "0 0 20px 0", 
        color: "var(--color-text)",
        fontSize: "20px",
        fontWeight: "700",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    labelBlock: { 
        display: "block", 
        marginBottom: 16, 
        color: "var(--color-text-muted)", 
        fontSize: "13px",
        fontWeight: "500",
    },
    inputStyle: {
        width: "100%", 
        height: "32px",
        padding: "6px 10px", 
        border: "1px solid var(--color-border)", 
        borderRadius: "var(--radius-sm, 4px)", 
        background: "var(--color-surface-2, #181a26)", 
        color: "var(--color-text)", 
        marginTop: 6,
        fontSize: "13px",
        outline: "none",
        transition: "var(--transition)",
    },
    btnSubmit: { 
        padding: "6px 18px", 
        height: "32px",
        background: "var(--color-primary)", 
        color: "#fff", 
        border: "none", 
        borderRadius: "var(--radius-sm, 4px)", 
        fontWeight: "600", 
        fontSize: "13px",
        cursor: "pointer",
        transition: "var(--transition)",
    },
    btnCancel: {
        padding: "6px 14px",
        height: "32px",
        background: "transparent",
        color: "var(--color-text-muted)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm, 4px)",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "var(--transition)",
    },
    errorBlock: {
        color: "var(--color-danger)", 
        background: "rgba(239, 68, 68, 0.05)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        padding: "8px 12px",
        borderRadius: "var(--radius-sm, 4px)",
        fontSize: "13px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: "6px"
    }
};

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
            setError(e.message || "Failed to create profile entry.");
            setSaving(false);
        }
    };

    const refreshLookups = () => lookupAll().then(setLookups);

    if (!lookups) return <div style={{ color: "var(--color-text-faint)", fontSize: "13px", padding: 20 }}>Loading creation blueprints...</div>;

    return (
        <div style={S.formContainer}>
            <h3 style={S.titleText}>
                <i className="fa-solid fa-user-plus" style={{ color: "var(--color-accent)", fontSize: "15px" }}></i>
                Add a New Person
            </h3>
            
            {error && (
                <div style={S.errorBlock}>
                    <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "12px" }}></i>
                    {error}
                </div>
            )}

            <label style={S.labelBlock}>
                Full Name *
                <input 
                    autoFocus 
                    style={S.inputStyle} 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()} 
                    placeholder="e.g. John Doe"
                    onFocus={(e) => e.target.style.borderColor = "var(--color-accent)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                />
            </label>

            <label style={S.labelBlock}>
                Nickname
                <input 
                    style={S.inputStyle} 
                    value={nick} 
                    onChange={(e) => setNick(e.target.value)} 
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()} 
                    placeholder="Optional..."
                    onFocus={(e) => e.target.style.borderColor = "var(--color-accent)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                />
            </label>

            <label style={S.labelBlock}>
                Category
                <div style={{ marginTop: 6 }}>
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

            <label style={S.labelBlock}>
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

            {/* Action Group Track */}
            <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    style={S.btnSubmit}
                    onMouseEnter={(e) => { if(!saving) e.currentTarget.style.background = "var(--color-accent)"; }}
                    onMouseLeave={(e) => { if(!saving) e.currentTarget.style.background = "var(--color-primary)"; }}
                >
                    {saving ? "Creating Profile..." : "Create Card"}
                </button>
                <button
                    onClick={onCancel}
                    style={S.btnCancel}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        e.currentTarget.style.color = "var(--color-text)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--color-text-muted)";
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}