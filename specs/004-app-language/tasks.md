# 004 App Language: Tasks

- [x] **T1** iOS `CFBundleLocalizations` (en, ar). Add `shared_preferences`.
- [x] **T2** Domain (`AppLanguage`, `LanguageRepository`, use cases) and data (`LanguageStorage`, repository impl).
  **Verify:** repository tests: nothing saved → system; saved `ar` → arabic; unknown value → system; system clears the key.
- [x] **T3** `LanguageCubit`, DI, `main()` loads prefs, `MaterialApp.locale` follows the cubit.
  **Verify:** cubit tests: starts from the saved value; select emits, then saves; a failed save still emits.
- [x] **T4** `LanguageButton` + `LanguageSheet`, EN/AR strings.
  **Verify:** widget test: picking العربية switches the text to Arabic and RTL.
- [ ] **T5** Device check: AC1–AC4.

*2026-10-20: T1–T4 done; 86 tests pass, analyze clean. Emulator (API 36, English): the sheet shows the 3 options; picking العربية switches to Arabic RTL, and it stays Arabic after a full restart; Phone language goes back to English. **T5 still open:** Arabic-phone first launch on Android and iOS (AC1), and switching during Remove music (AC4).*
