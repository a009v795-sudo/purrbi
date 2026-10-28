import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/mini_logo/mini_logo_widget.dart';
import 'dart:math';
import 'dart:ui';
import 'tips_bottom_component_widget.dart' show TipsBottomComponentWidget;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class TipsBottomComponentModel
    extends FlutterFlowModel<TipsBottomComponentWidget> {
  ///  State fields for stateful widgets in this component.

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
