// renderer/src/pages/PeopleList.jsx
export default function PeopleList({ people, selectedId, onSelect, onNew }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<div style={{ padding: "8px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ccc" }}>
				<strong>People</strong>
				<button onClick={onNew}>+ New</button>
			</div>
			<div style={{ flex: 1, overflowY: "auto" }}>
				{people.map((p) => (
					<div
						key={p.PersonID}
						onClick={() => onSelect(p.PersonID)}
						style={{
							padding: "6px 10px",
							cursor: "pointer",
							background: p.PersonID === selectedId ? "#0066cc" : "transparent",
							color: p.PersonID === selectedId ? "#fff" : "inherit",
						}}
					>
						{p.FullName}
					</div>
				))}
			</div>
		</div>
	);
}
