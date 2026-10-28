import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/mini_logo/mini_logo_widget.dart';
import 'app_logo_widget.dart' show AppLogoWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class AppLogoModel extends FlutterFlowModel<AppLogoWidget> {
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
