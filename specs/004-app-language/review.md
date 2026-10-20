# 004 App Language: Review (Issues Check)

Reviewed against `mute-music-app@7e1224e` on 2026-10-20, before coding.

| # | Sev | Issue | Decision |
|---|---|---|---|
| I1 | High | **iOS never reports Arabic.** `Info.plist` has no `CFBundleLocalizations`, so iOS tells Flutter the app only supports the development language, and an Arabic iPhone gets English. | Add `CFBundleLocalizations` = `en`, `ar`. |
| I2 | Med | **No storage package.** The app has no key-value storage yet. | Add `shared_preferences` (first-party Flutter package). Load it in `main()` before `runApp` so the first frame already has the right language (L5). |
| I3 | Med | **The screen must not reset on a language switch.** `MuteVideoCubit` is created inside the route. | A new `locale` on `MaterialApp` rebuilds widgets but keeps the navigator and routes, so the cubit and a running job survive. Check on device (AC4). |
| I4 | Low | **Unknown phone language.** | Flutter's default resolution falls back to the first supported locale, which is `en` (`main_locale: en`). No custom callback needed. |
| I5 | Low | **Language names.** A user stuck in the wrong language must still find theirs. | Show "English" and "العربية" untranslated (L3); only "Phone language" is localized. |
| I6 | Low | **Android 13+ system per-app language setting** (Settings → Apps → Language). | Out of scope. Using it would need `locales_config.xml` plus syncing with the in-app choice. |
| I7 | Low | **Saving can fail.** | The cubit emits before it saves, so the UI still switches. The failure is ignored for this session (L7). |

## Result

No blockers. I1 is a real bug today and is fixed as part of this change.
