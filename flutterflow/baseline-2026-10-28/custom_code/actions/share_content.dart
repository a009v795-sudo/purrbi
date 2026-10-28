import 'package:share_plus/share_plus.dart';

Future shareContent(String? content) async {
  // Add your function code here!
  if (content == null || content.isEmpty) {
    // Handle the case where content is null or empty
    print('No content to share.');
    return;
  }

  try {
    await Share.share(content);
  } catch (e) {
    print('Error sharing content: $e');
  }
}