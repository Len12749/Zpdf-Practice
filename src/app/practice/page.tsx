import { SessionSetup } from "@/components/session/session-setup";

export default function PracticePage() {
  return (
    <SessionSetup
      title="刷题"
      description="手动选择选项后提交。答错自动记入错题本并累计错误次数。"
      actionLabel="开始刷题"
      actionHref="/practice/session"
      showWrongMode
    />
  );
}
