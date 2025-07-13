# AR Mobile Application - Design System

## Overview

This design system provides a comprehensive foundation for building modern, accessible, and visually appealing user interfaces for the Augmented Reality Mobile Application platform. It follows modern design principles with a focus on AR/tech aesthetics, glassmorphism, and responsive design.

## Brand Identity

### Color Palette

#### Primary Colors
- **Brand Primary**: `#0066ff` - Modern tech blue representing innovation and trust
- **Brand Secondary**: `#8b5cf6` - Purple gradient for premium feel and creativity
- **Brand Accent**: `#00d4aa` - Teal accent for AR/tech highlighting and CTAs

#### Semantic Colors
- **Success**: `#10b981` - Green for positive actions and confirmations
- **Warning**: `#f59e0b` - Amber for warnings and important notices
- **Error**: `#ef4444` - Red for errors and destructive actions
- **Info**: `#3b82f6` - Blue for informational content

#### Neutral Colors
- **Gray Scale**: From `#ffffff` (white) to `#0a0a0a` (near black)
- **Usage**: Text, borders, backgrounds, and UI elements

### Typography

#### Font Families
- **Primary**: Poppins - Used for headings, buttons, and brand elements
- **Secondary**: Inter - Used for body text, forms, and UI components
- **Monospace**: SF Mono/Monaco - Used for code and technical content

#### Font Weights
- Light (300), Normal (400), Medium (500), Semibold (600), Bold (700), Extra Bold (800)

#### Font Sizes (Fluid Typography)
- **XS**: `clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)`
- **SM**: `clamp(0.875rem, 0.8rem + 0.3vw, 1rem)`
- **Base**: `clamp(1rem, 0.9rem + 0.4vw, 1.125rem)`
- **LG**: `clamp(1.125rem, 1rem + 0.5vw, 1.25rem)`
- **XL**: `clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)`
- **2XL**: `clamp(1.5rem, 1.3rem + 0.8vw, 2rem)`
- **3XL**: `clamp(1.875rem, 1.6rem + 1vw, 2.5rem)`
- **4XL**: `clamp(2.25rem, 1.9rem + 1.4vw, 3.5rem)`
- **5XL**: `clamp(3rem, 2.5rem + 2vw, 4.5rem)`

### Spacing System

Consistent spacing scale based on `0.25rem` (4px) increments:
- **1**: `0.25rem` (4px)
- **2**: `0.5rem` (8px)
- **3**: `0.75rem` (12px)
- **4**: `1rem` (16px)
- **6**: `1.5rem` (24px)
- **8**: `2rem` (32px)
- **12**: `3rem` (48px)
- **16**: `4rem` (64px)
- **20**: `5rem` (80px)

### Border Radius

- **SM**: `0.375rem` (6px)
- **MD**: `0.5rem` (8px)
- **LG**: `0.75rem` (12px)
- **XL**: `1rem` (16px)
- **2XL**: `1.5rem` (24px)
- **3XL**: `2rem` (32px)
- **Full**: `9999px` (Circular)

### Shadows

- **XS**: Subtle shadow for slight elevation
- **SM**: Small shadow for cards and buttons
- **MD**: Medium shadow for modals and dropdowns
- **LG**: Large shadow for prominent elements
- **XL**: Extra large shadow for hero elements
- **2XL**: Maximum shadow for floating elements

### Gradients

- **Primary**: Linear gradient using primary brand colors
- **Secondary**: Linear gradient using secondary colors
- **Accent**: Linear gradient using accent colors
- **Rainbow**: Multi-color gradient for special elements
- **Glass**: Subtle gradient for glassmorphism effects

## Components

### Buttons

#### Variants
- **Primary**: Filled button with primary gradient
- **Secondary**: Filled button with secondary color
- **Outline**: Transparent with colored border
- **Ghost**: Transparent with hover effects

#### Sizes
- **SM**: Small button for compact spaces
- **MD**: Default button size
- **LG**: Large button for emphasis

#### Usage Example
```html
<button class="btn btn--primary btn--lg">
  <i class="icon-save"></i>
  Save Changes
</button>
```

### Form Elements

#### Input Fields
- Clean, modern styling with focus states
- Floating labels and placeholder text
- Error and validation states
- Password toggle functionality

#### Example
```html
<div class="form-field">
  <label class="label">Email Address</label>
  <input type="email" class="input" placeholder="Enter your email">
</div>
```

### Cards

#### Variants
- **Default**: Standard card with subtle shadow
- **Glass**: Glassmorphism effect with backdrop blur
- **Elevated**: Enhanced shadow for prominence

#### Usage
```html
<div class="card card--glass">
  <h3>Card Title</h3>
  <p>Card content goes here...</p>
</div>
```

### Badges

Small labels for status, categories, or counts:
- **Primary**: Blue badge for general use
- **Secondary**: Purple badge for secondary info
- **Success**: Green badge for positive status
- **Warning**: Amber badge for warnings
- **Error**: Red badge for errors

### Alerts

Contextual messages for user feedback:
- **Info**: General information
- **Success**: Successful operations
- **Warning**: Important warnings
- **Error**: Error messages

## Utility Classes

### Layout
- `flex`, `flex-col`, `flex-row`
- `items-center`, `items-start`, `items-end`
- `justify-center`, `justify-between`, `justify-start`
- `grid`, `block`, `inline-block`, `hidden`

### Spacing
- Margin: `m-0`, `m-1`, `m-2`, `m-4`, `m-6`, `m-8`, `m-auto`
- Padding: `p-0`, `p-1`, `p-2`, `p-4`, `p-6`, `p-8`
- Directional: `mt-4`, `mb-6`, `ml-2`, `mr-3`, `pt-4`, `pb-6`

### Typography
- Size: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`
- Weight: `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- Color: `text-primary`, `text-secondary`, `text-muted`, `text-brand`
- Alignment: `text-left`, `text-center`, `text-right`

### Background
- Colors: `bg-white`, `bg-gray-50`, `bg-primary`, `bg-secondary`
- Gradients: `bg-gradient-primary`, `bg-gradient-rainbow`

### Borders
- Width: `border`, `border-0`, `border-2`
- Color: `border-primary`, `border-gray`
- Radius: `rounded`, `rounded-sm`, `rounded-lg`, `rounded-full`

### Shadows
- `shadow-none`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`

### Effects
- `hover-lift`: Subtle lift on hover
- `hover-glow`: Glow effect on hover
- `hover-scale`: Scale effect on hover
- `glass`: Glassmorphism effect
- `skeleton`: Loading shimmer effect

## Responsive Design

Mobile-first approach with breakpoints:
- **SM**: `640px` and up
- **MD**: `768px` and up
- **LG**: `1024px` and up
- **XL**: `1280px` and up

### Responsive Utilities
Classes can be prefixed with breakpoint names:
- `sm:hidden`, `md:block`, `lg:flex`
- `sm:text-center`, `md:text-left`

## Accessibility

### Focus Management
- Visible focus indicators for keyboard navigation
- Proper focus order and tab accessibility
- ARIA labels and descriptions where needed

### Color Contrast
- All text meets WCAG AA contrast requirements
- Color is not the only way to convey information

### Motion Preferences
- Respects `prefers-reduced-motion` setting
- Animations can be disabled system-wide

## Dark Mode Support

Automatic dark mode support based on system preferences:
- Inverted color scheme for better dark viewing
- Maintains contrast ratios and accessibility
- Smooth transitions between modes

## AR/Tech Specific Features

### Glassmorphism
- Backdrop blur effects for modern UI
- Semi-transparent backgrounds
- Subtle borders and highlights

### Glowing Effects
- AR-style glow animations
- Hover states with colored glows
- Pulsing animations for emphasis

### Floating Elements
- Animated background shapes
- Subtle movement and rotation
- Layered depth effects

## Implementation

### CSS Custom Properties
All design tokens are implemented as CSS custom properties (variables) for easy theming and maintenance.

### SCSS Architecture
- Global styles and resets
- Design system tokens
- Component styles
- Utility classes
- Responsive mixins

### Usage in Components
```scss
.my-component {
  padding: var(--spacing-4);
  background: var(--gradient-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);

  &:hover {
    box-shadow: var(--ar-glow-primary);
  }
}
```

## Best Practices

1. **Consistency**: Use design tokens instead of hardcoded values
2. **Accessibility**: Always include focus states and ARIA labels
3. **Performance**: Use transform properties for animations
4. **Scalability**: Leverage utility classes for rapid development
5. **Maintenance**: Keep component styles modular and reusable

## Future Enhancements

- Custom icon font integration
- Advanced animation library
- Component documentation with Storybook
- Design tokens JSON export for design tools
- Additional component variants and patterns
