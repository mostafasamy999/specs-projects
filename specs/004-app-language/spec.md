# 004 App Language: Spec

**Version:** v1.0  
**Status:** Approved for coding (issues in [review.md](review.md))  
**App:** `~/StudioProjects/mute-music-app`  
**Last updated:** 2026-10-20

---

## 1. Purpose

The app has English and Arabic, but the user can't choose between them:
- On Android it follows the phone's language.
- On iOS it shows English even on an Arabic phone, because the app doesn't declare Arabic in `Info.plist` (see review I1).

This change makes the app **open in the phone's language by default**, and lets the user **pick a language inside the app**. The choice is remembered across restarts.

## 2. Scope

**In scope**
- Three choices: **Phone language** (default), **English**, **العربية**.
- A language button in the app bar that opens a picker.
- Saving the choice on the device.
- Declaring both languages to iOS (`CFBundleLocalizations`).

**Out of scope**
- More languages.
- Android 13+ per-app language in the system Settings app (`locales_config.xml`). It could be added later; see review I6.

## 3. Requirements

| # | Requirement |
|---|---|
| L1 | First launch (nothing saved): the app uses the phone's language when it is English or Arabic, and **English** for any other phone language. |
| L2 | The app bar has a language button (globe icon, tooltip `language`). It opens a bottom sheet with three options and a check on the current one. |
| L3 | Options read **Phone language** (localized), **English** and **العربية**. The two language names are always written in their own language, so a user can find theirs even in the wrong UI language. |
| L4 | Picking an option switches the whole app at once, including RTL/LTR, without restarting or losing the current video, result or running job. |
| L5 | The choice is saved and used on the next launch, before the first frame (no flash of the other language). |
| L6 | **Phone language** removes the saved choice, so the app follows the phone again, including later changes to the phone's language. |
| L7 | A saved value the app doesn't recognize (e.g. from a future version) is treated as **Phone language**. If saving fails, the language still changes for this session. |
| L8 | Every new string exists in EN and AR. |

## 4. Design

- **Domain:** `AppLanguage { system, english, arabic }` with `languageCode` (`null` for system). `LanguageRepository` with `AppLanguage current()` and `Future<DataState<void>> save(AppLanguage)`. Use cases `GetLanguageUseCase` and `SetLanguageUseCase`.
- **Data:** `LanguageStorage` over `shared_preferences`. The key is `app_language` with the value `en` or `ar`, and no key means system. `SharedPreferences` is loaded in `main()` before `runApp`, so `current()` is synchronous (L5).
- **Bloc:** `LanguageCubit` (state: `AppLanguage`). It is app-wide, provided above `MaterialApp`. `select()` emits first, then saves (L7).
- **App:** `MaterialApp.locale` = the chosen locale, or `null` for system. Flutter's default resolution then picks the phone's language, or the first supported locale (`en`) if there's no match (L1).
- **UI:** `LanguageButton` (app bar) → `LanguageSheet` with three `RadioListTile`s.

## 5. Acceptance checks

| # | Check |
|---|---|
| AC1 | Fresh install on an Arabic phone (Android and iOS) opens in Arabic, RTL. On an English phone, in English. On a French phone, in English. |
| AC2 | Pick English on an Arabic phone: the app switches at once, and stays English after a restart. |
| AC3 | Pick Phone language: the app follows the phone again after a restart. |
| AC4 | Switching language while Remove music runs doesn't stop the job, and the step list switches language. |
| AC5 | `flutter analyze` is clean and `flutter test` is green. |
