# TalentLink360 — App Map (high level description)

Source: `~/StudioProjects/talentlink` (branch `testflight`), read 2026-11-12.
Covers the single employee/manager Flutter app. Manager parts are shown by ESS permissions, not a separate app.

---

## Auth

#SplashScreen
1- version check ( mandatory / optional update dialog )
2- auto route => opens #LoginScreen or #navMainScreen

#LoginScreen
1- sign in ( company code, email or phone, password, remember me )
2- biometric login ( if enabled on device )
3- forgot password => opens #ForgotPasswordScreen
4- sign up => opens #RegisterScreen
5- deactivated account message ( when account is deactivated )
6- first login => opens #ChangePasswordScreen ( must change password )

#RegisterScreen
1- create account ( profile photo, name, company code, email, phone, password ) => back to #LoginScreen

#ForgotPasswordScreen
1- send reset ( company code, email ) => opens #OtpVerificationScreen

#OtpVerificationScreen
1- verify code ( resend with timer, expired state ) => opens #ResetPasswordScreen

#ResetPasswordScreen
1- set new password => back to #LoginScreen

---

## Main navigation

#navMainScreen has tabs ( home - activities ( if activity permission ) - requests - payslip - more )
- tab badges ( counters per tab )
- push notification tap => switches tab and opens the item ( request => #RequestDetails, activity => #ActivityDetails, payslip => #Payslip month, other => message dialog )
- offline banner ( when no internet ) => opens #CheckInScreen ( offline attendance )

---

## Home tab

#HomeScreen
1- user header ( photo, name, welcome, notification count ) => opens #ProfileScreen, #NotificationsScreen
2- calendar ( month / week toggle, events of selected day ) => opens #RequestDetails, #ActivityDetails, #GeneralMessage
3- check in / out ( current status, face photo + location + wifi ) => opens #CameraWithLiveness or #Camera
4- AI assistant button => opens #ChatV2Screen

#ChatV2Screen ( TalentLink AI )
1- chat with AI ( text, choices, attachments, can start requests ) (to confirm: which requests it can create)

---

## Activities tab ( tasks & visits )

#ActivitiesScreen
1- scope ( my activities / main / private ) (to confirm: exact meaning of main)
2- dashboard view ( overview donut, tasks summary, visits summary )
3- list view ( search, quick filters, sort newest / oldest ) => opens #ActivityDetails
4- filter sheet ( type, status, priority, department, dates )
5- create task / visit => opens #ActivityCreate
6- ask AI about activities ( chat sheet )

#ActivityDetails
1- header and info ( status, priority, category, assignee, people, dates, check times )
2- progress ( progress slider and card )
3- attachments => opens #FilePreview
4- actions ( start / end, check in / out for visits, add note, change status, change schedule, step questions )
5- master actions ( enable / disable, edit ) ( master/main activity only ) => opens #ActivityCreate
6- timeline => opens #ActivityTimeline

#ActivityCreate ( new / edit )
1- activity form ( category, priority, execution type, department, dates, location, attachments ) => opens #LocationPicker, #FilePreview

#ActivityTimeline
1- events of the activity ( summary, list of events )

---

## Requests tab

#RequestsScreen
1- tabs ( my requests / my team ( if team-request permission ) )
2- quick status filter ( all / pending / ... )
3- filter sheet ( type, status, date; company and employee on team tab for managers )
4- list of requests => opens #RequestDetails
5- new request ( sheet of request types allowed by permission ) => opens the create screens below

#RequestDetails
1- employee and request header ( status )
2- request info ( dates, leave balance, dynamic fields, contact / address, assets, remarks )
3- attachments => opens #FilePreview
4- employee activities ( manager view, if activity permission ) => opens #ActivitiesScreen filtered
5- approve / reject ( approver only, team requests )
6- timeline => opens #RequestTimeline

#RequestTimeline
1- approval steps of the request

Create request screens ( one form each, all end with submit and return to the caller )
- #LeaveScreen ( type, dates, payment, alternative employee, address/contact during leave, attachments )
- #ShortLeaveScreen ( type, date, start / end time, reference contact )
- #HalfDayLeaveScreen
- #LeaveEncashmentScreen
- #IndemnityEncashmentScreen
- #LoansScreen
- #AirTicketScreen
- #BusinessTripScreen
- #ResumeDutyScreen
- #OtherRequestScreen
- #DynamicRequestScreen ( fields come from server )
- #FaceRecognizeScreen ( upload / retake face photo ) => opens #Camera
- shared pickers => #SearchableScreen ( pick from long lists ), #FilePreview

---

## Payslip tab

#PayslipScreen
1- month picker
2- salary summary ( total, number of days )
3- earnings and deductions
4- payment by company
5- payslip document link ( opens external file )

#PayslipDetails ( same screen opened from a notification, own month )

---

## More tab

#MoreScreen
1- profile card => opens #ProfileScreen
2- work overview ( upcoming calendar ( if permission ), attendance dashboard, leave balance ) => opens #UpcomingCalendar, #AttendanceScreen, #LeaveBalanceScreen
3- account settings ( change password, notifications, language EN / AR ) => opens #ChangePasswordScreen, #NotificationsScreen
4- information & legal ( terms, report issue, about us ) => opens #TermsConditions, #ReportIssueScreen, #AboutUs
5- app info ( logo opens company website, version )
6- logout ( confirm ) => opens #LoginScreen

#ProfileScreen
1- personal data ( name, employee id, position, email, direct manager )
2- quick actions ( my documents, business card ( if permission ), contacts ( if permission ), addresses ( if permission ) ) => opens #FilesScreen, #MyBusinessCard, #ProfileContacts, #ProfileAddresses

#FilesScreen ( my documents )
1- documents list ( expiry date, days left / expired, download ) => opens #FilePreview, #ImageSlider

#MyBusinessCard
1- business card ( save to gallery, share )

#ProfileContacts => opens #ContactScreen ( add / edit contact )
#ProfileAddresses => opens #AddressScreen ( add / edit address )

#UpcomingCalendar
1- month calendar with leave counts
2- filter
3- leaves grouped by day => opens #RequestDetails, #ActivityDetails, #GeneralMessage

#AttendanceScreen ( attendance comparative )
1- tabs ( dashboard / list ) with shared filter
2- dashboard ( present, absent, on leave, issues, by leave type ) => opens #AttendanceTypeDetails, #LeaveTypeEmployees
3- list ( by date / by employee, search employees ) => opens #AttendanceEntryDetail
(to confirm: is this screen team-only, the More row has no permission check)

#AttendanceEntryDetail
1- day details ( shift, check in / out, worked hours, late / early / extra minutes, tasks / visits ) => opens #AttendanceEntryLog

#AttendanceEntryLog
1- attendance log and policy violations

#AttendanceTypeDetails
1- employees for one status ( date, check in / out, late / early minutes )

#LeaveTypeEmployees
1- employees on one leave type ( from / to )

#LeaveBalanceScreen
1- balance per leave type ( current / yearly )

#NotificationsScreen
1- notifications list => opens #RequestDetails, #ActivityDetails ( if permission ), #PayslipDetails, #GeneralMessage

#GeneralMessage
1- message text

#ChangePasswordScreen
1- change password ( forced on first login ) => #LoginScreen after save

#ReportIssueScreen
1- send issue report ( sends app logs )

#TermsConditions, #AboutUs ( static content )

---

## Screens reached from elsewhere

- #CameraWithLiveness / #Camera — face photo for check in/out and face request
- #LocationPicker — map pick for activity create
- #FilePreview, #ImageSlider — shared attachment viewers
- #CheckInScreen — offline attendance ( face on device ), from offline banner

---
 
## Same feature in more than one place
- profile: #HomeScreen header, #MoreScreen profile card
- notifications: #HomeScreen header, #MoreScreen account settings
- calendar of leaves/events: #HomeScreen calendar, #UpcomingCalendar
- new request: #RequestsScreen new request sheet, #ChatV2Screen (to confirm)
- AI chat: #HomeScreen AI button ( #ChatV2Screen ), #ActivitiesScreen chat sheet
- activities list: Activities tab, #RequestDetails employee activities
- payslip: Payslip tab, #PayslipDetails from notifications

## Hidden or hard to reach
- #LeaveBalanceScreen only from More ( home has an unused "see more balance" hook )
- #AttendanceEntryLog is 4 steps deep ( More → Attendance → Entry detail → Log )
- In routes but no entry in the app: `/chatbot` ( AiChatEntryScreen ), `/checkInScreen` route ( only via offline banner ), `/photoPreview`, `/confirmationEmail`
- Declared but no screen: `/myRequests`, `/attendanceHistory`
- Debug screens with no entry: ApiLogsScreen ( button commented out ), NotificationDebug

## Shared across screens
- offline banner and offline check-in
- language EN / AR ( from More )
- permission gates ( activity, team requests, team attendance, upcoming calendar, business card, contact, address )
- attachment viewers ( #FilePreview, #ImageSlider )
