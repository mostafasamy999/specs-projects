# Activities chat bot — implemented

> Implemented 2026-11-02 in `~/StudioProjects/talentlink`. Companion to
> [api-contracts.md](api-contracts.md) and
> [current-state-codebase-logic-tech.md](current-state-codebase-logic-tech.md).
> The model/training pipeline lives in the separate `local ai` project
> (`~/work/local ai`), not in this repo.

## Idea

A floating "Ask AI" button on the Activities screen opens a chat sheet.
The user types a natural-language request ("show my pending visits
yesterday"); a local fine-tuned LLM (Qwen2.5-3B + LoRA, served on the
developer's Mac) parses it into a small intermediate JSON, and the app
maps that straight onto `NewActivitiesFilter` — the exact same object the
filter sheet builds. The existing cubit, use cases and list/dashboard UI
do everything else; nothing about loading or rendering activities was
duplicated.

## Pipeline

```
user text
  -> POST http://<mac>:8090/chat          (scripts/api_server.py, on the Mac)
  -> mlx_lm.server :8080 (fine-tuned model) -> {action, arguments, ...}
  -> NewActivitiesChatApiService (plain Dio, app side)
  -> NewSendActivitiesChatMessageUseCase -> NewChatParsedIntent
  -> NewMapChatIntentToFilterUseCase (pure; business rules live here)
  -> NewActivitiesFilter
  -> NewActivitiesCubit.changeSelection(filter: ...)   <- the real screen
```

`NewMapChatIntentToFilterUseCase` does NOT re-derive `onlyMe` or
company/employee ids — it only ever builds a `NewActivitiesFilter`, so it
inherits the real rules for free from
`NewActivityRepositoryImplementation._onlyMe` and
`NewActivitiesFilterData.scopeIds`. This replaced an earlier, separate
Python mapping layer (`local ai/scripts/map_to_api.py`) that duplicated
those rules by hand from `api-contracts.md` — once the real app code was
read, the Dart-side mapping turned out simpler and ground-truth-correct by
construction. `map_to_api.py` is kept only as a reference / CLI demo for
the model pipeline in isolation.

## New files (talentlink repo)

- `domain/entities/new_activities_chat/` — `new_chat_parsed_intent.dart`,
  `new_chat_message.dart`
- `domain/repositories/new_activities_chat/new_activities_chat_repository.dart`
- `domain/usecase/new_activities_chat/` —
  `new_send_activities_chat_message_use_case.dart`,
  `new_map_chat_intent_to_filter_use_case.dart` (the mapping — dates,
  scope, fuzzy employee-name search against `filterData.tree`)
- `data/sources/remote/new_activities_chat/new_activities_chat_api_service.dart`
  — plain Dio (not Retrofit; one dev-only endpoint, no codegen needed)
- `data/repositories/new_activities_chat/new_activities_chat_repository_implementation.dart`
- `presentation/blocs/new_activities_chat/` —
  `new_activities_chat_cubit.dart`, `new_activities_chat_state.dart`
- `presentation/screens/new_activities/widgets/chat/` —
  `new_activities_chat_bottom_sheet.dart`, `new_activities_chat_fab_widget.dart`

Wired into `di/data_layer_injector.dart`, `repository_injector.dart`,
`use_case_injector.dart`, `bloc_injector.dart` (the chat cubit is
`registerFactoryParam`'d with the screen's `NewActivitiesCubit` instance),
and into `new_activities_screen.dart` / `new_activities_content.dart` (a
second small FAB above the view-toggle one).

## Known gaps / next steps

- `NewActivitiesChatApiService.defaultBaseUrl` is hardcoded
  (`http://10.0.2.2:8090` — Android emulator's host alias). For an iOS
  simulator use `http://localhost:8090`; for a physical device, the Mac's
  LAN IP (`ipconfig getifaddr en0`) and the Mac's firewall must allow
  inbound 8090.
- Chat UI strings are hardcoded English, not yet in `intl_en.arb` /
  `intl_ar.arb`.
- Both `mlx_lm.server` (port 8080) and `scripts/api_server.py` (port 8090,
  in `local ai/scripts/`) must be running on the Mac for the chat to work;
  neither survives a Mac restart automatically.
- Not yet run through `flutter analyze` / a real build — the Flutter SDK
  (via `.fvm`) isn't reachable from this session's file-bridge sandbox, so
  run `fvm flutter analyze` and `fvm flutter pub get` yourself to catch
  anything the manual edits missed.
- The 3 known v2 model-quality issues (overgeneralized refusal, a
  hallucinated date instead of asking, Arabic tasks+priority gap — see
  `local ai` project notes) still apply; a v3 dataset/model would improve
  this before any real rollout.
