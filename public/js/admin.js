document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const secretDenied = document.getElementById('secret-denied');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    
    let reviewsPollInterval = null;
    let allReviews = [];

    // --- Authentication & Secret Access ---
    const urlParams = new URLSearchParams(window.location.search);
    const secretKey = urlParams.get('key');
    const token = localStorage.getItem('adminToken');

    // If already logged in, show dashboard regardless of key
    if (token) {
        showDashboard();
    } else {
        // If not logged in, check if the secret key is present
        // (The actual validation happens on the server, but we hide/show the form here)
        if (secretKey) {
            loginSection.style.display = 'block';
        } else {
            secretDenied.style.display = 'block';
        }
    }

    const handleLogout = () => {
        console.log('[Auth] Logging out...');
        localStorage.removeItem('adminToken');
        if (reviewsPollInterval) clearInterval(reviewsPollInterval);
        
        // Return to login with the same key if it was present
        const currentKey = new URLSearchParams(window.location.search).get('key');
        window.location.href = currentKey ? `/admin.html?key=${currentKey}` : '/admin.html';
    };

    function showDashboard() {
        console.log('[Dashboard] Initializing Dashboard...');
        if (loginSection) loginSection.style.display = 'none';
        if (secretDenied) secretDenied.style.display = 'none';
        dashboardSection.style.display = 'block';
        fetchReviews(true);
        fetchGallery();
        fetchPricing();
        startReviewsPolling();
    }

    // Login Form Submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const keyFromUrl = new URLSearchParams(window.location.search).get('key');

        loginError.style.display = 'none';
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, secretKey: keyFromUrl })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('adminToken', data.token);
                showDashboard();
            } else {
                loginError.textContent = data.error || 'Login failed';
                loginError.style.display = 'block';
            }
        } catch (err) {
            loginError.textContent = 'Server error. Please check backend.';
            loginError.style.display = 'block';
        }
    });

    // --- Global Click Event Delegation ---
    dashboardSection.addEventListener('click', (e) => {
        const target = e.target;
        
        // Logout Button manually
        if (target.id === 'logoutBtn' || target.closest('#logoutBtn')) {
            handleLogout();
            return;
        }

        // Delete Review Button
        const delReviewBtn = target.closest('.btn-delete-review');
        if (delReviewBtn) {
            const id = delReviewBtn.dataset.id;
            if (id) deleteReview(id);
            return;
        }

        // Delete Gallery Button
        const delGalleryBtn = target.closest('.btn-delete-gallery');
        if (delGalleryBtn) {
            const id = delGalleryBtn.dataset.id;
            if (id) deleteGalleryImage(id);
            return;
        }

        // Delete Pricing Button
        const delPriceBtn = target.closest('.btn-delete-pricing');
        if (delPriceBtn) {
            const id = delPriceBtn.dataset.id;
            if (id) deletePricing(id);
            return;
        }

        // Edit Pricing Button
        const editPriceBtn = target.closest('.btn-edit-pricing');
        if (editPriceBtn) {
            const { id, route, vehicle, orig, disc } = editPriceBtn.dataset;
            editPricing(id, route, vehicle, orig, disc);
            return;
        }
    });

    // --- Reviews Management ---
    async function fetchReviews(isManual = false) {
        try {
            const res = await fetch(`/api/admin/reviews?t=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await res.json();
            if (data.success) {
                allReviews = data.data;
                renderReviews(allReviews);
            } else if (res.status === 401 || res.status === 403) {
                handleLogout();
            }
        } catch (err) {
            console.error('[Sync] Failed to fetch reviews:', err);
            if (isManual) {
                const tb = document.querySelector('#reviewsTable tbody');
                if (tb) tb.innerHTML = `<tr><td colspan="6" style="color:red; padding: 20px;">Connection Error: ${err.message}</td></tr>`;
            }
        }
    }

    function startReviewsPolling() {
        if (reviewsPollInterval) clearInterval(reviewsPollInterval);
        reviewsPollInterval = setInterval(() => fetchReviews(false), 5000);
    }

    function renderReviews(reviews) {
        const tbody = document.querySelector('#reviewsTable tbody');
        if (!tbody) return;
        if (!reviews || reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No reviews in Database</td></tr>';
            return;
        }
        
        tbody.innerHTML = reviews.map(r => {
            const sourceBadge = r.source === 'admin'
                ? `<span style="background:#c5a059;color:#000;padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:600;">Admin</span>`
                : `<span style="background:#25D366;color:#000;padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:600;">Website</span>`;
            
            return `
            <tr data-id="${r._id}">
                <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>${r.name || 'Unknown'}</td>
                <td>${r.rating || 5} ⭐ / 5</td>
                <td>${(r.comment || '').substring(0, 50)}${(r.comment || '').length > 50 ? '...' : ''}</td>
                <td>${sourceBadge}</td>
                <td>
                    <button class="action-btn btn-delete-review" data-id="${r._id}" style="background:#ff4d4d;">Delete</button>
                </td>
            </tr>`;
        }).join('');
    }

    async function deleteReview(id) {
        showConfirmModal('Delete this review forever?', async () => {
            try {
                const row = document.querySelector(`tr[data-id="${id}"]`);
                if (row) row.style.opacity = '0.5';

                const res = await fetch(`/api/admin/reviews/${id}`, { 
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
                });
                if (res.ok) {
                    allReviews = allReviews.filter(r => r._id !== id);
                    renderReviews(allReviews);
                } else {
                    const err = await res.json().catch(() => ({}));
                    showToast('❌ Delete failed: ' + (err.error || res.status), 'error');
                    if (row) row.style.opacity = '1';
                }
            } catch (err) { 
                showToast('❌ Network error: ' + err.message, 'error');
            }
        });
    }

    // Expose deleteReview globally so inline onclick works too
    window._adminDeleteReview = deleteReview;

    // ── Custom Confirm Modal (replaces browser confirm()) ──────────────────────
    function showConfirmModal(message, onConfirm) {
        // Remove any existing modal
        const existing = document.getElementById('adminConfirmModal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'adminConfirmModal';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.75); z-index: 9999;
            display: flex; align-items: center; justify-content: center;
        `;
        overlay.innerHTML = `
            <div style="background:#1a1a1a; border:1px solid #ff4d4d; border-radius:10px; padding:30px; max-width:400px; width:90%; text-align:center;">
                <i class="fa-solid fa-triangle-exclamation" style="color:#ff4d4d; font-size:2.5rem; margin-bottom:15px;"></i>
                <p style="color:#fff; font-size:1rem; margin:0 0 25px;">${message}</p>
                <div style="display:flex; gap:15px; justify-content:center;">
                    <button id="confirmYes" style="background:#ff4d4d; color:#fff; border:none; padding:10px 30px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:0.95rem;">Yes, Delete</button>
                    <button id="confirmNo" style="background:#333; color:#fff; border:none; padding:10px 30px; border-radius:5px; cursor:pointer; font-size:0.95rem;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#confirmYes').addEventListener('click', () => {
            overlay.remove();
            onConfirm();
        });
        overlay.querySelector('#confirmNo').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    // ── Toast Notification ─────────────────────────────────────────────────────
    function showToast(message, type = 'success') {
        const existing = document.getElementById('adminToast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'adminToast';
        toast.style.cssText = `
            position: fixed; bottom: 30px; right: 30px; z-index:10000;
            background: ${type === 'error' ? '#ff4d4d' : '#25D366'}; color: #fff;
            padding: 14px 24px; border-radius: 8px; font-weight: 600;
            font-size: 0.9rem; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            animation: slideInRight 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    document.getElementById('insertReviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('newReviewName').value;
        const rating = document.getElementById('newReviewRating').value;
        const comment = document.getElementById('newReviewComment').value;
        const btn = e.target.querySelector('button');
        btn.disabled = true;

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, rating, comment, source: 'admin' })
            });
            if (res.ok) {
                document.getElementById('insertReviewForm').reset();
                fetchReviews(true);
                showToast('✔ Review added successfully!', 'success');
            } else {
                showToast('❌ Failed to add review', 'error');
            }
        } catch(err) { showToast('❌ Error: ' + err.message, 'error'); }
        finally { btn.disabled = false; }
    });

    // --- Gallery Management ---
    async function fetchGallery() {
        try {
            const res = await fetch('/api/admin/gallery', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await res.json();
            if (data.success) renderGallery(data.data);
            else if (res.status === 401 || res.status === 403) handleLogout();
        } catch (err) { console.error(err); }
    }

    function renderGallery(images) {
        const tbody = document.querySelector('#galleryTable tbody');
        if (!tbody) return;
        if (images.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No gallery images</td></tr>';
            return;
        }
        tbody.innerHTML = images.map(img => `
            <tr>
                <td>${new Date(img.createdAt).toLocaleDateString()}</td>
                <td><img src="${img.imageUrl}" style="height:40px;"></td>
                <td style="font-size:0.8rem; opacity:0.7;">${img.imageUrl ? img.imageUrl.substring(0, 30) + '...' : '-'}</td>
                <td>${img.caption || '-'}</td>
                <td><button class="action-btn btn-delete-gallery" data-id="${img._id}">Delete</button></td>
            </tr>
        `).join('');
    }

    async function deleteGalleryImage(id) {
        showConfirmModal('Delete this gallery image?', async () => {
            try {
                const res = await fetch(`/api/admin/gallery/${id}`, { 
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
                });
                if (res.ok) {
                    showToast('✔ Image deleted', 'success');
                    fetchGallery();
                } else {
                    const err = await res.json().catch(() => ({}));
                    showToast('❌ Delete failed: ' + (err.error || res.status), 'error');
                }
            } catch (err) { showToast('❌ Network error: ' + err.message, 'error'); }
        });
    }

    // Expose gallery delete globally for inline onclick
    window._adminDeleteGallery = deleteGalleryImage;

    document.getElementById('insertGalleryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const imageUrl = document.getElementById('newGalleryUrl').value;
        const caption = document.getElementById('newGalleryCaption').value;
        try {
            const res = await fetch('/api/admin/gallery', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}` 
                },
                body: JSON.stringify({ imageUrl, caption })
            });
            if (res.ok) {
                document.getElementById('insertGalleryForm').reset();
                fetchGallery();
            }
        } catch(err) { alert('Error adding image'); }
    });

    // --- Pricing Management ---
    async function fetchPricing() {
        try {
            const res = await fetch('/api/admin/pricing', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await res.json();
            if (data.success) renderPricing(data.data);
            else if (res.status === 401 || res.status === 403) handleLogout();
        } catch (err) { console.error(err); }
    }

    function renderPricing(prices) {
        const tbody = document.querySelector('#pricingTable tbody');
        if (!tbody) return;
        if (prices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No pricing entries</td></tr>';
            return;
        }
        tbody.innerHTML = prices.map(p => `
            <tr>
                <td>${p.route}</td>
                <td>${p.vehicleType}</td>
                <td>₹${Number(p.originalPrice).toLocaleString()}</td>
                <td style="color:#4ade80;">₹${Number(p.discountedPrice).toLocaleString()}</td>
                <td>
                    <button class="action-btn btn-edit-pricing" style="background:#c5a059;" 
                        data-id="${p._id}" data-route="${p.route.replace(/"/g, '&quot;')}" data-vehicle="${p.vehicleType}"
                        data-orig="${p.originalPrice}" data-disc="${p.discountedPrice}">Edit</button>
                    <button class="action-btn btn-delete-pricing" data-id="${p._id}">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    function editPricing(id, route, vehicle, orig, disc) {
        document.getElementById('editPricingId').value = id;
        document.getElementById('newPricingRoute').value = route;
        document.getElementById('newPricingVehicle').value = vehicle;
        document.getElementById('newPricingOriginal').value = orig;
        document.getElementById('newPricingDiscounted').value = disc;
        document.getElementById('pricingSubmitBtn').textContent = 'Update Price';
        document.getElementById('pricingCancelBtn').style.display = 'inline-block';
        document.getElementById('insertPricingForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    document.getElementById('pricingCancelBtn').addEventListener('click', () => {
        document.getElementById('insertPricingForm').reset();
        document.getElementById('editPricingId').value = '';
        document.getElementById('pricingSubmitBtn').textContent = 'Add Price';
        document.getElementById('pricingCancelBtn').style.display = 'none';
    });

    async function deletePricing(id) {
        showConfirmModal('Delete this pricing entry?', async () => {
            try {
                const res = await fetch(`/api/admin/pricing/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
                });
                if (res.ok) {
                    showToast('✔ Pricing entry deleted', 'success');
                    fetchPricing();
                } else {
                    const err = await res.json().catch(() => ({}));
                    showToast('❌ Delete failed: ' + (err.error || res.status), 'error');
                }
            } catch (err) { showToast('❌ Network error: ' + err.message, 'error'); }
        });
    }

    // Expose pricing delete globally for inline onclick
    window._adminDeletePricing = deletePricing;

    document.getElementById('insertPricingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editPricingId').value;
        const route = document.getElementById('newPricingRoute').value;
        const vehicleType = document.getElementById('newPricingVehicle').value;
        const originalPrice = document.getElementById('newPricingOriginal').value;
        const discountedPrice = document.getElementById('newPricingDiscounted').value;

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/admin/pricing/${id}` : '/api/admin/pricing';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ route, vehicleType, originalPrice, discountedPrice })
            });

            if (res.ok) {
                document.getElementById('insertPricingForm').reset();
                document.getElementById('editPricingId').value = '';
                document.getElementById('pricingSubmitBtn').textContent = 'Add Price';
                document.getElementById('pricingCancelBtn').style.display = 'none';
                fetchPricing();
            }
        } catch (err) { alert('Error saving pricing'); }
    });

});
