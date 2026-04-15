import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/app.dart';

void main() {
  testWidgets('Login screen renders brand and fields', (tester) async {
    await tester.pumpWidget(const PosStaffApp());
    await tester.pump();

    expect(find.text('POS Staff'), findsWidgets);
    expect(find.text('ระบบรับออเดอร์สำหรับพนักงาน'), findsOneWidget);
    expect(find.text('เข้าสู่ระบบ'), findsOneWidget);
  });
}
