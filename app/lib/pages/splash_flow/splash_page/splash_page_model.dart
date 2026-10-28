import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/mini_logo/mini_logo_widget.dart';
import 'dart:math';
import 'dart:ui';
import '/actions/actions.dart' as action_blocks;
import '/custom_code/actions/index.dart' as actions;
import '/index.dart';
import 'splash_page_widget.dart' show SplashPageWidget;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class SplashPageModel extends FlutterFlowModel<SplashPageWidget> {
  ///  State fields for stateful widgets in this page.

  // Stores action output result for [Custom Action - getPackageName] action in SplashPage widget.
  String? packageName;
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
