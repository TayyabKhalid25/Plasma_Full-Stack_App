# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: messages.spec.ts >> Messages Page >> should load conversation history
- Location: tests\e2e\messages.spec.ts:8:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1').filter({ hasText: 'Messages' }).or(locator('text=Messages'))
Expected: visible
Error: strict mode violation: locator('h1').filter({ hasText: 'Messages' }).or(locator('text=Messages')) resolved to 2 elements:
    1) <h1 class="font-display font-bold text-xl text-plasma-text-primary">Messages</h1> aka getByRole('heading', { name: 'Messages', exact: true })
    2) <h3 class="font-display font-bold text-xl text-plasma-text-primary mb-2">Your Messages</h3> aka getByRole('heading', { name: 'Your Messages' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1').filter({ hasText: 'Messages' }).or(locator('text=Messages'))

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
      - generic [ref=e83]:
        - generic [ref=e84]:
          - heading "Messages" [level=1] [ref=e85]
          - button [ref=e86] [cursor=pointer]:
            - img [ref=e87]
        - generic [ref=e89]:
          - img [ref=e90]
          - textbox "Search conversations..." [ref=e93]
      - generic [ref=e116]:
        - img [ref=e117]
        - heading "Your Messages" [level=3] [ref=e119]
        - paragraph [ref=e120]: Select a conversation to start chatting with your squad mates.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Messages Page', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/messages');
  6  |   });
  7  | 
  8  |   test('should load conversation history', async ({ page }) => {
> 9  |     await expect(page.locator('h1').filter({ hasText: 'Messages' }).or(page.locator('text=Messages'))).toBeVisible();
     |                                                                                                        ^ Error: expect(locator).toBeVisible() failed
  10 |   });
  11 | 
  12 |   test('should send a new message', async ({ page }) => {
  13 |     // Implement send message text
  14 |   });
  15 | });
  16 | 
```