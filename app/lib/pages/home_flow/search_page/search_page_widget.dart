import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import '/pages/components/no_internet_component/no_internet_component_widget.dart';
import '/pages/components/scan_component/scan_component_widget.dart';
import '/pages/empty_components/no_data_found_component/no_data_found_component_widget.dart';
import 'dart:ui';
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'package:easy_debounce/easy_debounce.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'search_page_model.dart';
export 'search_page_model.dart';

class SearchPageWidget extends StatefulWidget {
  const SearchPageWidget({super.key});

  static String routeName = 'SearchPage';
  static String routePath = '/searchPage';

  @override
  State<SearchPageWidget> createState() => _SearchPageWidgetState();
}

class _SearchPageWidgetState extends State<SearchPageWidget> {
  late SearchPageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => SearchPageModel());

    _model.textController ??= TextEditingController();
    _model.textFieldFocusNode ??= FocusNode();
    _model.textFieldFocusNode!.addListener(() => safeSetState(() {}));
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
        resizeToAvoidBottomInset: false,
        backgroundColor: FlutterFlowTheme.of(context).bgColor,
        body: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: BoxDecoration(
            color: FlutterFlowTheme.of(context).bgColor,
          ),
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
                          title: 'Search',
                          isBack: false,
                          isEdit: false,
                          isShare: false,
                          backAction: () async {},
                          editAction: () async {},
                          shareAction: () async {},
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
                        child: Container(
                          width: double.infinity,
                          child: TextFormField(
                            controller: _model.textController,
                            focusNode: _model.textFieldFocusNode,
                            onChanged: (_) => EasyDebounce.debounce(
                              '_model.textController',
                              Duration(milliseconds: 100),
                              () => safeSetState(() {}),
                            ),
                            onFieldSubmitted: (_) async {
                              if (_model.textController.text != null &&
                                  _model.textController.text != '') {
                                FFAppState().addToSearchList(
                                    _model.textController.text);
                                FFAppState().update(() {});
                              }
                            },
                            autofocus: false,
                            textInputAction: TextInputAction.search,
                            obscureText: false,
                            decoration: InputDecoration(
                              isDense: false,
                              hintText: 'Search barcode....',
                              hintStyle: FlutterFlowTheme.of(context)
                                  .labelMedium
                                  .override(
                                    font: GoogleFonts.nunito(
                                      fontWeight: FontWeight.normal,
                                      fontStyle: FlutterFlowTheme.of(context)
                                          .labelMedium
                                          .fontStyle,
                                    ),
                                    color: FlutterFlowTheme.of(context)
                                        .secondaryText,
                                    fontSize: 17.0,
                                    letterSpacing: 0.0,
                                    fontWeight: FontWeight.normal,
                                    fontStyle: FlutterFlowTheme.of(context)
                                        .labelMedium
                                        .fontStyle,
                                    lineHeight: 1.0,
                                  ),
                              errorStyle: FlutterFlowTheme.of(context)
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
                                    color: FlutterFlowTheme.of(context).error,
                                    fontSize: 15.0,
                                    letterSpacing: 0.0,
                                    fontWeight: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .fontWeight,
                                    fontStyle: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .fontStyle,
                                    lineHeight: 1.0,
                                  ),
                              enabledBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color:
                                      FlutterFlowTheme.of(context).borderColor,
                                  width: 1.0,
                                ),
                                borderRadius: BorderRadius.circular(32.0),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: FlutterFlowTheme.of(context).primary,
                                  width: 1.0,
                                ),
                                borderRadius: BorderRadius.circular(32.0),
                              ),
                              errorBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: FlutterFlowTheme.of(context).error,
                                  width: 1.0,
                                ),
                                borderRadius: BorderRadius.circular(32.0),
                              ),
                              focusedErrorBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: FlutterFlowTheme.of(context).error,
                                  width: 1.0,
                                ),
                                borderRadius: BorderRadius.circular(32.0),
                              ),
                              filled: true,
                              fillColor: FlutterFlowTheme.of(context).buttonBg,
                              contentPadding: EdgeInsetsDirectional.fromSTEB(
                                  16.0, 15.0, 16.0, 15.0),
                              prefixIcon: Icon(
                                FFIcons.ksearchyp,
                                color: FlutterFlowTheme.of(context).iconColor,
                                size: 24.0,
                              ),
                              suffixIcon: _model.textController!.text.isNotEmpty
                                  ? InkWell(
                                      onTap: () async {
                                        _model.textController?.clear();
                                        safeSetState(() {});
                                      },
                                      child: Icon(
                                        Icons.clear,
                                        color: FlutterFlowTheme.of(context)
                                            .primaryText,
                                        size: 24.0,
                                      ),
                                    )
                                  : null,
                            ),
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
                                  fontSize: 17.0,
                                  letterSpacing: 0.0,
                                  fontWeight: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .fontWeight,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .fontStyle,
                                  lineHeight: 1.0,
                                ),
                            cursorColor:
                                FlutterFlowTheme.of(context).primaryText,
                            validator: _model.textControllerValidator
                                .asValidator(context),
                          ),
                        ),
                      ),
                      Expanded(
                        child: Builder(
                          builder: (context) {
                            if (FFAppState().connected) {
                              return Builder(
                                builder: (context) {
                                  if (_model.textController.text == null ||
                                      _model.textController.text == '') {
                                    return Builder(
                                      builder: (context) {
                                        if (FFAppState()
                                            .searchList
                                            .isNotEmpty) {
                                          return Column(
                                            mainAxisSize: MainAxisSize.max,
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Padding(
                                                padding: EdgeInsetsDirectional
                                                    .fromSTEB(
                                                        valueOrDefault<double>(
                                                          FFAppConstants
                                                              .mainPadding,
                                                          0.0,
                                                        ),
                                                        0.0,
                                                        valueOrDefault<double>(
                                                          FFAppConstants
                                                              .mainPadding,
                                                          0.0,
                                                        ),
                                                        0.0),
                                                child: Row(
                                                  mainAxisSize:
                                                      MainAxisSize.max,
                                                  mainAxisAlignment:
                                                      MainAxisAlignment
                                                          .spaceBetween,
                                                  children: [
                                                    Expanded(
                                                      child: Text(
                                                        'Recently Searches',
                                                        textAlign:
                                                            TextAlign.start,
                                                        maxLines: 1,
                                                        style: FlutterFlowTheme
                                                                .of(context)
                                                            .bodyMedium
                                                            .override(
                                                              font: GoogleFonts
                                                                  .nunito(
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w500,
                                                                fontStyle: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                              ),
                                                              fontSize: 18.0,
                                                              letterSpacing:
                                                                  0.0,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w500,
                                                              fontStyle:
                                                                  FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .fontStyle,
                                                              lineHeight: 1.33,
                                                            ),
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                      ),
                                                    ),
                                                    InkWell(
                                                      splashColor:
                                                          Colors.transparent,
                                                      focusColor:
                                                          Colors.transparent,
                                                      hoverColor:
                                                          Colors.transparent,
                                                      highlightColor:
                                                          Colors.transparent,
                                                      onTap: () async {
                                                        FFAppState()
                                                            .searchList = [];
                                                        FFAppState()
                                                            .update(() {});
                                                      },
                                                      child: Text(
                                                        'Clear all',
                                                        textAlign:
                                                            TextAlign.end,
                                                        maxLines: 1,
                                                        style: FlutterFlowTheme
                                                                .of(context)
                                                            .bodyMedium
                                                            .override(
                                                              font: GoogleFonts
                                                                  .nunito(
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w500,
                                                                fontStyle: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                              ),
                                                              color: FlutterFlowTheme
                                                                      .of(context)
                                                                  .primary,
                                                              fontSize: 13.0,
                                                              letterSpacing:
                                                                  0.0,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w500,
                                                              fontStyle:
                                                                  FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .fontStyle,
                                                              lineHeight: 1.38,
                                                            ),
                                                      ),
                                                    ),
                                                  ].divide(
                                                      SizedBox(width: 8.0)),
                                                ),
                                              ),
                                              Expanded(
                                                child: Builder(
                                                  builder: (context) {
                                                    final searchAllList =
                                                        FFAppState()
                                                            .searchList
                                                            .toList();

                                                    return SingleChildScrollView(
                                                      child: Column(
                                                        mainAxisSize:
                                                            MainAxisSize.max,
                                                        crossAxisAlignment:
                                                            CrossAxisAlignment
                                                                .start,
                                                        children: List.generate(
                                                            searchAllList
                                                                .length,
                                                            (searchAllListIndex) {
                                                          final searchAllListItem =
                                                              searchAllList[
                                                                  searchAllListIndex];
                                                          return Padding(
                                                            padding: EdgeInsetsDirectional
                                                                .fromSTEB(
                                                                    valueOrDefault<
                                                                        double>(
                                                                      FFAppConstants
                                                                          .mainPadding,
                                                                      0.0,
                                                                    ),
                                                                    0.0,
                                                                    valueOrDefault<
                                                                        double>(
                                                                      FFAppConstants
                                                                          .mainPadding,
                                                                      0.0,
                                                                    ),
                                                                    0.0),
                                                            child: Row(
                                                              mainAxisSize:
                                                                  MainAxisSize
                                                                      .max,
                                                              mainAxisAlignment:
                                                                  MainAxisAlignment
                                                                      .spaceBetween,
                                                              crossAxisAlignment:
                                                                  CrossAxisAlignment
                                                                      .start,
                                                              children: [
                                                                Expanded(
                                                                  child:
                                                                      InkWell(
                                                                    splashColor:
                                                                        Colors
                                                                            .transparent,
                                                                    focusColor:
                                                                        Colors
                                                                            .transparent,
                                                                    hoverColor:
                                                                        Colors
                                                                            .transparent,
                                                                    highlightColor:
                                                                        Colors
                                                                            .transparent,
                                                                    onTap:
                                                                        () async {
                                                                      safeSetState(
                                                                          () {
                                                                        _model
                                                                            .textController
                                                                            ?.text = searchAllListItem;
                                                                      });
                                                                    },
                                                                    child: Text(
                                                                      searchAllListItem,
                                                                      textAlign:
                                                                          TextAlign
                                                                              .start,
                                                                      style: FlutterFlowTheme.of(
                                                                              context)
                                                                          .bodyMedium
                                                                          .override(
                                                                            font:
                                                                                GoogleFonts.nunito(
                                                                              fontWeight: FontWeight.normal,
                                                                              fontStyle: FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                                                                            ),
                                                                            color:
                                                                                FlutterFlowTheme.of(context).secondaryText,
                                                                            fontSize:
                                                                                17.0,
                                                                            letterSpacing:
                                                                                0.0,
                                                                            fontWeight:
                                                                                FontWeight.normal,
                                                                            fontStyle:
                                                                                FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                                                                            lineHeight:
                                                                                1.52,
                                                                          ),
                                                                    ),
                                                                  ),
                                                                ),
                                                                InkWell(
                                                                  splashColor:
                                                                      Colors
                                                                          .transparent,
                                                                  focusColor: Colors
                                                                      .transparent,
                                                                  hoverColor: Colors
                                                                      .transparent,
                                                                  highlightColor:
                                                                      Colors
                                                                          .transparent,
                                                                  onTap:
                                                                      () async {
                                                                    FFAppState()
                                                                        .removeAtIndexFromSearchList(
                                                                            searchAllListIndex);
                                                                    FFAppState()
                                                                        .update(
                                                                            () {});
                                                                  },
                                                                  child: Icon(
                                                                    FFIcons
                                                                        .kcloseyp,
                                                                    color: FlutterFlowTheme.of(
                                                                            context)
                                                                        .primaryText,
                                                                    size: 20.0,
                                                                  ),
                                                                ),
                                                              ].divide(SizedBox(
                                                                  width: 8.0)),
                                                            ),
                                                          );
                                                        }).divide(SizedBox(
                                                            height: 16.0)),
                                                      ),
                                                    );
                                                  },
                                                ),
                                              ),
                                            ]
                                                .divide(SizedBox(height: 16.0))
                                                .addToStart(
                                                    SizedBox(height: 12.0))
                                                .addToEnd(
                                                    SizedBox(height: 12.0)),
                                          );
                                        } else {
                                          return Column(
                                            mainAxisSize: MainAxisSize.max,
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Padding(
                                                padding: EdgeInsetsDirectional
                                                    .fromSTEB(
                                                        valueOrDefault<double>(
                                                          FFAppConstants
                                                              .mainPadding,
                                                          0.0,
                                                        ),
                                                        0.0,
                                                        valueOrDefault<double>(
                                                          FFAppConstants
                                                              .mainPadding,
                                                          0.0,
                                                        ),
                                                        0.0),
                                                child: Text(
                                                  '${FFAppState().MainDataList.length.toString()} results for \"All\"',
                                                  textAlign: TextAlign.start,
                                                  style: FlutterFlowTheme.of(
                                                          context)
                                                      .bodyMedium
                                                      .override(
                                                        font:
                                                            GoogleFonts.nunito(
                                                          fontWeight:
                                                              FontWeight.w500,
                                                          fontStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontStyle,
                                                        ),
                                                        color:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .primary,
                                                        fontSize: 15.0,
                                                        letterSpacing: 0.0,
                                                        fontWeight:
                                                            FontWeight.w500,
                                                        fontStyle:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMedium
                                                                .fontStyle,
                                                        lineHeight: 1.33,
                                                      ),
                                                ),
                                              ),
                                              Expanded(
                                                child: ListView(
                                                  padding: EdgeInsets.zero,
                                                  scrollDirection:
                                                      Axis.vertical,
                                                  children: [
                                                    Padding(
                                                      padding:
                                                          EdgeInsetsDirectional
                                                              .fromSTEB(
                                                                  8.0,
                                                                  0.0,
                                                                  8.0,
                                                                  0.0),
                                                      child: Builder(
                                                        builder: (context) {
                                                          final allYogaList =
                                                              FFAppState()
                                                                  .MainDataList
                                                                  .toList();

                                                          return Wrap(
                                                            spacing: 0.0,
                                                            runSpacing: 0.0,
                                                            alignment:
                                                                WrapAlignment
                                                                    .start,
                                                            crossAxisAlignment:
                                                                WrapCrossAlignment
                                                                    .start,
                                                            direction:
                                                                Axis.horizontal,
                                                            runAlignment:
                                                                WrapAlignment
                                                                    .start,
                                                            verticalDirection:
                                                                VerticalDirection
                                                                    .down,
                                                            clipBehavior:
                                                                Clip.none,
                                                            children: List.generate(
                                                                allYogaList
                                                                    .length,
                                                                (allYogaListIndex) {
                                                              final allYogaListItem =
                                                                  allYogaList[
                                                                      allYogaListIndex];
                                                              return Padding(
                                                                padding:
                                                                    EdgeInsets
                                                                        .all(
                                                                            8.0),
                                                                child:
                                                                    wrapWithModel(
                                                                  model: _model
                                                                      .scanComponentModels1
                                                                      .getModel(
                                                                    allYogaListIndex
                                                                        .toString(),
                                                                    allYogaListIndex,
                                                                  ),
                                                                  updateCallback: () =>
                                                                      safeSetState(
                                                                          () {}),
                                                                  child:
                                                                      ScanComponentWidget(
                                                                    key: Key(
                                                                      'Keyqdf_${allYogaListIndex.toString()}',
                                                                    ),
                                                                    detail:
                                                                        allYogaListItem,
                                                                    onTap:
                                                                        () async {
                                                                      context
                                                                          .pushNamed(
                                                                        ResultDetailsPageWidget
                                                                            .routeName,
                                                                        queryParameters:
                                                                            {
                                                                          'images':
                                                                              serializeParam(
                                                                            allYogaListItem.image,
                                                                            ParamType.String,
                                                                          ),
                                                                          'title':
                                                                              serializeParam(
                                                                            allYogaListItem.name,
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
                                            ]
                                                .divide(SizedBox(height: 4.0))
                                                .addToStart(
                                                    SizedBox(height: 12.0))
                                                .addToEnd(
                                                    SizedBox(height: 8.0)),
                                          );
                                        }
                                      },
                                    );
                                  } else {
                                    return Builder(
                                      builder: (context) {
                                        if (functions
                                            .searchFunction(
                                                _model.textController.text,
                                                FFAppState()
                                                    .MainDataList
                                                    .toList())
                                            .isNotEmpty) {
                                          return Column(
                                            mainAxisSize: MainAxisSize.max,
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Padding(
                                                padding: EdgeInsetsDirectional
                                                    .fromSTEB(
                                                        valueOrDefault<double>(
                                                          FFAppConstants
                                                              .mainPadding,
                                                          0.0,
                                                        ),
                                                        0.0,
                                                        valueOrDefault<double>(
                                                          FFAppConstants
                                                              .mainPadding,
                                                          0.0,
                                                        ),
                                                        0.0),
                                                child: Text(
                                                  '${functions.searchFunction(_model.textController.text, FFAppState().MainDataList.toList()).length.toString()} results for \"${_model.textController.text}\"',
                                                  textAlign: TextAlign.start,
                                                  style: FlutterFlowTheme.of(
                                                          context)
                                                      .bodyMedium
                                                      .override(
                                                        font:
                                                            GoogleFonts.nunito(
                                                          fontWeight:
                                                              FontWeight.w500,
                                                          fontStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontStyle,
                                                        ),
                                                        color:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .primary,
                                                        fontSize: 15.0,
                                                        letterSpacing: 0.0,
                                                        fontWeight:
                                                            FontWeight.w500,
                                                        fontStyle:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMedium
                                                                .fontStyle,
                                                        lineHeight: 1.33,
                                                      ),
                                                ),
                                              ),
                                              Expanded(
                                                child: ListView(
                                                  padding: EdgeInsets.zero,
                                                  scrollDirection:
                                                      Axis.vertical,
                                                  children: [
                                                    Padding(
                                                      padding:
                                                          EdgeInsetsDirectional
                                                              .fromSTEB(
                                                                  8.0,
                                                                  0.0,
                                                                  8.0,
                                                                  0.0),
                                                      child: Builder(
                                                        builder: (context) {
                                                          final filterYogaList = functions
                                                              .searchFunction(
                                                                  _model
                                                                      .textController
                                                                      .text,
                                                                  FFAppState()
                                                                      .MainDataList
                                                                      .toList())
                                                              .toList();

                                                          return Wrap(
                                                            spacing: 0.0,
                                                            runSpacing: 0.0,
                                                            alignment:
                                                                WrapAlignment
                                                                    .start,
                                                            crossAxisAlignment:
                                                                WrapCrossAlignment
                                                                    .start,
                                                            direction:
                                                                Axis.horizontal,
                                                            runAlignment:
                                                                WrapAlignment
                                                                    .start,
                                                            verticalDirection:
                                                                VerticalDirection
                                                                    .down,
                                                            clipBehavior:
                                                                Clip.none,
                                                            children: List.generate(
                                                                filterYogaList
                                                                    .length,
                                                                (filterYogaListIndex) {
                                                              final filterYogaListItem =
                                                                  filterYogaList[
                                                                      filterYogaListIndex];
                                                              return Padding(
                                                                padding:
                                                                    EdgeInsets
                                                                        .all(
                                                                            8.0),
                                                                child:
                                                                    wrapWithModel(
                                                                  model: _model
                                                                      .scanComponentModels2
                                                                      .getModel(
                                                                    filterYogaListIndex
                                                                        .toString(),
                                                                    filterYogaListIndex,
                                                                  ),
                                                                  updateCallback: () =>
                                                                      safeSetState(
                                                                          () {}),
                                                                  child:
                                                                      ScanComponentWidget(
                                                                    key: Key(
                                                                      'Keyr10_${filterYogaListIndex.toString()}',
                                                                    ),
                                                                    detail:
                                                                        filterYogaListItem,
                                                                    onTap:
                                                                        () async {
                                                                      context
                                                                          .pushNamed(
                                                                        ResultDetailsPageWidget
                                                                            .routeName,
                                                                        queryParameters:
                                                                            {
                                                                          'images':
                                                                              serializeParam(
                                                                            filterYogaListItem.image,
                                                                            ParamType.String,
                                                                          ),
                                                                          'title':
                                                                              serializeParam(
                                                                            filterYogaListItem.name,
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
                                            ]
                                                .divide(SizedBox(height: 4.0))
                                                .addToStart(
                                                    SizedBox(height: 12.0))
                                                .addToEnd(
                                                    SizedBox(height: 8.0)),
                                          );
                                        } else {
                                          return wrapWithModel(
                                            model: _model
                                                .noDataFoundComponentModel,
                                            updateCallback: () =>
                                                safeSetState(() {}),
                                            child: NoDataFoundComponentWidget(),
                                          );
                                        }
                                      },
                                    );
                                  }
                                },
                              );
                            } else {
                              return wrapWithModel(
                                model: _model.noInternetComponentModel,
                                updateCallback: () => safeSetState(() {}),
                                child: NoInternetComponentWidget(),
                              );
                            }
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
