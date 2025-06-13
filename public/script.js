// Navigation and section management
document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    const mainNav = document.getElementById('mainNav');

    const messageModal = document.getElementById('messageModal');
    const modalMessageText = document.getElementById('modalMessageText');
    const modalCloseButton = document.getElementById('modalCloseButton');

    function showModal(message) {
        modalMessageText.textContent = message;
        messageModal.style.display = 'flex';
    }

    if (modalCloseButton) { // Ensure button exists before adding listener
        modalCloseButton.addEventListener('click', () => {
            messageModal.style.display = 'none';
        });
    }


    // Update active section based on URL hash
    function updateActiveSection() {
        let currentSectionId = 'overview'; // Default section
        const hash = window.location.hash;

        if (hash) {
            const targetSection = document.querySelector(hash);
            if (targetSection && Array.from(sections).includes(targetSection)) {
                currentSectionId = hash.substring(1);
            }
        }
        
        sections.forEach(section => {
            section.classList.remove('active');
        });

        const currentSection = document.getElementById(currentSectionId);
        if (currentSection) {
            currentSection.classList.add('active');
        }

        navLinks.forEach(link => {
            if (link.getAttribute('href') === '#' + currentSectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Navigation click handlers
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1);
            
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });

            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Accordion functionality (If you have accordions, keep this part)
    // const accordionToggles = document.querySelectorAll('.accordion-toggle');
    // accordionToggles.forEach(toggle => { ... });

    // Initialize roadmap chart if it exists
    if (document.getElementById('roadmapChart')) {
        initializeRoadmapChart(); // Initial call to draw the chart

        // Setup a single, debounced resize handler to manage the chart.
        // This is placed here so it's only created once.
        let resizeTimeout;
        let lastWindowWidth = window.innerWidth; // Store the initial width

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const currentWidth = window.innerWidth;

                // Only re-initialize if the window width has changed.
                // This prevents re-rendering on mobile scroll (which only changes height).
                if (currentWidth !== lastWindowWidth) {
                    lastWindowWidth = currentWidth; // Update the stored width

                    // The initializeRoadmapChart function already handles destroying the previous chart instance.
                    initializeRoadmapChart();
                }
            }, 250); // Debounce to avoid rapid firing
        });
    }

    // Set up event listeners for active section
    window.addEventListener('hashchange', updateActiveSection);
    updateActiveSection(); // Initial call

    // Gemini buttons (If you have these, keep this part)
    // const geminiButtons = document.querySelectorAll('.gemini-trigger-btn');
    // geminiButtons.forEach(button => { ... });

    // Use Cases Carousel
    const carousel = document.getElementById('useCasesCarousel');
    if (carousel) {
        const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
        const prevButton = document.getElementById('carouselPrevBtn');
        const nextButton = document.getElementById('carouselNextBtn');
        const indicatorsContainer = document.getElementById('carouselIndicators');
        const slidesContainer = carousel.querySelector('.carousel-slides');

        let currentIndex = 0;
        const totalSlides = slides.length;

        if (totalSlides === 0) {
            console.warn("No slides found for use cases carousel. Aborting carousel setup.");
            if (carousel) carousel.style.display = 'none'; 
            
        } else { // Only run carousel logic if there are slides

            carousel.setAttribute('tabindex', '0');

            if (indicatorsContainer) {
                indicatorsContainer.innerHTML = ''; 
                slides.forEach((_, idx) => {
                    const dot = document.createElement('button');
                    dot.classList.add(
                        'carousel-indicator', 'px-3', 'py-1', 'text-sm', 'font-medium',
                        'rounded-full', 'hover:bg-gray-600', 'focus:outline-none', 'transition-colors'
                    );
                    dot.setAttribute('data-slide-to', idx);
                    dot.setAttribute('aria-label', `View use case ${idx + 1}`);
                    dot.textContent = idx + 1;
                    if (idx === currentIndex) { 
                        dot.classList.add('bg-gray-800', 'text-white');
                        dot.classList.remove('bg-gray-400', 'text-black');
                    } else {
                        dot.classList.add('bg-gray-400', 'text-black');
                        dot.classList.remove('bg-gray-800', 'text-white');
                    }
                    dot.addEventListener('click', e => showSlide(+e.currentTarget.dataset.slideTo));
                    indicatorsContainer.appendChild(dot);
                });
            }
            const indicators = indicatorsContainer ? Array.from(indicatorsContainer.children) : [];

            function updateCarousel() {
                if (slidesContainer) {
                    slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
                }
                if (indicators.length > 0) {
                    indicators.forEach((dot, i) => {
                        if (i === currentIndex) {
                            dot.classList.add('bg-gray-800', 'text-white');
                            dot.classList.remove('bg-gray-400', 'text-black');
                        } else {
                            dot.classList.add('bg-gray-400', 'text-black');
                            dot.classList.remove('bg-gray-800', 'text-white');
                        }
                    });
                }
            }

            function showSlide(i) {
                currentIndex = (i + totalSlides) % totalSlides;
                updateCarousel();
            }

            if (nextButton) nextButton.addEventListener('click', () => showSlide(currentIndex + 1));
            if (prevButton) prevButton.addEventListener('click', () => showSlide(currentIndex - 1));

            let autoplayIntervalId = null;
            function startAutoplay() {
                stopAutoplay(); 
                if (totalSlides > 1) { 
                    autoplayIntervalId = setInterval(() => showSlide(currentIndex + 1), 7000); // Slightly longer interval
                }
            }
            function stopAutoplay() {
                clearInterval(autoplayIntervalId);
            }

            carousel.addEventListener('mouseenter', stopAutoplay);
            carousel.addEventListener('mouseleave', startAutoplay);
            carousel.addEventListener('focusin', stopAutoplay); // Stop for keyboard navigation
            carousel.addEventListener('focusout', startAutoplay); // Resume after focus leaves

            carousel.addEventListener('keydown', e => {
                if (e.key === 'ArrowRight') showSlide(currentIndex + 1);
                if (e.key === 'ArrowLeft') showSlide(currentIndex - 1);
            });

            let startX = 0;
            carousel.addEventListener('touchstart', e => {
                if (e.changedTouches && e.changedTouches.length > 0) {
                  startX = e.changedTouches[0].screenX;
                }
            }, { passive: true });
            carousel.addEventListener('touchend', e => {
                if (e.changedTouches && e.changedTouches.length > 0) {
                  const endX = e.changedTouches[0].screenX;
                  if (endX - startX > 50) showSlide(currentIndex - 1); 
                  if (startX - endX > 50) showSlide(currentIndex + 1); 
                }
            });

            function setFixedCarouselHeight() {
                const carouselElement = document.getElementById('useCasesCarousel');
                if (!carouselElement) return; 

                const currentSlidesForHeight = Array.from(carouselElement.querySelectorAll('.carousel-slide'));
                let maxHeight = 0;

                if (currentSlidesForHeight.length === 0) {
                    carouselElement.style.height = 'auto';
                    return;
                }

                currentSlidesForHeight.forEach(slide => {
                    const originalDisplay = slide.style.display;
                    const originalPosition = slide.style.position;
                    const originalVisibility = slide.style.visibility;

                    slide.style.position = 'absolute'; 
                    slide.style.visibility = 'hidden'; 
                    slide.style.display = 'block';     

                    const height = slide.scrollHeight;
                    if (height > maxHeight) {
                        maxHeight = height;
                    }

                    slide.style.display = originalDisplay;
                    slide.style.position = originalPosition;
                    slide.style.visibility = originalVisibility;
                });
                
                const isMobile = window.innerWidth < 768;
                const PADDING_AND_CONTROLS_HEIGHT = isMobile ? (window.innerWidth < 480 ? 90 : 110) : 150; // Kept increased values
                const MIN_CAROUSEL_HEIGHT = isMobile ? (window.innerWidth < 480 ? 320 : 350) : 450;


                const finalHeight = Math.max(maxHeight + PADDING_AND_CONTROLS_HEIGHT, MIN_CAROUSEL_HEIGHT);
                carouselElement.style.height = finalHeight + 'px';
            }

            function initializeCarouselOnLoad() {
                if (totalSlides > 0) {
                    setFixedCarouselHeight();
                    updateCarousel();
                    startAutoplay();
                }
            }

            // **MODIFIED PART STARTS HERE**
            // This uses an IntersectionObserver to initialize the carousel only when it
            // becomes visible, ensuring all content and fonts are fully rendered.
            const carouselObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    // When the carousel is intersecting with the viewport
                    if (entry.isIntersecting) {
                        // A small timeout for an extra safeguard against rendering race conditions.
                        setTimeout(() => {
                            initializeCarouselOnLoad();
                        }, 100);

                        // Stop observing once we've initialized it.
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '0px',
                threshold: 0.1  // Trigger when at least 10% of the element is visible
            });

            // Start observing the carousel element.
            carouselObserver.observe(carousel);

            // A debounced resize handler is still needed for orientation changes or window resizing.
            let carouselResizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(carouselResizeTimeout);
                carouselResizeTimeout = setTimeout(setFixedCarouselHeight, 250);
            });
            // **MODIFIED PART ENDS HERE**

            if (totalSlides <= 1) {
                if (prevButton) prevButton.style.display = 'none';
                if (nextButton) nextButton.style.display = 'none';
                if (indicatorsContainer) indicatorsContainer.style.display = 'none';
                stopAutoplay();
            }
        } // End of "else" for totalSlides > 0
    } // End of "if (carousel)"

    // Key considerations tabs
    const tabItems = document.querySelectorAll('#keyConsiderationsMenu .tab-item');
    const tabContents = document.querySelectorAll('#keyConsiderationsContent .tab-content');
    
    if(tabItems.length && tabContents.length) { 
      tabItems[0].classList.add('bg-gray-200'); 
      tabContents.forEach((content, index) => { 
          if (index === 0) {
              content.classList.remove('hidden');
          } else {
              content.classList.add('hidden');
          }
      });
    
      tabItems.forEach(item => {
        item.addEventListener('click', function(){
          tabItems.forEach(i => i.classList.remove('bg-gray-200'));
          tabContents.forEach(content => content.classList.add('hidden'));
          item.classList.add('bg-gray-200');
          const targetId = item.getAttribute('data-tab');
          const targetContent = document.getElementById(targetId);
          if(targetContent) {
            targetContent.classList.remove('hidden');
          }
        });
      });
    }
}); // End of DOMContentLoaded

// ... (The rest of the file, including initializeRoadmapChart, remains unchanged) ...
function initializeRoadmapChart() {
    const roadmapChartCtx = document.getElementById('roadmapChart')?.getContext('2d');
    if (!roadmapChartCtx) {
        console.warn("Roadmap chart canvas context not found.");
        return;
    }

    const infoPopup = document.getElementById('roadmapInfoPopup');
    const popupPhaseName = document.getElementById('popupPhaseName')?.querySelector('span');
    const popupDuration = document.getElementById('popupDuration')?.querySelector('span');
    const popupTimeframe = document.getElementById('popupTimeframe')?.querySelector('span');
    const popupActivitiesList = document.getElementById('popupActivities');

    function hexToRgba(hex, alpha = 1) {
        if (typeof hex !== 'string' || !hex.startsWith('#')) {
            return `rgba(0,0,0,${alpha})`;
        }
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return `rgba(0,0,0,${alpha})`;
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    const phaseColors = {
        mobilize: '#3B4430',
        iaas: '#D93434',
        migration: '#CC7722',
        dataStorage: '#008080',
        draas: '#243A73',
        optimization: '#2F3A4C',
        default: '#808080'
    };

    function getPhaseColorKey(phaseNameString) {
        if (!phaseNameString) return "default";
        const name = phaseNameString.toLowerCase();
        if (name.startsWith("mobilize")) return "mobilize";
        if (name.startsWith("infrastructure as a service")) return "iaas";
        if (name.startsWith("migration")) return "migration";
        if (name.startsWith("data storage")) return "dataStorage";
        if (name.startsWith("disaster recovery as a service")) return "draas";
        if (name.startsWith("optimization")) return "optimization";
        console.warn("No color key found for phase:", phaseNameString, "using default.");
        return "default";
    }

    const allPhasesData = [
        { name: 'Mobilize', x: [0, 2], activities: 'Project kick-off, UNN LZ Design & Build, Initial Assessments', hasRolloff: false },
        { name: 'Infrastructure as a Service (IaaS)', x: [2, 5], activities: 'Foundational IaaS services, Pilot migration to UNN, First CSP PLZ Build, Pilot to CSP', hasRolloff: true },
        { name: 'Migration', x: [5, 9], activities: 'App portfolio assessment, Wave migrations, Modernization efforts', hasRolloff: true },
        { name: 'Data Storage', x: [9, 15], activities: 'Data landscape assessment, CSP Data Storage Implementation', hasRolloff: true },
        { name: 'Disaster Recovery as a Service (DRaaS)', x: [15, 18], activities: 'BIA, RTO/RPO, DRaaS implementation & testing', hasRolloff: true },
        { name: 'Optimization', x: [18, 24], activities: 'Continuous monitoring, cost/security/performance optimization', hasRolloff: false }
    ];

    const newPhaseLabels = allPhasesData.map(p => p.name);

    const chartSegmentsData = [];
    allPhasesData.forEach(phase => {
        chartSegmentsData.push({
            x: phase.x,
            y: phase.name,
            activities: phase.activities,
            isRolloff: false
        });
        if (phase.hasRolloff && phase.x[1] < 24) {
            chartSegmentsData.push({
                x: [phase.x[1], 24],
                y: phase.name,
                activities: 'Rolloff period: Ongoing support, transition, and service ramp-down activities.',
                isRolloff: true
            });
        }
    });
    
    const isSmallScreen = window.innerWidth < 768;
    const isVerySmallScreen = window.innerWidth < 480;

    const phaseStartMarkers = allPhasesData.map((phase, index) => ({
        type: 'line',
        scaleID: 'x',
        value: phase.x[0],
        borderColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        label: {
            display: !isVerySmallScreen, // Hide on very small screens to reduce clutter
            content: `P${index}`, // Shorter label
            position: 'start',
            font: {
                size: isSmallScreen ? 8 : 9, // Slightly smaller font
                weight: 'normal',
            },
            color: '#4A4A4A',
            backgroundColor: 'rgba(255, 255, 255, 0)',
            padding: { x: 1, y: -4}, // Adjusted padding
            yAdjust: -8, // Adjusted yAdjust
            xAdjust: (phase.x[0] === 0) ? 0 : (isSmallScreen ? 1 : 2), 
        }
    }));

    const roadmapConfig = {
        type: 'bar',
        data: {
            labels: newPhaseLabels,
            datasets: [
                {
                    label: 'Phases',
                    data: chartSegmentsData,
                    backgroundColor: function(context) {
                        const dataPoint = context.raw;
                        const colorKey = getPhaseColorKey(dataPoint.y);
                        return dataPoint.isRolloff ? hexToRgba(phaseColors[colorKey], 0.25) : hexToRgba(phaseColors[colorKey], 0.75);
                    },
                    borderColor: function(context) {
                        const dataPoint = context.raw;
                        const colorKey = getPhaseColorKey(dataPoint.y);
                        return dataPoint.isRolloff ? hexToRgba(phaseColors[colorKey], 0.4) : phaseColors[colorKey];
                    },
                    borderWidth: 1,
                    barPercentage: isSmallScreen ? 0.6 : 0.7, // Thinner bars on small screens
                    categoryPercentage: isSmallScreen ? 0.7 : 0.8 
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: isSmallScreen ? 15 : 30, // Less top padding on small screens
                    right: isSmallScreen ? 5 : 10,
                    left: isSmallScreen ? 5 : 10
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Timeline (Illustrative Months)',
                        font: {
                            size: isSmallScreen ? 10 : 12
                        }
                    },
                    min: 0,
                    max: 24,
                    ticks: {
                        stepSize: isSmallScreen ? 2 : 1, // Larger step on small screens
                        font: {
                            size: isSmallScreen ? 9 : 10
                        },
                        maxRotation: 0, // Prevent rotation to save space
                        minRotation: 0
                    },
                    stacked: false
                },
                y: {
                    stacked: false,
                    ticks: {
                        autoSkip: false,
                        font: {
                           size: isSmallScreen ? 9 : 11 
                        },
                        callback: function(value, index, values) {
                            const label = this.chart.data.labels[value];
                            const wrapLength = isSmallScreen ? (isVerySmallScreen ? 12 : 18) : 25; // Shorter wrap length for smaller screens
                            if (typeof label === 'string' && label.length > wrapLength) {
                                const parts = [];
                                let currentLine = '';
                                label.split(' ').forEach(word => {
                                    if ((currentLine + word).length > wrapLength) {
                                        parts.push(currentLine.trim());
                                        currentLine = word + ' ';
                                    } else {
                                        currentLine += word + ' ';
                                    }
                                });
                                parts.push(currentLine.trim());
                                return parts.filter(part => part.length > 0);
                            }
                            return label;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false // Custom popup is used
                },
                annotation: {
                    clip: false,
                    drawTime: 'afterDatasetsDraw',
                    annotations: phaseStartMarkers
                }
            },
            onHover: (event, chartElements, chart) => {
                if (!infoPopup) return;
                const canvas = chart.canvas;
                if (chartElements.length > 0) {
                    canvas.style.cursor = 'pointer';
                    if (chartElements[0].datasetIndex === 0 && chart.data.datasets[0].data[chartElements[0].index]) {
                        const elementIndex = chartElements[0].index;
                        const dataPoint = chart.data.datasets[0].data[elementIndex];
                        if (popupPhaseName) popupPhaseName.textContent = dataPoint.y;
                        const duration = dataPoint.x[1] - dataPoint.x[0];
                        if (popupDuration) popupDuration.textContent = `${duration} month${duration === 1 ? '' : 's'}`;
                        if (popupTimeframe) popupTimeframe.textContent = `(Months ${dataPoint.x[0]} - ${dataPoint.x[1]})`;
                        if (popupActivitiesList) {
                            popupActivitiesList.innerHTML = '';
                            if (dataPoint.activities) {
                                const activitiesArray = dataPoint.activities.split(', ');
                                activitiesArray.forEach(activity => {
                                    const li = document.createElement('li');
                                    li.textContent = activity.trim();
                                    popupActivitiesList.appendChild(li);
                                });
                            } else if (dataPoint.isRolloff) {
                                 const li = document.createElement('li');
                                 li.textContent = "General ongoing support and transition activities.";
                                 popupActivitiesList.appendChild(li);
                            }
                        }
                        infoPopup.classList.add('visible');
                    }
                } else {
                    canvas.style.cursor = 'default';
                    if (infoPopup.classList.contains('visible')) {
                         infoPopup.classList.remove('visible');
                    }
                }
            },
            events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
        }
    };

    if (window.myRoadmapChart instanceof Chart) {
        window.myRoadmapChart.destroy();
    }
    window.myRoadmapChart = new Chart(roadmapChartCtx, roadmapConfig);

    if (roadmapChartCtx.canvas) {
        roadmapChartCtx.canvas.addEventListener('mouseout', (event) => {
            if (!infoPopup) return;
            const canvasRect = roadmapChartCtx.canvas.getBoundingClientRect();
            if (event.clientX < canvasRect.left || event.clientX > canvasRect.right ||
                event.clientY < canvasRect.top || event.clientY > canvasRect.bottom) {
                if (infoPopup.classList.contains('visible')) {
                     infoPopup.classList.remove('visible');
                }
            }
        });
    }
}