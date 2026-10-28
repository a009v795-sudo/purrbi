import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import '/pages/components/recent_identifier/recent_identifier_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'recentidentifier_page_widget.dart' show RecentidentifierPageWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class RecentidentifierPageModel
    extends FlutterFlowModel<RecentidentifierPageWidget> {
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
  // Models for RecentIdentifier dynamic component.
  late FlutterFlowDynamicModels<RecentIdentifierModel> recentIdentifierModels;

  @override
  void initState(BuildContext context) {
    mainAppbarModel = createModel(context, () => MainAppbarModel());
    recentIdentifierModels =
        FlutterFlowDynamicModels(() => RecentIdentifierModel());
  }

  @override
  void dispose() {
    mainAppbarModel.dispose();
    recentIdentifierModels.dispose();
  }
}
