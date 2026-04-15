import 'package:flutter/material.dart';

import '../../models/enums.dart';
import '../../models/order_ticket.dart';

class CashierScreen extends StatelessWidget {
  const CashierScreen({
    super.key,
    required this.tickets,
    required this.onMarkPaid,
  });

  final List<OrderTicket> tickets;
  final Future<void> Function(String id, PaymentMethod method) onMarkPaid;

  List<OrderTicket> get _queue =>
      tickets.where((t) => t.status == TicketStatus.served).toList();

  @override
  Widget build(BuildContext context) {
    final queue = _queue;
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 430;
    final ultraCompact = width < 360;

    if (queue.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.point_of_sale_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
            const SizedBox(height: 12),
            Text(
              'ยังไม่มีออเดอร์รอชำระ',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(ultraCompact ? 8 : (compact ? 10 : 12)),
      itemCount: queue.length,
      itemBuilder: (ctx, i) =>
          _CashierCard(ticket: queue[i], onMarkPaid: onMarkPaid),
    );
  }
}

class _CashierCard extends StatelessWidget {
  const _CashierCard({required this.ticket, required this.onMarkPaid});

  final OrderTicket ticket;
  final Future<void> Function(String id, PaymentMethod method) onMarkPaid;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 430;
    final ultraCompact = width < 360;

    return Card(
      margin: EdgeInsets.only(bottom: ultraCompact ? 8 : 10),
      child: Padding(
        padding: EdgeInsets.all(ultraCompact ? 10 : (compact ? 12 : 14)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (compact)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${ticket.id} · โต๊ะ ${ticket.tableNo}',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: ultraCompact ? 13 : 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: ultraCompact ? 4 : 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: cs.primaryContainer,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '฿${ticket.total.toStringAsFixed(2)}',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: cs.onPrimaryContainer,
                        fontSize: ultraCompact ? 12 : 13,
                      ),
                    ),
                  ),
                ],
              )
            else
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${ticket.id} · โต๊ะ ${ticket.tableNo}',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: compact ? 14 : 15,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: cs.primaryContainer,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '฿${ticket.total.toStringAsFixed(2)}',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: cs.onPrimaryContainer,
                        fontSize: compact ? 12 : 13,
                      ),
                    ),
                  ),
                ],
              ),
            SizedBox(height: ultraCompact ? 2 : 4),
            Text(
              '${ticket.customerName} · ${ticket.itemCount} รายการ',
              style: TextStyle(
                fontSize: ultraCompact ? 12 : 13,
                color: cs.onSurfaceVariant,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Divider(height: ultraCompact ? 14 : 18),
            ...ticket.lines.map(
              (l) => Padding(
                padding: EdgeInsets.only(bottom: ultraCompact ? 2 : 3),
                child: compact
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l.product.name,
                            style: TextStyle(fontSize: ultraCompact ? 12 : 13),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          SizedBox(height: ultraCompact ? 1 : 2),
                          Row(
                            children: [
                              Text(
                                '× ${l.quantity}',
                                style: TextStyle(
                                  fontSize: ultraCompact ? 12 : 13,
                                  color: cs.onSurfaceVariant,
                                ),
                              ),
                              SizedBox(width: ultraCompact ? 8 : 10),
                              Text(
                                '฿${l.lineTotal.toStringAsFixed(2)}',
                                style: TextStyle(fontSize: ultraCompact ? 12 : 13),
                              ),
                            ],
                          ),
                        ],
                      )
                    : Row(
                        children: [
                          Expanded(
                            child: Text(
                              l.product.name,
                              style: TextStyle(fontSize: compact ? 12 : 13),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            '× ${l.quantity}',
                            style: TextStyle(
                              fontSize: compact ? 12 : 13,
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                          SizedBox(width: compact ? 8 : 12),
                          SizedBox(
                            width: compact ? 62 : 68,
                            child: Text(
                              '฿${l.lineTotal.toStringAsFixed(2)}',
                              textAlign: TextAlign.right,
                              style: TextStyle(fontSize: compact ? 12 : 13),
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            SizedBox(height: ultraCompact ? 8 : 12),
            Text(
              'รับชำระ',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: ultraCompact ? 12 : 13,
              ),
            ),
            SizedBox(height: ultraCompact ? 6 : 8),
            Wrap(
              spacing: ultraCompact ? 6 : 8,
              runSpacing: ultraCompact ? 6 : 8,
              children: PaymentMethod.values.map((method) {
                return FilledButton.icon(
                  onPressed: () async => onMarkPaid(ticket.id, method),
                  icon: Icon(_methodIcon(method), size: ultraCompact ? 14 : 16),
                  label: Text(
                    method.label,
                    style: TextStyle(fontSize: ultraCompact ? 12 : 13),
                  ),
                  style: FilledButton.styleFrom(
                    padding: EdgeInsets.symmetric(
                      horizontal: ultraCompact ? 10 : 12,
                      vertical: ultraCompact ? 8 : 10,
                    ),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  IconData _methodIcon(PaymentMethod m) {
    switch (m) {
      case PaymentMethod.cash:
        return Icons.payments_outlined;
      case PaymentMethod.transfer:
        return Icons.account_balance_outlined;
      case PaymentMethod.qr:
        return Icons.qr_code_rounded;
    }
  }
}
