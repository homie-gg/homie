interface AWSConfig {
  region: string
}

export const aws: AWSConfig = {
  region: process.env.AWS_REGION ?? 'us-east-1',
}
