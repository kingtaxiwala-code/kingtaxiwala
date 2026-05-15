/**
 * Global Components Injector
 * Handles the injection of the Navbar, Footer, Buttons, and Modal across all pages.
 */

const Components = {
    Loader: `
    <div id="loader" class="loader-container">
        <div class="loader-spinner"></div>
    </div>
    `,
    
    Navbar: `
    <nav id="navbar" class="navbar">
        <div class="nav-container">
            <a href="/" class="nav-logo">
                <img src="/images/logo.png" alt="King Taxiwala" class="logo-img">
                <span>KING TAXIWALA</span>
            </a>
            
            <div class="nav-actions">
                <select id="languageSelector" class="lang-select">
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                    <option value="te">తెలుగు</option>
                </select>
                <div class="menu-toggle" id="mobile-menu">
                    <span class="bar"></span>
                    <span class="bar"></span>
                    <span class="bar"></span>
                </div>
            </div>

            <ul class="nav-menu">
                <li><a href="/" class="nav-link" data-path="/" data-i18n="homeNav">Home</a></li>
                <li><a href="/experience" class="nav-link" data-path="/experience" data-i18n="expNav">Experience</a></li>
                <li><a href="/vehicles" class="nav-link" data-path="/vehicles" data-i18n="vehNav">Vehicles</a></li>
                <li><a href="/pricing" class="nav-link" data-path="/pricing" data-i18n="priNav">Pricing</a></li>
                <li><a href="/gallery" class="nav-link" data-path="/gallery" data-i18n="galNav">Gallery</a></li>
                <li><a href="/reviews" class="nav-link" data-path="/reviews" data-i18n="revNav">Reviews</a></li>
                <li><a href="/about" class="nav-link" data-path="/about" data-i18n="abtNav">About Us</a></li>
                <li class="nav-book-btn-item">
                    <a href="/contact#phone" class="btn-book-now" data-i18n="bookNowBtn">Book Now</a>
                </li>
            </ul>
        </div>
    </nav>
    `,
    
    FloatingButtons: `
    <a href="https://wa.me/919642095559" class="floating-whatsapp" target="_blank">
        <i class="fa-brands fa-whatsapp"></i>
    </a>
    <a href="tel:+919642095559" class="floating-phone">
        <i class="fa-solid fa-phone"></i>
    </a>
    <a href="#" class="back-to-top" id="backToTop">
        <i class="fa-solid fa-arrow-up"></i>
    </a>
    `,
    
    Modal: `
    <div class="sticky-mobile-cta">
        <a href="https://wa.me/919642095559" class="btn btn-book-now" target="_blank" data-i18n="bookNowBtn">Book Now</a>
    </div>
    `,
    
    Footer: `
    <footer class="footer">
        <div class="footer-container">
            <div class="footer-about">
                <h3 class="footer-logo"><i class="fa-solid fa-crown gold-text"></i> King Taxiwala</h3>
                <p data-i18n="footerDesc">Providing the most dependable and comfortable travel experiences with uncompromising safety standards.</p>
                <div class="social-icons">
                    <a href="#"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="https://www.instagram.com/kingtaxiwala/" target="_blank"><i class="fa-brands fa-instagram"></i></a>
                    <a href="https://www.youtube.com/@KingTaxiwala" target="_blank"><i class="fa-brands fa-youtube"></i></a>
                </div>
            </div>
            <div class="footer-links">
                <h3 data-i18n="footerQuickLinks">Quick Links</h3>
                <ul>
                    <li><a href="/" data-i18n="homeNav">Home</a></li>
                    <li><a href="/vehicles" data-i18n="vehNav">Vehicles</a></li>
                    <li><a href="/pricing" data-i18n="priNav">Pricing</a></li>
                    <li><a href="/vijayawada-to-hyderabad">Vijayawada → Hyderabad</a></li>
                    <li><a href="/hyderabad-to-vijayawada">Hyderabad → Vijayawada</a></li>
                    <li><a href="/about" data-i18n="abtNav">About Us</a></li>
                    <li><a href="/contact" data-i18n="contactTitle">Contact</a></li>
                </ul>
            </div>
            <div class="footer-contact">
                <h3 data-i18n="footerContactInfo">Contact Info</h3>
                <p><i class="fa-solid fa-phone"></i> +91 96420 95559</p>
                <p><i class="fa-brands fa-whatsapp"></i> +91 96420 95559</p>
                <p><i class="fa-solid fa-envelope"></i> kingtaxiwala@gmail.com</p>
                <p><i class="fa-regular fa-clock"></i> <span data-i18n="footerTiming">24/7 Available</span></p>
                <p data-i18n="footerLocation"><i class="fa-solid fa-location-dot"></i> King Taxiwala Travels, Tankasala Vari St, Sri Ramachandra Nagar, Kanuru, AP 520007</p>
            </div>
        </div>
        <div class="footer-bottom">
            <p data-i18n="footerCopyright">&copy; 2026 King Taxiwala Travels. All Rights Reserved.</p>
        </div>
    </footer>
    `
};

document.addEventListener('DOMContentLoaded', () => {
    // Inject components into matching divs/elements where required, or at top/bottom of body
    
    // Inject Loader early
    document.body.insertAdjacentHTML('afterbegin', Components.Loader);
    
    // Inject Navbar
    document.body.insertAdjacentHTML('afterbegin', Components.Navbar);
    
    // Inject Footer, Floating Buttons, and Modal at end
    document.body.insertAdjacentHTML('beforeend', Components.Footer);
    document.body.insertAdjacentHTML('beforeend', Components.Modal);
    document.body.insertAdjacentHTML('beforeend', Components.FloatingButtons);

    // After injection, update the active state of the navbar based on the current URL
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        // If exact path matches, or path implies index
        const pathData = link.getAttribute('data-path');
        if (currentPath === pathData || (currentPath === '' && pathData === '/')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Re-trigger global event listeners (since the DOM changed)
    window.dispatchEvent(new Event('components-loaded'));
});
