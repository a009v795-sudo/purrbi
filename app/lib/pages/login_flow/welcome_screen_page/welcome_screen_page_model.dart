import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/mini_logo/mini_logo_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'welcome_screen_page_widget.dart' show WelcomeScreenPageWidget;
import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class WelcomeScreenPageModel extends FlutterFlowModel<WelcomeScreenPageWidget> {
  ///  Local state fields for this page.

  bool? isCheck = true;

  ///  State fields for stateful widgets in this page.

  // Model for MiniLogo component.
  late MiniLogoModel miniLogoModel;

  @override
  void initState(BuildContext context) {
    miniLogoModel = createModel(context, () => MiniLogoModel());
  }

  @override
  void dispose() {
    miniLogoModel.dispose();
  }
}
