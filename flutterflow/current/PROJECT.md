# Purrbi V2 development

## Pages

- OnboardingPage `/`: pages/onboarding_page.dart
- SignInPage `/`: pages/sign_in_page.dart
- SignUpPage `/`: pages/sign_up_page.dart
- HomeMainPage `/`: pages/home_main_page.dart
- ForgotPasswordPage `/`: pages/forgot_password_page.dart
- ForgotVerificationsPage `/` (String email): pages/forgot_verifications_page.dart
- ResetPasswordPage `/`: pages/reset_password_page.dart
- ChangePasswordPage `/`: pages/change_password_page.dart
- MyProfilePage `/`: pages/my_profile_page.dart
- EditProfilePage `/`: pages/edit_profile_page.dart
- NotificationPage `/`: pages/notification_page.dart
- VerificationsPage `/` (String email): pages/verifications_page.dart
- DemoPage `/`: pages/demo_page.dart
- FaqPage `/`: pages/faq_page.dart
- FavouritePage `/`: pages/favourite_page.dart
- PaymentMethodPage `/`: pages/payment_method_page.dart
- SettingsPage `/`: pages/settings_page.dart
- MySubscriptionPage `/`: pages/my_subscription_page.dart
- HelpSupportPage `/`: pages/help_support_page.dart
- PaymentFailedPage `/`: pages/payment_failed_page.dart
- SelectReasonPage `/`: pages/select_reason_page.dart
- DeleteAccountPage `/`: pages/delete_account_page.dart
- ResultPage `/` (UnsupportedUploadedFile uplodImage, String title): pages/result_page.dart
- ResultDetailsPage `/` (ImagePath images, String title): pages/result_details_page.dart
- HistorySaveDetailsPage `/` (ImagePath images, String title): pages/history_save_details_page.dart
- PhotoTipsPage `/`: pages/photo_tips_page.dart
- RecentidentifierPage `/`: pages/recentidentifier_page.dart
- PopularfootprintPage `/`: pages/popularfootprint_page.dart
- TrendingnowPage `/`: pages/trendingnow_page.dart
- CategopriePage `/` (String appbarName): pages/categoprie_page.dart
- CategoprieListPage `/`: pages/categoprie_list_page.dart
- ChatPageComponent ("ChatPage" in FlutterFlow) `/`: pages/chat_page.dart
- BlogPage `/`: pages/blog_page.dart
- ReviewSummaryPage `/` (int paymentIndex): pages/review_summary_page.dart
- PrivacyPolicyPage `/`: pages/privacy_policy_page.dart
- SearchPage `/`: pages/search_page.dart
- IdentifierPage `/`: pages/identifier_page.dart
- MySubscriptionDetailPage `/`: pages/my_subscription_detail_page.dart
- AboutUsPage `/`: pages/about_us_page.dart
- PremiumPage `/` (bool isEmpty): pages/premium_page.dart
- MyEmptySubscriptionPage `/`: pages/my_empty_subscription_page.dart
- WelcomeScreenPage `/`: pages/welcome_screen_page.dart
- AIAssistantPage `/`: pages/aiassistant_page.dart
- SplashPage `/` (initial): pages/splash_page.dart
- TermsConditionPage `/`: pages/terms_condition_page.dart
- SubscriptionCancelPage `/`: pages/subscription_cancel_page.dart
- BlolgDetailPage `/` (BolgModel blogDetail): pages/blolg_detail_page.dart
- AnalysisResultPage `/` (UnsupportedUploadedFile imageUpload, String scanType): pages/analysis_result_page.dart

## Components

- CenterAppbar (String title): components/center_appbar.dart
- MainAppbar (String title, bool isBack, UnsupportedAction backAction, bool isEdit, UnsupportedAction editAction, bool isShare, UnsupportedAction shareAction): components/main_appbar.dart
- LogOutComponent (UnsupportedAction isLogOutTap): components/log_out_component.dart
- PasswordResetDialog (UnsupportedAction onTapOk): components/password_reset_dialog.dart
- DeleteAccountDialog (UnsupportedAction onTapOk): components/delete_account_dialog.dart
- ProfileComponent: components/profile_component.dart
- RowComponent (String text, bool isShow, UnsupportedAction viewAllAction): components/row_component.dart
- HistoryComponent: components/history_component.dart
- AppearanceComponent: components/appearance_component.dart
- AppLogo (double height, double width): components/app_logo.dart
- NoInternetComponent: components/no_internet_component.dart
- NoHistoryYetComponent: components/no_history_yet_component.dart
- NoNotificationComponent: components/no_notification_component.dart
- NoResultsComponent: components/no_results_component.dart
- ScanComponent (MainDataModel detail, UnsupportedAction onTap): components/scan_component.dart
- ProcessingPaymentComponent: components/processing_payment_component.dart
- PremiumBuySuccessDialog (UnsupportedAction onTapOk): components/premium_buy_success_dialog.dart
- GenerationFailedDialog: components/generation_failed_dialog.dart
- BlogComponent (BolgModel detail, UnsupportedAction onTapAction, double width): components/blog_component.dart
- RecentIdentifier (RecentiModel detail, UnsupportedAction onTapAction): components/recent_identifier.dart
- UserMessageSheetComponet (UnsupportedAction copyAction, UnsupportedAction shareAction, UnsupportedAction editAction, UnsupportedAction selectTextAction): components/user_message_sheet_componet.dart
- BotMessageSheetComponet (UnsupportedAction copyAction, UnsupportedAction shareAction, UnsupportedAction selectTextAction): components/bot_message_sheet_componet.dart
- SelectTextBottomSheet (String textData): components/select_text_bottom_sheet.dart
- MiniLogo (double hight, double width): components/mini_logo.dart
- Noidentificate: components/noidentificate.dart
- Card4: components/card4.dart
- Card3: components/card3.dart
- WeCouldntIdentifyComponent: components/we_couldnt_identify_component.dart
- Card1No (String title): components/card1_no.dart
- TipsBottomComponent: components/tips_bottom_component.dart
- ExploreComponent: components/explore_component.dart
- Card1 (String title): components/card1.dart
- Card2: components/card2.dart
- NoDataFoundComponent: components/no_data_found_component.dart
- HomeComponent: components/home_component.dart

## Action blocks

Reusable action chains, written as methods (scoped to their page or component) or as functions in action_blocks.dart (app-level). Call one from an action, e.g. `internetSnackbar();`

- internetSnackbar(): action_blocks.dart (app-level)
- mainSanckbar(String title): action_blocks.dart (app-level)
- AddOrRemoveIdentificationFavourite(MainDataModel data): action_blocks.dart (app-level)
- DataClearBlock(): action_blocks.dart (app-level)

## Schema

schema.dart: structs IntroModel, LoginModel, NotificationsModel, ChatModel, HelpSupportModel, MainChatModel, MainDataModel, ChooseStyleModel, BolgModel, RecentiModel, CategorieModel; app state isIntro, isLogin, isPro, userDetail, modeIndex, packageName, appName, connected, deviceId, currencyType, introList, countryName, homePageIndex, searchList, notificationsList, defTimeZoneName, randomChat, messageList, faqList, mainChatModelList, favouriteDataList, isAdsTap, historyList, BolgDataList, RecentidentifierList, categorieDataList, MainDataList, selectExplore, isSpeaking

## Theme

theme.dart: colors primary ... info + 25 custom (grey20, lightGray, grey40, grey, lightRed, borderColor, ...); fonts Nunito; text styles displayLarge ... bodySmall; tokens: 5 spacing, 4 radius, 4 shadow; dark mode also supported (the canvas, previews and light-mode phones show the light values)
icons.dart: 1 custom icon family (YogaPoseIdentifier)

## Design conventions

Computed from this project's 48 pages and 35 components. Match them in new screens and change them only when asked.

- Text styles by use: bodyMedium 401×.
- Gaps between children of a Column or Row (`spacing:`): 8 (83×), 16 (63×), 12 (47×).
- Buttons (43): fill primary (34 of 36); text titleSmall; height 56; radius 16 (31 of 43); elevation 0.
- Text fields (20): filled, outlined; fill buttonBg (19 of 20); label on 0 of 20, hint on 20 of 20.
- Cards (Containers with a radius, border or shadow; 189): shadow on 2 of 189; border 1 borderColor (81 of 105).
- Components reused on 2 or more pages (use these before building a new one):
  - MainAppbar (31 pages): takes title, isBack, backAction, isEdit, ...; root Container
  - MiniLogo (7 pages): takes hight, width; root Container
  - ScanComponent (6 pages): takes detail, onTap; root Container
  - Card2 (3 pages): takes no parameters; root Container
  - Card3 (3 pages): takes no parameters; root Container
  - and 4 more (see Components above)

## Settings

settings.dart: AppNames, AppIcon, ErrorImage, Platforms, Permissions (2), 5 pub packages, 14 app constants

## Custom code

Call a custom function in any value or action by name, e.g. `getCountryCodeInit(code)`.

- Widget CirculatIndicatorWhite(): custom_code/widgets/circulat_indicator_white.dart
- Action connected(): custom_code/actions/connected.dart
- Action getCountryCodeLocal(): custom_code/actions/get_country_code_local.dart
- Action lockOrientation(): custom_code/actions/lock_orientation.dart
- Action getCurrencySymbol(String currencyCode) -> String: custom_code/actions/get_currency_symbol.dart
- Action getPackageName() -> String: custom_code/actions/get_package_name.dart
- Action shareContent(String? content): custom_code/actions/share_content.dart
- Action textToSpeech(String text): custom_code/actions/text_to_speech.dart
- Action stopTTS(): custom_code/actions/stop_tts.dart
- Function getCountryCodeInit(String code) -> String: custom_code/functions.dart
- Function searchFunction(String? search, List<MainDataModelStruct> list) -> List<MainDataModelStruct>: custom_code/functions.dart
- Function getGreeting(DateTime? currentTime) -> String?: custom_code/functions.dart
- Function convertMDToST(String? markDownText) -> String?: custom_code/functions.dart
- Function isLikelyBarcode(String? code) -> bool: custom_code/functions.dart
- Packages (add or remove in settings.dart): package_info_plus any, internet_connection_checker_plus ^2.9.1+2, in_app_review ^2.0.6, share_plus ^10.0.2, flutter_tts ^4.2.5
