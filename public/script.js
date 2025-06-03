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
            
            // Ensure the accordion expands if it was closed by another opening
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
                // Re-adjust max-height in case content made it taller
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
        const slidesContainer = carousel.querySelector('.carousel-slides'); // Get the slides container

        let currentIndex = 0;
        const totalSlides = slides.length;

        // ARIA labels already set in HTML; ensure focusable container
        carousel.setAttribute('tabindex', '0');

        // remove any existing dots
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

        // Function to update slides visibility and indicator styles.
        function updateCarousel() {
          // SLIDING LOGIC:
          // Move the .carousel-slides container by a percentage
          if (slidesContainer) {
            slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
          }

          // Update indicator styles (this part remains the same)
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

        // Autoplay with pause on hover
        let autoplay = setInterval(() => showSlide(currentIndex + 1), 5000);
        carousel.addEventListener('mouseenter', () => clearInterval(autoplay));
        carousel.addEventListener('mouseleave', () =>
          autoplay = setInterval(() => showSlide(currentIndex + 1), 5000)
        );

        // Keyboard navigation
        carousel.addEventListener('keydown', e => {
          if (e.key === 'ArrowRight') showSlide(currentIndex + 1);
          if (e.key === 'ArrowLeft') showSlide(currentIndex - 1);
        });

        // Touch/swipe support
        let startX = 0;
        carousel.addEventListener('touchstart', e => startX = e.changedTouches[0].screenX);
        carousel.addEventListener('touchend', e => {
          const endX = e.changedTouches[0].screenX;
          if (endX - startX > 50) showSlide(currentIndex - 1);
          if (startX - endX > 50) showSlide(currentIndex + 1);
        });

        // Compute and set fixed carousel height based on the tallest slide
        function setFixedCarouselHeight() {
          // Wait until images and other resources are loaded
          const slides = document.querySelectorAll('#useCasesCarousel .carousel-slide');
          let maxHeight = 0;
          
          // First, make sure one slide is active so we have accurate content
          slides.forEach((slide, i) => {
            if (i === 0) slide.classList.add('active');
            else slide.classList.remove('active');
          });
          
          // Force a repaint to ensure dimensions are calculated
          document.body.offsetHeight;
          
          // Now measure each slide
          slides.forEach(slide => {
            // Clone the slide to measure it without affecting the display
            const clone = slide.cloneNode(true);
            clone.style.position = 'absolute';
            clone.style.visibility = 'hidden';
            clone.style.display = 'block';
            clone.style.opacity = '1';
            document.body.appendChild(clone);
            
            const height = clone.scrollHeight;
            if (height > maxHeight) {
              maxHeight = height;
            }
            
            document.body.removeChild(clone);
          });
          
        // Add buffer to ensure no content is cut off and to make it look bigger
          const finalHeight = Math.max(maxHeight + 160, 550); // Increased buffer and min height
          document.querySelector('#useCasesCarousel').style.height = finalHeight + 'px';
          console.log('Set carousel height to', finalHeight);
        }

        // Set up carousel after page is fully loaded
        window.addEventListener('load', function() {
          // First initialize active slide
          updateCarousel();
          
          // Then calculate height based on content
          setFixedCarouselHeight();
          
          // Recalculate on window resize
          window.addEventListener('resize', setFixedCarouselHeight);
        });
    }

    const tabItems = document.querySelectorAll('#keyConsiderationsMenu .tab-item');
    const tabContents = document.querySelectorAll('#keyConsiderationsContent .tab-content');
    
    // Optional: Activate the first tab by default
    if(tabItems.length) {
      tabItems[0].classList.add('bg-gray-200');
    }
    
    tabItems.forEach(item => {
      item.addEventListener('click', function(){
        // Remove active styling from all tabs
        tabItems.forEach(i => i.classList.remove('bg-gray-200'));
        // Hide all tab content
        tabContents.forEach(content => content.classList.add('hidden'));
        // Activate the clicked tab
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
    const roadmapChartCtx = document.getElementById('roadmapChart');
    if (!roadmapChartCtx) return;

    // Helper function to convert HEX to RGBA
    function hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    const newPhaseLabels = [
        'Mobilize',
        'Infrastructure as a service',
        'Migration',
        'Data Storage',
        'Disaster recovery as a service',
        'Optimization'
    ];

    const phaseColors = {
        mobilize: ' #3B4430',    // Ollion color
        iaas: '#D93434',        // Red (from image description for IaaS)
        migration: '#CC7722',   // Ochre (from image description for Migration)
        dataStorage: '#008080', // Teal (from image description for Data Storage)
        draas: '#243A73',       // Dark Blue (from image description for DRaaS)
        optimization: '#2F3A4C' // Ollion color
    };

    const roadmapData = {
        labels: newPhaseLabels,
        datasets: [{
            label: 'Estimated Duration (Illustrative Months)',
            data: [
                { x: [0, 2], y: 'Mobilize', activities: 'Project kick-off, UNN LZ Design & Build, Initial Assessments' },
                { x: [2, 24], y: 'Infrastructure As a Service', activities: 'Foundational IaaS services, Pilot migration to UNN, First CSP PLZ Build, Pilot to CSP, Ongoing infrastructure support' }, // Extends until Optimization
                { x: [5, 24], y: 'Migration', activities: 'App portfolio assessment, Wave migrations, Modernization efforts, Ongoing migration support' }, // Extends until Optimization
                { x: [5, 24], y: 'Data Storage', activities: 'Data landscape assessment, CSP Data Storage Implementation, Ongoing data management' }, // Extends until Optimization
                { x: [10, 24], y: 'Disaster Recovery As a Service', activities: 'BIA, RTO/RPO, DRaaS implementation & testing, Continuous DR readiness' }, // Ends when Optimization starts
                { x: [15, 24], y: 'Optimization', activities: 'Continuous monitoring, cost/security/performance optimization' }
            ],
            backgroundColor: [
                hexToRgba(phaseColors.mobilize, 0.7),
                hexToRgba(phaseColors.iaas, 0.7),
                hexToRgba(phaseColors.migration, 0.7),
                hexToRgba(phaseColors.dataStorage, 0.7),
                hexToRgba(phaseColors.draas, 0.7),
                hexToRgba(phaseColors.optimization, 0.7)
            ],
            borderColor: [
                phaseColors.mobilize,
                phaseColors.iaas,
                phaseColors.migration,
                phaseColors.dataStorage,
                phaseColors.draas,
                phaseColors.optimization
            ],
            borderWidth: 1,
            barPercentage: 0.6,
            categoryPercentage: 0.8
        }]
    };

    const roadmapConfig = {
        type: 'bar',
        data: roadmapData,
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Timeline (Illustrative Months)'
                    },
                    min: 0,
                    max: 24
                },
                y: {
                    // stacked: true, // Not needed for this Gantt-like display with distinct y-categories
                    ticks: {
                        autoSkip: false,
                        callback: function(value, index, values) {
                            // 'this' refers to the scale object
                            const label = this.getLabelForValue(value); 
                            if (typeof label === 'string' && label.length > 30) {
                                return label.match(/.{1,30}/g); // Split long labels
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
                    callbacks: {
                        label: function(context) {
                            const duration = context.raw.x[1] - context.raw.x[0];
                            const activities = context.raw.activities;
                            return `${phase}: ${duration} months. Key Activities: ${activities}`;
                        }
                    }
                }
            }
        }
    };
    
    new Chart(roadmapChartCtx, roadmapConfig);
}