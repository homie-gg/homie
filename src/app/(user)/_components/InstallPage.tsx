import { Button } from '@/lib/ui/Button'

export default function InstallPage() {
  return (
    <div className="text-center mt-6">
      <h2 className="text-3xl font-bold tracking-tight">Welcome to Void.</h2>
      <p className="text-muted-foreground text-xs">
        (we hope you&apos;ll like it here)
      </p>
      <p className="my-3">
        Click the button below to got to install the Github App, and link your
        repositories.
      </p>
      <a
        href={`https://github.com/apps/${process.env.GITHUB_APP_NAME}/installations/new`}
      >
        <Button>Install Github App</Button>
      </a>
    </div>
  )
}
