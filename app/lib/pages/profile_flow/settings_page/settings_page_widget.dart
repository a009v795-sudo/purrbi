import '/auth/firebase_auth/auth_util.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import '/pages/dialog_components/delete_account_dialog/delete_account_dialog_widget.dart';
import 'dart:math';
import 'dart:ui';
import '/actions/actions.dart' as action_blocks;
import '/custom_code/actions/index.dart' as actions;
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'settings_page_model.dart';
export 'settings_page_model.dart';

class SettingsPageWidget extends StatefulWidget {
  const SettingsPageWidget({super.key});

  static String routeName = 'SettingsPage';
  static String routePath = '/settingsPage';

  @override
  State<SettingsPageWidget> createState() => _SettingsPageWidgetState();
}

class _SettingsPageWidgetState extends State<SettingsPageWidget>
    with TickerProviderStateMixin {
  late SettingsPageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  final animationsMap = <String, AnimationInfo>{};

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => SettingsPageModel());

    animationsMap.addAll({
      'columnOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          MoveEffect(
            curve: Curves.easeInOut,
            delay: 100.0.ms,
            duration: 400.0.ms,
            begin: Offset(-100.0, 0.0),
            end: Offset(0.0, 0.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 100.0.ms,
            duration: 400.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
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
                          title: 'Settings',
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
                          padding: EdgeInsets.fromLTRB(
                            0,
                            16.0,
                            0,
                            12.0,
                          ),
                          scrollDirection: Axis.vertical,
                          children: [
                            Column(
                              mainAxisSize: MainAxisSize.max,
                              crossAxisAlignment: CrossAxisAlignment.start,
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
                                      0.0),
                                  child: Container(
                                    width: double.infinity,
                                    decoration: BoxDecoration(
                                      color:
                                          FlutterFlowTheme.of(context).buttonBg,
                                      borderRadius: BorderRadius.circular(16.0),
                                      border: Border.all(
                                        color: FlutterFlowTheme.of(context)
                                            .borderColor,
                                        width: 1.0,
                                      ),
                                    ),
                                    child: Padding(
                                      padding: EdgeInsets.all(16.0),
                                      child: Column(
                                        mainAxisSize: MainAxisSize.max,
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          InkWell(
                                            splashColor: Colors.transparent,
                                            focusColor: Colors.transparent,
                                            hoverColor: Colors.transparent,
                                            highlightColor: Colors.transparent,
                                            onTap: () async {
                                              context.pushNamed(
                                                  AboutUsPageWidget.routeName);
                                            },
                                            child: Row(
                                              mainAxisSize: MainAxisSize.max,
                                              children: [
                                                Container(
                                                  width: 38.0,
                                                  height: 38.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryLightColor,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Icon(
                                                    FFIcons.kinfoyp,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    size: 20.0,
                                                  ),
                                                ),
                                                Expanded(
                                                  child: Text(
                                                    'About us',
                                                    textAlign: TextAlign.start,
                                                    maxLines: 1,
                                                    style: FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMedium
                                                        .override(
                                                          font: GoogleFonts
                                                              .nunito(
                                                            fontWeight:
                                                                FontWeight
                                                                    .normal,
                                                            fontStyle:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                          ),
                                                          fontSize: 17.0,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.normal,
                                                          fontStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontStyle,
                                                          lineHeight: 1.52,
                                                        ),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                Icon(
                                                  FFIcons.karrowrightyp,
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .iconColor,
                                                  size: 20.0,
                                                ),
                                              ].divide(SizedBox(width: 12.0)),
                                            ),
                                          ),
                                          Container(
                                            width: double.infinity,
                                            height: 1.0,
                                            decoration: BoxDecoration(
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .borderColor,
                                            ),
                                          ),
                                          InkWell(
                                            splashColor: Colors.transparent,
                                            focusColor: Colors.transparent,
                                            hoverColor: Colors.transparent,
                                            highlightColor: Colors.transparent,
                                            onTap: () async {
                                              context.pushNamed(
                                                  TermsConditionPageWidget
                                                      .routeName);
                                            },
                                            child: Row(
                                              mainAxisSize: MainAxisSize.max,
                                              children: [
                                                Container(
                                                  width: 38.0,
                                                  height: 38.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryLightColor,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Icon(
                                                    FFIcons.ktermsconditionsyp,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    size: 20.0,
                                                  ),
                                                ),
                                                Expanded(
                                                  child: Text(
                                                    'Terms & conditions',
                                                    textAlign: TextAlign.start,
                                                    maxLines: 1,
                                                    style: FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMedium
                                                        .override(
                                                          font: GoogleFonts
                                                              .nunito(
                                                            fontWeight:
                                                                FontWeight
                                                                    .normal,
                                                            fontStyle:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                          ),
                                                          fontSize: 17.0,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.normal,
                                                          fontStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontStyle,
                                                          lineHeight: 1.52,
                                                        ),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                Icon(
                                                  FFIcons.karrowrightyp,
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .iconColor,
                                                  size: 20.0,
                                                ),
                                              ].divide(SizedBox(width: 12.0)),
                                            ),
                                          ),
                                          Container(
                                            width: double.infinity,
                                            height: 1.0,
                                            decoration: BoxDecoration(
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .borderColor,
                                            ),
                                          ),
                                          if (FFAppConstants.featureStoreLinks)
                                            Row(
                                              mainAxisSize: MainAxisSize.max,
                                              children: [
                                                Container(
                                                  width: 38.0,
                                                  height: 38.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryLightColor,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Icon(
                                                    FFIcons.kratethisappyp,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    size: 20.0,
                                                  ),
                                                ),
                                                Expanded(
                                                  child: Text(
                                                    'Rate this app',
                                                    textAlign: TextAlign.start,
                                                    maxLines: 1,
                                                    style: FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMedium
                                                        .override(
                                                          font: GoogleFonts
                                                              .nunito(
                                                            fontWeight:
                                                                FontWeight
                                                                    .normal,
                                                            fontStyle:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                          ),
                                                          fontSize: 17.0,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.normal,
                                                          fontStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontStyle,
                                                          lineHeight: 1.52,
                                                        ),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                Icon(
                                                  FFIcons.karrowrightyp,
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .iconColor,
                                                  size: 20.0,
                                                ),
                                              ].divide(SizedBox(width: 12.0)),
                                            ),
                                          if (FFAppConstants.featureStoreLinks)
                                            Container(
                                              width: double.infinity,
                                              height: 1.0,
                                              decoration: BoxDecoration(
                                                color:
                                                    FlutterFlowTheme.of(context)
                                                        .borderColor,
                                              ),
                                            ),
                                          if (FFAppConstants.featureStoreLinks)
                                            Row(
                                              mainAxisSize: MainAxisSize.max,
                                              children: [
                                                Container(
                                                  width: 38.0,
                                                  height: 38.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryLightColor,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Icon(
                                                    FFIcons.ksharewithfriendsyp,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    size: 20.0,
                                                  ),
                                                ),
                                                Expanded(
                                                  child: Text(
                                                    'Share with friends',
                                                    textAlign: TextAlign.start,
                                                    maxLines: 1,
                                                    style: FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMedium
                                                        .override(
                                                          font: GoogleFonts
                                                              .nunito(
                                                            fontWeight:
                                                                FontWeight
                                                                    .normal,
                                                            fontStyle:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                          ),
                                                          fontSize: 17.0,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.normal,
                                                          fontStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontStyle,
                                                          lineHeight: 1.52,
                                                        ),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                Icon(
                                                  FFIcons.karrowrightyp,
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .iconColor,
                                                  size: 20.0,
                                                ),
                                              ].divide(SizedBox(width: 12.0)),
                                            ),
                                          if (FFAppConstants.featureStoreLinks)
                                            Container(
                                              width: double.infinity,
                                              height: 1.0,
                                              decoration: BoxDecoration(
                                                color:
                                                    FlutterFlowTheme.of(context)
                                                        .borderColor,
                                              ),
                                            ),
                                          InkWell(
                                            splashColor: Colors.transparent,
                                            focusColor: Colors.transparent,
                                            hoverColor: Colors.transparent,
                                            highlightColor: Colors.transparent,
                                            onTap: () async {
                                              context.pushNamed(
                                                  PrivacyPolicyPageWidget
                                                      .routeName);
                                            },
                                            child: Row(
                                              mainAxisSize: MainAxisSize.max,
                                              children: [
                                                Container(
                                                  width: 38.0,
                                                  height: 38.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryLightColor,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Icon(
                                                    FFIcons.ktermsconditionsyp,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    size: 20.0,
                                                  ),
                                                ),
                                                Expanded(
                                                  child: Text(
                                                    'Privacy policy',
                                                    textAlign: TextAlign.start,
                                                    maxLines: 1,
                                                    style: FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMedium
                                                        .override(
                                                          font: GoogleFonts
                                                              .nunito(
                                                            fontWeight:
                                                                FontWeight
                                                                    .normal,
                                                            fontStyle:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                          ),
                                                          fontSize: 17.0,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.normal,
                                                          fontStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontStyle,
                                                          lineHeight: 1.52,
                                                        ),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                Icon(
                                                  FFIcons.karrowrightyp,
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .iconColor,
                                                  size: 20.0,
                                                ),
                                              ].divide(SizedBox(width: 12.0)),
                                            ),
                                          ),
                                          Container(
                                            width: double.infinity,
                                            height: 1.0,
                                            decoration: BoxDecoration(
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .borderColor,
                                            ),
                                          ),
                                          InkWell(
                                            splashColor: Colors.transparent,
                                            focusColor: Colors.transparent,
                                            hoverColor: Colors.transparent,
                                            highlightColor: Colors.transparent,
                                            onTap: () async {
                                              context.pushNamed(
                                                  FaqPageWidget.routeName);
                                            },
                                            child: Row(
                                              mainAxisSize: MainAxisSize.max,
                                              children: [
                                                Container(
                                                  width: 38.0,
                                                  height: 38.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryLightColor,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Icon(
                                                    FFIcons.kfaqsyp,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    size: 20.0,
                                                  ),
                                                ),
                                                Expanded(
                                                  child: Text(
                                                    'FAQs',
                                                    textAlign: TextAlign.start,
                                                    maxLines: 1,
                                                    style: FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMedium
                                                        .override(
                                                          font: GoogleFonts
                                                              .nunito(
                                                            fontWeight:
                                                                FontWeight
                                                                    .normal,
                                                            fontStyle:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                          ),
                                                          fontSize: 17.0,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.normal,
                                                          fontStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontStyle,
                                                          lineHeight: 1.52,
                                                        ),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                Icon(
                                                  FFIcons.karrowrightyp,
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .iconColor,
                                                  size: 20.0,
                                                ),
                                              ].divide(SizedBox(width: 12.0)),
                                            ),
                                          ),
                                          Container(
                                            width: double.infinity,
                                            height: 1.0,
                                            decoration: BoxDecoration(
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .borderColor,
                                            ),
                                          ),
                                          if (FFAppConstants
                                              .featureSupportContact)
                                            Row(
                                              mainAxisSize: MainAxisSize.max,
                                              children: [
                                                Container(
                                                  width: 38.0,
                                                  height: 38.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryLightColor,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Icon(
                                                    FFIcons.kfeedbackyp,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    size: 20.0,
                                                  ),
                                                ),
                                                Expanded(
                                                  child: Text(
                                                    'Feedback',
                                                    textAlign: TextAlign.start,
                                                    maxLines: 1,
                                                    style: FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMedium
                                                        .override(
                                                          font: GoogleFonts
                                                              .nunito(
                                                            fontWeight:
                                                                FontWeight
                                                                    .normal,
                                                            fontStyle:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                          ),
                                                          fontSize: 17.0,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.normal,
                                                          fontStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontStyle,
                                                          lineHeight: 1.52,
                                                        ),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                Icon(
                                                  FFIcons.karrowrightyp,
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .iconColor,
                                                  size: 20.0,
                                                ),
                                              ].divide(SizedBox(width: 12.0)),
                                            ),
                                          if (FFAppConstants
                                              .featureSupportContact)
                                            Container(
                                              width: double.infinity,
                                              height: 1.0,
                                              decoration: BoxDecoration(
                                                color:
                                                    FlutterFlowTheme.of(context)
                                                        .borderColor,
                                              ),
                                            ),
                                          InkWell(
                                            splashColor: Colors.transparent,
                                            focusColor: Colors.transparent,
                                            hoverColor: Colors.transparent,
                                            highlightColor: Colors.transparent,
                                            onTap: () async {
                                              await showModalBottomSheet(
                                                isScrollControlled: true,
                                                backgroundColor:
                                                    Colors.transparent,
                                                enableDrag: false,
                                                context: context,
                                                builder: (context) {
                                                  return GestureDetector(
                                                    onTap: () {
                                                      FocusScope.of(context)
                                                          .unfocus();
                                                      FocusManager
                                                          .instance.primaryFocus
                                                          ?.unfocus();
                                                    },
                                                    child: Padding(
                                                      padding: MediaQuery
                                                          .viewInsetsOf(
                                                              context),
                                                      child:
                                                          DeleteAccountDialogWidget(
                                                        onTapOk: () async {
                                                          Navigator.pop(
                                                              context);
                                                          await authManager
                                                              .deleteUser(
                                                                  context);
                                                          _model.afterDelete =
                                                              await actions
                                                                  .accountState();
                                                          if (_model
                                                                  .afterDelete ==
                                                              'signed_out') {
                                                            await action_blocks
                                                                .dataClearBlock(
                                                                    context);
                                                            FFAppState()
                                                                .homePageIndex = 0;
                                                            safeSetState(() {});

                                                            context.goNamed(
                                                                DeleteAccountPageWidget
                                                                    .routeName);
                                                          }
                                                        },
                                                      ),
                                                    ),
                                                  );
                                                },
                                              ).then((value) =>
                                                  safeSetState(() {}));

                                              safeSetState(() {});
                                            },
                                            child: Row(
                                              mainAxisSize: MainAxisSize.max,
                                              children: [
                                                Container(
                                                  width: 38.0,
                                                  height: 38.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryLightColor,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Icon(
                                                    FFIcons.kdeleteaccountyp,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    size: 20.0,
                                                  ),
                                                ),
                                                Expanded(
                                                  child: Text(
                                                    'Delete account',
                                                    textAlign: TextAlign.start,
                                                    maxLines: 1,
                                                    style: FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMedium
                                                        .override(
                                                          font: GoogleFonts
                                                              .nunito(
                                                            fontWeight:
                                                                FontWeight
                                                                    .normal,
                                                            fontStyle:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                          ),
                                                          fontSize: 17.0,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.normal,
                                                          fontStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontStyle,
                                                          lineHeight: 1.52,
                                                        ),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                Icon(
                                                  FFIcons.karrowrightyp,
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .iconColor,
                                                  size: 20.0,
                                                ),
                                              ].divide(SizedBox(width: 12.0)),
                                            ),
                                          ),
                                        ].divide(SizedBox(height: 16.0)),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ).animateOnPageLoad(
                                animationsMap['columnOnPageLoadAnimation']!),
                          ],
                        ),
                      ),
                      Align(
                        alignment: AlignmentDirectional(0.0, 1.0),
                        child: Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              valueOrDefault<double>(
                                FFAppConstants.mainPadding,
                                0.0,
                              ),
                              4.0,
                              valueOrDefault<double>(
                                FFAppConstants.mainPadding,
                                0.0,
                              ),
                              8.0),
                          child: Text(
                            'Purrbi · development build 1.0.0',
                            textAlign: TextAlign.center,
                            style: FlutterFlowTheme.of(context)
                                .bodyMedium
                                .override(
                                  font: GoogleFonts.nunito(
                                    fontWeight: FontWeight.w500,
                                    fontStyle: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .fontStyle,
                                  ),
                                  color: FlutterFlowTheme.of(context).primary,
                                  fontSize: 15.0,
                                  letterSpacing: 0.0,
                                  fontWeight: FontWeight.w500,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .fontStyle,
                                  lineHeight: 1.46,
                                ),
                          ),
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
