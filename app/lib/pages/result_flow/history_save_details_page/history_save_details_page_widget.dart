import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/result_flow/card1/card1_widget.dart';
import '/pages/result_flow/card2/card2_widget.dart';
import '/pages/result_flow/card3/card3_widget.dart';
import '/pages/result_flow/card4/card4_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'history_save_details_page_model.dart';
export 'history_save_details_page_model.dart';

class HistorySaveDetailsPageWidget extends StatefulWidget {
  const HistorySaveDetailsPageWidget({
    super.key,
    required this.images,
    required this.title,
  });

  final String? images;
  final String? title;

  static String routeName = 'HistorySaveDetailsPage';
  static String routePath = '/historySaveDetailsPage';

  @override
  State<HistorySaveDetailsPageWidget> createState() =>
      _HistorySaveDetailsPageWidgetState();
}

class _HistorySaveDetailsPageWidgetState
    extends State<HistorySaveDetailsPageWidget> {
  late HistorySaveDetailsPageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => HistorySaveDetailsPageModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: Scaffold(
        key: scaffoldKey,
        backgroundColor: FlutterFlowTheme.of(context).bgColor,
        body: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: BoxDecoration(
            color: FlutterFlowTheme.of(context).bgColor,
          ),
          alignment: AlignmentDirectional(0.0, -1.0),
          child: Container(
            constraints: BoxConstraints(
              maxWidth: FFAppConstants.maxWidth,
            ),
            decoration: BoxDecoration(
              color: FlutterFlowTheme.of(context).secondaryBackground,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.max,
              children: [
                Expanded(
                  child: ListView(
                    padding: EdgeInsets.zero,
                    scrollDirection: Axis.vertical,
                    children: [
                      Align(
                        alignment: AlignmentDirectional(0.0, -1.0),
                        child: Container(
                          width: double.infinity,
                          height: MediaQuery.sizeOf(context).height * 0.45,
                          decoration: BoxDecoration(
                            color: FlutterFlowTheme.of(context)
                                .secondaryBackground,
                            image: DecorationImage(
                              fit: BoxFit.cover,
                              image: Image.network(
                                widget!.images!,
                              ).image,
                            ),
                            borderRadius: BorderRadius.only(),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.max,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Padding(
                                padding: EdgeInsetsDirectional.fromSTEB(
                                    valueOrDefault<double>(
                                      FFAppConstants.mainPadding,
                                      0.0,
                                    ),
                                    58.0,
                                    valueOrDefault<double>(
                                      FFAppConstants.mainPadding,
                                      0.0,
                                    ),
                                    12.0),
                                child: Row(
                                  mainAxisSize: MainAxisSize.max,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    InkWell(
                                      splashColor: Colors.transparent,
                                      focusColor: Colors.transparent,
                                      hoverColor: Colors.transparent,
                                      highlightColor: Colors.transparent,
                                      onTap: () async {
                                        FFAppState().homePageIndex = 0;
                                        FFAppState().update(() {});

                                        context.goNamed(
                                            HomeMainPageWidget.routeName);
                                      },
                                      child: Container(
                                        width: 40.0,
                                        height: 40.0,
                                        decoration: BoxDecoration(
                                          color: FlutterFlowTheme.of(context)
                                              .buttonBg,
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: FlutterFlowTheme.of(context)
                                                .borderColor,
                                            width: 1.0,
                                          ),
                                        ),
                                        alignment:
                                            AlignmentDirectional(0.0, 0.0),
                                        child: Icon(
                                          FFIcons.karrowbackyp,
                                          color: FlutterFlowTheme.of(context)
                                              .primaryText,
                                          size: 24.0,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                width: double.infinity,
                                height: 24.0,
                                decoration: BoxDecoration(
                                  color: FlutterFlowTheme.of(context)
                                      .secondaryBackground,
                                  borderRadius: BorderRadius.only(
                                    topLeft: Radius.circular(24.0),
                                    topRight: Radius.circular(24.0),
                                  ),
                                  border: Border.all(
                                    color: FlutterFlowTheme.of(context)
                                        .secondaryBackground,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(24.0),
                            topRight: Radius.circular(24.0),
                          ),
                        ),
                        child: Container(
                          decoration: BoxDecoration(),
                          child: wrapWithModel(
                            model: _model.card1Model,
                            updateCallback: () => safeSetState(() {}),
                            child: Card1Widget(
                              title: widget!.title!,
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: EdgeInsetsDirectional.fromSTEB(
                            valueOrDefault<double>(
                              FFAppConstants.mainPadding,
                              0.0,
                            ),
                            16.0,
                            valueOrDefault<double>(
                              FFAppConstants.mainPadding,
                              0.0,
                            ),
                            16.0),
                        child: wrapWithModel(
                          model: _model.card2Model,
                          updateCallback: () => safeSetState(() {}),
                          child: Card2Widget(),
                        ),
                      ),
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
                        child: wrapWithModel(
                          model: _model.card3Model,
                          updateCallback: () => safeSetState(() {}),
                          child: Card3Widget(),
                        ),
                      ),
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
                            16.0),
                        child: wrapWithModel(
                          model: _model.card4Model,
                          updateCallback: () => safeSetState(() {}),
                          child: Card4Widget(),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
