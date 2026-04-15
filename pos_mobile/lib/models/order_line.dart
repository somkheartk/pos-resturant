import 'menu_product.dart';

class OrderLine {
  const OrderLine({required this.product, required this.quantity});

  final MenuProduct product;
  final int quantity;

  double get lineTotal => product.price * quantity;
}
