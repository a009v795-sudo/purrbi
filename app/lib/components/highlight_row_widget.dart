import '/flutter_flow/ff_builtin_enums.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'highlight_row_model.dart';
export 'highlight_row_model.dart';

/// DSL component HighlightRow
class HighlightRowWidget extends StatefulWidget {
  const HighlightRowWidget({
    super.key,
    this.kind,
    this.severity,
    this.title,
    this.detail,
    this.value,
  });

  final String? kind;
  final String? severity;
  final String? title;
  final String? detail;
  final String? value;

  @override
  State<HighlightRowWidget> createState() => _HighlightRowWidgetState();
}

class _HighlightRowWidgetState extends State<HighlightRowWidget> {
  late HighlightRowModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => HighlightRowModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.transparent,
      ),
      child: Padding(
        padding: EdgeInsetsDirectional.fromSTEB(0.0, 4.0, 0.0, 4.0),
        child: Row(
          mainAxisSize: MainAxisSize.max,
          mainAxisAlignment: (FFMainAxisAlignment.start).flutterValue,
          crossAxisAlignment: (FFCrossAxisAlignment.start).flutterValue,
          textBaseline: TextBaseline.alphabetic,
          children: [
            if (widget!.kind == 'positive')
              Icon(
                Icons.check_circle_rounded,
                color: FlutterFlowTheme.of(context).success,
                size: 22.0,
              ),
            if ((widget!.kind == 'caution') && (widget!.severity == 'alert'))
              Icon(
                Icons.error_rounded,
                color: FlutterFlowTheme.of(context).error,
                size: 22.0,
              ),
            if ((widget!.kind == 'caution') && (widget!.severity == 'review'))
              Icon(
                Icons.warning_amber_rounded,
                color: FlutterFlowTheme.of(context).warning,
                size: 22.0,
              ),
            if ((widget!.kind == 'caution') && (widget!.severity == 'info'))
              Icon(
                Icons.info_outline_rounded,
                color: FlutterFlowTheme.of(context).secondaryText,
                size: 22.0,
              ),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.max,
                mainAxisAlignment: (FFMainAxisAlignment.start).flutterValue,
                crossAxisAlignment: (FFCrossAxisAlignment.start).flutterValue,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: (FFMainAxisAlignment.start).flutterValue,
                    crossAxisAlignment:
                        (FFCrossAxisAlignment.center).flutterValue,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Expanded(
                        child: Text(
                          widget!.title!,
                          style:
                              FlutterFlowTheme.of(context).titleSmall.override(
                                    font: GoogleFonts.nunito(
                                      fontWeight: FlutterFlowTheme.of(context)
                                          .titleSmall
                                          .fontWeight,
                                      fontStyle: FlutterFlowTheme.of(context)
                                          .titleSmall
                                          .fontStyle,
                                    ),
                                    letterSpacing: 0.0,
                                    fontWeight: FlutterFlowTheme.of(context)
                                        .titleSmall
                                        .fontWeight,
                                    fontStyle: FlutterFlowTheme.of(context)
                                        .titleSmall
                                        .fontStyle,
                                  ),
                        ),
                      ),
                      if (widget!.value != '')
                        Flexible(
                          child: Text(
                            widget!.value!,
                            maxLines: 1,
                            style: FlutterFlowTheme.of(context)
                                .labelMedium
                                .override(
                                  font: GoogleFonts.nunito(
                                    fontWeight: FlutterFlowTheme.of(context)
                                        .labelMedium
                                        .fontWeight,
                                    fontStyle: FlutterFlowTheme.of(context)
                                        .labelMedium
                                        .fontStyle,
                                  ),
                                  color: FlutterFlowTheme.of(context)
                                      .secondaryText,
                                  letterSpacing: 0.0,
                                  fontWeight: FlutterFlowTheme.of(context)
                                      .labelMedium
                                      .fontWeight,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .labelMedium
                                      .fontStyle,
                                ),
                          ),
                        ),
                    ].divide(SizedBox(width: 8.0)),
                  ),
                  Text(
                    widget!.detail!,
                    style: FlutterFlowTheme.of(context).bodySmall.override(
                          font: GoogleFonts.nunito(
                            fontWeight: FlutterFlowTheme.of(context)
                                .bodySmall
                                .fontWeight,
                            fontStyle: FlutterFlowTheme.of(context)
                                .bodySmall
                                .fontStyle,
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
          ].divide(SizedBox(width: 12.0)),
        ),
      ),
    );
  }
}
