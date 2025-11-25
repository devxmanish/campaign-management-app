import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle, FileText } from 'lucide-react'
import { campaignApi, responseApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

interface Question {
  id: string
  questionText: string
  type: string
  options?: { choices?: string[] }
  required: boolean
  order: number
}

interface Campaign {
  id: string
  title: string
  description: string | null
  status: string
  questions: Question[]
}

export default function PublicForm() {
  const { link } = useParams<{ link: string }>()
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [identifiableFields, setIdentifiableFields] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [consentGiven, setConsentGiven] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-campaign', link],
    queryFn: () => campaignApi.getPublic(link!),
    enabled: !!link,
  })

  const submitMutation = useMutation({
    mutationFn: (campaignId: string) =>
      responseApi.submit(campaignId, {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
        identifiableFields: identifiableFields.name || identifiableFields.email || identifiableFields.phone
          ? identifiableFields
          : undefined,
        consentGiven,
      }),
    onSuccess: () => {
      setSubmitted(true)
      toast.success('Response submitted!')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to submit response')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Loading survey..." />
      </div>
    )
  }

  if (error || !data?.data?.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8">
            <EmptyState
              title="Survey not found"
              description="This survey doesn't exist or is no longer accepting responses."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  const campaign: Campaign = data.data.data

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h2>
            <p className="text-gray-600">Your response has been recorded successfully.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const updateAnswer = (questionId: string, value: unknown) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required questions
    const requiredQuestions = campaign.questions.filter(q => q.required)
    for (const q of requiredQuestions) {
      if (!answers[q.id] || (Array.isArray(answers[q.id]) && (answers[q.id] as unknown[]).length === 0)) {
        toast.error(`Please answer: ${q.questionText}`)
        return
      }
    }

    submitMutation.mutate(campaign.id)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{campaign.title}</h1>
                {campaign.description && (
                  <p className="text-gray-600 text-sm">{campaign.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Questions */}
          {campaign.questions.map((q, index) => (
            <Card key={q.id} className="mb-4">
              <CardContent className="p-6">
                <label className="block mb-3">
                  <span className="font-medium text-gray-900">
                    {index + 1}. {q.questionText}
                    {q.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </label>

                {/* Text input */}
                {q.type === 'TEXT' && (
                  <Input
                    value={answers[q.id] as string || ''}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    placeholder="Your answer..."
                  />
                )}

                {/* Paragraph */}
                {q.type === 'PARAGRAPH' && (
                  <Textarea
                    value={answers[q.id] as string || ''}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    rows={4}
                    placeholder="Your answer..."
                  />
                )}

                {/* Multiple choice */}
                {q.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-2">
                    {(q.options?.choices || []).map((choice, cIndex) => (
                      <label key={cIndex} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name={q.id}
                          value={choice}
                          checked={answers[q.id] === choice}
                          onChange={(e) => updateAnswer(q.id, e.target.value)}
                          className="text-primary-600"
                        />
                        <span>{choice}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkbox */}
                {q.type === 'CHECKBOX' && (
                  <div className="space-y-2">
                    {(q.options?.choices || []).map((choice, cIndex) => (
                      <label key={cIndex} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          value={choice}
                          checked={(answers[q.id] as string[] || []).includes(choice)}
                          onChange={(e) => {
                            const current = answers[q.id] as string[] || []
                            if (e.target.checked) {
                              updateAnswer(q.id, [...current, choice])
                            } else {
                              updateAnswer(q.id, current.filter(c => c !== choice))
                            }
                          }}
                          className="rounded text-primary-600"
                        />
                        <span>{choice}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Rating */}
                {q.type === 'RATING' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => updateAnswer(q.id, rating)}
                        className={`w-12 h-12 rounded-lg border-2 font-medium transition-colors
                          ${answers[q.id] === rating 
                            ? 'border-primary-600 bg-primary-600 text-white' 
                            : 'border-gray-200 hover:border-primary-300'}
                        `}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                )}

                {/* Number */}
                {q.type === 'NUMBER' && (
                  <Input
                    type="number"
                    value={answers[q.id] as string || ''}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    placeholder="Enter a number..."
                  />
                )}

                {/* Date */}
                {q.type === 'DATE' && (
                  <Input
                    type="date"
                    value={answers[q.id] as string || ''}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                  />
                )}
              </CardContent>
            </Card>
          ))}

          {/* Optional contact info */}
          <Card className="mb-4">
            <CardHeader>
              <h3 className="font-medium text-gray-900">Contact Information (Optional)</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Name"
                value={identifiableFields.name}
                onChange={(e) => setIdentifiableFields({ ...identifiableFields, name: e.target.value })}
                placeholder="Your name"
              />
              <Input
                label="Email"
                type="email"
                value={identifiableFields.email}
                onChange={(e) => setIdentifiableFields({ ...identifiableFields, email: e.target.value })}
                placeholder="your@email.com"
              />
              <Input
                label="Phone"
                type="tel"
                value={identifiableFields.phone}
                onChange={(e) => setIdentifiableFields({ ...identifiableFields, phone: e.target.value })}
                placeholder="Your phone number"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="rounded text-primary-600"
                />
                <span className="text-sm text-gray-600">
                  I consent to share my contact information
                </span>
              </label>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg" isLoading={submitMutation.isPending}>
            Submit Response
          </Button>
        </form>
      </div>
    </div>
  )
}
