import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/center_appbar/center_appbar_widget.dart';
import '/pages/components/row_component/row_component_widget.dart';
import '/pages/components/scan_component/scan_component_widget.dart';
import 'dart:math';
import 'dart:ui';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'explore_component_model.dart';
export 'explore_component_model.dart';

class ExploreComponentWidget extends StatefulWidget {
  const ExploreComponentWidget({super.key});

  @override
  State<ExploreComponentWidget> createState() => _ExploreComponentWidgetState();
}

class _ExploreComponentWidgetState extends State<ExploreComponentWidget>
    with TickerProviderStateMixin {
  late ExploreComponentModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => ExploreComponentModel());

    animationsMap.addAll({
      'containerOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          VisibilityEffect(duration: 1.ms),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 300.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 300.0.ms,
            begin: Offset(0.9, 0.9),
            end: Offset(1.0, 1.0),
          ),
        ],
      ),
      'scanComponentOnPageLoadAnimation1': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: null,
      ),
      'scanComponentOnPageLoadAnimation2': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: null,
      ),
    });

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
              title: 'Explore ',
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
              4.0),
          child: InkWell(
            splashColor: Colors.transparent,
            focusColor: Colors.transparent,
            hoverColor: Colors.transparent,
            highlightColor: Colors.transparent,
            onTap: () async {
              context.pushNamed(SearchPageWidget.routeName);
            },
            child: Container(
              width: double.infinity,
              height: 54.0,
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).buttonBg,
                borderRadius: BorderRadius.circular(32.0),
                border: Border.all(
                  color: FlutterFlowTheme.of(context).borderColor,
                  width: 1.0,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.max,
                children: [
                  Icon(
                    FFIcons.ksearchyp,
                    color: FlutterFlowTheme.of(context).iconColor,
                    size: 24.0,
                  ),
                  Expanded(
                    child: Text(
                      'Search barcode....',
                      textAlign: TextAlign.start,
                      maxLines: 1,
                      style: FlutterFlowTheme.of(context).bodyMedium.override(
                            font: GoogleFonts.nunito(
                              fontWeight: FontWeight.normal,
                              fontStyle: FlutterFlowTheme.of(context)
                                  .bodyMedium
                                  .fontStyle,
                            ),
                            color: FlutterFlowTheme.of(context).secondaryText,
                            fontSize: 17.0,
                            letterSpacing: 0.0,
                            fontWeight: FontWeight.normal,
                            fontStyle: FlutterFlowTheme.of(context)
                                .bodyMedium
                                .fontStyle,
                            lineHeight: 1.52,
                          ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ].divide(SizedBox(width: 16.0)).around(SizedBox(width: 16.0)),
              ),
            ),
          ),
        ),
        Expanded(
          child: ListView(
            padding: EdgeInsets.fromLTRB(
              0,
              8.0,
              0,
              8.0,
            ),
            primary: false,
            shrinkWrap: true,
            scrollDirection: Axis.vertical,
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
                    16.0),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24.0),
                  child: Image.asset(
                    'assets/images/explore-banner_.png',
                    width: double.infinity,
                    height: 198.0,
                    fit: BoxFit.fill,
                  ),
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.max,
                children: [
                  wrapWithModel(
                    model: _model.rowComponentModel1,
                    updateCallback: () => safeSetState(() {}),
                    child: RowComponentWidget(
                      text: 'Popular',
                      isShow: true,
                      viewAllAction: () async {
                        context.pushNamed(PopularfootprintPageWidget.routeName);
                      },
                    ),
                  ),
                  Align(
                    alignment: AlignmentDirectional(-1.0, 0.0),
                    child: Padding(
                      padding:
                          EdgeInsetsDirectional.fromSTEB(8.0, 8.0, 8.0, 0.0),
                      child: Builder(
                        builder: (context) {
                          final mainList = FFAppState()
                              .MainDataList
                              .where((e) => e.popularfootprint == true)
                              .toList()
                              .take(2)
                              .toList();

                          return Wrap(
                            spacing: 0.0,
                            runSpacing: 0.0,
                            alignment: WrapAlignment.start,
                            crossAxisAlignment: WrapCrossAlignment.start,
                            direction: Axis.horizontal,
                            runAlignment: WrapAlignment.start,
                            verticalDirection: VerticalDirection.down,
                            clipBehavior: Clip.none,
                            children:
                                List.generate(mainList.length, (mainListIndex) {
                              final mainListItem = mainList[mainListIndex];
                              return Padding(
                                padding: EdgeInsets.all(8.0),
                                child: wrapWithModel(
                                  model: _model.scanComponentModels1.getModel(
                                    mainListIndex.toString(),
                                    mainListIndex,
                                  ),
                                  updateCallback: () => safeSetState(() {}),
                                  child: ScanComponentWidget(
                                    key: Key(
                                      'Keyozt_${mainListIndex.toString()}',
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
                                      'scanComponentOnPageLoadAnimation1']!,
                                  effects: [
                                    MoveEffect(
                                      curve: Curves.easeInOut,
                                      delay: (mainListIndex * 20).toDouble().ms,
                                      duration: 200.0.ms,
                                      begin: Offset(0.0, 60.0),
                                      end: Offset(0.0, 0.0),
                                    ),
                                    FadeEffect(
                                      curve: Curves.easeInOut,
                                      delay: (mainListIndex * 20).toDouble().ms,
                                      duration: 200.0.ms,
                                      begin: 0.0,
                                      end: 1.0,
                                    ),
                                  ],
                                ),
                              );
                            }),
                          );
                        },
                      ),
                    ),
                  ),
                ],
              ),
              Container(
                decoration: BoxDecoration(),
                child: Column(
                  mainAxisSize: MainAxisSize.max,
                  children: [
                    Column(
                      mainAxisSize: MainAxisSize.max,
                      children: [
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 0.0, 0.0, 16.0),
                          child: wrapWithModel(
                            model: _model.rowComponentModel2,
                            updateCallback: () => safeSetState(() {}),
                            child: RowComponentWidget(
                              text: 'Category',
                              isShow: true,
                              viewAllAction: () async {
                                context.pushNamed(
                                    CategoprieListPageWidget.routeName);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                    Padding(
                      padding:
                          EdgeInsetsDirectional.fromSTEB(16.0, 0.0, 16.0, 0.0),
                      child: Builder(
                        builder: (context) {
                          final categorieList = FFAppState()
                              .categorieDataList
                              .toList()
                              .take(4)
                              .toList();

                          return Wrap(
                            spacing: 16.0,
                            runSpacing: 16.0,
                            alignment: WrapAlignment.start,
                            crossAxisAlignment: WrapCrossAlignment.start,
                            direction: Axis.horizontal,
                            runAlignment: WrapAlignment.start,
                            verticalDirection: VerticalDirection.down,
                            clipBehavior: Clip.none,
                            children: List.generate(categorieList.length,
                                (categorieListIndex) {
                              final categorieListItem =
                                  categorieList[categorieListIndex];
                              return InkWell(
                                splashColor: Colors.transparent,
                                focusColor: Colors.transparent,
                                hoverColor: Colors.transparent,
                                highlightColor: Colors.transparent,
                                onTap: () async {
                                  FFAppState().selectExplore =
                                      categorieListItem.name;
                                  FFAppState().update(() {});

                                  context.pushNamed(
                                    CategopriePageWidget.routeName,
                                    queryParameters: {
                                      'appbarName': serializeParam(
                                        categorieListItem.name,
                                        ParamType.String,
                                      ),
                                    }.withoutNulls,
                                  );
                                },
                                child: Stack(
                                  children: [
                                    Container(
                                      width: MediaQuery.sizeOf(context).width >
                                              FFAppConstants.maxWidth
                                          ? ((FFAppConstants.maxWidth - 48) *
                                              1 /
                                              2)
                                          : ((MediaQuery.sizeOf(context).width -
                                                  48) *
                                              1 /
                                              2),
                                      height: 98.0,
                                      decoration: BoxDecoration(
                                        borderRadius:
                                            BorderRadius.circular(16.0),
                                        border: Border.all(
                                          color: FlutterFlowTheme.of(context)
                                              .borderColor,
                                        ),
                                      ),
                                      alignment: AlignmentDirectional(0.0, 0.0),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.max,
                                        children: [
                                          Expanded(
                                            child: Padding(
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(
                                                      16.0, 16.0, 0.0, 16.0),
                                              child: Column(
                                                mainAxisSize: MainAxisSize.max,
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Padding(
                                                    padding:
                                                        EdgeInsetsDirectional
                                                            .fromSTEB(12.0, 0.0,
                                                                12.0, 0.0),
                                                    child: Text(
                                                      valueOrDefault<String>(
                                                        categorieListItem.name,
                                                        'Food & Beverages',
                                                      ),
                                                      maxLines: 1,
                                                      style: FlutterFlowTheme
                                                              .of(context)
                                                          .bodyMedium
                                                          .override(
                                                            font: GoogleFonts
                                                                .nunito(
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w600,
                                                              fontStyle:
                                                                  FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .fontStyle,
                                                            ),
                                                            color: FlutterFlowTheme
                                                                    .of(context)
                                                                .primaryText,
                                                            fontSize: 18.0,
                                                            letterSpacing: 0.0,
                                                            fontWeight:
                                                                FontWeight.w600,
                                                            fontStyle:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                          ),
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                  Row(
                                                    mainAxisSize:
                                                        MainAxisSize.max,
                                                    children: [
                                                      Padding(
                                                        padding:
                                                            EdgeInsetsDirectional
                                                                .fromSTEB(
                                                                    12.0,
                                                                    0.0,
                                                                    12.0,
                                                                    0.0),
                                                        child: Text(
                                                          'Explore',
                                                          maxLines: 1,
                                                          style: FlutterFlowTheme
                                                                  .of(context)
                                                              .bodyMedium
                                                              .override(
                                                                font:
                                                                    GoogleFonts
                                                                        .nunito(
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .normal,
                                                                  fontStyle: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .fontStyle,
                                                                ),
                                                                color: FlutterFlowTheme.of(
                                                                        context)
                                                                    .primaryText,
                                                                fontSize: 11.0,
                                                                letterSpacing:
                                                                    0.0,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .normal,
                                                                fontStyle: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                              ),
                                                          overflow: TextOverflow
                                                              .ellipsis,
                                                        ),
                                                      ),
                                                      Icon(
                                                        Icons
                                                            .keyboard_arrow_right,
                                                        color:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .primaryText,
                                                        size: 14.0,
                                                      ),
                                                    ],
                                                  ),
                                                ].divide(SizedBox(height: 6.0)),
                                              ),
                                            ),
                                          ),
                                          ClipRRect(
                                            borderRadius:
                                                BorderRadius.circular(8.0),
                                            child: Image.network(
                                              valueOrDefault<String>(
                                                categorieListItem.img,
                                                'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/39v7pux7h1up/recent-4.png',
                                              ),
                                              width: 78.0,
                                              height: 78.0,
                                              fit: BoxFit.cover,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
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
              Column(
                mainAxisSize: MainAxisSize.max,
                children: [
                  Padding(
                    padding:
                        EdgeInsetsDirectional.fromSTEB(0.0, 16.0, 0.0, 16.0),
                    child: wrapWithModel(
                      model: _model.rowComponentModel3,
                      updateCallback: () => safeSetState(() {}),
                      child: RowComponentWidget(
                        text: 'Trending now',
                        isShow: true,
                        viewAllAction: () async {
                          context.pushNamed(TrendingnowPageWidget.routeName);
                        },
                      ),
                    ),
                  ),
                  Align(
                    alignment: AlignmentDirectional(-1.0, 0.0),
                    child: Padding(
                      padding:
                          EdgeInsetsDirectional.fromSTEB(8.0, 8.0, 8.0, 0.0),
                      child: Builder(
                        builder: (context) {
                          final trendingList = FFAppState()
                              .MainDataList
                              .where((e) => e.trendingnow == true)
                              .toList()
                              .take(2)
                              .toList();

                          return ListView.builder(
                            padding: EdgeInsets.zero,
                            shrinkWrap: true,
                            scrollDirection: Axis.vertical,
                            itemCount: trendingList.length,
                            itemBuilder: (context, trendingListIndex) {
                              final trendingListItem =
                                  trendingList[trendingListIndex];
                              return Padding(
                                padding: EdgeInsets.all(8.0),
                                child: wrapWithModel(
                                  model: _model.scanComponentModels2.getModel(
                                    trendingListIndex.toString(),
                                    trendingListIndex,
                                  ),
                                  updateCallback: () => safeSetState(() {}),
                                  child: ScanComponentWidget(
                                    key: Key(
                                      'Keye72_${trendingListIndex.toString()}',
                                    ),
                                    detail: trendingListItem,
                                    onTap: () async {
                                      context.pushNamed(
                                        ResultDetailsPageWidget.routeName,
                                        queryParameters: {
                                          'images': serializeParam(
                                            trendingListItem.image,
                                            ParamType.String,
                                          ),
                                          'title': serializeParam(
                                            trendingListItem.name,
                                            ParamType.String,
                                          ),
                                        }.withoutNulls,
                                      );
                                    },
                                  ),
                                ).animateOnPageLoad(
                                  animationsMap[
                                      'scanComponentOnPageLoadAnimation2']!,
                                  effects: [
                                    MoveEffect(
                                      curve: Curves.easeInOut,
                                      delay: (trendingListIndex * 20)
                                          .toDouble()
                                          .ms,
                                      duration: 200.0.ms,
                                      begin: Offset(0.0, 60.0),
                                      end: Offset(0.0, 0.0),
                                    ),
                                    FadeEffect(
                                      curve: Curves.easeInOut,
                                      delay: (trendingListIndex * 20)
                                          .toDouble()
                                          .ms,
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
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    ).animateOnPageLoad(animationsMap['containerOnPageLoadAnimation']!);
  }
}
