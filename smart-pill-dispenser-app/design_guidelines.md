# Smart Pill Dispenser App - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - The app has explicit user roles, cloud sync, and social features:
- **Dual-role authentication**: Patient and Caregiver
- Implement SSO with Apple Sign-In (iOS) and Google Sign-In (Android)
- Auth flow includes:
  - Role selection screen (Patient or Caregiver)
  - Sign-in/Sign-up with SSO
  - Profile creation with photo upload
  - Privacy policy and terms of service links
- Account management:
  - Profile screen with customizable avatar and display name
  - Settings with logout (confirmation alert)
  - Delete account nested under Settings > Account > Delete (double confirmation)
- Use secure storage for tokens, role, and profile metadata
- Mock auth endpoints with realistic delays

### Navigation
**Tab Navigation** - The app has distinct feature areas per role:

**Patient Role (5 tabs):**
- Home (dashboard with next dose, health score, streaks)
- Calendar (adherence view)
- History (dose timeline)
- Chat (communication feed)
- Profile (settings, dark mode, biometrics)

**Caregiver Role (5 tabs):**
- Dashboard (metrics, charts)
- Patients (list view)
- Alerts (notification center)
- Messages (communication feed)
- Profile (settings)

**Global Modals:**
- Device pairing (QR + NFC UI)
- SOS emergency screen
- Backup screen

## Screen Specifications

### Onboarding Flow (3-4 slides)
- Stack-only navigation with swipe gestures
- No header, full-screen immersive
- Components: Parallax images, Lottie animations, dot indicator
- Bottom safe area: Skip + Next buttons, Get Started on final slide
- Layout: Scrollable with page snapping

### Patient Home Dashboard
- Header: Transparent with profile photo (right button)
- Main content: Scrollable with cards
- Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Components: Next dose countdown timer, health score gauge (0-100), streak cards, quick actions
- Floating element: SOS emergency button (bottom-right, with drop shadow: offset 0/2, opacity 0.10, radius 2)

### Calendar Adherence View
- Header: Default with month selector
- Main content: Calendar grid (non-scrollable)
- Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Components: Calendar with color-coded dates (green = taken, red = missed, gray = upcoming)

### Patient Dose Timeline
- Header: Default with date filter (right button)
- Main content: List view
- Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Components: Chronological list cards showing time, medication name, status badge

### Caregiver Dashboard
- Header: Transparent with notifications icon (right button)
- Main content: Scrollable
- Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Components: Patient overview cards, adherence charts, AI insights cards, recent alerts list

### Chat Communication Feed
- Header: Default with patient/caregiver name
- Main content: Inverted list (chat pattern)
- Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Components: Message bubbles, timestamp labels, input bar (floating at bottom)

### Device Pairing (Modal)
- Native modal screen
- Header: Close button (left), "Pair Device" title
- Main content: Scrollable form
- Safe area: top = Spacing.xl, bottom = insets.bottom + Spacing.xl
- Components: QR code scanner UI, NFC tap animation, device list, pairing instructions
- Submit button: Below form

### Settings
- Header: Default with "Settings" title
- Main content: Scrollable form
- Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Components: Toggle switches (dark mode, biometrics), text size slider, language picker, backup button, account management section

## Design System

### Color Palette
**Light Mode:**
- Primary: #0A84FF (iOS blue)
- Secondary: #30D5C8 (Teal/Aqua)
- Success: #34C759 (Green 500)
- Warning: #FF9500 (Amber 500)
- Error: #FF3B30 (Red 600)
- Background: #F8FAFD
- Card: #FFFFFF with soft shadow
- Text Primary: #000000
- Text Secondary: #8E8E93

**Dark Mode:**
- Primary: #0A84FF
- Secondary: #30D5C8
- Success: #32D74B
- Warning: #FF9F0A
- Error: #FF453A
- Background: #0E0E0F
- Card: #1C1C1E with soft elevation
- Text Primary: #FFFFFF
- Text Secondary: #98989D

### Typography
- Font Family: System default (SF Pro on iOS, Roboto on Android)
- Large Title: 34pt, Bold (onboarding headers)
- Title 1: 28pt, SemiBold (screen headers)
- Title 2: 22pt, SemiBold (section headers)
- Headline: 17pt, SemiBold (card titles)
- Body: 17pt, Regular (content)
- Callout: 16pt, Regular (secondary info)
- Footnote: 13pt, Regular (captions)
- Letter spacing: Smooth, system default

### Visual Design
**Component Styling:**
- Border radius: 16-28px for cards, 12px for buttons
- Soft drop shadows on cards: offset 0/4, opacity 0.08, radius 8
- Floating action buttons: offset 0/2, opacity 0.10, radius 2
- Subtle gradients for premium cards (primary to secondary, 45deg)
- Glass morphism for overlays (blur + transparency)

**Icons:**
- Use Feather icons from @expo/vector-icons
- System icons for common actions (share, settings, notifications)
- NO emojis in UI
- Custom icons needed: pill dispenser, health score gauge, streak badges

**Visual Feedback:**
- All touchable elements: Scale bounce on press (scale 0.95)
- Buttons: Opacity 0.6 when pressed
- Toggle switches: Smooth slide animation
- Form inputs: Border color change on focus

**Animations:**
- Page transitions: Shared axis (horizontal slide)
- Modal sheets: iOS-style slide up with grab handle
- List items: Fade-through on appear
- Hero animations: Profile photos, medication cards
- Lottie animations required:
  - Pill dispensing (success state)
  - Onboarding illustrations (3 unique)
  - Loading states

**Specific Animations:**
- Health score gauge: Animated arc fill (duration 1.2s, easeOut)
- Streak counter: Number count-up animation
- Next dose countdown: Live timer with pulse effect every second
- Badge unlock: Scale + confetti particles

### Required Assets
**Critical Generated Assets:**
1. **Patient Avatars (5 preset options)** - Friendly, health-focused illustrations (circular, pill/medical theme colors)
2. **Caregiver Avatars (5 preset options)** - Professional, caring illustrations (circular, matching patient style)
3. **Achievement Badges (8 total):**
   - 3-Day Streak
   - 7-Day Streak
   - 30-Day Streak
   - Perfect Week
   - Consistent
   - Never Missed
   - Health Champion
   - Super Caregiver
4. **Device Icons (2 types):**
   - Home dispenser (larger, detailed)
   - Travel mini-dispenser (compact)

**System Icons (Feather):**
- Navigation: home, calendar, clock, message-square, user
- Actions: plus, check, x, bell, settings
- Status: check-circle, alert-circle, info

### Accessibility Requirements
- Minimum touch target: 44x44pt (iOS HIG standard)
- Color contrast ratio: 4.5:1 for body text, 3:1 for large text
- Text scaling: Support Dynamic Type (iOS) and font scale (Android) from 0.8x to 1.4x
- Screen reader labels for all interactive elements
- Haptic feedback for important actions (dose confirmed, SOS triggered)
- Support for reduced motion preference (disable parallax, use fade instead of slide)
- Voice Assistant button UI (simulation only - "What is my next dose?", "Show my history")