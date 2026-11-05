console.log("HELLO FROM ADMIN BLOGS TOP");
const API_BASE_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:8080';
let quillEditor;
let allAdminInsights = [];
let allAdminCategories = [];
let currentInsightId = null;

function initAdminBlogs() {
    console.log("initAdminBlogs executing...");
    try {
        // Initialize Quill
        if (typeof Quill !== 'undefined' && document.getElementById('insight-editor-container')) {
            quillEditor = new Quill('#insight-editor-container', {
                theme: 'snow',
                placeholder: 'Write your insight content here...',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'script': 'sub'}, { 'script': 'super' }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['link', 'image', 'video'],
                        ['clean']
                    ]
                }
            });

            // Custom Image Handler
            quillEditor.getModule('toolbar').addHandler('image', function() {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.click();

                input.onchange = async () => {
                    const file = input.files[0];
                    if (file) {
                        const formData = new FormData();
                        formData.append('image', file);
                        
                        try {
                            const res = await fetch(`${API_BASE_URL}/api/insights/upload-image`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                                body: formData
                            });
                            
                            if (res.ok) {
                                const data = await res.json();
                                const range = quillEditor.getSelection();
                                quillEditor.insertEmbed(range.index, 'image', data.url);
                            } else {
                                showToast('Failed to upload image', 'error');
                            }
                        } catch (e) {
                            showToast('Error uploading image', 'error');
                        }
                    }
                };
            });
        }
    } catch (e) {
        console.error("Quill initialization failed:", e);
    }

    // Set up file drop zone
    const dropZone = document.getElementById('drop-zone-insight-banner');
    const fileInput = document.getElementById('admin-insight-banner');
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('admin-insight-banner-preview').innerHTML = `<img src="${e.target.result}" style="max-height: 100px; max-width: 100%;">`;
                }
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    // Load Data
    loadAdminInsights();
    loadAdminCategories();

    // Form Submission
    const form = document.getElementById('admin-insight-form');
    if (form) {
        form.addEventListener('submit', handleInsightSubmit);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminBlogs);
} else {
    initAdminBlogs();
}

window.loadAdminInsights = async function() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/insights`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (res.ok) {
            allAdminInsights = await res.json();
            renderAdminInsights();
        }
    } catch (e) {
        console.error('Failed to load admin insights', e);
    }
}

async function loadAdminCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (res.ok) {
            allAdminCategories = await res.json();
            const select = document.getElementById('admin-insight-category');
            if (select) {
                select.innerHTML = '<option value="">Select Category</option>';
                allAdminCategories.forEach(cat => {
                    select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
                });
            }
        }
    } catch (e) {
        console.error('Failed to load categories', e);
    }
}

function renderAdminInsights() {
    console.log("renderAdminInsights called! allAdminInsights length:", allAdminInsights.length);
    const tbody = document.getElementById('insights-list');
    console.log("tbody element:", tbody);
    if (!tbody) {
        console.error("tbody #insights-list NOT FOUND!");
        return;
    }

    if (allAdminInsights.length === 0) {
        console.log("Setting innerHTML to 'No blogs published yet'");
        tbody.innerHTML = '<tr><td colspan="7" style="padding: 50px; text-align: center; opacity: 0.5;">No blogs published yet.</td></tr>';
        updateInsightStats();
        return;
    }

    tbody.innerHTML = '';
    let totalViews = 0;

    allAdminInsights.forEach(insight => {
        totalViews += (insight.views || 0);
        const date = new Date(insight.createdAt).toLocaleDateString();
        const img = insight.banner ? (insight.banner.startsWith('http') ? insight.banner : `${API_BASE_URL}/${insight.banner}`) : '../assets/images/vol1-cover.png';
        
        const statusHtml = insight.status === 'Published' 
            ? '<span style="color: #4cd137;"><i class="fas fa-check-circle"></i> Published</span>'
            : '<span style="color: #f39c12;"><i class="fas fa-clock"></i> Draft</span>';
        
        tbody.innerHTML += `
            <tr>
                <td><img src="${img}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                <td style="font-weight: 600;">${insight.title}</td>
                <td><span class="badge" style="background: rgba(212,175,55,0.2); color: var(--gold-energy); padding: 4px 10px; border-radius: 4px; font-size: 0.8rem;">${insight.category}</span></td>
                <td>${insight.views || 0}</td>
                <td>${statusHtml}</td>
                <td>${date}</td>
                <td>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-outline small" onclick="window.editInsight('${insight._id}')"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn btn-outline small" style="border-color: #ff5f5f; color: #ff5f5f;" onclick="window.deleteInsightFromTable('${insight._id}')"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });

    updateInsightStats(allAdminInsights.length, totalViews);
}

function updateInsightStats(total = 0, views = 0) {
    const elTotal = document.getElementById('total-insights');
    const elPub = document.getElementById('published-insights');
    const elViews = document.getElementById('total-insight-views');

    if (elTotal) elTotal.textContent = total;
    if (elPub) elPub.textContent = total;
    if (elViews) elViews.textContent = views;
}

window.openInsightModal = function() {
    currentInsightId = null;
    document.getElementById('admin-insight-id').value = '';
    document.getElementById('admin-insight-title').value = '';
    document.getElementById('admin-insight-category').value = '';
    document.getElementById('admin-insight-summary').value = '';
    document.getElementById('admin-insight-banner-preview').innerHTML = '';
    document.getElementById('admin-insight-banner').value = '';
    if (quillEditor) quillEditor.root.innerHTML = '';
    
    document.getElementById('admin-insight-modal-title').textContent = 'CREATE NEW BLOG';
    document.getElementById('admin-insight-save-btn').innerHTML = '<i class="fas fa-save"></i> PUBLISH BLOG';
    document.getElementById('delete-insight-btn').style.display = 'none';
    
    const modal = document.getElementById('admin-insight-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
}

window.closeInsightModal = function() {
    const modal = document.getElementById('admin-insight-modal');
    modal.style.display = 'none';
    modal.classList.remove('active');
}

window.editInsight = function(id) {
    const insight = allAdminInsights.find(i => i._id === id);
    if (!insight) return;

    currentInsightId = id;
    document.getElementById('admin-insight-id').value = insight._id;
    document.getElementById('admin-insight-title').value = insight.title;
    document.getElementById('admin-insight-category').value = insight.category;
    document.getElementById('admin-insight-summary').value = insight.summary;
    
    if (insight.banner) {
        const bgImage = insight.banner.startsWith('http') ? insight.banner : `${API_BASE_URL}/${insight.banner}`;
        document.getElementById('admin-insight-banner-preview').innerHTML = `<img src="${bgImage}" style="max-height: 100px; max-width: 100%;">`;
    } else {
        document.getElementById('admin-insight-banner-preview').innerHTML = '';
    }
    document.getElementById('admin-insight-banner').value = '';
    
    quillEditor.root.innerHTML = insight.content;

    document.getElementById('admin-insight-modal-title').textContent = 'EDIT BLOG';
    document.getElementById('admin-insight-save-btn').innerHTML = '<i class="fas fa-save"></i> UPDATE BLOG';
    document.getElementById('delete-insight-btn').style.display = 'flex';

    document.getElementById('admin-insight-modal').style.display = 'flex';
}

async function handleInsightSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('admin-insight-title').value);
    formData.append('category', document.getElementById('admin-insight-category').value);
    formData.append('summary', document.getElementById('admin-insight-summary').value);
    formData.append('content', quillEditor.root.innerHTML);
    formData.append('status', 'Published');
    
    const fileInput = document.getElementById('admin-insight-banner');
    if (fileInput.files.length > 0) {
        formData.append('banner', fileInput.files[0]);
    }

    const url = currentInsightId ? `${API_BASE_URL}/api/insights/${currentInsightId}` : `${API_BASE_URL}/api/insights`;
    const method = currentInsightId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: formData
        });

        if (res.ok) {
            showToast('Blog saved successfully!', 'success');
            closeInsightModal();
            loadAdminInsights(); // Reload
        } else {
            const data = await res.json();
            showToast(data.message || 'Failed to save insight', 'error');
        }
    } catch (e) {
        showToast('Error saving insight', 'error');
    }
}

window.deleteCurrentInsight = async function() {
    if (!currentInsightId) return;
    if (!confirm('Are you sure you want to delete this blog? This action cannot be undone.')) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/insights/${currentInsightId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (res.ok) {
            showToast('Insight deleted successfully', 'success');
            closeInsightModal();
            loadAdminInsights(); // Reload
        } else {
            showToast('Failed to delete blog', 'error');
        }
    } catch (e) {
        showToast('Error deleting insight', 'error');
    }
}

window.deleteInsightFromTable = async function(id) {
    if (!confirm('Are you sure you want to delete this blog? This action cannot be undone.')) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/insights/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (res.ok) {
            showToast('Blog deleted successfully', 'success');
            loadAdminInsights();
        } else {
            showToast('Failed to delete blog', 'error');
        }
    } catch (e) {
        showToast('Error deleting blog', 'error');
    }
}
