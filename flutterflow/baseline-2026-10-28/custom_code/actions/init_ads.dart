import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:flutter/foundation.dart'; // for kIsWeb

Future initAds() async {
  // Add your function code here!
  // Web doesn't support AdMob
  if (kIsWeb) {
    debugPrint("Ads not supported on Web");
    return;
  }
  MobileAds.instance.initialize();
}