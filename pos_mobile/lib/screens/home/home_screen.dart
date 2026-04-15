import 'package:flutter/material.dart';

import '../../data/sample_menu.dart';
import '../../models/enums.dart';
import '../../models/order_line.dart';
import '../../models/order_ticket.dart';
import '../../models/staff_user.dart';
import '../../services/orders_api.dart';
import '../history/history_screen.dart';
import '../kitchen/kitchen_screen.dart';
import '../login/login_screen.dart';
import '../order_taking/order_taking_screen.dart';
import '../tables/tables_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.user, required this.accessToken});

  final StaffUser user;
  final String accessToken;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const _ordersApi = OrdersApi();

  final List<OrderTicket> _tickets = [];
  int _selectedIndex = 0;
  bool _isLoadingOrders = true;

  // ── API-backed ticket actions ────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    try {
      final rows = await _ordersApi.listOrders(accessToken: widget.accessToken);
      if (!mounted) return;
      setState(() {
        _tickets
          ..clear()
          ..addAll(rows);
        _isLoadingOrders = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoadingOrders = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('โหลดออเดอร์จากเซิร์ฟเวอร์ไม่สำเร็จ'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _createOrder({
    required String tableNo,
    required String customerName,
    required List<OrderLine> lines,
    String? note,
  }) async {
    final ticket = await _ordersApi.createOrder(
      accessToken: widget.accessToken,
      tableNo: tableNo,
      customerName: customerName,
      lines: lines,
      note: note,
    );

    if (!mounted) return;
    setState(() => _upsertTicket(ticket));
  }

  Future<void> _updateStatus(String id, TicketStatus status) async {
    final target = _tickets.firstWhere(
      (ticket) => ticket.id == id,
      orElse: () => throw StateError('Order not found'),
    );
    final orderId = target.backendId ?? target.id;

    try {
      final updated = await _ordersApi.updateOrder(
        accessToken: widget.accessToken,
        orderId: orderId,
        status: status,
      );
      if (!mounted) return;
      setState(() => _upsertTicket(updated));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('อัปเดตสถานะไม่สำเร็จ'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _upsertTicket(OrderTicket ticket) {
    final index = _tickets.indexWhere(
      (t) =>
          (t.backendId != null && t.backendId == ticket.backendId) ||
          t.id == ticket.id,
    );

    if (index == -1) {
      _tickets.insert(0, ticket);
    } else {
      _tickets[index] = ticket;
    }
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  static const _navItems = [
    (Icons.receipt_long_outlined, Icons.receipt_long, 'สั่ง'),
    (Icons.local_shipping_outlined, Icons.local_shipping, 'สถานะ'),
    (Icons.table_restaurant_outlined, Icons.table_restaurant, 'โต๊ะ'),
    (Icons.history_outlined, Icons.history, 'History'),
  ];

  int get _kitchenBadge => _tickets
      .where(
        (t) =>
            t.status == TicketStatus.newOrder ||
            t.status == TicketStatus.preparing,
      )
      .length;

  int get _tableBadge => _tickets
      .where(
        (t) =>
            t.status != TicketStatus.paid &&
            t.status != TicketStatus.cancelled,
      )
      .map((t) => t.tableNo)
      .toSet()
      .length;

  // ── Profile sheet ────────────────────────────────────────────────────────

  void _showProfile() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final cs = Theme.of(ctx).colorScheme;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: cs.primaryContainer,
                      child: Text(
                        widget.user.initials,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: cs.onPrimaryContainer,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.user.displayName,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 17,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.user.email,
                          style: TextStyle(
                            fontSize: 12,
                            color: cs.outline,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: cs.secondaryContainer,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            widget.user.role,
                            style: TextStyle(
                              fontSize: 12,
                              color: cs.onSecondaryContainer,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.logout_rounded),
                  title: const Text('ออกจากระบบ'),
                  onTap: () {
                    Navigator.pop(ctx);
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 430;

    final screens = [
      OrderTakingScreen(menu: sampleMenu, onCreateOrder: _createOrder),
      KitchenScreen(tickets: _tickets, onUpdateStatus: _updateStatus),
      TablesScreen(tickets: _tickets),
      HistoryScreen(tickets: _tickets),
    ];

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(compact ? 12 : 16, 10, compact ? 12 : 16, 8),
              child: Container(
                padding: EdgeInsets.symmetric(
                  horizontal: compact ? 14 : 16,
                  vertical: compact ? 12 : 14,
                ),
                decoration: BoxDecoration(
                  color: cs.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: cs.outlineVariant),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _navItems[_selectedIndex].$3,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: compact ? 20 : 22,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'POS mobile workspace',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: cs.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'รีเฟรช',
                          onPressed: _loadOrders,
                          icon: const Icon(Icons.refresh_rounded),
                        ),
                        const SizedBox(width: 4),
                        InkWell(
                          onTap: _showProfile,
                          borderRadius: BorderRadius.circular(999),
                          child: CircleAvatar(
                            radius: compact ? 20 : 22,
                            backgroundColor: cs.primary,
                            child: Text(
                              widget.user.initials,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: cs.onPrimary,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _TopMetric(
                            label: 'Open Orders',
                            value: '${_tickets.where((t) => t.status != TicketStatus.paid && t.status != TicketStatus.cancelled).length}',
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _TopMetric(
                            label: 'Kitchen',
                            value: '$_kitchenBadge',
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _TopMetric(
                            label: 'Tables',
                            value: '$_tableBadge',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            if (_isLoadingOrders)
              Padding(
                padding: EdgeInsets.symmetric(horizontal: compact ? 12 : 16),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: const LinearProgressIndicator(minHeight: 4),
                ),
              ),
            Expanded(
              child: IndexedStack(index: _selectedIndex, children: screens),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.fromLTRB(compact ? 12 : 16, 0, compact ? 12 : 16, 12),
          child: Container(
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: cs.outlineVariant),
            ),
            child: NavigationBar(
              height: compact ? 68 : 76,
              backgroundColor: Colors.transparent,
              indicatorColor: cs.primary,
              labelBehavior: compact
                  ? NavigationDestinationLabelBehavior.onlyShowSelected
                  : NavigationDestinationLabelBehavior.alwaysShow,
              selectedIndex: _selectedIndex,
              onDestinationSelected: (i) => setState(() => _selectedIndex = i),
              destinations: [
                NavigationDestination(
                  icon: _badge(Icon(_navItems[0].$1), 0),
                  selectedIcon: Icon(_navItems[0].$2),
                  label: _navItems[0].$3,
                ),
                NavigationDestination(
                  icon: _badge(Icon(_navItems[1].$1), _kitchenBadge),
                  selectedIcon: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Icon(_navItems[1].$2),
                      if (_kitchenBadge > 0)
                        Positioned(
                          top: -4,
                          right: -6,
                          child: _badgeDot(_kitchenBadge, cs),
                        ),
                    ],
                  ),
                  label: _navItems[1].$3,
                ),
                NavigationDestination(
                  icon: _badge(Icon(_navItems[2].$1), _tableBadge),
                  selectedIcon: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Icon(_navItems[2].$2),
                      if (_tableBadge > 0)
                        Positioned(
                          top: -4,
                          right: -6,
                          child: _badgeDot(_tableBadge, cs),
                        ),
                    ],
                  ),
                  label: _navItems[2].$3,
                ),
                NavigationDestination(
                  icon: Icon(_navItems[3].$1),
                  selectedIcon: Icon(_navItems[3].$2),
                  label: _navItems[3].$3,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _badge(Widget icon, int count) {
    if (count == 0) return icon;
    final cs = Theme.of(context).colorScheme;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        icon,
        Positioned(top: -4, right: -6, child: _badgeDot(count, cs)),
      ],
    );
  }

  Widget _badgeDot(int count, ColorScheme cs) => Container(
    padding: const EdgeInsets.all(3),
    constraints: const BoxConstraints(minWidth: 17, minHeight: 17),
    decoration: BoxDecoration(color: cs.error, shape: BoxShape.circle),
    child: Text(
      '$count',
      textAlign: TextAlign.center,
      style: TextStyle(
        color: cs.onError,
        fontSize: 10,
        fontWeight: FontWeight.w700,
      ),
    ),
  );
}

class _TopMetric extends StatelessWidget {
  const _TopMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
        ],
      ),
    );
  }
}
