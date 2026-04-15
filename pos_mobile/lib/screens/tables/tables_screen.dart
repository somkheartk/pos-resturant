import 'package:flutter/material.dart';

import '../../models/enums.dart';
import '../../models/order_ticket.dart';
import '../../widgets/status_badge.dart';

class TablesScreen extends StatelessWidget {
  const TablesScreen({super.key, required this.tickets});

  final List<OrderTicket> tickets;

  List<OrderTicket> get _latestByTable {
    final sorted = [...tickets]
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    final seenTables = <String>{};
    final latest = <OrderTicket>[];

    for (final ticket in sorted) {
      if (!seenTables.add(ticket.tableNo)) continue;
      latest.add(ticket);
    }

    latest.sort((a, b) => a.tableNo.compareTo(b.tableNo));
    return latest;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 420;
    final tables = _latestByTable;
    final activeCount = tables
        .where(
          (ticket) =>
              ticket.status != TicketStatus.paid &&
              ticket.status != TicketStatus.cancelled,
        )
        .length;

    if (tables.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.table_restaurant_outlined,
              size: 60,
              color: cs.outlineVariant,
            ),
            const SizedBox(height: 12),
            Text(
              'ยังไม่มีข้อมูลโต๊ะ',
              style: TextStyle(color: cs.onSurfaceVariant),
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
          padding: EdgeInsets.symmetric(
            horizontal: compact ? 12 : 14,
            vertical: compact ? 10 : 12,
          ),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: cs.outlineVariant),
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
                      color: cs.primary.withAlpha(80),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(Icons.table_restaurant_rounded),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Table Overview',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'ดูโต๊ะที่กำลังใช้งานและบิลล่าสุดของแต่ละโต๊ะ',
                          style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  _MetricChip(label: 'ทั้งหมด', value: '${tables.length}'),
                  _MetricChip(label: 'กำลังใช้งาน', value: '$activeCount'),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: EdgeInsets.fromLTRB(compact ? 10 : 12, 0, compact ? 10 : 12, 12),
            itemCount: tables.length,
            itemBuilder: (context, index) => _TableCard(ticket: tables[index]),
          ),
        ),
      ],
    );
  }
}

class _TableCard extends StatelessWidget {
  const _TableCard({required this.ticket});

  final OrderTicket ticket;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final compact = MediaQuery.sizeOf(context).width < 420;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: compact ? 54 : 60,
              height: compact ? 54 : 60,
              decoration: BoxDecoration(
                color: cs.primary.withAlpha(50),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Table',
                    style: TextStyle(
                      fontSize: 10,
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                  Text(
                    ticket.tableNo,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: compact ? 18 : 20,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
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
                  const SizedBox(height: 4),
                  Text(
                    '${ticket.itemCount} รายการ',
                    style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    ticket.createdAt.hour.toString().padLeft(2, '0') +
                        ':' +
                        ticket.createdAt.minute.toString().padLeft(2, '0'),
                    style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                  ),
                  if (compact) ...[
                    const SizedBox(height: 8),
                    StatusBadge(ticket.status),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (!compact) StatusBadge(ticket.status),
                if (!compact) const SizedBox(height: 8),
                Text(
                  '฿${ticket.total.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({required this.label, required this.value});

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
          Text(
            label,
            style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
          ),
          const SizedBox(width: 6),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}