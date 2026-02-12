import React from "react";
import HumanViewer from "./modelPage";

const ModelPage = () => {
  return (
    <div className="bg-neutral-900 p-2 h-full w-full relative flex ">
      <div className="w-[400px] h-full =">
        {/* buttons here */}
      </div>
      <div className="flex-1">
        <HumanViewer />
      </div>
      <div className="w-[400px] h-full "></div>

      <div className="absolute top-40 left-1/2 bg-white/30 border border-white/10 p-3 rounded-lg">
      <h1>These are shoulders</h1></div>
    </div>
  );
};

export default ModelPage;
