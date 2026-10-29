import '/flutter_flow/ff_builtin_enums.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'bullet_text_model.dart';
export 'bullet_text_model.dart';

/// DSL component BulletText
class BulletTextWidget extends StatefulWidget {
  const BulletTextWidget({
    super.key,
    this.text,
  });

  final String? text;

  @override
  State<BulletTextWidget> createState() => _BulletTextWidgetState();
}

class _BulletTextWidgetState extends State<BulletTextWidget> {
  late BulletTextModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => BulletTextModel());

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
        Padding(
          padding: EdgeInsetsDirectional.fromSTEB(0.0, 8.0, 0.0, 0.0),
          child: Container(
            width: 5.0,
            height: 5.0,
            decoration: BoxDecoration(
              color: FlutterFlowTheme.of(context).secondaryText,
              shape: BoxShape.circle,
            ),
          ),
        ),
        Expanded(
          child: Text(
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
                  fontStyle: FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                ),
          ),
        ),
      ].divide(SizedBox(width: 10.0)),
    );
  }
}
