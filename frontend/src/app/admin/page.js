import { redirect } from "next/navigation";

const adminUrl = process.env.ADMIN_URL || process.env.NEXT_PUBLIC_ADMIN_URL;

export default function AdminRedirectPage() {
  if (adminUrl) {
    redirect(adminUrl);
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "640px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Admin panel is not configured</h1>
        <p style={{ fontSize: "1rem", lineHeight: 1.6 }}>
          Set the <strong>ADMIN_URL</strong> or <strong>NEXT_PUBLIC_ADMIN_URL</strong> environment
          variable to the deployed admin panel URL, then redeploy the frontend.
        </p>
      </div>
    </main>
  );
}
