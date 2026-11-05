document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:8080';
    
    const insightsGrid = document.getElementById('insights-grid');
    const featuredInsightContainer = document.getElementById('featured-insight');
    const categoriesContainer = document.getElementById('insight-categories');
    const searchInput = document.getElementById('insight-search');

    let allInsights = [];
    let currentCategory = 'all';
    let searchQuery = '';

    // Initialize
    if (insightsGrid) {
        fetchInsights();
        fetchCategories();
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderInsights();
        });
    }

    async function fetchInsights() {
        try {
            const res = await fetch(`${API_BASE}/api/insights`);
            if (res.ok) {
                allInsights = await res.json();
                renderInsights();
            } else {
                showError();
            }
        } catch (e) {
            showError();
        }
    }

    async function fetchCategories() {
        try {
            const res = await fetch(`${API_BASE}/api/categories`);
            if (res.ok) {
                const categories = await res.json();
                if (categoriesContainer) {
                    // Keep the "All Insights" button, add others
                    categories.forEach(cat => {
                        const btn = document.createElement('button');
                        btn.className = 'filter-btn';
                        btn.dataset.category = cat.name;
                        btn.textContent = cat.name;
                        btn.addEventListener('click', () => {
                            document.querySelectorAll('#insight-categories .filter-btn').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            currentCategory = cat.name;
                            renderInsights();
                        });
                        categoriesContainer.appendChild(btn);
                    });

                    // Add event listener to the initial "All" button
                    const allBtn = categoriesContainer.querySelector('[data-category="all"]');
                    if (allBtn) {
                        allBtn.addEventListener('click', () => {
                            document.querySelectorAll('#insight-categories .filter-btn').forEach(b => b.classList.remove('active'));
                            allBtn.classList.add('active');
                            currentCategory = 'all';
                            renderInsights();
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Failed to fetch categories');
        }
    }

    function showError() {
        if (insightsGrid) {
            insightsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: rgba(255,255,255,0.5);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; color: #ff5f5f;"></i>
                    <p>Failed to load insights. Please try again later.</p>
                </div>
            `;
        }
    }

    function renderInsights() {
        if (!insightsGrid) return;

        let filtered = allInsights;

        if (currentCategory !== 'all') {
            filtered = filtered.filter(i => i.category === currentCategory);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(i => {
                const titleMatch = (i.title || '').toLowerCase().includes(query);
                const summaryMatch = (i.summary || '').toLowerCase().includes(query);
                const categoryMatch = (i.category || '').toLowerCase().includes(query);
                const contentMatch = (i.content || '').toLowerCase().includes(query);
                
                const keywordsMatch = Array.isArray(i.keywords) 
                    ? i.keywords.some(k => (k || '').toLowerCase().includes(query))
                    : (typeof i.keywords === 'string' && i.keywords.toLowerCase().includes(query));

                const tagsMatch = Array.isArray(i.tags)
                    ? i.tags.some(t => (t || '').toLowerCase().includes(query))
                    : (typeof i.tags === 'string' && i.tags.toLowerCase().includes(query));

                return titleMatch || summaryMatch || categoryMatch || contentMatch || keywordsMatch || tagsMatch;
            });
        }

        let hasFeatured = false;
        // Render Featured Insight (if no search/filter, use the latest one)
        if (featuredInsightContainer) {
            if (currentCategory === 'all' && searchQuery === '' && filtered.length > 0) {
                hasFeatured = true;
                const featured = filtered[0];
                const bgImage = featured.banner ? (featured.banner.startsWith('http') ? featured.banner : `${API_BASE}/${featured.banner}`) : '../assets/images/vol1-cover.png';
                featuredInsightContainer.innerHTML = `
                    <div class="insight-card featured active" onclick="location.href='blog-detail.html?slug=${featured.slug}'" style="flex-direction: row; align-items: center; background: rgba(11, 19, 43, 0.8); border: 1px solid var(--gold-energy); position: relative; overflow: hidden; min-height: 400px; padding: 0;">
                        
                        <div style="flex: 1; min-width: 300px; height: 100%; position: absolute; right: 0; top: 0; width: 50%;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(90deg, rgba(11, 19, 43, 1) 0%, rgba(11, 19, 43, 0) 100%); z-index: 1;"></div>
                            <img src="${bgImage}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>

                        <div style="flex: 1; padding: 50px; position: relative; z-index: 2; max-width: 60%;">
                            <span style="display: inline-block; background: var(--gold-energy); color: #0b132b; font-weight: 800; font-size: 0.75rem; padding: 4px 12px; border-radius: 50px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">
                                ${featured.category}
                            </span>
                            <h2 style="font-size: 2.5rem; color: #fff; margin-bottom: 20px; line-height: 1.2;">${featured.title}</h2>
                            <p style="font-size: 1.1rem; color: rgba(255,255,255,0.8); margin-bottom: 30px; line-height: 1.6; max-width: 90%;">${featured.summary}</p>
                            
                            <div style="display: flex; align-items: center; gap: 20px; color: rgba(255,255,255,0.6); font-size: 0.85rem;">
                                <span><i class="fas fa-clock" style="margin-right: 5px;"></i> ${featured.readTime || '5 min read'}</span>
                                <span><i class="fas fa-eye" style="margin-right: 5px;"></i> ${featured.views || 0} views</span>
                                <span style="margin-left: auto; color: var(--gold-energy); font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 5px;">
                                    Read Insight <i class="fas fa-arrow-right"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                `;
                // Remove the featured insight from the grid list
                filtered = filtered.slice(1);
            } else {
                featuredInsightContainer.innerHTML = '';
            }
        }

        insightsGrid.innerHTML = '';

        if (filtered.length === 0 && !hasFeatured) {
            insightsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: rgba(255,255,255,0.5);">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>No insights found matching your criteria.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(insight => {
            const card = document.createElement('div');
            card.className = 'insight-card reveal magnetic shine-box';
            
            const bgImage = insight.banner ? (insight.banner.startsWith('http') ? insight.banner : `${API_BASE}/${insight.banner}`) : '../assets/images/vol1-cover.png';
            const date = new Date(insight.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            card.innerHTML = `
                <img src="${bgImage}" alt="${insight.title}" onerror="this.src='../assets/images/vol1-cover.png'">
                <div class="insight-content">
                    <div class="insight-meta">
                        <span class="insight-category">${insight.category}</span>
                        <span>${date}</span>
                    </div>
                    <h3 class="insight-title">${insight.title}</h3>
                    <p class="insight-summary">${insight.summary}</p>
                    
                    <div class="insight-footer">
                        <span style="color: rgba(255,255,255,0.6); font-size: 0.8rem;"><i class="fas fa-clock" style="margin-right: 5px;"></i>${insight.readTime || '5 min read'}</span>
                        <span style="color: var(--gold-energy); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Read <i class="fas fa-arrow-right" style="margin-left: 3px;"></i></span>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                window.location.href = `blog-detail.html?slug=${insight.slug}`;
            });

            insightsGrid.appendChild(card);
        });

        if (typeof revealObserver !== 'undefined') {
            document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
        }
    }
});
