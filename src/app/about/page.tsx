import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";

export default function AboutPage() {
  return (
    <div>
      <section className="mx-auto max-w-[900px] px-4 py-12 md:px-6 md:py-16">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          关于我们
        </h1>
        <p className="mt-3 text-base font-medium text-accent">
          北京智通明识科技有限公司
        </p>

        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-foreground/90">
          <p>
            北京智通明识科技有限公司成立于 2025
            年，是一家依托北京理工大学孵化器支持创立的科技型公司，并得到北京理工大学经济学院多位老师及相关专业人员的支持与指导。公司致力于人工智能技术产品的应用开发，推动科研成果与实际需求相结合，逐步形成「产学研用」一体化的成果转化机制。
          </p>
          <p>
            目前，公司核心业务涵盖智能文档处理、OCR
            文字识别、多语言机器翻译、PDF
            结构化解析、通用人工智能模型集成接入，同时面向各类机构提供定制化企业技术服务。自研
            OCR
            识别、多语言翻译系列产品已广泛应用于国内多家国有企业、民营企事业单位及高校科研课题组，具备标杆项目落地经验，代表合作客户有华润医药集团有限公司。
          </p>
          <p>
            公司团队成员来自北京理工大学、北京大学、上海交通大学、哈尔滨工业大学、大连理工大学、北京外国语大学等高校，同时也吸引了中国人民大学、香港城市大学等高校的学生参与交流和实习。团队成员的专业背景涵盖经济学、数学、计算机科学、物理学和外语翻译等领域，具备人工智能产品开发、数据处理、成本控制和实际项目服务能力。部分团队成员的研究成果曾发表于
            CSSCI《科学学研究》、SCI《Frontiers of Physics》等期刊。
          </p>
          <p>
            我们热忱欢迎各界人才加盟、伙伴洽谈合作，同时承接各类计算机相关开发项目。
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-[900px] px-4 py-12 md:px-6 md:py-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            我们的其他产品
          </h2>

          <article className="mt-8 overflow-hidden rounded-2xl border border-border bg-background">
            <div className="flex items-center justify-center bg-surface-muted px-2 py-2 sm:px-4 sm:py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/product-zpdf.webp"
                alt="Zpdf 智能文档处理产品概念图"
                className="h-auto w-full object-contain"
              />
            </div>
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-semibold">Zpdf</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Zpdf 是公司自研的智能 PDF
                处理工具平台。依托自研文档解析、OCR 识别与 AI
                理解技术，支持 PDF
                结构化提取、文档格式转换、文本智能识别、内容解析整理等多项功能，可高效处理各类扫描件
                PDF、原生 PDF
                文件。面向企业、科研机构与个人用户提供稳定、高效的文档自动化解决方案。
              </p>
              <a
                href="https://zhiyipdf.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block"
              >
                <Button variant="outline" icon={<ArrowSquareOut size={18} />}>
                  访问 zhiyipdf.com
                </Button>
              </a>
            </div>
          </article>

          <div className="mt-10 rounded-2xl border border-border bg-surface-muted p-6 md:p-8">
            <h3 className="text-lg font-semibold">联系与合作</h3>
            <p className="mt-2 text-sm text-muted">
              注册时填写的联系邮箱用于我们与您取得联系。如需商务合作或项目开发，欢迎通过产品内预留邮箱与我们沟通。
            </p>
            <Link href="/register" className="mt-4 inline-block">
              <Button>注册体验 Zpdf_practice</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
