import '/auth/firebase_auth/auth_util.dart';
import '/flutter_flow/ff_builtin_enums.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import 'dart:ui';
import '/actions/actions.dart' as action_blocks;
import '/custom_code/actions/index.dart' as actions;
import '/custom_code/widgets/index.dart' as custom_widgets;
import '/flutter_flow/custom_functions.dart' as functions;
import '/flutter_flow/permissions_util.dart';
import '/index.dart';
import 'package:cloud_firestore/cloud_firestore.dart' hide Type;
import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter_barcode_scanner/flutter_barcode_scanner.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'identifier_page_model.dart';
export 'identifier_page_model.dart';

class IdentifierPageWidget extends StatefulWidget {
  const IdentifierPageWidget({super.key});

  static String routeName = 'IdentifierPage';
  static String routePath = '/identifierPage';

  @override
  State<IdentifierPageWidget> createState() => _IdentifierPageWidgetState();
}

class _IdentifierPageWidgetState extends State<IdentifierPageWidget> {
  late IdentifierPageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => IdentifierPageModel());

    _model.manualBarcodeFieldTextController ??= TextEditingController();
    _model.manualBarcodeFieldFocusNode ??= FocusNode();

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
                  children: [
                    wrapWithModel(
                      model: _model.mainAppbarModel,
                      updateCallback: () => safeSetState(() {}),
                      child: MainAppbarWidget(
                        title: 'Scan',
                        isBack: true,
                        isEdit: false,
                        isShare: false,
                        backAction: () async {
                          FFAppState().homePageIndex = 0;
                          FFAppState().update(() {});

                          context.goNamed(HomeMainPageWidget.routeName);
                        },
                        editAction: () async {},
                        shareAction: () async {},
                      ),
                    ),
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Expanded(
                            child: Container(
                              width: double.infinity,
                              height: double.infinity,
                              decoration: BoxDecoration(),
                              child: Padding(
                                padding: EdgeInsetsDirectional.fromSTEB(
                                    16.0, 0.0, 16.0, 0.0),
                                child: Container(
                                  decoration: BoxDecoration(
                                    image: DecorationImage(
                                      fit: BoxFit.cover,
                                      image: Image.asset(
                                        'assets/images/sanner-image_.png',
                                      ).image,
                                    ),
                                    borderRadius: BorderRadius.circular(24.0),
                                  ),
                                  child: Padding(
                                    padding: EdgeInsets.all(24.0),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          decoration: BoxDecoration(
                                            color: FlutterFlowTheme.of(context)
                                                .primary,
                                            borderRadius:
                                                BorderRadius.circular(60.0),
                                          ),
                                          child: Padding(
                                            padding:
                                                EdgeInsetsDirectional.fromSTEB(
                                                    12.0, 6.0, 12.0, 6.0),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(
                                                  FFIcons.ksparkleyp,
                                                  color: Colors.white,
                                                  size: 24.0,
                                                ),
                                                Text(
                                                  'BARCODE FIRST',
                                                  textAlign: TextAlign.start,
                                                  maxLines: 1,
                                                  style: FlutterFlowTheme.of(
                                                          context)
                                                      .bodyMedium
                                                      .override(
                                                        font:
                                                            GoogleFonts.nunito(
                                                          fontWeight:
                                                              FontWeight.w600,
                                                          fontStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontStyle,
                                                        ),
                                                        color: Colors.white,
                                                        fontSize: 13.0,
                                                        letterSpacing: 0.0,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                        fontStyle:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMedium
                                                                .fontStyle,
                                                        lineHeight: 1.38,
                                                      ),
                                                ),
                                              ].divide(SizedBox(width: 6.0)),
                                            ),
                                          ),
                                        ),
                                        Padding(
                                          padding:
                                              EdgeInsetsDirectional.fromSTEB(
                                                  0.0, 16.0, 0.0, 8.0),
                                          child: AutoSizeText(
                                            'Scan the barcode',
                                            textAlign: TextAlign.start,
                                            maxLines: 1,
                                            style: FlutterFlowTheme.of(context)
                                                .bodyMedium
                                                .override(
                                                  font: GoogleFonts.nunito(
                                                    fontWeight: FontWeight.w600,
                                                    fontStyle:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMedium
                                                            .fontStyle,
                                                  ),
                                                  color: Colors.white,
                                                  fontSize: 24.0,
                                                  letterSpacing: 0.0,
                                                  fontWeight: FontWeight.w600,
                                                  fontStyle:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMedium
                                                          .fontStyle,
                                                  lineHeight: 1.25,
                                                ),
                                          ),
                                        ),
                                        AutoSizeText(
                                          'Cat and dog foods, treats and supplements.\nIf details are missing, Purrbi asks for a label photo.',
                                          textAlign: TextAlign.start,
                                          maxLines: 2,
                                          style: FlutterFlowTheme.of(context)
                                              .bodyMedium
                                              .override(
                                                font: GoogleFonts.nunito(
                                                  fontWeight: FontWeight.normal,
                                                  fontStyle:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMedium
                                                          .fontStyle,
                                                ),
                                                color: Colors.white,
                                                fontSize: 15.0,
                                                letterSpacing: 0.0,
                                                fontWeight: FontWeight.normal,
                                                fontStyle:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMedium
                                                        .fontStyle,
                                                lineHeight: 1.46,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ),
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
                                0.0,
                                valueOrDefault<double>(
                                  FFAppConstants.mainPadding,
                                  0.0,
                                ),
                                0.0),
                            child: Row(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Column(
                                  mainAxisSize: MainAxisSize.max,
                                  children: [
                                    InkWell(
                                      splashColor: Colors.transparent,
                                      focusColor: Colors.transparent,
                                      hoverColor: Colors.transparent,
                                      highlightColor: Colors.transparent,
                                      onTap: () async {
                                        var _shouldSetState = false;
                                        if (_model.creating!) {
                                          if (_shouldSetState)
                                            safeSetState(() {});
                                          return;
                                        }
                                        if (!isWeb) {
                                          if (!FFAppState().connected) {
                                            await action_blocks
                                                .internetSnackbar(context);
                                            if (_shouldSetState)
                                              safeSetState(() {});
                                            return;
                                          }
                                          _model.creating = true;
                                          safeSetState(() {});
                                          await actions.traceScan(
                                            'camera_open',
                                            '',
                                            '',
                                            '',
                                          );
                                          await requestPermission(
                                              cameraPermission);
                                          _model.scannedBarcode =
                                              await FlutterBarcodeScanner
                                                  .scanBarcode(
                                            '#C62828', // scanning line color
                                            'Cancel', // cancel button text
                                            true, // whether to show the torch (camera LED) toggle icon
                                            ScanMode.BARCODE,
                                          );

                                          _shouldSetState = true;
                                          if (functions.isScanCancelled(
                                              _model.scannedBarcode)) {
                                            _model.creating = false;
                                            safeSetState(() {});
                                            await actions.traceScan(
                                              'camera_cancelled',
                                              '',
                                              '',
                                              '',
                                            );
                                            ScaffoldMessenger.of(context)
                                                .clearSnackBars();
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  'No barcode was scanned. If the camera didn’t open, allow camera access for Purrbi in your phone’s settings, or type the number below.',
                                                  style: TextStyle(),
                                                ),
                                                duration: Duration(
                                                    milliseconds: 4000),
                                              ),
                                            );
                                            if (_shouldSetState)
                                              safeSetState(() {});
                                            return;
                                          }
                                          _model.lastScan =
                                              functions.cleanBarcode(
                                                  _model.scannedBarcode);
                                          safeSetState(() {});
                                          if (!functions.isLikelyBarcode(
                                              _model.lastScan)) {
                                            _model.creating = false;
                                            safeSetState(() {});
                                            await actions.traceScan(
                                              'camera_unreadable',
                                              '',
                                              '',
                                              'unreadable',
                                            );
                                            ScaffoldMessenger.of(context)
                                                .clearSnackBars();
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  'No product barcode was read. Try again, holding the code steady in the frame, or type the number below.',
                                                  style: TextStyle(),
                                                ),
                                                duration: Duration(
                                                    milliseconds: 4000),
                                              ),
                                            );
                                          } else {
                                            await actions.traceScan(
                                              'create_start',
                                              '',
                                              '',
                                              'camera',
                                            );
                                            _model.cameraRequest =
                                                await actions.createScanRequest(
                                              _model.lastScan!,
                                              valueOrDefault(
                                                  currentUserDocument
                                                      ?.activePetId,
                                                  ''),
                                              'camera',
                                            );
                                            _shouldSetState = true;
                                            _model.creating = false;
                                            safeSetState(() {});
                                            if (_model.cameraRequest == '') {
                                              ScaffoldMessenger.of(context)
                                                  .clearSnackBars();
                                              ScaffoldMessenger.of(context)
                                                  .showSnackBar(
                                                SnackBar(
                                                  content: Text(
                                                    'The scan couldn’t be started. Check your connection and try again.',
                                                    style: TextStyle(),
                                                  ),
                                                  duration: Duration(
                                                      milliseconds: 4000),
                                                ),
                                              );
                                            } else {
                                              _model.createdScanId =
                                                  _model.cameraRequest;
                                              safeSetState(() {});
                                              await actions.traceScan(
                                                'create_done',
                                                _model.cameraRequest,
                                                '',
                                                'camera',
                                              );

                                              context.pushNamed(
                                                ScanResultPageWidget.routeName,
                                                queryParameters: {
                                                  'scanRef': serializeParam(
                                                    FFAppState().lastScanRef,
                                                    ParamType.DocumentReference,
                                                  ),
                                                  'scanId': serializeParam(
                                                    _model.cameraRequest,
                                                    ParamType.String,
                                                  ),
                                                }.withoutNulls,
                                              );
                                            }
                                          }
                                        } else {
                                          await action_blocks.mainSanckbar(
                                            context,
                                            title:
                                                'Camera scanning needs the Android or iOS app. Type the barcode number below instead.',
                                          );
                                          safeSetState(() {});
                                        }

                                        if (_shouldSetState)
                                          safeSetState(() {});
                                      },
                                      child: Container(
                                        width: 84.57,
                                        height: 84.57,
                                        decoration: BoxDecoration(
                                          color: FlutterFlowTheme.of(context)
                                              .primary,
                                          shape: BoxShape.circle,
                                        ),
                                        alignment:
                                            AlignmentDirectional(0.0, 0.0),
                                        child: Stack(
                                          alignment:
                                              AlignmentDirectional(0.0, 0.0),
                                          children: [
                                            if (!_model.creating!)
                                              Icon(
                                                Icons.camera_alt,
                                                color: Colors.white,
                                                size: 40.0,
                                              ),
                                            if (_model.creating ?? true)
                                              Container(
                                                width: 36.0,
                                                height: 36.0,
                                                child: custom_widgets
                                                    .CirculatIndicatorWhite(
                                                  width: 36.0,
                                                  height: 36.0,
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Text(
                                      _model.creating!
                                          ? 'STARTING…'
                                          : 'TAP TO SCAN',
                                      textAlign: TextAlign.center,
                                      style: FlutterFlowTheme.of(context)
                                          .bodyMedium
                                          .override(
                                            font: GoogleFonts.nunito(
                                              fontWeight: FontWeight.w600,
                                              fontStyle:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMedium
                                                      .fontStyle,
                                            ),
                                            fontSize: 15.0,
                                            letterSpacing: 0.0,
                                            fontWeight: FontWeight.w600,
                                            fontStyle:
                                                FlutterFlowTheme.of(context)
                                                    .bodyMedium
                                                    .fontStyle,
                                            lineHeight: 1.47,
                                          ),
                                    ),
                                  ].divide(SizedBox(height: 12.0)),
                                ),
                              ].divide(SizedBox(width: 20.0)),
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
                            child: Container(
                              decoration: BoxDecoration(
                                color: FlutterFlowTheme.of(context).buttonBg,
                                borderRadius: BorderRadius.circular(16.0),
                                border: Border.all(
                                  color:
                                      FlutterFlowTheme.of(context).borderColor,
                                  width: 1.0,
                                ),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.max,
                                children: [
                                  Padding(
                                    padding: EdgeInsets.all(12.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.center,
                                      children: [
                                        Container(
                                          width: 38.0,
                                          height: 38.0,
                                          decoration: BoxDecoration(
                                            color: FlutterFlowTheme.of(context)
                                                .primaryLightColor,
                                            shape: BoxShape.circle,
                                          ),
                                          alignment:
                                              AlignmentDirectional(0.0, 0.0),
                                          child: Icon(
                                            FFIcons.ktipsyp,
                                            color: FlutterFlowTheme.of(context)
                                                .primary,
                                            size: 20.0,
                                          ),
                                        ),
                                        Text(
                                          'Pro tips',
                                          textAlign: TextAlign.start,
                                          style: FlutterFlowTheme.of(context)
                                              .bodyMedium
                                              .override(
                                                font: GoogleFonts.nunito(
                                                  fontWeight: FontWeight.w600,
                                                  fontStyle:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMedium
                                                          .fontStyle,
                                                ),
                                                color:
                                                    FlutterFlowTheme.of(context)
                                                        .primary,
                                                fontSize: 15.0,
                                                letterSpacing: 0.0,
                                                fontWeight: FontWeight.w600,
                                                fontStyle:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMedium
                                                        .fontStyle,
                                                lineHeight: 1.33,
                                              ),
                                        ),
                                      ].divide(SizedBox(width: 12.0)),
                                    ),
                                  ),
                                  Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        16.0, 0.0, 16.0, 0.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Padding(
                                          padding:
                                              EdgeInsetsDirectional.fromSTEB(
                                                  0.0, 6.0, 0.0, 0.0),
                                          child: Container(
                                            width: 6.0,
                                            height: 6.0,
                                            decoration: BoxDecoration(
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .secondaryText,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          child: Text(
                                            'Use natural daylight and avoid blurry or shadowed images.',
                                            style: FlutterFlowTheme.of(context)
                                                .bodyMedium
                                                .override(
                                                  font: GoogleFonts.nunito(
                                                    fontWeight:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMedium
                                                            .fontWeight,
                                                    fontStyle:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMedium
                                                            .fontStyle,
                                                  ),
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .secondaryText,
                                                  letterSpacing: 0.0,
                                                  fontWeight:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMedium
                                                          .fontWeight,
                                                  fontStyle:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMedium
                                                          .fontStyle,
                                                ),
                                          ),
                                        ),
                                      ].divide(SizedBox(width: 16.0)),
                                    ),
                                  ),
                                  Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        16.0, 10.0, 16.0, 16.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Padding(
                                          padding:
                                              EdgeInsetsDirectional.fromSTEB(
                                                  0.0, 6.0, 0.0, 0.0),
                                          child: Container(
                                            width: 6.0,
                                            height: 6.0,
                                            decoration: BoxDecoration(
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .secondaryText,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          child: Text(
                                            'Fit the whole barcode in the frame and hold steady until it is read.',
                                            style: FlutterFlowTheme.of(context)
                                                .bodyMedium
                                                .override(
                                                  font: GoogleFonts.nunito(
                                                    fontWeight:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMedium
                                                            .fontWeight,
                                                    fontStyle:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMedium
                                                            .fontStyle,
                                                  ),
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .secondaryText,
                                                  letterSpacing: 0.0,
                                                  fontWeight:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMedium
                                                          .fontWeight,
                                                  fontStyle:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMedium
                                                          .fontStyle,
                                                ),
                                          ),
                                        ),
                                      ].divide(SizedBox(width: 16.0)),
                                    ),
                                  ),
                                ],
                              ),
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
                            child: Row(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment:
                                  (FFMainAxisAlignment.start).flutterValue,
                              crossAxisAlignment:
                                  (FFCrossAxisAlignment.center).flutterValue,
                              textBaseline: TextBaseline.alphabetic,
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller:
                                        _model.manualBarcodeFieldTextController,
                                    focusNode:
                                        _model.manualBarcodeFieldFocusNode,
                                    obscureText: false,
                                    decoration: InputDecoration(
                                      labelText: 'Barcode number',
                                      hintText: 'e.g. 5998749108536',
                                      enabledBorder: OutlineInputBorder(
                                        borderSide: BorderSide(
                                          color: FlutterFlowTheme.of(context)
                                              .borderColor,
                                          width: 1.0,
                                        ),
                                        borderRadius:
                                            BorderRadius.circular(16.0),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderSide: BorderSide(
                                          color: FlutterFlowTheme.of(context)
                                              .primary,
                                          width: 1.0,
                                        ),
                                        borderRadius:
                                            BorderRadius.circular(16.0),
                                      ),
                                      errorBorder: OutlineInputBorder(
                                        borderSide: BorderSide(
                                          color: Color(0x00000000),
                                          width: 1.0,
                                        ),
                                        borderRadius:
                                            BorderRadius.circular(16.0),
                                      ),
                                      focusedErrorBorder: OutlineInputBorder(
                                        borderSide: BorderSide(
                                          color: Color(0x00000000),
                                          width: 1.0,
                                        ),
                                        borderRadius:
                                            BorderRadius.circular(16.0),
                                      ),
                                      filled: true,
                                      fillColor:
                                          FlutterFlowTheme.of(context).buttonBg,
                                    ),
                                    style: TextStyle(),
                                    maxLines: null,
                                    keyboardType:
                                        (FFKeyboardType.number).flutterValue,
                                    validator: _model
                                        .manualBarcodeFieldTextControllerValidator
                                        .asValidator(context),
                                  ),
                                ),
                                FFButtonWidget(
                                  onPressed: () async {
                                    var _shouldSetState = false;
                                    if (_model.creating!) {
                                      if (_shouldSetState) safeSetState(() {});
                                      return;
                                    }
                                    if (!FFAppState().connected) {
                                      await action_blocks
                                          .internetSnackbar(context);
                                      if (_shouldSetState) safeSetState(() {});
                                      return;
                                    }
                                    _model.lastScan = functions.cleanBarcode(
                                        _model.manualBarcodeFieldTextController
                                            .text);
                                    safeSetState(() {});
                                    if (!functions
                                        .isLikelyBarcode(_model.lastScan)) {
                                      await actions.traceScan(
                                        'manual_invalid',
                                        '',
                                        '',
                                        'invalid',
                                      );
                                      ScaffoldMessenger.of(context)
                                          .clearSnackBars();
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            'Check the number: a barcode has 8, 12, 13 or 14 digits, and the last digit must match the others.',
                                            style: TextStyle(),
                                          ),
                                          duration:
                                              Duration(milliseconds: 4000),
                                        ),
                                      );
                                    } else {
                                      _model.creating = true;
                                      safeSetState(() {});
                                      await actions.traceScan(
                                        'create_start',
                                        '',
                                        '',
                                        'manual',
                                      );
                                      _model.manualRequest =
                                          await actions.createScanRequest(
                                        _model.lastScan!,
                                        valueOrDefault(
                                            currentUserDocument?.activePetId,
                                            ''),
                                        'manual',
                                      );
                                      _shouldSetState = true;
                                      _model.creating = false;
                                      safeSetState(() {});
                                      if (_model.manualRequest == '') {
                                        ScaffoldMessenger.of(context)
                                            .clearSnackBars();
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              'The scan couldn’t be started. Check your connection and try again.',
                                              style: TextStyle(),
                                            ),
                                            duration:
                                                Duration(milliseconds: 4000),
                                          ),
                                        );
                                      } else {
                                        _model.createdScanId =
                                            _model.manualRequest;
                                        safeSetState(() {});
                                        await actions.traceScan(
                                          'create_done',
                                          _model.manualRequest,
                                          '',
                                          'manual',
                                        );

                                        context.pushNamed(
                                          ScanResultPageWidget.routeName,
                                          queryParameters: {
                                            'scanRef': serializeParam(
                                              FFAppState().lastScanRef,
                                              ParamType.DocumentReference,
                                            ),
                                            'scanId': serializeParam(
                                              _model.manualRequest,
                                              ParamType.String,
                                            ),
                                          }.withoutNulls,
                                        );
                                      }
                                    }

                                    if (_shouldSetState) safeSetState(() {});
                                  },
                                  text: 'Look up',
                                  options: FFButtonOptions(
                                    height: 52.0,
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        0.0, 0.0, 0.0, 0.0),
                                    iconPadding: EdgeInsetsDirectional.fromSTEB(
                                        0.0, 0.0, 0.0, 0.0),
                                    color: FlutterFlowTheme.of(context).primary,
                                    textStyle: FlutterFlowTheme.of(context)
                                        .titleSmall
                                        .override(
                                          font: GoogleFonts.nunito(
                                            fontWeight:
                                                FlutterFlowTheme.of(context)
                                                    .titleSmall
                                                    .fontWeight,
                                            fontStyle:
                                                FlutterFlowTheme.of(context)
                                                    .titleSmall
                                                    .fontStyle,
                                          ),
                                          color: FlutterFlowTheme.of(context)
                                              .onPrimary,
                                          letterSpacing: 0.0,
                                          fontWeight:
                                              FlutterFlowTheme.of(context)
                                                  .titleSmall
                                                  .fontWeight,
                                          fontStyle:
                                              FlutterFlowTheme.of(context)
                                                  .titleSmall
                                                  .fontStyle,
                                        ),
                                    borderRadius: BorderRadius.circular(16.0),
                                  ),
                                ),
                              ].divide(SizedBox(width: 12.0)),
                            ),
                          ),
                        ]
                            .divide(SizedBox(height: 16.0))
                            .addToStart(SizedBox(height: 16.0))
                            .addToEnd(SizedBox(height: 24.0)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
