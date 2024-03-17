export type PageProps<
  TParams extends Record<string, string>,
  TSearchParams extends Record<string, string>,
> = {
  params: TParams
  searchParams: TSearchParams
}
