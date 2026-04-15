enum TicketStatus { newOrder, preparing, ready, served, paid, cancelled }

enum PaymentMethod { cash, transfer, qr }

extension PaymentMethodLabel on PaymentMethod {
  String get label {
    switch (this) {
      case PaymentMethod.cash:
        return 'เงินสด';
      case PaymentMethod.transfer:
        return 'โอนเงิน';
      case PaymentMethod.qr:
        return 'QR Payment';
    }
  }
}
