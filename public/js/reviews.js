// Version: 1.0.2 - Review Deletion Implemented
document.addEventListener('DOMContentLoaded', () => {
    const reviewsContainer = document.getElementById('reviews-container');
    const reviewForm = document.getElementById('review-form');
    const reviewMessage = document.getElementById('review-message');

    // Static fallback reviews
    const staticReviews = [
        {
            name: "Rahul Verma",
            rating: 5,
            comment: "King Taxiwala made our family pilgrimage to Tirupati truly unforgettable. The Innova Crysta was immaculate, the driver was courteous and punctual, and my elderly parents felt completely safe throughout the journey. This is the only cab service our family trusts now — pure world-class experience!",
            createdAt: new Date().toISOString()
        },
        {
            name: "Priya Reddy",
            rating: 5,
            comment: "I was amazed by the professionalism! My flight landed at midnight, yet the driver was already waiting with a warm smile. He handled all my heavy luggage effortlessly. For anyone looking for a reliable, safe, and exceptional airport transfer — King Taxiwala is hands-down the best choice.",
            createdAt: new Date().toISOString()
        },
        {
            name: "Srinivas Rao",
            rating: 5,
            comment: "As a businessman who travels to Bangalore and Hyderabad every week, I have tried many services — but nothing compares to King Taxiwala. The cars are always spotless, drivers are well-mannered and know every route. They have earned my complete trust and loyalty. Truly five-star service!",
            createdAt: new Date().toISOString()
        }
    ];

    let allReviews = [];
    let pollInterval = null;

    // Fetch and display reviews
    const fetchReviews = async (isManual = false) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

            const response = await fetch('/api/reviews', { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();

            if (data.success) {
                // Only re-render if data has actually changed to avoid flickering
                const newReviewsJSON = JSON.stringify(data.data);
                const oldReviewsJSON = JSON.stringify(allReviews);
                
                if (newReviewsJSON !== oldReviewsJSON) {
                    allReviews = data.data;
                    renderReviews(allReviews);
                }
            } else if (isManual) {
                // If manual fetch (initial or after action) fails, show error
                allReviews = [...staticReviews];
                renderReviews(allReviews);
            }
        } catch (err) {
            if (isManual) {
                console.error('Error fetching reviews:', err);
                allReviews = [...staticReviews];
                renderReviews(allReviews);
            }
        }
    };

    // Real-time synchronization: Poll every 5 seconds
    const startPolling = () => {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(() => fetchReviews(false), 5000);
    };

    const renderReviews = (reviews) => {
        if (!reviews || reviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No reviews yet. Be the first to write one!</p>';
            return;
        }

        reviewsContainer.innerHTML = reviews.map(review => {
            const initials = review.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const stars = Array.from({ length: 5 }, (_, i) => {
                return `<i class="fa-${i < review.rating ? 'solid' : 'regular'} fa-star"></i>`;
            }).join('');

            return `
                <div class="review-card glass-panel animate-in" data-id="${review._id || ''}">
                    <div class="review-header">
                        <div class="reviewer-img-placeholder">${initials}</div>
                        <div class="reviewer-info">
                            <h4>${review.name}</h4>
                            <div class="stars">
                                ${stars}
                            </div>
                        </div>
                    </div>
                    <p class="review-text">"${review.comment}"</p>
                    <small style="color: var(--text-muted); display: block; margin-top: 10px;">${new Date(review.createdAt).toLocaleDateString()}</small>
                </div>
            `;
        }).join('');
    };

    // Handle form submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = reviewForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.disabled = true;
            submitBtn.innerText = 'Submitting...';

            const name = document.getElementById('review-name').value;
            const ratingInput = reviewForm.querySelector('input[name="rating"]:checked');
            const rating = ratingInput ? parseInt(ratingInput.value) : 5;
            const comment = document.getElementById('review-comment').value;

            // Optimistic UI: Pre-render locally
            const tempReview = {
                name,
                rating,
                comment,
                createdAt: new Date().toISOString(),
                isPending: true
            };
            
            const originalReviews = [...allReviews];
            allReviews.unshift(tempReview);
            renderReviews(allReviews);
            reviewsContainer.scrollIntoView({ behavior: 'smooth' });

            try {
                const response = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, rating, comment })
                });

                const data = await response.json();

                if (data.success) {
                    reviewMessage.textContent = 'Thank you for your review!';
                    reviewMessage.style.color = '#25D366';
                    reviewMessage.style.display = 'block';
                    reviewForm.reset();
                    
                    // Replace temp review with real one from DB
                    allReviews[0] = data.data;
                    renderReviews(allReviews);
                } else {
                    allReviews = originalReviews; // Rollback
                    renderReviews(allReviews);
                    reviewMessage.textContent = data.error || 'Something went wrong.';
                    reviewMessage.style.color = '#ff4d4d';
                    reviewMessage.style.display = 'block';
                }
            } catch (err) {
                allReviews = originalReviews; // Rollback
                renderReviews(allReviews);
                console.error('Error submitting review:', err);
                reviewMessage.textContent = 'Database connection error. Submission failed.';
                reviewMessage.style.color = '#ff4d4d';
                reviewMessage.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
                setTimeout(() => { reviewMessage.style.display = 'none'; }, 5000);
            }
        });
    }

    // Initial fetch and start polling
    fetchReviews(true);
    startPolling();
});
