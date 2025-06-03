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

        carousel.setAttribute('tabindex', '0');

        indicatorsContainer.innerHTML = '';
        slides.forEach((_, idx) => {
          const dot = document.createElement('button');
          dot.classList.add(
            'carousel-indicator',
            'px-3', 'py-1', 'text-sm', 'font-medium',
            'rounded-full', 'hover:bg-gray-600', 'focus:outline-none', 'transition-colors'
          );
          dot.setAttribute('data-slide-to', idx);
          dot.setAttribute('aria-label', `View use case ${idx + 1}`);
          dot.textContent = idx + 1;
          if (idx === 0) {
            dot.classList.add('bg-gray-800', 'text-white');
          } else {
            dot.classList.add('bg-gray-400', 'text-black');
          }
          indicatorsContainer.appendChild(dot);
        });
        const indicators = Array.from(indicatorsContainer.children);

        function updateCarousel() {
          if (slidesContainer) {
            slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
          }
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

        function showSlide(i) {
          currentIndex = (i + totalSlides) % totalSlides;
          updateCarousel();
        }

        nextButton.addEventListener('click', () => showSlide(currentIndex + 1));
        prevButton.addEventListener('click', () => showSlide(currentIndex - 1));
        indicators.forEach(dot =>
          dot.addEventListener('click', e => showSlide(+e.currentTarget.dataset.slideTo))
        );

        let autoplay = setInterval(() => showSlide(currentIndex + 1), 5000);
        carousel.addEventListener('mouseenter', () => clearInterval(autoplay));
        carousel.addEventListener('mouseleave', () =>
          autoplay = setInterval(() => showSlide(currentIndex + 1), 5000)
        );

        carousel.addEventListener('keydown', e => {
          if (e.key === 'ArrowRight') showSlide(currentIndex + 1);
          if (e.key === 'ArrowLeft') showSlide(currentIndex - 1);
        });

        let startX = 0;
        carousel.addEventListener('touchstart', e => startX = e.changedTouches[0].screenX);
        carousel.addEventListener('touchend', e => {
          const endX = e.changedTouches[0].screenX;
          if (endX - startX > 50) showSlide(currentIndex - 1);
          if (startX - endX > 50) showSlide(currentIndex + 1);
        });
        
        function setFixedCarouselHeight() {
          const currentSlides = document.querySelectorAll('#useCasesCarousel .carousel-slide');
          let maxHeight = 0;
          
          currentSlides.forEach((slide, i) => {
            const originalDisplay = slide.style.display;
            slide.style.display = 'block'; 
            slide.style.position = 'absolute'; 
            slide.style.visibility = 'hidden';

            const height = slide.scrollHeight;
            if (height > maxHeight) {
              maxHeight = height;
            }
            slide.style.display = originalDisplay;
            slide.style.position = '';
            slide.style.visibility = '';
          });
          
          const finalHeight = Math.max(maxHeight + 160, 550); 
          document.querySelector('#useCasesCarousel').style.height = finalHeight + 'px';
          console.log('Set carousel height to', finalHeight);
        }

        window.addEventListener('load', function() {
          updateCarousel();
          setFixedCarouselHeight();
          window.addEventListener('resize', setFixedCarouselHeight);
        });
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

    const infoPopup = document.getElementById('roadmapInfoPopup');
    const popupPhaseName = document.getElementById('popupPhaseName')?.querySelector('span');
    const popupDuration = document.getElementById('popupDuration')?.querySelector('span');
    const popupTimeframe = document.getElementById('popupTimeframe')?.querySelector('span');
    const popupActivitiesList = document.getElementById('popupActivities');

    // Helper functions (hexToRgba, getPhaseColorKey) and data (phaseColors, allPhasesData, newPhaseLabels, chartSegmentsData)
    // should be the same as in your working version that produced the image with "PX" labels.
    // Ensure these are correctly defined above this point in your actual script.

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
    // MODIFICATION START: Define annotations for phase start markers
    const phaseStartMarkers = allPhasesData.map((phase, index) => ({
        type: 'line',
        scaleID: 'x',
        value: phase.x[0],
        borderColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        label: {
            display: true,
            content: `Phase ${index + 1}`, // CHANGED: Full phase text
            position: 'start',
            font: {
                size: 10, // Adjusted for potentially wider text, can be fine-tuned
                weight: 'normal', // CHANGED: For a cleaner look (can be 'bold' if preferred)
                // family: 'Arial, sans-serif' // Optional: Specify a professional font family
            },
            color: '#4A4A4A', // CHANGED: Dark grey text for professionalism
            backgroundColor: 'rgba(255, 255, 255, 0)', // CHANGED: Transparent background
                                                     // Alternative for subtle background: 'rgba(240, 240, 240, 0.75)' (light grey, semi-transparent)
            padding: { x: 3, y: 2 }, // Minimal padding, adjust if using a background
            yAdjust: -10,  // Keep similar yAdjust, fine-tune if needed for new text height
            xAdjust: (phase.x[0] === 0) ? 25 : 0, // CHANGED: Increased xAdjust for "Phase 1" to avoid overlap with y-axis
        }
    }));
    // MODIFICATION END

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
                    top: 40 // Keep sufficient top padding for labels
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
                    clip: false, // KEEP THIS: It helped labels appear
                    drawTime: 'afterDatasetsDraw',
                    annotations: phaseStartMarkers
                }
            },
            onHover: (event, chartElements, chart) => {
                // ... (Your existing onHover logic for the info popup) ...
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
            // ... (Your existing mouseout logic for the info popup) ...
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