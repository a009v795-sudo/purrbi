import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import '/pages/components/scan_component/scan_component_widget.dart';
import 'dart:math';
import 'dart:ui';
import '/index.dart';
import 'trendingnow_page_widget.dart' show TrendingnowPageWidget;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class TrendingnowPageModel extends FlutterFlowModel<TrendingnowPageWidget> {
  ///  Local state fields for this page.

  List<String> categoryList = [
    'All',
    'Food & Beverages',
    'Health & Beauty',
    'Household Products',
    'Electronics',
    'Fashion & Apparel',
    'Baby Products',
    'Pet Products',
    'Sports & Fitness',
    'Toys & Games',
    'Office & Stationery',
    'Automotive',
    'Home & Lifestyle'
  ];
  void addToCategoryList(String item) => categoryList.add(item);
  void removeFromCategoryList(String item) => categoryList.remove(item);
  void removeAtIndexFromCategoryList(int index) => categoryList.removeAt(index);
  void insertAtIndexInCategoryList(int index, String item) =>
      categoryList.insert(index, item);
  void updateCategoryListAtIndex(int index, Function(String) updateFn) =>
      categoryList[index] = updateFn(categoryList[index]);

  String? catname = 'All';

  ///  State fields for stateful widgets in this page.

  // Model for MainAppbar component.
  late MainAppbarModel mainAppbarModel;
  // Models for ScanComponent dynamic component.
  late FlutterFlowDynamicModels<ScanComponentModel> scanComponentModels;

  @override
  void initState(BuildContext context) {
    mainAppbarModel = createModel(context, () => MainAppbarModel());
    scanComponentModels = FlutterFlowDynamicModels(() => ScanComponentModel());
  }

  @override
  void dispose() {
    mainAppbarModel.dispose();
    scanComponentModels.dispose();
  }
}
