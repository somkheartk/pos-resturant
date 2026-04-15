import 'dart:io';

import 'package:flutter/material.dart';

import '../../core/api_config.dart';
import '../../services/api_exception.dart';
import '../../services/auth_api.dart';
import '../home/home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  static const _authApi = AuthApi();
  static const _defaultEmail = 'admin@pos.local';
  static const _defaultPassword = '123456';

  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _emailCtrl.text = _defaultEmail;
    _passwordCtrl.text = _defaultPassword;
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final session = await _authApi.login(
        email: _emailCtrl.text.trim().toLowerCase(),
        password: _passwordCtrl.text,
      );

      if (!mounted) return;
      setState(() => _isLoading = false);
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) =>
              HomeScreen(user: session.user, accessToken: session.accessToken),
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = error.statusCode == null
            ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ'
            : error.message;
      });
    } on SocketException {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final baseUrl = ApiConfig.baseUrl;
    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxWidth < 380;
            final sidePadding = compact ? 14.0 : 36.0;
            final cardPadding = compact
                ? const EdgeInsets.fromLTRB(14, 18, 14, 14)
                : const EdgeInsets.fromLTRB(20, 24, 20, 18);

            return Center(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: sidePadding),
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 460),
                  padding: cardPadding,
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: cs.outlineVariant),
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // ── Brand ──────────────────────────────────────────
                        Container(
                          width: compact ? 62 : 72,
                          height: compact ? 62 : 72,
                          decoration: BoxDecoration(
                            color: cs.primary.withAlpha(22),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(
                            Icons.storefront_rounded,
                            size: compact ? 32 : 38,
                            color: cs.primary,
                          ),
                        ),
                        SizedBox(height: compact ? 12 : 16),
                        Text(
                          'POS Staff',
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                                fontSize: compact ? 26 : null,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'ระบบรับออเดอร์สำหรับพนักงาน',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: cs.onSurfaceVariant),
                        ),
                        SizedBox(height: compact ? 18 : 28),

                        // ── Form ───────────────────────────────────────────
                        TextFormField(
                          controller: _emailCtrl,
                          decoration: const InputDecoration(
                            labelText: 'อีเมล',
                            prefixIcon: Icon(Icons.person_outline_rounded),
                          ),
                          textInputAction: TextInputAction.next,
                          autocorrect: false,
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'กรุณากรอกอีเมล'
                              : null,
                        ),
                        const SizedBox(height: 14),
                        TextFormField(
                          controller: _passwordCtrl,
                          obscureText: _obscurePassword,
                          decoration: InputDecoration(
                            labelText: 'รหัสผ่าน',
                            prefixIcon: const Icon(Icons.lock_outline_rounded),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined,
                              ),
                              onPressed: () => setState(
                                () => _obscurePassword = !_obscurePassword,
                              ),
                            ),
                          ),
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _login(),
                          validator: (v) => (v == null || v.isEmpty)
                              ? 'กรุณากรอกรหัสผ่าน'
                              : null,
                        ),

                        // ── Error ──────────────────────────────────────────
                        if (_errorMessage != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.error_outline,
                                  size: 16,
                                  color: cs.error,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  _errorMessage!,
                                  style: TextStyle(
                                    color: cs.error,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        SizedBox(height: compact ? 18 : 28),

                        // ── Submit ─────────────────────────────────────────
                        SizedBox(
                          width: double.infinity,
                          height: compact ? 48 : 52,
                          child: FilledButton(
                            onPressed: _isLoading ? null : _login,
                            child: _isLoading
                                ? const SizedBox.square(
                                    dimension: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                    ),
                                  )
                                : const Text(
                                    'เข้าสู่ระบบ',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                          ),
                        ),
                        SizedBox(height: compact ? 18 : 28),

                   
                        const SizedBox(height: 6),
                        Text(
                          'API: $baseUrl',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11,
                            color: cs.outline,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'v1.0.0',
                          style: TextStyle(
                            fontSize: 11,
                            color: cs.outlineVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
