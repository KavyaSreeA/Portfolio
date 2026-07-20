/* ============================================================
   Kavya Sree A — Portfolio interactions
   "Editorial Motion": GSAP ScrollTrigger + Lenis.
   Degrades gracefully if GSAP/Lenis fail to load, and
   fully respects prefers-reduced-motion.
   ============================================================ */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    var hasGSAP = !reduceMotion && typeof window.gsap !== 'undefined';
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    if (hasGSAP && ScrollTrigger) { gsap.registerPlugin(ScrollTrigger); }

    var body = document.body;

    /* ============================================================
       Nav + scroll progress
       ============================================================ */
    var nav = document.getElementById('siteNav');
    var progress = document.getElementById('scrollProgress');
    function onScroll() {
        var y = window.scrollY || document.documentElement.scrollTop;
        if (nav) nav.classList.toggle('scrolled', y > 20);
        if (progress) {
            var h = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')';
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ============================================================
       Lenis smooth scroll (+ ScrollTrigger sync)
       ============================================================ */
    var lenis = null;
    if (!reduceMotion && window.Lenis) {
        lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.5 });
        lenis.on('scroll', function () {
            onScroll();
            if (hasGSAP && ScrollTrigger) ScrollTrigger.update();
        });
        if (hasGSAP) {
            gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
            gsap.ticker.lagSmoothing(0);
        } else {
            requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
        }
        window.__lenis = lenis;
    }
    function scrollToEl(target) {
        if (lenis) lenis.scrollTo(target, { offset: -70 });
        else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    /* ============================================================
       Preloader
       ============================================================ */
    var preloader = document.querySelector('.preloader');
    function startPreloader(done) {
        var finished = false;
        function finish() {
            if (finished) return;
            finished = true;
            if (preloader) preloader.style.display = 'none';
            body.classList.remove('loading');
            if (lenis) lenis.start();
            if (done) done();
        }
        if (!preloader || reduceMotion || !hasGSAP) { finish(); return; }
        if (lenis) lenis.stop();

        var statusEl = preloader.querySelector('.intro-status');
        var stage = preloader.querySelector('.intro-stage');
        var panel = preloader.querySelector('.intro-panel');
        var roleItems = preloader.querySelectorAll('.intro-roles li');

        // Split each title into word masks + per-character spans
        function splitChars(el) {
            var text = (el.textContent || '').trim();
            el.textContent = '';
            var chars = [];
            text.split(/\s+/).forEach(function (word) {
                var w = document.createElement('span');
                w.className = 'intro-word';
                word.split('').forEach(function (ch) {
                    var c = document.createElement('span');
                    c.className = 'intro-char';
                    c.textContent = ch;
                    w.appendChild(c);
                    chars.push(c);
                });
                el.appendChild(w);
            });
            return chars;
        }

        var titles = preloader.querySelectorAll('[data-intro-split]');
        var solidChars = splitChars(titles[0]);
        var strokeChars = titles[1] ? splitChars(titles[1]) : [];

        // Initial states
        gsap.set(preloader, { transformOrigin: 'top' });
        gsap.set([solidChars, strokeChars], { yPercent: 120, scaleY: -0.5 });
        gsap.set(roleItems, { y: 26, opacity: 0 });

        var cycle = ['INITIALIZING', 'FULL STACK DEVELOPER', 'AI ENGINEER', 'MACHINE LEARNING', 'LOADING'];
        var tl = gsap.timeline({ onComplete: finish });

        // 1 — status rapidly cycles, then clears
        cycle.forEach(function (word, i) {
            tl.set(statusEl, { textContent: word }, i * 0.12);
        });
        tl.to(statusEl, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.78)

          // 2 — layered name reveal: solid type, then the outline echo
          .to(solidChars, { yPercent: 0, scaleY: 1, duration: 1.35, ease: 'expo.inOut', stagger: 0.028 }, 0.55)
          .to(strokeChars, { yPercent: 0, scaleY: 1, duration: 1.35, ease: 'expo.inOut', stagger: 0.034 }, 0.62)

          // 3 — roles settle in
          .to(roleItems, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.09 }, 1.7)

          // 4 — colour panel expands upward
          .to(panel, { scaleY: 2.6, duration: 1.15, ease: 'expo.inOut' }, 2.85)
          .to(stage, { y: -70, opacity: 0, duration: 0.8, ease: 'power2.in' }, 3.0)

          // 5 — the whole screen collapses away, revealing the hero
          .to(preloader, { scaleY: 0, duration: 1.05, ease: 'expo.inOut' }, 3.1);

        // Safety net: never let the intro gate content (e.g. rAF paused on a
        // backgrounded tab). Force-reveal after a hard cap regardless of GSAP.
        setTimeout(finish, 7500);
    }

    /* ============================================================
       Split a heading into line-masked words (for reveal)
       ============================================================ */
    function splitWords(el) {
        if (el.dataset.split) return;
        el.dataset.split = '1';
        var nodes = Array.prototype.slice.call(el.childNodes);
        el.innerHTML = '';
        nodes.forEach(function (node) {
            if (node.nodeType === 3) {
                // text node -> words
                node.textContent.split(/(\s+)/).forEach(function (chunk) {
                    if (chunk.trim() === '') { el.appendChild(document.createTextNode(chunk)); return; }
                    var w = document.createElement('span'); w.className = 'word';
                    var inner = document.createElement('span'); inner.className = 'word-inner';
                    inner.textContent = chunk;
                    w.appendChild(inner); el.appendChild(w);
                });
            } else {
                // element (e.g. gradient span) -> keep, wrap as one word
                var w2 = document.createElement('span'); w2.className = 'word';
                var inner2 = document.createElement('span'); inner2.className = 'word-inner';
                inner2.appendChild(node);
                w2.appendChild(inner2); el.appendChild(w2);
                el.appendChild(document.createTextNode(' '));
            }
        });
        return el.querySelectorAll('.word-inner');
    }

    /* ============================================================
       Hero reveal
       ============================================================ */
    function heroReveal() {
        var hero = document.querySelector('.hero');
        if (!hero) return;
        var title = hero.querySelector('.hero-title');
        var others = hero.querySelectorAll('.eyebrow, .hero-lead, .hero-cta, .scroll-hint');
        if (!hasGSAP) {
            hero.querySelectorAll('.reveal').forEach(function (e) { e.classList.add('in'); });
            return;
        }
        var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        if (title) {
            var words = splitWords(title);
            gsap.set(words, { yPercent: 115 });
            tl.to(words, { yPercent: 0, duration: 1.1, stagger: 0.08 }, 0);
        }
        tl.from(others, { y: 26, opacity: 0, duration: 0.9, stagger: 0.12 }, 0.35);
        // subtle parallax of hero content
        if (ScrollTrigger) {
            gsap.to(hero.querySelector('.container'), {
                yPercent: 14, opacity: 0.55, ease: 'none',
                scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
            });
        }
    }

    /* ============================================================
       Generic scroll reveals
       ============================================================ */
    function scrollReveals() {
        if (!hasGSAP || !ScrollTrigger) {
            // fallback: IntersectionObserver
            var els = document.querySelectorAll('.reveal');
            if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach(function (e) { e.classList.add('in'); }); return; }
            var io = new IntersectionObserver(function (en) {
                en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
            }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
            els.forEach(function (e) { io.observe(e); });
            return;
        }
        body.classList.add('gsap-ready');
        // Section titles: word mask reveal
        gsap.utils.toArray('.section-title').forEach(function (t) {
            var words = splitWords(t);
            gsap.set(words, { yPercent: 115 });
            gsap.to(words, {
                yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06,
                scrollTrigger: { trigger: t, start: 'top 85%' }
            });
        });
        // Batched fade-up for .reveal blocks
        ScrollTrigger.batch('.reveal', {
            start: 'top 88%',
            onEnter: function (batch) {
                gsap.to(batch, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.09, overwrite: true });
            }
        });
        gsap.set('.reveal', { y: 34, opacity: 0 });
        ScrollTrigger.refresh();
    }

    /* ============================================================
       Horizontal journey (projects page)
       ============================================================ */
    function horizontalJourney() {
        var wrap = document.querySelector('.h-wrap');
        var track = document.querySelector('.h-track');
        if (!wrap || !track) return;
        var canHorizontal = hasGSAP && ScrollTrigger && window.innerWidth > 880 && !reduceMotion;
        if (!canHorizontal) { return; } // leave clean stacked layout
        wrap.classList.add('h-on');

        var bar = wrap.querySelector('.h-progress-bar');
        var getScrollAmount = function () { return track.scrollWidth - window.innerWidth + 64; };
        gsap.to(track, {
            x: function () { return -getScrollAmount(); },
            ease: 'none',
            scrollTrigger: {
                trigger: wrap,
                start: 'top top',
                end: function () { return '+=' + getScrollAmount(); },
                pin: true,
                scrub: 1,
                invalidateOnRefresh: true,
                onUpdate: function (self) { if (bar) bar.style.width = (self.progress * 100) + '%'; }
            }
        });
    }

    /* ============================================================
       Stat counters
       ============================================================ */
    function counters() {
        var els = document.querySelectorAll('.stat-number[data-target]');
        if (!els.length) return;
        function run(el) {
            var target = parseInt(el.getAttribute('data-target'), 10) || 0;
            if (reduceMotion || !hasGSAP) { el.textContent = target + '+'; return; }
            var o = { v: 0 };
            gsap.to(o, { v: target, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v) + '+'; } });
        }
        if (hasGSAP && ScrollTrigger) {
            els.forEach(function (el) { ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () { run(el); } }); });
        } else if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { run(x.target); io.unobserve(x.target); } }); }, { threshold: 0.5 });
            els.forEach(function (el) { io.observe(el); });
        } else { els.forEach(run); }
    }

    /* ============================================================
       Custom cursor
       ============================================================ */
    function customCursor() {
        if (!finePointer || reduceMotion) return;
        var dot = document.querySelector('.cursor-dot');
        var ring = document.querySelector('.cursor-ring');
        if (!dot || !ring) return;
        var xTo, yTo, rxTo, ryTo;
        if (hasGSAP) {
            xTo = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3' });
            yTo = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3' });
            rxTo = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3' });
            ryTo = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3' });
        }
        window.addEventListener('pointermove', function (e) {
            if (hasGSAP) { xTo(e.clientX); yTo(e.clientY); rxTo(e.clientX); ryTo(e.clientY); }
            else { dot.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; ring.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }
        }, { passive: true });
        document.querySelectorAll('a, button, .glass, .tech-pill, .dot').forEach(function (el) {
            el.addEventListener('pointerenter', function () { ring.classList.add('hover'); });
            el.addEventListener('pointerleave', function () { ring.classList.remove('hover'); });
        });
        document.addEventListener('pointerleave', function () { ring.classList.add('hide'); dot.classList.add('hide'); });
        document.addEventListener('pointerenter', function () { ring.classList.remove('hide'); dot.classList.remove('hide'); });
    }

    /* ============================================================
       Magnetic buttons
       ============================================================ */
    function magnetic() {
        if (!finePointer || reduceMotion) return;
        document.querySelectorAll('.btn').forEach(function (btn) {
            var s = 0.3;
            btn.addEventListener('pointermove', function (e) {
                var r = btn.getBoundingClientRect();
                var x = (e.clientX - (r.left + r.width / 2)) * s;
                var y = (e.clientY - (r.top + r.height / 2)) * s;
                if (hasGSAP) gsap.to(btn, { x: x, y: y, duration: 0.4, ease: 'power3.out' });
                else btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
            });
            btn.addEventListener('pointerleave', function () {
                if (hasGSAP) gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
                else btn.style.transform = '';
            });
        });
    }

    /* ============================================================
       Mobile menu
       ============================================================ */
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('mobileMenu');
    if (toggle && menu) {
        toggle.addEventListener('click', function () {
            var open = menu.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        });
        menu.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); });
        });
    }

    /* ============================================================
       In-page anchor smooth scroll
       ============================================================ */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            var id = a.getAttribute('href');
            if (id && id.length > 1) { var t = document.querySelector(id); if (t) { e.preventDefault(); scrollToEl(t); } }
        });
    });

    /* ============================================================
       Page transition on internal navigation
       ============================================================ */
    function pageTransitions() {
        var overlay = document.querySelector('.page-transition');
        if (!overlay || !hasGSAP) return;
        // On pages with a preloader, the preloader IS the intro — don't play a
        // second black reveal (that caused the "black screen twice" flash).
        if (document.querySelector('.preloader')) {
            gsap.set(overlay, { scaleY: 0 });
        } else {
            gsap.set(overlay, { scaleY: 1, transformOrigin: 'top' });
            gsap.to(overlay, { scaleY: 0, duration: 0.7, ease: 'expo.inOut', delay: 0.05 });
        }
        document.querySelectorAll('a[href]').forEach(function (a) {
            var href = a.getAttribute('href');
            var isInternal = href && !/^(#|mailto:|tel:|http)/.test(href) && a.target !== '_blank';
            if (!isInternal) return;
            a.addEventListener('click', function (e) {
                e.preventDefault();
                gsap.set(overlay, { transformOrigin: 'bottom' });
                gsap.to(overlay, { scaleY: 1, duration: 0.6, ease: 'expo.inOut', onComplete: function () { window.location.href = href; } });
            });
        });
    }

    /* ============================================================
       Hackathon carousel
       ============================================================ */
    var carousel = document.getElementById('carousel');
    if (carousel) {
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('.slide'));
        var dotsWrap = document.getElementById('carouselDots');
        var prevBtn = document.getElementById('carouselPrev');
        var nextBtn = document.getElementById('carouselNext');
        var index = 0, timer = null;
        var dots = slides.map(function (_, i) {
            var b = document.createElement('button');
            b.className = 'dot' + (i === 0 ? ' active' : '');
            b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
            b.addEventListener('click', function () { go(i); restart(); });
            if (dotsWrap) dotsWrap.appendChild(b);
            return b;
        });
        function go(n) {
            index = (n + slides.length) % slides.length;
            slides.forEach(function (s, i) { s.classList.toggle('active', i === index); });
            dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
        }
        function next() { go(index + 1); }
        function prev() { go(index - 1); }
        function restart() { if (timer) { clearInterval(timer); start(); } }
        function start() { if (!reduceMotion) timer = setInterval(next, 5500); }
        if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });
        if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });
        carousel.addEventListener('mouseenter', function () { if (timer) clearInterval(timer); });
        carousel.addEventListener('mouseleave', start);
        start();
    }

    /* ============================================================
       Email: hidden until revealed (contact page)
       ============================================================ */
    var emailCard = document.getElementById('emailCard');
    var emailLabel = document.getElementById('emailLabel');
    var copyBtn = document.getElementById('copyEmail');
    var toast = document.getElementById('toast');
    if (emailCard) {
        var addr = '';
        try { addr = atob(emailCard.getAttribute('data-e') || ''); } catch (e) { addr = ''; }
        if (addr) emailCard.setAttribute('href', 'mailto:' + addr);
        var revealed = false;
        function typeInto(el, text) {
            if (reduceMotion) { el.textContent = text; return; }
            el.textContent = ''; var i = 0;
            (function step() { if (i <= text.length) { el.textContent = text.slice(0, i); i++; setTimeout(step, 34); } })();
        }
        function revealEmail() { if (revealed) return; revealed = true; emailCard.classList.add('revealed'); if (emailLabel) typeInto(emailLabel, addr); }
        emailCard.addEventListener('click', function (e) { if (!revealed) { e.preventDefault(); revealEmail(); } });
        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                function done() { copyBtn.textContent = 'Copied'; revealEmail(); if (toast) { toast.classList.add('show'); setTimeout(function () { toast.classList.remove('show'); }, 2000); } setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000); }
                function fallback() { var ta = document.createElement('textarea'); ta.value = addr; ta.style.position = 'fixed'; ta.style.top = '-1000px'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.focus(); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(ta); }
                if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(addr).then(done).catch(fallback); } else { fallback(); }
            });
        }
    }

    /* ============================================================
       Tech-stack brand logos (Devicon)
       ============================================================ */
    function techLogos() {
        var LOGOS = {
            'python': 'devicon-python-plain colored',
            'javascript': 'devicon-javascript-plain colored',
            'c': 'devicon-c-plain colored',
            'react': 'devicon-react-original colored',
            'node.js': 'devicon-nodejs-plain colored',
            'tensorflow': 'devicon-tensorflow-original colored',
            'pytorch': 'devicon-pytorch-original colored',
            'scikit-learn': 'devicon-scikitlearn-plain colored',
            'selenium': 'devicon-selenium-original colored',
            'git': 'devicon-git-plain colored',
            'docker': 'devicon-docker-plain colored',
            'postgresql': 'devicon-postgresql-plain colored',
            'neo4j': 'devicon-neo4j-plain colored',
            'matplotlib': 'devicon-matplotlib-plain colored',
            'html': 'devicon-html5-plain colored',
            'css': 'devicon-css3-plain colored',
            'tailwind': 'devicon-tailwindcss-plain colored',
            'three.js': 'devicon-threejs-original colored'
        };
        document.querySelectorAll('.tech-pill').forEach(function (pill) {
            if (pill.querySelector('i')) return;
            var key = pill.textContent.trim().toLowerCase();
            var cls = LOGOS[key];
            if (!cls) return;
            var icon = document.createElement('i');
            icon.className = cls;
            icon.setAttribute('aria-hidden', 'true');
            pill.insertBefore(icon, pill.firstChild);
        });
    }

    /* ============================================================
       Boot
       ============================================================ */
    function boot() {
        techLogos();
        customCursor();
        magnetic();
        pageTransitions();
        heroReveal();
        scrollReveals();
        horizontalJourney();
        counters();
        if (hasGSAP && ScrollTrigger) { window.addEventListener('load', function () { ScrollTrigger.refresh(); }); }
    }

    if (!body.classList.contains('loading')) {
        boot();
    } else {
        startPreloader(boot);
    }
})();
