import { storage } from '@/lib/storage'
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

  await storage.put(mermaidDiagramFile, mermaidDiagram)

  await (
    await mermaidCLIModule
  ).run(
    storage.getPath(mermaidDiagramFile),
    // @ts-ignore - ignoring a type for .png pattern in outputPath
    storage.getPath(repositoryContributionChartFile),
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

  return {
    mermaidDiagramFile,
    repositoryContributionChartFile,
  }
}
