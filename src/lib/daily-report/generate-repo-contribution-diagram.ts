import { config } from '@/config'
import { storage } from '@/lib/storage'
import { getStorage } from '@/lib/storage/get-storage'
import { v4 as uuid } from 'uuid'

const mermaidCLIModule = import('@mermaid-js/mermaid-cli')

interface GenerateRepositoryContributionDiagramParams {
  mermaidDiagram: string
}

/**
 * Generates a pie chart of repository contributions (num. PRs)
 * from a given mermaid diagram markdown.
 */
export async function generateRepositoryContributionDiagram(
  params: GenerateRepositoryContributionDiagramParams,
) {
  const { mermaidDiagram } = params

  const id = uuid()
  const mermaidDiagramFile = `repository_contribution_${id}.mmd`
  const repositoryContributionChartFile = `repository_contribution_${id}.png`

  const localStorage = getStorage({ driver: 'local' })

  await localStorage.put(mermaidDiagramFile, mermaidDiagram)

  // Generate image file locally
  await (
    await mermaidCLIModule
  ).run(
    localStorage.getPath(mermaidDiagramFile),
    // @ts-ignore - ignoring a type for .png pattern in outputPath
    localStorage.getPath(repositoryContributionChartFile),
    {
      outputFormat: 'png',
      parseMMDOptions: {
        viewport: {
          width: 2048,
          height: 2048,
        },
      },
      puppeteerConfig: {
        headless: 'new',
        executablePath: process.env.CHROME_BIN
          ? process.env.CHROME_BIN
          : undefined,
        args: ['--no-sandbox'], // I couldn't figure out how to run this in a container without this
      },
    },
  )

  if (config.storage.driver === 's3') {
    const contents = await localStorage.read(repositoryContributionChartFile)

    const remoteFile = `daily_report/repository_contributions/${repositoryContributionChartFile}`
    await storage.put(remoteFile, contents)

    await localStorage.delete(mermaidDiagramFile)
    await localStorage.delete(repositoryContributionChartFile)

    return remoteFile
  }

  await localStorage.delete(mermaidDiagramFile)
  return repositoryContributionChartFile
}
