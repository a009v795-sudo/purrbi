// App settings and integrations. Edit a value, add a declaration to enable an
// integration, delete one to disable it, then push. `secret` is a stored key
// fft does not show; push keeps it.
// Declarations: AppNames, RevenueCat, Stripe, Braintree, Razorpay,
// PushNotifications, OneSignal, GoogleMaps, AdMob, Gemini, Mux, Algolia,
// FirebaseAnalytics, FirebaseCrashlytics, FirebasePerformanceMonitoring,
// FirebaseRemoteConfig, FirebaseAppCheck, Sqlite, AppIcon, Splash, ErrorImage,
// Web, Platforms, BuildSettings, Supabase, BottomNav, MainDart, Permissions,
// Languages, DynamicLinks.

final appIcon = AppIcon(
  image:
      'projects/a-i-barcode-identifier-app-ahbvz7/assets/u00gl6ef3s25/app-logo-barcode.png',
  androidForeground:
      'projects/a-i-barcode-identifier-app-ahbvz7/assets/u00gl6ef3s25/app-logo-barcode.png',
  androidBackgroundColor: primaryBackground,
);

final errorImage = ErrorImage(
  image: 'projects/aura-cal-app-mlzal5/assets/jyfepj1759w4/error_image.png',
);

final platforms = Platforms(
  enableWeb: true,
  enableMacos: false,
  enableWindows: false,
  enableLinux: false,
  disableIpad: false,
);

final permissions = Permissions(
  camera: '',
  photoLibrary: '',
  microphone: '',
  notifications:
      'Apps must ask users for permission before sending notification prompts',
);

// Custom actions main.dart runs at startup (no arguments): initialActions
// before the app starts, finalActions once every service has started.
final mainDart = MainDart(initialActions: ['', connected]);

// Pub packages custom code can import (pubspec.yaml dependencies).
final pubDependencies = <String, String>{
  'package_info_plus': 'any',
  'internet_connection_checker_plus': '^2.9.1+2',
  'in_app_review': '^2.0.6',
  'share_plus': '^10.0.2',
  'flutter_tts': '^4.2.5',
};

// App constants. Read one in a value as Constant('name').
const double mainPadding = 16.0;
const double radiusXS = 4.0;
const double radiusSM = 8.0;
const double radiusXl = 12.0;
const double radius2Xl = 16.0;
const double radius3Xl = 24.0;
const double maxWidth = 550.0;
const String appStore = 'id400169658';
