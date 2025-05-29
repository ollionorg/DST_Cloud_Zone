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
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${window.GEMINI_API_KEY}`;
                
                const response = await fetch(apiUrl, {
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
});

// Roadmap chart initialization
function initializeRoadmapChart() {
    const roadmapChartCtx = document.getElementById('roadmapChart');
    if (!roadmapChartCtx) return;

    const roadmapData = {
        labels: [
            'Phase 0: Initiation & UNN LZ', 
            'Phase 1: UC1 - IaaS & Pilot Migration', 
            'Phase 2: UC2 - Scalable Data Storage', 
            'Phase 3: UC3 - App Modernization', 
            'Phase 4: UC4 - Comprehensive DR',
            'Phase 5: Optimization (Ongoing)'
        ],
        datasets: [{
            label: 'Estimated Duration (Illustrative Months)',
            data: [
                { x: [0, 2], y: 'Phase 0: Initiation & UNN LZ', activities: 'Project kick-off, UNN LZ Design & Build, Initial Assessments' },
                { x: [2, 5], y: 'Phase 1: UC1 - IaaS & Pilot Migration', activities: 'Pilot migration to UNN, First CSP PLZ Build, Pilot to CSP' },
                { x: [5, 9], y: 'Phase 2: UC2 - Scalable Data Storage', activities: 'Data landscape assessment, CSP Data Storage Implementation' },
                { x: [9, 15], y: 'Phase 3: UC3 - App Modernization', activities: 'App portfolio assessment, Wave migrations, Modernization efforts' },
                { x: [15, 18], y: 'Phase 4: UC4 - Comprehensive DR', activities: 'BIA, RTO/RPO, DRaaS implementation & testing' },
                { x: [18, 24], y: 'Phase 5: Optimization (Ongoing)', activities: 'Continuous monitoring, cost/security/performance optimization' }
            ],
            backgroundColor: [
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(201, 203, 207, 0.7)'
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(201, 203, 207, 1)'
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
                    stacked: true,
                    ticks: {
                        autoSkip: false,
                        callback: function(value, index, values) {
                            const label = this.getLabelForValue(value);
                            if (label.length > 30) {
                                return label.match(/.{1,30}/g);
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
                            const datasetLabel = context.dataset.label || '';
                            const phase = context.raw.y;
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