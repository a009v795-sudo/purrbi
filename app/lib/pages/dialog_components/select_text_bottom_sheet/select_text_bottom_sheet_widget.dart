import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'select_text_bottom_sheet_model.dart';
export 'select_text_bottom_sheet_model.dart';

class SelectTextBottomSheetWidget extends StatefulWidget {
  const SelectTextBottomSheetWidget({
    super.key,
    required this.textData,
  });

  final String? textData;

  @override
  State<SelectTextBottomSheetWidget> createState() =>
      _SelectTextBottomSheetWidgetState();
}

class _SelectTextBottomSheetWidgetState
    extends State<SelectTextBottomSheetWidget> {
  late SelectTextBottomSheetModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => SelectTextBottomSheetModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsetsDirectional.fromSTEB(0.0, 100.0, 0.0, 0.0),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: FlutterFlowTheme.of(context).secondaryBackground,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(26.0),
            topRight: Radius.circular(26.0),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.max,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 48.0,
                  height: 6.0,
                  decoration: BoxDecoration(
                    color: FlutterFlowTheme.of(context).borderColor,
                    borderRadius: BorderRadius.circular(20.0),
                  ),
                ),
              ],
            ),
            Flexible(
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8.0),
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.max,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: EdgeInsetsDirectional.fromSTEB(
                            valueOrDefault<double>(
                              FFAppConstants.mainPadding,
                              0.0,
                            ),
                            0.0,
                            valueOrDefault<double>(
                              FFAppConstants.mainPadding,
                              0.0,
                            ),
                            0.0),
                        child: MarkdownBody(
                          data: widget!.textData!,
                          selectable: true,
                          onTapLink: (_, url, __) => launchURL(url!),
                        ),
                      ),
                    ]
                        .addToStart(SizedBox(height: 16.0))
                        .addToEnd(SizedBox(height: 30.0)),
                  ),
                ),
              ),
            ),
          ].addToStart(SizedBox(height: 16.0)),
        ),
      ),
    );
  }
}
