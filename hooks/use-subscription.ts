"use client";

import { useState, useEffect } from "react";

interface SubscriptionStatus {
  isPaid: boolean;
  subscriptionExpiresAt: string | null;
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/subscription-status");

      if (!response.ok) {
        if (response.status === 401) {
          // 用户未登录
          setStatus({ isPaid: false, subscriptionExpiresAt: null });
          return;
        }
        throw new Error("Failed to fetch subscription status");
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus({ isPaid: false, subscriptionExpiresAt: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return {
    status,
    loading,
    error,
    refetch: checkStatus,
  };
}
