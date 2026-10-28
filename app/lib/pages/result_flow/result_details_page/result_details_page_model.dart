import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/result_flow/card1_no/card1_no_widget.dart';
import '/pages/result_flow/card2/card2_widget.dart';
import '/pages/result_flow/card3/card3_widget.dart';
import '/pages/result_flow/card4/card4_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'result_details_page_widget.dart' show ResultDetailsPageWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class ResultDetailsPageModel extends FlutterFlowModel<ResultDetailsPageWidget> {
  ///  State fields for stateful widgets in this page.

  // Model for Card1No component.
  late Card1NoModel card1NoModel;
  // Model for Card2 component.
  late Card2Model card2Model;
  // Model for Card3 component.
  late Card3Model card3Model;
  // Model for Card4 component.
  late Card4Model card4Model;

  @override
  void initState(BuildContext context) {
    card1NoModel = createModel(context, () => Card1NoModel());
    card2Model = createModel(context, () => Card2Model());
    card3Model = createModel(context, () => Card3Model());
    card4Model = createModel(context, () => Card4Model());
  }

  @override
  void dispose() {
    card1NoModel.dispose();
    card2Model.dispose();
    card3Model.dispose();
    card4Model.dispose();
  }
}
