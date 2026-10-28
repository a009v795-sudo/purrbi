import "../actions/text_to_speech.dart";

Future stopTTS() async {
  // Add your function code here!
  TTSController.instance.stopNow();
}
// Set your action name, define your arguments and return parameter,
// and then add the boilerplate code using the `</>` button on the right!