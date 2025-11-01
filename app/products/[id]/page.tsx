"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { ChevronLeft, ChevronRight, X, Star, Shield, Truck } from "lucide-react";
import toast from "react-hot-toast";


type UploadedFile = {
  id: string;
  name: string;
  mimeType: string;
};

type Review = {
  id: string;
  rating: number;
  comment?: string;
  user: { name: string };
  createdAt: string;
};

type Seller = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
};

type Category = { id: string; name: string };
type Subcategory = { id: string; name: string };

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  images?: UploadedFile[];
  stock: number;
  condition: "NEW" | "USED";
  category?: Category;
  subcategory?: Subcategory;
  seller: Seller;
  reviews?: Review[]; // ✅ Make reviews optional
  rating: number;
  isFeatured: boolean;
  createdAt: string;
};

export default function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  // ✅ Fetch product by ID
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        
        console.log("Product data received:", data); // Debug log
        
        // ✅ Ensure reviews is always an array
        const productWithSafeReviews = {
          ...data,
          reviews: data.reviews || [] // Default to empty array if undefined
        };
        
        setProduct(productWithSafeReviews);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // ✅ Keyboard navigation for lightbox
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isLightboxOpen || !product?.images?.length) return;
      
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) =>
          prev === (product.images?.length ?? 0) - 1 ? 0 : prev + 1
        );
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) =>
          prev === 0 ? (product.images?.length ?? 0) - 1 : prev - 1
        );
      } else if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLightboxOpen, product]);

  // Get image URL
  const getImageUrl = (image: UploadedFile) => {
    return `/api/images/${image.id}`;
  };

  // ✅ Safe calculation of average rating
  const reviews = product?.reviews || [];
  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0;

  // ✅ Fixed: handleAddToCart function
  async function handleAddToCart() {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      const cartProduct = {
        id: product.id,
        title: product.title,
        price: product.price,
        images: product.images ? product.images.map(img => getImageUrl(img)) : [],
        stock: product.stock,
        name: product.title,
        condition: product.condition,
        productId: product.id,
      };

      addToCart(cartProduct, qty);
      
      toast.success(`Added ${qty} ${qty === 1 ? 'item' : 'items'} of "${product.title}" to cart`);
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error("Error adding to cart");
    } finally {
      setAddingToCart(false);
    }
  }

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image skeleton */}
          <div className="animate-pulse">
            <div className="w-full h-96 bg-gray-200 rounded-lg"></div>
          </div>
          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Product Not Found</h2>
          <p className="text-red-700 mb-4">
            {error || "The product you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const images = product.images || [];

  return (
    <div className="max-w-6xl py-24 mx-auto p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span>Home</span>
        <ChevronRight className="w-4 h-4" />
        <span>Shop</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* ✅ Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div 
            className="relative w-full h-96 bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in shadow-lg"
            onClick={() => images.length > 0 && setIsLightboxOpen(true)}
          >
            {images.length > 0 ? (
              <>
                <Image
                  src={getImageUrl(images[currentIndex])}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  priority
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex((prev) =>
                          prev === 0 ? images.length - 1 : prev - 1
                        );
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex((prev) =>
                          prev === images.length - 1 ? 0 : prev + 1
                        );
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                    {currentIndex + 1} / {images.length}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Image
                    src="/placeholder-image.jpg"
                    alt="No image available"
                    width={200}
                    height={200}
                    className="mx-auto opacity-50"
                  />
                  <p className="mt-2">No image available</p>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex 
                      ? "border-blue-500 ring-2 ring-blue-200" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={getImageUrl(image)}
                    alt={`${product.title} - ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ✅ Product Details */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              {product.isFeatured && (
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                  Featured
                </span>
              )}
              <span className={`text-xs font-medium px-2 py-1 rounded uppercase ${
                product.condition === "NEW" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-blue-100 text-blue-800"
              }`}>
                {product.condition}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
            
            {/* ✅ FIXED: Safe review check */}
            {reviews.length > 0 ? (
              <div className="flex items-center gap-4 mt-2">
                {renderStars(averageRating)}
                <span className="text-sm text-gray-500">
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-4 mt-2">
                {renderStars(0)}
                <span className="text-sm text-gray-500">No reviews yet</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-green-600">
              ${product.price.toFixed(2)}
            </span>
            {product.condition === "USED" && (
              <span className="text-sm text-gray-500 line-through">
                ${(product.price * 1.3).toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Product Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Category:</span>
              <p className="font-medium">{product.category?.name || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500">Subcategory:</span>
              <p className="font-medium">{product.subcategory?.name || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500">Stock:</span>
              <p className={`font-medium ${
                product.stock > 10 ? "text-green-600" : 
                product.stock > 0 ? "text-yellow-600" : "text-red-600"
              }`}>
                {product.stock} available
              </p>
            </div>
            <div>
              <span className="text-gray-500">Listed:</span>
              <p className="font-medium">
                {new Date(product.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Add to Cart Section */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="font-medium">Quantity:</label>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1}
                  className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={qty}
                  onChange={(e) => {
                    const value = Math.max(1, Math.min(product.stock, Number(e.target.value)));
                    setQty(value);
                  }}
                  className="w-16 text-center border-x py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  disabled={qty >= product.stock}
                  className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock === 0}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                product.stock === 0
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : addingToCart
                  ? "bg-gray-600 cursor-not-allowed text-white"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              {product.stock === 0
                ? "Out of Stock"
                : addingToCart
                ? "Adding to Cart..."
                : `Add to Cart - $${(product.price * qty).toFixed(2)}`}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-6 py-4 border-t text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <span>Free Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Secure Payment</span>
            </div>
          </div>

          {/* ✅ Seller Info */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-3">Seller Information</h3>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="font-semibold text-blue-600">
                  {product.seller.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{product.seller.name}</p>
                <p className="text-sm text-gray-600">{product.seller.email}</p>
                {product.seller.phone && (
                  <p className="text-sm text-gray-600">{product.seller.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Fixed: Reviews Section with safe checks */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">
          Customer Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-6 last:border-b-0">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="font-medium text-gray-700">
                      {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{review.user?.name || 'Anonymous'}</p>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 ml-14">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </div>

      {/* ✅ Lightbox */}
      {isLightboxOpen && images.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={getImageUrl(images[currentIndex])}
              alt={product.title}
              width={1200}
              height={800}
              className="w-full h-full object-contain max-h-[90vh] rounded-lg"
              priority
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex((prev) =>
                    prev === 0 ? images.length - 1 : prev - 1
                  )}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={() => setCurrentIndex((prev) =>
                    prev === images.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i === currentIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}