import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/center_appbar/center_appbar_widget.dart';
import '/pages/components/recent_identifier/recent_identifier_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'history_component_model.dart';
export 'history_component_model.dart';

class HistoryComponentWidget extends StatefulWidget {
  const HistoryComponentWidget({super.key});

  @override
  State<HistoryComponentWidget> createState() => _HistoryComponentWidgetState();
}

class _HistoryComponentWidgetState extends State<HistoryComponentWidget> {
  late HistoryComponentModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => HistoryComponentModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();

    return Column(
      mainAxisSize: MainAxisSize.max,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsetsDirectional.fromSTEB(0.0, 47.0, 0.0, 0.0),
          child: wrapWithModel(
            model: _model.centerAppbarModel,
            updateCallback: () => safeSetState(() {}),
            child: CenterAppbarWidget(
              title: 'History',
            ),
          ),
        ),
        Padding(
          padding: EdgeInsetsDirectional.fromSTEB(16.0, 0.0, 16.0, 0.0),
          child: Container(
            width: double.infinity,
            height: 58.0,
            decoration: BoxDecoration(
              color: FlutterFlowTheme.of(context).secondaryBackground,
              borderRadius: BorderRadius.circular(99.0),
              border: Border.all(
                color: FlutterFlowTheme.of(context).borderColor,
              ),
            ),
            child: Padding(
              padding: EdgeInsets.all(8.0),
              child: Row(
                mainAxisSize: MainAxisSize.max,
                children: [
                  Expanded(
                    child: InkWell(
                      splashColor: Colors.transparent,
                      focusColor: Colors.transparent,
                      hoverColor: Colors.transparent,
                      highlightColor: Colors.transparent,
                      onTap: () async {
                        _model.tabIndex = 0;
                        safeSetState(() {});
                      },
                      child: Container(
                        width: double.infinity,
                        height: double.infinity,
                        decoration: BoxDecoration(
                          color: _model.tabIndex == 0
                              ? FlutterFlowTheme.of(context).primary
                              : FlutterFlowTheme.of(context)
                                  .secondaryBackground,
                          borderRadius: BorderRadius.circular(99.0),
                        ),
                        alignment: AlignmentDirectional(0.0, 0.0),
                        child: Text(
                          'Saved result',
                          style: FlutterFlowTheme.of(context)
                              .bodyMedium
                              .override(
                                font: GoogleFonts.nunito(
                                  fontWeight: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .fontWeight,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .fontStyle,
                                ),
                                color: _model.tabIndex == 0
                                    ? Colors.white
                                    : FlutterFlowTheme.of(context).primaryText,
                                fontSize: 15.0,
                                letterSpacing: 0.0,
                                fontWeight: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .fontWeight,
                                fontStyle: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .fontStyle,
                                lineHeight: 1.47,
                              ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: InkWell(
                      splashColor: Colors.transparent,
                      focusColor: Colors.transparent,
                      hoverColor: Colors.transparent,
                      highlightColor: Colors.transparent,
                      onTap: () async {
                        _model.tabIndex = 1;
                        safeSetState(() {});
                      },
                      child: Container(
                        width: double.infinity,
                        height: double.infinity,
                        decoration: BoxDecoration(
                          color: _model.tabIndex == 1
                              ? FlutterFlowTheme.of(context).primary
                              : FlutterFlowTheme.of(context)
                                  .secondaryBackground,
                          borderRadius: BorderRadius.circular(99.0),
                        ),
                        alignment: AlignmentDirectional(0.0, 0.0),
                        child: Text(
                          'History',
                          style: FlutterFlowTheme.of(context)
                              .bodyMedium
                              .override(
                                font: GoogleFonts.nunito(
                                  fontWeight: FontWeight.normal,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .fontStyle,
                                ),
                                color: _model.tabIndex == 1
                                    ? Colors.white
                                    : FlutterFlowTheme.of(context).primaryText,
                                fontSize: 15.0,
                                letterSpacing: 0.0,
                                fontWeight: FontWeight.normal,
                                fontStyle: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .fontStyle,
                              ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        Expanded(
          child: Padding(
            padding: EdgeInsetsDirectional.fromSTEB(16.0, 0.0, 16.0, 0.0),
            child: Builder(
              builder: (context) {
                final item = FFAppState().RecentidentifierList.toList();

                return ListView.separated(
                  padding: EdgeInsets.fromLTRB(
                    0,
                    12.0,
                    0,
                    0,
                  ),
                  scrollDirection: Axis.vertical,
                  itemCount: item.length,
                  separatorBuilder: (_, __) => SizedBox(height: 12.0),
                  itemBuilder: (context, itemIndex) {
                    final itemItem = item[itemIndex];
                    return wrapWithModel(
                      model: _model.historyRecentCardModels.getModel(
                        itemIndex.toString(),
                        itemIndex,
                      ),
                      updateCallback: () => safeSetState(() {}),
                      child: RecentIdentifierWidget(
                        key: Key(
                          'Keyqkn_${itemIndex.toString()}',
                        ),
                        detail: itemItem,
                        onTapAction: () async {
                          context.pushNamed(
                            HistorySaveDetailsPageWidget.routeName,
                            queryParameters: {
                              'images': serializeParam(
                                itemItem.img,
                                ParamType.String,
                              ),
                              'title': serializeParam(
                                itemItem.title,
                                ParamType.String,
                              ),
                            }.withoutNulls,
                          );
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
