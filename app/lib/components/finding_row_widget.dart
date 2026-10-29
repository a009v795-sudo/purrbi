import '/flutter_flow/ff_builtin_enums.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'finding_row_model.dart';
export 'finding_row_model.dart';

/// DSL component FindingRow
class FindingRowWidget extends StatefulWidget {
  const FindingRowWidget({
    super.key,
    this.kind,
    this.text,
    this.evidence,
  });

  final String? kind;
  final String? text;
  final String? evidence;

  @override
  State<FindingRowWidget> createState() => _FindingRowWidgetState();
}

class _FindingRowWidgetState extends State<FindingRowWidget> {
  late FindingRowModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => FindingRowModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.max,
      mainAxisAlignment: (FFMainAxisAlignment.start).flutterValue,
      crossAxisAlignment: (FFCrossAxisAlignment.start).flutterValue,
      textBaseline: TextBaseline.alphabetic,
      children: [
        if (widget!.kind == 'positive')
          Icon(
            Icons.check_circle_rounded,
            color: FlutterFlowTheme.of(context).success,
            size: 20.0,
          ),
        if (widget!.kind == 'alert')
          Icon(
            Icons.error_rounded,
            color: FlutterFlowTheme.of(context).error,
            size: 20.0,
          ),
        if (widget!.kind == 'review')
          Icon(
            Icons.report_rounded,
            color: FlutterFlowTheme.of(context).warning,
            size: 20.0,
          ),
        if (widget!.kind == 'missing')
          Icon(
            Icons.remove_circle_outline_rounded,
            color: FlutterFlowTheme.of(context).slate,
            size: 20.0,
          ),
        if (widget!.kind == 'info')
          Icon(
            Icons.info_outline_rounded,
            color: FlutterFlowTheme.of(context).secondaryText,
            size: 20.0,
          ),
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: (FFMainAxisAlignment.start).flutterValue,
            crossAxisAlignment: (FFCrossAxisAlignment.start).flutterValue,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                widget!.text!,
                style: FlutterFlowTheme.of(context).bodyMedium.override(
                      font: GoogleFonts.nunito(
                        fontWeight:
                            FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                        fontStyle:
                            FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                      ),
                      letterSpacing: 0.0,
                      fontWeight:
                          FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                    ),
              ),
              if (widget!.evidence != '')
                Text(
                  widget!.evidence!,
                  style: FlutterFlowTheme.of(context).bodySmall.override(
                        font: GoogleFonts.nunito(
                          fontWeight:
                              FlutterFlowTheme.of(context).bodySmall.fontWeight,
                          fontStyle:
                              FlutterFlowTheme.of(context).bodySmall.fontStyle,
                        ),
                        color: FlutterFlowTheme.of(context).secondaryText,
                        letterSpacing: 0.0,
                        fontWeight:
                            FlutterFlowTheme.of(context).bodySmall.fontWeight,
                        fontStyle:
                            FlutterFlowTheme.of(context).bodySmall.fontStyle,
                      ),
                ),
            ].divide(SizedBox(height: 2.0)),
          ),
        ),
      ].divide(SizedBox(width: 10.0)),
    );
  }
}
