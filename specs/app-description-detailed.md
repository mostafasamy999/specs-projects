# TalentLink360 — Detailed Screen Descriptions

Source: `~/StudioProjects/talentlink` (branch `feautre/shift`), read 2026-11-12.
Format: functional description per screen (flow, API calls, rules, data, validation). No UI details.
Screen names match [app-description-high-level.md](app-description-high-level.md). API names are the real method / use case names from the code. `(to confirm)` = could not be decided from the code.

General rules that apply to many screens:
- Employee id, company id, subscriber id and language are taken from the saved session. The user never enters them.
- On every request form, the list of required fields comes from the server: `getAllMandatoryFields()` api is called when the screen opens, and a field is required only if the server says so. Fields marked "required" below are the fixed ones.
- Attachments on request forms are taken from camera, gallery or files, and can be deleted before submit. Camera / photos / storage permission is asked when needed.
- If the user leaves a request form with changes, a discard confirmation is shown.
- When the session expires, the user is sent back to #LoginScreen.

---

# 1. Auth

## Splash screen

The user will:

1- Open the app

When the app opens:
- Device data is read (language, device type, serial, OS, app version, push token, saved user / company ids).
- `getSplash()` api will be called to get the company settings (notification allowed, face match, wifi name needed, liveness, last modified date) and the version rules.
- Attendance records saved offline are sent to the server with their images (`sendAttendanceWithImages`) if there are any.
- ESS permissions are loaded (`getESSPermission()` api).

Then:
- If a newer version exists, a mandatory or optional update message is shown (mandatory blocks the app, optional can be skipped).
- If the user is remembered (remember me, or restart flag) and the session is valid => opens #navMainScreen.
- Otherwise => opens #LoginScreen.
- If splash data or ESS permission fails to load, an error with retry is shown and the app does not continue.

## Login screen

The user will:

1- Enter company code
2- Enter email or mobile
3- Enter password
4- Choose remember me
5- Tap login, or use biometric login (only when it was enabled before)
6- Forgot password => opens #ForgotPasswordScreen
7- Sign up => opens #RegisterScreen
8- Switch language (English / Arabic)

When user taps login => `getCompany()` (company key) api will be called to get the company base url, but only when it is needed: the saved company code is different, or the company last-modified date changed, or a forced connection refresh is required for this app version. Otherwise the saved base url is reused.
- If the base url is missing or not http/https => "something went wrong" and login stops.
- When a new base url is saved, the app dependencies are rebuilt for the new server.

Then `login()` api will be called with email and password.
- Success => user data is saved (ids, name, position, company name / logo, profile image, token, face reference image, settings for notification / face match / wifi / liveness). Then ESS permissions are loaded (`getESSPermission()`). If that fails, an error with retry is shown.
- First login (not forced) => opens #ChangePasswordScreen (optional change) before the main screen. Remember me is saved.
- Forced password change => remember me is turned off, opens #ChangePasswordScreen (must change).
- Otherwise => opens #navMainScreen.
- Deactivated account => "deactivated" message.
- Too many attempts (server gives retry seconds) => rate-limit message with the seconds remaining.
- Any other error => the server message is shown.

Biometric login: when the user verifies biometrics, `login` with the saved token is called (`BiometricLoginUseCase`, refreshes the token). Allowed only when the user logged in with a password before and chose to enable it. Deactivated account or failure => error message.

Rules:
- Only one login can run at a time (taps while loading are ignored).
- Exit confirmation is shown on back.

Validation: company code, email and password are required. Email format and password format are validated (`EmailValidationUseCase`, `PasswordValidationUseCase`). Messages show under the field.

## Register screen

The user will:

1- Choose profile photo
2- Enter name
3- Enter company code
4- Enter email
5- Enter mobile
6- Enter password and confirm password
7- Submit

When user submits => `getCompany()` api will be called with the company code to get the company server (base url, subscriber). If not found => "Company code not found".
Then `mobileRegistration()` api will be called.
- Success => back to #LoginScreen.
- Failure => server message.

Validation: all fields required, email format, mobile format, password rules, password and confirm password must match (`validation.dart`) (exact rules to confirm).

## Forgot password screen

The user will:

1- Enter company code (numbers only)
2- Enter email or mobile
3- Send

When user taps send => `getCompany()` api will be called to get the company server.
Then, depending on the value entered:
- Email (contains `@`) => `forgotPassword()` api will be called. If status is true => success message (reset link sent by email). Otherwise the server message is shown.
- Mobile => `sendOtp()` api will be called.
  - Status 2 => success message.
  - Status 1 with request key, resend seconds and expiry seconds => opens #OtpVerificationScreen.
  - Anything else => error message.

Validation: company code required and numeric. Email or mobile required and valid.

## OTP verification screen

The user will:

1- Enter the 6-digit code
2- Verify
3- Resend (after the timer ends)

The screen shows two timers: time until resend is allowed, and time until the code expires.

When user verifies => `verifyOtp()` api will be called with request key, code and company.
- Success with id and expiry date => opens #ResetPasswordScreen.
- Failure => error message (wrong code, expired, too many attempts).

When user resends => `resendOtp()` api will be called. The timers restart with the new values.

Validation: code required, exactly 6 digits, and not expired (expired => "code expired", user must resend).
Rule: verification data is cleared after success, so the request key is not kept.

## Reset password screen

The user will:

1- Enter new password
2- Confirm password
3- Save

When user saves => `resetPassword()` api will be called with the verification id and expiry date received from OTP.
- Success => success message, back to #LoginScreen.
- Failure => error message.
- Verification id or expiry date missing => "reset verification missing" error.

Validation: both fields required, password rules, both must match.

## Change password screen

The user will:

1- Enter old password
2- Enter new password
3- Confirm new password
4- Save

When user saves => `changePassword()` api will be called.
- Success => message, then #LoginScreen (session is restarted).
- Failure => server message.

Rules: opened from #MoreScreen (optional) or after login when it is the first login / forced. When forced, the user cannot skip it.
Validation: all fields required, new password rules, new and confirm must match.

---

# 2. Main navigation

## Main navigation screen

The user will:

1- Switch between home, activities, requests, payslip and more

Rules:
- Activities appears only if the user has the activity permission (`RequestTypeId.activity`).
- Each of home, activities and requests shows a counter. `getNotificationMasterData()` api is called to get the counters. When the user opens one of them, the counter is set to 0 immediately and `markNotificationMasterAsSeen()` api is called. Payslip and more have no counter.
- When the user taps a push notification: request => opens #RequestDetails, activity => opens #ActivityDetails, payslip => opens #PayslipScreen for that month, other => shows the message.
- When there is no internet, an offline message is shown and the user can open #CheckInScreen to record attendance offline.

---

# 3. Home

## Home screen

The user will:

1- Open the screen
2- See own name and photo, welcome text and notification count => opens #ProfileScreen or #NotificationsScreen
3- See the calendar (month or week) and select a day
4- See check in / check out status for today
5- Check in or check out
6- Open quick access to requests (leave, short leave, leave encashment, loans, indemnity encashment, air ticket, half day leave, resume duty, business trip, other request, dynamic request, face recognition)
7- Open the AI assistant => opens #ChatV2Screen

When the screen opens => these api calls are made: `getHomeDataForDashboard()` (today's check in / check out time and data), `getPolicies()` (company policies, reset time is saved), `getNewsList()`, `getLastRequestsForDashboard()`, `getGrossSalaryAndCurrency()` (basic salary, allowances, gross, currency and digits are saved, they are used later by the request forms), `getLeaveCountInCalendarMobile()` and `getLeaveInCalendarMobile()` (calendar).

Calendar:
- Each day shows the events of that day: requests => opens #RequestDetails, activities => opens #ActivityDetails, general messages => opens #GeneralMessage.
- (Shift events: planned for the shifts feature, not implemented yet.)

Check in / check out:
When user taps check in or check out:
1- The time is refreshed. If trusted network time is not available, the user is told to restore internet and the attendance is not recorded.
2- Location permission and camera permission are required. If denied, attendance stops.
3- If face match is on for the company and the user has no saved reference image => message "reference image not found", attendance stops.
4- If face match is off => no photo is taken. Location and wifi are collected, then the punch is sent.
5- If face match is on => the camera opens (with liveness check if the company allows liveness, otherwise normal camera). The photo is compared with the saved reference image.
6- Location, geofence and wifi are collected (wifi name, BSSID and IP only if the company needs the wifi name).
7- The attendance is accepted only when: the face matched (if face match is on) and the user is inside an allowed geofence. If wifi is required and does not match, the result is reported as not allowed.
8- If accepted => `insertPunchFromDashboard()` api will be called with finger print number, location, time, wifi name, IP and MAC. Today's check in / out time is updated on the screen.
9- If the location cannot be read => "failed to get current location" message.
10- If the face or the geofence fails => result message (not matched / outside the allowed place), and nothing is saved.

Note: the time sent is the network time with the company UTC offset applied, not the phone time.

## AI chat screen (TalentLink AI, #ChatV2Screen)

The user will:

1- Write a message (or pick a suggestion)
2- Read the answer
3- Continue the conversation or start a request

How it works:
- Each message is routed (router prompt + domain router + intent classifier) to one capability. The AI provider can be the company third-party provider, OpenAI or Groq (set in config).
- Read capabilities (answer only): leave balance, my requests, payslip, attendance history (can mention an employee by name, managers only), company internal policy, labor law.
- Write capabilities (create a request): leave, short leave, loan, face recognition photo.
- A write capability collects the fields step by step, validates them, shows a summary, and calls the real request api only after the user gives a final confirmation of exactly the same values (`PermissionGuard`). Without final confirmation nothing is sent.
- The AI cannot use ids it was given by the model: employee and company access is resolved from the allowed list of the logged-in user.
- Recognised requests that have no executable tool are only suggested.
- Related older screens (one chat per request type: air ticket, business trip, half day leave, indemnity, leave encashment, resume duty, other request, dynamic request, loan, short leave, leave) exist under `features/ai_requests` and are opened from `AiChatEntryScreen` (route `/chatbot`), which is not reachable from the app menu.

(to confirm: which one of the two AI flows is the one shipped; chat v2 is the one opened from home.)

---

# 4. Activities (tasks and visits)

## Activities screen

The user will:

1- Choose the scope: my team, my activities, private
2- Choose the period: current month or previous
3- Switch between dashboard view and list view
4- Filter and sort
5- Open an activity => opens #ActivityDetails
6- Create a task or a visit => opens #ActivityCreate
7- Ask the AI about activities

Dashboard view: `getTaskAndVisitDashboard()` api will be called to get the overview (counts by status, tasks summary, visits summary) for the selected scope, period and filters.

List view:
- "main" quick filter shows main (master) activities: `getMainActivities` (`getVisitOrTaskMasterData`). Otherwise `getVisitAndTask()` / `getVisitAndTaskAssignedToLoggedInUser()` is called. Paging: more items are loaded as the user scrolls.
- Search by text, sort newest first or oldest first.
- Quick filters: current, previous, main, type (task / visit), scope, status, priority, department.

Filter options: type (task / visit), status (pending, in progress, cancelled, completed, rejected, partially completed), priority (`getPriorityList()`), department and employees, date range. Filter data is loaded once when the screen opens.

Each item shows: title, type, status, priority, assignee, dates.

Ask AI: the text is sent (`parseMessage`), the answer is converted to a filter (type, status, dates, ...) and applied to the screen. If the answer cannot be mapped, an error message is shown.

## Activity create screen (new / edit)

The user will:

1- Choose type: task or visit
2- Enter title
3- Choose priority
4- Select start and end date and time
5- Choose private or not
6- Select people: if private, the departments; otherwise the employees (a department can be picked as a whole with everything under it)
7- Visits only: category, execution type (one time - daily - weekly - monthly)
8- Weekly visit: days of the week (Saturday to Friday). Monthly visit: days of the month (1 to 31)
9- Visits only: location (map) => opens #LocationPicker
10- Contact name and phone (saved company contacts or a new contact)
11- Description
12- Attachments => #FilePreview

Calls:
- Filter data (categories, execution types, priorities, departments, employees) is loaded when the screen opens (`getCategoryList()`, `getTaskExecutionTypeList()`, `getPriorityList()`, `getMyTeamData()`).
- When start and end dates are chosen => `getEmployeesWorkload()` api will be called to show each employee's workload in that period, to help choose people.
- Contacts => `getMyContactsOrMyTeamContacts()`; new contact => `addNewCompanyContact()`, then the list refreshes.
- Edit => `getVisitOrTaskMasterData()` api will be called to load the activity into the form. The status is sent back unchanged.
- Submit => `insertVisitOrTask()` api will be called. Success => back to the caller. Failure => error message and the form stays.

Rules:
- A private activity has no employees (only the creator sees it).
- Changing the type clears what was entered, so a confirmation is shown first when something was entered.
- Create stays disabled until nothing is missing; tapping it with missing fields marks them and goes to the first one.
- When editing, save is enabled only when something changed.

Required: title, start and end dates, people (departments if private, otherwise employees). For a visit also: category, execution type, location, and the days for a weekly or monthly visit.

## Activity details screen

The user will:

1- Open the screen (from list, calendar, notification or request details)
2- See header and info: code, title, status, priority, category, type, assignee(s), people, dates, description, location, notes
3- See attachments => opens #FilePreview
4- See progress
5- Take actions (below)
6- Open the timeline => opens #ActivityTimeline

When the screen opens => `getVisitOrTaskDetails()` api will be called (or `getVisitOrTaskMasterData()` when the master activity is opened).

Actions (shown by the activity status):
- Add note: only when the status is open (pending or in progress). `addComment()` api.
- Check in / check out: visits only. Check in is offered if the category has check in and the user did not check in yet; otherwise check out if it has check out and not done yet; otherwise check out is disabled. Both are disabled when the activity is completed. `checkInOutWithLocation()` api (location is sent when the category requires it).
- Start: when pending. `startTaskWithLocation()` api. Status becomes in progress.
- End: when in progress. `completedTask()` api. Status becomes completed. Disabled in other statuses.
- Before check in, start and end, if the category has questions, `getTaskDynamicQuestion()` api will be called with the action id (1 check in, 2 check out, 3 start, 4 complete) and the user answers the questions first. The answers are sent with the action.
- Change status: choose a status and enter a note. `changeStatusWithReason()` api.
- Change schedule (reschedule): new start and end. `rescheduleTask()` api.
- Update progress: the user moves the progress and it is saved (`updateTaskProgress()` api).
- Master actions (master / main activity only): enable or disable the master (`activeInactive()` api), edit => opens #ActivityCreate.
- After each action the details are reloaded. If an action fails, the error is shown and nothing changes.

Rules:
- Edit is allowed only if the status is not cancelled, completed or rejected and the server marks the assignee as able to edit.
- Only one action can run at a time.

## Activity timeline screen

The user will:

1- Open the screen

`getTaskHistoryTimeline()` api will be called to get the events of the activity (summary and the events in order).

---

# 5. Requests

## Requests screen

The user will:

1- Choose my requests or my team (my team only if the user has the team request permission)
2- Pick a quick status filter (all, pending, approved, ...)
3- Open the filter: request type, status, request dates (from - to), created dates (from - to). On my team, also company and employee (for managers)
4- Open a request => opens #RequestDetails
5- Create a new request (only the types allowed by the user's ESS permissions) => opens the request screen

Calls:
- When the screen opens: filter data (`getTransactionStatusAndRequestTypes()`) and companies and employees (`getCompaniesAndEmployeesList()`).
- My requests => `getEmployeeRequests()` api with status, type and dates.
- My team => `getMyTeamRequest()` api with manager id, company, employee, type, status and dates.
- Calls are re-made when switching between my requests and my team, quick filter and filter apply. If an older response arrives after a newer call, it is ignored.

Rule: a normal employee (no team attendance permission) does not get the company / employee filter.

## Request details screen

The user will:

1- Open a request from the list, notification or calendar
2- See employee and request header with status
3- See request info (depends on the type: dates, times, balance, amounts, dynamic fields, contact, address, assets, remarks)
4- See attachments => opens #FilePreview
5- See the employee's activities (manager view, if activity permission) => opens #ActivitiesScreen filtered
6- Approve or reject (approver only, team request)
7- Open the timeline => opens #RequestTimeline

When the screen opens => `getRequestDetails()` api will be called with the transaction id and request type, then the type specific details api (`getLeaveDetails`, `getShortLeaveDetails`, `getHalfDayLeaveDetails`, `getLeaveEncashmentDetails`, `getIndemnityEncashmentDetails`, `getLoanDetails`, `getAirTicketDetails`, `getResumeDutyDetails`, `getBusinessTripDetails`, `getOtherRequestDetails`, `getAssetDetails`, `getContactDetails`, `getAddressDetails`, `getEducationDetails`, `getAttachmentDetails`, `getFaceRecognizeDetail`, dynamic request).

When user taps approve or reject => a reason (remarks) is asked, then `approveRequest()` or `rejectRequest()` api will be called with transaction id, request type, employee id and remarks. Success => message and the screen refreshes. Failure => error message.

Rules:
- Approve / reject are visible only to the current approver of the request, and can be disabled by the server state.
- A request can be cancelled by its owner with `cancelRequest()` api (to confirm: where this is offered in the screen).

## Request timeline screen

`getTimeLine()` api will be called to show the approval steps (approver, action, date, remarks).

## Leave screen

The user will:

1- Select type of leave
2- Select start date and end date
3- Select expected resume date
4- Select payroll settlement (by payroll or not) and payment method (when by payroll)
5- Select alternative employee
6- Enter address during leave
7- Enter contact number
8- Enter reasons
9- Enter remarks
10- Attachment
11- Submit

Calls:
- When the screen opens: `leaveTypes()`, `getAllMandatoryFields()`, `alternativeEmployee()`, `paymentMethod()` api are called.
- When user selects a type => `allowThisDate()` api will be called to know if the request can be made for today and for back dates. The dates are cleared when the type changes.
- When type, start date and end date are all selected, or payment settlement changes => `calculateInCaseNewLeave()` api will be called to get the leave info: current balance, yearly balance, remaining balance, leave days, total amount, and the leave type that is added when there is no balance. The holidays in the selected period are taken into account in the calculation.
- Displayed from the calculation: current balance, yearly balance, remaining balance, leave days, total amount ("calculated by your policy").

Submit => `insertLeave()` api will be called (with the attachment). If the calculation failed, its error is shown instead and nothing is sent. Success => success message and back. Failure => error message.

Validation: type, start date, end date, expected resume date required. Start / end / resume dates must be valid in order. Payment method required when settled by payroll. Contact number format is validated. Other fields (alternative employee, address, contact, reasons, remarks, attachment) are required only if the server marks them mandatory.

## Short leave screen

The user will:

1- Select type of short leave
2- Select date
3- Select start time and end time
4- Enter reference name and reference contact number
5- Enter reasons
6- Enter remarks
7- Attachment
8- Submit

Calls:
- When the screen opens: `shortLeaveTypes()`, `getAllMandatoryFields()`.
- When type, date and times are filled => `calculateInCaseShortLeave()` api will be called (uses the employee's basic salary and allowances) to get the current balance, remaining balance and the deduction ("calculated by your policy"), which are displayed.
- Submit => `insertShortLeave()` api. Success => message and back.

Validation: type, date, start time and end time are required, the end time must be after the start time. The rest is required only if mandatory from the server.

## Half day leave screen

The user will:

1- Select half day type
2- Select date
3- Select start time and end time
4- Number of minutes (calculated)
5- Enter reasons, remarks, attachment
6- Submit

Calls: `halfDayTypes()`, `getAllMandatoryFields()` at open. On submit, `calculateInCaseHalfDayLeave()` api is called first, then `insertHalfDayLeave()` api (success message from the server).
Validation: type, date, start and end time, number of minutes required; times must be valid.

## Leave encashment screen

The user will:

1- Select type of encashment
2- Select requested date
3- Enter requested days
4- Select payment method
5- Remarks, attachment
6- Submit

Calls: `leaveEncashmentTypes()`, `getAllMandatoryFields()`, `paymentMethod()`, `getEmployeePolicyProfileLeaveEncashmentDetails()` (policy details) at open. When the days are entered => `calculateInCaseLeaveEncashment()` api will be called to display current balance, yearly balance, remaining balance and total amount. Submit => `insertLeaveEncashment()` api.
Validation: type, requested date and requested days required; the days cannot be more than the available balance (to confirm exact rule); payment method required when settled by payroll.

## Indemnity encashment screen

The user will:

1- Select requested date
2- Enter requested days
3- Select payment month
4- Select payment method
5- Remarks, attachment
6- Submit

Calls: `getIndemnityEmployee()` (employee indemnity data), `paymentMethod()`, `getAllMandatoryFields()` at open. On submit => `calculateInCaseIndemnityEncashment()` api, then `insertIndemnityEncashment()` api.
Validation: requested date, requested days, payment month required; payment method when settled by payroll.

## Loans screen

The user will:

1- Select type of loan
2- Select requested date
3- Select loan start date
4- Choose the calculation: by installments or by installment amount
5- Enter requested amount
6- Enter number of installments
7- See profit rate and total amount
8- Select payment method
9- Remarks, attachment
10- Submit

Calls: `loanTypes()`, `paymentMethod()`, `getAllMandatoryFields()` at open. When the amount, installments or the calculation type change => `calculateInCaseLoan()` api will be called to get the profit rate, total amount and installment values. Submit => `insertLoan()` api (basic salary, allowances and currency are sent with it).
Validation: type, requested date, start date, requested amount, installments required; installments number can be a decimal that is rounded.

## Air ticket screen

The user will:

1- See the air ticket entitlement (due month and due year) from the employee's record
2- Select requested date
3- Select payment method
4- Submit

Calls: `getAirTicketByEmployee()` (due month / year of the ticket), `getDependentAirTicket()` (dependents), `paymentMethod()` at open. On submit => `calculateInCaseAirTicket()` api is called with the requested date, and its result is shown for confirmation, then `insertAirTicket()` api sends the request.
Validation: requested date, due month, due year required; payment method when settled by payroll.

## Resume duty screen

The user will:

1- Select reference type (the leave / trip the user is returning from)
2- Select reference data (the specific one of that type)
3- Select actual resume duty date
4- Select payment method
5- Remarks, attachment
6- Submit

Calls: `resumeDutyReferenceType()` at open; when the reference type changes => `resumeDutyReferenceData()` api for that employee and type. On submit => `calculateInResumeDuty()` api then `insertResumeDuty()` api.
Validation: reference type, reference data, actual resume date required.

## Business trip screen

The user will:

Step 1:
1- Select business trip type
2- Select departure date and return date
3- Duration
4- Expected resume duty date and actual resume duty date
5- Select payment method
6- Enter trip purpose
7- Next

Step 2 (destinations):
1- Country and city
2- Flight date
3- Visa required, visa amount
4- Ticket amount, hotel amount, per diem amount
5- Add (adds the destination to the trip)
6- Remarks, attachment

Rules: the first step is validated before the second. Countries and cities are a fixed sample list in the code (India, Kuwait, Egypt). No submit api exists in the code (the request cannot be created yet) (to confirm: is the screen finished).

## Other request screen

The user will:

1- Select request type
2- Select requested date
3- Enter notes
4- Remarks, attachment
5- Submit

Calls: `otherRequestTypes()`, `getAllMandatoryFields()` at open; submit => `insertOtherRequest()` api.
Validation: request type and requested date required; notes, remarks, attachment only when mandatory from the server.

## Dynamic request screen

The user will:

1- Select request type (the list comes from the server)
2- Select requested date
3- Fill the fields of that request (field list and types come from the server: text, number, phone, text area, single choice, radio, checkbox, file)
4- Notes
5- Submit

Calls: `dynamicRequestType()` at open. When the type is selected => `dynamicForm()` api will be called with the form id to get the fields. Submit => `addDynamicRequest()` api (with the file if there is a file field).
Validation: request type and requested date required. Each field that the server marks required must have a value (single-choice value 0 / -1 is empty). If something is missing, the first missing field is shown and no api is called.

## Face recognition screen (request)

The user will:

1- Upload a face photo (take it with the camera => opens #Camera)
2- Retake if needed
3- Submit

Calls: `getFaceRecognize()` (shows the current face image if there is one). Submit => `insertFaceRecognize()` api (file upload). After approval the photo becomes the reference image used for check in.

---

# 6. Payslip

## Payslip screen

The user will:

1- Select month and year
2- See salary summary (total, number of days)
3- See earnings
4- See deductions
5- See payment by company
6- Open the payslip document (external file)

When the screen opens, or the month changes => `payslip()` api will be called with employee id, month and year.
If it fails, an error is shown. The notification flow opens the same screen with the month of the notification.

---

# 7. More

## More screen

The user will:

1- See profile summary => opens #ProfileScreen
2- Work overview: upcoming calendar (only with the upcoming calendar permission) => #UpcomingCalendar, attendance => #AttendanceScreen, leave balance => #LeaveBalanceScreen, shifts => #ShiftsScreen
3- Account settings: change password => #ChangePasswordScreen, notifications on / off, language English / Arabic
4- Information: terms and conditions, report issue, about us
5- App info: company logo opens the company website, app version
6- Logout

Notifications on / off => `updateAllowNotification()` api is called (1 or 0) and the choice is saved.
Language change => saved, and the app restarts to apply it.
Logout (after confirmation) => `logout()` api, then the session is cleared and #LoginScreen opens.

## Profile screen

The user will:

1- See personal data: name, employee id, position, email, direct manager
2- Change profile photo (camera or gallery)
3- Open: my documents, business card (permission), contacts (permission), addresses (permission)

When the screen opens => `getProfileEmployee()` api will be called.
When the photo is changed => `insertAttachment()` api will be called (attachment type 12). Success => the new photo is shown. Failure => error message.

## Files screen (my documents)

`getFiles` (documents api, with the user's password) will be called. Each document shows name, expiry date, days left or expired. The user can download or open it => #FilePreview or #ImageSlider.

## My business card

`getBusinessCard()` api will be called. The user can save the card to the gallery (storage permission) or share it.
There is also a public business card page (web) that shows a card and lets the visitor save the contact.

## Profile contacts screen

`getEmployeeContacts()` api will be called to show contacts. Add or edit => opens #ContactScreen.

## Contact screen (add / edit)

The user will: 1- select contact type, 2- enter contact number, 3- save.
Calls: `getContactTypeList()` at open; save => `insertContact()` api. The change goes through the request flow (it appears as a request) (to confirm).
Validation: type and number required, number format validated.

## Profile addresses screen

`getEmployeeAddresses()` api will be called. Add or edit => opens #AddressScreen.

## Address screen (add / edit)

The user will: 1- enter address name, 2- select area, 3- enter building, 4- flat, 5- floor, 6- street, 7- save.
Calls: `getAreaList()` at open; save => `insertAddress()` api.
Validation: all fields required.

## Upcoming calendar screen

The user will:

1- Select a month and see the days that have leaves, with the number of leaves
2- Filter (request types, company, employee)
3- Select a day and see the leaves grouped for that day => opens #RequestDetails, #ActivityDetails or #GeneralMessage

Calls: `getLeaveCountInCalendarMobile()` for the month, `getLeaveInCalendarMobile()` for the days. Filter options come from `getAllReferencesTypesForCalendar()` and `getCompaniesAndEmployeesList()`. Apply and reset reload both. Closing the filter without apply restores the previous selection.
Visible only with the upcoming calendar permission.

## Attendance screen (attendance comparative)

The user will:

1- Switch between dashboard and list (both use the same filter)
2- Open the filter: company, employee, date from - to, attendance transaction type
3- Dashboard => #AttendanceTypeDetails or #LeaveTypeEmployees
4- List => #AttendanceEntryDetail

When the screen opens => filter data is loaded once (companies, employees, transaction types via `getAttendanceTransactionType()`). The default period is today.
Rule: a manager can pick company and employee. A normal employee only sees own data (the list is always "by employee" and falls back to himself). (to confirm: the More row has no permission check.)

Dashboard: `getAttendanceDashboardSummary()` api will be called to show present, absent, on leave, issues (late, early, ...), by leave type, and pending requests summary.
List: `getFilteredAttendance()` api will be called. The user can group by date or by employee and search employees by name; each change reloads the list.

## Attendance entry detail screen

`getAttendanceDetailsById()` api will be called. Shows the day: shift, check in / out, worked hours, late / early / extra minutes, tasks and visits. Opens #AttendanceEntryLog.

## Attendance entry log screen

Shows the attendance log of the day (each punch with time, location, type) and policy violations.

## Attendance type details screen

Shows the employees of one status chosen from the dashboard (date, check in / out, late / early minutes).

## Leave type employees screen

Shows the employees on one leave type chosen from the dashboard (from date, to date).

## Leave balance screen

`getLeaveBalance()` api will be called. Shows each leave type with current balance and yearly balance.

## Shifts screen

(Built on this branch against sample data. Full rules in `004-shifts/user-scenarios-rules.md`. Real API not connected yet.)

The user will:

1- Open the screen from #MoreScreen (or from a shift event on the home calendar, when it exists)
2- See "My shift": an entry per day of the period, with 0..n shifts (name, start - end), or "Day off", or "Not assigned yet"
3- See "My team" (only with the new team permission): everyone under the manager in the hierarchy, grouped by day then shift, with employee name and department, and a day-off group
4- Move the period back / forward by its own length, or go to today
5- Filter: date range, shift type; on the team also department and employee. Reset returns to 7 days from today

Rules:
- First period is today and the next 6 days. After that the period is whatever the user selects, with no length limit.
- Both views share one period and one filter; changing it reloads both.
- The filter count includes the period when it is not the first period.
- The shift type filter removes assigned days without that type (no day off either).
- Shift entries and employee items are read only.
- Not in scope: overnight shifts, leaves and holidays on this screen, swap requests, editing.
(to confirm: the team permission id; today the team part is open to everyone in the code.)

---

# 8. Notifications and messages

## Notifications screen

The user will:

1- Open the screen
2- See notifications, more load as the user scrolls (10 per page)
3- Open one => request => #RequestDetails, activity (only with activity permission) => #ActivityDetails, payslip => #PayslipDetails, other => #GeneralMessage
4- Mark one as read (when opened)
5- Mark all as read

`getNotifications()` api is called with page size and page number. `markAsReadNotification()` api is called with the notification id, or with -1 to mark all as read (then the list reloads from the first page).

## General message screen

Shows the text of a message (from the calendar or a notification).

---

# 9. Information

## Report issue screen

The user will: 1- open the screen, 2- send the report.
The latest buffered app logs are moved into the log file first, then `saveErrorLog()` api will be called with the logs. Only if it is sent successfully, the local log file is cleared.

## Terms and conditions, About us

Static content. About us loads its content from the app (`about_us` bloc).

---

# 10. Shared and offline

## Camera and camera with liveness

Take a face photo. With liveness, the user must complete the liveness check (blink / move) before the photo is returned. The photo goes back to the caller (check in / out, face request). A file is returned only on success, otherwise the caller stops.

## Location picker

The user picks a location on the map and confirms. The selected latitude, longitude and address return to #ActivityCreate.

## File preview and image gallery

Open an attachment (image, PDF or other file) from the request, activity or documents. Images can be browsed one after another.

## Check-in screen (offline attendance)

Opened from the offline message when there is no internet.
The user will:

1- Take a face photo
2- The face is compared on the device with the saved face data
3- Location and geofence are checked (wifi too, when needed)
4- The attendance is saved on the device with the image
5- When the internet is back, the saved attendance is sent to the server (at the next app start, and by the sync service) with its images, then removed locally

Rule: the time used is the trusted network time saved before; if it cannot be trusted, the attendance is not recorded.

## Searchable screen

A shared screen used by the request forms to pick one item from a long list (alternative employee, types, ...). The user searches and selects one item that returns to the form.

---

# 11. Hidden, unfinished or inconsistent (found while reading)

- `/chatbot` (`AiChatEntryScreen`) and the one-chat-per-request screens under `features/ai_requests` are not reachable from the menus.
- #BusinessTripScreen has no submit api in the code and uses sample countries / cities.
- #ShiftsScreen uses sample data, and its team permission is open to everyone (`canSeeTeam: true`).
- `ApiLogsScreen` and `NotificationDebug` are debug screens with no entry.
- Routes declared without a screen: `/myRequests`, `/attendanceHistory`.
- #LeaveBalanceScreen is reachable only from More.
