import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import '/pages/components/scan_component/scan_component_widget.dart';
import '/pages/empty_components/no_results_component/no_results_component_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'favourite_page_model.dart';
export 'favourite_page_model.dart';

class FavouritePageWidget extends StatefulWidget {
  const FavouritePageWidget({super.key});

  static String routeName = 'FavouritePage';
  static String routePath = '/favouritePage';

  @override
  State<FavouritePageWidget> createState() => _FavouritePageWidgetState();
}

class _FavouritePageWidgetState extends State<FavouritePageWidget> {
  late FavouritePageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => FavouritePageModel());

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
                          title: 'Favourite',
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
                            if (FFAppState().favouriteDataList.isNotEmpty) {
                              return ListView(
                                padding: EdgeInsets.fromLTRB(
                                  0,
                                  8.0,
                                  0,
                                  8.0,
                                ),
                                scrollDirection: Axis.vertical,
                                children: [
                                  Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        8.0, 0.0, 8.0, 0.0),
                                    child: Builder(
                                      builder: (context) {
                                        final favAllList = FFAppState()
                                            .favouriteDataList
                                            .toList();

                                        return Wrap(
                                          spacing: 0.0,
                                          runSpacing: 0.0,
                                          alignment: WrapAlignment.start,
                                          crossAxisAlignment:
                                              WrapCrossAlignment.start,
                                          direction: Axis.horizontal,
                                          runAlignment: WrapAlignment.start,
                                          verticalDirection:
                                              VerticalDirection.down,
                                          clipBehavior: Clip.none,
                                          children:
                                              List.generate(favAllList.length,
                                                  (favAllListIndex) {
                                            final favAllListItem =
                                                favAllList[favAllListIndex];
                                            return Padding(
                                              padding: EdgeInsets.all(8.0),
                                              child: wrapWithModel(
                                                model: _model
                                                    .scanComponentModels
                                                    .getModel(
                                                  favAllListIndex.toString(),
                                                  favAllListIndex,
                                                ),
                                                updateCallback: () =>
                                                    safeSetState(() {}),
                                                child: ScanComponentWidget(
                                                  key: Key(
                                                    'Keyt8d_${favAllListIndex.toString()}',
                                                  ),
                                                  detail: favAllListItem,
                                                  onTap: () async {
                                                    context.pushNamed(
                                                      ResultDetailsPageWidget
                                                          .routeName,
                                                      queryParameters: {
                                                        'images':
                                                            serializeParam(
                                                          favAllListItem.image,
                                                          ParamType.String,
                                                        ),
                                                        'title': serializeParam(
                                                          favAllListItem.name,
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
                              );
                            } else {
                              return wrapWithModel(
                                model: _model.noResultsComponentModel,
                                updateCallback: () => safeSetState(() {}),
                                child: NoResultsComponentWidget(),
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
