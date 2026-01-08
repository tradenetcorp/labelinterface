import { useFetcher } from "react-router";

export function CreateLabelForm() {
  const fetcher = useFetcher();

  return (
    <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg">
      <h2 className="text-lg font-semibold mb-4 text-black">Create New Label</h2>
      <fetcher.Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value="create" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="e.g., Male, Female"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label htmlFor="shortcut" className="block text-sm font-medium text-black mb-2">
              Keyboard Shortcut
            </label>
            <input
              type="text"
              id="shortcut"
              name="shortcut"
              maxLength={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="e.g., m"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="active" value="true" defaultChecked className="w-4 h-4" />
              <span className="text-sm text-black">Active</span>
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Create Label
        </button>
      </fetcher.Form>
    </div>
  );
}
