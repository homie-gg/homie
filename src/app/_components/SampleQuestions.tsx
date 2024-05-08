import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/lib/ui/Accordion'

export const SampleQuestions = () => {
  return (
    <section
      id="faq"
      className="container py-24 sm:py-24 mb-24 max-w-screen-md"
    >
      <div className="z-30 flex flex-col items-start gap-1 mb-4">
        <span className="text-8xl font-bold">FAQ</span>
      </div>

      <Accordion type="single" collapsible className="w-full AccordionRoot">
        <AccordionItem value="question_1">
          <AccordionTrigger className="text-left font-bold">
            <div>Is homie secure?</div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="leading-6">
              Yes! We get that you&apos;re trusting us with your code, and take
              that responsibility very seriously.
              <br />
              <br />
              <ul className="list-disc pl-8">
                <li>
                  We do not store your code. Only summaries, and embeddings.
                </li>
                <li>Your code is not used to re-train models.</li>
                <li>
                  homie is run within our own VPC hosted on AWS in us-east-1.
                </li>
                <li>
                  We follow security best practices including not exposing the
                  database, least privelege permissions, and MFA for all
                  accounts.
                </li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="question_2">
          <AccordionTrigger className="text-left font-bold">
            <div>Is homie right for our dev team?</div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="leading-6">
              homie was built for async teams that need to ship fast.
              <br />
              <br />
              If you ever find yourself policing processes, struggling with
              context switching, or waiting for &apos;the expert&apos; to come
              online, homie can help.
              <br />
              <br />
              homie was built with 3 goals in mind:
              <ul className="list-disc pl-8">
                <li>Automate, automate, and automate</li>
                <li>No new processes for the team (they’re busy enough)</li>
                <li>Opt-in at every step (only use the features you want)</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="question_3">
          <AccordionTrigger className="text-left font-bold">
            <div>Who made homie?</div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="leading-6">
              👋 Hello, my name is Mike, and I&apos;m the creator of homie.
              I&apos;m also a freelance dev living Japan. I regularly work with
              global teams that work async and need to ship fast. Here are a
              couple links where you can find me:
              <br />
              <br />
              <ul className="list-disc pl-8">
                <li>
                  <a
                    href="https://www.upwork.com/freelancers/~0119f4693d8416340e?viewMode=1"
                    className="underline"
                  >
                    Upwork
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.freelancer.com/u/forkeverything"
                    className="underline"
                  >
                    Freelancer
                  </a>
                </li>
                <li>
                  <a href="https://wu.studio" className="underline">
                    Portfolio
                  </a>
                </li>
              </ul>
              <br />
              <br />
              I built homie for myself and I’ll continue to use, and maintain
              homie until the machines take over. Until then, I hope you enjoy
              using it too.
              <br />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="question_4">
          <AccordionTrigger className="text-left font-bold">
            <div>Is homie just another Chat GPT wrapper?</div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="leading-6">
              Nope. homie is a collection of project management automations that
              integrate with your team&apos;s existing tooling. AI is mainly
              used as a natural language interface.
              <br />
              <br />
              More interestingly, homie provides the processes, and tools that
              I&apos;ve picked up from high-performing teams over the years.
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="question_5">
          <AccordionTrigger className="text-left font-bold">
            <div>Can you tell me more?</div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="leading-6">
              Yea! Feel free to send me an email at{' '}
              <a href="mailto:mike@wu.studio" className="underline">
                mike@wu.studio
              </a>
              , and I&apos;d be happy to answer any questions you have.
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}
