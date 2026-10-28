import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/center_appbar/center_appbar_widget.dart';
import '/pages/components/row_component/row_component_widget.dart';
import '/pages/components/scan_component/scan_component_widget.dart';
import 'dart:math';
import 'dart:ui';
import '/index.dart';
import 'explore_component_widget.dart' show ExploreComponentWidget;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class ExploreComponentModel extends FlutterFlowModel<ExploreComponentWidget> {
  ///  State fields for stateful widgets in this component.

  // Model for CenterAppbar component.
  late CenterAppbarModel centerAppbarModel;
  // Model for RowComponent component.
  late RowComponentModel rowComponentModel1;
  // Models for ScanComponent dynamic component.
  late FlutterFlowDynamicModels<ScanComponentModel> scanComponentModels1;
  // Model for RowComponent component.
  late RowComponentModel rowComponentModel2;
  // Model for RowComponent component.
  late RowComponentModel rowComponentModel3;
  // Models for ScanComponent dynamic component.
  late FlutterFlowDynamicModels<ScanComponentModel> scanComponentModels2;

  @override
  void initState(BuildContext context) {
    centerAppbarModel = createModel(context, () => CenterAppbarModel());
    rowComponentModel1 = createModel(context, () => RowComponentModel());
    scanComponentModels1 = FlutterFlowDynamicModels(() => ScanComponentModel());
    rowComponentModel2 = createModel(context, () => RowComponentModel());
    rowComponentModel3 = createModel(context, () => RowComponentModel());
    scanComponentModels2 = FlutterFlowDynamicModels(() => ScanComponentModel());
  }

  @override
  void dispose() {
    centerAppbarModel.dispose();
    rowComponentModel1.dispose();
    scanComponentModels1.dispose();
    rowComponentModel2.dispose();
    rowComponentModel3.dispose();
    scanComponentModels2.dispose();
  }
}
