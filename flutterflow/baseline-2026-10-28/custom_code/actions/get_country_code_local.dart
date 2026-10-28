import 'dart:ui' as ui;

Future getCountryCodeLocal() async {
  // Add your function code here!
  try {
    final locale = ui.PlatformDispatcher.instance.locale;
    final countryCode = locale.countryCode ?? 'Unknown';

    FFAppState().update(() {
      FFAppState().countryName = countryCode;
    });

    return countryCode;
  } catch (e) {
    return 'Error';
  }
}