import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/api_config.dart';
import '../models/auth_session.dart';
import '../models/staff_user.dart';
import 'api_exception.dart';

class AuthApi {
  const AuthApi({http.Client? client}) : _client = client;

  final http.Client? _client;

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final client = _client ?? http.Client();
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/auth/login');
      final response = await client.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final json = _decodeJson(response.body);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException(
          _readErrorMessage(json) ?? 'Login failed',
          statusCode: response.statusCode,
        );
      }

      final accessToken = (json['accessToken'] ?? '').toString();
      final userJson = (json['user'] as Map?)?.cast<String, dynamic>() ?? {};
      if (accessToken.isEmpty || userJson.isEmpty) {
        throw ApiException(
          'Invalid login response',
          statusCode: response.statusCode,
        );
      }

      final user = StaffUser(
        id: (userJson['id'] ?? '').toString(),
        username: (userJson['email'] ?? email).toString(),
        displayName: (userJson['name'] ?? email).toString(),
        role: (userJson['role'] ?? 'staff').toString(),
        email: (userJson['email'] ?? email).toString(),
      );

      return AuthSession(accessToken: accessToken, user: user);
    } finally {
      if (_client == null) client.close();
    }
  }

  Map<String, dynamic> _decodeJson(String source) {
    final decoded = jsonDecode(source);
    if (decoded is Map<String, dynamic>) return decoded;
    return <String, dynamic>{};
  }

  String? _readErrorMessage(Map<String, dynamic> json) {
    final message = json['message'];
    if (message is String && message.isNotEmpty) return message;
    if (message is List && message.isNotEmpty) return message.first.toString();
    return null;
  }
}
