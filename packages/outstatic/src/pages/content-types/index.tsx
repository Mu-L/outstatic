import { yupResolver } from '@hookform/resolvers/yup'
import { useRouter } from 'next/router'
import { plural } from 'pluralize'
import { useContext, useEffect, useState } from 'react'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import { convert } from 'url-slug'
import * as yup from 'yup'
import { AdminLayout, Input } from '../../components'
import { OutstaticContext } from '../../context'
import { useCreateCommitMutation } from '../../graphql/generated'
import { ContentType } from '../../types'
import { contentTypeCommitInput } from '../../utils/contentTypeCommitInput'
import useNavigationLock from '../../utils/useNavigationLock'
import useOid from '../../utils/useOid'

export default function ContentTypes() {
  const { pages, contentPath, session, repoSlug, addPage } = useContext(
    OutstaticContext
  )
  const router = useRouter()
  const [createCommit] = useCreateCommitMutation()
  const fetchOid = useOid()
  const [hasChanges, setHasChanges] = useState(false)
  const [pluralized, setPlural] = useState('')
  const pagesRegex = new RegExp(`^(?!${pages.join('$|')}$)`, 'i')
  const createContentType: yup.SchemaOf<ContentType> = yup.object().shape({
    name: yup
      .string()
      .matches(pagesRegex, `The word ${pluralized} is reserved`)
      .matches(/^[aA-zZ\s]+$/, 'Only alphabets are allowed for this field ')
      .required('Content name is required')
  })
  const [loading, setLoading] = useState(false)
  const methods = useForm<ContentType>({
    resolver: yupResolver(createContentType)
  })

  const onSubmit: SubmitHandler<ContentType> = async ({
    name
  }: ContentType) => {
    setLoading(true)
    setHasChanges(false)

    try {
      const oid = await fetchOid()
      const owner = session?.user?.name || ''
      const contentType = convert(name, { dictionary: { "'": '' } })
      const commitInput = contentTypeCommitInput({
        owner,
        oid,
        repoSlug,
        contentPath,
        contentType
      })

      const created = await createCommit({ variables: commitInput })
      if (created) {
        addPage(contentType)
        setLoading(false)
        router.push(`/outstatic/${contentType}`)
      }
    } catch (error) {
      // TODO: Better error treatment
      setLoading(false)
      setHasChanges(false)
      console.log({ error })
    }
  }

  useEffect(() => {
    const subscription = methods.watch(() => setHasChanges(true))

    return () => subscription.unsubscribe()
  }, [methods])

  // Ask for confirmation before leaving page if changes were made.
  useNavigationLock(hasChanges)

  return (
    <FormProvider {...methods}>
      <AdminLayout>
        <div className="mb-8 flex h-12 items-center">
          <h1 className="mr-12 text-2xl">Create Content Type</h1>
        </div>
        <form
          className="max-w-5xl w-full flex mb-4 items-start"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <Input
            label="Content Type Name"
            id="name"
            inputSize="medium"
            className="w-full max-w-sm md:w-80"
            placeholder="Ex: Posts"
            type="text"
            helperText="Use the plural form of the content type name, ex: Docs"
            validation={{
              onChange: e => {
                setPlural(plural(e.target.value))
              },
              onBlur: e => {
                methods.setValue('name', plural(e.target.value))
              }
            }}
          />
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="flex rounded-lg border border-gray-600 bg-gray-800 px-5 py-2 text-sm font-medium text-white hover:border-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-700 disabled:cursor-not-allowed disabled:bg-gray-600 ml-2 mt-7 mb-5"
          >
            {loading ? (
              <>
                <svg
                  className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving
              </>
            ) : (
              'Save'
            )}
          </button>
        </form>
        {pluralized && (
          <div
            className="p-4 mb-4 text-sm max-w-xl text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-200 dark:text-blue-800"
            role="alert"
          >
            The content will appear as{' '}
            <span className="font-semibold capitalize">{pluralized}</span> on
            the sidebar.
          </div>
        )}
      </AdminLayout>
    </FormProvider>
  )
}
