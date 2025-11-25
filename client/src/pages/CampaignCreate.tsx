import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Plus, Trash2, GripVertical } from 'lucide-react'
import { campaignApi, questionApi } from '../services/api'
import { Card, CardContent, CardHeader, CardFooter } from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import Select from '../components/Select'

interface CampaignForm {
  title: string
  description: string
  visibility: string
}

interface Question {
  id?: string
  questionText: string
  type: string
  options?: { choices?: string[] }
  required: boolean
  order: number
}

const questionTypes = [
  { value: 'TEXT', label: 'Short Text' },
  { value: 'PARAGRAPH', label: 'Long Text' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'RATING', label: 'Rating' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' },
]

export default function CampaignCreate() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  
  const { register, handleSubmit, formState: { errors } } = useForm<CampaignForm>({
    defaultValues: {
      visibility: 'PRIVATE',
    },
  })

  // Step 1: Create campaign
  const onCreateCampaign = async (data: CampaignForm) => {
    setIsLoading(true)
    try {
      const response = await campaignApi.create({
        title: data.title,
        description: data.description,
        visibility: data.visibility,
      })
      setCampaignId(response.data.data.id)
      toast.success('Campaign created!')
      setStep(2)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to create campaign')
    } finally {
      setIsLoading(false)
    }
  }

  // Add new question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        type: 'TEXT',
        required: false,
        order: questions.length,
      },
    ])
  }

  // Update question
  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, ...updates } : q)))
  }

  // Remove question
  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  // Add choice to multiple choice/checkbox question
  const addChoice = (index: number) => {
    const q = questions[index]
    const choices = q.options?.choices || []
    updateQuestion(index, {
      options: { choices: [...choices, ''] },
    })
  }

  // Update choice
  const updateChoice = (qIndex: number, cIndex: number, value: string) => {
    const q = questions[qIndex]
    const choices = [...(q.options?.choices || [])]
    choices[cIndex] = value
    updateQuestion(qIndex, { options: { choices } })
  }

  // Remove choice
  const removeChoice = (qIndex: number, cIndex: number) => {
    const q = questions[qIndex]
    const choices = (q.options?.choices || []).filter((_, i) => i !== cIndex)
    updateQuestion(qIndex, { options: { choices } })
  }

  // Save questions
  const saveQuestions = async () => {
    if (!campaignId) return

    setIsLoading(true)
    try {
      for (const [index, q] of questions.entries()) {
        await questionApi.create(campaignId, {
          questionText: q.questionText,
          type: q.type,
          options: q.options,
          required: q.required,
          order: index,
        })
      }
      toast.success('Questions saved!')
      setStep(3)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to save questions')
    } finally {
      setIsLoading(false)
    }
  }

  // Publish campaign
  const publishCampaign = async () => {
    if (!campaignId) return

    setIsLoading(true)
    try {
      await campaignApi.publish(campaignId)
      toast.success('Campaign published!')
      navigate(`/campaigns/${campaignId}`)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to publish campaign')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button 
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to campaigns
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}
            `}>
              {s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-gray-900' : 'text-gray-500'}`}>
              {s === 1 && 'Basic Info'}
              {s === 2 && 'Questions'}
              {s === 3 && 'Review'}
            </span>
            {s < 3 && <div className="w-12 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium">Campaign Details</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreateCampaign)} className="space-y-4">
              <Input
                label="Campaign Title"
                error={errors.title?.message}
                {...register('title', { 
                  required: 'Title is required',
                  minLength: { value: 3, message: 'Title must be at least 3 characters' }
                })}
              />
              <Textarea
                label="Description"
                rows={4}
                error={errors.description?.message}
                {...register('description')}
              />
              <Select
                label="Visibility"
                options={[
                  { value: 'PRIVATE', label: 'Private - Only accessible via link' },
                  { value: 'PUBLIC', label: 'Public - Listed publicly' },
                ]}
                {...register('visibility')}
              />
              <div className="flex justify-end">
                <Button type="submit" isLoading={isLoading}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <Card key={index}>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="pt-2 cursor-grab">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Input
                          label={`Question ${index + 1}`}
                          value={q.questionText}
                          onChange={(e) => updateQuestion(index, { questionText: e.target.value })}
                          placeholder="Enter your question..."
                        />
                      </div>
                      <div className="w-48">
                        <Select
                          label="Type"
                          value={q.type}
                          onChange={(e) => updateQuestion(index, { type: e.target.value })}
                          options={questionTypes}
                        />
                      </div>
                    </div>

                    {/* Multiple choice / Checkbox options */}
                    {(q.type === 'MULTIPLE_CHOICE' || q.type === 'CHECKBOX') && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Options</label>
                        {(q.options?.choices || []).map((choice, cIndex) => (
                          <div key={cIndex} className="flex gap-2">
                            <Input
                              value={choice}
                              onChange={(e) => updateChoice(index, cIndex, e.target.value)}
                              placeholder={`Option ${cIndex + 1}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeChoice(index, cIndex)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addChoice(index)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Option
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Required
                      </label>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeQuestion(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button type="button" variant="secondary" onClick={addQuestion} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={saveQuestions} 
              isLoading={isLoading}
              disabled={questions.length === 0}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium">Review & Publish</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                Your campaign is ready! You have added {questions.length} question(s).
              </p>
            </div>
            <p className="text-gray-600">
              Publishing will make your campaign accessible via a shareable link. 
              You can still edit questions after publishing.
            </p>
          </CardContent>
          <CardFooter>
            <div className="flex justify-between w-full">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={() => navigate(`/campaigns/${campaignId}`)}
                >
                  Save as Draft
                </Button>
                <Button onClick={publishCampaign} isLoading={isLoading}>
                  Publish Campaign
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
