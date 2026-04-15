import 'package:flutter/material.dart';

import '../models/enums.dart';

extension TicketStatusX on TicketStatus {
  String get label {
    switch (this) {
      case TicketStatus.newOrder:
        return 'รอทำ';
      case TicketStatus.preparing:
        return 'กำลังทำ';
      case TicketStatus.ready:
        return 'พร้อมเสิร์ฟ';
      case TicketStatus.served:
        return 'เสิร์ฟแล้ว';
      case TicketStatus.paid:
        return 'ชำระแล้ว';
      case TicketStatus.cancelled:
        return 'ยกเลิก';
    }
  }

  Color get badgeColor {
    switch (this) {
      case TicketStatus.newOrder:
        return const Color(0xFF3B82F6); // blue
      case TicketStatus.preparing:
        return const Color(0xFFF97316); // orange
      case TicketStatus.ready:
        return const Color(0xFF22C55E); // green
      case TicketStatus.served:
        return const Color(0xFF0F766E); // teal
      case TicketStatus.paid:
        return const Color(0xFF64748B); // slate
      case TicketStatus.cancelled:
        return const Color(0xFFEF4444); // red
    }
  }
}

class StatusBadge extends StatelessWidget {
  const StatusBadge(this.status, {super.key});

  final TicketStatus status;

  @override
  Widget build(BuildContext context) {
    final color = status.badgeColor;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: color.withAlpha(26),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(76)),
      ),
      child: Text(
        status.label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }
}
