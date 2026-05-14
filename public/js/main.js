// Version: 11.0.1 - Force Cache Clear
if (localStorage.getItem('site_version') !== '11.0.1') {
    const currentLang = localStorage.getItem('site_lang');
    localStorage.clear();
    localStorage.setItem('site_version', '11.0.1');
    if (currentLang) localStorage.setItem('site_lang', currentLang);
}

// Previous version header was: // Version: 1.1.2 - Translation Debug
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.warn('SW registration failed:', err));
    });
}

window.addEventListener('components-loaded', () => {
    
    // --- Loader ---
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }, 300); // Reduced from 1000ms → 300ms for faster perceived load
    }

    // --- Sticky Navbar & Scroll Spy ---
    const topNavbar = document.getElementById('navbar');
    const backToTopBtn = document.getElementById('backToTop');
    
    if (topNavbar) {
        const stickyCta = document.querySelector('.sticky-mobile-cta');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                topNavbar.classList.add('sticky');
                if (backToTopBtn) backToTopBtn.classList.add('show');
            } else {
                topNavbar.classList.remove('sticky');
                if (backToTopBtn) backToTopBtn.classList.remove('show');
            }

            // Sticky CTA Visibility (Past Hero)
            if (window.scrollY > 400 && window.innerWidth < 992) {
                stickyCta?.classList.add('visible');
            } else {
                stickyCta?.classList.remove('visible');
            }
        });
    }

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            // Handle menu toggle behavior
            menuToggle.classList.toggle('active'); // Changed from mobileMenu to menuToggle
            navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking a link
        navMenu.querySelectorAll('.nav-link').forEach(link => { // Scoped to navMenu
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active'); // Changed from mobileMenu to menuToggle
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(e.target) && 
                !menuToggle.contains(e.target)) { // Changed from el to menuToggle
                menuToggle.classList.remove('active'); // Changed from mobileMenu to menuToggle
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // --- Smooth Scrolling for anchor links (only hash links on same page) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if(href !== '#' && href !== '#modal') {
                const target = document.querySelector(href);
                if(target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // --- Counter Animation ---
    const counters = document.querySelectorAll('.stat-number');
    let hasAnimated = false;

    const animateCounters = () => {
        counters.forEach(counter => {
            counter.innerText = '0';
            const updateCounter = () => {
                const target = +counter.getAttribute('data-target');
                const c = +counter.innerText;
                const increment = target / 50; // speed of animation
                
                if (c < target) {
                    counter.innerText = Math.ceil(c + increment);
                    setTimeout(updateCounter, 30);
                } else {
                    counter.innerText = target;
                }
            };
            updateCounter();
        });
    };

    const statsSection = document.getElementById('stats-counter');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasAnimated) {
                animateCounters();
                hasAnimated = true;
            }
        }, { threshold: 0.5 });
        observer.observe(statsSection);
    }

    // --- Lightbox Gallery ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxVideo = document.getElementById('lightbox-video');
    const lightboxClose = document.querySelector('.lightbox-close');

    if (lightbox) {
        // Use event delegation for gallery items so dynamcially added images work
        document.body.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item');
            if (item) {
                const imgSrc = item.getAttribute('data-src');
                const videoSrc = item.getAttribute('data-video');
                
                lightbox.classList.add('active');
                
                if (videoSrc) {
                    lightboxImg.style.display = 'none';
                    lightboxVideo.style.display = 'block';
                    lightboxVideo.src = videoSrc;
                    lightboxVideo.play();
                } else if (imgSrc) {
                    lightboxVideo.style.display = 'none';
                    lightboxVideo.pause();
                    lightboxImg.style.display = 'block';
                    lightboxImg.src = imgSrc;
                }
            }
        });

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            lightboxVideo.pause();
            lightboxVideo.src = "";
            lightboxImg.src = "";
        };

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    // --- All booking form logic and modal toggles removed to favor direct contact ---


    // --- 3D Hover Tilt Effect Logic ---
    const tiltElements = document.querySelectorAll('.glass-panel');
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -10; // Max tilt 10deg
            const rotateY = ((x - centerX) / centerX) * 10;
            
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        // Disable tilt on mobile for better usability
        const isMobile = window.matchMedia("(max-width: 992px)").matches;
        if (isMobile) return;

        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            // Adding a transition dynamically when leaving to smooth out the reset
            el.style.transition = 'transform 0.5s ease-out';
            setTimeout(() => {
                el.style.transition = ''; // clear transition to avoid lagging on mouseenter
            }, 500);
        });
    });

    // --- Language Selector Logic ---
    const languageSelector = document.getElementById('languageSelector');

    const applyLanguage = (lang) => {
        if (typeof translations === 'undefined') {
            return;
        }
        const t = translations[lang];
        if (t) {
            const elements = document.querySelectorAll('[data-i18n]');
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (t[key]) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = t[key];
                    } else if (el.tagName === 'OPTION') {
                        el.textContent = t[key];
                    } else {
                        el.innerHTML = t[key];
                    }
                } else {
                    console.warn(`Missing translation key: ${key} for language: ${lang}`);
                }
            });
        }
        if (languageSelector) languageSelector.value = lang;
    };

    // Load saved lang, default to English
    const savedLang = localStorage.getItem('site_lang') || 'en';
    applyLanguage(savedLang);

    if (languageSelector) {
        languageSelector.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        languageSelector.addEventListener('change', (e) => {
            e.stopPropagation();
            const lang = e.target.value;
            localStorage.setItem('site_lang', lang);
            applyLanguage(lang);
        });
    }
    // --- Phone Highlight Trigger ---
    if (window.location.hash === '#phone') {
        const phoneEl = document.getElementById('phone-contact');
        if (phoneEl) {
            phoneEl.classList.add('highlight-phone');
            phoneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Remove highlight after some time if desired, or keep it
            setTimeout(() => {
                phoneEl.classList.remove('highlight-phone');
            }, 6000); // 6 seconds highlight
        }
    }

    // --- Dynamic Homepage Reviews Fetch ---
    const homeReviewsContainer = document.getElementById('home-reviews-container');
    if (homeReviewsContainer) {
        // Save static fallback HTML in case API fails
        const fallbackHTML = homeReviewsContainer.innerHTML;
        
        const fetchHomeReviews = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
                
                const response = await fetch('/api/reviews', { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await response.json();
                
                if (data.success && data.data && data.data.length > 0) {
                    // Render top 2 most recent reviews dynamically
                    const topReviews = data.data.slice(0, 2);
                    homeReviewsContainer.innerHTML = topReviews.map(review => {
                        const initials = review.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                        const stars = Array.from({ length: 5 }, (_, i) => {
                            return `<i class="fa-${i < review.rating ? 'solid' : 'regular'} fa-star"></i>`;
                        }).join('');
                        
                        return `
                            <div class="review-card glass-panel animate-in">
                                <div class="review-header">
                                    <div class="reviewer-img-placeholder" style="width: 60px; height: 60px; border-radius: 50%; background: var(--primary-gold); color: var(--primary-black); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; border: 2px solid var(--primary-gold);">${initials}</div>
                                    <div class="reviewer-info">
                                        <h4>${review.name}</h4>
                                        <div class="stars">${stars}</div>
                                    </div>
                                </div>
                                <p class="review-text">"${review.comment}"</p>
                                <small style="color: var(--text-muted); display: block; margin-top: 10px;">${new Date(review.createdAt).toLocaleDateString()}</small>
                            </div>
                        `;
                    }).join('');
                }
            } catch (err) {
                console.error('Failed to fetch home reviews, displaying fallbacks:', err);
                homeReviewsContainer.innerHTML = fallbackHTML;
            }
        };

        const reviewsObserver = new IntersectionObserver((entries, observer) => {
            if (entries[0].isIntersecting) {
                fetchHomeReviews();
                observer.disconnect();
            }
        }, { rootMargin: '200px' });
        reviewsObserver.observe(homeReviewsContainer);
    }

    // --- Dynamic Gallery Page Fetch ---
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
        // Save static fallback in case API fails or has 0 images
        const fallbackGallery = galleryGrid.innerHTML;

        const fetchDynamicGallery = async () => {
            try {
                const response = await fetch('/api/gallery');
                const data = await response.json();
                
                if (data.success && data.data && data.data.length > 0) {
                    galleryGrid.innerHTML = data.data.map(img => `
                        <div class="gallery-item animate-in" data-src="${img.imageUrl}">
                            <img src="${img.imageUrl}" alt="${img.caption || 'Gallery Image'}" loading="lazy">
                            <div class="gallery-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
                            ${img.caption ? `<div style="position:absolute; bottom:10px; left:10px; color:white; background:rgba(0,0,0,0.6); padding:4px 8px; border-radius:4px; font-size:0.8rem; pointer-events:none; z-index:3;">${img.caption}</div>` : ''}
                        </div>
                    `).join('');
                } else if (data.success && data.data && data.data.length === 0) {
                    // if API works but no custom images, rely on static ones
                    galleryGrid.innerHTML = fallbackGallery;
                }
            } catch (err) {
                console.error('Failed to fetch gallery, using fallback');
                galleryGrid.innerHTML = fallbackGallery;
            }
        };
        
        const galleryObserver = new IntersectionObserver((entries, observer) => {
            if (entries[0].isIntersecting) {
                fetchDynamicGallery();
                observer.disconnect();
            }
        }, { rootMargin: '200px' });
        galleryObserver.observe(galleryGrid);
    }
});
