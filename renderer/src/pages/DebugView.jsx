// renderer/src/components/DebugView.jsx
import { useState, useEffect } from "react";
import { personFull } from "../api/bridge";

export default function DebugView({ personId }) {
	const [data, setData] = useState(null);

	useEffect(() => {
		personFull(personId).then(setData);
	}, [personId]);

	if (!data) return <div style={{ color: "var(--color-text-faint)", fontSize: "13px", padding: 12 }}>Loading structural schema logs...</div>;

	return (
		<div>
			<h3 style={{ margin: "0 0 8px 0", color: "var(--color-text)", fontSize: "16px", fontWeight: "700" }}>Debug — Raw JSON</h3>
			<p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: "0 0 16px 0", lineHeight: "1.5" }}>
				This view shows all data returned by getFullPerson() — useful for verifying that joins, foreign keys, and relationships are working correctly.
			</p>
			<pre
				style={{
					background: "var(--color-surface-2, #181a26)",
					color: "var(--color-text)",
					padding: 16,
					border: "1px solid var(--color-border)",
					borderRadius: "var(--radius-sm, 4px)",
					overflowX: "auto",
					fontSize: "12px",
					fontFamily: "var(--font-mono)",
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
					margin: 0,
					lineHeight: "1.5",
				}}
			>
				{JSON.stringify(data, null, 2)}
			</pre>
		</div>
	);
}
