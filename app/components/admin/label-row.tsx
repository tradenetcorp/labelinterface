import { useState } from "react";
import { useFetcher } from "react-router";

export interface Label {
  id: number;
  name: string;
  description: string | null;
  shortcut: string | null;
  active: boolean;
  _count: {
    transcripts: number;
  };
}

interface LabelRowProps {
  label: Label;
}

export function LabelRow({ label }: LabelRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const fetcher = useFetcher();

  const handleDelete = () => {
    if (label._count.transcripts > 0) {
      if (!confirm(`This label is used by ${label._count.transcripts} transcript(s). Delete anyway?`)) {
        return;
      }
    } else if (!confirm("Delete this label?")) {
      return;
    }
    fetcher.submit({ intent: "delete", id: String(label.id) }, { method: "post" });
  };

  if (isEditing) {
    return (
      <tr>
        <td colSpan={6} className="px-6 py-4">
          <fetcher.Form method="post" className="flex items-center gap-4 flex-wrap">
            <input type="hidden" name="intent" value="update" />
            <input type="hidden" name="id" value={label.id} />
            <input
              type="text"
              name="name"
              defaultValue={label.name}
              required
              placeholder="Name"
              className="px-2 py-1 border border-gray-300 rounded text-black text-sm w-32"
            />
            <input
              type="text"
              name="description"
              defaultValue={label.description || ""}
              placeholder="Description"
              className="px-2 py-1 border border-gray-300 rounded text-black text-sm w-48"
            />
            <input
              type="text"
              name="shortcut"
              defaultValue={label.shortcut || ""}
              maxLength={1}
              placeholder="Key"
              className="px-2 py-1 border border-gray-300 rounded text-black text-sm w-16"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="active"
                value="true"
                defaultChecked={label.active}
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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-medium">
        {label.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {label.description || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
        {label.shortcut ? (
          <span className="px-2 py-1 bg-gray-100 rounded font-mono">
            Alt+{label.shortcut.toUpperCase()}
          </span>
        ) : "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {label._count.transcripts}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={`px-2 py-1 rounded text-xs ${
          label.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {label.active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
        <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:underline">
          Edit
        </button>
        <button onClick={handleDelete} className="text-red-600 hover:underline">
          Delete
        </button>
      </td>
    </tr>
  );
}
