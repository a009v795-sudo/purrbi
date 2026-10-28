import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import '/custom_code/widgets/index.dart' as custom_widgets;
import '/index.dart';
import 'analysis_result_page_widget.dart' show AnalysisResultPageWidget;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:percent_indicator/percent_indicator.dart';
import 'package:provider/provider.dart';

class AnalysisResultPageModel
    extends FlutterFlowModel<AnalysisResultPageWidget> {
  ///  Local state fields for this page.

  int? timeIndex = 1;

  double? progress = 0.1;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {}
}
