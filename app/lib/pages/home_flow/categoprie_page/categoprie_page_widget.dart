import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import '/pages/components/scan_component/scan_component_widget.dart';
import 'dart:math';
import 'dart:ui';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'categoprie_page_model.dart';
export 'categoprie_page_model.dart';

class CategopriePageWidget extends StatefulWidget {
  const CategopriePageWidget({
    super.key,
    required this.appbarName,
  });

  final String? appbarName;

  static String routeName = 'CategopriePage';
  static String routePath = '/categopriePage';

  @override
  State<CategopriePageWidget> createState() => _CategopriePageWidgetState();
}

class _CategopriePageWidgetState extends State<CategopriePageWidget>
    with TickerProviderStateMixin {
  late CategopriePageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  final animationsMap = <String, AnimationInfo>{};

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CategopriePageModel());

    animationsMap.addAll({
      'scanComponentOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: null,
      ),
    });

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
                          title: widget!.appbarName!,
                          isBack: false,
                          isEdit: false,
                          isShare: false,
                          backAction: () async {},
                          editAction: () async {},
                          shareAction: () async {},
                        ),
                      ),
                      Expanded(
                        child: Builder(
                          builder: (context) {
                            final mainList = (FFAppState().selectExplore ==
                                        'All'
                                    ? FFAppState().MainDataList
                                    : FFAppState()
                                        .MainDataList
                                        .where((e) => e.categorieName.contains(
                                            FFAppState().selectExplore))
                                        .toList())
                                .toList();

                            return ListView.separated(
                              padding: EdgeInsets.fromLTRB(
                                0,
                                8.0,
                                0,
                                8.0,
                              ),
                              shrinkWrap: true,
                              scrollDirection: Axis.vertical,
                              itemCount: mainList.length,
                              separatorBuilder: (_, __) =>
                                  SizedBox(height: 12.0),
                              itemBuilder: (context, mainListIndex) {
                                final mainListItem = mainList[mainListIndex];
                                return Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      16.0, 0.0, 16.0, 0.0),
                                  child: wrapWithModel(
                                    model: _model.scanComponentModels.getModel(
                                      mainListIndex.toString(),
                                      mainListIndex,
                                    ),
                                    updateCallback: () => safeSetState(() {}),
                                    child: ScanComponentWidget(
                                      key: Key(
                                        'Keybi1_${mainListIndex.toString()}',
                                      ),
                                      detail: mainListItem,
                                      onTap: () async {
                                        context.pushNamed(
                                          ResultDetailsPageWidget.routeName,
                                          queryParameters: {
                                            'images': serializeParam(
                                              mainListItem.image,
                                              ParamType.String,
                                            ),
                                            'title': serializeParam(
                                              mainListItem.name,
                                              ParamType.String,
                                            ),
                                          }.withoutNulls,
                                        );
                                      },
                                    ),
                                  ).animateOnPageLoad(
                                    animationsMap[
                                        'scanComponentOnPageLoadAnimation']!,
                                    effects: [
                                      MoveEffect(
                                        curve: Curves.easeInOut,
                                        delay:
                                            (mainListIndex * 20).toDouble().ms,
                                        duration: 200.0.ms,
                                        begin: Offset(0.0, 60.0),
                                        end: Offset(0.0, 0.0),
                                      ),
                                      FadeEffect(
                                        curve: Curves.easeInOut,
                                        delay:
                                            (mainListIndex * 20).toDouble().ms,
                                        duration: 200.0.ms,
                                        begin: 0.0,
                                        end: 1.0,
                                      ),
                                    ],
                                  ),
                                );
                              },
                            );
                          },
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
