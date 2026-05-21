export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
      }}
    >
      <h1 style={{ color: "#2577FF", margin: "0 0 16px 0" }}>Kognis PWA</h1>
      <p style={{ color: "#F8FAFC", opacity: 0.8 }}>
        El motor Offline-First y la base de datos están listos.
      </p>
    </main>
  );
}
