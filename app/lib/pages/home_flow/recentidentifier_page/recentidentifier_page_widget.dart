import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import '/pages/components/recent_identifier/recent_identifier_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'recentidentifier_page_model.dart';
export 'recentidentifier_page_model.dart';

class RecentidentifierPageWidget extends StatefulWidget {
  const RecentidentifierPageWidget({super.key});

  static String routeName = 'RecentidentifierPage';
  static String routePath = '/recentidentifierPage';

  @override
  State<RecentidentifierPageWidget> createState() =>
      _RecentidentifierPageWidgetState();
}

class _RecentidentifierPageWidgetState
    extends State<RecentidentifierPageWidget> {
  late RecentidentifierPageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => RecentidentifierPageModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();

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
          decoration: BoxDecoration(),
          child: Align(
            alignment: AlignmentDirectional(0.0, -1.0),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    FlutterFlowTheme.of(context).linearColor1,
                    FlutterFlowTheme.of(context).linearColor2,
                    FlutterFlowTheme.of(context).linearColor3
                  ],
                  stops: [0.0, 0.13, 1.0],
                  begin: AlignmentDirectional(0.0, -1.0),
                  end: AlignmentDirectional(0, 1.0),
                ),
              ),
              child: SafeArea(
                child: Container(
                  width: double.infinity,
                  height: double.infinity,
                  constraints: BoxConstraints(
                    maxWidth: FFAppConstants.maxWidth,
                  ),
                  decoration: BoxDecoration(),
                  child: Column(
                    mainAxisSize: MainAxisSize.max,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      wrapWithModel(
                        model: _model.mainAppbarModel,
                        updateCallback: () => safeSetState(() {}),
                        child: MainAppbarWidget(
                          title: 'Recently Scanned',
                          isBack: false,
                          isEdit: false,
                          isShare: false,
                          backAction: () async {},
                          editAction: () async {},
                          shareAction: () async {},
                        ),
                      ),
                      Expanded(
                        child: ListView(
                          padding: EdgeInsets.zero,
                          scrollDirection: Axis.vertical,
                          children: [
                            Padding(
                              padding: EdgeInsetsDirectional.fromSTEB(
                                  8.0, 8.0, 8.0, 0.0),
                              child: Builder(
                                builder: (context) {
                                  final getInspired = FFAppState()
                                      .RecentidentifierList
                                      .toList();

                                  return Wrap(
                                    spacing: 0.0,
                                    runSpacing: 0.0,
                                    alignment: WrapAlignment.start,
                                    crossAxisAlignment:
                                        WrapCrossAlignment.start,
                                    direction: Axis.horizontal,
                                    runAlignment: WrapAlignment.start,
                                    verticalDirection: VerticalDirection.down,
                                    clipBehavior: Clip.none,
                                    children: List.generate(getInspired.length,
                                        (getInspiredIndex) {
                                      final getInspiredItem =
                                          getInspired[getInspiredIndex];
                                      return Padding(
                                        padding: EdgeInsets.all(8.0),
                                        child: wrapWithModel(
                                          model: _model.recentIdentifierModels
                                              .getModel(
                                            getInspiredIndex.toString(),
                                            getInspiredIndex,
                                          ),
                                          updateCallback: () =>
                                              safeSetState(() {}),
                                          child: RecentIdentifierWidget(
                                            key: Key(
                                              'Key170_${getInspiredIndex.toString()}',
                                            ),
                                            detail: getInspiredItem,
                                            onTapAction: () async {
                                              context.pushNamed(
                                                ResultDetailsPageWidget
                                                    .routeName,
                                                queryParameters: {
                                                  'images': serializeParam(
                                                    getInspiredItem.img,
                                                    ParamType.String,
                                                  ),
                                                  'title': serializeParam(
                                                    getInspiredItem.title,
                                                    ParamType.String,
                                                  ),
                                                }.withoutNulls,
                                              );
                                            },
                                          ),
                                        ),
                                      );
                                    }),
                                  );
                                },
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
          ),
        ),
      ),
    );
  }
}
