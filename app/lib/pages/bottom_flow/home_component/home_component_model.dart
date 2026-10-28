import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/blog_component/blog_component_widget.dart';
import '/pages/components/recent_identifier/recent_identifier_widget.dart';
import '/pages/components/row_component/row_component_widget.dart';
import 'dart:math';
import 'dart:ui';
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'home_component_widget.dart' show HomeComponentWidget;
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class HomeComponentModel extends FlutterFlowModel<HomeComponentWidget> {
  ///  Local state fields for this component.

  int? tapIndex = 0;

  String? tattooSize;

  String? styleName;

  String? placementName;

  FFUploadedFile? scanPhoto;

  bool isAiTap = false;

  ///  State fields for stateful widgets in this component.

  // Model for RowComponent component.
  late RowComponentModel rowComponentModel1;
  // Model for RowComponent component.
  late RowComponentModel rowComponentModel2;
  // Models for RecentIdentifier dynamic component.
  late FlutterFlowDynamicModels<RecentIdentifierModel> recentIdentifierModels;
  // Model for RowComponent component.
  late RowComponentModel rowComponentModel3;
  // Models for BlogComponent dynamic component.
  late FlutterFlowDynamicModels<BlogComponentModel> blogComponentModels;

  @override
  void initState(BuildContext context) {
    rowComponentModel1 = createModel(context, () => RowComponentModel());
    rowComponentModel2 = createModel(context, () => RowComponentModel());
    recentIdentifierModels =
        FlutterFlowDynamicModels(() => RecentIdentifierModel());
    rowComponentModel3 = createModel(context, () => RowComponentModel());
    blogComponentModels = FlutterFlowDynamicModels(() => BlogComponentModel());
  }

  @override
  void dispose() {
    rowComponentModel1.dispose();
    rowComponentModel2.dispose();
    recentIdentifierModels.dispose();
    rowComponentModel3.dispose();
    blogComponentModels.dispose();
  }
}
