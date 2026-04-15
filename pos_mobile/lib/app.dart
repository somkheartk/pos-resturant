import 'package:flutter/material.dart';

import 'core/theme.dart';
import 'screens/login/login_screen.dart';

class PosStaffApp extends StatelessWidget {
  const PosStaffApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'POS Staff',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const LoginScreen(),
    );
  }
}
