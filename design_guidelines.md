# Smart SEO AI Agent Dashboard - Design Guidelines

## Design Approach
**Utility-Focused Dashboard Design** - This is a professional tool for digital marketing agencies requiring clean, efficient interface design with emphasis on usability and data presentation.

## Typography
- **Primary Font**: 'Inter' or 'Poppins' from Google Fonts
- **Font Weights**: Regular (400) for body text, Medium (500) for labels, Semi-Bold (600) for headings
- **Hierarchy**: 
  - Main title (header): 24-28px, Semi-Bold
  - Tab labels: 16px, Medium
  - Section headings: 18-20px, Semi-Bold
  - Input labels: 14px, Medium
  - Body text: 14-16px, Regular
  - Table headers: 14px, Semi-Bold
  - Table data: 14px, Regular

## Color Palette
- **Primary Blues**: Use shades of blue (#2563EB, #3B82F6, #60A5FA) for primary buttons, active tabs, and accent elements
- **Dark Gray Text**: #1F2937 for primary text, #4B5563 for secondary text
- **Backgrounds**: 
  - Pure white (#FFFFFF) for main content areas
  - Light gray (#F9FAFB, #F3F4F6) for alternate backgrounds and inactive states
  - Subtle gray (#E5E7EB) for borders and dividers
- **Semantic Colors**: 
  - Success/positive: Green tones (#10B981)
  - Warning: Amber tones (#F59E0B)
  - Difficulty indicators: Gradient from green (easy) to red (hard)

## Layout System
**Spacing**: Use Tailwind units of 2, 4, 6, 8, 12, and 16 for consistent rhythm (p-4, m-6, gap-8, etc.)

**Structure**:
- Clean header spanning full width with centered or left-aligned title
- Main content area with maximum width constraint (max-w-6xl centered)
- Tab navigation bar immediately below header
- Content panels with generous padding (p-8 to p-12)

**Grid Strategy**:
- Use CSS Flexbox or Grid for overall layout
- Tab container uses flex with even distribution
- Results tables: Full-width responsive tables
- Form layouts: Single column with labeled inputs stacked vertically

## Component Library

### Navigation Tabs
- Horizontal tab bar with 3 equal-width segments
- Active tab: Blue background (#3B82F6) with white text
- Inactive tabs: Light gray background with dark text
- Smooth hover transitions (200-300ms ease)
- Bottom border indicator on active tab
- Tab switching without page reload

### Input Fields & Text Areas
- Border: 1px solid light gray (#E5E7EB)
- Border radius: 6-8px for modern feel
- Padding: py-3 px-4
- Focus state: Blue border (#3B82F6) with subtle shadow
- Placeholder text in medium gray (#9CA3AF)
- Labels above inputs with 8px spacing
- Full-width inputs within their containers

### Buttons
- Primary action buttons: Blue background (#3B82F6) with white text
- Border radius: 6px
- Padding: py-3 px-6
- Font weight: Medium (500)
- Hover state: Slightly darker blue (#2563EB)
- Active state: Even darker with subtle scale (0.98)
- Transition: all 200ms ease
- Disabled state: Reduced opacity with gray background

### Tables (Keyword Results)
- Clean borders using light gray (#E5E7EB)
- Header row: Light gray background (#F9FAFB) with semi-bold text
- Alternating row backgrounds for readability
- Cell padding: py-3 px-4
- Hover row: Very subtle gray highlight (#F3F4F6)
- Text alignment: Left for keywords, center for metrics

### Content Display Areas
- Outline display: Structured hierarchy using heading tags
  - H1 representation: 20px, Semi-Bold, blue color
  - H2 representation: 18px, Medium, indented 16px
  - H3 representation: 16px, Regular, indented 32px
- SEO suggestions: Card-based layout with clear labels
- White background cards with subtle shadow
- Spacing between suggestion items: 12-16px

### Loading States
- "Loading..." text centered in results area
- Optional: Subtle spinner or progress indicator
- Gray text color during loading

### Interactive States
- All clickable elements have cursor: pointer
- Subtle hover effects on tabs (background lightens)
- Button hover effects (color darkens slightly)
- Focus states for accessibility with blue outline

## Layout Specifications

### Header
- Full-width with light background or white
- Height: 80-100px
- Title centered or left-aligned with adequate padding
- Clean, minimal design without distractions

### Main Content Area
- Maximum width: 1200-1280px (max-w-6xl)
- Centered on page with auto horizontal margins
- Vertical padding: py-8 to py-12

### Tab Content Panels
- Only one panel visible at a time (controlled by JavaScript)
- Smooth transition when switching (fade or instant)
- Each panel has consistent internal padding (p-8)
- White background with optional subtle border

### Form Layouts
- Input fields stack vertically with consistent spacing (gap-6)
- Labels positioned above inputs
- Buttons positioned below inputs with top margin (mt-6)
- Maximum width for text inputs: 100% of container
- Text area minimum height: 200px for article input

## Responsive Behavior
- Desktop-first design optimized for 1200px+ viewports
- Maintain single-column layout for form elements
- Tables remain full-width with horizontal scroll on mobile if needed
- Tab bar may stack vertically on very small screens
- Padding reduces on mobile (p-4 instead of p-8)

## Professional Polish
- NO wireframe appearance - fully styled from the start
- Consistent spacing rhythm throughout
- Subtle shadows on elevated elements (cards, modals if present)
- Clean, modern aesthetic suitable for professional SaaS tools
- Attention to micro-interactions and transitions
- Visual hierarchy through size, weight, and color contrast

## Images
No hero images required - this is a functional dashboard tool focused on data input and display.