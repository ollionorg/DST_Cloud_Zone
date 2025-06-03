// Navigation and section management
document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mainNav = document.getElementById('mainNav');

    const messageModal = document.getElementById('messageModal');
    const modalMessageText = document.getElementById('modalMessageText');
    const modalCloseButton = document.getElementById('modalCloseButton');

    function showModal(message) {
        modalMessageText.textContent = message;
        messageModal.style.display = 'flex';
    }

    modalCloseButton.addEventListener('click', () => {
        messageModal.style.display = 'none';
    });

    // Mobile menu toggle
    mobileMenuButton?.addEventListener('click', () => {
        mainNav.classList.toggle('hidden');
        mainNav.classList.toggle('flex');
    });

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
        
        // First, hide all sections
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Then, show the current section
        const currentSection = document.getElementById(currentSectionId);
        if (currentSection) {
            currentSection.classList.add('active');
        }

        // Update navigation links
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

            if (mainNav.classList.contains('flex') && !mainNav.classList.contains('md:flex')) {
                mainNav.classList.add('hidden');
                mainNav.classList.remove('flex');
            }
        });
    });
    
    // Accordion functionality
    const accordionToggles = document.querySelectorAll('.accordion-toggle');
    accordionToggles.forEach(toggle => {
        toggle.addEventListener('click', function () {
            const content = this.nextElementSibling;
            const icon = this.querySelector('.text-xl');
            
            // Close other open accordions within the same parent group
            const parentGroup = this.closest('.space-y-4');
            if (parentGroup) {
                parentGroup.querySelectorAll('.accordion-content').forEach(item => {
                    if (item !== content && item.style.maxHeight) {
                        item.style.maxHeight = null;
                        const itemIcon = item.previousElementSibling.querySelector('.text-xl');
                        if (itemIcon) itemIcon.classList.remove('rotate-180');
                        item.previousElementSibling.classList.remove('ui-open');
                    }
                });
            }

            if (content.style.maxHeight) {
                content.style.maxHeight = null;
                if (icon) icon.classList.remove('rotate-180');
                this.classList.remove('ui-open');
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
                if (icon) icon.classList.add('rotate-180');
                this.classList.add('ui-open');
            }
        });
    });

    // Initialize roadmap chart
    initializeRoadmapChart(); 

    // Set up event listeners
    window.addEventListener('hashchange', updateActiveSection);
    updateActiveSection(); // Initial call

    const geminiButtons = document.querySelectorAll('.gemini-trigger-btn');
    geminiButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const accordionContent = this.closest('.accordion-content');
            const considerationTitleElement = accordionContent.parentElement.querySelector('.consideration-title');
            const considerationTextElement = accordionContent.querySelector('.consideration-text');
            const resultContainer = accordionContent.querySelector('.gemini-result-container');

            if (!considerationTitleElement || !considerationTextElement || !resultContainer) {
                showModal('Error: Could not find necessary elements for Gemini API call.');
                return;
            }
            
            const considerationTitle = considerationTitleElement.textContent.trim();
            const considerationDescription = considerationTextElement.textContent.trim();

            resultContainer.style.display = 'block';
            resultContainer.innerHTML = '<div class="flex items-center"><div class="loading-spinner"></div><span>Analyzing... Please wait.</span></div>';
            
            if (!accordionContent.style.maxHeight || accordionContent.style.maxHeight === "0px") {
                accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
                 const icon = accordionContent.previousElementSibling.querySelector('.text-xl');
                 if(icon) icon.classList.add('rotate-180');
                 accordionContent.previousElementSibling.classList.add('ui-open');
            }

            const prompt = `For a major multi-cloud transformation project (transitioning from on-premise UNN to white-labeled AWS, Azure, GCP), analyze the following key consideration:
            Title: "${considerationTitle}"
            Description: "${considerationDescription}"
            
            Please provide:
            1. Potential risks associated with this consideration.
            2. Suggested mitigation strategies for each risk.
            Format the response clearly, perhaps using bullet points for risks and sub-bullets for mitigations.`;

            try {
                let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
                const payload = { contents: chatHistory };
                const response = await fetch('/api/generateInsights', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Gemini API Error:', errorData);
                    throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
                }

                const result = await response.json();

                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    const text = result.candidates[0].content.parts[0].text;
                    resultContainer.innerHTML = `<div class="gemini-result">${text.replace(/\n/g, '<br>')}</div>`;
                } else {
                    resultContainer.innerHTML = `<div class="gemini-result text-red-600">No content received from Gemini. Response: ${JSON.stringify(result)}</div>`;
                    console.error('Unexpected Gemini API response structure:', result);
                }
            } catch (error) {
                console.error('Error calling Gemini API:', error);
                resultContainer.innerHTML = `<div class="gemini-result text-red-600">Error: Could not fetch insights. ${error.message}</div>`;
            } finally {
                 if (accordionContent.style.maxHeight && accordionContent.style.maxHeight !== "0px") {
                    accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
                }
            }
        });
    });

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

        // If there are no slides, abort carousel setup.
        if (totalSlides === 0) {
            console.warn("No slides found for use cases carousel. Aborting carousel setup.");
            if (carousel) carousel.style.display = 'none'; // Optionally hide the entire carousel section
            return;
        }

        carousel.setAttribute('tabindex', '0');

        // Generate indicators
        if (indicatorsContainer) {
            indicatorsContainer.innerHTML = ''; // Clear existing (if any)
            slides.forEach((_, idx) => {
                const dot = document.createElement('button');
                dot.classList.add(
                    'carousel-indicator', 'px-3', 'py-1', 'text-sm', 'font-medium',
                    'rounded-full', 'hover:bg-gray-600', 'focus:outline-none', 'transition-colors'
                );
                dot.setAttribute('data-slide-to', idx);
                dot.setAttribute('aria-label', `View use case ${idx + 1}`);
                dot.textContent = idx + 1;
                if (idx === currentIndex) { // Initially currentIndex is 0
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
            stopAutoplay(); // Clear any existing interval
            if (totalSlides > 1) { // Only autoplay if there's more than one slide
                autoplayIntervalId = setInterval(() => showSlide(currentIndex + 1), 5000);
            }
        }
        function stopAutoplay() {
            clearInterval(autoplayIntervalId);
        }

        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);

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
              if (endX - startX > 50) showSlide(currentIndex - 1); // Swipe right
              if (startX - endX > 50) showSlide(currentIndex + 1); // Swipe left
            }
        });

        function setFixedCarouselHeight() {
            const currentSlidesForHeight = document.querySelectorAll('#useCasesCarousel .carousel-slide');
            let maxHeight = 0;

            if (currentSlidesForHeight.length === 0) {
                if (carousel) carousel.style.height = 'auto'; // Fallback if somehow slides disappear
                return;
            }

            currentSlidesForHeight.forEach(slide => {
                const originalDisplay = slide.style.display;
                const originalPosition = slide.style.position;
                const originalVisibility = slide.style.visibility;

                slide.style.position = 'absolute';
                slide.style.visibility = 'hidden';
                slide.style.display = 'block'; // Ensure it's block for scrollHeight measurement

                const height = slide.scrollHeight;
                if (height > maxHeight) {
                    maxHeight = height;
                }

                slide.style.display = originalDisplay;
                slide.style.position = originalPosition;
                slide.style.visibility = originalVisibility;
            });

            const PADDING_AND_CONTROLS_HEIGHT = 160; // From your original script, represents estimated extra vertical space
            const MIN_CAROUSEL_HEIGHT = 550;       // From your original script

            const finalHeight = Math.max(maxHeight + PADDING_AND_CONTROLS_HEIGHT, MIN_CAROUSEL_HEIGHT);
            if (carousel) {
                carousel.style.height = finalHeight + 'px';
            }
            // console.log('Set carousel height to', finalHeight); // Keep for debugging if needed
        }

        // Initial setup on window load to ensure images and other content are loaded
        window.addEventListener('load', function() {
            if (totalSlides > 0) { // Ensure this runs only if slides exist
                setFixedCarouselHeight(); // Calculate and set height first
                updateCarousel();       // Position the first slide correctly
                startAutoplay();        // Then start autoplay
            }
            // Re-calculate height on resize
            window.addEventListener('resize', setFixedCarouselHeight);
        });

        // If there's only one slide, ensure controls that don't make sense are hidden/disabled
        if (totalSlides <= 1) {
            if (prevButton) prevButton.style.display = 'none';
            if (nextButton) nextButton.style.display = 'none';
            if (indicatorsContainer) indicatorsContainer.style.display = 'none';
            // Stop autoplay (already handled by startAutoplay condition, but good to be explicit)
            stopAutoplay();
             // Adjust styling of the indicators wrapper if only "Use Case" text remains
            const indicatorsWrapper = document.getElementById('carouselIndicatorsWrapper');
            if(indicatorsWrapper && indicatorsContainer && indicatorsContainer.children.length === 0) {
                 // Example: you might want to hide the "Use Case" label too or adjust its padding
                 // indicatorsWrapper.querySelector('span.text-lg.font-bold').style.display = 'none';
            }
        }
    }

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
    }
    
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
});

// Roadmap chart initialization
function initializeRoadmapChart() {
    const roadmapChartCtx = document.getElementById('roadmapChart')?.getContext('2d');
    if (!roadmapChartCtx) {
        console.warn("Roadmap chart canvas context not found.");
        return;
    }

    // Ensure all helper functions (hexToRgba, getPhaseColorKey) and
    // data definitions (phaseColors, allPhasesData, etc.) are present
    // from your previous working version.
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

    const phaseStartMarkers = allPhasesData.map((phase, index) => ({
        type: 'line',
        scaleID: 'x',
        value: phase.x[0],
        borderColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        label: {
            display: true,
            content: `Phase ${index}`,
            position: 'start',
            font: {
                size: 10,
                weight: 'normal',
            },
            color: '#4A4A4A',
            backgroundColor: 'rgba(255, 255, 255, 0)',
            padding: { x: 2, y: -5},
            yAdjust: -10,
            // MODIFIED xAdjust: Reduced the rightward shift for "Phase 1"
            xAdjust: (phase.x[0] === 0) ? 0 : 3, // "Phase 1" shifted by 8px; others by 3px.
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
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Timeline (Illustrative Months)'
                    },
                    min: 0,
                    max: 24,
                    ticks: {
                        stepSize: 1
                    },
                    stacked: false
                },
                y: {
                    stacked: false,
                    ticks: {
                        autoSkip: false,
                        callback: function(value, index, values) {
                            const label = this.chart.data.labels[value];
                            if (typeof label === 'string' && label.length > 25) {
                                const parts = [];
                                let currentLine = '';
                                label.split(' ').forEach(word => {
                                    if ((currentLine + word).length > 25) {
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
                    enabled: false
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