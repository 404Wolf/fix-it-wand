/** @jsxImportSource https://esm.sh/react@19.0.0 */

export function Skeleton() {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto">
        </div>
        <p className="mt-3 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
