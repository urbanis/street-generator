# Analytics

Street Generator uses [PostHog](https://posthog.com) for anonymous usage analytics, hosted on EU servers.

---

## Why

To understand which features are actually used so the tool can be improved. For example: knowing whether people use the AI generation feature or prefer the map import helps prioritise future work.

---

## What is tracked

All events are anonymous — no personal data, no account, no fingerprinting.

| Event | When | Properties |
|---|---|---|
| `$pageview` | On every visit | URL (automatic, PostHog default) |
| `export` | When downloading a file | `format`: png / svg / json |
| `ai_generated` | When the AI generator runs | `success`: true / false · `error`: message if failed |
| `template_applied` | When a street template is loaded | `template_id` |
| `tool_activated` | When a map tool is turned on | `tool`: mark-section / measure / inspect |
| `tour_completed` | When the onboarding tour is finished | — |
| `tour_skipped` | When the tour is closed early | `at_step`: step number where it was closed |
| `documentation_opened` | When the documentation modal is opened | — |
| `dark_mode_toggled` | When dark/light mode is switched | `enabled`: true / false |
| `language_switched` | When the language is changed | `to`: de / en |
| `support_button_clicked` | When the Buy Me a Coffee button is clicked | — |

PostHog also captures **clicks and pageviews automatically** as part of its default autocapture behaviour.

---

## What is NOT tracked

- Street content (names, widths, element types you design)
- Map locations you search or click
- Any text you type into the AI generator
- IP address (PostHog EU is configured to anonymise IPs by default)
- Anything that could identify you personally

---

## Opt out

PostHog respects the browser's Do Not Track setting. You can also opt out programmatically by running this in the browser console:

```js
posthog.opt_out_capturing()
```

To opt back in:

```js
posthog.opt_in_capturing()
```
