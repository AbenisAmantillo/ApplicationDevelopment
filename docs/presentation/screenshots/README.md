# Demo screenshots for the presentation PDF

Replace each placeholder (or add PNG files with these exact names) before exporting the PDF.

| File | What to capture |
|------|-----------------|
| `01-login.png` | Login screen (show API hint in dev if visible) |
| `02-dashboard.png` | Client dashboard with available properties |
| `03-checkout.png` | Checkout: property, furniture, payment plan |
| `04-transaction-success.png` | In-app success dialog after checkout |
| `05-local-notification.png` | Android notification shade: **Transaction successful** |
| `06-transactions.png` | My Transactions list (paid / outstanding) |
| `07-profile.png` | Profile screen (photo / username) |
| `08-staff-blocked.png` | Staff/admin login → blocked screen (optional) |

**Tips**

- Use a physical device or emulator at **1080×1920** or similar; crop status bar consistently.
- For `05`, complete a checkout, then pull down the notification shade.
- Windows: `Win + Shift + S` or emulator screenshot button.
- After adding PNGs, run from repo root: `npm run presentation:pdf`

You can delete `placeholder.svg` once all PNGs exist.
