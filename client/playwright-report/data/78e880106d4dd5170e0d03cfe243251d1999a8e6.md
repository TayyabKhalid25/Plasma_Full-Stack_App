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
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - link "Plasma" [ref=e6] [cursor=pointer]:
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
        - link "PULSE" [ref=e37] [cursor=pointer]:
          - /url: /pulse
          - img [ref=e38]
          - generic [ref=e40]: PULSE
        - link "RALLY" [ref=e41] [cursor=pointer]:
          - /url: /rally
          - img [ref=e42]
          - generic [ref=e47]: RALLY
        - link "OMNI LIBRARY" [ref=e48] [cursor=pointer]:
          - /url: /library
          - img [ref=e49]
          - generic [ref=e54]: OMNI LIBRARY
        - link "PRESTIGE" [ref=e55] [cursor=pointer]:
          - /url: /prestige
          - img [ref=e56]
          - generic [ref=e63]: PRESTIGE
      - generic [ref=e67]:
        - generic [ref=e68]: SQUAD ONLINE
        - button "Manage Squad" [ref=e85] [cursor=pointer]
    - main [ref=e87]:
      - generic [ref=e88]:
        - heading "Settings" [level=1] [ref=e89]
        - generic [ref=e90]:
          - navigation [ref=e91]:
            - generic [ref=e92]:
              - button "Account" [ref=e93] [cursor=pointer]:
                - img [ref=e94]
                - generic [ref=e97]: Account
              - button "Notifications" [ref=e98] [cursor=pointer]:
                - img [ref=e99]
                - generic [ref=e102]: Notifications
              - button "Privacy" [ref=e103] [cursor=pointer]:
                - img [ref=e104]
                - generic [ref=e106]: Privacy
              - button "Danger Zone" [ref=e107] [cursor=pointer]:
                - img [ref=e108]
                - generic [ref=e114]: Danger Zone
          - generic [ref=e115]:
            - generic [ref=e116]:
              - heading "Account Settings" [level=2] [ref=e117]
              - generic [ref=e118]:
                - generic [ref=e119]:
                  - img "Avatar" [ref=e120]
                  - button [ref=e121] [cursor=pointer]:
                    - img [ref=e122]
                - generic [ref=e125]:
                  - button "Change Avatar" [ref=e126] [cursor=pointer]
                  - paragraph [ref=e127]: JPG, PNG. Max 2MB.
              - generic [ref=e128]:
                - paragraph [ref=e130]: Username
                - textbox [ref=e132]: Wahaj
              - generic [ref=e133]:
                - paragraph [ref=e135]: Email Address
                - textbox [ref=e137]: wahaj@plasma.gg
              - generic [ref=e138]:
                - generic [ref=e139]:
                  - paragraph [ref=e140]: Password
                  - paragraph [ref=e141]: Last changed 30 days ago
                - button "Change Password" [ref=e143] [cursor=pointer]
            - button "Save Changes" [ref=e145] [cursor=pointer]:
              - img [ref=e146]
              - text: Save Changes
    - button [ref=e151] [cursor=pointer]:
      - img [ref=e152]
  - button "Open Next.js Dev Tools" [ref=e159] [cursor=pointer]:
    - img [ref=e160]
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