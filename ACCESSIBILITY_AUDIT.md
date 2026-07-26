# ♿ HospitalQueue - Accessibility (a11y) & Responsive Workstation Report

This document specifies the responsive layout adaptations, keyboard navigation support, high-contrast focus rings, and screen-reader ARIA standards enforced across **HospitalQueue**.

---

## 📱 1. Workstation & Device Breakpoint Matrix

Clinical workflows take place across distinct physical environments:

| Device Target | Target Resolution | Key Responsive Layout Adaptation |
| :--- | :---: | :--- |
| **Shared Desktop Workstations** | 1920x1080 (`xl:`) | Dual-column side-by-side room queue console and prescription workspace |
| **Receptionist Touch Tablets** | 768x1024 (`md:`) | Touch-friendly patient cards and 1-tap check-in buttons (`min-h-[44px]`) |
| **Patient Mobile Devices** | 375x812 (`sm:`) | Single-column stacked calendar picker, time slots, and appointment history |

---

## ⌨️ 2. Keyboard Navigation & Focus State Controls

* **High-Contrast Focus Rings:** All interactive inputs, buttons, and navigation links enforce `focus-visible:ring-2 focus-visible:ring-[#0046ad]` to ensure visibility on shared workstation monitors.
* **Sequential Tab Order:** Follows standard DOM reading order (`Tab`, `Shift + Tab`, `Enter`, `Space`).
* **Semantic Elements:** Standard HTML5 `<button>` and `<a>` elements are used for all clickable actions.

---

## 🔊 3. Screen-Reader (ARIA) Label Verification

* **Landmark Structure:** `<header>`, `<main>`, `<nav>`, `<section>`, and `<footer>` tags wrap page views.
* **ARIA Descriptions:** Decorative icons mark `aria-hidden="true"`, while interactive inputs specify `aria-label` descriptions.
* **Live Status Announcements:** Queue updates announce status changes using `aria-live="polite"`.