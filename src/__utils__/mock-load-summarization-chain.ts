import { loadSummarizationChain } from 'langchain/chains'

jest.mock('langchain/chains')

export const mockLoadSummarizationChain = loadSummarizationChain as jest.Mock
