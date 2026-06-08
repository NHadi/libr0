document.addEventListener('DOMContentLoaded', () => {
    const mockup = document.querySelector('.mockup-window');
    const badgeLeft = document.querySelector('.badge-left');
    const badgeRight = document.querySelector('.badge-right');
    const badgeBottom = document.querySelector('.badge-bottom');
    const hero = document.querySelector('.hero');
    const heroLogo = document.querySelector('.hero-logo-wrapper');

    // Optimization: Use requestAnimationFrame for smooth scrolling
    let ticking = false;

    function updateHeroScroll() {
        const scrollY = window.scrollY;
        
        if (!hero) return;
        const heroHeight = hero.offsetHeight;
        
        // Only calculate if hero is somewhat in view
        if (scrollY <= heroHeight + 100) {
            const progress = Math.min(scrollY / heroHeight, 1); // 0 to 1 ratio
            
            // 1. Mockup Window: Tilt it further back and push it down slightly
            if (mockup) {
                // Starts at 5deg, tilts up to 25deg, scales down to 0.95
                const rotateX = 5 + (progress * 20); 
                const scale = 1 - (progress * 0.05);
                const translateY = progress * 40;
                mockup.style.transform = `rotateX(${rotateX}deg) scale(${scale}) translateY(${translateY}px)`;
            }
            
            // 2. Badges: Parallax fly-out effect
            if (badgeLeft) {
                // Flies out to the left and up
                badgeLeft.style.transform = `translate(${-progress * 120}px, ${-progress * 80}px)`;
                badgeLeft.style.opacity = 1 - (progress * 1.5);
            }
            if (badgeRight) {
                // Flies out to the right and down
                badgeRight.style.transform = `translate(${progress * 120}px, ${progress * 80}px)`;
                badgeRight.style.opacity = 1 - (progress * 1.5);
            }
            if (badgeBottom) {
                // Drops straight down
                badgeBottom.style.transform = `translate(-50%, ${progress * 160}px)`;
                badgeBottom.style.opacity = 1 - (progress * 1.5);
            }
            
            // 3. Floating Logo: Parallax up
            if (heroLogo) {
                heroLogo.style.transform = `translateY(${-progress * 80}px)`;
            }
        }
        
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeroScroll);
            ticking = true;
        }
    });
    
    // Trigger once on load in case user is already scrolled down
    updateHeroScroll();
});
