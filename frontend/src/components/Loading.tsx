import React from "react";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 min-h-screen">
      <div className="h-12 w-12 border-white border-4 border-t-transparent rounded-full animate-spin " />
    </div>
  );
};

export default Loading;
