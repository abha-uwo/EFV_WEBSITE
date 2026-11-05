'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Book, Headset, ShoppingCart, Check } from 'lucide-react';

interface Product {
    _id: string;
    title: string;
    type: 'EBOOK' | 'AUDIOBOOK';
    price: number;
    thumbnail?: string;
}

const Marketplace = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingToLibrary, setAddingToLibrary] = useState<string | null>(null);
    const [libraryItems, setLibraryItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchProducts();
        if (user) {
            fetchLibrary();
        }
    }, [user]);

    const fetchProducts = async () => {
        try {
            const { data } = await api.getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLibrary = async () => {
        try {
            const { data } = await api.getMyLibrary();
            const ids = new Set<string>(data.map((item: Product) => item._id));
            setLibraryItems(ids);
        } catch (error) {
            console.error('Error fetching library:', error);
        }
    };

    const handleAddToLibrary = async (productId: string) => {
        if (!user) {
            alert('Please login to add products to your library');
            return;
        }

        setAddingToLibrary(productId);
        try {
            const { data } = await api.addToLibrary(productId);

            // Show success message
            alert(`✅ ${data.message}`);

            // Update library items
            setLibraryItems(prev => new Set([...prev, productId]));

        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const message = (error as any).response?.data?.message || 'Error adding to library';
            alert(message);
        } finally {
            setAddingToLibrary(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-energy"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-black mb-8 tracking-tight">
                DIGITAL <span className="text-gold-energy">MARKETPLACE</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map(product => {
                    const inLibrary = libraryItems.has(product._id);
                    const isAdding = addingToLibrary === product._id;

                    return (
                        <div
                            key={product._id}
                            className="group bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 hover:border-gold-energy/30 transition-all"
                        >
                            <div className="aspect-[3/4] bg-white/5 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
                                {product.type === 'EBOOK' ?
                                    <Book className="w-12 h-12 opacity-20" /> :
                                    <Headset className="w-12 h-12 opacity-20" />
                                }
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/10">
                                    {product.type}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold mb-2">{product.title}</h3>
                            <p className="text-2xl font-black text-gold-energy mb-4">₹{product.price}</p>

                            <button
                                onClick={() => handleAddToLibrary(product._id)}
                                disabled={inLibrary || isAdding}
                                className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${inLibrary
                                    ? 'bg-green-600/20 text-green-400 border border-green-600/30 cursor-not-allowed'
                                    : 'bg-gold-energy text-black hover:bg-gold-energy/90 active:scale-95'
                                    }`}
                            >
                                {isAdding ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                                        Adding...
                                    </>
                                ) : inLibrary ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        In Library
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5" />
                                        Add to Library
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Marketplace;
