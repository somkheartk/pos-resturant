import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/api_config.dart';
import '../models/enums.dart';
import '../models/menu_product.dart';
import '../models/order_line.dart';
import '../models/order_ticket.dart';
import 'api_exception.dart';

class OrdersApi {
  const OrdersApi({http.Client? client}) : _client = client;

  final http.Client? _client;

  Future<List<OrderTicket>> listOrders({required String accessToken}) async {
    final client = _client ?? http.Client();
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/orders');
      final response = await client.get(uri, headers: _headers(accessToken));
      final json = _decodeJson(response.body);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException(
          _readErrorMessage(json) ?? 'Load orders failed',
          statusCode: response.statusCode,
        );
      }

      if (json is! List) return const [];
      return json
          .whereType<Map>()
          .map((item) => _ticketFromJson(item.cast<String, dynamic>()))
          .toList();
    } finally {
      if (_client == null) client.close();
    }
  }

  Future<OrderTicket> createOrder({
    required String accessToken,
    required String tableNo,
    required String customerName,
    required List<OrderLine> lines,
    String? note,
  }) async {
    final client = _client ?? http.Client();
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/orders');
      final payload = {
        'customerName': customerName,
        'branchName': tableNo,
        'status': TicketStatus.newOrder.name,
        'paymentMethod': '',
        'totalAmount': lines.fold<double>(
          0,
          (sum, line) => sum + line.lineTotal,
        ),
        'itemCount': lines.fold<int>(0, (sum, line) => sum + line.quantity),
        'note': note,
        'items': lines
            .map(
              (line) => {
                'productId': line.product.id,
                'productName': line.product.name,
                'quantity': line.quantity,
                'unitPrice': line.product.price,
              },
            )
            .toList(),
      };

      final response = await client.post(
        uri,
        headers: _headers(accessToken),
        body: jsonEncode(payload),
      );

      final json = _decodeJson(response.body);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException(
          _readErrorMessage(json) ?? 'Create order failed',
          statusCode: response.statusCode,
        );
      }

      if (json is! Map<String, dynamic>) {
        throw ApiException('Invalid create order response');
      }
      return _ticketFromJson(json);
    } finally {
      if (_client == null) client.close();
    }
  }

  Future<OrderTicket> updateOrder({
    required String accessToken,
    required String orderId,
    required TicketStatus status,
    PaymentMethod? paymentMethod,
  }) async {
    final client = _client ?? http.Client();
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/orders/$orderId');
      final payload = {
        'status': status.name,
        if (paymentMethod != null) 'paymentMethod': paymentMethod.name,
      };

      final response = await client.patch(
        uri,
        headers: _headers(accessToken),
        body: jsonEncode(payload),
      );

      final json = _decodeJson(response.body);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException(
          _readErrorMessage(json) ?? 'Update order failed',
          statusCode: response.statusCode,
        );
      }

      if (json is! Map<String, dynamic>) {
        throw ApiException('Invalid update order response');
      }
      return _ticketFromJson(json);
    } finally {
      if (_client == null) client.close();
    }
  }

  Map<String, String> _headers(String token) => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };

  dynamic _decodeJson(String source) {
    if (source.isEmpty) return null;
    return jsonDecode(source);
  }

  String? _readErrorMessage(dynamic json) {
    if (json is! Map<String, dynamic>) return null;
    final message = json['message'];
    if (message is String && message.isNotEmpty) return message;
    if (message is List && message.isNotEmpty) return message.first.toString();
    return null;
  }

  OrderTicket _ticketFromJson(Map<String, dynamic> json) {
    final rawItems = (json['items'] as List?) ?? const [];
    final lines = rawItems.whereType<Map>().map((item) {
      final data = item.cast<String, dynamic>();
      final name = (data['productName'] ?? 'Unknown').toString();
      final productId = (data['productId'] ?? name).toString();
      final unitPrice = _toDouble(data['unitPrice']);
      final quantity = _toInt(data['quantity']);
      return OrderLine(
        product: MenuProduct(id: productId, name: name, price: unitPrice),
        quantity: quantity,
      );
    }).toList();

    final backendId = (json['_id'] ?? '').toString();
    final orderNo = (json['orderNo'] ?? '').toString();

    return OrderTicket(
      id: orderNo.isNotEmpty
          ? orderNo
          : (backendId.isNotEmpty ? backendId : 'N/A'),
      backendId: backendId.isNotEmpty ? backendId : null,
      tableNo: (json['branchName'] ?? '-').toString(),
      customerName: (json['customerName'] ?? '-').toString(),
      lines: lines,
      status: _statusFromApi((json['status'] ?? '').toString()),
      createdAt: _toDateTime(json['createdAt']),
      note: (json['note'] ?? '').toString().trim().isEmpty
          ? null
          : json['note'].toString(),
      paymentMethod: _paymentMethodFromApi(
        (json['paymentMethod'] ?? '').toString(),
      ),
    );
  }

  DateTime _toDateTime(dynamic value) {
    if (value is String) {
      return DateTime.tryParse(value) ?? DateTime.now();
    }
    return DateTime.now();
  }

  int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse('$value') ?? 0;
  }

  double _toDouble(dynamic value) {
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse('$value') ?? 0;
  }

  TicketStatus _statusFromApi(String raw) {
    final value = raw.toLowerCase();
    switch (value) {
      case 'neworder':
      case 'pending':
        return TicketStatus.newOrder;
      case 'preparing':
        return TicketStatus.preparing;
      case 'ready':
        return TicketStatus.ready;
      case 'served':
      case 'shipped':
        return TicketStatus.served;
      case 'paid':
        return TicketStatus.paid;
      case 'cancelled':
        return TicketStatus.cancelled;
      default:
        return TicketStatus.newOrder;
    }
  }

  PaymentMethod? _paymentMethodFromApi(String raw) {
    final value = raw.toLowerCase();
    switch (value) {
      case 'cash':
        return PaymentMethod.cash;
      case 'transfer':
        return PaymentMethod.transfer;
      case 'qr':
      case 'qrcode':
        return PaymentMethod.qr;
      default:
        return null;
    }
  }
}
