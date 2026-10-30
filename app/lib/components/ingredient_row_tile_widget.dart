import '/backend/schema/structs/index.dart';
import '/components/ingredient_detail_sheet_widget.dart';
import '/flutter_flow/ff_builtin_enums.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'ingredient_row_tile_model.dart';
export 'ingredient_row_tile_model.dart';

/// DSL component IngredientRowTile
class IngredientRowTileWidget extends StatefulWidget {
  const IngredientRowTileWidget({
    super.key,
    this.row,
    this.petName,
  });

  final IngredientRowStruct? row;
  final String? petName;

  @override
  State<IngredientRowTileWidget> createState() =>
      _IngredientRowTileWidgetState();
}

class _IngredientRowTileWidgetState extends State<IngredientRowTileWidget> {
  late IngredientRowTileModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => IngredientRowTileModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      splashColor: Colors.transparent,
      focusColor: Colors.transparent,
      hoverColor: Colors.transparent,
      highlightColor: Colors.transparent,
      onTap: () async {
        await showModalBottomSheet(
          isScrollControlled: true,
          useSafeArea: true,
          context: context,
          builder: (context) {
            return Padding(
              padding: MediaQuery.viewInsetsOf(context),
              child: IngredientDetailSheetWidget(
                row: widget!.row,
                petName: widget!.petName,
              ),
            );
          },
        ).then((value) => safeSetState(() {}));
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.transparent,
        ),
        child: Padding(
          padding: EdgeInsetsDirectional.fromSTEB(0.0, 8.0, 0.0, 8.0),
          child: Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: (FFMainAxisAlignment.start).flutterValue,
            crossAxisAlignment: (FFCrossAxisAlignment.center).flutterValue,
            textBaseline: TextBaseline.alphabetic,
            children: [
              if (widget!.row?.color == 'green')
                Icon(
                  Icons.check_circle_rounded,
                  color: FlutterFlowTheme.of(context).success,
                  size: 22.0,
                ),
              if (widget!.row?.color == 'yellow')
                Icon(
                  Icons.warning_amber_rounded,
                  color: FlutterFlowTheme.of(context).warning,
                  size: 22.0,
                ),
              if (widget!.row?.color == 'red')
                Icon(
                  Icons.error_rounded,
                  color: FlutterFlowTheme.of(context).error,
                  size: 22.0,
                ),
              if (widget!.row?.color == 'gray')
                Icon(
                  Icons.help_outline_rounded,
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
                    Text(
                      widget!.row!.name,
                      maxLines: 2,
                      style: FlutterFlowTheme.of(context).titleSmall.override(
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
                    Text(
                      widget!.row!.reason,
                      maxLines: 2,
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
                            fontWeight: FlutterFlowTheme.of(context)
                                .bodySmall
                                .fontWeight,
                            fontStyle: FlutterFlowTheme.of(context)
                                .bodySmall
                                .fontStyle,
                          ),
                    ),
                    if (widget!.row?.petFlag != '')
                      Text(
                        widget!.row!.relevance,
                        maxLines: 3,
                        style: FlutterFlowTheme.of(context).labelSmall.override(
                              font: GoogleFonts.nunito(
                                fontWeight: FlutterFlowTheme.of(context)
                                    .labelSmall
                                    .fontWeight,
                                fontStyle: FlutterFlowTheme.of(context)
                                    .labelSmall
                                    .fontStyle,
                              ),
                              color: widget!.row?.petFlag == 'conflict'
                                  ? FlutterFlowTheme.of(context).error
                                  : FlutterFlowTheme.of(context).warning,
                              letterSpacing: 0.0,
                              fontWeight: FlutterFlowTheme.of(context)
                                  .labelSmall
                                  .fontWeight,
                              fontStyle: FlutterFlowTheme.of(context)
                                  .labelSmall
                                  .fontStyle,
                            ),
                      ),
                  ].divide(SizedBox(height: 2.0)),
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: FlutterFlowTheme.of(context).secondaryText,
                size: 22.0,
              ),
            ].divide(SizedBox(width: 12.0)),
          ),
        ),
      ),
    );
  }
}
