import 'package:flutter/material.dart';

import '../../models/enums.dart';
import '../../models/menu_product.dart';
import '../../models/order_line.dart';

class _OrderMeta {
  const _OrderMeta({required this.customerName, required this.note});

  final String customerName;
  final String note;
}

enum _OrderFlowView { table, charge }

class OrderTakingScreen extends StatefulWidget {
  const OrderTakingScreen({
    super.key,
    required this.menu,
    required this.onCreateOrder,
  });

  final List<MenuProduct> menu;
  final Future<void> Function({
    required String tableNo,
    required String customerName,
    required List<OrderLine> lines,
    String? note,
  })
  onCreateOrder;

  @override
  State<OrderTakingScreen> createState() => _OrderTakingScreenState();
}

class _OrderTakingScreenState extends State<OrderTakingScreen> {
  final Map<String, int> _cart = {};
  final List<String> _recentCustomerNames = [];
  final TextEditingController _searchCtrl = TextEditingController();
  String _selectedCategory = 'ทั้งหมด';
  String? _selectedTableNo;
  bool _isDineIn = true;
  _OrderFlowView _activeView = _OrderFlowView.table;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<String> get _tableOptions => List.generate(20, (index) => '${index + 1}');

  List<String> get _categories {
    final cats = widget.menu.map((m) => m.category).toSet().toList()..sort();
    return ['ทั้งหมด', ...cats];
  }

  List<MenuProduct> get _filteredMenu => _selectedCategory == 'ทั้งหมด'
      ? widget.menu
      : widget.menu.where((m) => m.category == _selectedCategory).toList();

  List<MenuProduct> get _visibleMenu {
    final query = _searchCtrl.text.trim().toLowerCase();
    final menu = _filteredMenu;
    if (query.isEmpty) return menu;
    return menu.where((item) {
      return item.name.toLowerCase().contains(query) ||
          item.category.toLowerCase().contains(query);
    }).toList();
  }

  List<OrderLine> get _cartLines => widget.menu
      .where((m) => _cart.containsKey(m.id))
      .map((m) => OrderLine(product: m, quantity: _cart[m.id]!))
      .toList();

  double get _cartTotal => _cartLines.fold(0, (sum, l) => sum + l.lineTotal);

  int get _cartItemCount => _cartLines.fold(0, (sum, l) => sum + l.quantity);

  void _addItem(MenuProduct item) =>
      setState(() => _cart.update(item.id, (q) => q + 1, ifAbsent: () => 1));

  void _removeItem(MenuProduct item) {
    setState(() {
      final qty = _cart[item.id];
      if (qty == null) return;
      qty <= 1 ? _cart.remove(item.id) : (_cart[item.id] = qty - 1);
    });
  }

  void _clearCart() {
    setState(() {
      _cart.clear();
      _activeView = _OrderFlowView.table;
    });
  }

  String? _validateCustomerName(String? value) {
    final name = value?.trim() ?? '';
    if (name.isEmpty) return 'กรุณาระบุชื่อลูกค้า';
    if (name.runes.length < 2) return 'ชื่อลูกค้าต้องมีอย่างน้อย 2 ตัวอักษร';
    return null;
  }

  void _updateRecentCustomerNames(String name) {
    final normalized = name.trim();
    if (normalized.isEmpty) return;

    setState(() {
      _recentCustomerNames.removeWhere(
        (entry) => entry.toLowerCase() == normalized.toLowerCase(),
      );
      _recentCustomerNames.insert(0, normalized);
      if (_recentCustomerNames.length > 5) {
        _recentCustomerNames.removeRange(5, _recentCustomerNames.length);
      }
    });
  }

  Future<_OrderMeta?> _askOrderMeta() async {
    final tempCustomerCtrl = TextEditingController();
    final tempNoteCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    final result = await showDialog<_OrderMeta>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('ยืนยันออเดอร์'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextFormField(
                  controller: tempCustomerCtrl,
                  autofocus: true,
                  decoration: const InputDecoration(
                    labelText: 'ชื่อลูกค้า',
                    hintText: 'เช่น คุณสมชาย',
                  ),
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) {
                    if (!formKey.currentState!.validate()) return;
                    Navigator.of(dialogContext).pop(
                      _OrderMeta(
                        customerName: tempCustomerCtrl.text.trim(),
                        note: tempNoteCtrl.text.trim(),
                      ),
                    );
                  },
                  validator: _validateCustomerName,
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: tempNoteCtrl,
                  decoration: const InputDecoration(
                    labelText: 'หมายเหตุ',
                    hintText: 'ไม่ใส่ก็ได้',
                  ),
                  maxLines: 2,
                  minLines: 1,
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () {
                    tempCustomerCtrl.text = 'ลูกค้าทั่วไป';
                    tempCustomerCtrl.selection = TextSelection.collapsed(
                      offset: tempCustomerCtrl.text.length,
                    );
                  },
                  icon: const Icon(Icons.person_outline_rounded, size: 18),
                  label: const Text('ใช้ชื่อ: ลูกค้าทั่วไป'),
                ),
                if (_recentCustomerNames.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  const Text(
                    'ชื่อล่าสุด',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: _recentCustomerNames.map((name) {
                      return ActionChip(
                        label: Text(name),
                        onPressed: () {
                          tempCustomerCtrl.text = name;
                          tempCustomerCtrl.selection = TextSelection.collapsed(
                            offset: tempCustomerCtrl.text.length,
                          );
                        },
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('ยกเลิก'),
            ),
            FilledButton(
              onPressed: () {
                if (!formKey.currentState!.validate()) return;
                Navigator.of(dialogContext).pop(
                  _OrderMeta(
                    customerName: tempCustomerCtrl.text.trim(),
                    note: tempNoteCtrl.text.trim(),
                  ),
                );
              },
              child: const Text('ยืนยัน'),
            ),
          ],
        );
      },
    );

    tempCustomerCtrl.dispose();
    tempNoteCtrl.dispose();
    return result;
  }

  Future<void> _submitOrder() async {
    final tableNo = _selectedTableNo ?? '';
    if (_isDineIn && tableNo.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('กรุณาเลือกโต๊ะสำหรับทานที่ร้าน'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final lines = _cartLines;
    if (lines.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final orderMeta = await _askOrderMeta();
    if (orderMeta == null) return;
    if (!mounted) return;
    _updateRecentCustomerNames(orderMeta.customerName);

    try {
      await widget.onCreateOrder(
        tableNo: _isDineIn ? tableNo : 'กลับบ้าน',
        customerName: orderMeta.customerName,
        lines: lines,
        note: orderMeta.note.isEmpty ? null : orderMeta.note,
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('สร้างออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (!mounted) return;
    setState(() {
      _cart.clear();
      _selectedTableNo = null;
      _activeView = _OrderFlowView.table;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('สร้างออเดอร์เรียบร้อย ส่งเข้าคิวครัวแล้ว'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 380;
    final formIsStacked = width < 430;
    final gridCount = width < 760 ? 1 : 2;
    final visibleMenu = _visibleMenu;
    final showChargeView = _activeView == _OrderFlowView.charge && _cart.isNotEmpty;
    final currentTableLabel = _isDineIn
        ? (_selectedTableNo == null ? 'ยังไม่เลือกโต๊ะ' : 'โต๊ะ $_selectedTableNo')
        : 'กลับบ้าน';

    return Column(
      children: [
        Expanded(
          child: showChargeView
              ? _ChargeView(
                  cartLines: _cartLines,
                  total: _cartTotal,
                  tableLabel: _isDineIn
                      ? 'Table ${_selectedTableNo ?? '-'}'
                      : 'Take away',
                  onConfirm: _submitOrder,
                )
              : Column(
                  children: [
                    Container(
                      margin: EdgeInsets.fromLTRB(
                        compact ? 10 : 12,
                        10,
                        compact ? 10 : 12,
                        0,
                      ),
                      padding: EdgeInsets.fromLTRB(
                        compact ? 10 : 12,
                        10,
                        compact ? 10 : 12,
                        10,
                      ),
                      decoration: BoxDecoration(
                        color: cs.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: cs.outlineVariant),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: compact ? 38 : 42,
                                height: compact ? 38 : 42,
                                decoration: BoxDecoration(
                                  color: cs.primary.withAlpha(80),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                alignment: Alignment.center,
                                child: Icon(
                                  Icons.point_of_sale_rounded,
                                  size: compact ? 18 : 20,
                                  color: cs.onSurface,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Front Counter',
                                      style: TextStyle(
                                        fontSize: compact ? 16 : 18,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '$currentTableLabel · ${visibleMenu.length} เมนูพร้อมขาย',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: cs.onSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: cs.surfaceContainerLow,
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  '${_cartItemCount} ชิ้น',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              _OrderSnapshot(
                                label: 'Mode',
                                value: _isDineIn ? 'Dine in' : 'Take away',
                              ),
                              _OrderSnapshot(
                                label: 'Table',
                                value: _isDineIn
                                    ? (_selectedTableNo ?? '--')
                                    : 'Grab',
                              ),
                              _OrderSnapshot(
                                label: 'Total',
                                value: '฿${_cartTotal.toStringAsFixed(0)}',
                                highlight: true,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: SegmentedButton<bool>(
                                  showSelectedIcon: false,
                                  style: ButtonStyle(
                                    visualDensity: VisualDensity.compact,
                                    tapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  segments: const [
                                    ButtonSegment<bool>(
                                      value: true,
                                      label: Text('ทานที่ร้าน'),
                                    ),
                                    ButtonSegment<bool>(
                                      value: false,
                                      label: Text('กลับบ้าน'),
                                    ),
                                  ],
                                  selected: {_isDineIn},
                                  onSelectionChanged: (selection) {
                                    final dineIn = selection.first;
                                    setState(() {
                                      _isDineIn = dineIn;
                                      if (!dineIn) _selectedTableNo = null;
                                    });
                                  },
                                ),
                              ),
                              if (!formIsStacked && _isDineIn) ...[
                                const SizedBox(width: 10),
                                SizedBox(
                                  width: 122,
                                  child: DropdownButtonFormField<String>(
                                    value: _selectedTableNo,
                                    isDense: true,
                                    decoration: const InputDecoration(
                                      labelText: 'โต๊ะ',
                                      contentPadding: EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 10,
                                      ),
                                    ),
                                    items: _tableOptions
                                        .map(
                                          (tableNo) => DropdownMenuItem<String>(
                                            value: tableNo,
                                            child: Text('โต๊ะ $tableNo'),
                                          ),
                                        )
                                        .toList(),
                                    onChanged: (value) {
                                      setState(() => _selectedTableNo = value);
                                    },
                                  ),
                                ),
                              ],
                            ],
                          ),
                          if (formIsStacked && _isDineIn) ...[
                            const SizedBox(height: 8),
                            SizedBox(
                              width: 120,
                              child: DropdownButtonFormField<String>(
                                value: _selectedTableNo,
                                isDense: true,
                                decoration: const InputDecoration(
                                  labelText: 'โต๊ะ',
                                  contentPadding: EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 10,
                                  ),
                                ),
                                items: _tableOptions
                                    .map(
                                      (tableNo) => DropdownMenuItem<String>(
                                        value: tableNo,
                                        child: Text('โต๊ะ $tableNo'),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (value) {
                                  setState(() => _selectedTableNo = value);
                                },
                              ),
                            ),
                          ],
                          const SizedBox(height: 10),
                          TextField(
                            controller: _searchCtrl,
                            onChanged: (_) => setState(() {}),
                            decoration: InputDecoration(
                              hintText: 'ค้นหาเมนูหรือหมวดหมู่',
                              prefixIcon: const Icon(Icons.search_rounded),
                              suffixIcon: _searchCtrl.text.isEmpty
                                  ? null
                                  : IconButton(
                                      onPressed: () {
                                        _searchCtrl.clear();
                                        setState(() {});
                                      },
                                      icon: const Icon(Icons.close_rounded),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: compact ? 42 : 46,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: EdgeInsets.symmetric(
                          horizontal: compact ? 10 : 12,
                          vertical: 6,
                        ),
                        itemCount: _categories.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(width: 6),
                        itemBuilder: (ctx, i) {
                          final cat = _categories[i];
                          final selected = cat == _selectedCategory;
                          return FilterChip(
                            label: Text(cat),
                            selected: selected,
                            onSelected: (_) =>
                                setState(() => _selectedCategory = cat),
                            showCheckmark: false,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            backgroundColor: cs.surface,
                            selectedColor: cs.primary,
                            side: BorderSide(
                              color: selected
                                  ? cs.primary
                                  : cs.outlineVariant,
                            ),
                            labelStyle: TextStyle(
                              fontWeight: selected
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                              color: selected ? cs.onPrimary : cs.onSurface,
                              fontSize: 13,
                            ),
                          );
                        },
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.fromLTRB(compact ? 10 : 12, 2, compact ? 10 : 12, 8),
                      child: Row(
                        children: [
                          Text(
                            'Menu list',
                            style: TextStyle(
                              fontSize: compact ? 15 : 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '${visibleMenu.length} รายการ',
                            style: TextStyle(
                              fontSize: 12,
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: visibleMenu.isEmpty
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.all(24),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 72,
                                      height: 72,
                                      decoration: BoxDecoration(
                                        color: cs.surface,
                                        borderRadius: BorderRadius.circular(22),
                                        border: Border.all(color: cs.outlineVariant),
                                      ),
                                      alignment: Alignment.center,
                                      child: Icon(
                                        Icons.search_off_rounded,
                                        size: 28,
                                        color: cs.onSurfaceVariant,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    const Text(
                                      'ไม่พบเมนูที่ค้นหา',
                                      style: TextStyle(fontWeight: FontWeight.w700),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(color: cs.onSurfaceVariant),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          : GridView.builder(
                              padding: EdgeInsets.fromLTRB(
                                compact ? 10 : 12,
                                0,
                                compact ? 10 : 12,
                                12,
                              ),
                              gridDelegate:
                                  SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: gridCount,
                                mainAxisSpacing: 10,
                                crossAxisSpacing: 10,
                                childAspectRatio: width < 760 ? 2.48 : 1.28,
                              ),
                              itemCount: visibleMenu.length,
                              itemBuilder: (ctx, i) => _MenuItemCard(
                                item: visibleMenu[i],
                                qty: _cart[visibleMenu[i].id] ?? 0,
                                onAdd: () => _addItem(visibleMenu[i]),
                                onRemove: () => _removeItem(visibleMenu[i]),
                              ),
                            ),
                    ),
                  ],
                ),
        ),

        if (_cart.isEmpty)
          Padding(
            padding: EdgeInsets.fromLTRB(compact ? 10 : 12, 0, compact ? 10 : 12, 12),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: cs.outlineVariant),
              ),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      Icons.shopping_bag_outlined,
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'ยังไม่มีรายการในออเดอร์',
                      style: TextStyle(
                        color: cs.onSurfaceVariant,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  Text(
                    'เลือกเมนู',
                    style: TextStyle(
                      color: cs.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          _CartBar(
            itemCount: _cartItemCount,
            total: _cartTotal,
            activeView: _activeView,
            onClear: _clearCart,
            onChangeView: (view) {
              setState(() => _activeView = view);
            },
          ),
      ],
    );
  }
}

class _OrderSnapshot extends StatelessWidget {
  const _OrderSnapshot({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: highlight ? cs.primary.withAlpha(66) : cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class _ChargeView extends StatefulWidget {
  const _ChargeView({
    required this.cartLines,
    required this.total,
    required this.tableLabel,
    required this.onConfirm,
  });

  final List<OrderLine> cartLines;
  final double total;
  final String tableLabel;
  final Future<void> Function() onConfirm;

  @override
  State<_ChargeView> createState() => _ChargeViewState();
}

class _ChargeViewState extends State<_ChargeView> {
  late final TextEditingController _amountCtrl;
  PaymentMethod _selectedMethod = PaymentMethod.cash;

  @override
  void initState() {
    super.initState();
    _amountCtrl = TextEditingController(text: widget.total.toStringAsFixed(2));
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    super.dispose();
  }

  double get _amountReceived =>
      double.tryParse(_amountCtrl.text.replaceAll(',', '')) ?? 0;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final compact = MediaQuery.sizeOf(context).width < 390;
    final change = _amountReceived > widget.total
        ? _amountReceived - widget.total
        : 0.0;

    return ListView(
      padding: EdgeInsets.fromLTRB(compact ? 10 : 12, 10, compact ? 10 : 12, 12),
      children: [
        Container(
          padding: EdgeInsets.all(compact ? 16 : 18),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: cs.outlineVariant),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: cs.primary.withAlpha(80),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(Icons.receipt_long_rounded),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Charge Bill',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.tableLabel,
                          style: TextStyle(color: cs.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${widget.cartLines.length} รายการ',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                decoration: BoxDecoration(
                  color: cs.primary.withAlpha(80),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ยอดสุทธิ',
                      style: TextStyle(
                        fontSize: 12,
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '฿${widget.total.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ...widget.cartLines.map(
                (line) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                line.product.name,
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${line.quantity} x ฿${line.product.price.toStringAsFixed(0)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: cs.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '฿${line.lineTotal.toStringAsFixed(2)}',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _amountCtrl,
                onChanged: (_) => setState(() {}),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'รับเงินมา',
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _ChargeStat(label: 'ยอดสุทธิ', value: '฿${widget.total.toStringAsFixed(2)}'),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _ChargeStat(
                      label: 'เงินทอน',
                      value: '฿${change.toStringAsFixed(2)}',
                      highlight: change > 0,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: PaymentMethod.values.map((method) {
                  final selected = _selectedMethod == method;
                  return Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(
                        right: method == PaymentMethod.values.last ? 0 : 8,
                      ),
                      child: InkWell(
                        onTap: () {
                          setState(() {
                            _selectedMethod = method;
                          });
                        },
                        borderRadius: BorderRadius.circular(18),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 160),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                          decoration: BoxDecoration(
                            color: selected ? cs.primary.withAlpha(80) : cs.surfaceContainerLow,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: selected ? cs.primary : cs.outlineVariant,
                            ),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(_paymentIcon(method), size: 18),
                              const SizedBox(height: 6),
                              Text(
                                method.label,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () async {
                    await widget.onConfirm();
                  },
                  child: Text('ยืนยันการชำระ • ${_selectedMethod.label}'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  IconData _paymentIcon(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.cash:
        return Icons.payments_outlined;
      case PaymentMethod.transfer:
        return Icons.credit_card_rounded;
      case PaymentMethod.qr:
        return Icons.qr_code_2_rounded;
    }
  }
}

class _ChargeStat extends StatelessWidget {
  const _ChargeStat({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: highlight ? cs.primary.withAlpha(60) : cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
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
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class _MenuItemCard extends StatelessWidget {
  const _MenuItemCard({
    required this.item,
    required this.qty,
    required this.onAdd,
    required this.onRemove,
  });

  final MenuProduct item;
  final int qty;
  final VoidCallback onAdd;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final inCart = qty > 0;
    final compact = MediaQuery.sizeOf(context).width < 390;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 160),
      decoration: BoxDecoration(
        color: inCart ? cs.primary.withAlpha(40) : cs.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: inCart ? cs.primary : cs.outlineVariant,
        ),
      ),
      padding: EdgeInsets.fromLTRB(compact ? 10 : 12, 10, compact ? 8 : 10, compact ? 8 : 10),
      child: Row(
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  width: compact ? 76 : 90,
                  height: compact ? 76 : 90,
                  child: item.imageUrl.isEmpty
                      ? Container(
                          color: const Color(0xFFF6F6F1),
                          alignment: Alignment.center,
                          child: Icon(
                            Icons.fastfood_rounded,
                            color: cs.onSurfaceVariant,
                          ),
                        )
                      : Image.network(
                          item.imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              color: const Color(0xFFF6F6F1),
                              alignment: Alignment.center,
                              child: Icon(
                                Icons.image_not_supported_outlined,
                                color: cs.onSurfaceVariant,
                              ),
                            );
                          },
                        ),
                ),
              ),
              if (inCart)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: cs.onSurface,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '$qty',
                      style: TextStyle(
                        color: cs.surface,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    item.category,
                    style: TextStyle(
                      fontSize: 10,
                      color: cs.onSurfaceVariant,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  item.name,
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: compact ? 12 : 13),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const Spacer(),
                Row(
                  children: [
                    Text(
                      '฿${item.price.toStringAsFixed(0)}',
                      style: TextStyle(
                        fontSize: compact ? 12 : 13,
                        color: cs.primary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const Spacer(),
                    if (inCart) ...[
                      _SmallIconBtn(
                        icon: Icons.remove,
                        onTap: onRemove,
                        color: cs.error,
                      ),
                      const SizedBox(width: 6),
                    ],
                    _SmallIconBtn(icon: Icons.add, onTap: onAdd, color: cs.primary),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SmallIconBtn extends StatelessWidget {
  const _SmallIconBtn({
    required this.icon,
    required this.onTap,
    required this.color,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(8),
    child: Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: color.withAlpha(18),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, size: 17, color: color),
    ),
  );
}

class _CartBar extends StatelessWidget {
  const _CartBar({
    required this.itemCount,
    required this.total,
    required this.activeView,
    required this.onClear,
    required this.onChangeView,
  });

  final int itemCount;
  final double total;
  final _OrderFlowView activeView;
  final VoidCallback onClear;
  final ValueChanged<_OrderFlowView> onChangeView;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final compact = MediaQuery.sizeOf(context).width < 390;

    return SafeArea(
      top: false,
      child: Container(
        color: Colors.transparent,
        padding: EdgeInsets.fromLTRB(
          compact ? 12 : 16,
          10,
          compact ? 12 : 16,
          12,
        ),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: cs.outlineVariant),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '$itemCount item${itemCount == 1 ? '' : 's'}',
                      style: TextStyle(
                        fontSize: 12,
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                    Text(
                      '฿${total.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF4F4EE),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Row(
                  children: [
                    _FlowToggleButton(
                      label: 'Table',
                      selected: activeView == _OrderFlowView.table,
                      onTap: () => onChangeView(_OrderFlowView.table),
                    ),
                    _FlowToggleButton(
                      label: 'Charge',
                      selected: activeView == _OrderFlowView.charge,
                      onTap: () => onChangeView(_OrderFlowView.charge),
                    ),
                  ],
                ),
              ),
              if (!compact) ...[
                const SizedBox(width: 8),
                IconButton(
                  onPressed: onClear,
                  icon: const Icon(Icons.delete_outline_rounded),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _FlowToggleButton extends StatelessWidget {
  const _FlowToggleButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        margin: const EdgeInsets.all(4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? cs.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: selected ? cs.onPrimary : cs.onSurface,
          ),
        ),
      ),
    );
  }
}
