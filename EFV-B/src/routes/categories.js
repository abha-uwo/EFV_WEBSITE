const express = require('express');
const router = express.Router();
const { Category, Product } = require('../models');
const adminAuth = require('../middleware/adminAuth');

const DEFAULT_CATEGORIES = [
    { name: 'Hardcover', slug: 'HARDCOVER', isDigital: false, isActive: true },
    { name: 'Paperback', slug: 'PAPERBACK', isDigital: false, isActive: true },
    { name: 'E-Book', slug: 'EBOOK', isDigital: true, isActive: true },
    { name: 'Audiobook', slug: 'AUDIOBOOK', isDigital: true, isActive: true }
];

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().maxTimeMS(2500);
        res.json(categories && categories.length ? categories : DEFAULT_CATEGORIES);
    } catch (error) {
        console.warn('⚠️ [Categories API] Database unavailable, serving default categories fallback:', error.message);
        res.json(DEFAULT_CATEGORIES);
    }
});

// POST /api/categories/create - Create a new category (Admin only)
router.post('/create', adminAuth, async (req, res) => {
    try {
        const { name, slug, isDigital, isActive, discountType, discountValue, minQuantity, bogoBuySlug, bogoGetSlug, assignedProducts } = req.body;
        if (!name) return res.status(400).json({ message: 'Category name is required' });

        const finalSlug = (slug || name).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/(^-|-$)/g, '');
        
        const existing = await Category.findOne({ slug: finalSlug });
        if (existing) {
            return res.status(400).json({ message: 'Category with this slug already exists' });
        }

        const newCategory = await Category.create({
            name,
            slug: finalSlug,
            isDigital: !!isDigital,
            isActive: isActive !== undefined ? !!isActive : true,
            discountType: discountType || 'simple',
            discountValue: discountValue !== undefined ? Number(discountValue) : 0,
            minQuantity: minQuantity !== undefined ? Number(minQuantity) : 0,
            bogoBuySlug: bogoBuySlug || '',
            bogoGetSlug: bogoGetSlug || ''
        });

        if (assignedProducts && Array.isArray(assignedProducts)) {
            const products = await Product.find();
            for (const prod of products) {
                const prodId = prod._id.toString();
                let categoriesArray = prod.categories || [];
                
                const hasCategory = categoriesArray.includes(finalSlug);
                const shouldHaveCategory = assignedProducts.includes(prodId);

                if (shouldHaveCategory && !hasCategory) {
                    categoriesArray.push(finalSlug);
                    prod.categories = categoriesArray;
                    await prod.save();
                } else if (!shouldHaveCategory && hasCategory) {
                    prod.categories = categoriesArray.filter(c => c !== finalSlug);
                    await prod.save();
                }
            }
        }

        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/categories/:id - Update/Rename category (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { name, slug, isDigital, isActive, discountType, discountValue, minQuantity, bogoBuySlug, bogoGetSlug, assignedProducts } = req.body;
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const oldSlug = category.slug;
        const finalSlug = (slug || name).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/(^-|-$)/g, '');

        if (finalSlug !== oldSlug) {
            const duplicate = await Category.findOne({ slug: finalSlug });
            if (duplicate && duplicate._id.toString() !== category._id.toString()) {
                return res.status(400).json({ message: 'Category with this slug already exists' });
            }
        }

        category.name = name;
        category.slug = finalSlug;
        category.isDigital = !!isDigital;
        if (isActive !== undefined) {
            category.isActive = !!isActive;
        }
        if (discountType !== undefined) category.discountType = discountType;
        if (discountValue !== undefined) category.discountValue = Number(discountValue);
        if (minQuantity !== undefined) category.minQuantity = Number(minQuantity);
        if (bogoBuySlug !== undefined) category.bogoBuySlug = bogoBuySlug;
        if (bogoGetSlug !== undefined) category.bogoGetSlug = bogoGetSlug;
        await category.save();

        // Update all products assigned to this category type/slug
        if (oldSlug !== finalSlug) {
            await Product.updateMany(
                { type: oldSlug },
                { 
                    $set: { 
                        type: finalSlug,
                        category: isDigital ? 'Digital' : 'Physical'
                    } 
                }
            );
        }

        if (assignedProducts && Array.isArray(assignedProducts)) {
            const products = await Product.find();
            for (const prod of products) {
                const prodId = prod._id.toString();
                let categoriesArray = prod.categories || [];
                
                const oldSlugIndex = categoriesArray.indexOf(oldSlug);
                if (oldSlugIndex !== -1 && oldSlug !== finalSlug) {
                    categoriesArray.splice(oldSlugIndex, 1);
                }

                const hasCategory = categoriesArray.includes(finalSlug);
                const shouldHaveCategory = assignedProducts.includes(prodId);

                if (shouldHaveCategory && !hasCategory) {
                    categoriesArray.push(finalSlug);
                    prod.categories = categoriesArray;
                    await prod.save();
                } else if (!shouldHaveCategory && hasCategory) {
                    prod.categories = categoriesArray.filter(c => c !== finalSlug);
                    await prod.save();
                }
            }
        }

        res.json(category);
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Validate whether products are assigned to this category
        const productCount = await Product.countDocuments({ type: category.slug });
        if (productCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete category: ${productCount} products are currently assigned to it.` 
            });
        }

        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
