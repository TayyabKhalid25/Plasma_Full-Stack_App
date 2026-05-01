# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings.spec.ts >> Settings Page >> should load settings form
- Location: tests\e2e\settings.spec.ts:8:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1').filter({ hasText: 'Settings' }).or(locator('text=Settings'))
Expected: visible
Error: strict mode violation: locator('h1').filter({ hasText: 'Settings' }).or(locator('text=Settings')) resolved to 2 elements:
    1) <h1 class="font-display font-bold text-[32px] text-plasma-text-primary mb-8">Settings</h1> aka getByRole('heading', { name: 'Settings', exact: true })
    2) <h2 class="font-display font-bold text-lg text-plasma-text-primary mb-6">Account Settings</h2> aka getByRole('heading', { name: 'Account Settings' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1').filter({ hasText: 'Settings' }).or(locator('text=Settings'))

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "Plasma" [ref=e6]:
        - /url: /pulse
        - img "Plasma" [ref=e7]
      - generic [ref=e8]:
        - textbox "Search players, games..." [ref=e10]
        - img [ref=e12]
    - generic [ref=e15]:
      - generic [ref=e16]:
        - button "COMP" [ref=e17] [cursor=pointer]:
          - generic [ref=e18]: COMP
        - button "CHILL" [ref=e19] [cursor=pointer]:
          - generic [ref=e20]: CHILL
        - button "OFFLINE" [ref=e21] [cursor=pointer]:
          - generic [ref=e22]: OFFLINE
      - generic [ref=e23]:
        - button "2" [ref=e25] [cursor=pointer]:
          - img [ref=e26]
          - generic [ref=e30]: "2"
        - button [ref=e32] [cursor=pointer]
  - generic [ref=e35]:
    - generic [ref=e36]:
      - link "PULSE" [ref=e37]:
        - /url: /pulse
        - img [ref=e38]
        - generic [ref=e40]: PULSE
      - link "RALLY" [ref=e41]:
        - /url: /rally
        - img [ref=e42]
        - generic [ref=e44]: RALLY
      - link "OMNI LIBRARY" [ref=e45]:
        - /url: /library
        - img [ref=e46]
        - generic [ref=e48]: OMNI LIBRARY
      - link "PRESTIGE" [ref=e49]:
        - /url: /prestige
        - img [ref=e50]
        - generic [ref=e56]: PRESTIGE
    - generic [ref=e60]:
      - generic [ref=e61]: SQUAD ONLINE
      - button "Manage Squad" [ref=e78] [cursor=pointer]
  - main [ref=e80]:
    - generic [ref=e81]:
      - heading "Settings" [level=1] [ref=e82]
      - generic [ref=e83]:
        - navigation [ref=e84]:
          - generic [ref=e85]:
            - button "Account" [ref=e86] [cursor=pointer]:
              - img [ref=e87]
              - generic [ref=e90]: Account
            - button "Notifications" [ref=e91] [cursor=pointer]:
              - img [ref=e92]
              - generic [ref=e95]: Notifications
            - button "Privacy" [ref=e96] [cursor=pointer]:
              - img [ref=e97]
              - generic [ref=e99]: Privacy
            - button "Danger Zone" [ref=e100] [cursor=pointer]:
              - img [ref=e101]
              - generic [ref=e104]: Danger Zone
        - generic [ref=e105]:
          - generic [ref=e106]:
            - heading "Account Settings" [level=2] [ref=e107]
            - generic [ref=e108]:
              - generic [ref=e109]:
                - img "Avatar" [ref=e110]
                - button [ref=e111] [cursor=pointer]:
                  - img [ref=e112]
              - generic [ref=e115]:
                - button "Change Avatar" [ref=e116] [cursor=pointer]
                - paragraph [ref=e117]: JPG, PNG. Max 2MB.
            - generic [ref=e118]:
              - paragraph [ref=e120]: Username
              - textbox [ref=e122]: Wahaj
            - generic [ref=e123]:
              - paragraph [ref=e125]: Email Address
              - textbox [ref=e127]: wahaj@plasma.gg
            - generic [ref=e128]:
              - generic [ref=e129]:
                - paragraph [ref=e130]: Password
                - paragraph [ref=e131]: Last changed 30 days ago
              - button "Change Password" [ref=e133] [cursor=pointer]
          - button "Save Changes" [ref=e135] [cursor=pointer]:
            - img [ref=e136]
            - text: Save Changes
  - button [ref=e141] [cursor=pointer]:
    - img [ref=e142]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Settings Page', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/settings');
  6  |   });
  7  | 
  8  |   test('should load settings form', async ({ page }) => {
> 9  |     await expect(page.locator('h1').filter({ hasText: 'Settings' }).or(page.locator('text=Settings'))).toBeVisible();
     |                                                                                                        ^ Error: expect(locator).toBeVisible() failed
  10 |   });
  11 | 
  12 |   test('should edit profile information', async ({ page }) => {
  13 |     // Implement profile edit test
  14 |   });
  15 | });
  16 | 
```