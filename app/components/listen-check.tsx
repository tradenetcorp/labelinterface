import { ListenSection } from "./listen-section";
import { CheckSection } from "./check-section";

export function ListenCheck() {
  const transcript = "在古晋我们现在在equoternal的天气这equal Ternal 也没有什么啦也没有什么四个season 都 没有啦只有说热下雨整年都是";

  const handlePlay = () => {
    // TODO: Implement audio playback logic
    console.log("Play audio");
  };

  const handleCorrect = () => {
    // TODO: Implement correct action
    console.log("Mark as correct");
  };

  const handleEdit = () => {
    // TODO: Implement edit action
    console.log("Edit transcript");
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 p-6">
      <ListenSection onPlay={handlePlay} />
      <CheckSection
        transcript={transcript}
        onCorrect={handleCorrect}
        onEdit={handleEdit}
      />
    </div>
  );
}


