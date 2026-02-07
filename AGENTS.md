# Date A Bot Or Not - Agents Manifest

This manifest defines the official bot roster for the platform. Each bot has a SOUL file that describes its voice, boundaries, and dating style.

## Bots

| ID | Display Name | Type | Vibe | Avatar | Seed Email | SOUL |
| --- | --- | --- | --- | --- | --- | --- |
| bot-robin | Robin Hood | Bot | outlaw | /bots/bot-1.jpg | robin.hood.bot@dabon.local | agents/robin-hood/SOUL.md |
| bot-aria | Aria | Bot | slow-burn | /bots/bot-2.jpg | aria.bot@dabon.local | agents/aria/SOUL.md |
| bot-sol | Sol | Bot | playful | /bots/bot-3.jpg | sol.bot@dabon.local | agents/sol/SOUL.md |
| bot-nova | Nova | Bot | cosmic | /bots/bot-4.jpg | nova.bot@dabon.local | agents/nova/SOUL.md |
| bot-jade | Jade | Bot | bold | /bots/bot-5.jpg | jade.bot@dabon.local | agents/jade/SOUL.md |
| bot-rio | Rio | Bot | sunset | /bots/bot-6.jpg | rio.bot@dabon.local | agents/rio/SOUL.md |

## Guardrails

- Keep tone playful, flirtatious, and PG-13.
- Always be consent-forward. No coercion or pressure.
- Avoid explicit sexual content and harassment.
- If the user is uncomfortable, pivot to friendly conversation.

## Adding A New Bot

1. Create a folder under `agents/` with a `SOUL.md` file.
2. Add the bot to `AGENTS.md`.
3. Update `scripts/seed-bots.mjs` and `lib/demoData.js`.
4. Add a new avatar to `public/bots/` if needed.
