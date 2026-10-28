import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'row_component_model.dart';
export 'row_component_model.dart';

class RowComponentWidget extends StatefulWidget {
  const RowComponentWidget({
    super.key,
    required this.text,
    bool? isShow,
    required this.viewAllAction,
  }) : this.isShow = isShow ?? false;

  final String? text;
  final bool isShow;
  final Future Function()? viewAllAction;

  @override
  State<RowComponentWidget> createState() => _RowComponentWidgetState();
}

class _RowComponentWidgetState extends State<RowComponentWidget> {
  late RowComponentModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => RowComponentModel());

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
      child: Row(
        mainAxisSize: MainAxisSize.max,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              valueOrDefault<String>(
                widget!.text,
                'Text',
              ),
              textAlign: TextAlign.start,
              maxLines: 1,
              style: FlutterFlowTheme.of(context).bodyMedium.override(
                    font: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      fontStyle:
                          FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                    ),
                    fontSize: 18.0,
                    letterSpacing: 0.0,
                    fontWeight: FontWeight.w600,
                    fontStyle:
                        FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                    lineHeight: 1.33,
                  ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (widget!.isShow)
            InkWell(
              splashColor: Colors.transparent,
              focusColor: Colors.transparent,
              hoverColor: Colors.transparent,
              highlightColor: Colors.transparent,
              onTap: () async {
                await widget.viewAllAction?.call();
              },
              child: Text(
                'View all',
                textAlign: TextAlign.end,
                maxLines: 1,
                style: FlutterFlowTheme.of(context).bodyMedium.override(
                      font: GoogleFonts.inter(
                        fontWeight: FontWeight.w500,
                        fontStyle:
                            FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                      ),
                      color: FlutterFlowTheme.of(context).primary,
                      fontSize: 15.0,
                      letterSpacing: 0.0,
                      fontWeight: FontWeight.w500,
                      fontStyle:
                          FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                      lineHeight: 1.46,
                    ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          if (widget!.isShow)
            Icon(
              Icons.keyboard_arrow_right,
              color: FlutterFlowTheme.of(context).primary,
              size: 24.0,
            ),
        ].divide(SizedBox(width: 4.0)),
      ),
    );
  }
}
