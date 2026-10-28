import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import '/pages/components/mini_logo/mini_logo_widget.dart';
import 'dart:ui';
import '/actions/actions.dart' as action_blocks;
import '/index.dart';
import 'a_i_assistant_page_widget.dart' show AIAssistantPageWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class AIAssistantPageModel extends FlutterFlowModel<AIAssistantPageWidget> {
  ///  State fields for stateful widgets in this page.

  // Model for MainAppbar component.
  late MainAppbarModel mainAppbarModel;
  // Model for MiniLogo component.
  late MiniLogoModel miniLogoModel;

  @override
  void initState(BuildContext context) {
    mainAppbarModel = createModel(context, () => MainAppbarModel());
    miniLogoModel = createModel(context, () => MiniLogoModel());
  }

  @override
  void dispose() {
    mainAppbarModel.dispose();
    miniLogoModel.dispose();
  }
}
