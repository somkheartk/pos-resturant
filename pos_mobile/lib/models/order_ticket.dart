import 'enums.dart';
import 'order_line.dart';

class OrderTicket {
  const OrderTicket({
    required this.id,
    this.backendId,
    required this.tableNo,
    required this.customerName,
    required this.lines,
    required this.status,
    required this.createdAt,
    this.note,
    this.paymentMethod,
  });

  final String id;
  final String? backendId;
  final String tableNo;
  final String customerName;
  final List<OrderLine> lines;
  final TicketStatus status;
  final DateTime createdAt;
  final String? note;
  final PaymentMethod? paymentMethod;

  double get total => lines.fold(0, (sum, l) => sum + l.lineTotal);
  int get itemCount => lines.fold(0, (sum, l) => sum + l.quantity);

  OrderTicket copyWith({TicketStatus? status, PaymentMethod? paymentMethod}) =>
      OrderTicket(
        id: id,
        backendId: backendId,
        tableNo: tableNo,
        customerName: customerName,
        lines: lines,
        status: status ?? this.status,
        createdAt: createdAt,
        note: note,
        paymentMethod: paymentMethod ?? this.paymentMethod,
      );
}
