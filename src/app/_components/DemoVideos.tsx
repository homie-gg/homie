import MuxPlayerClient from '@/lib/ui/MuxPlayerClient'
import OnScrollRevealer from '@/lib/ui/OnScrollRevealer'

interface DemoVideosProps {}

export default function DemoVideos(props: DemoVideosProps) {
  const {} = props

  return (
    <>
      <OnScrollRevealer>
        <div className="container grid grid-cols-1 lg:grid-cols-2 place-items-center text-center h-screen">
          <div>
            <h3 className="text-3xl lg:text-4xl font-bold mb-2">
              Add the GitHub app
            </h3>
            <p className="lg:text-lg mb-4 lg:mb-0">
              homie ingests each Pull Request. <br />
              Learns about your project.
            </p>
            <div className="w-full lg:hidden">
              <MuxPlayerClient
                streamType="on-demand"
                playbackId="Wm4cegqcaFdu8fNTlQw1D7EF02tRNMPl6Z5fHe9PeFrE"
                metadataVideoTitle="homie in 20secs"
                primaryColor="#FFFFFF"
                secondaryColor="#000000"
                autoPlay
                muted
                loop
                style={{
                  //@ts-ignore
                  '--controls': 'none',
                }}
              />
            </div>
          </div>
          <div className="w-full hidden lg:block">
            <MuxPlayerClient
              streamType="on-demand"
              playbackId="Wm4cegqcaFdu8fNTlQw1D7EF02tRNMPl6Z5fHe9PeFrE"
              metadataVideoTitle="homie in 20secs"
              primaryColor="#FFFFFF"
              secondaryColor="#000000"
              autoPlay
              muted
              loop
              style={{
                //@ts-ignore
                '--controls': 'none',
              }}
            />
          </div>
        </div>
      </OnScrollRevealer>

      <OnScrollRevealer>
        <div className="container grid grid-cols-1 lg:grid-cols-2 place-items-center text-center h-screen">
          <div className="hidden lg:block w-full">
            <MuxPlayerClient
              streamType="on-demand"
              playbackId="aKIXkEmoB6N2HDgsVGfsmI7aZdEsNbsRp4gV02Q2CQVU"
              metadataVideoTitle="homie in 20secs"
              primaryColor="#FFFFFF"
              secondaryColor="#000000"
              autoPlay
              muted
              loop
              style={{
                //@ts-ignore
                '--controls': 'none',
              }}
            />
          </div>
          <div>
            <h3 className="text-3xl lg:text-4xl font-bold mb-2">
              Add the Slack app
            </h3>
            <p className="lg:text-lg mb-4 lg:mb-0">
              homie becomes a part of your team.
            </p>
            <div className="lg:hidden w-full">
              <MuxPlayerClient
                streamType="on-demand"
                playbackId="aKIXkEmoB6N2HDgsVGfsmI7aZdEsNbsRp4gV02Q2CQVU"
                metadataVideoTitle="homie in 20secs"
                primaryColor="#FFFFFF"
                secondaryColor="#000000"
                autoPlay
                muted
                loop
                style={{
                  //@ts-ignore
                  '--controls': 'none',
                }}
              />
            </div>
          </div>
        </div>
      </OnScrollRevealer>

      <OnScrollRevealer>
        <div className="container grid grid-cols-1 lg:grid-cols-2 place-items-center text-center h-screen">
          <div>
            <h3 className="text-3xl lg:text-4xl font-bold mb-2">
              Ask homie questions
            </h3>
            <p className="lg:text-lg mb-4 lg:mb-0">
              Has that bug already been fixed yet? How do we add a queued job?{' '}
              <br />
              Why did it timeout? Who knows how to do this?
            </p>
            <div className="lg:hidden w-full">
              <MuxPlayerClient
                streamType="on-demand"
                playbackId="aKIXkEmoB6N2HDgsVGfsmI7aZdEsNbsRp4gV02Q2CQVU"
                metadataVideoTitle="homie in 20secs"
                primaryColor="#FFFFFF"
                secondaryColor="#000000"
                autoPlay
                muted
                loop
                style={{
                  //@ts-ignore
                  '--controls': 'none',
                }}
              />
            </div>
          </div>
          <div className="w-full hidden lg:block">
            <MuxPlayerClient
              streamType="on-demand"
              playbackId="KhMrdgT6yJ2c01qyjDvgiKmq9B026uG02Jul8CSpVjS2lo"
              metadataVideoTitle="homie in 20secs"
              primaryColor="#FFFFFF"
              secondaryColor="#000000"
              autoPlay
              muted
              loop
              style={{
                //@ts-ignore
                '--controls': 'none',
              }}
            />
          </div>
        </div>
      </OnScrollRevealer>

      <OnScrollRevealer>
        <div className="container grid grid-cols-1 lg:grid-cols-2 place-items-center text-center h-screen">
          <div className="hidden lg:block w-full">
            <MuxPlayerClient
              streamType="on-demand"
              playbackId="B3xjvJeEGBmoFRwk6UrLNryoUWz4xTMBlD1hGwBW02gY"
              metadataVideoTitle="homie in 20secs"
              primaryColor="#FFFFFF"
              secondaryColor="#000000"
              autoPlay
              muted
              loop
              style={{
                //@ts-ignore
                '--controls': 'none',
              }}
            />
          </div>
          <div>
            <h3 className="text-3xl lg:text-4xl font-bold mb-2">
              Let homie help
            </h3>
            <p className="lg:text-lg mb-4 lg:mb-0">
              Quickly summarize Slack threads to issues. <br />
              Generate PR summaries. Collect list of merged PRs.
            </p>
            <div className="lg:hidden w-full">
              <MuxPlayerClient
                streamType="on-demand"
                playbackId="B3xjvJeEGBmoFRwk6UrLNryoUWz4xTMBlD1hGwBW02gY"
                metadataVideoTitle="homie in 20secs"
                primaryColor="#FFFFFF"
                secondaryColor="#000000"
                autoPlay
                muted
                loop
                style={{
                  //@ts-ignore
                  '--controls': 'none',
                }}
              />
            </div>
          </div>
        </div>
      </OnScrollRevealer>
    </>
  )
}
