import 'package:package_info_plus/package_info_plus.dart';

Future<String> getPackageName() async {
  // Add your function code here!
  try {
    PackageInfo packageInfo = await PackageInfo.fromPlatform();
    return packageInfo.packageName;
  } catch (e) {
    print("Error getting package name: $e");
    return "Unknown Package Name";
  }
}