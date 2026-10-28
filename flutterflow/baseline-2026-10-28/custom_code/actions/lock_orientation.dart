import 'package:flutter/services.dart';

Future lockOrientation() async {
  // Add your function code here!
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
}