import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/center_appbar/center_appbar_widget.dart';
import '/pages/components/recent_identifier/recent_identifier_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'history_component_widget.dart' show HistoryComponentWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class HistoryComponentModel extends FlutterFlowModel<HistoryComponentWidget> {
  ///  Local state fields for this component.

  int tabIndex = 0;

  ///  State fields for stateful widgets in this component.

  // Model for CenterAppbar component.
  late CenterAppbarModel centerAppbarModel;
  // Models for HistoryRecentCard.
  late FlutterFlowDynamicModels<RecentIdentifierModel> historyRecentCardModels;

  @override
  void initState(BuildContext context) {
    centerAppbarModel = createModel(context, () => CenterAppbarModel());
    historyRecentCardModels =
        FlutterFlowDynamicModels(() => RecentIdentifierModel());
  }

  @override
  void dispose() {
    centerAppbarModel.dispose();
    historyRecentCardModels.dispose();
  }
}
