import { useState } from "react";
import { useFetcher } from "react-router";

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
}

interface UserRowProps {
  user: User;
  isCurrentUser: boolean;
}

export function UserRow({ user, isCurrentUser }: UserRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const fetcher = useFetcher();

  const handleAction = (intent: string, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    fetcher.submit(
      { intent, id: String(user.id) },
      { method: "post" }
    );
  };

  if (isEditing) {
    return (
      <tr>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          {user.email}
          {isCurrentUser && <span className="ml-2 text-xs text-gray-500">(you)</span>}
        </td>
        <td colSpan={4} className="px-6 py-4">
          <fetcher.Form method="post" className="flex items-center gap-4">
            <input type="hidden" name="intent" value="update" />
            <input type="hidden" name="id" value={user.id} />
            <input
              type="text"
              name="name"
              defaultValue={user.name || ""}
              placeholder="Name"
              className="px-2 py-1 border border-gray-300 rounded text-black text-sm w-32"
            />
            <select
              name="role"
              defaultValue={user.role}
              className="px-2 py-1 border border-gray-300 rounded text-black text-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="active"
                value="true"
                defaultChecked={user.active}
                className="w-4 h-4"
              />
              <span className="text-sm text-black">Active</span>
            </label>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-black rounded text-sm"
            >
              Cancel
            </button>
          </fetcher.Form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
        {user.email}
        {isCurrentUser && <span className="ml-2 text-xs text-gray-500">(you)</span>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
        {user.name || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
        <span className={`px-2 py-1 rounded text-xs ${
          user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
        }`}>
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={`px-2 py-1 rounded text-xs ${
          user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {user.active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
        <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:underline">
          Edit
        </button>
        
        {user.active ? (
          <button
            onClick={() => !isCurrentUser && handleAction("deactivate", "Deactivate this user?")}
            className={`text-orange-600 hover:underline ${isCurrentUser ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isCurrentUser}
          >
            Deactivate
          </button>
        ) : (
          <button
            onClick={() => handleAction("reactivate", "Reactivate this user?")}
            className="text-green-600 hover:underline"
          >
            Reactivate
          </button>
        )}

        <button
          onClick={() => !isCurrentUser && handleAction("delete", "Permanently delete this user? This cannot be undone.")}
          className={`text-red-600 hover:underline ${isCurrentUser ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={isCurrentUser}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

