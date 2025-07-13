# Augmented Reality Application for Maintenance Knowledge Management through Interactive Visualization | Website

<div align="center">

**Jose Daniel Sarmiento, Manuel Ayala**  
{ jose2192232, jose2195529 } @correo.uis.edu.co

[![Angular](https://img.shields.io/badge/Angular-19-red?style=flat-square&logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

## 📖 Overview

This project is a comprehensive web application designed to support augmented reality (AR) applications for maintenance knowledge management. The platform combines modern web technologies with AI-powered annotation tools to create an integrated ecosystem for managing AR content, user workflows, and maintenance routines.

### 🎯 Key Features

- **🎨 YOLO Annotation Tool**: Advanced AI-powered image annotation system for creating machine learning datasets
- **👥 User Management**: Complete CRUD system for managing users and permissions
- **🔧 Routine Management**: Workflow management for maintenance procedures with AR integration
- **📊 Dashboard Analytics**: Real-time insights and statistics for system usage
- **🌙 Modern UI/UX**: Responsive design with dark/light theme support
- **♿ Accessibility**: WCAG-compliant interface with keyboard navigation and screen reader support

## 🏗️ Architecture

### Technology Stack

**Frontend Framework:**
- Angular 19 (Latest with Standalone Components)
- TypeScript 5.0+
- RxJS for reactive programming

**Styling & UI:**
- TailwindCSS 4.1 for utility-first styling
- Custom SCSS design system
- CSS Grid and Flexbox for layouts
- Custom icon system

**State Management:**
- Angular Signals (Modern reactive state)
- RxJS BehaviorSubjects for complex state
- Service-based architecture

**Build & Development:**
- Angular CLI
- Bun package manager (high-performance alternative to npm)
- Hot module replacement for development

### 📁 Project Structure

```
src/
├── app/
│   ├── core/                      # Core application services and models
│   │   ├── models/                # Data models and interfaces
│   │   │   └── annotation.model.ts
│   │   └── services/              # Core business logic services
│   │       ├── annotation-state.service.ts
│   │       └── yolo-export.service.ts
│   │
│   ├── features/                  # Feature-specific modules
│   │   └── annotation/            # YOLO annotation feature
│   │       ├── components/
│   │       │   └── canvas-annotation/
│   │       └── services/
│   │           └── canvas-interaction.service.ts
│   │
│   ├── pages/                     # Application pages/routes
│   │   ├── dashboard/             # Main dashboard
│   │   ├── labels/                # YOLO annotation interface
│   │   ├── admins/                # User management
│   │   ├── routine/               # Maintenance routines
│   │   ├── login/                 # Authentication
│   │   └── user/                  # User profile
│   │
│   ├── shared/                    # Shared components and utilities
│   │   └── components/
│   │       ├── navigation/        # App navigation
│   │       ├── toolbar/           # Dynamic toolbar
│   │       └── class-selector/    # YOLO class selector
│   │
│   ├── services/                  # Application-wide services
│   │   ├── user.service.ts        # User CRUD operations
│   │   ├── routine.service.ts     # Routine management
│   │   └── ms-auth.service.ts     # Authentication service
│   │
│   ├── models/                    # Application data models
│   │   ├── user.model.ts
│   │   └── routines.model.ts
│   │
│   └── styles/                    # Global styles and design system
│       └── design-system.scss
│
├── assets/                        # Static assets
│   └── logo.jpeg
│
└── public/                        # Public assets
    └── favicon.ico
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0+ or **Bun** 1.0+
- **Angular CLI** 19+
- Modern web browser with ES2022 support

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd augmented_reality_mobile_application_website
   ```

2. **Install dependencies:**
   ```bash
   # Using Bun (recommended for performance)
   bun install
   
   # Or using npm
   npm install
   ```

3. **Start the development server:**
   ```bash
   # Using Bun
   bun start
   
   # Or using npm
   npm start
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:4200`

### Available Scripts

```bash
# Development server with hot reload
bun start / npm start

# Build for production
bun run build / npm run build

# Run unit tests
bun test / npm test

# Build and watch for changes
bun run watch / npm run watch
```

## 🎨 Features Deep Dive

### 1. YOLO Annotation Tool (`/labels`)

Advanced computer vision annotation interface for creating machine learning datasets:

**Features:**
- **Interactive Canvas**: Draw, edit, and manage bounding boxes with mouse and keyboard
- **Class Management**: Create custom object classes with colors and keyboard shortcuts
- **Project Management**: Save/load annotation projects with export capabilities
- **Keyboard Shortcuts**: Efficient workflow with number keys (1-9) for class selection
- **Export Formats**: YOLO format export with dataset splitting (train/validation/test)
- **Undo/Redo**: Full action history with state management
- **Zoom & Pan**: Canvas navigation for detailed annotation work

**Technical Implementation:**
- Canvas-based drawing with HTML5 Canvas API
- Signal-based reactive state management
- Modular component architecture
- Accessibility-first design with screen reader support

### 2. User Management (`/admins`)

Comprehensive user administration interface:

**Features:**
- **CRUD Operations**: Create, read, update, delete users
- **Role Management**: Admin, User, Guest role assignments
- **Search & Filter**: Real-time user search and filtering
- **Pagination**: Efficient handling of large user datasets
- **Form Validation**: Robust client-side validation with error handling
- **Bulk Operations**: Select and manage multiple users

**Security:**
- Role-based access control
- Form validation and sanitization
- Audit trail for user actions

### 3. Routine Management (`/routine`)

Maintenance workflow management system:

**Features:**
- **Workflow Creation**: Define step-by-step maintenance procedures
- **File Upload**: Support for 3D models (GLB) and inference models (TFLite)
- **User Assignment**: Assign routines to specific users or groups
- **Status Tracking**: Draft, Active, Completed, Archived states
- **Priority Management**: Low, Medium, High, Urgent priority levels
- **Analytics**: Execution tracking and performance metrics

**AR Integration:**
- 3D model file support for AR visualization
- TensorFlow Lite model integration for AI-powered assistance
- Step-by-step guided procedures

### 4. Dashboard (`/dashboard`)

Central hub with system overview and navigation:

**Features:**
- **Real-time Statistics**: User counts, routine metrics, system health
- **Quick Navigation**: Direct access to all application modules
- **Visual Analytics**: Charts and graphs for system insights
- **Recent Activity**: Latest user actions and system events

## 🎨 Design System

### Color Palette

The application uses a sophisticated color system with semantic meaning:

```scss
// Primary Brand Colors
--brand-primary-50: #eff6ff;
--brand-primary-500: #3b82f6;
--brand-primary-900: #1e3a8a;

// Semantic Colors
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

// Neutral Palette
--text-primary: #1f2937;
--text-secondary: #6b7280;
--background-color: #ffffff;
--surface-secondary: #f9fafb;
```

### Typography

- **Primary Font**: System font stack for optimal performance
- **Secondary Font**: Custom font for headings and branding
- **Font Sizes**: Modular scale from 12px to 48px
- **Line Heights**: Optimized for readability across all screen sizes

### Components

- **Modular Design**: Reusable components with consistent API
- **Responsive**: Mobile-first design with breakpoint system
- **Accessible**: WCAG 2.1 AA compliance
- **Themeable**: Light/dark theme support with CSS custom properties

## 🔧 Development Guidelines

### Code Standards

- **Angular Style Guide**: Following official Angular coding conventions
- **TypeScript Strict Mode**: Full type safety with strict compiler options
- **Reactive Programming**: RxJS for asynchronous operations
- **Signal-based State**: Modern Angular Signals for reactive state management

### Component Architecture

```typescript
// Example component structure
@Component({
  selector: 'custom-component',
  standalone: true,
  imports: [CommonModule, /* other imports */],
  templateUrl: './component.html',
  styleUrl: './component.scss'
})
export class ComponentName implements OnInit {
  // Signals for reactive state
  data = signal<DataType[]>([]);
  loading = signal(false);
  
  // Computed values
  filteredData = computed(() => /* computation */);
  
  // Dependency injection
  constructor(private service: ServiceName) {}
}
```

### State Management

The application uses a hybrid approach:

1. **Angular Signals**: For local component state and computed values
2. **RxJS BehaviorSubjects**: For complex shared state
3. **Services**: For business logic and API communication

### Testing Strategy

- **Unit Tests**: Jest-based testing for components and services
- **Integration Tests**: Angular Testing Library for component integration
- **E2E Tests**: Cypress for end-to-end user workflows
- **Accessibility Tests**: Automated a11y testing with axe-core

## 📱 Browser Support

- **Chrome** 90+ ✅
- **Firefox** 88+ ✅
- **Safari** 14+ ✅
- **Edge** 90+ ✅

## 🚀 Deployment

### Production Build

```bash
# Create optimized production build
bun run build

# Files will be generated in dist/ directory
```

### Deployment Options

1. **Static Hosting**: Deploy to Netlify, Vercel, or GitHub Pages
2. **Traditional Hosting**: Apache, Nginx, or IIS
3. **Cloud Platforms**: AWS S3, Azure Storage, Google Cloud Storage

### Environment Configuration

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com',
  features: {
    enableAnalytics: true,
    enableLogging: false
  }
};
```

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Review Process

- All changes require code review
- Automated tests must pass
- Accessibility compliance verified
- Performance impact assessed

## 📊 Performance

### Optimization Features

- **Lazy Loading**: Route-based code splitting
- **OnPush Change Detection**: Optimized change detection strategy
- **Tree Shaking**: Eliminates unused code in production builds
- **Bundle Analysis**: webpack-bundle-analyzer for size optimization

### Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Total Bundle Size**: < 500KB (gzipped)
- **Lighthouse Score**: 95+ across all categories

## 🔒 Security

### Security Measures

- **Content Security Policy**: XSS protection
- **HTTPS Enforcement**: Secure data transmission
- **Input Sanitization**: Prevents injection attacks
- **Authentication**: Secure user session management

## 📈 Future Roadmap

### Phase 1: Core Platform (Current)
- ✅ YOLO annotation tool
- ✅ User management system
- ✅ Routine management
- ✅ Dashboard analytics

### Phase 2: AR Integration
- 🔄 WebXR API integration
- 🔄 3D model viewer
- 🔄 Mobile AR companion app
- 🔄 Real-time collaboration

### Phase 3: AI Enhancement
- 📅 Auto-annotation with ML models
- 📅 Intelligent routine suggestions
- 📅 Predictive maintenance analytics
- 📅 Voice control interface

### Phase 4: Enterprise Features
- 📅 Multi-tenant architecture
- 📅 Advanced reporting
- 📅 API marketplace
- 📅 Third-party integrations

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

### Documentation

- **Component Documentation**: Available in individual `.md` files
- **API Documentation**: TypeScript interfaces serve as API contracts
- **Style Guide**: Design system documentation in `DESIGN_SYSTEM.md`

### Contact

For questions, suggestions, or support:

- **Email**: jose2192232@correo.uis.edu.co, jose2195529@correo.uis.edu.co
- **University**: Universidad Industrial de Santander (UIS)
- **Project Type**: Academic Research Project

### Acknowledgments

- Angular team for the outstanding framework
- TailwindCSS for the utility-first CSS framework
- Open source community for various libraries and tools
- Universidad Industrial de Santander for supporting this research

---

<div align="center">

**Built with ❤️ for the future of AR-enabled maintenance**

[🚀 Live Demo](#) | [📖 Documentation](#) | [🐛 Report Bug](#) | [💡 Request Feature](#)

</div>
