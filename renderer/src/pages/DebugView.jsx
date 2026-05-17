import { useState, useEffect } from "react";
import { personFull } from "../api/bridge";

export default function DebugView({ personId }) {
	const [data, setData] = useState(null);

	useEffect(() => {
		personFull(personId).then(setData);
	}, [personId]);

	if (!data) return <div>Loading...</div>;

	return (
		<div>
			<h3>Debug — Raw JSON</h3>
			<p style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
				This view shows all data returned by getFullPerson() — useful for verifying that joins, foreign keys, and relationships are working correctly.
			</p>
			<pre
				style={{
					background: "var(--color-bg)",
					color: "var(--color-text)",
					padding: 12,
					borderRadius: 4,
					overflowX: "auto",
					fontSize: 12,
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
				}}
			>
				{JSON.stringify(data, null, 2)}
			</pre>
		</div>
	);
}
