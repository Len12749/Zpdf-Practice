import { SessionSetup } from "@/components/session/session-setup";

export default function MemorizePage() {
  return (
    <SessionSetup
      title="背题"
      description="直接显示答案与解析，适合快速过题。支持顺序、逆序、乱序与错题巩固。"
      actionLabel="开始背题"
      actionHref="/memorize/session"
      showWrongMode
    />
  );
}
