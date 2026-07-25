"use client";

import React, { useEffect, useState } from "react";
import { Star, MessageSquare, ShieldCheck, ThumbsUp, Filter } from "lucide-react";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  product: { id: string; name: string };
  buyer: { fullName: string };
  isVerifiedPurchase: boolean;
}

export default function FarmerReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    averageRating: number;
    totalReviewsCount: number;
    ratingBreakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
    reviews: ReviewItem[];
  } | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/farmer/reviews");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = (data?.reviews || []).filter((r) =>
    ratingFilter === "ALL" ? true : r.rating === ratingFilter
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Rating Breakdown Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Rating Score Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Average Reputation Score</span>
              <div className="text-5xl font-black text-gray-900 mt-2 flex items-baseline space-x-1">
                <span>{data?.averageRating ?? 5.0}</span>
                <span className="text-sm font-semibold text-gray-400">/ 5.0</span>
              </div>
              <div className="flex items-center space-x-1 my-2 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${star <= Math.round(data?.averageRating ?? 5) ? "fill-amber-400" : "text-gray-200"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">Based on {data?.totalReviewsCount ?? 0} verified customer reviews</p>
            </div>

            {/* Rating Breakdown Bars */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm md:col-span-2 flex flex-col justify-center space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Rating Distribution</h3>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = (data?.ratingBreakdown as any)?.[stars] ?? 0;
                const total = data?.totalReviewsCount || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={stars} className="flex items-center space-x-3 text-xs">
                    <span className="w-12 font-bold text-gray-700 flex items-center space-x-1">
                      <span>{stars}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-medium text-gray-400">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Filter by Rating:</span>
            </div>
            <div className="flex items-center space-x-2">
              {["ALL", 5, 4, 3, 2, 1].map((item) => (
                <button
                  key={item}
                  onClick={() => setRatingFilter(item as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    ratingFilter === item
                      ? "bg-[#1B4D28] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item === "ALL" ? "All Stars" : `${item} Stars`}
                </button>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Buyer Feedbacks</h2>
              <span className="text-xs text-gray-400 font-medium">{filteredReviews.length} Feedback Records</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">Loading verified customer reviews...</div>
            ) : filteredReviews.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                No reviews found matching the selected star filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <div key={review.id} className="p-4 bg-gray-50/70 border border-gray-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900 text-sm">{review.buyer.fullName}</span>
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#1B4D28]">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified Purchase</span>
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{review.createdAt}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? "fill-amber-400" : "text-gray-200"}`}
                        />
                      ))}
                      <span className="text-xs font-bold text-gray-700 ml-2">Produce: {review.product.name}</span>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed pt-1">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
    </div>
  );
}
