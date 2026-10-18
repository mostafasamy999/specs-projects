# Feature Specification: New Activities Module
**Product:** TalentLink360 HR  
**Module:** New Activities — Visits & Tasks  
**Document Type:** Functional & Technical Specification  
**Version:** 1.0 — Draft  
**Status:** Pending review and validation

> Related: [current-state.md](current-state.md) · [open-questions.md](open-questions.md)

---

## 1. Purpose

The New Activities module allows managers and employees to view, search, filter, assign, and track Visits and Tasks.

The module starts with an Activities Dashboard and provides navigation to activity lists, filtering, activity creation, employee assignment, and progress tracking.

The new implementation must be isolated from the existing Visit/Task module.

## 2. Scope

### In scope

- Activities Dashboard
- Visit Summary and Tasks Summary
- Activity overview chart
- Activities list and pagination
- Search, sorting, and filtering
- Visit-specific and Task-specific filters
- Activity creation entry point
- Assigned-to employee picker
- Employee workload and availability
- Department hierarchy
- Activity progress updates
- API integration and fake implementations during development
- Loading, empty, success, and error states
- Unit and widget tests

### Out of scope

- Modifying or replacing the existing Visit/Task implementation
- Changing unrelated application modules
- Inventing or changing backend API behavior without confirmation
- Implementing backend endpoints as part of the Flutter task

## 3. User Roles

### Manager
- Views activities within their permitted scope.
- Assigns activities to employees.
- Filters by employee, department, status, priority, and date.
- Monitors employee workload.
- Views activity progress.

### Employee
- Views activities accessible to them.
- Searches and filters activities.
- Views activity details and progress.
- Performs permitted activity actions.

**Permission rule:** Actual capabilities must follow backend authorization and existing application permissions. The exact role-to-action matrix requires confirmation.

## 4. Navigation and Screen Structure

### 4.1 Activities Dashboard

The dashboard is the default entry screen.

**App bar**
- Back button
- Title: Activities
- Add action
- Filter action

**Dashboard content**
1. Activity overview chart showing the ratio of Visits to Tasks.
2. Visit Summary section.
3. Tasks Summary section.
4. Quick filters for common activity views.

Visit Summary and Tasks Summary must have distinct designs that suit their respective activity types.

The exact chart metric, summary cards, and summary fields must match the available dashboard API response.

### 4.2 Activities List

The list displays activities according to the selected view and applied filters.

Each activity item should display the information available from its model, such as:
- Activity title
- Activity type: Visit or Task
- Status
- Priority
- Assigned employee
- Creator
- Relevant date and time
- Progress, where applicable
- Privacy indicator, where applicable

Do not display unavailable fields as if they were real data.

### 4.3 Add Activity

The Add action opens the existing or approved creation flow for a Visit or Task.

The creation flow must distinguish Visit-specific fields from Task-specific fields. The precise form fields, validation rules, and submission APIs must be verified before implementation.

### 4.4 Filter Sheet

The filter sheet allows the user to select and apply multiple criteria.

Actions:
- Apply
- Reset
- Dismiss

Dismissal must not overwrite the previously applied filters. Reset clears the draft filter selections to the defined defaults; Apply commits the selected values and refreshes the results.

## 5. Quick Filters

Support the following quick-filter options:

- Current
- Previous
- Department
- Tasks
- Visits

Expected behavior:

| Quick filter | Expected behavior |
|---|---|
| Current | Show activities matching the approved current-period definition |
| Previous | Show activities matching the approved previous-period definition |
| Department | Filter activities using the selected department scope |
| Tasks | Restrict results to Tasks |
| Visits | Restrict results to Visits |

The exact meaning of Current and Previous must be confirmed with the product owner or backend contract. Do not assume that they mean today and yesterday without verification.

Quick filters must remain consistent with the active list filters and dashboard state.

## 6. Filtering Requirements

Support the following filter dimensions where applicable:

- Activity type: All, Visits, Tasks
- Status
- Priority
- Department
- Employee
- Start date and time
- End date and time
- Visit execution type
- Visit category
- Privacy (`isPrivate`)

Visit execution type and Visit category must only be available when the selected activity type is Visits.

When a parent selection changes, dependent values that are no longer valid must be cleared.

Examples:
- Switching from Visits to Tasks clears Visit-only filter values.
- Changing company clears the selected employees.
- Changing the department hierarchy clears dependent selections that are outside the new scope.

### Filter validation

- Start date/time must not exceed end date/time.
- Invalid dependent selections must not be submitted.
- Empty selections must be represented according to the API contract.
- The meaning of `null`, an empty array, and omitted parameters must be confirmed for each endpoint.

## 7. Company, Department, and Employee Selection

### Company selection

- Reuse the existing company model and selection conventions.
- Use the current company as the fallback when the company list is empty, where permitted.
- Changing the company clears selected employees and any dependent department selections that are no longer valid.

### Department selection

- Support the department tree.
- Respect the available company and department scope.
- Ensure employee selections remain valid for the selected department.

### Employee selection

- Reuse the existing employee/team models and data retrieval where possible.
- Do not display the employee picker until a company has been selected.
- Use the current user or company defaults only where appropriate and supported by existing behavior.
- Provide a reusable employee picker widget rather than duplicating selection logic.

## 8. Assigned-To Employee Picker and Workload

The employee picker must help the manager select an appropriate employee.

Support workload-based statuses:

- Available
- Busy
- Very Busy
- Overloaded

These statuses must be derived from employee workload data, not hardcoded per employee.

Tapping a workload status should show the employee's grouped workload, including relevant Visits and Tasks when returned by the API.

The picker should support:
- Employee search and selection
- Employee identification
- Workload status
- Relevant assigned activity summaries
- Loading, empty, and error states

The workload thresholds and their mapping to status labels must be confirmed. Do not invent thresholds or assume that a missing workload response means Available.

## 9. Search and Sorting

### Search

Support searching by:
- Activity title
- Assigned employee
- Creator

The backend contract must define whether these are separate parameters or a shared search query.

Search should use debouncing to avoid excessive API requests.

### Sorting

- Support date-based sorting.
- Preserve the selected sorting direction and field when refreshing the list, unless the user changes them.
- Confirm the supported date field and sort direction values with the API contract.

## 10. API Requirements

The feature should be designed around the following API capabilities. These are logical API responsibilities, not confirmed endpoint names.

### API A — Dashboard

Purpose: Retrieve summary information for the Activities Dashboard.

Expected data:
- Visit summary
- Task summary
- Visit-to-Task chart values or counts
- Other approved summary metrics

### API B — Activities List

Purpose: Retrieve paginated activities.

Expected request parameters, subject to the actual backend contract:
- Activity type
- Status
- Priority
- Department IDs
- Employee IDs
- Start and end date/time
- Visit execution type
- Visit category
- Privacy
- Search criteria
- Sort field and direction
- Page number and page size

Expected response:
- Activity records
- Total item count for pagination
- Any additional pagination metadata defined by the backend

### API C — Priority Lookup

Purpose: Retrieve available activity priorities.

Expected data:
- Priority ID
- Priority name
- Arabic and English labels where supported

Priority labels should follow the application's localization conventions.

### API D — Employee Workload

Purpose: Retrieve employee workload and the activities associated with that workload.

Expected data:
- Employee ID
- Relevant activity IDs
- Activity names
- Workload information required to derive availability status

The exact response shape and workload calculation rules must be confirmed.

### API E — Update Activity Progress

Purpose: Update the progress of an activity.

The progress update contract includes a numeric progress value represented as a `double` in the client domain where appropriate.

Confirm:
- Accepted progress range
- Whether progress applies to Visits, Tasks, or both
- Whether the endpoint returns the updated activity
- Validation and authorization rules

### API F — Supporting Lookups

Reuse existing APIs for companies, employees, teams, and departments whenever their response contracts meet this feature's requirements.

Do not duplicate lookup implementations without a technical reason.

## 11. Pagination and Data Refresh

- Load the first page when the list opens.
- Load subsequent pages when the user reaches the end of the list.
- Stop requesting pages when all available items have been loaded.
- Use the backend total count or pagination metadata to determine completion.
- Reset pagination when search, filters, quick filters, or sorting change.
- Prevent duplicate concurrent page requests.
- Handle refresh and pagination errors independently where appropriate.
- Avoid duplicate activity records when appending pages.

When filters change, the new list request must use the complete applied filter state.

## 12. State Management and Architecture

Follow the existing project conventions:

- Flutter and Dart
- Clean Architecture organized by feature
- Cubit for state management
- A single Cubit responsible for dashboard and list state
- Equatable for state equality
- A single state model with an appropriate status enum
- GetIt for dependency injection
- Use cases for domain operations
- Repository abstractions
- Retrofit/Dio for remote requests
- Existing `DataState` and error-handling conventions
- Existing response envelopes and DTO mapping conventions

Avoid introducing Riverpod, Provider, GetX, Freezed, or a second state-management approach.

### Suggested feature organization

The exact paths must follow the existing repository conventions.

- `data/`
  - Models and DTOs
  - Remote data source
  - Repository implementation
- `domain/`
  - Entities
  - Repository contract
  - Use cases
- `presentation/`
  - Activities dashboard
  - Activities list
  - Filter sheet
  - Employee picker
  - Cubit
  - State
  - Reusable widgets

### Isolation requirement

All new Activities functionality must live in the new feature implementation.

Do not modify the old Visit/Task module to make the new screen work. Reuse existing shared models and services through their public interfaces where possible.

## 13. Fake Data and Development Strategy

Before the backend integration is ready:

- Define repository contracts and use cases.
- Provide fake implementations for dashboard, list, priorities, workload, and progress updates.
- Use deterministic sample data for Visits and Tasks.
- Support pagination and filtering in fake implementations sufficiently to test the UI.
- Keep fake data isolated from production implementations.
- Make it possible to replace the fake repository with the real repository through dependency injection.

The fake implementation must reproduce the agreed behavior rather than bypassing business rules.

## 14. UI States and Error Handling

Each asynchronous operation must handle the relevant states.

**Dashboard**
- Initial loading
- Loaded
- Empty summary
- Error

**Activities list**
- Initial loading
- Loaded with items
- Empty results
- Pagination loading
- Initial-load error
- Pagination error
- Refreshing

**Filter and employee picker**
- Lookup loading
- Loaded
- No available options
- Lookup error
- Invalid dependent selection

Use the existing application error-handling and localization conventions. Avoid leaving a loading indicator active after a failed request.

## 15. Acceptance Criteria

### Dashboard
- Given the user opens Activities, when the dashboard request succeeds, then the Visit Summary, Tasks Summary, and overview chart display the returned data.
- Given the dashboard request fails, then an appropriate error state is shown.
- Given the user selects the Tasks quick filter, then the activity view is restricted to Tasks.

### List and pagination
- Given the list has more than one page, when the user reaches the end, then the next page is loaded without duplicating existing items.
- Given the user changes a filter, then pagination restarts from the first page.
- Given no activities match the criteria, then an empty state is displayed.

### Filtering and search
- Given the user selects a status and priority, when they apply the filter, then the list request uses both selections.
- Given the user changes the activity type to Tasks, then Visit-only filters are cleared and hidden.
- Given the user searches for a title or employee, then matching results are returned according to the agreed search contract.
- Given the user dismisses the filter sheet, then the previously applied filters remain unchanged.

### Employee assignment
- Given the company is not selected, then the employee picker is unavailable.
- Given the selected company changes, then invalid employee selections are cleared.
- Given workload data is available, then employee workload status is derived using the approved rules.
- Given an employee workload request fails, then the failure is handled without incorrectly marking the employee Available.

### Progress and errors
- Given a valid progress update is submitted, then the UI reflects the confirmed result.
- Given the update fails, then the user receives appropriate feedback and the displayed state remains consistent with the confirmed server state.

### Architecture
- Given the new feature is implemented, then the existing Visit/Task module remains unchanged.
- Given fake implementations are used, then the dashboard, list, filters, and pagination can be tested without live backend APIs.

## 16. Testing Strategy

- Unit tests for use cases, repositories, filtering, sorting, pagination, and workload classification.
- Cubit tests for dashboard loading, list loading, filter changes, search, pagination, and errors.
- Widget tests for dashboard summaries, list states, filter sheet, and employee picker.
- API mapping tests for request parameters, response DTOs, and error responses.
- Regression tests confirming that the existing Visit/Task module is unaffected.

## 17. Open Questions Before Implementation

Tracked with current answers and status in [open-questions.md](open-questions.md).

1. What are the exact dashboard and list API endpoints, request parameters, and response envelopes?
2. What are the exact definitions of Current and Previous?
3. What are the permitted statuses and priority IDs?
4. What are the workload thresholds for Available, Busy, Very Busy, and Overloaded?
5. What are the exact rules for company, department, employee, and privacy filtering?
6. Which fields are required when creating a Visit versus a Task?
7. What is the progress range and which activity types support progress updates?
8. Which date field is used for sorting?
9. What are the role-specific permissions for creation, assignment, and progress updates?
10. What are the approved dashboard summary metrics and chart values?

**Definition of Done:** The feature is implemented in isolation, follows the existing architecture, satisfies the approved acceptance criteria, passes the agreed tests, and uses verified API contracts. All unresolved business rules are documented rather than guessed.
