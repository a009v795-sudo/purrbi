import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/bottom_flow/explore_component/explore_component_widget.dart';
import '/pages/bottom_flow/history_component/history_component_widget.dart';
import '/pages/bottom_flow/home_component/home_component_widget.dart';
import '/pages/bottom_flow/profile_component/profile_component_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'home_main_page_widget.dart' show HomeMainPageWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class HomeMainPageModel extends FlutterFlowModel<HomeMainPageWidget> {
  ///  State fields for stateful widgets in this page.

  // Model for HomeComponent component.
  late HomeComponentModel homeComponentModel;
  // Model for ExploreComponent component.
  late ExploreComponentModel exploreComponentModel;
  // Model for HistoryComponent component.
  late HistoryComponentModel historyComponentModel;
  // Model for ProfileComponent component.
  late ProfileComponentModel profileComponentModel;

  @override
  void initState(BuildContext context) {
    homeComponentModel = createModel(context, () => HomeComponentModel());
    exploreComponentModel = createModel(context, () => ExploreComponentModel());
    historyComponentModel = createModel(context, () => HistoryComponentModel());
    profileComponentModel = createModel(context, () => ProfileComponentModel());
  }

  @override
  void dispose() {
    homeComponentModel.dispose();
    exploreComponentModel.dispose();
    historyComponentModel.dispose();
    profileComponentModel.dispose();
  }
}
