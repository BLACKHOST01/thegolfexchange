"use client";
import { useState, useEffect } from "react";
import ProductForm from "@/app/components/ProductForm";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { ArrowLeft, Plus, AlertCircle, CheckCircle } from "lucide-react";

export default function AddProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      alert("❌ You don't have permission to access this page.");
      router.push("/");
    }
  }, [user, router]);

  const handleAdd = async (formData: any) => {
    console.log("🔵 ===== FORM SUBMISSION START =====");
    console.log("🟡 Form data received from ProductForm:", formData);

    if (!user) {
      setError("Please log in to add a product");
      return router.push("/login");
    }

    if (user.role !== "ADMIN") {
      setError("You don't have permission to add products");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      console.log("🟡 Validating form data...");
      if (!formData.title?.trim()) {
        throw new Error("Product title is required");
      }
      if (!formData.description?.trim()) {
        throw new Error("Product description is required");
      }
      if (!formData.price || formData.price <= 0) {
        throw new Error("Valid price is required");
      }
      if (!formData.stock || formData.stock < 0) {
        throw new Error("Valid stock quantity is required");
      }
      if (!formData.condition) {
        throw new Error("Product condition is required");
      }
      if (!formData.categoryId) {
        throw new Error("Category is required");
      }

      const formDataToSend = new FormData();
      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        condition: formData.condition,
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId || null,
        location: formData.location?.trim() || null,
        isFeatured: formData.isFeatured || false,
        isUsed: formData.condition === "USED", // Ensure this is set correctly
        sellerId: user.id,
      };

      console.log("📦 Product data prepared:", productData);
      formDataToSend.append("productData", JSON.stringify(productData));

      // Append images
      if (formData.images && formData.images.length > 0) {
        console.log(`📸 Appending ${formData.images.length} images`);
        formData.images.forEach((file: File, index: number) => {
          formDataToSend.append("files", file);
          console.log(
            `📸 Image ${index + 1}:`,
            file.name,
            file.type,
            file.size
          );
        });
      } else {
        console.log("⚠️ No images to append");
      }

      // Log what we're sending
      console.log("🟡 Sending POST request to /api/products...");
      console.log("🟡 Headers:", {
        method: "POST",
        body: `FormData with ${formData.images?.length || 0} images`
      });

      const res = await fetch("/api/products", {
        method: "POST",
        body: formDataToSend,
      });

      console.log("🟡 Response status:", res.status);
      console.log("🟡 Response ok:", res.ok);

      const responseText = await res.text();
      console.log("🟡 Raw response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log("🟡 Parsed response data:", data);
      } catch (parseError) {
        console.error("❌ Failed to parse response as JSON:", parseError);
        throw new Error("Invalid response from server");
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.details ||
            `Failed to create product (Status: ${res.status})`
        );
      }

      console.log("✅ Product created successfully!", data);
      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        console.log("🟡 Redirecting to /admin/products...");
        router.push("/admin/products");
      }, 2000);
    } catch (error: any) {
      console.error("❌ Error creating product:", error);
      console.error("❌ Error stack:", error.stack);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
      console.log("🔵 ===== FORM SUBMISSION END =====");
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel? Any unsaved changes will be lost."
      )
    ) {
      router.push("/admin/products");
    }
  };

  // Add manual redirect button in case automatic redirect fails
  const handleManualRedirect = () => {
    router.push("/admin/products");
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Add New Product
            </h1>
          </div>
          <p className="text-gray-600">
            Fill in the product details below to add a new item to your store
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800">
                  Product Created Successfully!
                </h3>
                <p className="text-green-700 text-sm">
                  Redirecting to products page...
                </p>
                <button
                  onClick={handleManualRedirect}
                  className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
                >
                  Click here if not redirected automatically
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">
                  Error Creating Product
                </h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
              <button
                onClick={() => console.log("Debug info:", { user, error })}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Debug Info
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-700">Creating product...</span>
            </div>
          </div>
        )}

        {/* Product Form */}
        <div
          className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${
            loading || success ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Product Information
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Provide detailed information about your product
            </p>
          </div>

          {/* FIXED: Added externalSubmit prop */}
          <ProductForm
            onSubmit={handleAdd}
            buttonLabel={loading ? "Creating Product..." : "Add Product"}
            externalSubmit={true} // This tells ProductForm to pass data to parent
          />
        </div>

        {/* Debug Section - Remove in production */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">
              Debug Information:
            </h3>
            <div className="text-yellow-700 text-sm space-y-1">
              <p>• Check browser console for detailed logs</p>
              <p>• User Role: {user?.role}</p>
              <p>• User ID: {user?.id}</p>
              <p>• Loading: {loading ? "Yes" : "No"}</p>
              <p>• Success: {success ? "Yes" : "No"}</p>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">
            Tips for better product listings:
          </h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Use clear, high-quality images from multiple angles</li>
            <li>
              • Write detailed descriptions with key features and specifications
            </li>
            <li>• Set accurate stock levels to avoid overselling</li>
            <li>• Choose the correct condition (New/Used) and category</li>
            <li>• Consider featuring popular or high-margin products</li>
          </ul>
        </div>
      </div>
    </div>
  );
}