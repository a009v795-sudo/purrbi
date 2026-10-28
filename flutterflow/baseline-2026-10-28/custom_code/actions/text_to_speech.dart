// Set your action name, define your arguments and return parameter,
// and then add the boilerplate code using the `</>` button on the right!text
//
// import '/custom_code/actions/index.dart';


import 'package:flutter_tts/flutter_tts.dart';

class TTSController {
  TTSController._internal();
  static final TTSController instance = TTSController._internal();

  final FlutterTts _tts = FlutterTts();
  bool _initialized = false;
  String _lastText = '';

  Future<void> _init() async {
    if (_initialized) return;

    await _tts
        .awaitSpeakCompletion(true); // serialize speak/stop flows [web:23]
    try {
      await _tts
          .setQueueMode(1); // Android: flush previous, play newest [web:38]
    } catch (_) {}

    _tts.setStartHandler(() async {
      FFAppState().update(() {
        FFAppState().isSpeaking = true;
        // FFAppState().ttsProcess = false;
      });
    });
    _tts.setCompletionHandler(() async {
      FFAppState().update(() {
        FFAppState().isSpeaking = false;
      });
    });
    _tts.setCancelHandler(() async {
      FFAppState().update(() {
        FFAppState().isSpeaking = false;
      });
    });
    _tts.setPauseHandler(() async {
      FFAppState().update(() {
        FFAppState().isSpeaking = false;
      });
    });
    _tts.setContinueHandler(() async {
      FFAppState().update(() {
        FFAppState().isSpeaking = true;
        // FFAppState().ttsProcess = false;
      });
    });
    _tts.setErrorHandler((msg) async {
      FFAppState().update(() {
        FFAppState().isSpeaking = false;
      });
    });

    _initialized = true;
  }

  Future<void> stopNow() async {
    await _init();
    await _tts.stop();
    FFAppState().update(() {
      FFAppState().isSpeaking = false;
    });
  }

  Future<void> toggleSpeak(
    String text, {
    String language = 'en-US',
    double rate = 0.5,
    double pitch = 1.0,
    double volume = 1.0,
  }) async {
    await _init();

    final incoming = text.trim();
    final last = _lastText.trim();

    // Case 1: currently speaking
    if (FFAppState().isSpeaking) {
      if (incoming != last) {
        // Replace: stop current and immediately start new text [web:38]
        await _tts.stop();

        FFAppState().update(() {
          FFAppState().isSpeaking = false;
        });

        await _configure(
            language: language, rate: rate, pitch: pitch, volume: volume);
        _lastText = incoming;
        await _tts.speak(incoming);
        return;
      } else {
        // Toggle off: same text => just stop [web:23]
        await _tts.stop();
        FFAppState().update(() {
          FFAppState().isSpeaking = false;
        });

        return;
      }
    }

    // Case 2: not speaking => speak incoming (stop residual first) [web:25]
    await _tts.stop();
    await _configure(
        language: language, rate: rate, pitch: pitch, volume: volume);
    _lastText = incoming;
    await _tts.speak(incoming);
  }

  Future<void> _configure({
    required String language,
    required double rate,
    required double pitch,
    required double volume,
  }) async {
    await _tts.setLanguage(language);
    await _tts.setSpeechRate(rate);
    await _tts.setPitch(pitch);
    await _tts.setVolume(volume);
  }

  Future<void> restartLast() async {
    await _init();
    await _tts.stop();
    if (_lastText.trim().isNotEmpty) {
      await _tts.speak(_lastText.trim());
    }
  }
}

Future textToSpeech(String text) async {
  // Add your function code here!
  await TTSController.instance.toggleSpeak(text);
}