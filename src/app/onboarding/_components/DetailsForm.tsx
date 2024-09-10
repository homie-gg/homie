import styles from './DetailsForm.module.scss'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/lib/ui/HomieForm'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { Input } from '@/lib/ui/HomieInput'
import Select from '@/lib/ui/HomieSelect'
import { Textarea } from '@/lib/ui/HomieTextarea'
import { Button } from '@/lib/ui/HomieButton'
import ArrowRightIcon from '@/app/onboarding/_components/ArrowRightIcon'

export const teamSizes = ['1-9', '10-99', '100+']

export const standOutFeatures = ['feature 1', 'feature 2', 'feature 3']

export const referralSources = ['source 1', 'source 2', 'source 3']

const details = z.object({
  name: z.string({ required_error: 'Please enter a name' }),
  standOutFeatures: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    }),
    { required_error: 'Please select at least one' },
  ),
  teamSize: z
    .object(
      {
        value: z.string(),
        label: z.string(),
      },
      {
        required_error: 'Please select a team size',
      },
    )
    .required(),
  referralSource: z.object(
    {
      value: z.string(),
      label: z.string(),
    },
    { required_error: 'Please select one' },
  ),
  expectations: z.string(),
})

type Details = z.infer<typeof details>

export default function DetailsForm() {
  const form = useForm<Details>({
    resolver: zodResolver(details),
    mode: 'onSubmit',
    shouldFocusError: false,
  })

  const onFormSubmit = async (value: z.infer<typeof details>) => {
    console.log(value)
  }

  const onFormError = (errors: any) => {
    // eslint-disable-next-line no-console
    console.error('error: ', errors)
  }

  return (
    <Form {...form}>
      <form
        className={styles.root}
        onSubmit={form.handleSubmit(onFormSubmit, onFormError)}
      >
        <div className={styles['form-fields']}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Mike Wu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="teamSize"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>How big is your team?</FormLabel>
                <FormControl>
                  <Select
                    options={teamSizes.map((size) => ({
                      value: size,
                      label: `${size[0].toUpperCase()}${size.slice(1)}`,
                    }))}
                    placeholder="Select team size"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="standOutFeatures"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>What features stood out?</FormLabel>
                <FormControl>
                  <Select
                    isMulti
                    options={standOutFeatures.map((feature) => ({
                      value: feature,
                      label: `${feature[0].toUpperCase()}${feature.slice(1)}`,
                    }))}
                    placeholder="Select features"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="referralSource"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>How did you hear about us?</FormLabel>
                <FormControl>
                  <Select
                    options={referralSources.map((source) => ({
                      value: source,
                      label: `${source[0].toUpperCase()}${source.slice(1)}`,
                    }))}
                    placeholder="Select an option"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expectations"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>What are you hoping Homie will improve?</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter a description..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={form.formState.isSubmitting}
          className={styles.submit}
        >
          <span>Continue to set up</span>
          <span>
            <ArrowRightIcon />
          </span>
        </Button>
      </form>
    </Form>
  )
}
