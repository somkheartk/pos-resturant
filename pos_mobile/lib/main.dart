import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'app.dart';

const _appEnv = String.fromEnvironment('APP_ENV', defaultValue: 'dev');

String _resolveEnvFile(String env) {
  switch (env.toLowerCase()) {
    case 'prod':
    case 'production':
      return '.env.prod';
    case 'staging':
      return '.env.staging';
    case 'dev':
    case 'development':
    default:
      return '.env.dev';
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final envFile = _resolveEnvFile(_appEnv);

  try {
    await dotenv.load(fileName: envFile);
  } catch (_) {
    // Fallback for local custom file.
    try {
      await dotenv.load(fileName: '.env');
    } catch (_) {
      // Allow running without a local env file.
    }
  }

  runApp(const PosStaffApp());
}
