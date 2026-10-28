import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import 'dart:ui';
import '/actions/actions.dart' as action_blocks;
import '/index.dart';
import 'select_reason_page_widget.dart' show SelectReasonPageWidget;
import 'package:easy_debounce/easy_debounce.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class SelectReasonPageModel extends FlutterFlowModel<SelectReasonPageWidget> {
  ///  Local state fields for this page.

  List<String> reasonList = [
    'No, thanks.',
    'I\'m not identifying watches often enough',
    'Missing important features',
    'The subscription is too expensive'
  ];
  void addToReasonList(String item) => reasonList.add(item);
  void removeFromReasonList(String item) => reasonList.remove(item);
  void removeAtIndexFromReasonList(int index) => reasonList.removeAt(index);
  void insertAtIndexInReasonList(int index, String item) =>
      reasonList.insert(index, item);
  void updateReasonListAtIndex(int index, Function(String) updateFn) =>
      reasonList[index] = updateFn(reasonList[index]);

  String? reasonName;

  ///  State fields for stateful widgets in this page.

  // Model for MainAppbar component.
  late MainAppbarModel mainAppbarModel;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode;
  TextEditingController? textController;
  String? Function(BuildContext, String?)? textControllerValidator;

  @override
  void initState(BuildContext context) {
    mainAppbarModel = createModel(context, () => MainAppbarModel());
  }

  @override
  void dispose() {
    mainAppbarModel.dispose();
    textFieldFocusNode?.dispose();
    textController?.dispose();
  }
}
