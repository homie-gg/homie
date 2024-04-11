import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/lib/ui/Accordion'

export const SampleQuestions = () => {
  return (
    <section id="faq" className="container py-24 sm:py-32">
      <div className="z-30 flex flex-col items-start gap-1 mb-4">
        <span className="bg-purple-500 bg-clip-text text-sm font-semibold text-transparent">
          Example Questions
        </span>
        <span className="text-xl font-medium">
          Real answers provided by Void&apos;s AI
        </span>
      </div>

      <Accordion type="single" collapsible className="w-full AccordionRoot">
        <AccordionItem value="question_1">
          <AccordionTrigger className="text-left">
            <div>
              <strong>Which</strong> PR added queue dashboards?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div>
              The queue dashboards were added in the Pull Request titled
              &quot;feat: add bullmq dashboard&quot;. The URL for this Pull
              Request is https://github.com/void-pm/void/pull/77.
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="question_2">
          <AccordionTrigger className="text-left">
            <div>
              <strong>What</strong> caused the Github infinite PR loop?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div>
              The Github infinite PR loop was caused by the
              `handleGenerateOpenPullRequestSummary function. This was fixed by
              replacing the existing summary key in the pull request body. The
              fix was contributed by mikewuu in a pull request titled
              &quot;fix(Github): improve generated summary&quot;
              (https://github.com/void-pm/void/pull/81).
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="question_3">
          <AccordionTrigger className="text-left">
            <div>
              <strong>Was</strong> the navbar updated to allow feature requests?
              If so, <strong>when</strong> was it updated?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div>
              Yes, the navbar was updated to allow feature requests. The update
              was made on April 9, 2024. The change allows users to easily
              access the feature request page from the navigation bar. The
              relevant code snippet is:
              <pre>
                {`
jsx
<Link href="https://voidpm.nolt.io/roadmap">
  <DropdownMenuItem>Request Feature</DropdownMenuItem>
</Link>
                  `}
              </pre>
              This code change replaced the &quot;Settings&quot; dropdown menu
              item with &quot;Request Feature&quot; and added a new link for
              feature requests in the navigation bar. The Pull Request for this
              change is titled &quot;feat(Nav): add feature request link&quot;
              and can be found at https://github.com/void-pm/void/pull/100.
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="question_4">
          <AccordionTrigger className="text-left">
            <div>
              <strong>Who</strong> worked on analytics?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div>The analytics work was done by mikewuu.</div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="question_5">
          <AccordionTrigger className="text-left">
            <div>
              <strong>How</strong> do you add a queued task?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div>
              To add a queued task, you need to import the defaultQueue from the
              relevant module. Then, you can use the add method on defaultQueue
              to add a task. The task is represented as a string identifier and
              an object containing the necessary data for the task. Here is an
              example:
              <br />
              <br />
              <pre>
                {`
import { defaultQueue } from '@/queue/default-queue'
await defaultQueue.add('answer_slack_question', {
  team_id,
  channel_id: event.channel,
  target_message_ts: event.ts,
  text: event.text,
})
        `}
              </pre>
              In this example, a task is added to the queue to answer a slack
              question. The task data includes the team id, channel id, target
              message timestamp, and the text of the event.
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="question_6">
          <AccordionTrigger className="text-left">
            <div>
              <strong>Why</strong> did we change the embedded metadata?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div>
              The embedded metadata was changed to fix an issue with embedding
              missing text. Specifically, the &apos;text&apos; property was
              removed from the embed_metadata object in the
              saveMergedPullRequest function and added to the metadata object in
              the embedGithubPullRequest function. This change was made as part
              of the Pull Request titled &quot;fix(PR): embedding missing
              text&quot; (URL: https://github.com/void-pm/void/pull/104),
              contributed by mikewuu.
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}
