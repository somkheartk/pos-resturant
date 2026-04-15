import 'package:flutter/material.dart';

import '../../models/enums.dart';
import '../../models/order_ticket.dart';
import '../../widgets/status_badge.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key, required this.tickets});

  final List<OrderTicket> tickets;

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  TicketStatus? _filterStatus;

  static const _filterOptions = [
    (null, 'ทั้งหมด'),
    (TicketStatus.paid, 'ชำระแล้ว'),
    (TicketStatus.cancelled, 'ยกเลิก'),
  ];

  List<OrderTicket> get _filtered {
    final history = widget.tickets
        .where(
          (t) =>
              t.status == TicketStatus.paid ||
              t.status == TicketStatus.cancelled,
        )
        .toList();
    if (_filterStatus == null) return history;
    return history.where((t) => t.status == _filterStatus).toList();
  }

  double get _totalRevenue => widget.tickets
      .where((t) => t.status == TicketStatus.paid)
      .fold(0, (sum, t) => sum + t.total);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final list = _filtered;
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 420;

    return Column(
      children: [
        Container(
          margin: EdgeInsets.fromLTRB(compact ? 10 : 12, 10, compact ? 10 : 12, 8),
          padding: EdgeInsets.symmetric(horizontal: compact ? 12 : 16, vertical: 12),
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
                    child: const Icon(Icons.history_rounded),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Order History',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'สรุปบิลที่ชำระแล้วและรายการที่ยกเลิก',
                          style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: compact ? 12 : 16,
                runSpacing: 10,
                children: [
                  _SummaryTile(
                    label: 'ออเดอร์วันนี้',
                    value: '${widget.tickets.where((t) => t.status == TicketStatus.paid).length}',
                    icon: Icons.receipt_long_outlined,
                    compact: compact,
                  ),
                  _SummaryTile(
                    label: 'รายได้รวม',
                    value: '฿${_totalRevenue.toStringAsFixed(0)}',
                    icon: Icons.payments_outlined,
                    highlight: true,
                    compact: compact,
                  ),
                ],
              ),
            ],
          ),
        ),
        SizedBox(
          height: 46,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            children: _filterOptions.map((opt) {
              final selected = _filterStatus == opt.$1;
              return Padding(
                padding: const EdgeInsets.only(right: 6),
                child: FilterChip(
                  label: Text(opt.$2),
                  selected: selected,
                  onSelected: (_) => setState(() => _filterStatus = opt.$1),
                  showCheckmark: false,
                  backgroundColor: cs.surface,
                  selectedColor: cs.primary,
                  side: BorderSide(
                    color: selected ? cs.primary : cs.outlineVariant,
                  ),
                  labelStyle: TextStyle(
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                    color: selected ? cs.onPrimary : cs.onSurface,
                    fontSize: 13,
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        if (list.isEmpty)
          Expanded(
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.history_outlined,
                      size: 64, color: cs.outlineVariant),
                  const SizedBox(height: 12),
                  Text('ยังไม่มีประวัติออเดอร์',
                      style: TextStyle(color: cs.onSurfaceVariant)),
                ],
              ),
            ),
          )
        else
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: list.length,
              itemBuilder: (ctx, i) => _HistoryCard(ticket: list[i]),
            ),
          ),
      ],
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.ticket});

  final OrderTicket ticket;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final compact = MediaQuery.sizeOf(context).width < 420;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    ticket.status == TicketStatus.paid
                        ? Icons.check_rounded
                        : Icons.close_rounded,
                    color: ticket.status.badgeColor,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        compact
                            ? ticket.customerName
                            : '${ticket.customerName} · โต๊ะ ${ticket.tableNo}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${ticket.itemCount} รายการ',
                        style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '฿${ticket.total.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                    if (ticket.paymentMethod != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          ticket.paymentMethod!.label,
                          style: TextStyle(fontSize: 11, color: cs.outline),
                        ),
                      ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: cs.surfaceContainerLow,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                ticket.lines
                    .map((l) => '${l.product.name} ×${l.quantity}')
                    .join(', '),
                style: TextStyle(fontSize: 11, color: cs.outline),
                maxLines: compact ? 2 : 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                StatusBadge(ticket.status),
                const Spacer(),
                Text(
                  '${ticket.createdAt.day.toString().padLeft(2, '0')}/${ticket.createdAt.month.toString().padLeft(2, '0')} '
                  '${ticket.createdAt.hour.toString().padLeft(2, '0')}:${ticket.createdAt.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({
    required this.label,
    required this.value,
    required this.icon,
    required this.compact,
    this.highlight = false,
  });

  final String label;
  final String value;
  final IconData icon;
  final bool compact;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return ConstrainedBox(
      constraints: BoxConstraints(minWidth: compact ? 120 : 140),
      child: Row(
      children: [
        Icon(icon, size: 20, color: highlight ? cs.primary : cs.onSurfaceVariant),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
            Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: compact ? 15 : 16,
                color: highlight ? cs.primary : null,
              ),
            ),
          ],
        ),
      ],
      ),
    );
  }
}
