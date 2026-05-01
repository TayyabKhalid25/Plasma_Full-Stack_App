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
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1').filter({ hasText: 'Settings' }).or(locator('text=Settings'))

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e12]:
    - generic [ref=e14]:
      - generic [ref=e15]:
        - link [ref=e16] [cursor=pointer]:
          - /url: /
          - img [ref=e17]
        - generic [ref=e26]:
          - heading "Welcome Back, Gamer" [level=1] [ref=e28]
          - paragraph [ref=e30]:
            - text: Sign in with your Steam account to access your
            - text: squad, feed, and game stats.
      - generic [ref=e31]:
        - generic [ref=e32]:
          - generic [ref=e33]: Username or Email
          - textbox "Username or Email" [ref=e34]:
            - /placeholder: Enter your username or email
        - generic [ref=e35]:
          - generic [ref=e36]: Password
          - textbox "Enter your password" [ref=e37]
        - button "Log In" [ref=e38]
        - generic [ref=e41]: OR
      - generic [ref=e43]:
        - button "Sign in through Steam" [ref=e44] [cursor=pointer]:
          - img "Sign in through Steam" [ref=e45]
        - button "Dev Mode Login" [ref=e46]:
          - img
          - text: Dev Mode Login
        - link "Don't have an Account? Sign Up" [ref=e48] [cursor=pointer]:
          - /url: /sign-up
      - generic [ref=e49]:
        - generic [ref=e50]: By signing in, you agree to our
        - generic [ref=e51] [cursor=pointer]: Terms of Service
        - generic [ref=e52]: and
        - generic [ref=e53] [cursor=pointer]: Privacy Policy
    - generic [ref=e54]:
      - generic:
        - img
      - generic [ref=e56]: NEON OBSERVATORY v2.4
      - generic [ref=e57]:
        - generic [ref=e59]:
          - img [ref=e61]
          - paragraph [ref=e63]: See your squad's live activity
        - generic [ref=e65]:
          - img [ref=e67]
          - paragraph [ref=e69]: Schedule gaming sessions effortlessly
        - generic [ref=e71]:
          - img [ref=e73]
          - paragraph [ref=e79]: Track achievements across all platforms
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