const { useState } = React;

function App() {
  const [sessionId, setSessionId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [status, setStatus] = useState(null);
  const [createData, setCreateData] = useState({ totalAmount: "", participantCount: "", description: "" });
  const [joinAddress, setJoinAddress] = useState("");
  const [health, setHealth] = useState(null);

  const apiBase = "http://localhost:3000/api/payments";

  async function createSession(e) {
    e.preventDefault();
    const res = await fetch(`${apiBase}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createData)
    });
    const data = await res.json();
    setSessionId(data.sessionId || "");
    setQrCode(data.qrCodeData || "");
  }

  async function joinSession(e) {
    e.preventDefault();
    if (!sessionId) return;
    const res = await fetch(`${apiBase}/${sessionId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantAddress: joinAddress })
    });
    const data = await res.json();
    setStatus(data);
  }

  async function finalizeSession() {
    if (!sessionId) return;
    const res = await fetch(`${apiBase}/${sessionId}/finalize`, { method: "POST" });
    const data = await res.json();
    setStatus(data);
  }

  async function getStatus() {
    if (!sessionId) return;
    const res = await fetch(`${apiBase}/${sessionId}/status`);
    const data = await res.json();
    setStatus(data);
  }

  async function checkHealth() {
    const res = await fetch("http://localhost:3000/health");
    const data = await res.json();
    setHealth(data.status);
  }

  return (
    React.createElement("div", { style: { fontFamily: "sans-serif", maxWidth: 600, margin: "auto" } },
      React.createElement("h2", null, "Bill Splitting Backend Tester"),
      React.createElement("form", { onSubmit: createSession },
        React.createElement("h3", null, "Create Bill Session"),
        React.createElement("input", {
          placeholder: "Total Amount",
          value: createData.totalAmount,
          onChange: e => setCreateData({ ...createData, totalAmount: e.target.value })
        }),
        React.createElement("input", {
          placeholder: "Participant Count",
          value: createData.participantCount,
          onChange: e => setCreateData({ ...createData, participantCount: e.target.value })
        }),
        React.createElement("input", {
          placeholder: "Description",
          value: createData.description,
          onChange: e => setCreateData({ ...createData, description: e.target.value })
        }),
        React.createElement("button", { type: "submit" }, "Create")
      ),
      sessionId && React.createElement("div", null,
        React.createElement("h4", null, `Session ID: ${sessionId}`),
        qrCode && React.createElement("img", { src: qrCode, alt: "QR Code", style: { width: 120 } })
      ),
      sessionId && React.createElement("form", { onSubmit: joinSession },
        React.createElement("h3", null, "Join Session"),
        React.createElement("input", {
          placeholder: "Participant Address",
          value: joinAddress,
          onChange: e => setJoinAddress(e.target.value)
        }),
        React.createElement("button", { type: "submit" }, "Join")
      ),
      sessionId && React.createElement("div", null,
        React.createElement("button", { onClick: finalizeSession }, "Finalize Session"),
        React.createElement("button", { onClick: getStatus }, "Get Status")
      ),
      status && React.createElement("pre", null, JSON.stringify(status, null, 2)),
      React.createElement("hr"),
      React.createElement("button", { onClick: checkHealth }, "Check Health"),
      health && React.createElement("div", null, `Health: ${health}`)
    )
  );
}

const root = document.getElementById("root");
ReactDOM.render(React.createElement(App), root);
