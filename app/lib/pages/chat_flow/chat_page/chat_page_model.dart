import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/mini_logo/mini_logo_widget.dart';
import '/pages/dialog_components/bot_message_sheet_componet/bot_message_sheet_componet_widget.dart';
import '/pages/dialog_components/select_text_bottom_sheet/select_text_bottom_sheet_widget.dart';
import '/pages/dialog_components/user_message_sheet_componet/user_message_sheet_componet_widget.dart';
import 'dart:math';
import 'dart:ui';
import '/actions/actions.dart' as action_blocks;
import '/custom_code/actions/index.dart' as actions;
import '/custom_code/widgets/index.dart' as custom_widgets;
import '/flutter_flow/custom_functions.dart' as functions;
import '/flutter_flow/random_data_util.dart' as random_data;
import 'chat_page_widget.dart' show ChatPageWidget;
import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class ChatPageModel extends FlutterFlowModel<ChatPageWidget> {
  ///  Local state fields for this page.

  List<ChatModelStruct> chatList = [];
  void addToChatList(ChatModelStruct item) => chatList.add(item);
  void removeFromChatList(ChatModelStruct item) => chatList.remove(item);
  void removeAtIndexFromChatList(int index) => chatList.removeAt(index);
  void insertAtIndexInChatList(int index, ChatModelStruct item) =>
      chatList.insert(index, item);
  void updateChatListAtIndex(int index, Function(ChatModelStruct) updateFn) =>
      chatList[index] = updateFn(chatList[index]);

  bool progress = false;

  List<String> suggestedTopicList = [
    '📷 Scan a product barcode',
    '🌍 Animal habitat & distribution',
    '👣 Barcode patterns & gait',
    '🦌 Animal behavior & characteristics'
  ];
  void addToSuggestedTopicList(String item) => suggestedTopicList.add(item);
  void removeFromSuggestedTopicList(String item) =>
      suggestedTopicList.remove(item);
  void removeAtIndexFromSuggestedTopicList(int index) =>
      suggestedTopicList.removeAt(index);
  void insertAtIndexInSuggestedTopicList(int index, String item) =>
      suggestedTopicList.insert(index, item);
  void updateSuggestedTopicListAtIndex(int index, Function(String) updateFn) =>
      suggestedTopicList[index] = updateFn(suggestedTopicList[index]);

  ///  State fields for stateful widgets in this page.

  // State field(s) for ListView widget.
  ScrollController? listViewController1;
  // State field(s) for ListView widget.
  ScrollController? listViewController2;
  // State field(s) for Column widget.
  ScrollController? columnController;
  // Model for MiniLogo component.
  late MiniLogoModel miniLogoModel;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode;
  TextEditingController? textController;
  String? Function(BuildContext, String?)? textControllerValidator;

  @override
  void initState(BuildContext context) {
    listViewController1 = ScrollController();
    listViewController2 = ScrollController();
    columnController = ScrollController();
    miniLogoModel = createModel(context, () => MiniLogoModel());
  }

  @override
  void dispose() {
    listViewController1?.dispose();
    listViewController2?.dispose();
    columnController?.dispose();
    miniLogoModel.dispose();
    textFieldFocusNode?.dispose();
    textController?.dispose();
  }
}
