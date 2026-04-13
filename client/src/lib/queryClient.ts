import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getTrips, computeAnalytics, addTrip, deleteTrip } from "./static-data";

// Static mode: all data is embedded, no backend needed
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Handle mutations in static mode
  if (method === "POST" && url === "/api/trips") {
    const newTrip = addTrip(data);
    return new Response(JSON.stringify(newTrip), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (method === "DELETE" && url.startsWith("/api/trips/")) {
    const id = parseInt(url.split("/").pop()!);
    deleteTrip(id);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  // Fallback for any other requests
  return new Response(JSON.stringify({}), { status: 200 });
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const key = queryKey.join("/");
    
    // Serve data from embedded static store
    if (key === "/api/trips") {
      return getTrips() as unknown as T;
    }
    if (key === "/api/analytics") {
      return computeAnalytics() as unknown as T;
    }
    
    return null as unknown as T;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
