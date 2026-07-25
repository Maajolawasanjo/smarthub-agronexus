"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Product {
    id: number | string;
    name: string;
    subtitle?: string;
    category: string;
    country: string;
    location?: string;
    price: number;
    originalPrice?: number;
    unit: string;
    image: string;
    description: string;
    stock: number;
    rating?: number;
    reviewsCount?: number;
    certification?: string;
    sku?: string;
    brand?: string;
    moq?: string;
    grade?: string;
    packaging?: string;
}

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Product) => void;
    updateQuantity: (id: number | string, delta: number) => void;
    removeFromCart: (id: number | string) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    useEffect(() => {
        const storedCart = localStorage.getItem("smarthub_cart");
        if (storedCart) {
            try {
                const parsed = JSON.parse(storedCart);
                if (Array.isArray(parsed)) {
                    // Sanitize: Purge any legacy items missing a valid string/number ID or with id=null/undefined/NaN
                    const sanitized = parsed.filter((item: any) => {
                        if (!item || item.id === null || item.id === undefined) return false;
                        const idStr = String(item.id).trim();
                        return idStr !== "" && idStr !== "NaN" && idStr !== "null" && idStr !== "undefined";
                    });
                    setCartItems(sanitized);
                }
            } catch (error) {
                console.error("Failed to parse cart from local storage", error);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("smarthub_cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product: Product): void => {
        // Boundary Guard: Reject invalid product objects immediately
        if (!product || product.id === null || product.id === undefined) {
            console.error("[CART_BOUNDARY_GUARD] Rejected product add: Missing product ID.", product);
            throw new Error("Cannot add item to cart: Product ID is missing or undefined.");
        }
        const idStr = String(product.id).trim();
        if (idStr === "" || idStr === "NaN" || idStr === "null" || idStr === "undefined") {
            console.error("[CART_BOUNDARY_GUARD] Rejected product add: Invalid product ID format.", product);
            throw new Error(`Cannot add item "${product.name || 'Produce'}" to cart: Invalid Product ID ("${product.id}").`);
        }

        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => String(item.id) === idStr);
            if (existingItem) {
                return prevItems.map((item) =>
                    String(item.id) === idStr ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id: number | string, delta: number): void => {
        setCartItems((prevItems) =>
            prevItems.map((item) => {
                if (item.id === id) {
                    const newQty = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            })
        );
    };

    const removeFromCart = (id: number | string): void => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    };

    const clearCart = (): void => setCartItems([]);

    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                updateQuantity,
                removeFromCart,
                clearCart,
                cartCount,
                cartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextType {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
