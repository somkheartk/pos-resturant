class StaffUser {
  const StaffUser({
    required this.id,
    required this.username,
    required this.displayName,
    required this.role,
    required this.email,
  });

  final String id;
  final String username;
  final String displayName;
  final String role;
  final String email;

  String get initials =>
      displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U';
}
