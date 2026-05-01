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
        - generic [ref=e90]:
          - generic [ref=e91]:
            - heading "Messages" [level=1] [ref=e92]
            - button [ref=e93] [cursor=pointer]:
              - img [ref=e94]
          - generic [ref=e98]:
            - img [ref=e99]
            - textbox "Search conversations..." [ref=e102]
        - generic [ref=e125]:
          - img [ref=e126]
          - heading "Your Messages" [level=3] [ref=e128]
          - paragraph [ref=e129]: Select a conversation to start chatting with your squad mates.
  - button "Open Next.js Dev Tools" [ref=e135] [cursor=pointer]:
    - img [ref=e136]
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