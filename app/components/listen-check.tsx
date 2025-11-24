export function ListenCheck() {
  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 p-6">
      {/* Listen Section */}
      <div className="flex-1 flex flex-col">
        <h2 className="text-black text-xl font-semibold mb-4">Listen</h2>
        <div className="flex-1 relative rounded-lg overflow-hidden bg-gradient-to-br from-blue-200 via-purple-200 to-blue-300">
          {/* Wavy background pattern */}
          <div className="absolute inset-0 opacity-60">
            <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
              <path
                d="M0,200 Q100,150 200,200 T400,200 L400,400 L0,400 Z"
                fill="rgba(147, 197, 253, 0.4)"
              />
              <path
                d="M0,250 Q150,200 300,250 T400,250 L400,400 L0,400 Z"
                fill="rgba(196, 181, 253, 0.4)"
              />
              <path
                d="M0,300 Q120,250 240,300 T400,300 L400,400 L0,400 Z"
                fill="rgba(147, 197, 253, 0.3)"
              />
            </svg>
          </div>
          
          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-20 h-20 rounded-full bg-white border-2 border-purple-500 flex items-center justify-center hover:bg-purple-50 transition-colors shadow-lg">
              <svg
                className="w-8 h-8 text-purple-500 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Check Section */}
      <div className="flex-1 flex flex-col">
        <h2 className="text-black text-xl font-semibold mb-4">Check</h2>
        <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 p-6">
          {/* Text Content */}
          <div className="flex-1 mb-6">
            <p className="text-black text-base leading-relaxed">
              在古晋我们现在在equoternal的天气这equal Ternal 也没有什么啦也没有什么四个season 都
              没有啦只有说热下雨整年都是
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-black font-medium">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              Correct
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-black font-medium">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

