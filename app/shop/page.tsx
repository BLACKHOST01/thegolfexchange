import { ShopCard } from "../components/ui/ShopCard";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  images?: string[];
}

interface ProductsResponse {
  products: Product[];
  totalPages: number;
  currentPage: number;
}

// ✅ Fully SSR + async searchParams version
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // Await searchParams (Next.js 15 async API)
  const params = await searchParams;
  const currentPage = Number(params?.page || 1);
  const limit = 6;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/products?page=${currentPage}&limit=${limit}`;

  let data: ProductsResponse | null = null;

  try {
    const res = await fetch(apiUrl, {
      cache: "no-store", // disable caching for SSR
    });

    if (!res.ok) {
      // Log response text for debugging
      console.error("API error:", await res.text());
      throw new Error("Failed to fetch products");
    }

    data = await res.json();
  } catch (error) {
    console.error("Error loading products:", error);
    // Render graceful error state on the page
    return (
      <section className="py-20 px-4 text-center">
        <h1 className="text-2xl font-semibold text-red-600">
          Something went wrong 😞
        </h1>
        <p className="mt-4 text-gray-600">
          We couldn’t load the products right now. Please refresh or try again later.
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="py-20 px-4 text-center">
        <h1 className="text-2xl font-semibold text-gray-600">
          No products available.
        </h1>
      </section>
    );
  }

  const { products, totalPages } = data;

  return (
    <section className="py-20 px-4">
      {/* ✅ Product Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {products.map((p) => (
          <ShopCard
            key={p.id}
            id={p.id}
            title={p.title}
            description={p.description}
            price={p.price}
            image={p.images?.[0] ?? "/placeholder.png"}
            condition={p.condition}
          />
        ))}
      </div>

      {/* ✅ Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <a
            href={`/shop?page=${Math.max(currentPage - 1, 1)}`}
            className={`px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition ${
              currentPage === 1 ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            Previous
          </a>

          <span className="text-gray-700 font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <a
            href={`/shop?page=${Math.min(currentPage + 1, totalPages)}`}
            className={`px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition ${
              currentPage === totalPages ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            Next
          </a>
        </div>
      )}
    </section>
  );
}
