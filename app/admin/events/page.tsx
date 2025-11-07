// app/admin/events/page.tsx
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export const dynamic = "force-dynamic";

export default async function EventsPage({ searchParams }: Props) {
  const params = await searchParams;
  const providedKey = params?.apiKey || null;
  const expectedKey = process.env.THE_GOLF_EXCHANGE_ADMIN_API_KEY;

  if (!expectedKey || providedKey !== expectedKey) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Unauthorized</h1>
        <p>Invalid or missing admin key.</p>
      </div>
    );
  }

  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Handle BigInt serialization
    const serializedEvents = events.map(event => ({
      ...event,
      id: event.id.toString(),
    }));

    return (
      <div style={{ padding: 24 }}>
        <h1>Latest Events ({serializedEvents.length})</h1>
        
        {serializedEvents.length === 0 ? (
          <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
            <h3>No events found</h3>
            <p>The events table is empty. Events will appear here as users interact with your site.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>ID</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Time</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Type</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Visitor</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Properties</th>
              </tr>
            </thead>
            <tbody>
              {serializedEvents.map((e: any) => (
                <tr key={e.id}>
                  <td style={{ padding: "8px", borderBottom: "1px solid #ddd", fontSize: "12px", fontFamily: 'monospace' }}>
                    {e.id}
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>
                    {format(new Date(e.createdAt), "MM-dd HH:mm:ss")}
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{e.eventType}</td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #ddd", fontSize: "12px", fontFamily: 'monospace' }}>
                    {e.visitorId ?? "-"}
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>
                    <pre style={{ margin: 0, fontSize: "11px", maxWidth: "400px", overflow: "auto" }}>
                      {JSON.stringify(e.eventProperties, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error:", error);
    return (
      <div style={{ padding: 24 }}>
        <h1>Error Loading Events</h1>
        <p>Please run these commands in your terminal:</p>
        <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
          npx prisma generate{"\n"}
          npx prisma db push{"\n"}
          npm run dev
        </pre>
      </div>
    );
  }
}