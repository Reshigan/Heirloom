# Heirloom Constellation Icon System

Custom icon system designed to match the Heirloom Constellation theme with luxury gold aesthetics.

## Overview

The icon system consists of two parts:
1. **SVG React Components** - For use in the UI with gold gradients and constellation styling
2. **Text-Based Unicode Icons** - For use in reports, messages, and plain text contexts

## SVG React Components

### Available Icons

- `SuccessStar` - Constellation triangle with checkmark overlay
- `ErrorStar` - Four-point star with X overlay
- `WarningStar` - Triangle constellation with exclamation mark
- `InfoOrbit` - Planet with orbital ring and info symbol
- `ProgressOrbit` - Animated orbital path with star nodes
- `SparkBullet` - Single star with four rays

### Usage

```tsx
import { SuccessStar, ErrorStar, WarningStar, InfoOrbit, ProgressOrbit, SparkBullet } from '@/components/icons';

// Basic usage
<SuccessStar size={24} />

// With custom styling
<ErrorStar size={32} className="opacity-80" />

// With accessibility title
<InfoOrbit size={20} title="Additional information available" />

// Custom stroke width
<WarningStar size={24} strokeWidth={2} />
```

### Props

All icon components accept the following props:

- `size?: number` - Icon size in pixels (default: 24)
- `className?: string` - Additional CSS classes
- `title?: string` - Accessibility title for screen readers
- `strokeWidth?: number` - Stroke width for lines (default: 1.75)

### Design Features

- **Gold Gradient**: Three-stop linear gradient (#E9C86B → #D4AF37 → #8A6B1F)
- **Constellation Style**: Star nodes connected by lines
- **Subtle Glow**: Optional filter for enhanced visibility
- **Unique IDs**: Each icon instance generates unique gradient IDs to prevent collisions
- **Accessibility**: Proper ARIA labels and titles

## Text-Based Unicode Icons

For use in reports, messages, CLI output, and other plain text contexts.

### Icon Set

```
[★] Success / Completed
[✖] Error / Failed
[▲] Warning / Caution
[ℹ] Info / Note
[◌] In Progress / Pending
[•] Bullet / List Item
```

### Usage Examples

#### Status Reports

```
[★] Deployed to staging
[★] All services running
[◌] Running migrations
[✖] Recipients API returned empty
```

#### Lists

```
[•] 33 memories spanning 1923-2025
[•] 3 recipients configured
[•] Vault encryption enabled
```

#### Progress Updates

```
[◌] Building frontend...
[◌] Running tests...
[★] Build complete
```

### Formatting Guidelines

1. **Fixed-width brackets**: Always use `[` and `]` for consistent alignment
2. **Single space after icon**: `[★] Message` not `[★]Message`
3. **Consistent capitalization**: Start messages with capital letters
4. **Alignment**: Icons align vertically in lists

## Color Tokens

The icon system uses the following color tokens from the design system:

```css
--gold-500: #D4AF37  /* Primary gold */
--gold-300: #E8D48A  /* Light gold */
--gold-700: #957714  /* Deep gold */
--shadow-gold-glow: 0 4px 20px rgba(212, 175, 55, 0.3)
```

## Animations

### Progress Spinner

The `ProgressOrbit` icon includes a slow rotation animation:

```css
@keyframes spin-slow {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spin-slow 1.2s linear infinite;
}
```

The animation respects `prefers-reduced-motion` for accessibility.

## Integration Examples

### In Toast Notifications

```tsx
import { SuccessStar, ErrorStar } from '@/components/icons';

<Toast>
  <SuccessStar size={20} />
  <span>Changes saved successfully</span>
</Toast>
```

### In Status Badges

```tsx
<div className="flex items-center gap-2">
  <ProgressOrbit size={16} />
  <span>Processing...</span>
</div>
```

### In Reports to User

```
[★] Browser Testing Complete

All pages tested successfully:
[•] Landing page loads with Constellation design
[•] Login authentication working
[•] 33 memories displaying correctly
[•] All API endpoints verified

[ℹ] Staging URL: https://loom.vantax.co.za
```

## Accessibility

All SVG icons include:
- `role="img"` attribute
- `aria-label` or `title` for screen readers
- Proper semantic meaning

Text-based icons are screen-reader friendly as they use standard Unicode characters.

## Browser Support

- SVG icons: All modern browsers (Chrome, Firefox, Safari, Edge)
- Unicode icons: Universal support across all platforms
- Animations: Gracefully degrade with `prefers-reduced-motion`

## Future Additions

Potential icons for future implementation:
- `LinkStar` - For connections/relationships
- `LockStar` - For security/encryption
- `MicStar` - For voice recordings
- `LetterStar` - For messages/letters
- `RecipientStar` - For recipients/contacts
- `MemoryStar` - For memories/vault items
