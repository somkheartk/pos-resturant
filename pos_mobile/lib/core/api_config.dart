import 'dart:io';

import 'package:flutter_dotenv/flutter_dotenv.dart';

const String _apiBaseUrlFromEnv = String.fromEnvironment('API_BASE_URL');

class ApiConfig {
  static String get baseUrl {
    final dotenvUrl = dotenv.env['API_BASE_URL']?.trim() ?? '';
    if (dotenvUrl.isNotEmpty) return _normalizeForPlatform(dotenvUrl);

    if (_apiBaseUrlFromEnv.isNotEmpty) {
      return _normalizeForPlatform(_apiBaseUrlFromEnv);
    }

    // Android emulator cannot access loopback on the host directly.
    if (Platform.isAndroid) return 'http://10.0.2.2:3000/api/v1';

    return 'http://127.0.0.1:3000/api/v1';
  }

  static String _normalizeForPlatform(String value) {
    if (!Platform.isAndroid) return value;

    final uri = Uri.tryParse(value);
    if (uri == null) return value;

    final host = uri.host.toLowerCase();
    if (host != 'localhost' && host != '127.0.0.1') return value;

    return uri.replace(host: '10.0.2.2').toString();
  }
}
