import 'package:flutter/material.dart';

import '../../models/enums.dart';
import '../../models/order_ticket.dart';
import '../../widgets/status_badge.dart';

class KitchenScreen extends StatelessWidget {
  const KitchenScreen({
    super.key,
    required this.tickets,
    required this.onUpdateStatus,
  });

  final List<OrderTicket> tickets;
  final Future<void> Function(String id, TicketStatus status) onUpdateStatus;

  static const _activeStatuses = {
    TicketStatus.newOrder,
    TicketStatus.preparing,
    TicketStatus.ready,
    TicketStatus.served,
  };

  List<OrderTicket> get _kitchenTickets =>
      tickets.where((t) => _activeStatuses.contains(t.status)).toList();

  @override
  Widget build(BuildContext context) {
    final queue = _kitchenTickets;
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 390;

    if (queue.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.kitchen_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
            const SizedBox(height: 12),
            Text(
              'ยังไม่มีออเดอร์ในคิวครัว',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        Container(
          width: double.infinity,
          margin: EdgeInsets.fromLTRB(compact ? 10 : 12, 10, compact ? 10 : 12, 8),
          padding: EdgeInsets.symmetric(horizontal: compact ? 12 : 14, vertical: 14),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary.withAlpha(80),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(Icons.ramen_dining_rounded),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Kitchen Queue',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'ดูงานที่ต้องทำก่อนและออเดอร์พร้อมเสิร์ฟ',
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _KitchenMetric(label: 'Active', value: '${queue.length}'),
                  _KitchenMetric(
                    label: 'Ready',
                    value: '${queue.where((t) => t.status == TicketStatus.ready).length}',
                  ),
                  _KitchenMetric(
                    label: 'Preparing',
                    value: '${queue.where((t) => t.status == TicketStatus.preparing).length}',
                  ),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: EdgeInsets.fromLTRB(compact ? 10 : 12, 0, compact ? 10 : 12, 12),
            itemCount: queue.length,
            itemBuilder: (ctx, i) =>
                _KitchenCard(ticket: queue[i], onUpdateStatus: onUpdateStatus),
          ),
        ),
      ],
    );
  }
}

class _KitchenCard extends StatelessWidget {
  const _KitchenCard({required this.ticket, required this.onUpdateStatus});

  final OrderTicket ticket;
  final Future<void> Function(String id, TicketStatus status) onUpdateStatus;

  String _elapsed() {
    final mins = DateTime.now().difference(ticket.createdAt).inMinutes;
    if (mins < 1) return 'เพิ่งสร้าง';
    return '$mins นาทีที่แล้ว';
  }

  Color _elapsedColor(BuildContext context) {
    final mins = DateTime.now().difference(ticket.createdAt).inMinutes;
    if (mins >= 10) return const Color(0xFFEF4444);
    if (mins >= 5) return const Color(0xFFF97316);
    return Theme.of(context).colorScheme.onSurfaceVariant;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final compact = MediaQuery.sizeOf(context).width < 390;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: EdgeInsets.all(compact ? 12 : 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: cs.primary.withAlpha(70),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    'T${ticket.tableNo}',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ticket.customerName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${ticket.itemCount} รายการ',
                        style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                StatusBadge(ticket.status),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.timer_outlined,
                  size: 13,
                  color: _elapsedColor(context),
                ),
                const SizedBox(width: 3),
                Text(
                  _elapsed(),
                  style: TextStyle(fontSize: 12, color: _elapsedColor(context)),
                ),
                const SizedBox(width: 10),
                Icon(Icons.receipt_long_outlined, size: 13, color: cs.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  '฿${ticket.total.toStringAsFixed(0)}',
                  style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                ),
              ],
            ),

            // ── Items ────────────────────────────────────────────
            const SizedBox(height: 10),
            ...ticket.lines.map(
              (l) => Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(l.product.name, style: const TextStyle(fontSize: 13)),
                      ),
                      Text(
                        '× ${l.quantity}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: cs.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (ticket.note != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(
                  children: [
                    Icon(Icons.notes_rounded, size: 13, color: cs.outline),
                    const SizedBox(width: 4),
                    Text(
                      ticket.note!,
                      style: TextStyle(fontSize: 12, color: cs.outline),
                    ),
                  ],
                ),
              ),

            // ── Actions ──────────────────────────────────────────
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                if (ticket.status == TicketStatus.newOrder)
                  FilledButton.tonal(
                    onPressed: () async =>
                        onUpdateStatus(ticket.id, TicketStatus.preparing),
                    child: const Text('เริ่มทำ'),
                  ),
                if (ticket.status == TicketStatus.preparing)
                  FilledButton(
                    onPressed: () async =>
                        onUpdateStatus(ticket.id, TicketStatus.ready),
                    child: const Text('พร้อมเสิร์ฟ'),
                  ),
                if (ticket.status == TicketStatus.ready)
                  FilledButton(
                    onPressed: () async =>
                        onUpdateStatus(ticket.id, TicketStatus.served),
                    child: const Text('เสิร์ฟแล้ว'),
                  ),
                if (ticket.status != TicketStatus.served)
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: cs.error,
                      side: BorderSide(color: cs.errorContainer),
                    ),
                    onPressed: () async =>
                        onUpdateStatus(ticket.id, TicketStatus.cancelled),
                    child: const Text('ยกเลิก'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _KitchenMetric extends StatelessWidget {
  const _KitchenMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
          const SizedBox(width: 6),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
