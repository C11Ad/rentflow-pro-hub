import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

interface OptimisticUpdateOptions<T> {
  onError?: (error: Error, previousData: T) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook for handling optimistic updates with automatic rollback on failure
 * Provides a seamless user experience by updating UI immediately
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const previousDataRef = useRef<T>(initialData);

  const optimisticUpdate = useCallback(
    async (
      newData: T | ((prev: T) => T),
      updateFn: () => Promise<void>
    ) => {
      // Store previous data for rollback
      previousDataRef.current = data;
      
      // Apply optimistic update
      const resolvedNewData = typeof newData === "function" 
        ? (newData as (prev: T) => T)(data) 
        : newData;
      
      setData(resolvedNewData);
      setIsUpdating(true);

      try {
        await updateFn();
        
        if (options.successMessage) {
          toast.success(options.successMessage);
        }
      } catch (error) {
        // Rollback on failure
        setData(previousDataRef.current);
        
        const errorMessage = options.errorMessage || "Update failed. Changes have been reverted.";
        toast.error(errorMessage);
        
        if (options.onError && error instanceof Error) {
          options.onError(error, previousDataRef.current);
        }
        
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [data, options]
  );

  const resetData = useCallback((newData: T) => {
    setData(newData);
    previousDataRef.current = newData;
  }, []);

  return {
    data,
    setData: resetData,
    optimisticUpdate,
    isUpdating,
  };
}

/**
 * Hook for handling optimistic list updates
 * Specialized for array operations with add, update, and remove
 */
export function useOptimisticList<T extends { id: string }>(
  initialData: T[] = [],
  options: OptimisticUpdateOptions<T[]> = {}
) {
  const [items, setItems] = useState<T[]>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const previousItemsRef = useRef<T[]>(initialData);

  const addItem = useCallback(
    async (newItem: T, addFn: () => Promise<void>) => {
      previousItemsRef.current = items;
      setItems(prev => [newItem, ...prev]);
      setIsUpdating(true);

      try {
        await addFn();
        if (options.successMessage) toast.success(options.successMessage);
      } catch (error) {
        setItems(previousItemsRef.current);
        toast.error(options.errorMessage || "Failed to add item");
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [items, options]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>, updateFn: () => Promise<void>) => {
      previousItemsRef.current = items;
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
      setIsUpdating(true);

      try {
        await updateFn();
        if (options.successMessage) toast.success(options.successMessage);
      } catch (error) {
        setItems(previousItemsRef.current);
        toast.error(options.errorMessage || "Failed to update item");
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [items, options]
  );

  const removeItem = useCallback(
    async (id: string, removeFn: () => Promise<void>) => {
      previousItemsRef.current = items;
      setItems(prev => prev.filter(item => item.id !== id));
      setIsUpdating(true);

      try {
        await removeFn();
        if (options.successMessage) toast.success(options.successMessage);
      } catch (error) {
        setItems(previousItemsRef.current);
        toast.error(options.errorMessage || "Failed to remove item");
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [items, options]
  );

  const resetItems = useCallback((newItems: T[]) => {
    setItems(newItems);
    previousItemsRef.current = newItems;
  }, []);

  return {
    items,
    setItems: resetItems,
    addItem,
    updateItem,
    removeItem,
    isUpdating,
  };
}
