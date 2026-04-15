import {
  normalizeRole,
  permissionGroups,
  permissionState,
  roleCatalog,
  roleDefaultPermissions,
  type UserRow,
} from "@/components/admin/access-control.types";

type AccessControlRowProps = {
  row: UserRow;
  isSaving: boolean;
  onUpdateRow: (id: string, next: Partial<UserRow>) => void;
  onApplyRoleDefaults: (row: UserRow) => void;
  onTogglePermission: (row: UserRow, permission: string) => void;
  onSave: (row: UserRow) => void;
};

export function AccessControlRow({
  row,
  isSaving,
  onUpdateRow,
  onApplyRoleDefaults,
  onTogglePermission,
  onSave,
}: AccessControlRowProps) {
  return (
    <tr className="border-b border-slate-100 align-top text-slate-700">
      <td className="py-3">
        <p className="font-medium">{row.name}</p>
        <p className="text-xs text-slate-500">{row.email}</p>
      </td>
      <td className="py-3">
        <div className="w-40">
          <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-slate-500">Role</p>
          <div className="space-y-1 rounded-lg border border-slate-200 bg-white px-2 py-2">
            {roleCatalog.map((roleOption) => {
              const selectedRole = normalizeRole(row.role);
              const checked = selectedRole === roleOption;

              return (
                <label key={roleOption} className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      onUpdateRow(row._id, {
                        role: roleOption,
                        permissions: [...roleDefaultPermissions[roleOption]],
                      });
                    }}
                  />
                  <span className="uppercase">{roleOption}</span>
                </label>
              );
            })}
          </div>
          <button
            type="button"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100"
            onClick={() => onApplyRoleDefaults(row)}
          >
            Apply Role Defaults
          </button>
        </div>
      </td>
      <td className="py-3">
        <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">Permissions</div>
        <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">Inherited</span>
          <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-teal-700">Added</span>
          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">Removed</span>
        </div>

        <div className="space-y-3">
          {permissionGroups.map((group) => {
            const role = normalizeRole(row.role);
            const currentPermissions = row.permissions ?? [];

            return (
              <div key={group.label}>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.permissions.map((permission) => {
                    const state = permissionState(role, currentPermissions, permission);
                    return (
                      <button
                        key={permission}
                        type="button"
                        onClick={() => onTogglePermission(row, permission)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          state === "inherited"
                            ? "border-slate-200 bg-slate-50 text-slate-700"
                            : state === "added"
                              ? "border-teal-200 bg-teal-50 text-teal-700"
                              : state === "removed"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {permission}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </td>
      <td className="py-3 text-right">
        <button
          type="button"
          className="gradient-brand rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
          disabled={isSaving}
          onClick={() => onSave(row)}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  );
}