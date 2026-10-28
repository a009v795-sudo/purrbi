import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/blog_component/blog_component_widget.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'blog_page_model.dart';
export 'blog_page_model.dart';

class BlogPageWidget extends StatefulWidget {
  const BlogPageWidget({super.key});

  static String routeName = 'BlogPage';
  static String routePath = '/blogPage';

  @override
  State<BlogPageWidget> createState() => _BlogPageWidgetState();
}

class _BlogPageWidgetState extends State<BlogPageWidget> {
  late BlogPageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => BlogPageModel());

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
                          title: 'Blog',
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
                            final getInspired =
                                FFAppState().BolgDataList.toList();

                            return ListView.separated(
                              padding: EdgeInsets.symmetric(vertical: 16.0),
                              scrollDirection: Axis.vertical,
                              itemCount: getInspired.length,
                              separatorBuilder: (_, __) =>
                                  SizedBox(height: 16.0),
                              itemBuilder: (context, getInspiredIndex) {
                                final getInspiredItem =
                                    getInspired[getInspiredIndex];
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
                                  child: wrapWithModel(
                                    model: _model.blogComponentModels.getModel(
                                      getInspiredItem.name,
                                      getInspiredIndex,
                                    ),
                                    updateCallback: () => safeSetState(() {}),
                                    child: BlogComponentWidget(
                                      key: Key(
                                        'Keyig2_${getInspiredItem.name}',
                                      ),
                                      detail: getInspiredItem,
                                      width: double.infinity,
                                      onTapAction: () async {
                                        context.pushNamed(
                                          BlolgDetailPageWidget.routeName,
                                          queryParameters: {
                                            'blogDetail': serializeParam(
                                              getInspiredItem,
                                              ParamType.DataStruct,
                                            ),
                                          }.withoutNulls,
                                        );
                                      },
                                    ),
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
