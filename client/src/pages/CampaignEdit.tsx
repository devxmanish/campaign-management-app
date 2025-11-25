import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react'
import { campaignApi, questionApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import Select from '../components/Select'
import Loading from '../components/Loading'

interface Question {
  id?: string
  questionText: string
  type: string
  options?: { choices?: string[] }
  required: boolean
  order: number
  isNew?: boolean
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

export default function CampaignEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('PRIVATE')
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignApi.get(id!),
    enabled: !!id,
    onSuccess: (data) => {
      const campaign = data.data.data
      setTitle(campaign.title)
      setDescription(campaign.description || '')
      setVisibility(campaign.visibility)
      setQuestions(campaign.questions.map((q: Question) => ({
        ...q,
        options: q.options || {},
      })))
    },
  } as { queryKey: string[]; queryFn: () => Promise<{ data: { data: { title: string; description: string; visibility: string; questions: Question[] } } }>; enabled: boolean; onSuccess: (data: { data: { data: { title: string; description: string; visibility: string; questions: Question[] } } }) => void })

  const updateCampaignMutation = useMutation({
    mutationFn: (data: { title: string; description: string; visibility: string }) =>
      campaignApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    },
  })

  // Add new question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        type: 'TEXT',
        required: false,
        order: questions.length,
        isNew: true,
      },
    ])
  }

  // Update question locally
  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, ...updates } : q)))
  }

  // Remove question
  const removeQuestion = async (index: number) => {
    const q = questions[index]
    if (q.id && !q.isNew) {
      try {
        await questionApi.delete(id!, q.id)
        toast.success('Question deleted')
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } }
        toast.error(err.response?.data?.error || 'Failed to delete question')
        return
      }
    }
    setQuestions(questions.filter((_, i) => i !== index))
  }

  // Add choice
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

  // Save all changes
  const saveChanges = async () => {
    setIsLoading(true)
    try {
      // Update campaign details
      await updateCampaignMutation.mutateAsync({ title, description, visibility })

      // Update/create questions
      for (const [index, q] of questions.entries()) {
        if (q.isNew) {
          await questionApi.create(id!, {
            questionText: q.questionText,
            type: q.type,
            options: q.options,
            required: q.required,
            order: index,
          })
        } else if (q.id) {
          await questionApi.update(id!, q.id, {
            questionText: q.questionText,
            type: q.type,
            options: q.options,
            required: q.required,
            order: index,
          })
        }
      }

      toast.success('Campaign saved!')
      navigate(`/campaigns/${id}`)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to save campaign')
    } finally {
      setIsLoading(false)
    }
  }

  if (campaignLoading) {
    return <Loading text="Loading campaign..." />
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate(`/campaigns/${id}`)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to campaign
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
        </div>
        <Button onClick={saveChanges} isLoading={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Campaign Details</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Campaign Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            label="Description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select
            label="Visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            options={[
              { value: 'PRIVATE', label: 'Private' },
              { value: 'PUBLIC', label: 'Public' },
            ]}
          />
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Questions</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id || index} className="border rounded-lg p-4 space-y-4">
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

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    Required
                  </label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeQuestion(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="secondary" onClick={addQuestion} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
