# Mobile Responsive Layout Refinement V3 Design Spec

## Goal Description
Resolve the mobile drawer blink-close interaction bug by integrating the standard shadcn `<SheetTrigger>` wrapper, and resolve the desktop panel collapse handles (black pills) bleeding onto mobile layouts by implementing a client hydration mount guard.

## Proposed Changes

### 1. Integrate SheetTrigger in DashboardClient
* **Target File:** [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)
  * Import `SheetTrigger` from `components/ui/sheet.tsx`.
  * Wrap the header hamburger button inside `<SheetTrigger render={<button ... />} />` to let Radix UI natively manage trigger event pointer association. This prevents Radix from identifying click events on the hamburger menu as "outside clicks" and instantly closing the drawer (the blink bug).
  * Relocate `<Sheet>` and `<SheetContent>` to wrap the trigger directly inside the header toolbar component.

### 2. Add Client Hydration Mount Guard
* **Target File:** [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)
  * Create a `mounted` state variable initialized to `false`, and toggle it to `true` in a mount `useEffect` hook.
  * Before the component is mounted, return a clean glassmorphic loading viewport:
    ```tsx
    if (!mounted) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-accent-cyan" />
            </div>
        );
    }
    ```
  * This guarantees that during Next.js SSR (Server-Side Rendering), the server renders the spinner. Once hydrated on the client, the layout resolves to the correct viewport sizing instantly, eliminating hydration mismatch residues (like desktop DOM collapse pill buttons hanging on mobile screen borders).

---

## Verification Plan

### Manual Verification
* **Mobile Sidebar Interaction:** Emulate a mobile screen. Click the hamburger button. Verify that the drawer slides in smoothly and remains open without blinking closed.
* **Pill Handle Hiding:** Verify that no desktop resizable panels, handles, or drawer collapse pills bleed onto the mobile viewport layout.
