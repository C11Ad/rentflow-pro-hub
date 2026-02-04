import { ReactNode, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pullThreshold = 80;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return;
      
      const touchY = e.touches[0].clientY;
      const pullDistance = touchY - startY;

      if (pullDistance > 0 && window.scrollY === 0) {
        setIsPulling(true);
        setCurrentY(Math.min(pullDistance, pullThreshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && currentY >= pullThreshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setIsPulling(false);
      setCurrentY(0);
      setStartY(0);
    };

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startY, currentY, isPulling, isRefreshing, onRefresh]);

  const pullProgress = Math.min(currentY / pullThreshold, 1);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pull to refresh indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200"
        style={{
          height: `${currentY}px`,
          opacity: pullProgress,
        }}
      >
        <div className="bg-card/90 backdrop-blur-sm rounded-full p-3 shadow-lg border border-border">
          <RefreshCw
            className={`h-6 w-6 text-accent transition-transform ${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: `rotate(${pullProgress * 360}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content with padding to prevent overlap */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${isPulling || isRefreshing ? currentY : 0}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
