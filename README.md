# DST Multi-Cloud Transformation Plan

An interactive web application that outlines Ollion's comprehensive deployment strategy for DST's multi-cloud transformation. This application provides a detailed roadmap for implementing IaaS, Migration Services, Data Storage, and DRaaS, focusing on a phased journey from DST's UNN infrastructure to white-labeled offshore CSP environments.

## 🌟 Features

- **Interactive Navigation**: Smooth section transitions and mobile-responsive navigation
- **Dynamic Content**: Expandable sections for detailed information
- **Visual Roadmap**: Interactive Gantt-like chart using Chart.js
- **AI-Powered Analysis**: Gemini API integration for risk analysis and mitigation strategies
- **Responsive Design**: Optimized for all device sizes using Tailwind CSS
- **Modern UI**: Clean, professional interface with smooth animations

## 🛠️ Technologies Used

- **Frontend Framework**: HTML5, CSS3, JavaScript (ES6+)
- **CSS Framework**: [Tailwind CSS](https://tailwindcss.com)
- **Charts**: [Chart.js](https://www.chartjs.org)
- **AI Integration**: Google Gemini API
- **Deployment**: Vercel

## 📋 Project Structure

```
dst_cloudzone/
├── public/
│   ├── index.html      # Main HTML file
│   ├── styles.css      # Custom styles
│   └── script.js       # JavaScript functionality
├── vercel.json         # Vercel deployment configuration
└── README.md          # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js and npm (for local development)

### Local Development

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd dst_cloudzone
   ```

2. Open `public/index.html` in your browser or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve public
   ```

3. Access the application at `http://localhost:8000`

## 🎯 Key Sections

1. **Overview**: Executive summary and strategic imperatives
2. **Landing Zones**: Foundational deployment strategy
3. **Use Cases**: Detailed implementation phases
4. **Roadmap**: Visual project timeline
5. **Service Delivery**: Multi-cloud integration details
6. **Governance**: Project management framework
7. **Key Considerations**: Strategic recommendations
8. **Glossary**: Technical terms and definitions

## 🔧 Configuration

### Gemini API Integration

To enable the AI-powered risk analysis:
1. Obtain a Gemini API key
2. Add the API key to the `script.js` file:
   ```javascript
   const apiKey = "your-api-key-here";
   ```

### Customization

- Colors and themes can be modified in `styles.css`
- Chart configurations can be adjusted in `script.js`
- Content can be updated in `index.html`

## 📦 Deployment

The application is configured for deployment on Vercel:

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Deploy using either:
   - Vercel Dashboard
   - Vercel CLI (`vercel` command)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is proprietary and confidential. All rights reserved by Ollion and DST.

## 👥 Authors

- **Ollion** - *Initial work*

## 🙏 Acknowledgments

- DST for collaboration
- Chart.js for visualization capabilities
- Tailwind CSS for the styling framework 